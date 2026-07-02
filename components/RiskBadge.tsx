import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '@/lib/theme';
import type { RiskFlag } from '@/lib/types';

// Seviye renkleri lib/theme.ts'ten türetilmiştir (sarı için theme'de karşılık
// olmadığından warning tonundan türetilen bir sarı kullanılır).
export const RISK_LEVELS: Record<RiskFlag['level'], { label: string; color: string }> = {
  dusuk: { label: 'Düşük', color: colors.success },
  orta: { label: 'Orta', color: '#ca8a04' },
  yuksek: { label: 'Yüksek', color: colors.warning },
  kritik: { label: 'Kritik', color: colors.error },
};

export const RISK_CATEGORIES: Record<RiskFlag['category'], string> = {
  intihar: 'İntihar',
  siddet: 'Şiddet',
  ihmal: 'İhmal/İstismar',
  madde: 'Madde Kullanımı',
  diger: 'Diğer',
};

export const RISK_LEVEL_ORDER: Record<RiskFlag['level'], number> = {
  dusuk: 0,
  orta: 1,
  yuksek: 2,
  kritik: 3,
};

export function highestRiskFlag<T extends RiskFlag>(flags: T[]): T | null {
  const active = flags.filter(f => !f.resolved);
  if (active.length === 0) return null;
  return active.reduce((max, f) => (RISK_LEVEL_ORDER[f.level] > RISK_LEVEL_ORDER[max.level] ? f : max));
}

export default function RiskBadge({ level, resolved }: { level: RiskFlag['level']; resolved?: boolean }) {
  const info = RISK_LEVELS[level];
  const color = resolved ? colors.textMuted : info.color;
  const isCritical = level === 'kritik' && !resolved;
  return (
    <View style={[styles.badge, { backgroundColor: isCritical ? color : color + '20' }]}>
      <Text style={[styles.badgeText, { color: isCritical ? '#fff' : color }]}>{info.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
