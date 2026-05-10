import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography } from '@/lib/theme';
import type { Appointment } from '@/lib/types';

type UpcomingAppointment = Appointment & { patient_name: string };

export default function Schedule() {
  const { getUpcomingAppointments, getActiveRiskFlags, updateAppointment } = useDatabase();
  const router = useRouter();
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([]);
  const [riskCount, setRiskCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [appts, risks] = await Promise.all([getUpcomingAppointments(), getActiveRiskFlags()]);
    setAppointments(appts);
    setRiskCount(risks.length);
  }, [getUpcomingAppointments, getActiveRiskFlags]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };

  const cancelAppointment = async (id: string) => {
    await updateAppointment(id, { status: 'cancelled' });
    await load();
  };

  const grouped = appointments.reduce<Record<string, UpcomingAppointment[]>>((acc, a) => {
    const key = new Date(a.date).toISOString().split('T')[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Takvim</Text>
        {riskCount > 0 && (
          <View style={styles.riskBadge}>
            <Text style={styles.riskText}>⚠ {riskCount} aktif risk</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {appointments.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📅</Text>
            <Text style={styles.emptyText}>Yaklaşan randevu yok</Text>
            <Text style={styles.emptyHint}>Hasta profilinden randevu ekleyebilirsiniz</Text>
          </View>
        ) : (
          Object.entries(grouped).map(([date, appts]) => (
            <View key={date}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateLabel}>
                  {isToday(date + 'T00:00:00') ? 'Bugün' : formatDate(date + 'T00:00:00')}
                </Text>
                {isToday(date + 'T00:00:00') && <View style={styles.todayDot} />}
              </View>
              {appts.map(a => (
                <TouchableOpacity
                  key={a.id}
                  style={styles.card}
                  onPress={() => router.push(`/patient/${a.patient_id}`)}
                >
                  <View style={styles.timeCol}>
                    <Text style={styles.time}>{formatTime(a.date)}</Text>
                    <Text style={styles.duration}>{a.duration} dk</Text>
                  </View>
                  <View style={styles.dividerLine} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>{a.patient_name}</Text>
                    {a.notes ? <Text style={styles.notes} numberOfLines={1}>{a.notes}</Text> : null}
                  </View>
                  <TouchableOpacity onPress={() => cancelAppointment(a.id)} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, paddingTop: spacing.xl + spacing.md },
  title: { ...typography.h2 },
  riskBadge: { backgroundColor: '#fef2f2', borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: '#fecaca' },
  riskText: { color: colors.error, fontSize: 12, fontWeight: '600' },
  content: { padding: spacing.md, paddingBottom: 32 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: colors.textSecondary, fontSize: 15, marginBottom: spacing.xs },
  emptyHint: { color: colors.textMuted, fontSize: 13 },
  dateHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.sm },
  dateLabel: { ...typography.label },
  todayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  timeCol: { alignItems: 'center', minWidth: 52 },
  time: { fontSize: 14, fontWeight: '700', color: colors.accent },
  duration: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  dividerLine: { width: 1, height: 36, backgroundColor: colors.cardBorder },
  patientName: { ...typography.body, fontWeight: '600' },
  notes: { ...typography.small, marginTop: 2 },
  cancelBtn: { padding: spacing.xs },
  cancelText: { color: colors.textMuted, fontSize: 16 },
});
