import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, ScrollView, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography, safeTop } from '@/lib/theme';
import type { Book, BookAnnotation } from '@/lib/types';

export default function BookReader() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const router = useRouter();
  const { books, getAnnotationsByBook, addAnnotation, deleteAnnotation } = useDatabase();
  const [book, setBook] = useState<Book | null>(null);
  const [annotations, setAnnotations] = useState<BookAnnotation[]>([]);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [addingAnnotation, setAddingAnnotation] = useState(false);

  useEffect(() => {
    const b = books.find(b => b.id === bookId);
    if (b) setBook(b);
  }, [bookId, books]);

  const loadAnnotations = useCallback(async () => {
    const anns = await getAnnotationsByBook(bookId);
    setAnnotations(anns);
  }, [bookId, getAnnotationsByBook]);

  useEffect(() => { loadAnnotations(); }, [loadAnnotations]);

  const openPdf = async () => {
    if (!book) return;
    try {
      const supported = await Linking.canOpenURL(book.file_path);
      if (supported) {
        await Linking.openURL(book.file_path);
      } else {
        Alert.alert('Hata', 'Bu dosya açılamıyor. Destekli bir PDF görüntüleyici gerekli.');
      }
    } catch {
      Alert.alert('Hata', 'PDF açılırken bir sorun oluştu.');
    }
  };

  const saveAnnotation = async () => {
    if (!newAnnotation.trim()) return;
    await addAnnotation({ book_id: bookId, page: 0, content: newAnnotation.trim() });
    setNewAnnotation('');
    setAddingAnnotation(false);
    loadAnnotations();
  };

  const confirmDeleteAnnotation = (ann: BookAnnotation) => {
    Alert.alert('Notu Sil', 'Bu not silinecek.', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await deleteAnnotation(ann.id); loadAnnotations(); } },
    ]);
  };

  if (!book) {
    return (
      <View style={styles.container}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 60 }}>Kitap bulunamadı.</Text>
      </View>
    );
  }

  const fileSizeMB = book.file_size ? (book.file_size / (1024 * 1024)).toFixed(1) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{book.title}</Text>
        <TouchableOpacity onPress={() => setShowAnnotations(true)}>
          <Text style={styles.actionBtn}>📑 {annotations.length}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.bookCard}>
          <Text style={styles.bookEmoji}>📖</Text>
          <Text style={styles.bookTitle}>{book.title}</Text>
          {book.author ? <Text style={styles.bookAuthor}>{book.author}</Text> : null}
          <View style={styles.metaRow}>
            <View style={styles.catBadge}><Text style={styles.catText}>{book.category}</Text></View>
            {fileSizeMB ? <Text style={styles.metaText}>{fileSizeMB} MB</Text> : null}
          </View>
        </View>

        <TouchableOpacity style={styles.openBtn} onPress={openPdf}>
          <Text style={styles.openBtnText}>PDF'i Aç</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addAnnotBtn} onPress={() => setAddingAnnotation(true)}>
          <Text style={styles.addAnnotBtnText}>+ Not Ekle</Text>
        </TouchableOpacity>

        {annotations.length > 0 && (
          <View style={styles.annotSection}>
            <Text style={styles.annotSectionTitle}>Notlar ({annotations.length})</Text>
            {annotations.map(ann => (
              <View key={ann.id} style={styles.annotCard}>
                <Text style={styles.annotContent}>{ann.content}</Text>
                <TouchableOpacity onPress={() => confirmDeleteAnnotation(ann)}>
                  <Text style={styles.deleteAnnot}>🗑</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={addingAnnotation} transparent animationType="slide" onRequestClose={() => setAddingAnnotation(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Not Ekle</Text>
            <TextInput
              style={styles.annotInput}
              value={newAnnotation}
              onChangeText={setNewAnnotation}
              placeholder="Bu kitaba not ekle..."
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { setAddingAnnotation(false); setNewAnnotation(''); }}>
                <Text style={styles.cancelBtn}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveAnnotBtn} onPress={saveAnnotation}>
                <Text style={styles.saveAnnotBtnText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showAnnotations} transparent animationType="slide" onRequestClose={() => setShowAnnotations(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notlar ({annotations.length})</Text>
              <TouchableOpacity onPress={() => setShowAnnotations(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {annotations.length === 0 ? (
                <Text style={styles.emptyAnnot}>Henüz not eklenmemiş.</Text>
              ) : (
                annotations.map(ann => (
                  <View key={ann.id} style={styles.annotCard}>
                    <Text style={styles.annotContent}>{ann.content}</Text>
                    <TouchableOpacity onPress={() => confirmDeleteAnnotation(ann)}>
                      <Text style={styles.deleteAnnot}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, paddingTop: safeTop + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  title: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
  actionBtn: { color: colors.accent, fontSize: 14, padding: spacing.xs },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 40 },
  bookCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  bookEmoji: { fontSize: 48 },
  bookTitle: { ...typography.h2, textAlign: 'center' },
  bookAuthor: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  metaRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginTop: spacing.xs },
  catBadge: { backgroundColor: colors.accentDim, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  catText: { color: colors.accentLight, fontSize: 12, fontWeight: '600' },
  metaText: { color: colors.textMuted, fontSize: 12 },
  openBtn: { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  openBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  addAnnotBtn: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  addAnnotBtnText: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  annotSection: { gap: spacing.sm },
  annotSectionTitle: { ...typography.label },
  annotCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  annotContent: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 20 },
  deleteAnnot: { fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { ...typography.h3 },
  closeBtn: { color: colors.textMuted, fontSize: 18 },
  annotInput: { backgroundColor: colors.inputBg, color: colors.text, borderRadius: radius.md, padding: spacing.sm, fontSize: 14, minHeight: 100, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.md },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.lg },
  cancelBtn: { color: colors.textSecondary, fontSize: 14 },
  saveAnnotBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  saveAnnotBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyAnnot: { color: colors.textMuted, textAlign: 'center', padding: spacing.lg },
});
