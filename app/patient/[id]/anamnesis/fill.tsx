import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography } from '@/lib/theme';
import { Icon } from '@/components/ui/Icon';
import type { AnamnesisQuestion, AnamnesisAnswers } from '@/lib/anamnesis';
import type { Patient, AnamnesisForm, KvkkConsent } from '@/lib/types';

// Anamnez doldurma akışı ("cihazı danışana uzat" modu).
// KVKK 2026/347 sırası: aydınlatma + açık rıza tamamlanmadan form AÇILMAZ
// (hard block) — rıza yoksa önce /patient/[id]/consent akışına yönlendirilir.
type Stage = 'intro' | 'form' | 'done';

export default function AnamnesisFillScreen() {
  const { id, formId } = useLocalSearchParams<{ id: string; formId: string }>();
  const router = useRouter();
  const { getPatient, getAnamnesisForm, getActiveConsent, addAnamnesisResponse } = useDatabase();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState<AnamnesisForm | null>(null);
  const [consent, setConsent] = useState<KvkkConsent | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [stage, setStage] = useState<Stage>('intro');
  const [answers, setAnswers] = useState<AnamnesisAnswers>({});
  const [datePickerFor, setDatePickerFor] = useState<string | null>(null);

  // Rıza ekranından dönüşte durumu yeniden kontrol et
  const load = useCallback(async () => {
    const [p, f, c] = await Promise.all([
      getPatient(id), getAnamnesisForm(formId), getActiveConsent(id),
    ]);
    setPatient(p);
    setForm(f);
    setConsent(c);
    setLoaded(true);
  }, [id, formId, getPatient, getAnamnesisForm, getActiveConsent]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const setAnswer = (qid: string, value: string | string[]) =>
    setAnswers(prev => ({ ...prev, [qid]: value }));

  const toggleMulti = (qid: string, option: string) => {
    const current = (answers[qid] as string[] | undefined) ?? [];
    setAnswer(qid, current.includes(option) ? current.filter(o => o !== option) : [...current, option]);
  };

  const submit = async () => {
    if (!form) return;
    const missing = form.questions.find(q => {
      if (!q.required) return false;
      const a = answers[q.id];
      return a === undefined || (typeof a === 'string' && !a.trim()) || (Array.isArray(a) && a.length === 0);
    });
    if (missing) {
      Alert.alert('Eksik Yanıt', `Zorunlu soru yanıtlanmadı:\n\n"${missing.label}"`);
      return;
    }
    await addAnamnesisResponse(id, form, answers);
    setStage('done');
  };

  if (!loaded || !patient || !form) {
    return (
      <View style={styles.container}>
        {loaded && (
          <View style={styles.centerBox}>
            <Text style={styles.gateText}>Form bulunamadı.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
              <Text style={styles.primaryBtnText}>Geri Dön</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // --- KVKK kapısı: aktif rıza yoksa form açılmaz ---
  if (!consent) {
    return (
      <View style={styles.container}>
        <Header title="Anamnez" onBack={() => router.back()} />
        <View style={styles.centerBox}>
          <View style={{ marginBottom: spacing.md }}>
            <Icon name="shield-outline" size={44} color={colors.warning} />
          </View>
          <Text style={styles.gateTitle}>Önce Aydınlatma ve Açık Rıza</Text>
          <Text style={styles.gateText}>
            KVKK gereği anamnez formu, danışan aydınlatma metnini okuyup açık rıza vermeden açılamaz.
            Bu adımlar tamamlandığında forma otomatik devam edilir.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push(`/patient/${id}/consent`)}>
            <Text style={styles.primaryBtnText}>Aydınlatma ve Rıza Adımlarına Git</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Giriş: cihaz danışana verilmeden önce ---
  if (stage === 'intro') {
    return (
      <View style={styles.container}>
        <Header title={form.name} onBack={() => router.back()} />
        <View style={styles.centerBox}>
          <View style={{ marginBottom: spacing.md }}>
            <Icon name="phone-portrait-outline" size={44} color={colors.accent} />
          </View>
          <Text style={styles.gateTitle}>Cihazı Danışana Uzatın</Text>
          <Text style={styles.gateText}>
            {patient.name} bu formu kendi dolduracak. Form {form.questions.length} sorudan oluşuyor
            (v{form.version}). Yanıtlar yalnızca bu cihazda saklanır.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStage('form')}>
            <Text style={styles.primaryBtnText}>Forma Başla</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Bitiş ---
  if (stage === 'done') {
    return (
      <View style={styles.container}>
        <View style={styles.centerBox}>
          <View style={{ marginBottom: spacing.md }}>
            <Icon name="checkmark-circle" size={52} color={colors.success} />
          </View>
          <Text style={styles.gateTitle}>Teşekkürler!</Text>
          <Text style={styles.gateText}>
            Form kaydedildi. Lütfen cihazı psikoloğunuza geri verin.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={styles.primaryBtnText}>Tamam</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Form ---
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header
        title={form.name}
        onBack={() =>
          Alert.alert('Formdan Çık', 'Yanıtlar kaydedilmeden çıkılsın mı?', [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Çık', style: 'destructive', onPress: () => router.back() },
          ])
        }
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {form.questions.map((q, i) => {
          const showSection = i === 0 || form.questions[i - 1].section !== q.section;
          return (
            <View key={q.id}>
              {showSection && <Text style={styles.sectionHeading}>{q.section}</Text>}
              <View style={styles.qBlock}>
                <Text style={styles.qLabel}>
                  {q.label}{q.required ? <Text style={{ color: colors.error }}> *</Text> : null}
                </Text>
                <QuestionInput
                  question={q}
                  value={answers[q.id]}
                  onChangeText={t => setAnswer(q.id, t)}
                  onSelectSingle={opt => setAnswer(q.id, opt)}
                  onToggleMulti={opt => toggleMulti(q.id, opt)}
                  showDatePicker={datePickerFor === q.id}
                  onOpenDatePicker={() => setDatePickerFor(q.id)}
                  onDatePicked={date => {
                    setDatePickerFor(Platform.OS === 'ios' ? q.id : null);
                    if (date) setAnswer(q.id, date.toISOString().split('T')[0]);
                  }}
                  onCloseDatePicker={() => setDatePickerFor(null)}
                />
              </View>
            </View>
          );
        })}

        <TouchableOpacity style={[styles.primaryBtn, { marginTop: spacing.lg }]} onPress={submit}>
          <Text style={styles.primaryBtnText}>Formu Tamamla</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function QuestionInput({ question: q, value, onChangeText, onSelectSingle, onToggleMulti, showDatePicker, onOpenDatePicker, onDatePicked, onCloseDatePicker }: {
  question: AnamnesisQuestion;
  value: string | string[] | undefined;
  onChangeText: (t: string) => void;
  onSelectSingle: (opt: string) => void;
  onToggleMulti: (opt: string) => void;
  showDatePicker: boolean;
  onOpenDatePicker: () => void;
  onDatePicked: (date: Date | undefined) => void;
  onCloseDatePicker: () => void;
}) {
  switch (q.type) {
    case 'kisa_metin':
      return (
        <TextInput style={styles.input} value={(value as string) ?? ''} onChangeText={onChangeText} placeholder="Yanıtınız..." placeholderTextColor={colors.placeholder} />
      );
    case 'uzun_metin':
      return (
        <TextInput style={[styles.input, styles.textArea]} value={(value as string) ?? ''} onChangeText={onChangeText} placeholder="Yanıtınız..." placeholderTextColor={colors.placeholder} multiline textAlignVertical="top" />
      );
    case 'sayi':
      return (
        <TextInput style={styles.input} value={(value as string) ?? ''} onChangeText={t => onChangeText(t.replace(/[^0-9.,]/g, ''))} placeholder="0" placeholderTextColor={colors.placeholder} keyboardType="numeric" />
      );
    case 'tarih': {
      const dateStr = value as string | undefined;
      return (
        <>
          <TouchableOpacity style={styles.dateButton} onPress={onOpenDatePicker}>
            <Icon name="calendar-outline" size={16} color={colors.textMuted} />
            <Text style={dateStr ? styles.dateText : styles.datePlaceholder}>
              {dateStr
                ? new Date(dateStr + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Tarih seç'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dateStr ? new Date(dateStr + 'T00:00:00') : new Date(1990, 0, 1)}
              mode="date"
              maximumDate={new Date()}
              onChange={(_, date) => {
                if (Platform.OS !== 'ios') onCloseDatePicker();
                onDatePicked(date ?? undefined);
              }}
            />
          )}
        </>
      );
    }
    case 'tekli_secim':
      return (
        <View style={styles.optionsWrap}>
          {(q.options ?? []).map(opt => {
            const selected = value === opt;
            return (
              <TouchableOpacity key={opt} style={[styles.optionChip, selected && styles.optionChipActive]} onPress={() => onSelectSingle(opt)}>
                <Text style={[styles.optionText, selected && styles.optionTextActive]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    case 'coklu_secim':
      return (
        <View style={styles.optionsWrap}>
          {(q.options ?? []).map(opt => {
            const selected = Array.isArray(value) && value.includes(opt);
            return (
              <TouchableOpacity key={opt} style={[styles.optionChip, selected && styles.optionChipActive]} onPress={() => onToggleMulti(opt)}>
                <Text style={[styles.optionText, selected && styles.optionTextActive]}>{selected ? '✓ ' : ''}{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
  }
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backRow}>
        <Icon name="chevron-back" size={22} color={colors.accent} />
        <Text style={styles.back}>Geri</Text>
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={{ width: 44 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, paddingTop: spacing.xl + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backRow: { flexDirection: 'row', alignItems: 'center' },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  title: { flex: 1, ...typography.h3 },
  content: { padding: spacing.md, paddingBottom: 60 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  gateTitle: { ...typography.h3, marginBottom: spacing.sm, textAlign: 'center' },
  gateText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: spacing.lg },
  primaryBtn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: spacing.lg, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sectionHeading: { color: colors.accentLight, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.md, marginBottom: spacing.sm },
  qBlock: { marginBottom: spacing.md },
  qLabel: { color: colors.text, fontSize: 14, lineHeight: 20, marginBottom: 6, fontWeight: '500' },
  input: { backgroundColor: colors.inputBg, color: colors.text, borderRadius: radius.md, padding: spacing.sm, fontSize: 15, borderWidth: 1, borderColor: colors.cardBorder },
  textArea: { minHeight: 90, paddingTop: spacing.sm },
  dateButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.inputBg, borderRadius: radius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  dateText: { color: colors.text, fontSize: 15 },
  datePlaceholder: { color: colors.placeholder, fontSize: 15 },
  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  optionChip: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 8, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.cardBorder },
  optionChipActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  optionText: { fontSize: 14, color: colors.textSecondary },
  optionTextActive: { color: colors.accentLight, fontWeight: '600' },
});
