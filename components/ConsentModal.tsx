import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors, spacing, radius, typography } from '@/lib/theme';
import { KVKK_CONSENT_TEXT, KVKK_CONSENT_VERSION } from '@/lib/consent';
import type { KvkkConsent } from '@/lib/types';

interface Props {
  visible: boolean;
  patientName: string;
  consent: KvkkConsent | null; // aktif rıza (varsa)
  onClose: () => void;
  onConsent: () => Promise<void> | void;
  onRevoke: () => Promise<void> | void;
}

export default function ConsentModal({ visible, patientName, consent, onClose, onConsent, onRevoke }: Props) {
  const confirmRevoke = () => {
    Alert.alert(
      'Rızayı Geri Çek',
      'Rıza geri çekilirse bu danışanın verileri AI asistana gönderilemez. Onay kaydı denetim izi için saklanır.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Geri Çek', style: 'destructive', onPress: async () => { await onRevoke(); onClose(); } },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>KVKK Açık Rıza — {patientName}</Text>

          {consent ? (
            <View style={styles.statusOk}>
              <Text style={styles.statusOkText}>
                ✓ Onaylandı · v{consent.version} · {new Date(consent.consented_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          ) : (
            <View style={styles.statusMissing}>
              <Text style={styles.statusMissingText}>⚠️ Bu danışan için aktif rıza kaydı yok</Text>
            </View>
          )}

          <ScrollView style={styles.textBox}>
            <Text style={styles.consentText}>{KVKK_CONSENT_TEXT}</Text>
          </ScrollView>

          <Text style={styles.hint}>
            Danışana metni okutup/okuyup sözlü veya yazılı onayını aldıktan sonra kaydedin. Onay tarihi ve metin versiyonu loglanır.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Kapat</Text>
            </TouchableOpacity>
            {consent ? (
              <TouchableOpacity style={styles.revokeBtn} onPress={confirmRevoke}>
                <Text style={styles.revokeBtnText}>Rızayı Geri Çek</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.consentBtn}
                onPress={async () => { await onConsent(); onClose(); }}
              >
                <Text style={styles.consentBtnText}>Danışan Onayladı (v{KVKK_CONSENT_VERSION})</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, maxHeight: '88%' },
  title: { ...typography.h3, marginBottom: spacing.sm },
  statusOk: { backgroundColor: colors.success + '18', borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.success + '50' },
  statusOkText: { color: colors.success, fontSize: 13, fontWeight: '600' },
  statusMissing: { backgroundColor: colors.warning + '18', borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.warning + '50' },
  statusMissingText: { color: colors.warning, fontSize: 13, fontWeight: '600' },
  textBox: { backgroundColor: colors.background, borderRadius: radius.sm, padding: spacing.sm, maxHeight: 300, borderWidth: 1, borderColor: colors.cardBorder },
  consentText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm, lineHeight: 17 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing.lg, marginTop: spacing.md },
  cancelText: { color: colors.textSecondary, fontSize: 15 },
  consentBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  consentBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  revokeBtn: { backgroundColor: colors.error, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  revokeBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
