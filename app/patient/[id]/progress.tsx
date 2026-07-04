import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography, safeTop } from '@/lib/theme';
import LineChart, { ChartPoint, ReferenceLine } from '@/components/charts/LineChart';
import type { Assessment, Session } from '@/lib/types';

// Bilinen ölçekler için klinik şiddet bantları (üst sınır dahil değil; son bant açık uçlu).
// Bu ölçeklerde skorun DÜŞMESİ iyileşme demektir.
interface Band { min: number; label: string }
const CLINICAL_BANDS: { match: string; max: number; bands: Band[] }[] = [
  {
    match: 'PHQ-9', max: 27,
    bands: [
      { min: 0, label: 'Minimal' }, { min: 5, label: 'Hafif' }, { min: 10, label: 'Orta' },
      { min: 15, label: 'Orta-Şiddetli' }, { min: 20, label: 'Şiddetli' },
    ],
  },
  {
    match: 'GAD-7', max: 21,
    bands: [
      { min: 0, label: 'Minimal' }, { min: 5, label: 'Hafif' }, { min: 10, label: 'Orta' }, { min: 15, label: 'Şiddetli' },
    ],
  },
  {
    match: 'BDI', max: 63,
    bands: [
      { min: 0, label: 'Minimal' }, { min: 14, label: 'Hafif' }, { min: 20, label: 'Orta' }, { min: 29, label: 'Şiddetli' },
    ],
  },
  {
    match: 'BAI', max: 63,
    bands: [
      { min: 0, label: 'Minimal' }, { min: 8, label: 'Hafif' }, { min: 16, label: 'Orta' }, { min: 26, label: 'Şiddetli' },
    ],
  },
];

function clinicalInfo(testName: string) {
  return CLINICAL_BANDS.find(c => testName.toUpperCase().includes(c.match)) ?? null;
}

function bandLabel(testName: string, score: number): string | null {
  const info = clinicalInfo(testName);
  if (!info) return null;
  let current: Band | null = null;
  for (const b of info.bands) {
    if (score >= b.min) current = b;
  }
  return current?.label ?? null;
}

function shortDate(dateStr?: string): string {
  if (!dateStr) return '?';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr.slice(0, 6);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export default function ProgressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getAssessmentsByPatient, getSessionsByPatient } = useDatabase();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [a, s] = await Promise.all([getAssessmentsByPatient(id), getSessionsByPatient(id)]);
    setAssessments(a);
    setSessions(s);
  }, [id, getAssessmentsByPatient, getSessionsByPatient]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Skoru olan değerlendirmeleri test adına göre grupla (tarih artan)
  const byTest = useMemo(() => {
    const map = new Map<string, Assessment[]>();
    for (const a of assessments) {
      if (a.score === undefined || a.score === null) continue;
      const list = map.get(a.test_name) ?? [];
      list.push(a);
      map.set(a.test_name, list);
    }
    for (const list of map.values()) {
      list.sort((x, y) => (x.date ?? '').localeCompare(y.date ?? ''));
    }
    return map;
  }, [assessments]);

  const testNames = useMemo(
    () => [...byTest.entries()].sort((a, b) => b[1].length - a[1].length).map(([name]) => name),
    [byTest]
  );

  const activeTest = selectedTest && byTest.has(selectedTest) ? selectedTest : testNames[0] ?? null;
  const activeData = activeTest ? byTest.get(activeTest)! : [];

  const scorePoints: ChartPoint[] = activeData.map(a => ({ label: shortDate(a.date), value: a.score! }));
  const activeInfo = activeTest ? clinicalInfo(activeTest) : null;
  const refLines: ReferenceLine[] = activeInfo
    ? activeInfo.bands.filter(b => b.min > 0).map(b => ({ y: b.min, label: b.label }))
    : [];

  const first = activeData[0]?.score;
  const last = activeData[activeData.length - 1]?.score;
  const change = first !== undefined && last !== undefined && activeData.length > 1 ? last - first : null;
  // Bu ölçeklerde düşüş iyileşmedir; bilinmeyen testlerde nötr renk kullan
  const changeColor = change === null ? colors.textMuted
    : activeInfo ? (change < 0 ? colors.success : change > 0 ? colors.error : colors.textMuted)
    : colors.textSecondary;
  const lastBand = activeTest && last !== undefined ? bandLabel(activeTest, last) : null;

  const moodPoints: ChartPoint[] = useMemo(() =>
    [...sessions]
      .filter(s => s.mood_rating !== undefined && s.mood_rating !== null)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(s => ({ label: shortDate(s.date), value: s.mood_rating! })),
    [sessions]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Geri</Text></TouchableOpacity>
        <Text style={styles.title}>Klinik İlerleme</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Test Skorları</Text>
        {testNames.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>📈</Text>
            <Text style={styles.emptyText}>Henüz skorlu değerlendirme yok</Text>
            <Text style={styles.emptyHint}>Değerlendirmeler ekranından test sonucu ekleyin</Text>
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {testNames.map(name => (
                <TouchableOpacity
                  key={name}
                  style={[styles.chip, activeTest === name && styles.chipActive]}
                  onPress={() => setSelectedTest(name)}
                >
                  <Text style={[styles.chipText, activeTest === name && styles.chipTextActive]} numberOfLines={1}>
                    {name.length > 28 ? name.slice(0, 26) + '…' : name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{last ?? '-'}</Text>
                <Text style={styles.statLabel}>Son Skor</Text>
                {lastBand && <Text style={styles.bandText}>{lastBand}</Text>}
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: changeColor }]}>
                  {change === null ? '—' : `${change > 0 ? '↑ +' : change < 0 ? '↓ ' : ''}${change}`}
                </Text>
                <Text style={styles.statLabel}>İlk Skora Göre</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{activeData.length}</Text>
                <Text style={styles.statLabel}>Ölçüm</Text>
              </View>
            </View>

            <View style={styles.chartCard}>
              <LineChart
                points={scorePoints}
                yMin={0}
                yMax={activeInfo?.max}
                referenceLines={refLines}
                emptyText="Bu test için skor kaydı yok"
              />
            </View>
            {activeData.length === 1 && (
              <Text style={styles.hint}>Trend görmek için aynı testi farklı tarihlerde tekrar uygulayın.</Text>
            )}
          </>
        )}

        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Seans Duygu Durumu (1-10)</Text>
        {moodPoints.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Seanslarda duygu durumu kaydedilmemiş</Text>
            <Text style={styles.emptyHint}>Yeni seans oluştururken duygu durumu puanı girin</Text>
          </View>
        ) : (
          <View style={styles.chartCard}>
            <LineChart points={moodPoints} yMin={0} yMax={10} color={colors.success} emptyText="" />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, paddingTop: safeTop + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  title: { flex: 1, ...typography.h3 },
  content: { padding: spacing.md, paddingBottom: 32 },
  sectionTitle: { ...typography.label, marginBottom: spacing.sm },
  chipRow: { gap: spacing.sm, paddingBottom: spacing.sm },
  chip: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, maxWidth: 220 },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 13, color: colors.text },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.text },
  statLabel: { ...typography.small, fontSize: 11, marginTop: 2, textAlign: 'center' },
  bandText: { color: colors.accent, fontSize: 11, fontWeight: '600', marginTop: 2 },
  chartCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  hint: { ...typography.small, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },
  empty: { alignItems: 'center', padding: spacing.lg, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder },
  emptyText: { color: colors.textSecondary, fontSize: 14 },
  emptyHint: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});
