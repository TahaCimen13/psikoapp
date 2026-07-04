import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography, safeTop } from '@/lib/theme';
import type { Homework } from '@/lib/types';

export default function HomeworkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getHomeworkByPatient, addHomework, updateHomework, deleteHomework } = useDatabase();
  const [items, setItems] = useState<Homework[]>([]);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const load = useCallback(async () => {
    const hw = await getHomeworkByPatient(id);
    setItems(hw);
  }, [id, getHomeworkByPatient]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!title.trim()) return;
    await addHomework({ patient_id: id, title: title.trim(), description: description.trim() || undefined, due_date: dueDate.trim() || undefined, status: 'pending' });
    setTitle(''); setDescription(''); setDueDate(''); setAdding(false);
    load();
  };

  const toggle = async (hw: Homework) => {
    const next = hw.status === 'completed' ? 'pending' : 'completed';
    await updateHomework(hw.id, { status: next });
    load();
  };

  const remove = (hw: Homework) => {
    Alert.alert('Ödevi Sil', 'Bu ödev silinecek.', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await deleteHomework(hw.id); load(); } },
    ]);
  };

  const pending = items.filter(h => h.status === 'pending');
  const done = items.filter(h => h.status === 'completed');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ödevler</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAdding(true)}>
          <Text style={styles.addBtnText}>+ Ekle</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>📝</Text>
            <Text style={styles.emptyText}>Henüz ödev eklenmemiş</Text>
          </View>
        ) : (
          <>
            {pending.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Bekleyen ({pending.length})</Text>
                {pending.map(hw => <HomeworkCard key={hw.id} hw={hw} onToggle={toggle} onDelete={remove} />)}
              </>
            )}
            {done.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Tamamlanan ({done.length})</Text>
                {done.map(hw => <HomeworkCard key={hw.id} hw={hw} onToggle={toggle} onDelete={remove} />)}
              </>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={adding} transparent animationType="slide" onRequestClose={() => setAdding(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Yeni Ödev</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Ödev başlığı *" placeholderTextColor={colors.placeholder} />
            <TextInput style={[styles.input, { minHeight: 80 }]} value={description} onChangeText={setDescription} placeholder="Açıklama (isteğe bağlı)" placeholderTextColor={colors.placeholder} multiline textAlignVertical="top" />
            <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="Teslim tarihi: GG.AA.YYYY" placeholderTextColor={colors.placeholder} />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { setAdding(false); setTitle(''); setDescription(''); setDueDate(''); }}>
                <Text style={styles.cancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={save}>
                <Text style={styles.saveBtnText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function HomeworkCard({ hw, onToggle, onDelete }: { hw: Homework; onToggle: (hw: Homework) => void; onDelete: (hw: Homework) => void }) {
  const done = hw.status === 'completed';
  return (
    <View style={[styles.card, done && styles.cardDone]}>
      <TouchableOpacity onPress={() => onToggle(hw)} style={styles.checkbox}>
        <Text style={{ fontSize: 20 }}>{done ? '✅' : '⬜'}</Text>
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={[styles.hwTitle, done && styles.hwTitleDone]}>{hw.title}</Text>
        {hw.description ? <Text style={styles.hwDesc}>{hw.description}</Text> : null}
        {hw.due_date ? <Text style={styles.hwDue}>📅 {hw.due_date}</Text> : null}
      </View>
      <TouchableOpacity onPress={() => onDelete(hw)}>
        <Text style={{ color: colors.textMuted, fontSize: 16 }}>🗑</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, paddingTop: safeTop + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  title: { flex: 1, ...typography.h3 },
  addBtn: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  content: { padding: spacing.md, paddingBottom: 32 },
  sectionLabel: { ...typography.label, marginBottom: spacing.sm },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: colors.textSecondary, fontSize: 15 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  cardDone: { opacity: 0.6 },
  checkbox: { paddingTop: 2 },
  hwTitle: { ...typography.body, fontWeight: '600' },
  hwTitleDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  hwDesc: { ...typography.small, marginTop: 2 },
  hwDue: { fontSize: 12, color: colors.accent, marginTop: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  modalTitle: { ...typography.h3, marginBottom: spacing.md },
  input: { backgroundColor: colors.inputBg, color: colors.text, borderRadius: radius.md, padding: spacing.sm, fontSize: 15, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.sm },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.lg, marginTop: spacing.sm },
  cancelText: { color: colors.textSecondary, fontSize: 15 },
  saveBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});
