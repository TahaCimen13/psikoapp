import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography } from '@/lib/theme';
import { generateId } from '@/lib/id';
import { QUESTION_TYPES, type AnamnesisQuestion, type AnamnesisQuestionType } from '@/lib/anamnesis';

// Basit form editörü: soru ekle / düzenle / sil / yukarı-aşağı sırala.
// Kaydedildiğinde sorular değiştiyse form versiyonu otomatik artar.
export default function AnamnesisFormBuilder() {
  const { formId } = useLocalSearchParams<{ formId: string }>();
  const router = useRouter();
  const { getAnamnesisForm, updateAnamnesisForm } = useDatabase();

  const [name, setName] = useState('');
  const [questions, setQuestions] = useState<AnamnesisQuestion[]>([]);
  const [version, setVersion] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Soru editörü modal state'i
  const [editorOpen, setEditorOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null); // null = yeni soru
  const [qSection, setQSection] = useState('');
  const [qLabel, setQLabel] = useState('');
  const [qType, setQType] = useState<AnamnesisQuestionType>('kisa_metin');
  const [qRequired, setQRequired] = useState(false);
  const [qOptions, setQOptions] = useState(''); // her satır bir seçenek

  const load = useCallback(async () => {
    const f = await getAnamnesisForm(formId);
    if (f) {
      setName(f.name);
      setQuestions(f.questions);
      setVersion(f.version);
    }
    setLoaded(true);
  }, [formId, getAnamnesisForm]);

  useEffect(() => { load(); }, [load]);

  const markDirty = () => setDirty(true);

  const save = async () => {
    if (!name.trim()) { Alert.alert('Hata', 'Form adı boş olamaz.'); return; }
    await updateAnamnesisForm(formId, name.trim(), questions);
    setDirty(false);
    const f = await getAnamnesisForm(formId);
    if (f) setVersion(f.version);
    Alert.alert('Kaydedildi', 'Form güncellendi.');
  };

  const goBack = () => {
    if (!dirty) { router.back(); return; }
    Alert.alert('Kaydedilmemiş Değişiklikler', 'Değişiklikler kaydedilmeden çıkılsın mı?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çık', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const openEditor = (index: number | null) => {
    if (index === null) {
      // Yeni soru: son sorunun bölümünü öner (art arda aynı bölüme eklemek yaygın)
      setQSection(questions.length > 0 ? questions[questions.length - 1].section : '');
      setQLabel('');
      setQType('kisa_metin');
      setQRequired(false);
      setQOptions('');
    } else {
      const q = questions[index];
      setQSection(q.section);
      setQLabel(q.label);
      setQType(q.type);
      setQRequired(!!q.required);
      setQOptions((q.options ?? []).join('\n'));
    }
    setEditIndex(index);
    setEditorOpen(true);
  };

  const saveQuestion = () => {
    if (!qLabel.trim()) { Alert.alert('Hata', 'Soru metni boş olamaz.'); return; }
    const needsOptions = qType === 'tekli_secim' || qType === 'coklu_secim';
    const options = qOptions.split('\n').map(s => s.trim()).filter(Boolean);
    if (needsOptions && options.length < 2) {
      Alert.alert('Hata', 'Seçim sorularında en az 2 seçenek olmalı (her satıra bir seçenek yazın).');
      return;
    }
    const q: AnamnesisQuestion = {
      id: editIndex === null ? generateId() : questions[editIndex].id,
      section: qSection.trim() || 'Genel',
      label: qLabel.trim(),
      type: qType,
      required: qRequired || undefined,
      options: needsOptions ? options : undefined,
    };
    setQuestions(prev => editIndex === null ? [...prev, q] : prev.map((old, i) => i === editIndex ? q : old));
    markDirty();
    setEditorOpen(false);
  };

  const removeQuestion = (index: number) => {
    Alert.alert('Soruyu Sil', `"${questions[index].label}" silinecek.`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => { setQuestions(prev => prev.filter((_, i) => i !== index)); markDirty(); } },
    ]);
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= questions.length) return;
    setQuestions(prev => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    markDirty();
  };

  if (!loaded) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}><Text style={styles.back}>← Geri</Text></TouchableOpacity>
        <Text style={styles.title}>Form Düzenle <Text style={styles.versionTag}>v{version}</Text></Text>
        <TouchableOpacity style={[styles.saveBtn, !dirty && { opacity: 0.5 }]} onPress={save} disabled={!dirty}>
          <Text style={styles.saveBtnText}>Kaydet</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Form Adı</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={t => { setName(t); markDirty(); }}
          placeholder="Örn. Yetişkin Anamnez Formu"
          placeholderTextColor={colors.placeholder}
        />

        <Text style={[styles.label, { marginTop: spacing.md }]}>Sorular ({questions.length})</Text>

        {questions.map((q, i) => {
          const showSection = i === 0 || questions[i - 1].section !== q.section;
          return (
            <View key={q.id}>
              {showSection && <Text style={styles.sectionHeading}>{q.section}</Text>}
              <View style={styles.qCard}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => openEditor(i)}>
                  <Text style={styles.qLabel}>{q.label}{q.required ? <Text style={{ color: colors.error }}> *</Text> : null}</Text>
                  <Text style={styles.qMeta}>
                    {QUESTION_TYPES[q.type]}
                    {q.options ? ` · ${q.options.length} seçenek` : ''}
                  </Text>
                </TouchableOpacity>
                <View style={styles.qActions}>
                  <TouchableOpacity onPress={() => move(i, -1)} disabled={i === 0} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Text style={[styles.arrow, i === 0 && styles.arrowOff]}>↑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => move(i, 1)} disabled={i === questions.length - 1} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Text style={[styles.arrow, i === questions.length - 1 && styles.arrowOff]}>↓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeQuestion(i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Text style={styles.trash}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        <TouchableOpacity style={styles.addQBtn} onPress={() => openEditor(null)}>
          <Text style={styles.addQBtnText}>+ Soru Ekle</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Soru editörü */}
      <Modal visible={editorOpen} transparent animationType="slide" onRequestClose={() => setEditorOpen(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editIndex === null ? 'Yeni Soru' : 'Soruyu Düzenle'}</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Bölüm</Text>
              <TextInput style={styles.input} value={qSection} onChangeText={setQSection} placeholder="Örn. Kişisel Bilgiler" placeholderTextColor={colors.placeholder} />

              <Text style={styles.fieldLabel}>Soru Metni</Text>
              <TextInput style={[styles.input, { minHeight: 60 }]} value={qLabel} onChangeText={setQLabel} placeholder="Danışana sorulacak soru..." placeholderTextColor={colors.placeholder} multiline textAlignVertical="top" />

              <Text style={styles.fieldLabel}>Alan Tipi</Text>
              <View style={styles.typeGrid}>
                {(Object.keys(QUESTION_TYPES) as AnamnesisQuestionType[]).map(t => (
                  <TouchableOpacity key={t} style={[styles.chip, qType === t && styles.chipActive]} onPress={() => setQType(t)}>
                    <Text style={[styles.chipText, qType === t && styles.chipTextActive]}>{QUESTION_TYPES[t]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {(qType === 'tekli_secim' || qType === 'coklu_secim') && (
                <>
                  <Text style={styles.fieldLabel}>Seçenekler (her satıra bir tane)</Text>
                  <TextInput style={[styles.input, { minHeight: 90 }]} value={qOptions} onChangeText={setQOptions} placeholder={'Evet\nHayır'} placeholderTextColor={colors.placeholder} multiline textAlignVertical="top" />
                </>
              )}

              <View style={styles.requiredRow}>
                <Text style={styles.fieldLabel}>Zorunlu soru</Text>
                <Switch value={qRequired} onValueChange={setQRequired} trackColor={{ false: colors.cardBorder, true: colors.accent }} thumbColor="#fff" />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditorOpen(false)}>
                <Text style={styles.cancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveQuestion}>
                <Text style={styles.modalSaveBtnText}>{editIndex === null ? 'Ekle' : 'Güncelle'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, paddingTop: spacing.xl + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  title: { flex: 1, ...typography.h3 },
  versionTag: { color: colors.textMuted, fontSize: 13, fontWeight: '400' },
  saveBtn: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  content: { padding: spacing.md, paddingBottom: 60 },
  label: { ...typography.label, marginBottom: spacing.sm },
  input: { backgroundColor: colors.inputBg, color: colors.text, borderRadius: radius.md, padding: spacing.sm, fontSize: 15, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.sm },
  sectionHeading: { color: colors.accentLight, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm, marginBottom: spacing.xs },
  qCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.xs },
  qLabel: { color: colors.text, fontSize: 14, lineHeight: 19 },
  qMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  qActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  arrow: { color: colors.accent, fontSize: 18, fontWeight: '700' },
  arrowOff: { color: colors.cardBorder },
  trash: { fontSize: 15 },
  addQBtn: { borderWidth: 1, borderColor: colors.accent, borderStyle: 'dashed', borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.md },
  addQBtnText: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, maxHeight: '85%' },
  modalTitle: { ...typography.h3, marginBottom: spacing.md },
  fieldLabel: { ...typography.small, color: colors.textSecondary, marginBottom: 6 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  chip: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 5, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.cardBorder },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 12, color: colors.text },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  requiredRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs, marginBottom: spacing.sm },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing.lg, marginTop: spacing.sm },
  cancelText: { color: colors.textSecondary, fontSize: 15 },
  modalSaveBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  modalSaveBtnText: { color: '#fff', fontWeight: '700' },
});
