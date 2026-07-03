import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography } from '@/lib/theme';
import { DEFAULT_TEMPLATE } from '@/lib/anamnesis';
import type { AnamnesisForm } from '@/lib/types';

export default function AnamnesisFormList() {
  const router = useRouter();
  const { getAnamnesisForms, addAnamnesisForm, deleteAnamnesisForm } = useDatabase();
  const [forms, setForms] = useState<AnamnesisForm[]>([]);

  const load = useCallback(async () => {
    setForms(await getAnamnesisForms());
  }, [getAnamnesisForms]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const createForm = () => {
    Alert.alert('Yeni Anamnez Formu', 'Nasıl başlamak istersiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Boş Form',
        onPress: async () => {
          const f = await addAnamnesisForm('Yeni Form', []);
          router.push(`/anamnesis/${f.id}`);
        },
      },
      {
        text: 'Standart Şablondan',
        onPress: async () => {
          const f = await addAnamnesisForm('Yeni Form (Standart)', DEFAULT_TEMPLATE);
          router.push(`/anamnesis/${f.id}`);
        },
      },
    ]);
  };

  const confirmDelete = (f: AnamnesisForm) => {
    Alert.alert(
      'Formu Sil',
      `"${f.name}" silinecek. Bu formla doldurulmuş danışan yanıtları SİLİNMEZ, kayıtlı kalır.`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: async () => { await deleteAnamnesisForm(f.id); await load(); } },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Geri</Text></TouchableOpacity>
        <Text style={styles.title}>Anamnez Formları</Text>
        <TouchableOpacity style={styles.addBtn} onPress={createForm}>
          <Text style={styles.addBtnText}>+ Yeni</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.info}>
          Danışanlarınıza dolduracağınız anamnez (öykü alma) formlarını burada oluşturup düzenleyebilirsiniz.
          Form değiştiğinde versiyonu artar; eski yanıtlar dolduruldukları versiyonla saklanır.
        </Text>

        {forms.map(f => (
          <TouchableOpacity key={f.id} style={styles.card} onPress={() => router.push(`/anamnesis/${f.id}`)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{f.name}</Text>
              <Text style={styles.cardMeta}>v{f.version} · {f.questions.length} soru</Text>
            </View>
            <TouchableOpacity onPress={() => confirmDelete(f)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.trash}>🗑</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {forms.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Henüz form yok. "+ Yeni" ile oluşturun.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, paddingTop: spacing.xl + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  title: { flex: 1, ...typography.h3 },
  addBtn: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  content: { padding: spacing.md, paddingBottom: 40 },
  info: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.sm },
  cardTitle: { ...typography.body, fontWeight: '600' },
  cardMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  trash: { fontSize: 18 },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
