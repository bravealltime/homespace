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
    id: 'member-dad',
    phone: '0811111111',
    name: 'พ่อ',
    role: 'คุณพ่อ',
    avatar: '👨',
    avatarType: 'emoji',
    avatarImage: null,
    color: '#5F8D75',
    createdAt: Date.now() - 30 * 86400000,
  },
  {
    id: 'member-mom',
    phone: '0822222222',
    name: 'แม่',
    role: 'คุณแม่',
    avatar: '👩',
    avatarType: 'emoji',
    avatarImage: null,
    color: '#E88D67',
    createdAt: Date.now() - 30 * 86400000,
  },
  {
    id: 'member-big',
    phone: '0833333333',
    name: 'พี่เบล',
    role: 'ลูกคนโต',
    avatar: '👧',
    avatarType: 'emoji',
    avatarImage: null,
    color: '#7BA7C2',
    createdAt: Date.now() - 30 * 86400000,
  },
  {
    id: 'member-little',
    phone: '0844444444',
    name: 'น้องบีม',
    role: 'ลูกคนเล็ก',
    avatar: '👦',
    avatarType: 'emoji',
    avatarImage: null,
    color: '#C49B6F',
    createdAt: Date.now() - 30 * 86400000,
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

export function generateInitialHistory(membersList = DEFAULT_FAMILY_MEMBERS) {
  const history = [];
  const now = new Date();
  const choreList = [
    { chore: CHORE_TASKS[0], praise: PRAISE_STICKERS[0] }, // ล้างจาน
    { chore: CHORE_TASKS[1], praise: PRAISE_STICKERS[1] }, // กวาดบ้าน
    { chore: CHORE_TASKS[2], praise: PRAISE_STICKERS[2] }, // ถูพื้น
    { chore: CHORE_TASKS[3], praise: PRAISE_STICKERS[3] }, // ซักผ้า
    { chore: CHORE_TASKS[5], praise: PRAISE_STICKERS[5] }, // ทำอาหาร
    { chore: CHORE_TASKS[7], praise: PRAISE_STICKERS[4] }, // รดน้ำต้นไม้
    { chore: CHORE_TASKS[9], praise: PRAISE_STICKERS[6] }, // เช็ดโต๊ะ
  ];

  // Generate 14 days of realistic entries
  for (let dayOffset = 14; dayOffset >= 0; dayOffset--) {
    const d = new Date(now);
    d.setDate(d.getDate() - dayOffset);
    const dateStr = d.toISOString().split('T')[0];

    membersList.forEach((member, mIdx) => {
      // 1 to 2 chores per day
      const count = dayOffset === 0 ? 1 : (dayOffset % 2 === 0 ? 2 : 1);
      for (let i = 0; i < count; i++) {
        const item = choreList[(mIdx + dayOffset + i) % choreList.length];
        history.push({
          id: `hist-${dateStr}-${member.id}-${i}`,
          memberId: member.id,
          choreName: item.chore.name,
          choreEmoji: item.chore.emoji,
          points: item.praise.points,
          praise: item.praise.text,
          praiseEmoji: item.praise.emoji,
          date: dateStr,
          timestamp: d.getTime() + (i * 3600000),
          imageUrl: null,
        });
      }
    });
  }

  return history;
}
