import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Support both local development and Vercel serverless environment
const isVercel = process.env.VERCEL === '1';
const dbDir = isVercel ? '/tmp' : __dirname;
const uploadsDir = isVercel ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'homespace.db');
let db;
try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
} catch (e) {
  console.warn('Fallback to in-memory database:', e.message);
  db = new Database(':memory:');
}

// 1. Initialize Database Schema
export function initDb() {
  db.exec(`
    
    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      adminMemberId TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS otps (
      phone TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      expiresAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT NOT NULL,
      avatarType TEXT DEFAULT 'emoji',
      avatarImage TEXT,
      color TEXT,
      pin TEXT DEFAULT '1234',
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      memberId TEXT NOT NULL,
      caption TEXT,
      choreName TEXT,
      choreEmoji TEXT,
      points INTEGER DEFAULT 25,
      praise TEXT,
      praiseEmoji TEXT,
      photo TEXT,
      beforeImage TEXT,
      afterImage TEXT,
      imageUrl TEXT,
      likes INTEGER DEFAULT 0,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS post_likes (
      postId TEXT NOT NULL,
      memberId TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      PRIMARY KEY (postId, memberId),
      FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      postId TEXT NOT NULL,
      memberId TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      description TEXT,
      target INTEGER NOT NULL,
      category TEXT
    );

    CREATE TABLE IF NOT EXISTS reward_votes (
      memberId TEXT PRIMARY KEY,
      rewardId TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (rewardId) REFERENCES rewards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      recipientId TEXT NOT NULL,
      senderId TEXT NOT NULL,
      type TEXT NOT NULL,
      postId TEXT,
      text TEXT NOT NULL,
      isRead INTEGER DEFAULT 0,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (recipientId) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (senderId) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chore_history (
      id TEXT PRIMARY KEY,
      memberId TEXT NOT NULL,
      choreName TEXT NOT NULL,
      choreEmoji TEXT,
      points INTEGER DEFAULT 25,
      praise TEXT,
      praiseEmoji TEXT,
      date TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      imageUrl TEXT,
      FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      memberId TEXT NOT NULL,
      photo TEXT,
      caption TEXT,
      bgGradient TEXT,
      textColor TEXT,
      stickers TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
    );
  `);

  
  // Ensure members table has familyId, status, isAdmin
  try {
    const cols = db.prepare('PRAGMA table_info(members)').all().map(c => c.name);
    if (!cols.includes('familyId')) {
      db.exec("ALTER TABLE members ADD COLUMN familyId TEXT DEFAULT 'family-main'");
    }
    if (!cols.includes('status')) {
      db.exec("ALTER TABLE members ADD COLUMN status TEXT DEFAULT 'active'");
    }
    if (!cols.includes('isAdmin')) {
      db.exec("ALTER TABLE members ADD COLUMN isAdmin INTEGER DEFAULT 0");
    }
    if (!cols.includes('pin')) {
      db.exec("ALTER TABLE members ADD COLUMN pin TEXT DEFAULT '1234'");
    }
    // Ensure Fluke is the sole house owner & admin (0615678160)
    const fluke = db.prepare("SELECT * FROM members WHERE phone = '0615678160' OR id = 'member-fluke'").get();
    if (!fluke) {
      db.prepare(`
        INSERT OR REPLACE INTO members (id, phone, name, role, avatar, avatarType, avatarImage, color, createdAt, isAdmin, status, familyId, pin)
        VALUES ('member-fluke', '0615678160', 'Fluke', 'เจ้าบ้าน', '👦', 'image', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80', '#5F8D75', ?, 1, 'active', 'family-main', '1234')
      `).run(Date.now() - 30 * 86400000);
    } else {
      db.prepare(`
        UPDATE members
        SET phone = '0615678160', name = 'Fluke', role = 'เจ้าบ้าน', isAdmin = 1, status = 'active'
        WHERE id = ?
      `).run(fluke.id);
    }

    // Ensure Ziesie exists and is active (phone 0615213018, pin 2010)
    const ziesie = db.prepare("SELECT * FROM members WHERE phone = '0615213018' OR id = 'member-1793392592391'").get();
    if (!ziesie) {
      db.prepare(`
        INSERT OR REPLACE INTO members (id, phone, name, role, avatar, avatarType, avatarImage, color, createdAt, isAdmin, status, familyId, pin)
        VALUES ('member-1793392592391', '0615213018', 'Ziesie', 'สมาชิกในบ้าน', '😊', 'emoji', null, '#9381FF', 1793392592391, 0, 'active', 'family-main', '2010')
      `).run();
    } else {
      db.prepare("UPDATE members SET phone = '0615213018', status = 'active', pin = '2010', name = 'Ziesie' WHERE id = ?").run(ziesie.id);
    }

    // Remove old mock members and posts
    db.prepare("DELETE FROM members WHERE id IN ('member-dad', 'member-mom', 'member-sister', 'member-little', 'member-big')").run();
    db.exec(`
      DELETE FROM comments WHERE postId = 'post-1';
      DELETE FROM post_likes WHERE postId = 'post-1';
      DELETE FROM posts WHERE id = 'post-1';
      DELETE FROM stories WHERE id = 'story-welcome-fluke';
      DELETE FROM chore_history WHERE id LIKE '%post-1%' OR choreName = 'ล้างจานชามในซิงค์';
      DELETE FROM chore_history WHERE id LIKE 'hist-2026-%' OR id LIKE 'hist-2025-%';
      DELETE FROM chore_history WHERE memberId IN ('member-dad', 'member-mom', 'member-sister', 'member-little', 'member-big');
    `);

    // Ensure family admin is member-fluke
    db.prepare("UPDATE families SET adminMemberId = 'member-fluke' WHERE id = 'family-main'").run();
    db.exec("UPDATE members SET familyId = 'family-main' WHERE familyId IS NULL");
    db.exec("UPDATE members SET status = 'active' WHERE status IS NULL");
  } catch (err) {
    console.warn('Migration warning:', err.message);
  }

  // Seed default settings and initial data if not already present
  seedInitialData();
}

