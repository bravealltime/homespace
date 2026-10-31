import db from './db.js';
import supabase, { SUPABASE_BUCKET, isSupabaseConfigured } from './supabase.js';

const STATE_FILE_PATH = 'state/database.json';
let lastSyncTime = 0;
let isSyncing = false;

function normalizePhone(p) {
  if (!p) return '';
  let digits = String(p).replace(/\D/g, '');
  if (digits.startsWith('66') && digits.length === 11) {
    digits = '0' + digits.slice(2);
  }
  return digits;
}

/**
 * Dump SQLite tables to a clean JSON object
 */
export function exportDbToJson() {
  try {
    return {
      version: 1,
      updatedAt: Date.now(),
      families: db.prepare('SELECT * FROM families').all(),
      members: db.prepare('SELECT * FROM members').all(),
      system_settings: db.prepare('SELECT * FROM system_settings').all(),
      posts: db.prepare('SELECT * FROM posts').all(),
      post_likes: db.prepare('SELECT * FROM post_likes').all(),
      comments: db.prepare('SELECT * FROM comments').all(),
      stories: db.prepare('SELECT * FROM stories').all(),
      rewards: db.prepare('SELECT * FROM rewards').all(),
      reward_votes: db.prepare('SELECT * FROM reward_votes').all(),
      notifications: db.prepare('SELECT * FROM notifications').all(),
      chore_history: db.prepare('SELECT * FROM chore_history').all(),
      family_notes: db.prepare('SELECT * FROM family_notes').all(),
      family_milestones: db.prepare('SELECT * FROM family_milestones').all(),
      home_contacts: db.prepare('SELECT * FROM home_contacts').all(),
      home_maintenance: db.prepare('SELECT * FROM home_maintenance').all(),
      family_tree: db.prepare('SELECT * FROM family_tree').all(),
      tree_watering_log: db.prepare('SELECT * FROM tree_watering_log').all(),
      family_sos_alerts: db.prepare('SELECT * FROM family_sos_alerts').all(),
    };
  } catch (err) {
    console.error('[CloudSync] exportDbToJson error:', err.message);
    return null;
  }
}

/**
 * Import JSON object into SQLite tables with INSERT OR REPLACE
 */
