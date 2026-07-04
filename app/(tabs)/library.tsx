import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { useDatabase } from '@/contexts/database-context';
import { copyBookToStorage, deleteBook as deleteBookFile, getFileSize, formatFileSize } from '@/lib/storage';
import { generateId } from '@/lib/id';
import { colors, spacing, radius, typography, safeTop } from '@/lib/theme';
import { Icon } from '@/components/ui/Icon';
import { SCALES, type Scale } from '@/lib/scales';
import { foldTurkish } from '@/lib/dsm5';
import type { Book } from '@/lib/types';

const CATEGORIES: Book['category'][] = ['DSM', 'BDT', 'Psikodinami', 'Noropsikoloji', 'Diger'];
const CATEGORY_LABELS: Record<string, string> = {
  DSM: 'DSM / Tanı',
  BDT: 'BDT',
  Psikodinami: 'Psikodinamik',
  Noropsikoloji: 'Nöropsikoloji',
  Diger: 'Diğer',
};

type Tab = 'olcekler' | 'pdf';

export default function Library() {
  const { books, addBook, deleteBook, loadBooks } = useDatabase();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('olcekler');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Tümü');
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const q = foldTurkish(search.trim());

  const filteredScales = useMemo(() => {
    if (!q) return SCALES;
    return SCALES.filter(s => foldTurkish(`${s.abbreviation} ${s.name} ${s.purpose} ${s.category}`).includes(q));
  }, [q]);

  const filteredBooks = useMemo(() => {
    let list = activeCategory === 'Tümü' ? books : books.filter(b => b.category === activeCategory);
    if (q) list = list.filter(b => foldTurkish(`${b.title} ${b.author ?? ''}`).includes(q));
    return list;
  }, [books, activeCategory, q]);

  // Aramada iki bölümde de eşleşme varsa kullanıcıyı bilgilendir
  const otherTabHits = q
    ? (tab === 'olcekler' ? filteredBooks.length : filteredScales.length)
    : 0;

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

      // Kategori seçtir, sonra kaydet (eskiden her şey "Diğer"e düşüyordu)
      const saveWithCategory = async (category: Book['category']) => {
        setUploading(true);
        try {
          const storedPath = await copyBookToStorage(file.uri, generateId(), file.name);
          const book = await addBook({
            title: file.name.replace('.pdf', ''),
            file_path: storedPath,
            file_size: file.size ?? (await getFileSize(storedPath)),
            category,
            current_page: 0,
          });
          setTab('pdf');
          router.push(`/library/${book.id}`);
        } finally {
          setUploading(false);
        }
      };

      Alert.alert('Kategori', `"${file.name}" hangi kategoriye eklensin?`, [
        ...CATEGORIES.map(c => ({ text: CATEGORY_LABELS[c], onPress: () => saveWithCategory(c) })),
        { text: 'İptal', style: 'cancel' as const },
      ]);
    } catch {
      setUploading(false);
      Alert.alert('Hata', 'PDF yüklenirken bir sorun oluştu.');
    }
  }, [addBook, router]);

  const confirmDelete = useCallback((book: Book) => {
    Alert.alert('Dosyayı Sil', `"${book.title}" silinecek. Emin misiniz?`, [
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

      <View style={styles.searchWrapper}>
        <Icon name="search-outline" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Ölçek veya kaynak ara..."
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sekmeler: sade, alt çizgili */}
      <View style={styles.tabs}>
        <TabButton label={`Ölçekler (${filteredScales.length})`} active={tab === 'olcekler'} onPress={() => setTab('olcekler')} />
        <TabButton label={`PDF Arşivim (${filteredBooks.length})`} active={tab === 'pdf'} onPress={() => setTab('pdf')} />
      </View>

      {q.length > 0 && otherTabHits > 0 && (
        <TouchableOpacity onPress={() => setTab(tab === 'olcekler' ? 'pdf' : 'olcekler')}>
          <Text style={styles.otherTabHint}>
            {tab === 'olcekler' ? `PDF arşivinde ${otherTabHits} sonuç daha →` : `Ölçeklerde ${otherTabHits} sonuç daha →`}
          </Text>
        </TouchableOpacity>
      )}

      {tab === 'olcekler' ? (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.sectionInfo}>
            Puanlama ve kesme noktalarıyla klinik başvuru kartları. Kamu malı ölçeklerin maddeleri dahildir.
          </Text>
          {filteredScales.map(scale => (
            <ScaleCard key={scale.id} scale={scale} onPress={() => router.push(`/library/scale/${scale.id}`)} />
          ))}
          {filteredScales.length === 0 && (
            <View style={styles.empty}>
              <Icon name="search-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>"{search}" ile eşleşen ölçek yok</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} style={{ flexGrow: 0, marginBottom: spacing.sm }}>
            {['Tümü', ...CATEGORIES].map(cat => (
              <TouchableOpacity key={cat} style={styles.filterBtn} onPress={() => setActiveCategory(cat)}>
                <Text style={[styles.filterText, activeCategory === cat && styles.filterTextActive]}>
                  {cat === 'Tümü' ? 'Tümü' : CATEGORY_LABELS[cat]}
                </Text>
                {activeCategory === cat && <View style={styles.filterUnderline} />}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filteredBooks.length === 0 ? (
            <View style={styles.empty}>
              <Icon name="document-text-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>{q ? 'Eşleşen dosya yok' : 'Henüz PDF eklenmemiş'}</Text>
              {!q && (
                <TouchableOpacity style={styles.emptyBtn} onPress={pickPDF}>
                  <Text style={styles.emptyBtnText}>PDF Yükle</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredBooks.map(book => (
              <BookRow key={book.id} book={book} onOpen={() => router.push(`/library/${book.id}`)} onDelete={() => confirmDelete(book)} />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.tabBtn} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
      <View style={[styles.tabUnderline, active && styles.tabUnderlineActive]} />
    </TouchableOpacity>
  );
}

function ScaleCard({ scale, onPress }: { scale: Scale; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.abbrBadge}>
        <Text style={styles.abbrText} numberOfLines={1} adjustsFontSizeToFit>{scale.abbreviation}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{scale.name}</Text>
        <Text style={styles.rowDesc} numberOfLines={2}>{scale.purpose}</Text>
        <Text style={styles.rowMeta}>{scale.category} · {scale.itemCount} madde · {scale.durationMin}</Text>
      </View>
      <Icon name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function BookRow({ book, onOpen, onDelete }: { book: Book; onOpen: () => void; onDelete: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onOpen} onLongPress={onDelete}>
      <View style={styles.fileIcon}>
        <Icon name="document-text-outline" size={22} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.rowMeta}>
          {CATEGORY_LABELS[book.category] || book.category}
          {book.file_size ? ` · ${formatFileSize(book.file_size)}` : ''}
        </Text>
      </View>
      <Icon name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, paddingTop: safeTop + spacing.sm },
  title: { ...typography.h2 },
  uploadBtn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2 },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.inputBg, marginHorizontal: spacing.md, borderRadius: radius.md, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: spacing.sm },
  tabs: { flexDirection: 'row', marginTop: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  tabBtn: { flex: 1, alignItems: 'center' },
  tabText: { color: colors.textMuted, fontSize: 14, fontWeight: '600', paddingVertical: spacing.sm },
  tabTextActive: { color: colors.accent },
  tabUnderline: { height: 2, alignSelf: 'stretch', backgroundColor: 'transparent' },
  tabUnderlineActive: { backgroundColor: colors.accent },
  otherTabHint: { color: colors.accent, fontSize: 12, fontWeight: '600', textAlign: 'center', paddingTop: spacing.sm },
  list: { padding: spacing.md, paddingBottom: 32 },
  sectionInfo: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginBottom: spacing.sm },
  row: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  abbrBadge: { width: 62, height: 44, borderRadius: radius.sm, backgroundColor: colors.accentDim, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  abbrText: { color: colors.accentLight, fontSize: 13, fontWeight: '800' },
  fileIcon: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.accentDim, justifyContent: 'center', alignItems: 'center' },
  rowTitle: { ...typography.body, fontWeight: '600' },
  rowDesc: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 2 },
  rowMeta: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  filterRow: { flexDirection: 'row', gap: spacing.md },
  filterBtn: { alignItems: 'center' },
  filterText: { color: colors.textMuted, fontSize: 13, fontWeight: '500', paddingVertical: 4 },
  filterTextActive: { color: colors.accent, fontWeight: '700' },
  filterUnderline: { height: 2, alignSelf: 'stretch', backgroundColor: colors.accent },
  empty: { alignItems: 'center', marginTop: 48, gap: spacing.sm },
  emptyText: { color: colors.textSecondary, fontSize: 15 },
  emptyBtn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, marginTop: spacing.xs },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});