function seedInitialData() {

  // Seed default family
  const famCount = db.prepare('SELECT COUNT(*) as count FROM families').get().count;
  if (famCount === 0) {
    db.prepare(`
      INSERT INTO families (id, name, code, adminMemberId, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run('family-main', 'บ้านสุขใจ (Family Home)', 'HOME-2026', 'member-fluke', Date.now());
  }

  const memberCount = db.prepare('SELECT COUNT(*) as count FROM members').get().count;
  if (memberCount === 0) {
    const insertMember = db.prepare(`
      INSERT INTO members (id, phone, name, role, avatar, avatarType, avatarImage, color, createdAt, isAdmin, status, familyId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    const defaultMembers = [
      ['member-fluke', '0615678160', 'Fluke', 'เจ้าบ้าน', '👦', 'image', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80', '#5F8D75', now - 30 * 86400000, 1, 'active', 'family-main'],
    ];

    const tx = db.transaction(() => {
      for (const m of defaultMembers) {
        insertMember.run(...m);
      }
    });
    tx();
  }

  // Seed rewards
  const rewardCount = db.prepare('SELECT COUNT(*) as count FROM rewards').get().count;
  if (rewardCount === 0) {
    const insertReward = db.prepare(`
      INSERT INTO rewards (id, name, emoji, description, target, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const defaultRewards = [
      ['reward-1', 'ปาร์ตี้ชาบูหม้อไฟที่บ้าน', '🍲', 'รวมพลสมาชิกทุกคน นั่งล้อมวงกินชาบู เลือกน้ำซุปและเครื่องจิ้มโปรด', 200, 'อาหาร'],
      ['reward-2', 'คาเฟ่บอร์ดเกมแสนสนุก', '🎲', 'ยกบ้านไปเล่นเกมสนุกๆ พร้อมขนมและเครื่องดื่มอร่อยๆ', 300, 'กิจกรรม'],
      ['reward-3', 'ดูหนังรอบพิเศษพร้อมป๊อปคอร์นถังใหญ่', '🎬', 'เลือกดูภาพยนตร์เรื่องใหม่พร้อมกันทั้งบ้าน เอนเบาะนุ่มๆ สบายๆ', 350, 'กิจกรรม'],
      ['reward-4', 'บุฟเฟต์ปิ้งย่างมื้อใหญ่', '🥩', 'ฉลองความขยันด้วยเนื้อย่างและอาหารญี่ปุ่นไม่อั้น', 400, 'อาหาร'],
      ['reward-5', 'ทริปสวนสนุกทั้งวัน', '🎢', 'ไปเล่นเครื่องเล่นให้สุดเหวี่ยงและถ่ายรูปเก็บความทรงจำด้วยกัน', 450, 'ท่องเที่ยว'],
      ['reward-6', 'ทริปทะเล 2 วัน 1 คืน', '🏖️', 'รางวัลสูงสุดของบ้าน พักผ่อนฟังเสียงคลื่นและกินอาหารทะเลสดๆ', 500, 'ท่องเที่ยว'],
    ];

    const tx = db.transaction(() => {
      for (const r of defaultRewards) {
        insertReward.run(...r);
      }
    });
    tx();
  }

  // Seed default goal
  const goalSetting = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('monthlyGoal');
  if (!goalSetting) {
    db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)').run('monthlyGoal', '500');
  }

  // Seed initial vote
  const voteCount = db.prepare('SELECT COUNT(*) as count FROM reward_votes').get().count;
  if (voteCount === 0) {
    db.prepare('INSERT INTO reward_votes (memberId, rewardId, timestamp) VALUES (?, ?, ?)')
      .run('member-fluke', 'reward-1', Date.now());
  }
}

export default db;
