import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { useAuth } from '@/contexts/auth-context';
import { colors, spacing, radius, typography } from '@/lib/theme';
import { testAIConnection } from '@/lib/claude';

export default function Settings() {
  const router = useRouter();
  const { settings, updateSettings } = useDatabase();
  const { hasPIN, setupPIN, removePIN, autoLockMinutes, setAutoLockMinutes } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [aiProvider, setAiProvider] = useState<'claude' | 'gemini'>('claude');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // PIN state
  const [pinEnabled, setPinEnabled] = useState(hasPIN);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPinForm, setShowPinForm] = useState(false);

  useEffect(() => {
    setApiKey(settings.claude_api_key || '');
    setGeminiKey(settings.gemini_api_key || '');
    setAiProvider(settings.ai_provider === 'gemini' ? 'gemini' : 'claude');
    setName(settings.psychologist_name || '');
    setTitle(settings.psychologist_title || '');
  }, [settings]);

  useEffect(() => {
    setPinEnabled(hasPIN);
  }, [hasPIN]);

  const save = async () => {
    setSaving(true);
    await updateSettings({
      ai_provider: aiProvider,
      claude_api_key: apiKey.trim() || undefined,
      gemini_api_key: geminiKey.trim() || undefined,
      psychologist_name: name.trim() || undefined,
      psychologist_title: title.trim() || undefined,
    });
    setSaving(false);
    Alert.alert('Kaydedildi', 'Ayarlar başarıyla güncellendi.');
    router.back();
  };

  // Kaydetmeden, ekranda yazılı anahtarla minimal bir istek atar
  const testConnection = async () => {
    const key = (aiProvider === 'gemini' ? geminiKey : apiKey).trim();
    if (!key) {
      Alert.alert('Anahtar Yok', 'Önce API anahtarını girin.');
      return;
    }
    setTesting(true);
    try {
      const reply = await testAIConnection({ provider: aiProvider, apiKey: key });
      Alert.alert('✓ Bağlantı Başarılı', `Model yanıt verdi:\n\n"${reply.trim().slice(0, 200)}"`);
    } catch (e: any) {
      Alert.alert('Bağlantı Hatası', e.message || 'Bilinmeyen hata.');
    } finally {
      setTesting(false);
    }
  };

  const handlePinToggle = async (val: boolean) => {
    if (val) {
      setShowPinForm(true);
    } else {
      Alert.alert('PIN Kaldır', 'PIN koruması devre dışı bırakılacak.', [
        { text: 'İptal', style: 'cancel', onPress: () => setPinEnabled(true) },
        { text: 'Kaldır', style: 'destructive', onPress: async () => { await removePIN(); setPinEnabled(false); setShowPinForm(false); } },
      ]);
    }
  };

  const savePin = async () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      Alert.alert('Hata', 'PIN 4 haneli rakamdan oluşmalıdır.');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Hata', 'PIN\'ler eşleşmiyor.');
      return;
    }
    await setupPIN(newPin);
    setNewPin('');
    setConfirmPin('');
    setShowPinForm(false);
    Alert.alert('PIN Kuruldu', 'Uygulama bir sonraki açılışta PIN isteyecek.');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ayarlar</Text>
      </View>

      <SectionLabel label="Psikolog Profili" />

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Ad Soyad</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Dr. Ad Soyad" placeholderTextColor={colors.placeholder} />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Unvan</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Klinik Psikolog" placeholderTextColor={colors.placeholder} />
      </View>

      <SectionLabel label="Klinik Araçlar" />

      <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/anamnesis')}>
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleLabel}>📋 Anamnez Formları</Text>
          <Text style={styles.toggleSub}>Danışan öykü formlarını oluştur ve düzenle</Text>
        </View>
        <Text style={styles.linkArrow}>›</Text>
      </TouchableOpacity>

      <SectionLabel label="Güvenlik" />

      <View style={styles.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleLabel}>PIN Kilidi</Text>
          <Text style={styles.toggleSub}>Uygulama açılışında 4 haneli PIN sor</Text>
        </View>
        <Switch
          value={pinEnabled}
          onValueChange={handlePinToggle}
          trackColor={{ false: colors.cardBorder, true: colors.accent }}
          thumbColor="#fff"
        />
      </View>

      {showPinForm && (
        <View style={styles.pinForm}>
          <Text style={styles.pinFormTitle}>Yeni PIN Belirle</Text>
          <TextInput
            style={styles.pinInput}
            value={newPin}
            onChangeText={t => setNewPin(t.replace(/\D/g, '').slice(0, 4))}
            placeholder="Yeni PIN (4 hane)"
            placeholderTextColor={colors.placeholder}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
          />
          <TextInput
            style={styles.pinInput}
            value={confirmPin}
            onChangeText={t => setConfirmPin(t.replace(/\D/g, '').slice(0, 4))}
            placeholder="PIN'i Tekrarla"
            placeholderTextColor={colors.placeholder}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
          />
          <View style={styles.pinActions}>
            <TouchableOpacity onPress={() => { setShowPinForm(false); setPinEnabled(false); setNewPin(''); setConfirmPin(''); }}>
              <Text style={styles.cancelText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pinSaveBtn} onPress={savePin}>
              <Text style={styles.pinSaveBtnText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {pinEnabled && (
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Otomatik Kilit</Text>
            <Text style={styles.toggleSub}>Arka plana geçince PIN iste</Text>
            <View style={styles.autoLockRow}>
              {AUTO_LOCK_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.autoLockChip, autoLockMinutes === opt.value && styles.autoLockChipActive]}
                  onPress={() => setAutoLockMinutes(opt.value)}
                >
                  <Text style={[styles.autoLockChipText, autoLockMinutes === opt.value && styles.autoLockChipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      <SectionLabel label="AI Asistan" />

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>AI Sağlayıcı</Text>
        <View style={styles.providerRow}>
          <TouchableOpacity
            style={[styles.providerBtn, aiProvider === 'claude' && styles.providerBtnActive]}
            onPress={() => setAiProvider('claude')}
          >
            <Text style={[styles.providerText, aiProvider === 'claude' && styles.providerTextActive]}>Claude</Text>
            <Text style={styles.providerSub}>Önerilen · ücretli</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.providerBtn, aiProvider === 'gemini' && styles.providerBtnActive]}
            onPress={() => setAiProvider('gemini')}
          >
            <Text style={[styles.providerText, aiProvider === 'gemini' && styles.providerTextActive]}>Gemini</Text>
            <Text style={styles.providerSub}>Test için · ücretsiz</Text>
          </TouchableOpacity>
        </View>
      </View>

      {aiProvider === 'claude' ? (
        <>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Claude API anahtarınızı Anthropic Console'dan alabilirsiniz. Anahtar yalnızca cihazınızda saklanır, hiçbir yere gönderilmez.</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Claude API Anahtarı</Text>
            <TextInput
              style={styles.input}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="sk-ant-..."
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </>
      ) : (
        <>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Ücretsiz anahtar: aistudio.google.com/apikey adresinden Google hesabıyla alınır, kart gerekmez.</Text>
          </View>
          <View style={styles.warnBox}>
            <Text style={styles.warnText}>⚠️ Gemini'nin ücretsiz katmanında Google, gönderilen içeriği ürünlerini geliştirmek için kullanabilir. Yalnızca TEST verisiyle kullanın; gerçek danışan verisi için Claude'a geçin.</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Gemini API Anahtarı</Text>
            <TextInput
              style={styles.input}
              value={geminiKey}
              onChangeText={setGeminiKey}
              placeholder="AIza..."
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </>
      )}

      <TouchableOpacity style={styles.testBtn} onPress={testConnection} disabled={testing}>
        <Text style={styles.testBtnText}>{testing ? 'Test ediliyor...' : 'Bağlantıyı Test Et'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

const AUTO_LOCK_OPTIONS = [
  { value: 0, label: 'Hemen' },
  { value: 1, label: '1 dk' },
  { value: 5, label: '5 dk' },
  { value: -1, label: 'Kapalı' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg, paddingTop: spacing.lg },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  title: { ...typography.h2 },
  sectionLabel: { ...typography.label, marginTop: spacing.lg, marginBottom: spacing.sm },
  field: { marginBottom: spacing.sm },
  fieldLabel: { ...typography.small, color: colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: colors.inputBg, color: colors.text, borderRadius: radius.md, padding: spacing.sm, fontSize: 15, borderWidth: 1, borderColor: colors.cardBorder },
  toggleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.sm },
  linkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.sm },
  linkArrow: { color: colors.textMuted, fontSize: 20, fontWeight: '600' },
  toggleLabel: { ...typography.body, fontWeight: '600' },
  toggleSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  autoLockRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  autoLockChip: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.cardBorder },
  autoLockChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  autoLockChipText: { fontSize: 12, color: colors.text },
  autoLockChipTextActive: { color: '#fff', fontWeight: '600' },
  pinForm: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.sm, gap: spacing.sm },
  pinFormTitle: { ...typography.label },
  pinInput: { backgroundColor: colors.inputBg, color: colors.text, borderRadius: radius.md, padding: spacing.sm, fontSize: 20, borderWidth: 1, borderColor: colors.cardBorder, textAlign: 'center', letterSpacing: 8 },
  pinActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.lg, marginTop: spacing.xs },
  cancelText: { color: colors.textSecondary, fontSize: 15 },
  pinSaveBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  pinSaveBtnText: { color: '#fff', fontWeight: '700' },
  infoBox: { backgroundColor: colors.accentDim, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.accent + '44' },
  infoText: { color: colors.accentLight, fontSize: 13, lineHeight: 20 },
  warnBox: { backgroundColor: colors.warning + '15', borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.warning + '50' },
  warnText: { color: colors.warning, fontSize: 13, lineHeight: 20 },
  providerRow: { flexDirection: 'row', gap: spacing.sm },
  providerBtn: { flex: 1, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.cardBorder },
  providerBtnActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  providerText: { color: colors.textSecondary, fontWeight: '600', fontSize: 15 },
  providerTextActive: { color: colors.accentLight },
  providerSub: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  testBtn: { borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.accent, marginBottom: spacing.sm },
  testBtnText: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  saveBtn: { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
