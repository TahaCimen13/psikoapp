import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography } from '@/lib/theme';
import RiskBadge, { RISK_LEVELS, RISK_CATEGORIES, RISK_LEVEL_ORDER } from '@/components/RiskBadge';
import type { RiskFlag } from '@/lib/types';

const LEVELS = (Object.keys(RISK_LEVELS) as RiskFlag['level'][]).map(value => ({
  value,
  label: RISK_LEVELS[value].label,
  color: RISK_LEVELS[value].color,
}));

const CATEGORIES = (Object.keys(RISK_CATEGORIES) as RiskFlag['category'][]).map(value => ({
  value,
  label: RISK_CATEGORIES[value],
}));

export default function RiskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getRiskFlagsByPatient, addRiskFlag, resolveRiskFlag } = useDatabase();
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [adding, setAdding] = useState(false);
  const [level, setLevel] = useState<RiskFlag['level']>('orta');
  const [category, setCategory] = useState<RiskFlag['category']>('diger');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    const f = await getRiskFlagsByPatient(id);
    setFlags(f);
  }, [id, getRiskFlagsByPatient]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    await addRiskFlag({ patient_id: id, level, category, notes: notes.trim() || undefined, resolved: false });
    setLevel('orta'); setCategory('diger'); setNotes('');
    setAdding(false);
    load();
  };

  const markResolved = (f: RiskFlag) => {
    Alert.alert(
      'Çözüldü İşaretle',
      `"${RISK_CATEGORIES[f.category]}" risk bayrağı çözüldü olarak işaretlenecek.`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çözüldü', onPress: async () => { await resolveRiskFlag(f.id); load(); } },
      ]
    );
  };

  const sortByLevel = (a: RiskFlag, b: RiskFlag) =>
    RISK_LEVEL_ORDER[b.level] - RISK_LEVEL_ORDER[a.level] || b.created_at.localeCompare(a.created_at);

  const activeFlags = flags.filter(f => !f.resolved).sort(sortByLevel);
  const resolvedFlags = flags.filter(f => f.resolved).sort(sortByLevel);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Geri</Text></TouchableOpacity>
        <Text style={styles.title}>Risk Takibi</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAdding(true)}>
          <Text style={styles.addBtnText}>+ Ekle</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {flags.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>⚠️</Text>
            <Text style={styles.emptyText}>Henüz risk bayrağı eklenmemiş</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Aktif Bayraklar</Text>
            {activeFlags.length === 0 ? (
              <Text style={styles.noneText}>Aktif risk bayrağı yok</Text>
            ) : (
              activeFlags.map(f => (
                <View key={f.id} style={[styles.card, f.level === 'kritik' && styles.criticalCard]}>
                  {f.level === 'kritik' && (
                    <View style={styles.criticalBanner}>
                      <Text style={styles.criticalBannerText}>🚨 KRİTİK RİSK — Acil takip gerekli</Text>
                    </View>
                  )}
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.categoryText}>{RISK_CATEGORIES[f.category]}</Text>
                      <Text style={styles.dateText}>📅 {formatDate(f.created_at)}</Text>
                    </View>
                    <RiskBadge level={f.level} />
                  </View>
                  {f.notes ? <Text style={styles.notesText}>{f.notes}</Text> : null}
                  <TouchableOpacity style={styles.resolveBtn} onPress={() => markResolved(f)}>
                    <Text style={styles.resolveBtnText}>✓ Çözüldü işaretle</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            {resolvedFlags.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Çözülmüş Bayraklar</Text>
                {resolvedFlags.map(f => (
                  <View key={f.id} style={[styles.card, styles.resolvedCard]}>
                    <View style={styles.cardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.categoryText, { color: colors.textSecondary }]}>{RISK_CATEGORIES[f.category]}</Text>
                        <Text style={styles.dateText}>📅 {formatDate(f.created_at)}</Text>
                      </View>
                      <RiskBadge level={f.level} resolved />
                    </View>
                    {f.notes ? <Text style={styles.notesText}>{f.notes}</Text> : null}
                    <Text style={styles.resolvedLabel}>✓ Çözüldü</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={adding} transparent animationType="slide" onRequestClose={() => setAdding(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Risk Bayrağı Ekle</Text>

            <Text style={styles.label}>Seviye</Text>
            <View style={styles.chipRow}>
              {LEVELS.map(l => (
                <TouchableOpacity
                  key={l.value}
                  style={[styles.chip, level === l.value && { backgroundColor: l.color, borderColor: l.color }]}
                  onPress={() => setLevel(l.value)}
                >
                  <Text style={[styles.chipText, level === l.value && styles.chipTextActive]}>{l.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Kategori</Text>
            <View style={[styles.chipRow, { flexWrap: 'wrap' }]}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.chip, category === c.value && styles.chipActive]}
                  onPress={() => setCategory(c.value)}
                >
                  <Text style={[styles.chipText, category === c.value && styles.chipTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notlar (isteğe bağlı)"
              placeholderTextColor={colors.placeholder}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setAdding(false)}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, paddingTop: spacing.xl + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  title: { flex: 1, ...typography.h3 },
  addBtn: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  content: { padding: spacing.md, paddingBottom: 32 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: colors.textSecondary, fontSize: 15 },
  sectionLabel: { ...typography.label, marginBottom: spacing.sm },
  noneText: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  criticalCard: { borderColor: colors.error, borderWidth: 2, backgroundColor: colors.error + '08' },
  resolvedCard: { opacity: 0.75 },
  criticalBanner: { backgroundColor: colors.error, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4, marginBottom: spacing.sm, alignSelf: 'flex-start' },
  criticalBannerText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.xs },
  categoryText: { ...typography.body, fontWeight: '600' },
  dateText: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  notesText: { ...typography.small, marginTop: spacing.xs, lineHeight: 18 },
  resolveBtn: { marginTop: spacing.sm, alignSelf: 'flex-start', borderRadius: radius.full, borderWidth: 1, borderColor: colors.success, paddingHorizontal: spacing.md, paddingVertical: 5 },
  resolveBtnText: { color: colors.success, fontSize: 13, fontWeight: '600' },
  resolvedLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: spacing.sm },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, maxHeight: '85%' },
  modalTitle: { ...typography.h3, marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  chip: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.cardBorder },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 13, color: colors.text },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  input: { backgroundColor: colors.inputBg, color: colors.text, borderRadius: radius.md, padding: spacing.sm, fontSize: 15, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.sm },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.lg, marginTop: spacing.md },
  cancelText: { color: colors.textSecondary, fontSize: 15 },
  saveBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});
