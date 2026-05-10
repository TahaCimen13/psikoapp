import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography } from '@/lib/theme';
import type { Session, Patient } from '@/lib/types';

interface TodaySession extends Session {
  patient_name: string;
}

export default function Dashboard() {
  const { getTodaySessions, patients, getStats, settings } = useDatabase();
  const router = useRouter();
  const [todaySessions, setTodaySessions] = useState<TodaySession[]>([]);
  const [stats, setStats] = useState({ totalPatients: 0, monthSessions: 0, activeDiagnoses: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [sessions, s] = await Promise.all([getTodaySessions(), getStats()]);
    setTodaySessions(sessions);
    setStats(s);
  }, [getTodaySessions, getStats]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Günaydın';
    if (h < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.name}>{settings.psychologist_name || 'Uzman'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
          <Text style={{ fontSize: 22 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Toplam Hasta" value={stats.totalPatients} emoji="👥" />
        <StatCard label="Bu Ay Seans" value={stats.monthSessions} emoji="📅" />
        <StatCard label="Aktif Tanı" value={stats.activeDiagnoses} emoji="📋" />
      </View>

      <SectionHeader title="Bugünün Seansları" />
      {todaySessions.length === 0 ? (
        <EmptyCard message="Bugün için planlanmış seans yok" />
      ) : (
        todaySessions.map(session => (
          <TouchableOpacity
            key={session.id}
            style={styles.sessionCard}
            onPress={() => router.push(`/patient/${session.patient_id}/session/${session.id}`)}
          >
            <View style={styles.timeTag}>
              <Text style={styles.timeText}>{formatTime(session.date)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patientName}>{session.patient_name}</Text>
              <Text style={styles.sessionMeta}>Seans #{session.session_number || '-'} · {session.duration || '?'} dk</Text>
            </View>
            <StatusBadge status={session.status} />
          </TouchableOpacity>
        ))
      )}

      <SectionHeader title="Son Hastalar" />
      {patients.length === 0 ? (
        <EmptyCard message="Henüz hasta eklenmemiş" />
      ) : (
        patients.slice(0, 4).map(patient => (
          <TouchableOpacity
            key={patient.id}
            style={styles.patientCard}
            onPress={() => router.push(`/patient/${patient.id}`)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{patient.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patientName}>{patient.name}</Text>
              {patient.background ? (
                <Text style={styles.sessionMeta} numberOfLines={1}>{patient.background}</Text>
              ) : null}
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/patient/new')}>
        <Text style={styles.addBtnText}>+ Yeni Hasta Ekle</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatCard({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function EmptyCard({ message }: { message: string }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
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
    <View style={[styles.badge, { backgroundColor: s.color + '22' }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg, paddingTop: spacing.lg },
  greeting: { ...typography.small, color: colors.textSecondary },
  name: { ...typography.h2, marginTop: 2 },
  settingsBtn: { padding: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.cardBorder },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.text },
  statLabel: { ...typography.small, textAlign: 'center', fontSize: 11 },
  sectionHeader: { ...typography.label, marginBottom: spacing.sm, marginTop: spacing.md },
  sessionCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  timeTag: { backgroundColor: colors.accentDim, borderRadius: radius.sm, padding: spacing.xs, minWidth: 52, alignItems: 'center' },
  timeText: { color: colors.accentLight, fontSize: 12, fontWeight: '600' },
  patientName: { ...typography.body, fontWeight: '600' },
  sessionMeta: { ...typography.small, marginTop: 2 },
  badge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  patientCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentDim, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.accentLight, fontSize: 18, fontWeight: '700' },
  arrow: { color: colors.textMuted, fontSize: 20 },
  emptyCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  addBtn: { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.md },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
