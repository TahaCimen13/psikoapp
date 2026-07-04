import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useDatabase } from '@/contexts/database-context';
import { sendMessage } from '@/lib/claude';
import { generateId } from '@/lib/id';
import { colors, spacing, radius, typography, safeTop } from '@/lib/theme';
import { Icon } from '@/components/ui/Icon';
import type { ChatMessage, Patient } from '@/lib/types';

export default function AIChat() {
  const { settings, patients, addMessage, deleteConversation, getDiagnosesByPatient, getActiveConsent } = useDatabase();
  const router = useRouter();
  const [conversationId] = useState(generateId());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const hasApiKey = !!settings.claude_api_key;

  const send = useCallback(async () => {
    if (!input.trim() || !hasApiKey || loading) return;
    const userText = input.trim();
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

      let patientContext;
      if (selectedPatient) {
        const diagnoses = await getDiagnosesByPatient(selectedPatient.id);
        patientContext = { patient: selectedPatient, diagnoses };
      }

      // Streaming: yanıt geldikçe ekrana yaz
      const reply = await sendMessage(settings.claude_api_key!, history, patientContext, chunk => {
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
  }, [input, hasApiKey, loading, addMessage, conversationId, messages, selectedPatient, settings.claude_api_key]);

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
    Alert.alert('Sohbeti Temizle', 'Tüm mesajlar kalıcı olarak silinecek. Emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Temizle', style: 'destructive', onPress: async () => {
          await deleteConversation(conversationId);
          setMessages([]);
        },
      },
    ]);
  }, [deleteConversation, conversationId]);

  if (!hasApiKey) {
    return (
      <View style={styles.noKeyContainer}>
        <View style={{ marginBottom: spacing.md }}>
          <Icon name="key-outline" size={48} color={colors.textMuted} />
        </View>
        <Text style={styles.noKeyTitle}>API Anahtarı Gerekli</Text>
        <Text style={styles.noKeyDesc}>AI asistanı kullanmak için Ayarlar ekranından Claude API anahtarınızı girin.</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')}>
          <Text style={styles.settingsBtnText}>Ayarlara Git</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>AI Asistan</Text>
          {selectedPatient && (
            <Text style={styles.patientContext}>Bağlam: {selectedPatient.name}</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.contextBtn} onPress={() => setShowPatientPicker(!showPatientPicker)}>
            <Icon name="person-outline" size={13} color={colors.accentLight} />
            <Text style={styles.contextBtnText}>{selectedPatient ? 'Değiştir' : 'Danışan'}</Text>
          </TouchableOpacity>
          {messages.length > 0 && (
            <TouchableOpacity onPress={clearChat} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="trash-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showPatientPicker && (
        <View style={styles.patientPicker}>
          <TouchableOpacity style={styles.patientOption} onPress={() => { setSelectedPatient(null); setShowPatientPicker(false); }}>
            <Text style={styles.patientOptionText}>Danışan bağlamı olmadan devam et</Text>
          </TouchableOpacity>
          {patients.map(p => (
            <TouchableOpacity key={p.id} style={styles.patientOption} onPress={() => selectPatient(p)}>
              <Text style={styles.patientOptionText}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

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
              <Text style={styles.bubbleText}>{streamingText}</Text>
            </View>
          </View>
        )}
        {loading && streamingText.length === 0 && (
          <View style={[styles.bubble, styles.assistantBubble]}>
            <ActivityIndicator color={colors.accent} size="small" />
          </View>
        )}
      </ScrollView>


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
        <TouchableOpacity style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]} onPress={send} disabled={!input.trim() || loading}>
          <Icon name="arrow-up" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
        <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>{message.content}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: spacing.md, paddingTop: safeTop + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  title: { ...typography.h2 },
  patientContext: { ...typography.small, color: colors.accent, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  contextBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accentDim, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  contextBtnText: { color: colors.accentLight, fontSize: 12, fontWeight: '600' },
  patientPicker: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, maxHeight: 200 },
  patientOption: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  patientOptionText: { color: colors.text, fontSize: 14 },
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
  quickActions: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
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
