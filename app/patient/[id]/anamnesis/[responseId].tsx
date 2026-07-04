import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography } from '@/lib/theme';
import { Icon } from '@/components/ui/Icon';
import type { Patient, AnamnesisResponse } from '@/lib/types';

// Doldurulmuş anamnez yanıtı: görüntüleme, PDF export (danışanın "verilerime
// erişme" hakkı) ve silme (danışanın silme talebi — psikolog onayıyla).
export default function AnamnesisResponseView() {
  const { id, responseId } = useLocalSearchParams<{ id: string; responseId: string }>();
  const router = useRouter();
  const { getPatient, getAnamnesisResponse, deleteAnamnesisResponse } = useDatabase();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [response, setResponse] = useState<AnamnesisResponse | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    const [p, r] = await Promise.all([getPatient(id), getAnamnesisResponse(responseId)]);
    setPatient(p);
    setResponse(r);
  }, [id, responseId, getPatient, getAnamnesisResponse]);

  useEffect(() => { load(); }, [load]);

  const answerText = (qid: string): string => {
    const a = response?.answers[qid];
    if (a === undefined || (typeof a === 'string' && !a.trim()) || (Array.isArray(a) && a.length === 0)) return '—';
    if (Array.isArray(a)) return a.join(', ');
    // Tarih tipindeki yanıtlar YYYY-MM-DD saklanır, okunur formata çevir
    if (/^\d{4}-\d{2}-\d{2}$/.test(a)) {
      return new Date(a + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return a;
  };

  const exportPdf = async () => {
    if (!response || !patient) return;
    setExporting(true);
    try {
      const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const filledAt = new Date(response.filled_at).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      let body = '';
      let lastSection = '';
      for (const q of response.questions) {
        if (q.section !== lastSection) {
          body += `<h2>${esc(q.section)}</h2>`;
          lastSection = q.section;
        }
        body += `<div class="qa"><p class="q">${esc(q.label)}</p><p class="a">${esc(answerText(q.id))}</p></div>`;
      }

      const html = `
        <html><head><meta charset="utf-8"><style>
          body { font-family: -apple-system, sans-serif; color: #0F172A; padding: 24px; font-size: 13px; }
          h1 { font-size: 20px; margin-bottom: 2px; }
          .meta { color: #64748B; font-size: 11px; margin-bottom: 20px; }
          h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #4F46E5; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-top: 22px; }
          .qa { margin-bottom: 12px; }
          .q { font-weight: 600; margin: 0 0 2px 0; }
          .a { margin: 0; color: #334155; white-space: pre-wrap; }
          .footer { margin-top: 28px; color: #94A3B8; font-size: 10px; border-top: 1px solid #E2E8F0; padding-top: 8px; }
        </style></head><body>
          <h1>${esc(response.form_name)}</h1>
          <p class="meta">Danışan: ${esc(patient.name)} · Form v${response.form_version} · Doldurulma: ${esc(filledAt)}</p>
          ${body}
          <p class="footer">Bu belge PsikoApp ile oluşturulmuştur. KVKK m.11 kapsamında veri sahibinin erişim hakkı için hazırlanmıştır.</p>
        </body></html>`;

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Anamnez PDF' });
      } else {
        Alert.alert('PDF Hazır', `Dosya oluşturuldu: ${uri}`);
      }
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'PDF oluşturulamadı.');
    } finally {
      setExporting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Yanıtı Sil',
      'Bu anamnez yanıtı kalıcı olarak silinecek. Danışanın silme talebini onaylıyor musunuz? Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => { await deleteAnamnesisResponse(responseId); router.back(); },
        },
      ]
    );
  };

  if (!response || !patient) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
          <Icon name="chevron-back" size={22} color={colors.accent} />
          <Text style={styles.back}>Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{response.form_name}</Text>
        <TouchableOpacity onPress={confirmDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.meta}>
          {patient.name} · v{response.form_version} · {new Date(response.filled_at).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </Text>

        <TouchableOpacity style={styles.exportBtn} onPress={exportPdf} disabled={exporting}>
          <Icon name="download-outline" size={16} color={colors.accent} />
          <Text style={styles.exportBtnText}>{exporting ? 'Hazırlanıyor...' : 'PDF Olarak Dışa Aktar'}</Text>
        </TouchableOpacity>

        {response.questions.map((q, i) => {
          const showSection = i === 0 || response.questions[i - 1].section !== q.section;
          return (
            <View key={q.id}>
              {showSection && <Text style={styles.sectionHeading}>{q.section}</Text>}
              <View style={styles.qaCard}>
                <Text style={styles.qText}>{q.label}</Text>
                <Text style={styles.aText}>{answerText(q.id)}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, paddingTop: spacing.xl + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backRow: { flexDirection: 'row', alignItems: 'center' },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  title: { flex: 1, ...typography.h3 },
  content: { padding: spacing.md, paddingBottom: 40 },
  meta: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.sm },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.accentDim, borderRadius: radius.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.accent + '40', marginBottom: spacing.md },
  exportBtnText: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  sectionHeading: { color: colors.accentLight, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm, marginBottom: spacing.xs },
  qaCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.xs },
  qText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  aText: { color: colors.text, fontSize: 14, lineHeight: 20 },
});
