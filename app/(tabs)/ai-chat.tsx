import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal } from 'react-native';
import { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useDatabase } from '@/contexts/database-context';
import { sendMessage, getAIConfig, type PatientChatContext } from '@/lib/claude';
import { colors, spacing, radius, typography, safeTop } from '@/lib/theme';
import { Icon } from '@/components/ui/Icon';
import type { ChatMessage, Patient } from '@/lib/types';

export default function AIChat() {
  const { settings, patients, addMessage, deleteConversation, getMessages, getDiagnosesByPatient, getSessionsByPatient, getAssessmentsByPatient, getRiskFlagsByPatient, getHomeworkByPatient, getActiveConsent } = useDatabase();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const aiConfig = getAIConfig(settings);
  const hasApiKey = !!aiConfig;

  // Sohbetler kalıcı ve danışan başına ayrı: her danışanın kendi konuşması
  // vardır, geri dönüldüğünde kaldığı yerden devam eder. Genel sohbet de ayrı.
  const conversationId = selectedPatient ? `patient-${selectedPatient.id}` : 'general';

  useEffect(() => {
    getMessages(conversationId).then(setMessages);
  }, [conversationId, getMessages]);

  const send = useCallback(async (overrideText?: string) => {
    const userText = (overrideText ?? input).trim();
    if (!userText || !hasApiKey || loading) return;
    setInput('');

    const userMsg = await addMessage({
      conversation_id: conversationId,
      patient_id: selectedPatient?.id,
      role: 'user',
      content: userText,
    });
    setMessages(prev => [...prev, userMsg]);

    setLoading(true);
    setStreamingText('');
    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

      // Zengin bağlam: tanılar + seans özetleri + testler + riskler + ödevler.
      // Model genel geçer değil, bu danışanın kayıtlarına dayalı yanıt verir.
      let patientContext: PatientChatContext | undefined;
      if (selectedPatient) {
        const [diagnoses, sessions, assessments, riskFlags, homework] = await Promise.all([
          getDiagnosesByPatient(selectedPatient.id),
          getSessionsByPatient(selectedPatient.id),
          getAssessmentsByPatient(selectedPatient.id),
          getRiskFlagsByPatient(selectedPatient.id),
          getHomeworkByPatient(selectedPatient.id),
        ]);
        patientContext = {
          patient: selectedPatient, diagnoses, sessions, assessments, riskFlags,
          pendingHomework: homework.filter(h => h.status === 'pending').map(h => h.title),
        };
      }

      // Streaming: yanıt geldikçe ekrana yaz
      const reply = await sendMessage(aiConfig!, history, patientContext, chunk => {
        setStreamingText(prev => prev + chunk);
      });
      const assistantMsg = await addMessage({
        conversation_id: conversationId,
        patient_id: selectedPatient?.id,
        role: 'assistant',
        content: reply,
      });
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Mesaj gönderilemedi. API anahtarını kontrol edin.');
    } finally {
      setLoading(false);
      setStreamingText('');
    }

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [input, hasApiKey, loading, addMessage, conversationId, messages, selectedPatient, aiConfig, getDiagnosesByPatient, getSessionsByPatient, getAssessmentsByPatient, getRiskFlagsByPatient, getHomeworkByPatient]);

  // KVKK: rızası olmayan danışanın verisi AI bağlamına eklenemez
  const selectPatient = useCallback(async (p: Patient) => {
    const consent = await getActiveConsent(p.id);
    if (!consent) {
      Alert.alert(
        'KVKK Rızası Gerekli',
        `${p.name} için aktif KVKK rızası yok. Danışan verilerinin AI asistana gönderilebilmesi için önce danışan profilinden rıza kaydı alın.`
      );
      return;
    }
    setSelectedPatient(p);
    setShowPatientPicker(false);
  }, [getActiveConsent]);

  const clearChat = useCallback(() => {
    Alert.alert('Sohbeti Temizle', `${selectedPatient ? selectedPatient.name + ' sohbetindeki' : 'Genel sohbetteki'} tüm mesajlar kalıcı olarak silinecek. Emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Temizle', style: 'destructive', onPress: async () => {
          await deleteConversation(conversationId);
          setMessages([]);
        },
      },
    ]);
  }, [deleteConversation, conversationId, selectedPatient]);

  if (!hasApiKey) {
    return (
      <View style={styles.noKeyContainer}>
        <View style={{ marginBottom: spacing.md }}>
          <Icon name="key-outline" size={48} color={colors.textMuted} />
        </View>
        <Text style={styles.noKeyTitle}>API Anahtarı Gerekli</Text>
        <Text style={styles.noKeyDesc}>AI asistanı kullanmak için Ayarlar ekranından bir API anahtarı girin. Test için Gemini'nin ücretsiz katmanını kullanabilirsiniz.</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')}>
          <Text style={styles.settingsBtnText}>Ayarlara Git</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setShowPatientPicker(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>AI Asistan</Text>
          <Text style={styles.patientContext}>
            {selectedPatient ? `Sohbet: ${selectedPatient.name}` : 'Genel sohbet'}
          </Text>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={clearChat} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="trash-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Soldan açılan sohbet menüsü: genel sohbet + TÜM danışanlar (kaydırılabilir) */}
      <Modal visible={showPatientPicker} transparent animationType="fade" onRequestClose={() => setShowPatientPicker(false)}>
        <View style={styles.drawerOverlay}>
          <View style={styles.drawer}>
            <Text style={styles.drawerTitle}>Sohbetler</Text>
            <ScrollView>
              <TouchableOpacity
                style={[styles.drawerRow, !selectedPatient && styles.drawerRowActive]}
                onPress={() => { setSelectedPatient(null); setShowPatientPicker(false); }}
              >
                <View style={styles.drawerAvatar}>
                  <Icon name="chatbubbles-outline" size={16} color={colors.accentLight} />
                </View>
                <Text style={[styles.drawerRowText, !selectedPatient && styles.drawerRowTextActive]}>Genel sohbet</Text>
              </TouchableOpacity>

              <Text style={styles.drawerSection}>Danışanlar</Text>
              {patients.map(p => {
                const active = selectedPatient?.id === p.id;
                return (
                  <TouchableOpacity key={p.id} style={[styles.drawerRow, active && styles.drawerRowActive]} onPress={() => selectPatient(p)}>
                    <View style={styles.drawerAvatar}>
                      <Text style={styles.drawerAvatarText}>{p.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.drawerRowText, active && styles.drawerRowTextActive]} numberOfLines={1}>{p.name}</Text>
                  </TouchableOpacity>
                );
              })}
              {patients.length === 0 && (
                <Text style={styles.drawerEmpty}>Henüz danışan yok.</Text>
              )}
            </ScrollView>
          </View>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowPatientPicker(false)} />
        </View>
      </Modal>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.messages} onContentSizeChange={() => scrollRef.current?.scrollToEnd()}>
        {messages.length === 0 && (
          <View style={styles.welcome}>
            <View style={{ marginBottom: spacing.md }}>
              <Icon name="sparkles-outline" size={44} color={colors.accent} />
            </View>
            <Text style={styles.welcomeTitle}>Psikolog Asistanı</Text>
            <Text style={styles.welcomeDesc}>DSM-5 kriterleri, vaka formülasyonu, psikoeğitim ve terapi planlaması konularında yardımcı olabilirim.</Text>
            <View style={styles.suggestionsRow}>
              {SUGGESTIONS.map((s, i) => (
                <TouchableOpacity key={i} style={styles.suggestion} onPress={() => setInput(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {messages.map(msg => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {loading && streamingText.length > 0 && (
          <View style={[styles.bubbleWrapper, styles.assistantWrapper]}>
            <View style={styles.botIcon}>
              <Icon name="sparkles" size={14} color={colors.accent} />
            </View>
            <View style={[styles.bubble, styles.assistantBubble]}>
              <MarkdownLite text={streamingText} style={styles.bubbleText} />
            </View>
          </View>
        )}
        {loading && streamingText.length === 0 && (
          <View style={[styles.bubble, styles.assistantBubble]}>
            <ActivityIndicator color={colors.accent} size="small" />
          </View>
        )}
      </ScrollView>


      {/* Danışan seçiliyken tek dokunuşluk klinik aksiyonlar */}
      {selectedPatient && !loading && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions} style={styles.quickScroll}>
          {PATIENT_PROMPTS.map((p, i) => (
            <TouchableOpacity key={i} style={styles.quickAction} onPress={() => send(p.prompt)}>
              <Text style={styles.quickActionText}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Mesajınızı yazın..."
          placeholderTextColor={colors.placeholder}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]} onPress={() => send()} disabled={!input.trim() || loading}>
          <Icon name="arrow-up" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Model yanıtlarındaki temel markdown'ı görselleştirir: **kalın**, başlıklar,
// madde işaretleri. Ham ** işaretlerinin ekranda görünmesini engeller.
function MarkdownLite({ text, style }: { text: string; style: object | object[] }) {
  const cleaned = text
    .replace(/^#{1,4}\s+(.+)$/gm, '**$1**')  // başlıklar → kalın satır
    .replace(/^(\s*)[*-]\s+/gm, '$1• ');     // liste işaretleri → •
  const parts = cleaned.split(/\*\*(.+?)\*\*/g);
  return (
    <Text style={style}>
      {parts.map((p, i) => (i % 2 === 1 ? <Text key={i} style={{ fontWeight: '700' }}>{p}</Text> : p))}
    </Text>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleWrapper, isUser ? styles.userWrapper : styles.assistantWrapper]}>
      {!isUser && (
        <View style={styles.botIcon}>
          <Icon name="sparkles" size={14} color={colors.accent} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {isUser ? (
          <Text style={[styles.bubbleText, styles.userBubbleText]}>{message.content}</Text>
        ) : (
          <MarkdownLite text={message.content} style={styles.bubbleText} />
        )}
      </View>
    </View>
  );
}

const SUGGESTIONS = [
  'Majör depresyon kriterleri nelerdir?',
  'BDT vaka formülasyonu nasıl yapılır?',
  'TSSB ile Akut Stres Bozuklugu farkı nedir?',
  'Borderline kişilik için terapi yaklaşımları',
];

// Danışan seçiliyken tek dokunuşla gönderilen hazır istekler.
// Zengin bağlam (seans özetleri, testler, riskler, ödevler) otomatik eklenir.
const PATIENT_PROMPTS: { label: string; prompt: string }[] = [
  { label: '🗓 Seans hazırlığı', prompt: 'Bir sonraki seansa hazırlanmama yardım et: son seanslara ve bekleyen ödevlere göre odak noktaları, sorulacak sorular ve olası müdahaleler öner.' },
  { label: '📈 Durum özeti', prompt: 'Bu danışanın genel durumunu ve gidişatını kayıtlara dayanarak özetle: ilerleme, test skorlarındaki değişim, dikkat çeken noktalar.' },
  { label: '📝 Ödev önerisi', prompt: 'Bu danışanın tanısına ve son seanslarına uygun 3 seans arası ödev öner; her biri için kısa uygulama açıklaması ekle.' },
  { label: '⚠️ Risk değerlendirmesi', prompt: 'Kayıtlardaki risk işaretlerini değerlendir: nelere dikkat etmeliyim, hangi durumda hangi adımı atmalıyım?' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.md, paddingTop: safeTop + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  title: { ...typography.h2 },
  patientContext: { ...typography.small, color: colors.accent, marginTop: 2 },
  menuBtn: { paddingRight: spacing.sm },
  drawerOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.45)' },
  drawer: { width: '78%', maxWidth: 340, backgroundColor: colors.card, paddingTop: safeTop + spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  drawerTitle: { ...typography.h3, marginBottom: spacing.md },
  drawerSection: { ...typography.label, marginTop: spacing.md, marginBottom: spacing.xs },
  drawerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md },
  drawerRowActive: { backgroundColor: colors.accentDim },
  drawerAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accentDim, justifyContent: 'center', alignItems: 'center' },
  drawerAvatarText: { color: colors.accentLight, fontSize: 15, fontWeight: '700' },
  drawerRowText: { flex: 1, color: colors.text, fontSize: 15 },
  drawerRowTextActive: { color: colors.accentLight, fontWeight: '600' },
  drawerEmpty: { color: colors.textMuted, fontSize: 13, padding: spacing.sm },
  messages: { padding: spacing.md, paddingBottom: 20 },
  welcome: { alignItems: 'center', paddingVertical: spacing.xl },
  welcomeTitle: { ...typography.h3, marginBottom: spacing.sm },
  welcomeDesc: { color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg, paddingHorizontal: spacing.md },
  suggestionsRow: { gap: spacing.sm, width: '100%' },
  suggestion: { backgroundColor: colors.card, borderRadius: radius.sm, padding: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  suggestionText: { color: colors.accent, fontSize: 13 },
  bubbleWrapper: { flexDirection: 'row', marginBottom: spacing.sm, alignItems: 'flex-end', gap: spacing.xs },
  userWrapper: { justifyContent: 'flex-end' },
  assistantWrapper: { justifyContent: 'flex-start' },
  botIcon: { marginBottom: 4 },
  bubble: { maxWidth: '80%', borderRadius: radius.md, padding: spacing.sm },
  userBubble: { backgroundColor: colors.accent },
  assistantBubble: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  bubbleText: { color: colors.text, fontSize: 14, lineHeight: 21 },
  userBubbleText: { color: '#fff' },
  // Sabit yükseklik: mesajlar çoğaldığında çiplerin dikeyde ezilmesini önler
  quickScroll: { flexGrow: 0, height: 52 },
  quickActions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm },
  quickAction: { backgroundColor: colors.accentDim, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 8, borderWidth: 1, borderColor: colors.accent + '40' },
  quickActionText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  inputRow: { flexDirection: 'row', padding: spacing.sm, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.cardBorder, backgroundColor: colors.card },
  input: { flex: 1, backgroundColor: colors.inputBg, color: colors.text, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, fontSize: 15, maxHeight: 100, borderWidth: 1, borderColor: colors.cardBorder },
  sendBtn: { backgroundColor: colors.accent, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end' },
  sendBtnDisabled: { opacity: 0.4 },
  noKeyContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  noKeyTitle: { ...typography.h3, marginBottom: spacing.sm },
  noKeyDesc: { color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg },
  settingsBtn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  settingsBtnText: { color: '#fff', fontWeight: '700' },
});
