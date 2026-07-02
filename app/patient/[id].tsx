import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography } from '@/lib/theme';
import { RISK_LEVELS, RISK_CATEGORIES, highestRiskFlag } from '@/components/RiskBadge';
import type { Patient, Session, Diagnosis, Homework, RiskFlag } from '@/lib/types';

export default function PatientProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getPatient, getSessionsByPatient, getDiagnosesByPatient, getHomeworkByPatient, getRiskFlagsByPatient, deletePatient } = useDatabase();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>([]);
  const [pendingHw, setPendingHw] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [p, s, d, hw, rf] = await Promise.all([
      getPatient(id),
      getSessionsByPatient(id),
      getDiagnosesByPatient(id),
      getHomeworkByPatient(id),
      getRiskFlagsByPatient(id),
    ]);
    setPatient(p);
    setSessions(s);
    setDiagnoses(d);
    setRiskFlags(rf);
    setPendingHw(hw.filter((h: Homework) => h.status === 'pending').length);
  }, [id, getPatient, getSessionsByPatient, getDiagnosesByPatient, getHomeworkByPatient, getRiskFlagsByPatient]);

  // Ekrana her dönüşte verileri yenile (alt ekranlardan dönüşler dahil)
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const confirmDelete = () => {
    Alert.alert('Hastayı Sil', 'Bu hasta ve tüm verileri kalıcı olarak silinecek.', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await deletePatient(id); router.back(); } },
    ]);
  };

  const ageStr = (birthDate?: string) => {
    if (!birthDate) return null;
    return `${new Date().getFullYear() - new Date(birthDate).getFullYear()} yaş`;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' });

  if (!patient) return (
    <View style={styles.container}>
      <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 60 }}>Yükleniyor...</Text>
    </View>
  );

  const primaryDiag = diagnoses.find(d => d.is_primary) || diagnoses[0];
  const recentSessions = sessions.slice(0, 3);
  const activeRiskCount = riskFlags.filter(f => !f.resolved).length;
  const topRisk = highestRiskFlag(riskFlags);

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
        {/* Aktif risk uyarı bandı */}
        {topRisk && (
          <TouchableOpacity
            style={[styles.riskBand, { backgroundColor: RISK_LEVELS[topRisk.level].color }]}
            onPress={() => router.push(`/patient/${id}/risk`)}
          >
            <Text style={styles.riskBandText}>
              ⚠️ Aktif Risk: {RISK_LEVELS[topRisk.level].label} — {RISK_CATEGORIES[topRisk.category]}
            </Text>
            <Text style={styles.riskBandArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Profil */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{patient.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.patientName}>{patient.name}</Text>
          <View style={styles.metaRow}>
            {ageStr(patient.birth_date) && <MetaTag label={ageStr(patient.birth_date)!} />}
            {patient.gender && <MetaTag label={{ erkek: 'Erkek', kadin: 'Kadın', diger: 'Diğer' }[patient.gender] ?? patient.gender} />}
            <MetaTag label={`${sessions.length} seans`} />
          </View>
          {primaryDiag && (
            <Text style={styles.diagLabel}>{primaryDiag.dsm_name || primaryDiag.dsm_code}</Text>
          )}
          {patient.background ? <Text style={styles.background}>{patient.background}</Text> : null}
        </View>

        {/* Hızlı Aksiyonlar */}
        <View style={styles.actionsGrid}>
          <ActionCard emoji="📋" title="Tanılar" subtitle={`${diagnoses.length} tanı`} onPress={() => router.push(`/patient/${id}/diagnoses`)} />
          <ActionCard emoji="📊" title="Değerlendirme" subtitle="Test sonuçları" onPress={() => router.push(`/patient/${id}/assessments`)} />
          <ActionCard emoji="📝" title="Ödevler" subtitle={pendingHw > 0 ? `${pendingHw} bekliyor` : 'Ödev yok'} badge={pendingHw > 0} onPress={() => router.push(`/patient/${id}/homework`)} />
          <ActionCard emoji="🎯" title="Tedavi Planı" subtitle="Hedef & teknikler" onPress={() => router.push(`/patient/${id}/treatment`)} />
          <ActionCard emoji="⚠️" title="Risk Takibi" subtitle={activeRiskCount > 0 ? `${activeRiskCount} aktif risk` : 'Aktif risk yok'} badge={activeRiskCount > 0} onPress={() => router.push(`/patient/${id}/risk`)} />
          <ActionCard emoji="📈" title="İlerleme" subtitle="Skor & grafik" onPress={() => router.push(`/patient/${id}/progress`)} />
        </View>

        {/* Seanslar */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Seanslar</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push(`/patient/${id}/session/new`)}>
              <Text style={styles.addBtnText}>+ Yeni</Text>
            </TouchableOpacity>
          </View>

          {recentSessions.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Henüz seans kaydı yok</Text>
            </View>
          ) : (
            <>
              {recentSessions.map(s => (
                <TouchableOpacity key={s.id} style={styles.sessionCard} onPress={() => router.push(`/patient/${id}/session/${s.id}`)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionDate}>{formatDate(s.date)}</Text>
                    <Text style={styles.sessionMeta}>
                      Seans #{s.session_number || '-'} · {s.duration || '?'} dk
                      {s.approach ? ` · ${s.approach}` : ''}
                    </Text>
                    {s.summary ? <Text style={styles.sessionSummary} numberOfLines={2}>{s.summary}</Text> : null}
                  </View>
                  <StatusBadge status={s.status} />
                </TouchableOpacity>
              ))}
              {sessions.length > 3 && (
                <Text style={styles.moreText}>+ {sessions.length - 3} seans daha</Text>
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

function ActionCard({ emoji, title, subtitle, onPress, badge }: { emoji: string; title: string; subtitle: string; onPress: () => void; badge?: boolean }) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={[styles.actionSubtitle, badge && { color: colors.warning }]}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    completed: { label: 'Tamamlandı', color: colors.success },
    planned: { label: 'Planlandı', color: colors.accent },
    cancelled: { label: 'İptal', color: colors.error },
  };
  const s = map[status] || { label: status, color: colors.textMuted };
  return (
    <View style={[styles.badge, { backgroundColor: s.color + '20' }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, paddingTop: spacing.xl + spacing.md },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  deleteBtn: { fontSize: 20 },
  profileCard: { marginHorizontal: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.md },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.accentDim, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  avatarText: { color: colors.accentLight, fontSize: 32, fontWeight: '700' },
  patientName: { ...typography.h2, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center', marginBottom: spacing.sm },
  metaTag: { backgroundColor: colors.accentDim, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  metaTagText: { color: colors.accentLight, fontSize: 12, fontWeight: '500' },
  diagLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: 4 },
  background: { color: colors.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 20, marginTop: 4 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.md },
  actionCard: { flex: 1, minWidth: '45%', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'flex-start', gap: 2 },
  actionEmoji: { fontSize: 24, marginBottom: 4 },
  actionTitle: { ...typography.body, fontWeight: '600' },
  actionSubtitle: { color: colors.textMuted, fontSize: 12 },
  section: { paddingHorizontal: spacing.md, paddingBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { ...typography.label },
  addBtn: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 5 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  sessionCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  sessionDate: { ...typography.body, fontWeight: '600' },
  sessionMeta: { ...typography.small, marginTop: 2 },
  sessionSummary: { ...typography.small, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  badge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  empty: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  moreText: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 4 },
  riskBand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: spacing.md, marginBottom: spacing.md, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  riskBandText: { color: '#fff', fontWeight: '700', fontSize: 13, flex: 1 },
  riskBandArrow: { color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: spacing.sm },
});
