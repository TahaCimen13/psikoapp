import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { WebView } from 'react-native-webview';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, typography, safeTop } from '@/lib/theme';
import { Icon } from '@/components/ui/Icon';
import { SCALES, interpretScore } from '@/lib/scales';
import { scaleFormHtml, type FilledInfo } from '@/lib/scalePdf';

// Tamamlanmış testin form görünümü: danışanın seçimleri kâğıt formatın
// üzerinde işaretli. Paylaş butonu aynı içeriği PDF olarak dışa verir.
export default function AssessmentPdfScreen() {
  const { id, assessmentId } = useLocalSearchParams<{ id: string; assessmentId: string }>();
  const router = useRouter();
  const { getPatient, getAssessmentsByPatient } = useDatabase();
  const [html, setHtml] = useState<string | null>(null);
  const [title, setTitle] = useState('Test');
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const build = useCallback(async () => {
    const [patient, list] = await Promise.all([getPatient(id), getAssessmentsByPatient(id)]);
    const assessment = list.find(a => a.id === assessmentId);
    if (!patient || !assessment) { setError('Kayıt bulunamadı.'); return; }

    const scale = SCALES.find(s => assessment.test_name.toUpperCase().includes(s.abbreviation.toUpperCase()));
    if (!scale || !scale.items || !assessment.answers) {
      setError('Bu kayıt için form görünümü yok (madde yanıtları saklanmamış).');
      return;
    }

    let answers: number[];
    try {
      answers = JSON.parse(assessment.answers);
    } catch {
      setError('Yanıt verisi okunamadı.');
      return;
    }

    const score = assessment.score ?? 0;
    const raw = scale.scoreMultiplier ? score / scale.scoreMultiplier : score;
    const band = interpretScore(scale, raw).band;
    const filled: FilledInfo = {
      patientName: patient.name,
      dateStr: assessment.date ?? '',
      answers,
      score,
      bandLabel: band?.label,
      bandColor: band?.color,
    };
    setTitle(`${scale.abbreviation} · ${assessment.date ?? ''}`);
    setHtml(scaleFormHtml(scale, filled));
  }, [id, assessmentId, getPatient, getAssessmentsByPatient]);

  useEffect(() => { build(); }, [build]);

  const sharePdf = async () => {
    if (!html) return;
    setSharing(true);
    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: title });
      }
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'PDF oluşturulamadı.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
          <Icon name="chevron-back" size={22} color={colors.accent} />
          <Text style={styles.back}>Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <TouchableOpacity onPress={sharePdf} disabled={!html || sharing} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="share-outline" size={20} color={html ? colors.accent : colors.textMuted} />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.center}>
          <Icon name="document-outline" size={40} color={colors.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : html ? (
        <WebView style={{ flex: 1, backgroundColor: '#fff' }} source={{ html }} originWhitelist={['*']} />
      ) : (
        <View style={styles.center}><Text style={styles.errorText}>Yükleniyor...</Text></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, paddingTop: safeTop + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  backRow: { flexDirection: 'row', alignItems: 'center' },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  title: { flex: 1, ...typography.h3 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm, padding: spacing.xl },
  errorText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
});
