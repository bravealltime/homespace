export const CHORE_TASKS = [
  { id: 1, name: 'ล้างจาน', emoji: '🍽️', points: 15 },
  { id: 2, name: 'กวาดบ้าน', emoji: '🧹', points: 15 },
  { id: 3, name: 'ถูพื้น', emoji: '🪣', points: 20 },
  { id: 4, name: 'ซักผ้า', emoji: '👕', points: 20 },
  { id: 5, name: 'รีดผ้า', emoji: '👔', points: 15 },
  { id: 6, name: 'ทำอาหาร', emoji: '🍳', points: 25 },
  { id: 7, name: 'เก็บห้อง', emoji: '🛏️', points: 15 },
  { id: 8, name: 'รดน้ำต้นไม้', emoji: '🌱', points: 10 },
  { id: 9, name: 'ล้างห้องน้ำ', emoji: '🚿', points: 25 },
  { id: 10, name: 'เช็ดโต๊ะ', emoji: '✨', points: 10 },
  { id: 11, name: 'ทิ้งขยะ', emoji: '🗑️', points: 10 },
  { id: 12, name: 'จัดตู้เสื้อผ้า', emoji: '👗', points: 20 },
];

export const PRAISE_STICKERS = [
  { text: 'สะอาดเนี้ยบมาก!', emoji: '✨', points: 20 },
  { text: 'ยอดเยี่ยมที่สุด!', emoji: '🌟', points: 18 },
  { text: 'บ้านน่าอยู่ขึ้นเยอะเลย!', emoji: '🏡', points: 22 },
  { text: 'ขยันสุดๆ เลยนะ!', emoji: '💪', points: 15 },
  { text: 'น่ารักที่สุดในบ้าน!', emoji: '🥰', points: 17 },
  { text: 'เก่งมากๆ เลย!', emoji: '👏', points: 20 },
  { text: 'สุดยอดความเรียบร้อย!', emoji: '⭐', points: 25 },
  { text: 'ประทับใจจังเลย!', emoji: '😍', points: 22 },
];

export const MONTHLY_GOAL = 500;

export const DEFAULT_FAMILY_MEMBERS = [
  {
    id: 'member-fluke',
    phone: '0615678160',
    name: 'Fluke',
    role: 'เจ้าบ้าน',
    avatar: '👦',
    avatarType: 'image',
    avatarImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    color: '#5F8D75',
    isAdmin: 1,
    status: 'active',
    familyId: 'family-main',
    createdAt: 1790794643669,
    pin: '1234',
  },
  {
    id: 'member-1793392592391',
    phone: '0615213018',
    name: 'Ziesie',
    role: 'สมาชิกในบ้าน',
    avatar: '😊',
    avatarType: 'emoji',
    avatarImage: null,
    color: '#9381FF',
    isAdmin: 0,
    status: 'active',
    familyId: 'family-main',
    createdAt: 1793392592391,
    pin: '2010',
  },
];

export const REWARDS = [
  {
    id: 1,
    name: 'ปาร์ตี้ชาบูหม้อไฟที่บ้าน',
    emoji: '🍲',
    description: 'รวมพลสมาชิกทุกคน นั่งล้อมวงกินชาบู เลือกน้ำซุปและเครื่องจิ้มโปรด',
    unlockAt: 200,
    category: 'อาหาร',
  },
  {
    id: 2,
    name: 'คาเฟ่บอร์ดเกมแสนสนุก',
    emoji: '🎲',
    description: 'ยกบ้านไปเล่นเกมสนุกๆ พร้อมขนมและเครื่องดื่มอร่อยๆ',
    unlockAt: 300,
    category: 'กิจกรรม',
  },
  {
    id: 3,
    name: 'ดูหนังรอบพิเศษพร้อมป๊อปคอร์นถังใหญ่',
    emoji: '🎬',
    description: 'เลือกดูภาพยนตร์เรื่องใหม่พร้อมกันทั้งบ้าน เอนเบาะนุ่มๆ สบายๆ',
    unlockAt: 350,
    category: 'กิจกรรม',
  },
  {
    id: 4,
    name: 'บุฟเฟต์ปิ้งย่างมื้อใหญ่',
    emoji: '🥩',
    description: 'ฉลองความขยันด้วยเนื้อย่างและอาหารญี่ปุ่นไม่อั้น',
    unlockAt: 400,
    category: 'อาหาร',
  },
  {
    id: 5,
    name: 'ทริปสวนสนุกทั้งวัน',
    emoji: '🎢',
    description: 'ไปเล่นเครื่องเล่นให้สุดเหวี่ยงและถ่ายรูปเก็บความทรงจำด้วยกัน',
    unlockAt: 450,
    category: 'ท่องเที่ยว',
  },
  {
    id: 6,
    name: 'ทริปทะเล 2 วัน 1 คืน',
    emoji: '🏖️',
    description: 'รางวัลสูงสุดของบ้าน พักผ่อนฟังเสียงคลื่นและกินอาหารทะเลสดๆ',
    unlockAt: 500,
    category: 'ท่องเที่ยว',
  },
];

export function generateInitialHistory() {
  // Production: no fake/mock history entries, only real completed chores from user
  return [];
}
