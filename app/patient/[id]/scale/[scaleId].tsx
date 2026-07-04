import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography, safeTop } from '@/lib/theme';
import { Icon } from '@/components/ui/Icon';
import { getScale, interpretScore, isFillable, type ScaleCutoff } from '@/lib/scales';
import type { Patient, KvkkConsent } from '@/lib/types';

// Ölçeğin uygulama içinde danışana doldurtulması ("cihazı uzat" modu).
// Sonuç otomatik puanlanır, Değerlendirmelere kaydedilir → İlerleme
// grafiklerine düşer. homeworkId verilirse ilgili ödev tamamlanır.
type Stage = 'intro' | 'form' | 'done';

export default function ScaleFillScreen() {
  const { id, scaleId, homeworkId } = useLocalSearchParams<{ id: string; scaleId: string; homeworkId?: string }>();
  const router = useRouter();
  const { getPatient, getActiveConsent, addAssessment, updateHomework } = useDatabase();
  const scale = getScale(scaleId);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [consent, setConsent] = useState<KvkkConsent | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [stage, setStage] = useState<Stage>('intro');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; band: ScaleCutoff | null } | null>(null);

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([getPatient(id), getActiveConsent(id)]);
    setPatient(p);
    setConsent(c);
    setLoaded(true);
  }, [id, getPatient, getActiveConsent]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submit = async () => {
    if (!scale || !patient) return;
    const missing = scale.items!.findIndex((_, i) => answers[i] === undefined);
    if (missing >= 0) {
      Alert.alert('Eksik Yanıt', `${missing + 1}. madde yanıtlanmadı. Lütfen tüm maddeleri yanıtlayın.`);
      return;
    }
    const rawSum = Object.values(answers).reduce((a, b) => a + b, 0);
    const r = interpretScore(scale, rawSum);
    // Madde yanıtları saklanır: tamamlanmış test PDF'inde seçimler işaretlenir
    const answerList = scale.items!.map((_, i) => answers[i]);
    await addAssessment({
      patient_id: id,
      test_name: scale.abbreviation,
      score: r.score,
      interpretation: r.band?.label,
      date: new Date().toISOString().split('T')[0],
      notes: 'Uygulama içinde dolduruldu.',
      answers: JSON.stringify(answerList),
    });
    if (homeworkId) {
      await updateHomework(homeworkId, { status: 'completed' });
    }
    setResult(r);
    setStage('done');
  };

  if (!scale || !isFillable(scale)) {
    return (
      <View style={styles.container}>
        <Header title="Ölçek" onBack={() => router.back()} />
        <View style={styles.centerBox}>
          <Text style={styles.gateText}>Bu ölçek uygulama içinde doldurulamıyor (madde metinleri gömülü değil).</Text>
        </View>
      </View>
    );
  }

  if (!loaded || !patient) return <View style={styles.container} />;

  // KVKK kapısı: test sonucu sağlık verisidir, rızasız işlenemez
  if (!consent) {
    return (
      <View style={styles.container}>
        <Header title={scale.abbreviation} onBack={() => router.back()} />
        <View style={styles.centerBox}>
          <View style={{ marginBottom: spacing.md }}>
            <Icon name="shield-outline" size={44} color={colors.warning} />
          </View>
          <Text style={styles.gateTitle}>Önce Aydınlatma ve Açık Rıza</Text>
          <Text style={styles.gateText}>
            Test sonuçları sağlık verisidir; danışan açık rıza vermeden ölçek uygulanamaz.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push(`/patient/${id}/consent`)}>
            <Text style={styles.primaryBtnText}>Aydınlatma ve Rıza Adımlarına Git</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (stage === 'intro') {
    return (
      <View style={styles.container}>
        <Header title={scale.abbreviation} onBack={() => router.back()} />
        <View style={styles.centerBox}>
          <View style={{ marginBottom: spacing.md }}>
            <Icon name="phone-portrait-outline" size={44} color={colors.accent} />
          </View>
          <Text style={styles.gateTitle}>Cihazı Danışana Uzatın</Text>
          <Text style={styles.gateText}>
            {patient.name} · {scale.name}{'\n'}
            {scale.items!.length} madde · {scale.durationMin} · {scale.timeFrame} düşünülerek yanıtlanır.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStage('form')}>
            <Text style={styles.primaryBtnText}>Başla</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (stage === 'done') {
    return (
      <View style={styles.container}>
        <View style={styles.centerBox}>
          <View style={{ marginBottom: spacing.md }}>
            <Icon name="checkmark-circle" size={52} color={colors.success} />
          </View>
          <Text style={styles.gateTitle}>Tamamlandı — Teşekkürler!</Text>
          <Text style={styles.gateText}>Lütfen cihazı psikoloğunuza geri verin.</Text>
          {/* Sonuç psikoloğa gösterilir; puan yorumu klinisyenin işidir */}
          {result && (
            <View style={[styles.resultCard, { borderColor: (result.band?.color ?? colors.cardBorder) + '80' }]}>
              <Text style={styles.resultScore}>{scale.abbreviation}: {result.score}</Text>
              {result.band && <Text style={[styles.resultBand, { color: result.band.color }]}>{result.band.label}</Text>}
              <Text style={styles.resultNote}>Değerlendirmelere kaydedildi · İlerleme grafiğine eklendi{homeworkId ? ' · Ödev tamamlandı' : ''}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={styles.primaryBtnText}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const answered = Object.keys(answers).length;

  return (
    <View style={styles.container}>
      <Header
        title={`${scale.abbreviation} · ${answered}/${scale.items!.length}`}
        onBack={() =>
          Alert.alert('Testten Çık', 'Yanıtlar kaydedilmeden çıkılsın mı?', [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Çık', style: 'destructive', onPress: () => router.back() },
          ])
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.timeFrameNote}>{scale.timeFrame} içinde aşağıdaki sorunlar sizi ne sıklıkla rahatsız etti?</Text>
        {scale.items!.map((item, i) => (
          <View key={i} style={styles.qBlock}>
            <Text style={styles.qLabel}>{i + 1}. {item}</Text>
            <View style={styles.optionsWrap}>
              {scale.responseOptions!.map(opt => {
                const selected = answers[i] === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionChip, selected && styles.optionChipActive]}
                    onPress={() => setAnswers(prev => ({ ...prev, [i]: opt.value }))}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        <TouchableOpacity style={[styles.primaryBtn, { marginTop: spacing.md }]} onPress={submit}>
          <Text style={styles.primaryBtnText}>Testi Tamamla</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backRow}>
        <Icon name="chevron-back" size={22} color={colors.accent} />
        <Text style={styles.back}>Geri</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={{ width: 44 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, paddingTop: safeTop + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backRow: { flexDirection: 'row', alignItems: 'center' },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  headerTitle: { flex: 1, ...typography.h3, textAlign: 'center' },
  content: { padding: spacing.md, paddingBottom: 60 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  gateTitle: { ...typography.h3, marginBottom: spacing.sm, textAlign: 'center' },
  gateText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: spacing.lg },
  primaryBtn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: spacing.lg, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  timeFrameNote: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: '600', marginBottom: spacing.md },
  qBlock: { marginBottom: spacing.md, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  qLabel: { color: colors.text, fontSize: 14, lineHeight: 20, marginBottom: spacing.sm, fontWeight: '500' },
  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  optionChip: { borderRadius: radius.full, paddingHorizontal: spacing.sm + 2, paddingVertical: 7, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.cardBorder },
  optionChipActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  optionText: { fontSize: 13, color: colors.textSecondary },
  optionTextActive: { color: colors.accentLight, fontWeight: '600' },
  resultCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, alignItems: 'center', gap: 4, marginBottom: spacing.lg, alignSelf: 'stretch' },
  resultScore: { ...typography.h2 },
  resultBand: { fontSize: 15, fontWeight: '700' },
  resultNote: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 4 },
});
