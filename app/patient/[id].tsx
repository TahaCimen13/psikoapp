import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography } from '@/lib/theme';
import { DSMChapter } from '@/lib/dsm5';
import type { Patient, Session, Diagnosis, Assessment } from '@/lib/types';

type Tab = 'seanslar' | 'tanilar' | 'testler';

export default function PatientProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getPatient, getSessionsByPatient, getDiagnosesByPatient, getAssessmentsByPatient, deletePatient, deleteDiagnosis, deleteAssessment } = useDatabase();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('seanslar');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [p, s, d, a] = await Promise.all([
      getPatient(id),
      getSessionsByPatient(id),
      getDiagnosesByPatient(id),
      getAssessmentsByPatient(id),
    ]);
    setPatient(p);
    setSessions(s);
    setDiagnoses(d);
    setAssessments(a);
  }, [id, getPatient, getSessionsByPatient, getDiagnosesByPatient, getAssessmentsByPatient]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const confirmDelete = () => {
    Alert.alert('Hastayı Sil', 'Bu hasta ve tüm verileri silinecek. Emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await deletePatient(id); router.back(); } },
    ]);
  };

  const ageStr = (birthDate?: string) => {
    if (!birthDate) return null;
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    return `${age} yaş`;
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

  if (!patient) return <View style={styles.container}><Text style={styles.loading}>Yükleniyor...</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Geri</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmDelete}>
          <Text style={styles.deleteBtn}>🗑</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{patient.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.patientName}>{patient.name}</Text>
          <View style={styles.metaRow}>
            {ageStr(patient.birth_date) && <MetaTag label={ageStr(patient.birth_date)!} />}
            {patient.gender && <MetaTag label={genderLabel(patient.gender)} />}
            <MetaTag label={`${sessions.length} seans`} />
          </View>
          {patient.background && (
            <Text style={styles.background}>{patient.background}</Text>
          )}
        </View>

        <View style={styles.tabBar}>
          {(['seanslar', 'tanilar', 'testler'] as Tab[]).map(tab => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tabLabel(tab)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'seanslar' && (
            <>
              <TouchableOpacity style={styles.addSessionBtn} onPress={() => router.push(`/patient/${id}/session/new`)}>
                <Text style={styles.addSessionBtnText}>+ Yeni Seans</Text>
              </TouchableOpacity>
              {sessions.length === 0 ? (
                <EmptyState message="Henüz seans kaydı yok" />
              ) : (
                sessions.map(s => (
                  <TouchableOpacity key={s.id} style={styles.sessionCard} onPress={() => router.push(`/patient/${id}/session/${s.id}`)}>
                    <View>
                      <Text style={styles.sessionDate}>{formatDate(s.date)}</Text>
                      <Text style={styles.sessionMeta}>Seans #{s.session_number || '-'} · {s.duration || '?'} dk</Text>
                      {s.summary && <Text style={styles.sessionSummary} numberOfLines={2}>{s.summary}</Text>}
                    </View>
                    <StatusBadge status={s.status} />
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {activeTab === 'tanilar' && (
            <>
              <TouchableOpacity style={styles.addSessionBtn} onPress={() => router.push('/diagnose')}>
                <Text style={styles.addSessionBtnText}>📋 Tanı Rehberi'nden Seç</Text>
              </TouchableOpacity>
              {diagnoses.length === 0 ? (
                <EmptyState message="Henüz tanı eklenmemiş" />
              ) : (
                diagnoses.map(d => (
                  <View key={d.id} style={styles.diagCard}>
                    <View style={{ flex: 1 }}>
                      {d.dsm_code && <View style={styles.codeTag}><Text style={styles.codeText}>{d.dsm_code}</Text></View>}
                      <Text style={styles.diagName}>{d.dsm_name || 'Belirtilmemiş'}</Text>
                      {d.severity && <Text style={styles.diagSeverity}>{severityLabel(d.severity)}</Text>}
                      {d.is_primary && <Text style={styles.primaryBadge}>Birincil Tanı</Text>}
                    </View>
                    <TouchableOpacity onPress={() => Alert.alert('Tanıyı Sil', 'Bu tanı silinecek.', [{ text: 'İptal', style: 'cancel' }, { text: 'Sil', style: 'destructive', onPress: async () => { await deleteDiagnosis(d.id); load(); } }])}>
                      <Text style={styles.deleteIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </>
          )}

          {activeTab === 'testler' && (
            <>
              {assessments.length === 0 ? (
                <EmptyState message="Henüz test sonucu eklenmemiş" />
              ) : (
                assessments.map(a => (
                  <View key={a.id} style={styles.assessCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.testName}>{a.test_name}</Text>
                      {a.score !== undefined && a.score !== null && <Text style={styles.testScore}>Puan: {a.score}</Text>}
                      {a.interpretation && <Text style={styles.testInterp}>{a.interpretation}</Text>}
                      {a.date && <Text style={styles.testDate}>{formatDate(a.date)}</Text>}
                    </View>
                    <TouchableOpacity onPress={() => Alert.alert('Testi Sil', 'Bu test sonucu silinecek.', [{ text: 'İptal', style: 'cancel' }, { text: 'Sil', style: 'destructive', onPress: async () => { await deleteAssessment(a.id); load(); } }])}>
                      <Text style={styles.deleteIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function MetaTag({ label }: { label: string }) {
  return <View style={styles.metaTag}><Text style={styles.metaTagText}>{label}</Text></View>;
}

function EmptyState({ message }: { message: string }) {
  return <View style={styles.empty}><Text style={styles.emptyText}>{message}</Text></View>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    completed: { label: 'Tamamlandı', color: colors.success },
    planned: { label: 'Planlandı', color: colors.accent },
    cancelled: { label: 'İptal', color: colors.error },
  };
  const s = map[status] || { label: status, color: colors.textMuted };
  return <View style={[styles.badge, { backgroundColor: s.color + '22' }]}><Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text></View>;
}

function genderLabel(g: string) {
  return { erkek: 'Erkek', kadin: 'Kadın', diger: 'Diğer' }[g] ?? g;
}

function severityLabel(s: string) {
  return { hafif: 'Hafif', orta: 'Orta', siddetli: 'Şiddetli' }[s] ?? s;
}

function tabLabel(tab: Tab) {
  return { seanslar: 'Seanslar', tanilar: 'Tanılar', testler: 'Testler' }[tab];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { color: colors.textSecondary, textAlign: 'center', marginTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, paddingTop: spacing.xl + spacing.md },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  deleteBtn: { fontSize: 20 },
  profileCard: { margin: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.accentDim, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  avatarText: { color: colors.accentLight, fontSize: 32, fontWeight: '700' },
  patientName: { ...typography.h2, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center', marginBottom: spacing.sm },
  metaTag: { backgroundColor: colors.accentDim, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  metaTagText: { color: colors.accentLight, fontSize: 12, fontWeight: '500' },
  background: { color: colors.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  tabBar: { flexDirection: 'row', marginHorizontal: spacing.md, backgroundColor: colors.card, borderRadius: radius.md, padding: 4, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.sm },
  tab: { flex: 1, borderRadius: radius.sm, paddingVertical: spacing.xs + 2, alignItems: 'center' },
  tabActive: { backgroundColor: colors.accent },
  tabText: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  tabContent: { paddingHorizontal: spacing.md, paddingBottom: 32 },
  addSessionBtn: { borderWidth: 1, borderColor: colors.accent, borderStyle: 'dashed', borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', marginBottom: spacing.sm },
  addSessionBtnText: { color: colors.accent, fontWeight: '600' },
  sessionCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  sessionDate: { ...typography.body, fontWeight: '600' },
  sessionMeta: { ...typography.small, marginTop: 2 },
  sessionSummary: { ...typography.small, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  badge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  diagCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  codeTag: { backgroundColor: colors.accentDim, alignSelf: 'flex-start', borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 4 },
  codeText: { color: colors.accentLight, fontSize: 11, fontWeight: '700' },
  diagName: { ...typography.body, fontWeight: '600' },
  diagSeverity: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  primaryBadge: { color: colors.warning, fontSize: 11, fontWeight: '600', marginTop: 4 },
  deleteIcon: { color: colors.error, fontSize: 16, padding: spacing.xs },
  assessCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  testName: { ...typography.body, fontWeight: '600' },
  testScore: { ...typography.body, color: colors.accent, fontWeight: '700', marginTop: 2 },
  testInterp: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  testDate: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  empty: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
