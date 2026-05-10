import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { useDatabase } from '@/contexts/database-context';
import { copyBookToStorage, deleteBook as deleteBookFile, getFileSize, formatFileSize } from '@/lib/storage';
import { colors, spacing, radius, typography } from '@/lib/theme';
import type { Book } from '@/lib/types';

const CATEGORIES: Book['category'][] = ['DSM', 'BDT', 'Psikodinami', 'Noropsikoloji', 'Diger'];
const CATEGORY_LABELS: Record<string, string> = {
  DSM: 'DSM / Tanı',
  BDT: 'Bilişsel Davranışçı',
  Psikodinami: 'Psikodinamik',
  Noropsikoloji: 'Nöropsikoloji',
  Diger: 'Diğer',
};

export default function Library() {
  const { books, addBook, deleteBook, loadBooks } = useDatabase();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('Tümü');
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const filtered = activeCategory === 'Tümü'
    ? books
    : books.filter(b => b.category === activeCategory);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBooks();
    setRefreshing(false);
  }, [loadBooks]);

  const pickPDF = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];

      setUploading(true);
      const book = await addBook({
        title: file.name.replace('.pdf', ''),
        file_path: file.uri,
        file_size: file.size,
        category: 'Diger',
        current_page: 0,
      });
      setUploading(false);

      router.push(`/library/${book.id}`);
    } catch (e) {
      setUploading(false);
      Alert.alert('Hata', 'PDF yüklenirken bir sorun oluştu.');
    }
  }, [addBook, router]);

  const confirmDelete = useCallback((book: Book) => {
    Alert.alert('Kitabı Sil', `"${book.title}" kitabı silinecek. Emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          await deleteBookFile(book.file_path);
          await deleteBook(book.id);
        }
      },
    ]);
  }, [deleteBook]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kütüphane</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickPDF} disabled={uploading}>
          <Text style={styles.uploadBtnText}>{uploading ? '...' : '+ PDF'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        {['Tümü', ...CATEGORIES].map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.catChipText, activeCategory === cat && styles.catChipTextActive]}>
              {cat === 'Tümü' ? 'Tümü' : CATEGORY_LABELS[cat]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>📚</Text>
            <Text style={styles.emptyText}>Henüz kitap eklenmemiş</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={pickPDF}>
              <Text style={styles.emptyBtnText}>PDF Yükle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map(book => (
            <BookCard key={book.id} book={book} onOpen={() => router.push(`/library/${book.id}`)} onDelete={() => confirmDelete(book)} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function BookCard({ book, onOpen, onDelete }: { book: Book; onOpen: () => void; onDelete: () => void }) {
  const progress = book.total_pages && book.current_page > 0
    ? Math.round((book.current_page / book.total_pages) * 100)
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onOpen} onLongPress={onDelete}>
      <View style={styles.bookIcon}>
        <Text style={{ fontSize: 28 }}>📖</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
        {book.author && <Text style={styles.bookAuthor}>{book.author}</Text>}
        <View style={styles.bookMeta}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{CATEGORY_LABELS[book.category] || book.category}</Text>
          </View>
          {book.file_size && <Text style={styles.metaText}>{formatFileSize(book.file_size)}</Text>}
          {progress !== null && <Text style={styles.metaText}>%{progress} okundu</Text>}
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, paddingTop: spacing.xl + spacing.md },
  title: { ...typography.h2 },
  uploadBtn: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2 },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  categories: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.sm },
  catChip: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  catChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  catChipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  catChipTextActive: { color: '#fff' },
  list: { padding: spacing.md, paddingBottom: 32 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  bookIcon: { width: 50, height: 60, backgroundColor: colors.accentDim, borderRadius: radius.sm, justifyContent: 'center', alignItems: 'center' },
  bookTitle: { ...typography.body, fontWeight: '600', marginBottom: 2 },
  bookAuthor: { ...typography.small, color: colors.textSecondary, marginBottom: 4 },
  bookMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  categoryTag: { backgroundColor: colors.accentDim, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  categoryTagText: { color: colors.accentLight, fontSize: 11, fontWeight: '600' },
  metaText: { ...typography.small, color: colors.textMuted },
  arrow: { color: colors.textMuted, fontSize: 20 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: colors.textSecondary, fontSize: 15, marginBottom: spacing.md },
  emptyBtn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});
