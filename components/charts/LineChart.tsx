import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Polyline, Line as SvgLine, Circle, Text as SvgText } from 'react-native-svg';
import { colors, spacing } from '@/lib/theme';

export interface ChartPoint {
  /** Kısa eksen etiketi (ör. "12 Oca") */
  label: string;
  value: number;
}

export interface ReferenceLine {
  y: number;
  label?: string;
}

interface LineChartProps {
  points: ChartPoint[];
  height?: number;
  /** Seri rengi (varsayılan: tema accent) */
  color?: string;
  /** Grafiğin çizildiği yüzeyin rengi (nokta halkaları için) */
  surfaceColor?: string;
  yMin?: number;
  yMax?: number;
  /** Klinik eşikler gibi yatay referans çizgileri (veri aralığının dışındakiler çizilmez) */
  referenceLines?: ReferenceLine[];
  emptyText?: string;
}

const PAD_TOP = 22;
const PAD_BOTTOM = 26;
const PAD_LEFT = 30;
const PAD_RIGHT = 14;
const MAX_X_LABELS = 5;
const MAX_VALUE_LABELS = 8;

/** 1-2-5 adımlı "temiz" eksen üst sınırı ve tik adımı */
function niceScale(min: number, max: number): { top: number; step: number } {
  const range = Math.max(max - min, 1);
  const rough = range / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  let step = mag;
  for (const m of [1, 2, 5, 10]) {
    if (mag * m >= rough) { step = mag * m; break; }
  }
  const top = Math.ceil(max / step) * step;
  return { top: top === max ? top + step : top, step };
}

function formatNum(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

export default function LineChart({
  points,
  height = 190,
  color = colors.accent,
  surfaceColor = colors.card,
  yMin,
  yMax,
  referenceLines = [],
  emptyText = 'Gösterilecek veri yok',
}: LineChartProps) {
  const [width, setWidth] = useState(0);

  if (points.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  const values = points.map(p => p.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const lo = yMin !== undefined ? yMin : Math.min(0, dataMin);
  let hi: number;
  let step: number;
  if (yMax !== undefined) {
    hi = yMax;
    step = niceScale(lo, hi - lo <= 0 ? lo + 1 : hi).step;
  } else {
    const nice = niceScale(lo, dataMax <= lo ? lo + 1 : dataMax);
    hi = nice.top;
    step = nice.step;
  }

  const plotW = Math.max(width - PAD_LEFT - PAD_RIGHT, 1);
  const plotH = Math.max(height - PAD_TOP - PAD_BOTTOM, 1);

  const xAt = (i: number) =>
    points.length === 1 ? PAD_LEFT + plotW / 2 : PAD_LEFT + (i / (points.length - 1)) * plotW;
  const yAt = (v: number) => PAD_TOP + plotH - ((v - lo) / (hi - lo)) * plotH;

  // Y ekseni tikleri
  const ticks: number[] = [];
  for (let t = lo; t <= hi + 1e-9; t += step) ticks.push(Math.round(t * 100) / 100);

  // X etiketleri: kalabalıksa seyrelt, ilk ve son her zaman görünsün
  const n = points.length;
  const xStep = Math.max(1, Math.ceil(n / MAX_X_LABELS));
  const showXLabel = (i: number) => i === 0 || i === n - 1 || (i % xStep === 0 && i <= n - 1 - xStep / 2);

  // Değer etiketleri: az noktada hepsi, çok noktada ilk / son / min / maks
  const minIdx = values.indexOf(dataMin);
  const maxIdx = values.indexOf(dataMax);
  const showValueLabel = (i: number) =>
    n <= MAX_VALUE_LABELS || i === 0 || i === n - 1 || i === minIdx || i === maxIdx;

  const coords = points.map((p, i) => ({ x: xAt(i), y: yAt(p.value) }));
  const polyPoints = coords.map(c => `${c.x},${c.y}`).join(' ');
  const areaPath =
    n >= 2
      ? `M ${coords[0].x} ${yAt(lo)} ` +
        coords.map(c => `L ${c.x} ${c.y}`).join(' ') +
        ` L ${coords[n - 1].x} ${yAt(lo)} Z`
      : null;

  const visibleRefs = referenceLines.filter(r => r.y > lo && r.y < hi);

  return (
    <View style={{ height }} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {/* Izgara + Y tik etiketleri */}
          {ticks.map(t => (
            <SvgLine
              key={`grid-${t}`}
              x1={PAD_LEFT}
              y1={yAt(t)}
              x2={width - PAD_RIGHT}
              y2={yAt(t)}
              stroke={t === lo ? colors.cardBorder : colors.divider}
              strokeWidth={1}
            />
          ))}
          {ticks.map(t => (
            <SvgText
              key={`ytick-${t}`}
              x={PAD_LEFT - 6}
              y={yAt(t) + 3.5}
              fontSize={10}
              fill={colors.textMuted}
              textAnchor="end"
            >
              {formatNum(t)}
            </SvgText>
          ))}

          {/* Referans (eşik) çizgileri */}
          {visibleRefs.map((r, ri) => (
            <SvgLine
              key={`ref-${ri}`}
              x1={PAD_LEFT}
              y1={yAt(r.y)}
              x2={width - PAD_RIGHT}
              y2={yAt(r.y)}
              stroke={colors.cardBorder}
              strokeWidth={1}
            />
          ))}
          {visibleRefs.map((r, ri) =>
            r.label ? (
              <SvgText
                key={`reflabel-${ri}`}
                x={width - PAD_RIGHT}
                y={yAt(r.y) - 3}
                fontSize={9}
                fill={colors.textMuted}
                textAnchor="end"
              >
                {r.label}
              </SvgText>
            ) : null
          )}

          {/* Alan dolgusu (~%10 opaklık) ve 2px çizgi */}
          {areaPath && <Path d={areaPath} fill={color} fillOpacity={0.1} />}
          {n >= 2 && (
            <Polyline
              points={polyPoints}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* Noktalar: yüzey halkalı işaretçiler */}
          {coords.map((c, i) => (
            <Circle
              key={`dot-${i}`}
              cx={c.x}
              cy={c.y}
              r={4}
              fill={color}
              stroke={surfaceColor}
              strokeWidth={2}
            />
          ))}

          {/* Seçici değer etiketleri */}
          {coords.map((c, i) =>
            showValueLabel(i) ? (
              <SvgText
                key={`val-${i}`}
                x={c.x}
                y={c.y - 9}
                fontSize={10}
                fontWeight="600"
                fill={colors.textSecondary}
                textAnchor="middle"
              >
                {formatNum(points[i].value)}
              </SvgText>
            ) : null
          )}

          {/* X ekseni etiketleri */}
          {points.map((p, i) =>
            showXLabel(i) ? (
              <SvgText
                key={`xlab-${i}`}
                x={xAt(i)}
                y={height - PAD_BOTTOM + 15}
                fontSize={10}
                fill={colors.textMuted}
                textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
              >
                {p.label}
              </SvgText>
            ) : null
          )}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: 13 },
});
