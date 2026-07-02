import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Randevu hatırlatmaları için lokal bildirim yardımcıları.
// Not: Expo Go'da (özellikle Android'de) lokal bildirim kısıtları olabilir;
// bu yüzden tüm çağrılar hata fırlatmak yerine sessizce devam eder (console.warn).

export const DEFAULT_REMINDER_MINUTES = 60;

const CHANNEL_ID = 'appointments';

let handlerConfigured = false;
let channelConfigured = false;

function configureHandler() {
  if (handlerConfigured) return;
  handlerConfigured = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.warn('Bildirim işleyicisi ayarlanamadı:', e);
  }
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android' || channelConfigured) return;
  channelConfigured = true;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Randevu Hatırlatmaları',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  } catch (e) {
    console.warn('Bildirim kanalı oluşturulamadı:', e);
  }
}

/** Bildirim iznini kontrol eder, yoksa kullanıcıdan ister. */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return true;
    }
    if (!current.canAskAgain) return false;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  } catch (e) {
    console.warn('Bildirim izni alınamadı (Expo Go kısıtı olabilir):', e);
    return false;
  }
}

/**
 * Randevudan `minutesBefore` dakika önce lokal hatırlatma planlar.
 * Bildirim identifier'ı olarak appointment.id kullanılır; böylece iptal için
 * ayrıca bir id saklamaya gerek kalmaz.
 */
export async function scheduleAppointmentReminder(
  appointment: { id: string; date: string },
  patientName: string,
  minutesBefore: number = DEFAULT_REMINDER_MINUTES,
): Promise<boolean> {
  try {
    configureHandler();
    const granted = await requestNotificationPermissions();
    if (!granted) return false;
    await ensureAndroidChannel();

    const appointmentDate = new Date(appointment.date);
    const triggerDate = new Date(appointmentDate.getTime() - minutesBefore * 60 * 1000);
    if (Number.isNaN(triggerDate.getTime()) || triggerDate.getTime() <= Date.now()) return false;

    const timeStr = appointmentDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    await Notifications.scheduleNotificationAsync({
      identifier: appointment.id,
      content: {
        title: 'Yaklaşan Randevu',
        body: `${patientName} ile saat ${timeStr} randevunuz var (${minutesBefore} dk kaldı)`,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
    });
    return true;
  } catch (e) {
    console.warn('Randevu bildirimi planlanamadı (Expo Go kısıtı olabilir):', e);
    return false;
  }
}

/** Randevu silindiğinde/iptal edildiğinde planlanmış bildirimi kaldırır. */
export async function cancelAppointmentReminder(appointmentId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(appointmentId);
  } catch (e) {
    console.warn('Randevu bildirimi iptal edilemedi:', e);
  }
}
