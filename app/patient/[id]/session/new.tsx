import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography } from '@/lib/theme';
import { SESSION_APPROACHES } from '@/lib/types';
import type { Session } from '@/lib/types';

const DURATIONS = [30, 45, 50, 60, 90];
const MOODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function NewSession() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addSession, getSessionsByPatient } = useDatabase();
  const [date, setDate] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState(50);
  const [approach, setApproach] = useState<Session['approach'] | undefined>(undefined);
  const [mood, setMood] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<'completed' | 'planned'>('completed');
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && selected) {
      setDate(prev => {
        const next = new Date(prev);
        next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        return next;
      });
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'set' && selected) {
      setDate(prev => {
        const next = new Date(prev);
        next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        return next;
      });
    }
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    const sessions = await getSessionsByPatient(id);
    // Silinen seanslarda numara çakışmasın diye en büyük numaradan devam et
    const sessionNumber = sessions.reduce((max, s) => Math.max(max, s.session_number ?? 0), 0) + 1;
    await addSession({
      patient_id: id,
      date: date.toISOString(),
      duration,
      session_number: sessionNumber,
      approach,
      mood_rating: mood,
      status,
      summary: summary.trim() || undefined,
    });
    setSaving(false);
    router.back();
  };

  const dateLabel = date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  const timeLabel = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>İptal</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Yeni Seans</Text>
        <TouchableOpacity onPress={save} disabled={saving}>
          <Text style={[styles.saveBtn, saving && { opacity: 0.5 }]}>Kaydet</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Field label="Tarih *">
            <TouchableOpacity
              style={[styles.input, showDatePicker && styles.inputActive]}
              onPress={() => { setShowDatePicker(v => !v); setShowTimePicker(false); }}
            >
              <Text style={styles.inputText}>{dateLabel}</Text>
            </TouchableOpacity>
          </Field>
        </View>
        <View style={{ width: 100 }}>
          <Field label="Saat">
            <TouchableOpacity
              style={[styles.input, showTimePicker && styles.inputActive]}
              onPress={() => { setShowTimePicker(v => !v); setShowDatePicker(false); }}
            >
              <Text style={styles.inputText}>{timeLabel}</Text>
            </TouchableOpacity>
          </Field>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker value={date} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={onDateChange} locale="tr-TR" themeVariant="light" />
      )}
      {showTimePicker && (
        <DateTimePicker value={date} mode="time" is24Hour display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onTimeChange} locale="tr-TR" themeVariant="light" />
      )}

      <Field label="Durum">
        <View style={styles.chipRow}>
          <Chip label="Tamamlandı" active={status === 'completed'} onPress={() => setStatus('completed')} />
          <Chip label="Planlandı" active={status === 'planned'} onPress={() => setStatus('planned')} />
        </View>
      </Field>

      <Field label="Süre (dakika)">
        <View style={styles.chipRow}>
          {DURATIONS.map(d => (
            <Chip key={d} label={`${d}`} active={duration === d} onPress={() => setDuration(d)} />
          ))}
        </View>
      </Field>

      <Field label="Terapi Yaklaşımı">
        <View style={styles.chipRow}>
          {SESSION_APPROACHES.map(a => (
            <Chip key={a} label={a === 'Diger' ? 'Diğer' : a} active={approach === a} onPress={() => setApproach(approach === a ? undefined : a)} />
          ))}
        </View>
      </Field>

      <Field label="Danışanın Duygu Durumu (1-10)">
        <View style={styles.chipRow}>
          {MOODS.map(m => (
            <Chip key={m} label={`${m}`} active={mood === m} onPress={() => setMood(mood === m ? undefined : m)} small />
          ))}
        </View>
      </Field>

      <Field label="Seans Özeti">
        <TextInput
          style={[styles.input, styles.textArea]}
          value={summary}
          onChangeText={setSummary}
          placeholder="Bu seansın kısa özeti..."
          placeholderTextColor={colors.placeholder}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Field>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Chip({ label, active, onPress, small }: { label: string; active: boolean; onPress: () => void; small?: boolean }) {
  return (
    <TouchableOpacity style={[styles.chip, small && styles.chipSmall, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg, paddingTop: spacing.sm },
  cancel: { color: colors.textSecondary, fontSize: 15 },
  title: { ...typography.h3 },
  saveBtn: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  row: { flexDirection: 'row', gap: spacing.sm },
  field: { marginBottom: spacing.md },
  fieldLabel: { ...typography.small, color: colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: colors.inputBg, borderRadius: radius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  inputActive: { borderColor: colors.accent },
  inputText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  textArea: { minHeight: 100, paddingTop: spacing.sm, color: colors.text, fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  chipSmall: { paddingHorizontal: spacing.sm, paddingVertical: 5, minWidth: 34, alignItems: 'center' },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 13, color: colors.text },
  chipTextActive: { color: '#fff', fontWeight: '600' },
});
