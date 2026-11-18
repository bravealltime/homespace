import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseApp = null;
let initAttempted = false;

/**
 * Initialize Firebase Admin SDK using Service Account
 */
export function initFirebase() {
  if (firebaseApp) return firebaseApp;
  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0];
    return firebaseApp;
  }
  if (initAttempted) return null;
  initAttempted = true;

  try {
    let serviceAccount = null;

    // 1. Check environment variable (JSON string)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (err) {
        console.warn('[PushService] Invalid JSON in FIREBASE_SERVICE_ACCOUNT env:', err.message);
      }
    }

    // 2. Check environment variable (File path)
    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const p = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      if (fs.existsSync(p)) {
        serviceAccount = JSON.parse(fs.readFileSync(p, 'utf-8'));
      }
    }

    // 3. Check default local path: server/firebase-service-account.json
    if (!serviceAccount) {
      const defaultPath = path.join(__dirname, 'firebase-service-account.json');
      if (fs.existsSync(defaultPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(defaultPath, 'utf-8'));
      }
    }

    if (!serviceAccount) {
      console.log('[PushService] Firebase service account not found.');
      return null;
    }

    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
    });

    console.log('[PushService] Firebase Admin SDK initialized successfully! (Project ID: ' + serviceAccount.project_id + ')');
    return firebaseApp;
  } catch (err) {
    console.error('[PushService] Failed to initialize Firebase Admin SDK:', err.message);
    return null;
  }
}

export function isFirebaseConfigured() {
  return initFirebase() !== null;
}

/**
 * Save or update a device registration token
 */
export function saveDeviceToken({ token, memberId, familyId = 'family-main', platform = 'android' }) {
  if (!token || !memberId) return false;
  try {
    db.prepare(`
      INSERT OR REPLACE INTO device_tokens (token, memberId, familyId, platform, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(token, memberId, familyId, platform, Date.now());
    return true;
  } catch (err) {
    console.error('[PushService] saveDeviceToken error:', err.message);
    return false;
  }
}

/**
 * Remove a device token (e.g. on logout)
 */
export function removeDeviceToken(token) {
  if (!token) return false;
  try {
    db.prepare('DELETE FROM device_tokens WHERE token = ?').run(token);
    return true;
  } catch (err) {
    console.error('[PushService] removeDeviceToken error:', err.message);
    return false;
  }
}

/**
 * Get tokens for specific members or family
 */
export function getTokens({ memberIds, familyId, excludeMemberId } = {}) {
  try {
    let query = 'SELECT token, memberId FROM device_tokens WHERE 1=1';
    const params = [];

    if (Array.isArray(memberIds) && memberIds.length > 0) {
      const placeholders = memberIds.map(() => '?').join(',');
      query += ` AND memberId IN (${placeholders})`;
      params.push(...memberIds);
    } else if (familyId) {
      query += ' AND familyId = ?';
      params.push(familyId);
    }

    if (excludeMemberId) {
      query += ' AND memberId != ?';
      params.push(excludeMemberId);
    }

    const rows = db.prepare(query).all(...params);
    return rows.map((r) => r.token);
  } catch (err) {
    console.error('[PushService] getTokens error:', err.message);
    return [];
  }
}

/**
 * Send push notification to target members or entire family
 *
 * @param {Object} options
 * @param {string[]} [options.memberIds] Target member IDs (omit to send to all members in family)
 * @param {string} [options.familyId] Family ID (defaults to 'family-main')
 * @param {string} [options.excludeMemberId] Sender ID to avoid notifying the person who triggered the action
 * @param {string} options.title Notification title
 * @param {string} options.body Notification body message
 * @param {Object} [options.data] Custom payload (e.g. { type: 'sos', id: '123' })
 * @param {string} [options.sound] Android sound channel ('default' or custom)
 */
export async function sendPushToMembers({
  memberIds,
  familyId = 'family-main',
  excludeMemberId,
  title,
  body,
  data = {},
  sound = 'default',
}) {
  const app = initFirebase();
  if (!app) {
    return { success: false, reason: 'Firebase not configured' };
  }

  const tokens = getTokens({ memberIds, familyId, excludeMemberId });
  if (!tokens || tokens.length === 0) {
    return { success: true, delivered: 0, reason: 'No registered device tokens' };
  }

  // Stringify all data values for FCM compatibility
  const safeData = {};
  for (const [key, val] of Object.entries(data)) {
    safeData[key] = typeof val === 'object' ? JSON.stringify(val) : String(val);
  }

  try {
    const message = {
      tokens,
      notification: {
        title,
        body,
      },
      data: safeData,
      android: {
        priority: 'high',
        notification: {
          sound,
          clickAction: 'FCM_PLUGIN_ACTIVITY',
          channelId: data.type === 'sos' ? 'emergency_channel' : 'default_channel',
        },
      },
    };

    const messaging = getMessaging(app);
    const response = await messaging.sendEachForMulticast(message);
    console.log(`[PushService] Sent push: ${response.successCount}/${tokens.length} successful. Title: "${title}"`);

    // Clean up expired or unregistered tokens
    if (response.failureCount > 0) {
      const deleteStmt = db.prepare('DELETE FROM device_tokens WHERE token = ?');
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const code = resp.error?.code;
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            console.log(`[PushService] Removing stale token: ${tokens[idx].substring(0, 10)}...`);
            try {
              deleteStmt.run(tokens[idx]);
            } catch (e) {
              // Ignore delete error
            }
          }
        }
      });
    }

    return {
      success: true,
      delivered: response.successCount,
      failed: response.failureCount,
    };
  } catch (err) {
    console.error('[PushService] sendPushToMembers exception:', err.message);
    return { success: false, error: err.message };
  }
}
