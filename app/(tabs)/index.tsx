import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography, safeTop } from '@/lib/theme';
import { RISK_LEVELS, RISK_CATEGORIES, RISK_LEVEL_ORDER } from '@/components/RiskBadge';
import { Icon } from '@/components/ui/Icon';
import type { Session, Appointment, RiskFlag } from '@/lib/types';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Icon>['name'];
type UpcomingAppointment = Appointment & { patient_name: string };

interface TodaySession extends Session {
  patient_name: string;
}

export default function Dashboard() {
  const { getTodaySessions, getUpcomingAppointments, patients, getStats, settings, getActiveRiskFlags } = useDatabase();
  const router = useRouter();
  const [todaySessions, setTodaySessions] = useState<TodaySession[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingAppointment[]>([]);
  const [activeRisks, setActiveRisks] = useState<(RiskFlag & { patient_name: string })[]>([]);
  const [stats, setStats] = useState({ totalPatients: 0, monthSessions: 0, activeDiagnoses: 0, activeRisks: 0, upcomingAppointments: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [sessions, appts, s, risks] = await Promise.all([getTodaySessions(), getUpcomingAppointments(), getStats(), getActiveRiskFlags()]);
    setTodaySessions(sessions);
    setUpcoming(appts);
    setStats(s);
    setActiveRisks([...risks].sort((a, b) => RISK_LEVEL_ORDER[b.level] - RISK_LEVEL_ORDER[a.level]));
  }, [getTodaySessions, getUpcomingAppointments, getStats, getActiveRiskFlags]);

  // Sekmeye her dönüşte verileri yenile
  useFocusEffect(useCallback(() => { load(); }, [load]));

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
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.name}>
            {settings.psychologist_name
              ? settings.psychologist_name.split(' ')[0]
              : 'Hoş geldiniz'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
          <Icon name="settings-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Danışan" value={stats.totalPatients} iconName="people-outline" onPress={() => router.push('/(tabs)/patients')} />
        <StatCard label="Randevu" value={stats.upcomingAppointments} iconName="calendar-outline" onPress={() => router.push('/(tabs)/schedule')} />
        {stats.activeRisks > 0 && <StatCard label="Risk" value={stats.activeRisks} iconName="warning-outline" alert />}
      </View>

      {activeRisks.length > 0 && (
        <>
          <SectionHeader title="Aktif Riskler" />
          {activeRisks.slice(0, 4).map(risk => (
            <TouchableOpacity
              key={risk.id}
              style={[styles.riskCard, { borderColor: RISK_LEVELS[risk.level].color + '80' }]}
              onPress={() => router.push(`/patient/${risk.patient_id}/risk`)}
            >
              <View style={[styles.riskDot, { backgroundColor: RISK_LEVELS[risk.level].color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>{risk.patient_name}</Text>
                <Text style={styles.sessionMeta}>{RISK_CATEGORIES[risk.category]}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: RISK_LEVELS[risk.level].color + '22' }]}>
                <Text style={[styles.badgeText, { color: RISK_LEVELS[risk.level].color }]}>{RISK_LEVELS[risk.level].label}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {activeRisks.length > 4 && (
            <Text style={styles.moreRiskText}>+ {activeRisks.length - 4} risk daha</Text>
          )}
        </>
      )}

      <SectionHeader title="Yaklaşan Randevular" onPress={() => router.push('/(tabs)/schedule')} />
      {upcoming.length === 0 ? (
        <EmptyCard
          message="Yaklaşan randevu yok"
          ctaLabel="Randevu Ekle →"
          onCtaPress={() => router.push('/(tabs)/schedule')}
        />
      ) : (
        <>
          {upcoming.slice(0, 3).map(a => (
            <TouchableOpacity key={a.id} style={styles.sessionCard} onPress={() => router.push('/(tabs)/schedule')}>
              <View style={styles.timeTag}>
                <Text style={styles.timeText}>
                  {new Date(a.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                </Text>
                <Text style={styles.timeText}>{formatTime(a.date)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.patientName}>{a.patient_name}</Text>
                  {a.recurrence_id ? <Text style={{ fontSize: 11 }}>🔁</Text> : null}
                </View>
                <Text style={styles.sessionMeta}>{a.duration} dk{a.notes ? ` · ${a.notes}` : ''}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {upcoming.length > 3 && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/schedule')}>
              <Text style={styles.moreRiskText}>+ {upcoming.length - 3} randevu daha →</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {todaySessions.length > 0 && (
        <>
          <SectionHeader title="Bugünün Seansları" />
          {todaySessions.map(session => (
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
          ))}
        </>
      )}

      <SectionHeader title="Danışanlarım" onPress={() => router.push('/(tabs)/patients')} />
      {patients.length === 0 ? (
        <EmptyCard
          message="Henüz danışan eklenmemiş"
          ctaLabel="İlk Danışanı Ekle →"
          onCtaPress={() => router.push('/patient/new')}
        />
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
        <Text style={styles.addBtnText}>+ Yeni Danışan</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatCard({ label, value, iconName, alert, onPress }: { label: string; value: number; iconName: IconName; alert?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.statCard, alert && { borderColor: colors.error + '60' }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <Icon name={iconName} size={18} color={alert ? colors.error : colors.accent} />
      <Text style={[styles.statValue, alert && { color: colors.error }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// onPress verilirse başlık ilgili sekmeye götürür (sağda › ipucu gösterilir)
function SectionHeader({ title, onPress }: { title: string; onPress?: () => void }) {
  if (!onPress) return <Text style={styles.sectionHeader}>{title}</Text>;
  return (
    <TouchableOpacity style={styles.sectionHeaderRow} onPress={onPress}>
      <Text style={styles.sectionHeader}>{title}</Text>
      <Icon name="chevron-forward" size={14} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function EmptyCard({ message, ctaLabel, onCtaPress }: { message: string; ctaLabel?: string; onCtaPress?: () => void }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyText}>{message}</Text>
      {ctaLabel && onCtaPress && (
        <TouchableOpacity style={styles.emptyAction} onPress={onCtaPress}>
          <Text style={styles.emptyActionText}>{ctaLabel}</Text>
        </TouchableOpacity>
      )}
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
  content: { padding: spacing.md, paddingTop: safeTop + spacing.sm, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  greeting: { ...typography.small, color: colors.textSecondary },
  name: { ...typography.h2, marginTop: 2 },
  settingsBtn: { padding: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.cardBorder },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.text },
  statLabel: { ...typography.small, textAlign: 'center', fontSize: 11 },
  sectionHeader: { ...typography.label, marginBottom: spacing.sm, marginTop: spacing.md },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  emptyAction: { marginTop: 12 },
  emptyActionText: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  riskCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, borderWidth: 1 },
  riskDot: { width: 10, height: 10, borderRadius: 5 },
  moreRiskText: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: spacing.sm },
  addBtn: { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.md },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
