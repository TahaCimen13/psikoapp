import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography } from '@/lib/theme';
import AppointmentFormModal, { AppointmentFormData } from '@/components/AppointmentFormModal';
import { scheduleAppointmentReminder, cancelAppointmentReminder } from '@/lib/notifications';
import type { Appointment } from '@/lib/types';

type UpcomingAppointment = Appointment & { patient_name: string };

// Lokal güne göre YYYY-MM-DD anahtarı (UTC kaymasız)
function localDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function Schedule() {
  const { getUpcomingAppointments, getActiveRiskFlags, addAppointment, updateAppointment, deleteAppointment, patients } = useDatabase();
  const router = useRouter();
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([]);
  const [riskCount, setRiskCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const [appts, risks] = await Promise.all([getUpcomingAppointments(), getActiveRiskFlags()]);
    setAppointments(appts);
    setRiskCount(risks.length);
  }, [getUpcomingAppointments, getActiveRiskFlags]);

  // Sekmeye her dönüşte verileri yenile
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const saveAppointment = useCallback(async (data: AppointmentFormData) => {
    const appt = await addAppointment({
      patient_id: data.patient_id,
      date: data.date.toISOString(),
      duration: data.duration,
      notes: data.notes,
      status: 'scheduled',
    });
    const patientName = patients.find(p => p.id === data.patient_id)?.name ?? 'Danışan';
    await scheduleAppointmentReminder(appt, patientName);
    setAdding(false);
    await load();
  }, [addAppointment, patients, load]);

  const appointmentActions = useCallback((a: UpcomingAppointment) => {
    Alert.alert(a.patient_name, 'Randevu için bir işlem seçin', [
      {
        text: 'Tamamlandı', onPress: async () => {
          await updateAppointment(a.id, { status: 'completed' });
          await cancelAppointmentReminder(a.id);
          await load();
        },
      },
      {
        text: 'Gelmedi', onPress: async () => {
          await updateAppointment(a.id, { status: 'no_show' });
          await cancelAppointmentReminder(a.id);
          await load();
        },
      },
      {
        text: 'İptal Et / Sil', style: 'destructive', onPress: () => {
          Alert.alert('Randevu', undefined, [
            {
              text: 'İptal olarak işaretle', onPress: async () => {
                await updateAppointment(a.id, { status: 'cancelled' });
                await cancelAppointmentReminder(a.id);
                await load();
              },
            },
            {
              text: 'Kalıcı olarak sil', style: 'destructive', onPress: async () => {
                await deleteAppointment(a.id);
                await cancelAppointmentReminder(a.id);
                await load();
              },
            },
            { text: 'Vazgeç', style: 'cancel' },
          ]);
        },
      },
      { text: 'Vazgeç', style: 'cancel' },
    ]);
  }, [updateAppointment, deleteAppointment, load]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  const todayKey = localDateKey(new Date().toISOString());

  const grouped = appointments.reduce<Record<string, UpcomingAppointment[]>>((acc, a) => {
    const key = localDateKey(a.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Takvim</Text>
        <View style={styles.headerRight}>
          {riskCount > 0 && (
            <View style={styles.riskBadge}>
              <Text style={styles.riskText}>⚠ {riskCount} aktif risk</Text>
            </View>
          )}
          <TouchableOpacity style={styles.addBtn} onPress={() => setAdding(true)}>
            <Text style={styles.addBtnText}>+ Randevu</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {appointments.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📅</Text>
            <Text style={styles.emptyText}>Yaklaşan randevu yok</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setAdding(true)}>
              <Text style={styles.emptyBtnText}>İlk Randevuyu Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          Object.entries(grouped).map(([dateKey, appts]) => (
            <View key={dateKey}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateLabel}>
                  {dateKey === todayKey ? 'Bugün' : formatDate(appts[0].date)}
                </Text>
                {dateKey === todayKey && <View style={styles.todayDot} />}
              </View>
              {appts.map(a => (
                <TouchableOpacity
                  key={a.id}
                  style={styles.card}
                  onPress={() => router.push(`/patient/${a.patient_id}`)}
                  onLongPress={() => appointmentActions(a)}
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
                  <TouchableOpacity onPress={() => appointmentActions(a)} style={styles.moreBtn}>
                    <Text style={styles.moreText}>⋯</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <AppointmentFormModal
        visible={adding}
        patients={patients}
        onClose={() => setAdding(false)}
        onSave={saveAppointment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, paddingTop: spacing.xl + spacing.md },
  title: { ...typography.h2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  riskBadge: { backgroundColor: '#fef2f2', borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: '#fecaca' },
  riskText: { color: colors.error, fontSize: 12, fontWeight: '600' },
  addBtn: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  content: { padding: spacing.md, paddingBottom: 32 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: colors.textSecondary, fontSize: 15, marginBottom: spacing.md },
  emptyBtn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
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
  moreBtn: { padding: spacing.xs },
  moreText: { color: colors.textMuted, fontSize: 18, fontWeight: '700' },
});
