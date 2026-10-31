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
      photos TEXT,
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

    CREATE TABLE IF NOT EXISTS family_notes (
      id TEXT PRIMARY KEY,
      familyId TEXT DEFAULT 'family-main',
      memberId TEXT NOT NULL,
      text TEXT NOT NULL,
      color TEXT DEFAULT 'yellow',
      isPinned INTEGER DEFAULT 1,
      acknowledgments TEXT DEFAULT '[]',
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS family_milestones (
      id TEXT PRIMARY KEY,
      familyId TEXT DEFAULT 'family-main',
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      emoji TEXT DEFAULT '🎂',
      category TEXT DEFAULT 'event',
      memberId TEXT,
      taggedMemberIds TEXT DEFAULT '[]',
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS home_contacts (
      id TEXT PRIMARY KEY,
      familyId TEXT DEFAULT 'family-main',
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      category TEXT DEFAULT 'technician',
      emoji TEXT DEFAULT '📞',
      note TEXT,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS home_maintenance (
      id TEXT PRIMARY KEY,
      familyId TEXT DEFAULT 'family-main',
      title TEXT NOT NULL,
      category TEXT DEFAULT 'air',
      emoji TEXT DEFAULT '❄️',
      frequencyMonths INTEGER DEFAULT 6,
      lastServicedDate TEXT,
      nextDueDate TEXT,
      cost TEXT,
      technicianPhone TEXT,
      note TEXT,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS family_tree (
      id TEXT PRIMARY KEY DEFAULT 'tree-main',
      familyId TEXT DEFAULT 'family-main',
      waterDrops INTEGER DEFAULT 10,
      exp INTEGER DEFAULT 0,
      maxExp INTEGER DEFAULT 20,
      level INTEGER DEFAULT 1,
      stage TEXT DEFAULT 'sprout',
      totalWatered INTEGER DEFAULT 0,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tree_watering_log (
      id TEXT PRIMARY KEY,
      treeId TEXT DEFAULT 'tree-main',
      memberId TEXT NOT NULL,
      amount INTEGER DEFAULT 1,
      message TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS family_sos_alerts (
      id TEXT PRIMARY KEY,
      familyId TEXT DEFAULT 'family-main',
      memberId TEXT NOT NULL,
      memberName TEXT NOT NULL,
      memberAvatar TEXT,
      memberPhone TEXT,
      latitude REAL,
      longitude REAL,
      mapsUrl TEXT,
      address TEXT,
      note TEXT,
      status TEXT DEFAULT 'active',
      resolvedBy TEXT,
      resolvedAt INTEGER,
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

    // Ensure posts table has photos column
    const postCols = db.prepare('PRAGMA table_info(posts)').all().map(c => c.name);
    if (!postCols.includes('photos')) {
      db.exec("ALTER TABLE posts ADD COLUMN photos TEXT");
    }
    // Ensure Fluke is the sole house owner & admin (0615678160)
    const fluke = db.prepare("SELECT * FROM members WHERE phone = '0615678160' OR id = 'member-fluke'").get();
    const flukeRealAvatar = 'https://rvrgpwzxsqjmilnmispj.supabase.co/storage/v1/object/public/homespace/uploads/1793394558996-5g067w6.jpeg';
    const ziesieRealAvatar = 'https://rvrgpwzxsqjmilnmispj.supabase.co/storage/v1/object/public/homespace/uploads/1793394561496-pvm4b28.jpeg';

    if (!fluke) {
      db.prepare(`
        INSERT OR REPLACE INTO members (id, phone, name, role, avatar, avatarType, avatarImage, color, createdAt, isAdmin, status, familyId, pin)
        VALUES ('member-fluke', '0615678160', 'Fluke', 'เจ้าบ้าน', '📷', 'image', ?, '#5F8D75', ?, 1, 'active', 'family-main', '1234')
      `).run(flukeRealAvatar, Date.now() - 30 * 86400000);
    } else {
      const flukeImg = (!fluke.avatarImage || fluke.avatarImage.includes('unsplash.com')) ? flukeRealAvatar : fluke.avatarImage;
      db.prepare(`
        UPDATE members
        SET phone = '0615678160', name = 'Fluke', role = 'เจ้าบ้าน', avatar = '📷', avatarType = 'image', avatarImage = ?, isAdmin = 1, status = 'active'
        WHERE id = ?
      `).run(flukeImg, fluke.id);
    }

    // Ensure Ziesie exists and is active (phone 0615213018, pin 2010)
    const ziesie = db.prepare("SELECT * FROM members WHERE phone = '0615213018' OR id = 'member-1793394526400'").get();
    if (!ziesie) {
      db.prepare(`
        INSERT OR REPLACE INTO members (id, phone, name, role, avatar, avatarType, avatarImage, color, createdAt, isAdmin, status, familyId, pin)
        VALUES ('member-1793394526400', '0615213018', 'Ziesie', 'สมาชิกในบ้าน', '📷', 'image', ?, '#9381FF', 1793394526400, 0, 'active', 'family-main', '2010')
      `).run(ziesieRealAvatar);
    } else {
      const ziesieImg = (!ziesie.avatarImage || ziesie.avatarImage.includes('unsplash.com')) ? ziesieRealAvatar : ziesie.avatarImage;
      db.prepare(`
        UPDATE members
        SET phone = '0615213018', status = 'active', pin = '2010', name = 'Ziesie', avatar = '📷', avatarType = 'image', avatarImage = ?
        WHERE id = ?
      `).run(ziesieImg, ziesie.id);
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

    // Ensure family_milestones has taggedMemberIds
    const milestoneCols = db.prepare('PRAGMA table_info(family_milestones)').all().map(c => c.name);
    if (!milestoneCols.includes('taggedMemberIds')) {
      db.exec("ALTER TABLE family_milestones ADD COLUMN taggedMemberIds TEXT DEFAULT '[]'");
    }
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
      ['member-fluke', '0615678160', 'Fluke', 'เจ้าบ้าน', '📷', 'image', 'https://rvrgpwzxsqjmilnmispj.supabase.co/storage/v1/object/public/homespace/uploads/1793394558996-5g067w6.jpeg', '#5F8D75', now - 30 * 86400000, 1, 'active', 'family-main'],
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

  // Seed sample sticky note if empty
  try {
    const noteCount = db.prepare('SELECT COUNT(*) as count FROM family_notes').get().count;
    if (noteCount === 0) {
      db.prepare(`
        INSERT INTO family_notes (id, familyId, memberId, text, color, isPinned, acknowledgments, timestamp)
        VALUES (?, 'family-main', 'member-fluke', ?, 'yellow', 1, '[]', ?)
      `).run('note-welcome', 'ยินดีต้อนรับสู่กระดานตู้เย็นของบ้าน! 📌 แปะโน้ตหรือฝากบอกกันได้ที่นี่เลย', Date.now());
    }

    // Seed sample milestones if empty
    const milestoneCount = db.prepare('SELECT COUNT(*) as count FROM family_milestones').get().count;
    if (milestoneCount === 0) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 7);
      const dateStr = nextDate.toISOString().split('T')[0];
      db.prepare(`
        INSERT INTO family_milestones (id, familyId, title, date, emoji, category, memberId, timestamp)
        VALUES (?, 'family-main', ?, ?, '🍲', 'event', 'member-fluke', ?)
      `).run('milestone-sample', 'ปาร์ตี้รวมพลครอบครัวสุดสัปดาห์', dateStr, Date.now());
    }

    // Seed default home contacts if empty
    const contactCount = db.prepare('SELECT COUNT(*) as count FROM home_contacts').get().count;
    if (contactCount === 0) {
      const defaultContacts = [
        ['contact-1', 'ช่างแอร์ประจำบ้าน (ช่างเอก)', '0812345678', 'technician', '❄️', 'ล้างแอร์ ซ่อมแอร์ เครื่องละ 500 บ.'],
        ['contact-2', 'ช่างไฟ & ประปา (ช่างสมศักดิ์)', '0898765432', 'technician', '⚡', 'ซ่อมระบบไฟ ท่อตัน ปั๊มน้ำ'],
        ['contact-3', 'นิติบุคคลหมู่บ้าน / รปภ.', '029998888', 'utility', '🏢', 'ติดต่องานส่วนกลาง และแจ้งปัญหาหน้าบ้าน'],
        ['contact-4', 'สายด่วนแพทย์ฉุกเฉิน (ทั่วไทย)', '1669', 'emergency', '🚑', 'เรียกรถพยาบาลกู้ชีพฉุกเฉิน 24 ชม.'],
        ['contact-5', 'เหตุด่วนเหตุร้าย (ตำรวจ)', '191', 'emergency', '🚓', 'แจ้งเหตุด่วน 24 ชม.'],
        ['contact-6', 'ดับเพลิง / จับสัตว์มีพิษ', '199', 'emergency', '🚒', 'แจ้งเหตุไฟไหม้ งู/สัตว์มีพิษเข้าบ้าน'],
      ];
      const insertContact = db.prepare(`
        INSERT INTO home_contacts (id, familyId, name, phone, category, emoji, note, createdAt)
        VALUES (?, 'family-main', ?, ?, ?, ?, ?, ?)
      `);
      for (const c of defaultContacts) {
        insertContact.run(c[0], c[1], c[2], c[3], c[4], c[5], Date.now());
      }
    }

    // Seed default maintenance items if empty
    const maintCount = db.prepare('SELECT COUNT(*) as count FROM home_maintenance').get().count;
    if (maintCount === 0) {
      const defaultMaintenance = [
        ['maint-1', 'ล้างแอร์ห้องนอนใหญ่', 'air', '❄️', 6, '2026-01-15', '2026-07-15', '500 บาท', '0812345678', 'ล้างฟิลเตอร์และเติมน้ำยาแอร์'],
        ['maint-2', 'ล้างแอร์ห้องนั่งเล่น', 'air', '❄️', 6, '2026-02-10', '2026-08-10', '500 บาท', '0812345678', 'แอร์เปิดบ่อยช่วงกลางวัน'],
        ['maint-3', 'เปลี่ยนไส้กรองเครื่องกรองน้ำ', 'water', '💧', 6, '2025-11-20', '2026-05-20', '800 บาท', '0898765432', 'เปลี่ยนไส้กรองเซรามิกและคาร์บอน'],
        ['maint-4', 'ตรวจฉีดปลวก & แมลงรอบบ้าน', 'pest', '🐜', 12, '2025-08-15', '2026-08-15', '2,500 บาท', '029998888', 'ตรวจอัดน้ำยาลงท่อใต้คาน'],
      ];
      const insertMaint = db.prepare(`
        INSERT INTO home_maintenance (id, familyId, title, category, emoji, frequencyMonths, lastServicedDate, nextDueDate, cost, technicianPhone, note, updatedAt)
        VALUES (?, 'family-main', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const m of defaultMaintenance) {
        insertMaint.run(m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8], m[9], Date.now());
      }
    }

    // Seed default family tree if empty
    const treeCount = db.prepare('SELECT COUNT(*) as count FROM family_tree').get().count;
    if (treeCount === 0) {
      db.prepare(`
        INSERT INTO family_tree (id, familyId, waterDrops, exp, maxExp, level, stage, totalWatered, updatedAt)
        VALUES ('tree-main', 'family-main', 10, 0, 20, 1, 'sprout', 0, ?)
      `).run(Date.now());

      db.prepare(`
        INSERT INTO tree_watering_log (id, treeId, memberId, amount, message, timestamp)
        VALUES (?, 'tree-main', 'member-fluke', 1, ?, ?)
      `).run('log-init-1', 'ช่วยกันปลูกต้นไม้แห่งความสุขของบ้านเรากันนะ 🌱💧', Date.now());
    }
  } catch (err) {
    console.warn('Seed notes/milestones warning:', err.message);
  }
}

export default db;
