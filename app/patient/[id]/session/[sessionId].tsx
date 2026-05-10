import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography } from '@/lib/theme';
import type { Session, SessionNote } from '@/lib/types';
import { NOTE_CATEGORIES } from '@/lib/types';

export default function SessionDetail() {
  const { id, sessionId } = useLocalSearchParams<{ id: string; sessionId: string }>();
  const router = useRouter();
  const { getSession, getNotesBySession, addNote, updateNote, deleteNote, updateSession, deleteSession } = useDatabase();

  const [session, setSession] = useState<Session | null>(null);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNoteCategory, setNewNoteCategory] = useState<SessionNote['category']>('genel');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editContent, setEditContent] = useState('');
  const [summaryEdit, setSummaryEdit] = useState('');
  const [editingSummary, setEditingSummary] = useState(false);

  const load = useCallback(async () => {
    const [s, n] = await Promise.all([getSession(sessionId), getNotesBySession(sessionId)]);
    setSession(s);
    setNotes(n);
    if (s) setSummaryEdit(s.summary || '');
  }, [sessionId, getSession, getNotesBySession]);

  useEffect(() => { load(); }, [load]);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const addNoteHandler = async () => {
    if (!newNoteContent.trim()) return;
    await addNote({ session_id: sessionId, category: newNoteCategory, content: newNoteContent.trim() });
    setNewNoteContent('');
    load();
  };

  const startEdit = (note: SessionNote) => {
    setEditingNote(note.id);
    setEditContent(note.content);
  };

  const saveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    await updateNote(id, editContent.trim());
    setEditingNote(null);
    load();
  };

  const deleteNoteHandler = (noteId: string) => {
    Alert.alert('Notu Sil', 'Bu not silinecek.', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await deleteNote(noteId); load(); } },
    ]);
  };

  const saveSummary = async () => {
    await updateSession(sessionId, { summary: summaryEdit });
    setEditingSummary(false);
    load();
  };

  const confirmDeleteSession = () => {
    Alert.alert('Seansı Sil', 'Bu seans ve tüm notlar silinecek.', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await deleteSession(sessionId); router.back(); } },
    ]);
  };

  const notesByCategory = NOTE_CATEGORIES.map(cat => ({
    ...cat,
    notes: notes.filter(n => n.category === cat.value),
  }));

  if (!session) return <View style={styles.container}><Text style={styles.loading}>Yükleniyor...</Text></View>;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Geri</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmDeleteSession}>
          <Text style={styles.deleteBtn}>🗑</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
          <View style={styles.sessionMeta}>
            <MetaChip label={`Seans #${session.session_number || '-'}`} />
            <MetaChip label={`${session.duration || '?'} dk`} />
          </View>
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryLabel}>Seans Özeti</Text>
            {!editingSummary ? (
              <TouchableOpacity onPress={() => setEditingSummary(true)}>
                <Text style={styles.editBtn}>Düzenle</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={saveSummary}>
                <Text style={styles.editBtn}>Kaydet</Text>
              </TouchableOpacity>
            )}
          </View>
          {editingSummary ? (
            <TextInput
              style={styles.summaryInput}
              value={summaryEdit}
              onChangeText={setSummaryEdit}
              placeholder="Seans özeti..."
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />
          ) : (
            <Text style={styles.summaryText}>{session.summary || 'Özet henüz yazılmamış. Düzenle butonuna tıklayın.'}</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>NOTLAR</Text>

        {notesByCategory.map(cat => (
          <View key={cat.value}>
            {cat.notes.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{cat.label}</Text>
                {cat.notes.map(note => (
                  <View key={note.id} style={styles.noteCard}>
                    {editingNote === note.id ? (
                      <View>
                        <TextInput
                          style={styles.noteEditInput}
                          value={editContent}
                          onChangeText={setEditContent}
                          multiline
                          textAlignVertical="top"
                          autoFocus
                        />
                        <View style={styles.noteActions}>
                          <TouchableOpacity onPress={() => setEditingNote(null)}>
                            <Text style={styles.cancelBtn}>İptal</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => saveEdit(note.id)}>
                            <Text style={styles.saveNoteBtn}>Kaydet</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.noteRow}>
                        <Text style={styles.noteContent}>{note.content}</Text>
                        <View style={styles.noteIconRow}>
                          <TouchableOpacity onPress={() => startEdit(note)}>
                            <Text style={styles.noteIcon}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteNoteHandler(note.id)}>
                            <Text style={styles.noteIcon}>🗑</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={styles.addNoteBox}>
          <Text style={styles.addNoteTitle}>Not Ekle</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChips}>
            {NOTE_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.value}
                style={[styles.catChip, newNoteCategory === cat.value && styles.catChipActive]}
                onPress={() => setNewNoteCategory(cat.value)}
              >
                <Text style={[styles.catChipText, newNoteCategory === cat.value && styles.catChipTextActive]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TextInput
            style={styles.noteInput}
            value={newNoteContent}
            onChangeText={setNewNoteContent}
            placeholder="Not içeriği..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <TouchableOpacity style={[styles.addNoteBtn, !newNoteContent.trim() && { opacity: 0.4 }]} onPress={addNoteHandler} disabled={!newNoteContent.trim()}>
            <Text style={styles.addNoteBtnText}>Not Ekle</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MetaChip({ label }: { label: string }) {
  return <View style={styles.metaChip}><Text style={styles.metaChipText}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { color: colors.textSecondary, textAlign: 'center', marginTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, paddingTop: spacing.xl + spacing.md },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  deleteBtn: { fontSize: 20 },
  content: { padding: spacing.md, paddingBottom: 40 },
  sessionInfo: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  sessionDate: { ...typography.h3, marginBottom: spacing.xs },
  sessionMeta: { flexDirection: 'row', gap: spacing.sm },
  metaChip: { backgroundColor: colors.accentDim, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  metaChipText: { color: colors.accentLight, fontSize: 12, fontWeight: '500' },
  summaryBox: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  summaryLabel: { ...typography.label },
  editBtn: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  summaryText: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  summaryInput: { backgroundColor: colors.inputBg, color: colors.text, borderRadius: radius.sm, padding: spacing.sm, fontSize: 14, minHeight: 80, borderWidth: 1, borderColor: colors.cardBorder },
  sectionTitle: { ...typography.label, marginBottom: spacing.sm },
  categorySection: { marginBottom: spacing.md },
  categoryTitle: { color: colors.accent, fontSize: 13, fontWeight: '700', marginBottom: spacing.xs },
  noteCard: { backgroundColor: colors.card, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.xs, borderLeftWidth: 3, borderLeftColor: colors.accent, borderWidth: 1, borderColor: colors.cardBorder },
  noteRow: { flexDirection: 'row', gap: spacing.xs },
  noteContent: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 21 },
  noteIconRow: { flexDirection: 'row', gap: spacing.xs },
  noteIcon: { fontSize: 14, padding: 2 },
  noteEditInput: { color: colors.text, fontSize: 14, minHeight: 60, lineHeight: 21 },
  noteActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.xs },
  cancelBtn: { color: colors.textSecondary, fontSize: 13 },
  saveNoteBtn: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  addNoteBox: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  addNoteTitle: { ...typography.label, marginBottom: spacing.sm },
  categoryChips: { gap: spacing.xs, paddingBottom: spacing.sm },
  catChip: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.cardBorder },
  catChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  catChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
  catChipTextActive: { color: '#fff' },
  noteInput: { backgroundColor: colors.inputBg, color: colors.text, borderRadius: radius.sm, padding: spacing.sm, fontSize: 14, minHeight: 80, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.sm, textAlignVertical: 'top' },
  addNoteBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, padding: spacing.sm, alignItems: 'center' },
  addNoteBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
