import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography, safeTop } from '@/lib/theme';
import { Icon } from '@/components/ui/Icon';
import type { Patient, AnamnesisForm, AnamnesisResponse } from '@/lib/types';

// Danışanın doldurduğu anamnez yanıtlarının listesi + yeni doldurma başlatma
export default function PatientAnamnesisList() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getPatient, getAnamnesisForms, getAnamnesisResponsesByPatient } = useDatabase();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [forms, setForms] = useState<AnamnesisForm[]>([]);
  const [responses, setResponses] = useState<AnamnesisResponse[]>([]);
  const [showFormPicker, setShowFormPicker] = useState(false);

  const load = useCallback(async () => {
    const [p, f, r] = await Promise.all([
      getPatient(id), getAnamnesisForms(), getAnamnesisResponsesByPatient(id),
    ]);
    setPatient(p);
    setForms(f);
    setResponses(r);
  }, [id, getPatient, getAnamnesisForms, getAnamnesisResponsesByPatient]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const startFill = () => {
    if (forms.length === 0) return;
    if (forms.length === 1) {
      router.push(`/patient/${id}/anamnesis/fill?formId=${forms[0].id}`);
    } else {
      setShowFormPicker(true);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
          <Icon name="chevron-back" size={22} color={colors.accent} />
          <Text style={styles.back}>Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Anamnez</Text>
        <TouchableOpacity style={styles.addBtn} onPress={startFill} disabled={forms.length === 0}>
          <Text style={styles.addBtnText}>+ Doldur</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {patient && <Text style={styles.patientName}>{patient.name}</Text>}

        {responses.length === 0 ? (
          <View style={styles.empty}>
            <View style={{ marginBottom: 12 }}>
              <Icon name="document-text-outline" size={44} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyText}>Henüz doldurulmuş anamnez formu yok.</Text>
            <Text style={styles.emptyHint}>
              "+ Doldur" ile başlayın: önce aydınlatma ve açık rıza adımları gösterilir,
              ardından cihazı danışana uzatarak formu doldurmasını sağlayabilirsiniz.
            </Text>
          </View>
        ) : (
          responses.map(r => (
            <TouchableOpacity key={r.id} style={styles.card} onPress={() => router.push(`/patient/${id}/anamnesis/${r.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{r.form_name} <Text style={styles.cardVersion}>v{r.form_version}</Text></Text>
                <Text style={styles.cardMeta}>{formatDate(r.filled_at)} · {r.questions.length} soru</Text>
              </View>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Birden fazla form varsa seçim */}
      <Modal visible={showFormPicker} transparent animationType="fade" onRequestClose={() => setShowFormPicker(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowFormPicker(false)}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Hangi form doldurulacak?</Text>
            {forms.map(f => (
              <TouchableOpacity
                key={f.id}
                style={styles.pickerOption}
                onPress={() => {
                  setShowFormPicker(false);
                  router.push(`/patient/${id}/anamnesis/fill?formId=${f.id}`);
                }}
              >
                <Text style={styles.pickerOptionText}>{f.name}</Text>
                <Text style={styles.pickerOptionMeta}>v{f.version} · {f.questions.length} soru</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, paddingTop: safeTop + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backRow: { flexDirection: 'row', alignItems: 'center' },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  title: { flex: 1, ...typography.h3 },
  addBtn: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  content: { padding: spacing.md, paddingBottom: 40 },
  patientName: { ...typography.label, marginBottom: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.sm },
  cardTitle: { ...typography.body, fontWeight: '600' },
  cardVersion: { color: colors.textMuted, fontSize: 12, fontWeight: '400' },
  cardMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 40, paddingHorizontal: spacing.md },
  emptyText: { color: colors.textSecondary, fontSize: 15, marginBottom: spacing.sm },
  emptyHint: { color: colors.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  pickerModal: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md },
  pickerTitle: { ...typography.h3, marginBottom: spacing.sm },
  pickerOption: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  pickerOptionText: { color: colors.text, fontSize: 15, fontWeight: '500' },
  pickerOptionMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
