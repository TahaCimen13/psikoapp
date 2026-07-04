import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { generateSessionSummary } from '@/lib/claude';
import { colors, spacing, radius, typography } from '@/lib/theme';
import { Icon } from '@/components/ui/Icon';
import type { Session, SessionNote, SoapSectionValue, LegacyNoteCategory } from '@/lib/types';
import { SOAP_SECTIONS, LEGACY_CATEGORY_TO_SOAP, LEGACY_NOTE_LABELS } from '@/lib/types';

// Bir notun ait olduğu SOAP bölümü: yeni notlar doğrudan SOAP değeri taşır,
// eski kategorili notlar eşleme tablosuyla ilgili bölümde gösterilir.
const soapOf = (n: SessionNote): SoapSectionValue =>
  (LEGACY_CATEGORY_TO_SOAP as Record<string, SoapSectionValue>)[n.category] ?? (n.category as SoapSectionValue);

export default function SessionDetail() {
  const { id, sessionId } = useLocalSearchParams<{ id: string; sessionId: string }>();
  const router = useRouter();
  const { getSession, getNotesBySession, addNote, updateNote, deleteNote, updateSession, deleteSession, getPatient, settings, getActiveConsent } = useDatabase();

  const [session, setSession] = useState<Session | null>(null);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNoteCategory, setNewNoteCategory] = useState<SoapSectionValue>('subjektif');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editContent, setEditContent] = useState('');
  const [summaryEdit, setSummaryEdit] = useState('');
  const [editingSummary, setEditingSummary] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

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

  // Seans notlarından AI ile özet üret; kaydetmeden önce düzenleme modunda göster
  const generateAISummary = async () => {
    if (!session || aiLoading) return;
    if (!settings.claude_api_key) {
      Alert.alert('API Anahtarı Gerekli', 'AI özet için Ayarlar ekranından Claude API anahtarınızı girin.');
      return;
    }
    // KVKK: rıza yoksa seans notları AI'ya gönderilmez
    const consent = await getActiveConsent(id);
    if (!consent) {
      Alert.alert('KVKK Rızası Gerekli', 'Bu danışan için aktif KVKK rızası yok. Hasta profilinden rıza kaydı alın.');
      return;
    }
    if (notes.length === 0) {
      Alert.alert('Not Yok', 'Özet üretmek için önce seans notu ekleyin.');
      return;
    }
    setAiLoading(true);
    try {
      const patient = await getPatient(id);
      if (!patient) throw new Error('Hasta bulunamadı.');
      const summary = await generateSessionSummary(settings.claude_api_key, patient, session, notes);
      setSummaryEdit(summary);
      setEditingSummary(true);
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'AI özet oluşturulamadı.');
    } finally {
      setAiLoading(false);
    }
  };

  const confirmDeleteSession = () => {
    Alert.alert('Seansı Sil', 'Bu seans ve tüm notlar silinecek.', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await deleteSession(sessionId); router.back(); } },
    ]);
  };

  const notesBySoap = SOAP_SECTIONS.map(sec => ({
    ...sec,
    notes: notes.filter(n => soapOf(n) === sec.value),
  }));

  if (!session) return <View style={styles.container}><Text style={styles.loading}>Yükleniyor...</Text></View>;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
          <Icon name="chevron-back" size={22} color={colors.accent} />
          <Text style={styles.back}>Geri</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmDeleteSession} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
          <View style={styles.sessionMeta}>
            <MetaChip label={`Seans #${session.session_number || '-'}`} />
            <MetaChip label={`${session.duration || '?'} dk`} />
            {session.approach ? <MetaChip label={session.approach} /> : null}
            {session.mood_rating ? <MetaChip label={`Duygu: ${session.mood_rating}/10`} /> : null}
          </View>
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryLabel}>Seans Özeti</Text>
            <View style={styles.summaryActions}>
              {!editingSummary && (
                aiLoading ? (
                  <ActivityIndicator color={colors.accent} size="small" />
                ) : (
                  <TouchableOpacity onPress={generateAISummary}>
                    <Text style={styles.editBtn}>✨ AI Özet</Text>
                  </TouchableOpacity>
                )
              )}
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

        <Text style={styles.sectionTitle}>SOAP NOTLARI</Text>

        {notesBySoap.map(sec => (
          <View key={sec.value} style={styles.categorySection}>
            <View style={styles.soapHeader}>
              <View style={styles.soapLetterBadge}>
                <Text style={styles.soapLetter}>{sec.letter}</Text>
              </View>
              <Text style={styles.categoryTitle}>{sec.label}</Text>
            </View>
            {sec.notes.length === 0 ? (
              <Text style={styles.soapEmptyHint}>{sec.hint}</Text>
            ) : (
              sec.notes.map(note => (
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
                    <View>
                      <View style={styles.noteRow}>
                        <Text style={styles.noteContent}>{note.content}</Text>
                        <View style={styles.noteIconRow}>
                          <TouchableOpacity onPress={() => startEdit(note)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                            <Icon name="pencil-outline" size={15} color={colors.textMuted} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteNoteHandler(note.id)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                            <Icon name="trash-outline" size={15} color={colors.textMuted} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      {note.category in LEGACY_NOTE_LABELS && (
                        <Text style={styles.legacyTag}>Eski kategori: {LEGACY_NOTE_LABELS[note.category as LegacyNoteCategory]}</Text>
                      )}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        ))}

        <View style={styles.addNoteBox}>
          <Text style={styles.addNoteTitle}>Not Ekle</Text>
          <View style={styles.categoryChips}>
            {SOAP_SECTIONS.map(sec => (
              <TouchableOpacity
                key={sec.value}
                style={[styles.catChip, newNoteCategory === sec.value && styles.catChipActive]}
                onPress={() => setNewNoteCategory(sec.value)}
              >
                <Text style={[styles.catChipText, newNoteCategory === sec.value && styles.catChipTextActive]}>{sec.letter} · {sec.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.chipHint}>{SOAP_SECTIONS.find(s => s.value === newNoteCategory)?.hint}</Text>
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
  backRow: { flexDirection: 'row', alignItems: 'center' },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  content: { padding: spacing.md, paddingBottom: 40 },
  sessionInfo: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  sessionDate: { ...typography.h3, marginBottom: spacing.xs },
  sessionMeta: { flexDirection: 'row', gap: spacing.sm },
  metaChip: { backgroundColor: colors.accentDim, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  metaChipText: { color: colors.accentLight, fontSize: 12, fontWeight: '500' },
  summaryBox: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  summaryActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summaryLabel: { ...typography.label },
  editBtn: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  summaryText: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  summaryInput: { backgroundColor: colors.inputBg, color: colors.text, borderRadius: radius.sm, padding: spacing.sm, fontSize: 14, minHeight: 80, borderWidth: 1, borderColor: colors.cardBorder },
  sectionTitle: { ...typography.label, marginBottom: spacing.sm },
  categorySection: { marginBottom: spacing.md },
  soapHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  soapLetterBadge: { width: 22, height: 22, borderRadius: 6, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
  soapLetter: { color: '#fff', fontSize: 12, fontWeight: '800' },
  categoryTitle: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  soapEmptyHint: { color: colors.textMuted, fontSize: 12, fontStyle: 'italic', lineHeight: 17, marginLeft: 30 },
  legacyTag: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  chipHint: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginBottom: spacing.sm },
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
  categoryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingBottom: spacing.sm },
  catChip: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.cardBorder },
  catChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  catChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
  catChipTextActive: { color: '#fff' },
  noteInput: { backgroundColor: colors.inputBg, color: colors.text, borderRadius: radius.sm, padding: spacing.sm, fontSize: 14, minHeight: 80, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.sm, textAlignVertical: 'top' },
  addNoteBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, padding: spacing.sm, alignItems: 'center' },
  addNoteBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
