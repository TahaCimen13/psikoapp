import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { DSM5_DATA, searchDiagnoses, DSMDiagnosis } from '@/lib/dsm5';
import { colors, spacing, radius, typography } from '@/lib/theme';

export default function Diagnose() {
  const [search, setSearch] = useState('');
  const [selectedDiag, setSelectedDiag] = useState<DSMDiagnosis | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const searchResults = useMemo(() => search.length >= 2 ? searchDiagnoses(search) : [], [search]);
  const isSearching = search.length >= 2;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>DSM-5-TR Tanı Rehberi</Text>
      </View>

      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tanı adı veya kodu ara..."
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {selectedDiag ? (
        <DiagnosisDetail diag={selectedDiag} onBack={() => setSelectedDiag(null)} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {isSearching ? (
            searchResults.length === 0 ? (
              <Text style={styles.noResult}>Sonuç bulunamadı</Text>
            ) : (
              searchResults.map(d => (
                <DiagRow key={d.code} diag={d} onPress={() => setSelectedDiag(d)} />
              ))
            )
          ) : (
            DSM5_DATA.map(chapter => (
              <View key={chapter.title}>
                <TouchableOpacity
                  style={styles.chapterHeader}
                  onPress={() => setExpandedChapter(expandedChapter === chapter.title ? null : chapter.title)}
                >
                  <Text style={styles.chapterTitle}>{chapter.title}</Text>
                  <Text style={styles.chapterCount}>{chapter.diagnoses.length} tanı</Text>
                  <Text style={styles.chevron}>{expandedChapter === chapter.title ? '▾' : '▸'}</Text>
                </TouchableOpacity>
                {expandedChapter === chapter.title && (
                  chapter.diagnoses.map(d => (
                    <DiagRow key={d.code} diag={d} onPress={() => setSelectedDiag(d)} indent />
                  ))
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function DiagRow({ diag, onPress, indent }: { diag: DSMDiagnosis; onPress: () => void; indent?: boolean }) {
  return (
    <TouchableOpacity style={[styles.diagRow, indent && styles.diagRowIndent]} onPress={onPress}>
      <View style={styles.codeTag}>
        <Text style={styles.codeText}>{diag.code}</Text>
      </View>
      <Text style={styles.diagName}>{diag.name}</Text>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

function DiagnosisDetail({ diag, onBack }: { diag: DSMDiagnosis; onBack: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.detail}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backBtnText}>← Geri</Text>
      </TouchableOpacity>

      <View style={styles.detailHeader}>
        <View style={styles.bigCode}>
          <Text style={styles.bigCodeText}>{diag.code}</Text>
        </View>
        <Text style={styles.detailName}>{diag.name}</Text>
        <Text style={styles.detailChapter}>{diag.chapter}</Text>
      </View>

      <Text style={styles.sectionTitle}>Tanı Kriterleri</Text>
      {diag.criteria.map((c, i) => (
        <View key={i} style={styles.criterionRow}>
          <Text style={styles.criterionText}>{c}</Text>
        </View>
      ))}

      {diag.severity_specifiers && diag.severity_specifiers.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Şiddet Belirleyicileri</Text>
          {diag.severity_specifiers.map((s, i) => (
            <View key={i} style={styles.specifierTag}>
              <Text style={styles.specifierText}>{s}</Text>
            </View>
          ))}
        </>
      )}

      {diag.notes && (
        <>
          <Text style={styles.sectionTitle}>Notlar</Text>
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{diag.notes}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.md, paddingTop: spacing.xl + spacing.md },
  title: { ...typography.h2 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: radius.md, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  searchIcon: { fontSize: 16, marginRight: spacing.xs },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: spacing.sm },
  clearBtn: { color: colors.textMuted, fontSize: 16, padding: spacing.xs },
  list: { padding: spacing.md, paddingBottom: 32 },
  noResult: { color: colors.textSecondary, textAlign: 'center', marginTop: 40 },
  chapterHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xs, borderWidth: 1, borderColor: colors.cardBorder },
  chapterTitle: { flex: 1, ...typography.body, fontWeight: '600', color: colors.text },
  chapterCount: { ...typography.small, color: colors.textMuted, marginRight: spacing.sm },
  chevron: { color: colors.accent, fontSize: 16 },
  diagRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: radius.sm, padding: spacing.sm, marginBottom: 4, gap: spacing.sm },
  diagRowIndent: { marginLeft: spacing.md, marginBottom: 4 },
  codeTag: { backgroundColor: colors.accentDim, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  codeText: { color: colors.accentLight, fontSize: 11, fontWeight: '700' },
  diagName: { flex: 1, ...typography.body, color: colors.text, fontSize: 14 },
  arrow: { color: colors.textMuted, fontSize: 18 },
  detail: { padding: spacing.md, paddingBottom: 40 },
  backBtn: { marginBottom: spacing.md },
  backBtnText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  detailHeader: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  bigCode: { backgroundColor: colors.accentDim, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginBottom: spacing.sm },
  bigCodeText: { color: colors.accentLight, fontWeight: '700', fontSize: 18 },
  detailName: { ...typography.h3, textAlign: 'center', marginBottom: 4 },
  detailChapter: { ...typography.small, color: colors.textSecondary, textAlign: 'center' },
  sectionTitle: { ...typography.label, marginTop: spacing.lg, marginBottom: spacing.sm },
  criterionRow: { backgroundColor: colors.card, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.xs, borderLeftWidth: 3, borderLeftColor: colors.accent },
  criterionText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  specifierTag: { backgroundColor: colors.accentDim, borderRadius: radius.full, alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 4, marginBottom: spacing.xs },
  specifierText: { color: colors.accentLight, fontSize: 13, fontWeight: '500' },
  notesBox: { backgroundColor: colors.card, borderRadius: radius.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  notesText: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
});
