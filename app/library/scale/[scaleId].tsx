import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, spacing, radius, typography, safeTop } from '@/lib/theme';
import { Icon } from '@/components/ui/Icon';
import { getScale } from '@/lib/scales';

// Ölçek referans kartı: puanlama, kesme noktaları, klinik notlar ve
// (kamu malıysa) madde metinleri.
export default function ScaleDetail() {
  const { scaleId } = useLocalSearchParams<{ scaleId: string }>();
  const router = useRouter();
  const scale = getScale(scaleId);

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
});
