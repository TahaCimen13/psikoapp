import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback, useEffect, useRef } from 'react';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import Constants from 'expo-constants';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography, safeTop } from '@/lib/theme';
import { AYDINLATMA_TEXT, AYDINLATMA_VERSION, RIZA_SENTENCE, RIZA_VERSION, RIZA_REJECT_INFO } from '@/lib/consent';
import type { Patient, KvkkConsent } from '@/lib/types';

// KVKK 2026/347: aydınlatma ve açık rıza AYRI sayfalarda gösterilir.
// Adım 1 (aydınlatma) yalnızca bilgilendirmedir, onay kutusu içermez;
// metin sonuna kadar kaydırılmadan "Devam Et" aktifleşmez.
// Adım 2 (açık rıza) tek net cümle + onay kutusu ile ayrıca alınır.
type Step = 'aydinlatma' | 'riza';

export default function ConsentFlowScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getPatient, getActiveConsent, recordConsent, revokeConsent } = useDatabase();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [consent, setConsent] = useState<KvkkConsent | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState<Step>('aydinlatma');
  const [readToEnd, setReadToEnd] = useState(false);
  const [checked, setChecked] = useState(false);
  const contentHeight = useRef(0);
  const viewHeight = useRef(0);

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([getPatient(id), getActiveConsent(id)]);
    setPatient(p);
    setConsent(c);
    setLoaded(true);
  }, [id, getPatient, getActiveConsent]);

  useEffect(() => { load(); }, [load]);

  // Metin ekrandan kısaysa kaydırma gerekmez → doğrudan okundu say
  const maybeMarkShortContent = () => {
    if (contentHeight.current > 0 && viewHeight.current > 0 && contentHeight.current <= viewHeight.current + 8) {
      setReadToEnd(true);
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 24) {
      setReadToEnd(true);
    }
  };

  const deviceInfo = `${Constants.deviceName ?? 'Bilinmeyen cihaz'} · ${Platform.OS} ${Platform.Version}`;

  const accept = async () => {
    await recordConsent(id, RIZA_VERSION, AYDINLATMA_VERSION, deviceInfo);
    Alert.alert('Rıza Kaydedildi', `Açık rıza v${RIZA_VERSION} (aydınlatma v${AYDINLATMA_VERSION}) tarih ve cihaz bilgisiyle loglandı.`, [
      { text: 'Tamam', onPress: () => router.back() },
    ]);
  };

  const reject = () => {
    Alert.alert('Rıza Verilmedi', RIZA_REJECT_INFO, [
      { text: 'Tamam', onPress: () => router.back() },
    ]);
  };

  const confirmRevoke = () => {
    Alert.alert(
      'Rızayı Geri Çek',
      'Rıza geri çekilirse bu danışanın verileri AI asistana gönderilemez. Onay kaydı denetim izi için saklanır.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Geri Çek', style: 'destructive', onPress: async () => { await revokeConsent(id); router.back(); } },
      ]
    );
  };

  if (!loaded || !patient) return <View style={styles.container} />;

  // --- Aktif rıza varsa: durum ekranı ---
  if (consent) {
    return (
      <View style={styles.container}>
        <Header title="KVKK Rıza Durumu" onBack={() => router.back()} />
        <View style={styles.content}>
          <View style={styles.statusOk}>
            <Text style={styles.statusOkTitle}>✓ Açık rıza mevcut — {patient.name}</Text>
            <Text style={styles.statusDetail}>Rıza metni: v{consent.version}</Text>
            {consent.disclosure_version ? <Text style={styles.statusDetail}>Aydınlatma metni: v{consent.disclosure_version}</Text> : null}
            <Text style={styles.statusDetail}>
              Tarih: {new Date(consent.consented_at).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
            {consent.device_info ? <Text style={styles.statusDetail}>Cihaz: {consent.device_info}</Text> : null}
          </View>
          <Text style={styles.hint}>
            Bu kayıt denetim izi niteliğindedir; geri çekilse dahi silinmez, geri çekilme tarihiyle birlikte saklanır.
          </Text>
          <TouchableOpacity style={styles.revokeBtn} onPress={confirmRevoke}>
            <Text style={styles.revokeBtnText}>Rızayı Geri Çek</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Adım 1: Aydınlatma metni (sadece bilgilendirme, onay yok) ---
  if (step === 'aydinlatma') {
    return (
      <View style={styles.container}>
        <Header title="Adım 1/2 · Aydınlatma" onBack={() => router.back()} />
        <ScrollView
          style={styles.textScroll}
          onScroll={onScroll}
          scrollEventThrottle={100}
          onContentSizeChange={(_, h) => { contentHeight.current = h; maybeMarkShortContent(); }}
          onLayout={e => { viewHeight.current = e.nativeEvent.layout.height; maybeMarkShortContent(); }}
        >
          <Text style={styles.consentText}>{AYDINLATMA_TEXT}</Text>
          <View style={{ height: spacing.lg }} />
        </ScrollView>
        <View style={styles.footer}>
          {!readToEnd && <Text style={styles.scrollHint}>Devam etmek için metni sonuna kadar okuyun ↓</Text>}
          <TouchableOpacity
            style={[styles.primaryBtn, !readToEnd && styles.btnDisabled]}
            disabled={!readToEnd}
            onPress={() => setStep('riza')}
          >
            <Text style={styles.primaryBtnText}>Devam Et</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Adım 2: Açık rıza (ayrı sayfa, tek cümle + onay kutusu) ---
  return (
    <View style={styles.container}>
      <Header title="Adım 2/2 · Açık Rıza" onBack={() => setStep('aydinlatma')} />
      <ScrollView style={styles.textScroll} contentContainerStyle={{ paddingBottom: spacing.lg }}>
        <Text style={styles.rizaHeading}>AÇIK RIZA BEYANI (v{RIZA_VERSION}) — {patient.name}</Text>
        <View style={styles.rizaBox}>
          <Text style={styles.rizaSentence}>{RIZA_SENTENCE}</Text>
        </View>

        <TouchableOpacity style={styles.checkRow} onPress={() => setChecked(v => !v)}>
          <View style={[styles.checkbox, checked && styles.checkboxOn]}>
            {checked ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.checkLabel}>Yukarıdaki beyanı okudum, anladım ve kabul ediyorum.</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>{RIZA_REJECT_INFO}</Text>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.rejectBtn} onPress={reject}>
          <Text style={styles.rejectBtnText}>Rıza Vermiyorum</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, { flex: 1 }, !checked && styles.btnDisabled]}
          disabled={!checked}
          onPress={accept}
        >
          <Text style={styles.primaryBtnText}>Kabul Ediyorum</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack}><Text style={styles.back}>← Geri</Text></TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={{ width: 44 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, paddingTop: safeTop + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  title: { ...typography.h3 },
  content: { padding: spacing.md },
  textScroll: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  consentText: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', padding: spacing.md, paddingBottom: spacing.lg, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  scrollHint: { color: colors.textMuted, fontSize: 12, width: '100%', textAlign: 'center', marginBottom: 4 },
  primaryBtn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center', flexGrow: 1 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.35 },
  rejectBtn: { borderRadius: radius.md, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  rejectBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  rizaHeading: { ...typography.label, marginBottom: spacing.sm },
  rizaBox: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.accent + '60', marginBottom: spacing.md },
  rizaSentence: { color: colors.text, fontSize: 15, lineHeight: 24, fontWeight: '500' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.accent, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  checkboxOn: { backgroundColor: colors.accent },
  checkmark: { color: '#fff', fontWeight: '800', fontSize: 14 },
  checkLabel: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
  hint: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: spacing.sm },
  statusOk: { backgroundColor: colors.success + '15', borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.success + '50', gap: 4 },
  statusOkTitle: { color: colors.success, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  statusDetail: { color: colors.textSecondary, fontSize: 13 },
  revokeBtn: { backgroundColor: colors.error, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center', marginTop: spacing.lg },
  revokeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
