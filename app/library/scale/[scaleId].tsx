import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography, safeTop } from '@/lib/theme';
import { Icon } from '@/components/ui/Icon';
import { getScale, isFillable } from '@/lib/scales';
import type { Patient } from '@/lib/types';

// Ölçek referans kartı: puanlama, kesme noktaları, klinik notlar ve
// (kamu malıysa) madde metinleri.
export default function ScaleDetail() {
  const { scaleId } = useLocalSearchParams<{ scaleId: string }>();
  const router = useRouter();
  const scale = getScale(scaleId);
  const { patients, addHomework } = useDatabase();
  // Danışan seçici: 'odev' = ödev olarak ata, 'doldur' = uygulamada doldurt
  const [pickerMode, setPickerMode] = useState<'odev' | 'doldur' | null>(null);
  const [printing, setPrinting] = useState(false);

  const assignHomework = async (p: Patient) => {
    if (!scale) return;
    await addHomework({
      patient_id: p.id,
      title: `${scale.abbreviation} doldur`,
      description: `${scale.name} — ${scale.purpose}`,
      status: 'pending',
    });
    setPickerMode(null);
    Alert.alert('Ödev Atandı', `${p.name} için "${scale.abbreviation} doldur" ödevi oluşturuldu.${isFillable(scale) ? '\n\nÖdevler ekranından "Uygulamada Doldur" ile cihaz üzerinde çözdürülebilir.' : ''}`);
  };

  const startFill = (p: Patient) => {
    if (!scale) return;
    setPickerMode(null);
    router.push(`/patient/${p.id}/scale/${scale.id}`);
  };

  // Kâğıt uygulama için çıktı: maddeler + boş yanıt kutuları
  const printPdf = async () => {
    if (!scale?.items || !scale.responseOptions) return;
    setPrinting(true);
    try {
      const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const optHeads = scale.responseOptions.map(o => `<th>${esc(o.label)}<br/>(${o.value})</th>`).join('');
      const rows = scale.items.map((item, i) =>
        `<tr><td class="q">${i + 1}. ${esc(item)}</td>${scale.responseOptions!.map(() => '<td class="c">☐</td>').join('')}</tr>`
      ).join('');
      const html = `
        <html><head><meta charset="utf-8"><style>
          body { font-family: -apple-system, sans-serif; color: #0F172A; padding: 24px; font-size: 12px; }
          h1 { font-size: 17px; margin-bottom: 2px; }
          .meta { color: #64748B; font-size: 11px; margin-bottom: 14px; }
          .who { margin-bottom: 14px; font-size: 12px; }
          .who span { display: inline-block; min-width: 200px; border-bottom: 1px solid #94A3B8; margin-left: 4px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-size: 11px; }
          td.q { text-align: left; font-size: 12px; }
          td.c { font-size: 14px; width: 52px; }
          .footer { margin-top: 16px; color: #94A3B8; font-size: 10px; }
        </style></head><body>
          <h1>${esc(scale.name)} (${esc(scale.abbreviation)})</h1>
          <p class="meta">${esc(scale.timeFrame)} düşünülerek yanıtlanır · ${scale.items.length} madde</p>
          <p class="who">Ad Soyad: <span></span> &nbsp; Tarih: <span style="min-width:100px"></span></p>
          <table><tr><th style="text-align:left">Madde</th>${optHeads}</tr>${rows}</table>
          <p class="footer">PsikoApp ile hazırlanmıştır. Puanlama: ${esc(scale.scoring)}</p>
        </body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: `${scale.abbreviation} formu` });
      }
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'PDF oluşturulamadı.');
    } finally {
      setPrinting(false);
    }
  };

  if (!scale) {
    return (
      <View style={styles.container}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 60 }}>Ölçek bulunamadı.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
          <Icon name="chevron-back" size={22} color={colors.accent} />
          <Text style={styles.back}>Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{scale.abbreviation}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.name}>{scale.name}</Text>
        <Text style={styles.purpose}>{scale.purpose}</Text>

        <View style={styles.metaRow}>
          <MetaItem icon="list-outline" label={`${scale.itemCount} madde`} />
          <MetaItem icon="time-outline" label={scale.durationMin} />
          <MetaItem icon="calendar-outline" label={scale.timeFrame} />
        </View>

        {/* Aksiyonlar: ödev ata / uygulamada doldurt / kâğıt çıktısı */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setPickerMode('odev')}>
            <Icon name="clipboard-outline" size={16} color={colors.accent} />
            <Text style={styles.actionText}>Ödev Ata</Text>
          </TouchableOpacity>
          {isFillable(scale) && (
            <>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setPickerMode('doldur')}>
                <Icon name="phone-portrait-outline" size={16} color={colors.accent} />
                <Text style={styles.actionText}>Uygulamada Doldurt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={printPdf} disabled={printing}>
                <Icon name="print-outline" size={16} color={colors.accent} />
                <Text style={styles.actionText}>{printing ? '...' : 'PDF Çıktısı'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Section title="Puanlama">
          <Text style={styles.body}>{scale.scoring}</Text>
        </Section>

        <Section title="Kesme Noktaları">
          {scale.cutoffs.map((c, i) => (
            <View key={i} style={styles.cutoffRow}>
              <View style={[styles.cutoffDot, { backgroundColor: c.color }]} />
              <Text style={styles.cutoffRange}>{c.range}</Text>
              <Text style={[styles.cutoffLabel, { color: c.color }]}>{c.label}</Text>
            </View>
          ))}
        </Section>

        {scale.notes && (
          <Section title="Klinik Notlar">
            <Text style={styles.body}>{scale.notes}</Text>
          </Section>
        )}

        {scale.items ? (
          <Section title={`Maddeler (${scale.items.length})`}>
            {scale.responseAnchors && <Text style={styles.anchors}>{scale.responseAnchors}</Text>}
            {scale.items.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemNum}>{i + 1}.</Text>
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </Section>
        ) : (
          <View style={styles.copyrightBox}>
            <Icon name="lock-closed-outline" size={16} color={colors.textMuted} />
            <Text style={styles.copyrightText}>
              {scale.publicDomain
                ? 'Madde metinleri için ölçeğin Türkçe geçerlik çalışması yapılmış formunu edinin.'
                : 'Bu ölçek teliflidir; madde metinleri uygulamada yer almaz. Ölçeği yasal yoldan edinerek uygulayın.'}
            </Text>
          </View>
        )}

        <Text style={styles.disclaimer}>
          Bu kart klinik başvuru amaçlıdır; kesme puanları örnekleme göre değişebilir, tanı tek başına ölçek puanıyla konmaz.
        </Text>
      </ScrollView>

      {/* Danışan seçici */}
      <Modal visible={pickerMode !== null} transparent animationType="fade" onRequestClose={() => setPickerMode(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setPickerMode(null)}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>
              {pickerMode === 'odev' ? 'Kime ödev verilecek?' : 'Kim dolduracak?'}
            </Text>
            <ScrollView style={{ maxHeight: 380 }}>
              {patients.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.pickerRow}
                  onPress={() => (pickerMode === 'odev' ? assignHomework(p) : startFill(p))}
                >
                  <View style={styles.pickerAvatar}>
                    <Text style={styles.pickerAvatarText}>{p.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.pickerName}>{p.name}</Text>
                </TouchableOpacity>
              ))}
              {patients.length === 0 && <Text style={styles.pickerEmpty}>Henüz danışan yok.</Text>}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function MetaItem({ icon, label }: { icon: React.ComponentProps<typeof Icon>['name']; label: string }) {
  return (
    <View style={styles.metaItem}>
      <Icon name={icon} size={14} color={colors.textSecondary} />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, paddingTop: safeTop + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backRow: { flexDirection: 'row', alignItems: 'center' },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  headerTitle: { flex: 1, ...typography.h3, textAlign: 'center' },
  content: { padding: spacing.md, paddingBottom: 48 },
  name: { ...typography.h2, marginBottom: spacing.xs },
  purpose: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginBottom: spacing.md },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: colors.textSecondary, fontSize: 13 },
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.label, marginBottom: spacing.xs },
  sectionCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  body: { color: colors.text, fontSize: 14, lineHeight: 21 },
  cutoffRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 5 },
  cutoffDot: { width: 10, height: 10, borderRadius: 5 },
  cutoffRange: { color: colors.text, fontSize: 14, fontWeight: '600', width: 110 },
  cutoffLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  anchors: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', gap: spacing.xs, paddingVertical: 4 },
  itemNum: { color: colors.textMuted, fontSize: 14, width: 22 },
  itemText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
  copyrightBox: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.md },
  copyrightText: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  disclaimer: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: spacing.sm },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.accentDim, borderRadius: radius.md, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.accent + '40' },
  actionText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  pickerModal: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md },
  pickerTitle: { ...typography.h3, marginBottom: spacing.sm },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  pickerAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accentDim, justifyContent: 'center', alignItems: 'center' },
  pickerAvatarText: { color: colors.accentLight, fontSize: 15, fontWeight: '700' },
  pickerName: { color: colors.text, fontSize: 15 },
  pickerEmpty: { color: colors.textMuted, padding: spacing.md, textAlign: 'center' },
});
