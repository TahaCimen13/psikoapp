import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography } from '@/lib/theme';
import { Icon } from '@/components/ui/Icon';

export default function Patients() {
  const { patients, loadPatients } = useDatabase();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() =>
    patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
    [patients, search]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPatients();
    setRefreshing(false);
  }, [loadPatients]);

  const ageStr = (birthDate?: string) => {
    if (!birthDate) return '';
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    return `${age} yaş`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Danışanlar</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/patient/new')}>
          <Text style={styles.addBtnText}>+ Ekle</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrapper}>
        <Icon name="search-outline" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Danışan ara..."
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

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={{ marginBottom: 12 }}>
              <Icon name="person-outline" size={48} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyText}>
              {search ? 'Danışan bulunamadı' : 'Henüz danışan eklenmemiş'}
            </Text>
            {!search && (
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/patient/new')}>
                <Text style={styles.emptyBtnText}>İlk Danışanı Ekle</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map(patient => (
            <TouchableOpacity
              key={patient.id}
              style={styles.card}
              onPress={() => router.push(`/patient/${patient.id}`)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{patient.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>{patient.name}</Text>
                <View style={styles.metaRow}>
                  {patient.birth_date && <Text style={styles.meta}>{ageStr(patient.birth_date)}</Text>}
                  {patient.gender && <Text style={styles.meta}>{genderLabel(patient.gender)}</Text>}
                </View>
                {patient.background && (
                  <Text style={styles.background} numberOfLines={1}>{patient.background}</Text>
                )}
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function genderLabel(g: string) {
  if (g === 'erkek') return 'Erkek';
  if (g === 'kadin') return 'Kadın';
  return 'Diğer';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, paddingTop: spacing.xl + spacing.md },
  title: { ...typography.h2 },
  addBtn: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.inputBg, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: radius.md, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: spacing.sm },
  list: { padding: spacing.md, paddingTop: spacing.sm, paddingBottom: 32 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentDim, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.accentLight, fontSize: 20, fontWeight: '700' },
  patientName: { ...typography.body, fontWeight: '600' },
  metaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 2 },
  meta: { ...typography.small, color: colors.textSecondary },
  background: { ...typography.small, marginTop: 2, color: colors.textMuted },
  arrow: { color: colors.textMuted, fontSize: 20 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: colors.textSecondary, fontSize: 15, marginBottom: spacing.md },
  emptyBtn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});
