import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { WebView } from 'react-native-webview';
import * as Sharing from 'expo-sharing';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography, safeTop } from '@/lib/theme';
import { Icon } from '@/components/ui/Icon';
import type { Book, BookAnnotation } from '@/lib/types';

// PDF okuyucu: iOS'ta PDF uygulama İÇİNDE gösterilir (WebView yerel PDF
// render eder). Android WebView PDF desteklemediğinden paylaşım menüsüyle
// harici görüntüleyiciye gönderilir.
export default function BookReader() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const router = useRouter();
  const { books, getAnnotationsByBook, addAnnotation, deleteAnnotation } = useDatabase();
  const [book, setBook] = useState<Book | null>(null);
  const [annotations, setAnnotations] = useState<BookAnnotation[]>([]);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    const b = books.find(b => b.id === bookId);
    if (b) setBook(b);
  }, [bookId, books]);

  const loadAnnotations = useCallback(async () => {
    const anns = await getAnnotationsByBook(bookId);
    setAnnotations(anns);
  }, [bookId, getAnnotationsByBook]);

  useEffect(() => { loadAnnotations(); }, [loadAnnotations]);

  const openExternal = async () => {
    if (!book) return;
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(book.file_path, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      } else {
        Alert.alert('Hata', 'Bu cihazda paylaşım desteklenmiyor.');
      }
    } catch {
      Alert.alert('Hata', 'PDF açılırken bir sorun oluştu.');
    }
  };

  const saveAnnotation = async () => {
    if (!newAnnotation.trim()) return;
    await addAnnotation({ book_id: bookId, page: 0, content: newAnnotation.trim() });
    setNewAnnotation('');
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
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 60 }}>Dosya bulunamadı.</Text>
      </View>
    );
  }

  const canInlineView = Platform.OS === 'ios' && !pdfError;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
          <Icon name="chevron-back" size={22} color={colors.accent} />
          <Text style={styles.back}>Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{book.title}</Text>
        <TouchableOpacity onPress={openExternal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginRight: spacing.sm }}>
          <Icon name="share-outline" size={20} color={colors.accent} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowAnnotations(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.noteBtn}>
          <Icon name="bookmarks-outline" size={18} color={colors.accent} />
          {annotations.length > 0 && <Text style={styles.noteCount}>{annotations.length}</Text>}
        </TouchableOpacity>
      </View>

      {canInlineView ? (
        <WebView
          style={{ flex: 1, backgroundColor: colors.background }}
          source={{ uri: book.file_path }}
          originWhitelist={['*']}
          allowFileAccess
          allowingReadAccessToURL={book.file_path}
          onError={() => setPdfError(true)}
        />
      ) : (
        <View style={styles.fallback}>
          <Icon name="document-text-outline" size={44} color={colors.textMuted} />
          <Text style={styles.fallbackTitle}>{book.title}</Text>
          <Text style={styles.fallbackText}>
            {pdfError
              ? 'PDF uygulama içinde görüntülenemedi.'
              : 'Bu cihazda PDF harici görüntüleyiciyle açılır.'}
          </Text>
          <TouchableOpacity style={styles.openBtn} onPress={openExternal}>
            <Text style={styles.openBtnText}>PDF'i Aç / Paylaş</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notlar: liste + ekleme tek modalda */}
      <Modal visible={showAnnotations} transparent animationType="slide" onRequestClose={() => setShowAnnotations(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notlar ({annotations.length})</Text>
              <TouchableOpacity onPress={() => setShowAnnotations(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              {annotations.length === 0 ? (
                <Text style={styles.emptyAnnot}>Henüz not eklenmemiş.</Text>
              ) : (
                annotations.map(ann => (
                  <View key={ann.id} style={styles.annotCard}>
                    <Text style={styles.annotContent}>{ann.content}</Text>
                    <TouchableOpacity onPress={() => confirmDeleteAnnotation(ann)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Icon name="trash-outline" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
            <View style={styles.addRow}>
              <TextInput
                style={styles.annotInput}
                value={newAnnotation}
                onChangeText={setNewAnnotation}
                placeholder="Bu kaynağa not ekle..."
                placeholderTextColor={colors.placeholder}
                multiline
              />
              <TouchableOpacity
                style={[styles.saveAnnotBtn, !newAnnotation.trim() && { opacity: 0.4 }]}
                onPress={saveAnnotation}
                disabled={!newAnnotation.trim()}
              >
                <Icon name="arrow-up" size={18} color="#fff" />
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
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, paddingHorizontal: spacing.md, paddingTop: safeTop + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  backRow: { flexDirection: 'row', alignItems: 'center' },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  title: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
  noteBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  noteCount: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  fallbackTitle: { ...typography.h3, textAlign: 'center' },
  fallbackText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: spacing.sm },
  openBtn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2 },
  openBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  modalTitle: { ...typography.h3 },
  annotCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.xs },
  annotContent: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 19 },
  emptyAnnot: { color: colors.textMuted, textAlign: 'center', padding: spacing.md },
  addRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  annotInput: { flex: 1, backgroundColor: colors.inputBg, color: colors.text, borderRadius: radius.md, padding: spacing.sm, fontSize: 14, maxHeight: 90, borderWidth: 1, borderColor: colors.cardBorder },
  saveAnnotBtn: { backgroundColor: colors.accent, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});