export function importJsonToDb(data) {
  if (!data || typeof data !== 'object') return false;

  try {
    const tx = db.transaction(() => {
      // 1. Families
      if (Array.isArray(data.families)) {
        if (data.families.length > 0) {
          const ids = data.families.map(f => f.id);
          const q = ids.map(() => '?').join(',');
          db.prepare(`DELETE FROM families WHERE id NOT IN (${q})`).run(...ids);
        }
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO families (id, name, code, adminMemberId, createdAt)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const f of data.families) {
          stmt.run(f.id, f.name, f.code, f.adminMemberId, f.createdAt || Date.now());
        }
      }

      // 2. Members
      if (Array.isArray(data.members) && data.members.length > 0) {
        const ids = data.members.map(m => m.id);
        const q = ids.map(() => '?').join(',');
        db.prepare(`DELETE FROM members WHERE id NOT IN (${q})`).run(...ids);
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO members (id, phone, name, role, avatar, avatarType, avatarImage, color, pin, createdAt, familyId, status, isAdmin)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const m of data.members) {
          const cleanPhone = normalizePhone(m.phone);
          stmt.run(
            m.id,
            cleanPhone,
            m.name,
            m.role || 'สมาชิกในบ้าน',
            m.avatar || '😊',
            m.avatarType || 'emoji',
            m.avatarImage || null,
            m.color || '#5F8D75',
            m.pin || '1234',
            m.createdAt || Date.now(),
            m.familyId || 'family-main',
            m.status || 'active',
            m.isAdmin ? 1 : 0
          );
        }
      }

      // 3. Posts
      if (Array.isArray(data.posts)) {
        if (data.posts.length > 0) {
          const ids = data.posts.map(p => p.id);
          const q = ids.map(() => '?').join(',');
          db.prepare(`DELETE FROM posts WHERE id NOT IN (${q})`).run(...ids);
        } else {
          db.prepare('DELETE FROM posts').run();
        }
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO posts (id, type, memberId, caption, choreName, choreEmoji, points, praise, praiseEmoji, photo, beforeImage, afterImage, imageUrl, likes, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const p of data.posts) {
          stmt.run(
            p.id,
            p.type,
            p.memberId,
            p.caption || null,
            p.choreName || null,
            p.choreEmoji || null,
            p.points || 25,
            p.praise || null,
            p.praiseEmoji || null,
            p.photo || null,
            p.beforeImage || null,
            p.afterImage || null,
            p.imageUrl || null,
            p.likes || 0,
            p.timestamp || Date.now()
          );
        }
      }

      // 4. Post Likes
      if (Array.isArray(data.post_likes)) {
        db.prepare('DELETE FROM post_likes').run();
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO post_likes (postId, memberId, timestamp)
          VALUES (?, ?, ?)
        `);
        for (const l of data.post_likes) {
          stmt.run(l.postId, l.memberId, l.timestamp || Date.now());
        }
      }

      // 5. Comments
      if (Array.isArray(data.comments)) {
        if (data.comments.length > 0) {
          const ids = data.comments.map(c => c.id);
          const q = ids.map(() => '?').join(',');
          db.prepare(`DELETE FROM comments WHERE id NOT IN (${q})`).run(...ids);
        } else {
          db.prepare('DELETE FROM comments').run();
        }
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO comments (id, postId, memberId, text, timestamp)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const c of data.comments) {
          stmt.run(c.id, c.postId, c.memberId, c.text, c.timestamp || Date.now());
        }
      }

      // 6. Stories
      if (Array.isArray(data.stories)) {
        if (data.stories.length > 0) {
          const ids = data.stories.map(s => s.id);
          const q = ids.map(() => '?').join(',');
          db.prepare(`DELETE FROM stories WHERE id NOT IN (${q})`).run(...ids);
        } else {
          db.prepare('DELETE FROM stories').run();
        }
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO stories (id, memberId, photo, caption, bgGradient, textColor, stickers, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const s of data.stories) {
          stmt.run(s.id, s.memberId, s.photo || null, s.caption || '', s.bgGradient || null, s.textColor || '#ffffff', s.stickers || null, s.timestamp || Date.now());
        }
      }

      // 7. Rewards
      if (Array.isArray(data.rewards)) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO rewards (id, name, emoji, description, target, category)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const r of data.rewards) {
          stmt.run(r.id, r.name, r.emoji, r.description || null, r.target || 300, r.category || 'ทั่วไป');
        }
      }

      // 8. Reward Votes
      if (Array.isArray(data.reward_votes)) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO reward_votes (memberId, rewardId, timestamp)
          VALUES (?, ?, ?)
        `);
        for (const v of data.reward_votes) {
          stmt.run(v.memberId, v.rewardId, v.timestamp || Date.now());
        }
      }

      // 9. Notifications
      if (Array.isArray(data.notifications)) {
        if (data.notifications.length > 0) {
          const ids = data.notifications.map(n => n.id);
          const q = ids.map(() => '?').join(',');
          db.prepare(`DELETE FROM notifications WHERE id NOT IN (${q})`).run(...ids);
        } else {
          db.prepare('DELETE FROM notifications').run();
        }
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO notifications (id, recipientId, senderId, type, postId, text, isRead, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const n of data.notifications) {
          stmt.run(n.id, n.recipientId, n.senderId, n.type, n.postId || null, n.text, n.isRead ? 1 : 0, n.timestamp || Date.now());
        }
      }

      // 10. Chore History
      if (Array.isArray(data.chore_history)) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO chore_history (id, memberId, choreName, choreEmoji, points, praise, praiseEmoji, date, timestamp, imageUrl)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const h of data.chore_history) {
          stmt.run(h.id, h.memberId, h.choreName, h.choreEmoji || null, h.points || 25, h.praise || null, h.praiseEmoji || null, h.date, h.timestamp || Date.now(), h.imageUrl || null);
        }
      }

      // 11. System Settings
      if (Array.isArray(data.system_settings)) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO system_settings (key, value)
          VALUES (?, ?)
        `);
        for (const s of data.system_settings) {
          stmt.run(s.key, s.value);
        }
      }

      // 12. Family Notes (กระดานตู้เย็น)
      if (Array.isArray(data.family_notes)) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO family_notes (id, familyId, memberId, text, color, isPinned, acknowledgments, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const n of data.family_notes) {
          stmt.run(
            n.id,
            n.familyId || 'family-main',
            n.memberId,
            n.text,
            n.color || 'yellow',
            n.isPinned ?? 1,
            typeof n.acknowledgments === 'string' ? n.acknowledgments : JSON.stringify(n.acknowledgments || []),
            n.timestamp || Date.now()
          );
        }
      }

      // 13. Family Milestones (วันสำคัญ & นับถอยหลัง)
      if (Array.isArray(data.family_milestones)) {
        if (data.family_milestones.length > 0) {
          const ids = data.family_milestones.map(m => m.id);
          const q = ids.map(() => '?').join(',');
          db.prepare(`DELETE FROM family_milestones WHERE id NOT IN (${q})`).run(...ids);
        } else {
          db.prepare('DELETE FROM family_milestones').run();
        }
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO family_milestones (id, familyId, title, date, endDate, emoji, category, memberId, taggedMemberIds, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const m of data.family_milestones) {
          stmt.run(
            m.id,
            m.familyId || 'family-main',
            m.title,
            m.date,
            m.endDate || null,
            m.emoji || '🎂',
            m.category || 'event',
            m.memberId || null,
            typeof m.taggedMemberIds === 'string' ? m.taggedMemberIds : JSON.stringify(m.taggedMemberIds || []),
            m.timestamp || Date.now()
          );
        }
      }

      // 14. Home Contacts
      if (Array.isArray(data.home_contacts)) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO home_contacts (id, familyId, name, phone, category, emoji, note, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const c of data.home_contacts) {
          stmt.run(c.id, c.familyId || 'family-main', c.name, c.phone, c.category || 'technician', c.emoji || '📞', c.note || null, c.createdAt || Date.now());
        }
      }

      // 15. Home Maintenance
      if (Array.isArray(data.home_maintenance)) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO home_maintenance (id, familyId, title, category, emoji, frequencyMonths, lastServicedDate, nextDueDate, cost, technicianPhone, note, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const m of data.home_maintenance) {
          stmt.run(m.id, m.familyId || 'family-main', m.title, m.category || 'air', m.emoji || '❄️', m.frequencyMonths || 6, m.lastServicedDate || null, m.nextDueDate || null, m.cost || null, m.technicianPhone || null, m.note || null, m.updatedAt || Date.now());
        }
      }

      // 16. Family Tree
      if (Array.isArray(data.family_tree) && data.family_tree.length > 0) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO family_tree (id, familyId, waterDrops, exp, maxExp, level, stage, totalWatered, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const t of data.family_tree) {
          stmt.run(t.id, t.familyId || 'family-main', t.waterDrops || 0, t.exp || 0, t.maxExp || 20, t.level || 1, t.stage || 'sprout', t.totalWatered || 0, t.updatedAt || Date.now());
        }
      }

      // 17. Tree Watering Log
      if (Array.isArray(data.tree_watering_log)) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO tree_watering_log (id, treeId, memberId, amount, message, timestamp)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const l of data.tree_watering_log) {
          stmt.run(l.id, l.treeId || 'tree-main', l.memberId, l.amount || 1, l.message || null, l.timestamp || Date.now());
        }
      }

      // 18. Family SOS Alerts
      if (Array.isArray(data.family_sos_alerts)) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO family_sos_alerts (id, familyId, memberId, memberName, memberAvatar, memberPhone, latitude, longitude, mapsUrl, address, note, status, resolvedBy, resolvedAt, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const a of data.family_sos_alerts) {
          stmt.run(a.id, a.familyId || 'family-main', a.memberId, a.memberName, a.memberAvatar || null, a.memberPhone || null, a.latitude || null, a.longitude || null, a.mapsUrl || null, a.address || null, a.note || null, a.status || 'active', a.resolvedBy || null, a.resolvedAt || null, a.timestamp || Date.now());
        }
      }
    });

    tx();
    lastSyncTime = Date.now();
    return true;
  } catch (err) {
    console.error('[CloudSync] importJsonToDb error:', err.message);
    return false;
  }
}

let cloudSyncPromise = null;

/**
 * Guarantee that the database has been downloaded from Supabase Cloud Storage
 * before any request handler is executed. Concurrent requests wait on the same promise.
 */
export async function ensureCloudSynced() {
  if (!isSupabaseConfigured() || !supabase) return true;

  // If already pulled within the last 5 seconds, use local DB immediately
  if (Date.now() - lastSyncTime < 5000) {
    return true;
  }

  // If a sync is already running, wait for it
  if (cloudSyncPromise) {
    return cloudSyncPromise;
  }

  cloudSyncPromise = (async () => {
    try {
      await pullFromCloud(true);
      return true;
    } catch (err) {
      console.warn('[CloudSync] ensureCloudSynced error:', err.message);
      return false;
    } finally {
      cloudSyncPromise = null;
    }
  })();

  return cloudSyncPromise;
}

/**
 * Download state from Supabase Storage and populate local SQLite
 */
export async function pullFromCloud(force = false) {
  if (!isSupabaseConfigured() || !supabase) return false;
  if (!force && Date.now() - lastSyncTime < 2000) {
    return true; // Already fresh within last 2 seconds
  }

  try {
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .download(STATE_FILE_PATH);

    if (error) {
      // If file doesn't exist yet, we will push initial DB state
      if (error.message.includes('not found') || error.message.includes('404')) {
        console.log('[CloudSync] No cloud state found yet. Initializing with current database.');
        await pushToCloud();
        return true;
      }
      console.warn('[CloudSync] Download cloud state warning:', error.message);
      return false;
    }

    if (data) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      const success = importJsonToDb(parsed);
      if (success) {
        console.log(`[CloudSync] Synced from Supabase cloud: ${parsed.members?.length || 0} members, ${parsed.posts?.length || 0} posts.`);
        return true;
      }
    }
  } catch (err) {
    console.warn('[CloudSync] Pull from cloud exception:', err.message);
  }
  return false;
}

/**
 * Dump local SQLite database and upload to Supabase Storage
 */
export async function pushToCloud() {
  if (!isSupabaseConfigured() || !supabase) return false;
  if (isSyncing) return false;

  isSyncing = true;
  try {
    const payload = exportDbToJson();
    if (!payload) return false;

    const buffer = Buffer.from(JSON.stringify(payload, null, 2), 'utf-8');
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(STATE_FILE_PATH, buffer, {
        contentType: 'application/json',
        upsert: true,
      });

    if (error) {
      console.warn('[CloudSync] Upload cloud state warning:', error.message);
      return false;
    }

    console.log(`[CloudSync] Pushed database to Supabase cloud: ${payload.members?.length || 0} members.`);
    lastSyncTime = Date.now();
    return true;
  } catch (err) {
    console.warn('[CloudSync] Push to cloud exception:', err.message);
    return false;
  } finally {
    isSyncing = false;
  }
}
