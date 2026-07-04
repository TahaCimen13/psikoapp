import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useEffect, useState } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, spacing, radius, typography } from '@/lib/theme';
import type { Patient } from '@/lib/types';

export type RecurrenceType = 'yok' | 'haftalik' | 'iki_haftalik';

export interface AppointmentFormData {
  patient_id: string;
  date: Date;
  duration: number;
  notes?: string;
  recurrence: RecurrenceType;
  occurrences: number;   // seri uzunluğu (ilk randevu dahil); recurrence 'yok' ise 1
}

interface Props {
  visible: boolean;
  patients: Patient[];
  onClose: () => void;
  onSave: (data: AppointmentFormData) => Promise<void> | void;
}

const DURATIONS = [30, 45, 50, 60, 90];
const RECURRENCES: { value: RecurrenceType; label: string }[] = [
  { value: 'yok', label: 'Tek seferlik' },
  { value: 'haftalik', label: 'Her hafta' },
  { value: 'iki_haftalik', label: '2 haftada bir' },
];
const OCCURRENCE_OPTIONS = [4, 8, 12, 24];

function defaultDate(): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

export default function AppointmentFormModal({ visible, patients, onClose, onSave }: Props) {
  const [patientId, setPatientId] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(defaultDate);
  const [duration, setDuration] = useState(50);
  const [notes, setNotes] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('yok');
  const [occurrences, setOccurrences] = useState(8);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setPatientId(patients.length === 1 ? patients[0].id : null);
      setDate(defaultDate());
      setDuration(50);
      setNotes('');
      setRecurrence('yok');
      setOccurrences(8);
      setShowDatePicker(false);
      setShowTimePicker(false);
      setSaving(false);
    }
  }, [visible, patients]);

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

  const handleSave = async () => {
    if (!patientId || saving) return;
    setSaving(true);
    try {
      await onSave({
        patient_id: patientId, date, duration, notes: notes.trim() || undefined,
        recurrence, occurrences: recurrence === 'yok' ? 1 : occurrences,
      });
    } finally {
      setSaving(false);
    }
  };

  const dateLabel = date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  const timeLabel = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Yeni Randevu</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={saving}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetContent}>
            <Text style={styles.fieldLabel}>Danışan</Text>
            {patients.length === 0 ? (
              <Text style={styles.noPatients}>Önce Hastalar sekmesinden hasta eklemelisiniz.</Text>
            ) : (
              <View style={styles.chipWrap}>
                {patients.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.chip, patientId === p.id && styles.chipActive]}
                    onPress={() => setPatientId(p.id)}
                  >
                    <Text style={[styles.chipText, patientId === p.id && styles.chipTextActive]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Tarih</Text>
                <TouchableOpacity
                  style={[styles.pickerBtn, showDatePicker && styles.pickerBtnActive]}
                  onPress={() => { setShowDatePicker(v => !v); setShowTimePicker(false); }}
                >
                  <Text style={styles.pickerBtnText}>{dateLabel}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: 110 }}>
                <Text style={styles.fieldLabel}>Saat</Text>
                <TouchableOpacity
                  style={[styles.pickerBtn, showTimePicker && styles.pickerBtnActive]}
                  onPress={() => { setShowTimePicker(v => !v); setShowDatePicker(false); }}
                >
                  <Text style={styles.pickerBtnText}>{timeLabel}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={onDateChange}
                locale="tr-TR"
                themeVariant="light"
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={date}
                mode="time"
                is24Hour
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
                locale="tr-TR"
                themeVariant="light"
              />
            )}

            <Text style={styles.fieldLabel}>Süre (dk)</Text>
            <View style={styles.chipWrap}>
              {DURATIONS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, duration === d && styles.chipActive]}
                  onPress={() => setDuration(d)}
                >
                  <Text style={[styles.chipText, duration === d && styles.chipTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Tekrar</Text>
            <View style={styles.chipWrap}>
              {RECURRENCES.map(r => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.chip, recurrence === r.value && styles.chipActive]}
                  onPress={() => setRecurrence(r.value)}
                >
                  <Text style={[styles.chipText, recurrence === r.value && styles.chipTextActive]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {recurrence !== 'yok' && (
              <>
                <Text style={styles.fieldLabel}>Kaç seans?</Text>
                <View style={styles.chipWrap}>
                  {OCCURRENCE_OPTIONS.map(n => (
                    <TouchableOpacity
                      key={n}
                      style={[styles.chip, occurrences === n && styles.chipActive]}
                      onPress={() => setOccurrences(n)}
                    >
                      <Text style={[styles.chipText, occurrences === n && styles.chipTextActive]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.recurrenceHint}>
                  {occurrences} randevu oluşturulur: {date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} tarihinden itibaren {recurrence === 'haftalik' ? 'her hafta' : 'iki haftada bir'} aynı gün ve saatte.
                </Text>
              </>
            )}

            <Text style={styles.fieldLabel}>Not (isteğe bağlı)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Randevu notu..."
              placeholderTextColor={colors.placeholder}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <TouchableOpacity
              style={[styles.saveBtn, (!patientId || saving) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!patientId || saving}
            >
              <Text style={styles.saveBtnText}>
                {saving ? 'Kaydediliyor...' : recurrence === 'yok' ? 'Randevuyu Kaydet' : `${occurrences} Randevuyu Kaydet`}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: '88%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  sheetTitle: { ...typography.h3 },
  closeBtn: { padding: spacing.xs },
  closeText: { color: colors.textMuted, fontSize: 18 },
  sheetContent: { padding: spacing.md, paddingBottom: spacing.xl },
  fieldLabel: { ...typography.label, marginTop: spacing.md, marginBottom: spacing.sm },
  noPatients: { ...typography.small, color: colors.textMuted },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { backgroundColor: colors.card, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  chipActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  chipText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  chipTextActive: { color: colors.accentLight, fontWeight: '700' },
  row: { flexDirection: 'row', gap: spacing.sm },
  pickerBtn: { backgroundColor: colors.inputBg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm + 2 },
  pickerBtnActive: { borderColor: colors.accent },
  pickerBtnText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  notesInput: { backgroundColor: colors.inputBg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.sm, color: colors.text, fontSize: 15, minHeight: 72, textAlignVertical: 'top' },
  recurrenceHint: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: spacing.sm },
  saveBtn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
