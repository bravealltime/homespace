import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { registerPushToken, unregisterPushToken } from './api';

let isInitialized = false;
let currentDeviceToken = null;

/**
 * Initialize Push Notifications on Mobile (Android / iOS)
 * Requests permissions, registers with FCM, and sends token to backend
 *
 * @param {Object} currentUser Currently logged-in member
 * @param {Function} [onNotificationTap] Callback when user clicks the notification banner
 */
export async function initPushNotifications(currentUser, onNotificationTap) {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  if (!currentUser?.id) {
    return;
  }

  try {
    // 1. Check or Request Permissions
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('[PushNotifications] Push notification permission not granted:', permStatus.receive);
      return;
    }

    // 2. Create notification channels on Android (Default + High Priority SOS)
    if (Capacitor.getPlatform() === 'android') {
      await PushNotifications.createChannel({
        id: 'default_channel',
        name: 'การแจ้งเตือนทั่วไป HomeSpace',
        description: 'การแจ้งเตือนกิจกรรม งานบ้าน และโพสต์ในบ้าน',
        importance: 4, // High
        visibility: 1, // Public
        vibration: true,
      }).catch((e) => console.warn('Create default channel warning:', e.message));

      await PushNotifications.createChannel({
        id: 'emergency_channel',
        name: '🚨 สัญญาณเตือนภัยฉุกเฉิน (SOS)',
        description: 'การแจ้งเตือนฉุกเฉินด่วนที่สุด พร้อมเสียงเตือนภัย',
        importance: 5, // Urgent
        visibility: 1, // Public
        vibration: true,
      }).catch((e) => console.warn('Create emergency channel warning:', e.message));
    }

    // 3. Register with Google FCM / Apple APNS
    await PushNotifications.register();

    if (!isInitialized) {
      isInitialized = true;

      // On successful registration -> store token & sync with backend
      PushNotifications.addListener('registration', async (tokenObj) => {
        const token = tokenObj?.value;
        if (!token) return;
        currentDeviceToken = token;
        console.log('[PushNotifications] Registered device token successfully:', token.substring(0, 15) + '...');

        try {
          await registerPushToken(token, currentUser.id, currentUser.familyId || 'family-main');
          console.log('[PushNotifications] Synced device token with server.');
        } catch (err) {
          console.warn('[PushNotifications] Failed to sync token with backend:', err.message);
        }
      });

      // On registration error
      PushNotifications.addListener('registrationError', (error) => {
        console.error('[PushNotifications] Push registration error:', error);
      });

      // When notification arrives while app is in foreground
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[PushNotifications] Push received in foreground:', notification.title, notification.body);
        // Dispatch custom browser event so any open modal or toast can react
        window.dispatchEvent(
          new CustomEvent('homespace:push-received', {
            detail: notification,
          })
        );
      });

      // When user clicks the notification banner
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[PushNotifications] User tapped notification:', action);
        const data = action.notification?.data || {};

        if (typeof onNotificationTap === 'function') {
          onNotificationTap(data);
        }

        window.dispatchEvent(
          new CustomEvent('homespace:push-action', {
            detail: data,
          })
        );
      });
    } else {
      // Re-register token if user changed or re-logged in
      if (currentDeviceToken) {
        registerPushToken(currentDeviceToken, currentUser.id, currentUser.familyId || 'family-main').catch(() => {});
      }
    }
  } catch (err) {
    console.error('[PushNotifications] Initialization error:', err);
  }
}

/**
 * Remove device token on logout
 */
export async function clearPushNotifications() {
  if (!Capacitor.isNativePlatform() || !currentDeviceToken) return;
  try {
    await unregisterPushToken(currentDeviceToken);
    currentDeviceToken = null;
  } catch (err) {
    console.warn('[PushNotifications] Unregister token error:', err.message);
  }
}
