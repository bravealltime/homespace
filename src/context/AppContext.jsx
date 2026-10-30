import { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import { MONTHLY_GOAL, REWARDS, PRAISE_STICKERS, generateInitialHistory } from '../data';
import { PRESET_ROUTINES } from '../services/aiAdvisor';
import { useAuth } from './AuthContext';
import * as api from '../services/api';

const AppContext = createContext(null);

function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

const DEFAULT_FEED_POSTS = [
  {
    id: 'post-1',
    type: 'routine',
    memberId: 'member-mom',
    caption: 'ทำอาหารเช้าเพื่อสุขภาพ สลัดผักไข่ต้มกับผลไม้ให้เด็กๆ กินก่อนไปโรงเรียน สดชื่นพร้อมเริ่มวันใหม่ 🍳🥗',
    photo: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    category: 'อาหาร & สุขภาพ',
    points: 25,
    likes: 4,
    timestamp: Date.now() - 3600000 * 1.5,
    comments: [
      { id: 'c1', memberId: 'member-dad', text: 'น่ากินมาก ขอบคุณนะครับแม่ ❤️', timestamp: Date.now() - 3600000 * 1.2 },
      { id: 'c2', memberId: 'member-little', text: 'หนูกินหมดเกลี้ยงเลยยย อร่อยมาก 😋', timestamp: Date.now() - 3600000 * 1.0 },
    ],
  },
  {
    id: 'post-2',
    type: 'chore',
    memberId: 'member-little',
    choreName: 'ปูเตียงจัดห้องนอน',
    choreEmoji: '🛏️',
    caption: 'ตื่นมาพับผ้าห่มและจัดเตียงให้ตึงเปรี๊ยะตามที่แม่สอนแล้วครับ สะอาดน่านอนสุดๆ ✨',
    beforeImage: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80',
    afterImage: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=600&q=80',
    praise: 'สะอาดเรียบร้อยดีมาก! ✨',
    praiseEmoji: '✨',
    points: 25,
    likes: 5,
    timestamp: Date.now() - 3600000 * 3,
    comments: [
      { id: 'c3', memberId: 'member-mom', text: 'เก่งมากๆ เลยลูก ห้องสะอาดน่านอนที่สุด! 👏', timestamp: Date.now() - 3600000 * 2.8 },
      { id: 'c4', memberId: 'member-big', text: 'ปรบมือให้น้องบีมคนเก่ง 🎉', timestamp: Date.now() - 3600000 * 2.5 },
    ],
  },
  {
    id: 'post-3',
    type: 'routine',
    memberId: 'member-dad',
    caption: 'วิ่งออกกำลังกายยามเช้า 5 กิโลเมตร สูดอากาศบริสุทธิ์รอบหมู่บ้าน ร่างกายสดชื่นกระปรี้กระเปร่ามากครับ 🏃‍♂️🌳',
    photo: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80',
    points: 25,
    likes: 3,
    timestamp: Date.now() - 3600000 * 5,
    comments: [
      { id: 'c5', memberId: 'member-mom', text: 'สุดยอดเลยพ่อ วันหลังพาลูกๆ ไปวิ่งด้วยกันนะ 🏃‍♀️', timestamp: Date.now() - 3600000 * 4.8 },
    ],
  },
  {
    id: 'post-4',
    type: 'chore',
    memberId: 'member-big',
    choreName: 'ล้างจานชามในซิงค์',
    choreEmoji: '🧽',
    caption: 'ล้างจานชามในซิงค์เสร็จเรียบร้อยแล้วครับ คว่ำจานเรียบร้อย สะอาดเงาวับ ✨',
    beforeImage: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?auto=format&fit=crop&w=600&q=80',
    afterImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    praise: 'สะอาดเงาวับ! +25 แต้ม',
    praiseEmoji: '✨',
    points: 25,
    likes: 6,
    timestamp: Date.now() - 3600000 * 7,
    comments: [
      { id: 'c6', memberId: 'member-dad', text: 'ขอบคุณมากครับลูก จานสะอาดมาก', timestamp: Date.now() - 3600000 * 6.5 },
    ],
  },
];

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    recipientId: 'member-big',
    senderId: 'member-dad',
    type: 'comment',
    text: 'พ่อ ได้แสดงความคิดเห็น: "ขอบคุณมากครับลูก จานสะอาดมาก"',
    postId: 'post-4',
    timestamp: Date.now() - 3600000 * 6.5,
    isRead: false,
  },
  {
    id: 'notif-2',
    recipientId: 'member-mom',
    senderId: 'member-dad',
    type: 'like',
    text: 'พ่อ ได้กดถูกใจโพสต์ของคุณ',
    postId: 'post-1',
    timestamp: Date.now() - 3600000 * 1.2,
    isRead: false,
  },
];

function reducer(state, action) {
  switch (action.type) {
    case 'SET_POSTS':
      return { ...state, feedPosts: action.payload };

    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };

    case 'SET_REWARDS_DATA':
      return {
        ...state,
        backendVotes: action.payload.memberVotes || {},
        totalScoreMonth: action.payload.totalScoreMonth ?? state.totalScoreMonth,
      };

    case 'ADD_CHORE_ENTRY': {
      const {
        memberId,
        choreName,
        choreEmoji,
        points,
        praise,
        praiseEmoji,
        imageUrl,
        beforeImage,
        afterImage,
        caption,
      } = action.payload;

      const today = new Date().toISOString().split('T')[0];
      const newEntry = {
        id: `chore-${Date.now()}`,
        memberId,
        choreName,
        choreEmoji,
        points: points || 25,
        praise: praise || 'สะอาดเรียบร้อยดีมาก!',
        praiseEmoji: praiseEmoji || '✨',
        date: today,
        timestamp: Date.now(),
        imageUrl: afterImage || imageUrl || null,
      };

      const newFeedPost = {
        id: `post-chore-${Date.now()}`,
        type: 'chore',
        memberId,
        choreName: choreName || 'งานบ้าน',
        choreEmoji: choreEmoji || '🧹',
        caption: caption || `ทำความสะอาด "${choreName}" เสร็จเรียบร้อยแล้วครับ ✨`,
        beforeImage: beforeImage || null,
        afterImage: afterImage || imageUrl || null,
        imageUrl: afterImage || imageUrl || null,
        praise: praise || 'สะอาดเรียบร้อยดีมาก!',
        points: points || 25,
        timestamp: Date.now(),
        likes: 0,
        comments: [],
        isLiked: false,
      };

      return {
        ...state,
        history: [newEntry, ...state.history],
        feedPosts: [newFeedPost, ...(state.feedPosts || [])],
      };
    }

    case 'ADD_ROUTINE_ENTRY': {
      const { memberId, caption, photo, category, points } = action.payload;
      const today = new Date().toISOString().split('T')[0];
      const routineId = `routine-${Date.now()}`;

      const historyEntry = {
        id: `hist-${routineId}`,
        memberId,
        choreName: 'เรื่องราววันนี้',
        choreEmoji: '📝',
        points: points || 25,
        praise: 'แชร์ความสุขในบ้าน 💖',
        praiseEmoji: '⭐',
        date: today,
        timestamp: Date.now(),
        imageUrl: photo || null,
      };

      const newFeedPost = {
        id: `post-routine-${Date.now()}`,
        type: 'routine',
        memberId,
        caption,
        photo,
        category: category || 'เรื่องราววันนี้',
        points: points || 25,
        timestamp: Date.now(),
        likes: 0,
        comments: [],
        isLiked: false,
      };

      return {
        ...state,
        history: [historyEntry, ...state.history],
        feedPosts: [newFeedPost, ...(state.feedPosts || [])],
      };
    }

    case 'LIKE_POST': {
      const { postId, memberId } = action.payload;
      return {
        ...state,
        feedPosts: (state.feedPosts || []).map((p) => {
          if (p.id !== postId) return p;
          const isNowLiked = !p.isLiked;
          return {
            ...p,
            likes: isNowLiked ? (p.likes || 0) + 1 : Math.max(0, (p.likes || 0) - 1),
            isLiked: isNowLiked,
          };
        }),
      };
    }

    case 'ADD_COMMENT': {
      const { postId, memberId, text } = action.payload;
      const newComment = {
        id: `c-${Date.now()}`,
        postId,
        memberId,
        text,
        timestamp: Date.now(),
      };

      return {
        ...state,
        feedPosts: (state.feedPosts || []).map((p) =>
          p.id === postId
            ? { ...p, comments: [...(p.comments || []), newComment] }
            : p
        ),
      };
    }

    case 'MARK_NOTIFICATIONS_READ': {
      const { recipientId } = action.payload;
      return {
        ...state,
        notifications: (state.notifications || []).map((n) =>
          !recipientId || n.recipientId === recipientId ? { ...n, isRead: true } : n
        ),
      };
    }

    case 'VOTE_REWARD': {
      const { rewardId, memberId } = action.payload;
      const nextBackendVotes = { ...(state.backendVotes || {}) };
      nextBackendVotes[memberId] = rewardId;
      return {
        ...state,
        backendVotes: nextBackendVotes,
      };
    }

    default:
      return state;
  }
}

function getInitialState() {
  try {
    const saved = localStorage.getItem('homespace-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.history && parsed.feedPosts) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Initial state parse error:', e);
  }

  return {
    history: generateInitialHistory(),
    feedPosts: DEFAULT_FEED_POSTS,
    notifications: DEFAULT_NOTIFICATIONS,
    backendVotes: {
      'member-dad': 1,
      'member-mom': 1,
      'member-big': 2,
      'member-little': 5,
    },
  };
}

export function AppProvider({ children }) {
  const { members: authMembers, currentUser } = useAuth();
  const [state, dispatch] = useReducer(reducer, null, getInitialState);

  // 1. Initial & Recurring Sync with SQLite Backend
  const syncWithBackend = useCallback(async () => {
    try {
      // Sync Posts
      const backendPosts = await api.fetchPosts(currentUser?.id);
      if (Array.isArray(backendPosts) && backendPosts.length > 0) {
        dispatch({ type: 'SET_POSTS', payload: backendPosts });
      }

      // Sync Notifications
      const backendNotifs = await api.fetchNotifications(currentUser?.id);
      if (Array.isArray(backendNotifs)) {
        dispatch({ type: 'SET_NOTIFICATIONS', payload: backendNotifs });
      }

      // Sync Rewards & Votes
      const rewardsData = await api.fetchRewards();
      if (rewardsData) {
        dispatch({ type: 'SET_REWARDS_DATA', payload: rewardsData });
      }
    } catch (err) {
      // Backend momentarily restarting; silent fallback to memory/localStorage
    }
  }, [currentUser?.id]);

  useEffect(() => {
    syncWithBackend();
    const interval = setInterval(syncWithBackend, 8000); // 8-second background poll
    return () => clearInterval(interval);
  }, [syncWithBackend]);

  // Persist local backup
  useEffect(() => {
    try {
      localStorage.setItem('homespace-state', JSON.stringify(state));
    } catch (e) {
      console.error('Save state error', e);
    }
  }, [state]);

  const members = useMemo(() => {
    return authMembers.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      avatar: m.avatarType === 'image' ? '📷' : m.avatar,
      avatarType: m.avatarType,
      avatarImage: m.avatarImage,
      color: m.color || '#5F8D75',
      phone: m.phone,
    }));
  }, [authMembers]);

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const todayEntries = (state.history || []).filter((e) => e.date === today);
  const monthEntries = (state.history || []).filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const memberScoresToday = {};
  const memberScoresMonth = {};

  members.forEach((m) => {
    memberScoresToday[m.id] = todayEntries
      .filter((e) => e.memberId === m.id)
      .reduce((sum, e) => sum + (e.points || 0), 0);
    memberScoresMonth[m.id] = monthEntries
      .filter((e) => e.memberId === m.id)
      .reduce((sum, e) => sum + (e.points || 0), 0);
  });

  // Calculate total points
  const calculatedTotalScoreMonth = Object.values(memberScoresMonth).reduce((a, b) => a + b, 0);
  const totalScoreMonth = state.totalScoreMonth || calculatedTotalScoreMonth;
  const totalScoreToday = Object.values(memberScoresToday).reduce((a, b) => a + b, 0);

  const getWeeklyData = () => {
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7.push(d.toISOString().split('T')[0]);
    }
    return last7.map((dateStr) => {
      const dayEntries = (state.history || []).filter((e) => e.date === dateStr);
      const dayData = { date: dateStr, label: new Date(dateStr).toLocaleDateString('th-TH', { weekday: 'short' }) };
      members.forEach((m) => {
        dayData[m.id] = dayEntries
          .filter((e) => e.memberId === m.id)
          .reduce((sum, e) => sum + (e.points || 0), 0);
      });
      dayData.total = members.reduce((sum, m) => sum + (dayData[m.id] || 0), 0);
      return dayData;
    });
  };

  const getMonthlyData = () => {
    const weeks = {};
    monthEntries.forEach((entry) => {
      const wk = getWeekNumber(entry.date);
      if (!weeks[wk]) {
        weeks[wk] = { week: `สัปดาห์ที่ ${wk}` };
        members.forEach((m) => { weeks[wk][m.id] = 0; });
      }
      if (weeks[wk][entry.memberId] !== undefined) {
        weeks[wk][entry.memberId] += (entry.points || 0);
      }
    });
    return Object.values(weeks);
  };

  const getYearlyData = () => {
    const months = {};
    const yearEntries = (state.history || []).filter((e) => new Date(e.date).getFullYear() === currentYear);
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    yearEntries.forEach((entry) => {
      const m = new Date(entry.date).getMonth();
      if (!months[m]) {
        months[m] = { month: monthNames[m] };
        members.forEach((mem) => { months[m][mem.id] = 0; });
      }
      if (months[m][entry.memberId] !== undefined) {
        months[m][entry.memberId] += (entry.points || 0);
      }
    });
    return Object.values(months);
  };

  // Voting getters
  const getRewardVotes = (rewardId) => {
    const votes = state.backendVotes || {};
    return Object.values(votes).filter((vId) => String(vId) === String(rewardId) || String(vId) === `reward-${rewardId}`).length;
  };

  const getMemberVote = (memberId) => {
    const votes = state.backendVotes || {};
    const v = votes[memberId];
    if (v === undefined || v === null) return null;
    return parseInt(String(v).replace('reward-', ''), 10) || v;
  };

  const unlockedRewards = REWARDS.filter((r) => totalScoreMonth >= r.unlockAt);

  // REAL BACKEND-CONNECTED ACTIONS
  const addChoreEntry = async (payload) => {
    dispatch({ type: 'ADD_CHORE_ENTRY', payload });
    try {
      await api.createChorePost(payload);
      syncWithBackend();
    } catch (err) {
      console.warn('Backend chore post warning:', err.message);
    }
  };

  const addRoutineEntry = async (payload) => {
    dispatch({ type: 'ADD_ROUTINE_ENTRY', payload });
    try {
      await api.createRoutinePost(payload);
      syncWithBackend();
    } catch (err) {
      console.warn('Backend routine post warning:', err.message);
    }
  };

  const likePost = async (postId) => {
    dispatch({ type: 'LIKE_POST', payload: { postId, memberId: currentUser?.id } });
    if (currentUser?.id) {
      try {
        await api.toggleLikePost(postId, currentUser.id);
        syncWithBackend();
      } catch (err) {
        console.warn('Backend like warning:', err.message);
      }
    }
  };

  const addComment = async (postId, memberId, text) => {
    dispatch({ type: 'ADD_COMMENT', payload: { postId, memberId, text } });
    try {
      await api.addPostComment(postId, memberId, text);
      syncWithBackend();
    } catch (err) {
      console.warn('Backend comment warning:', err.message);
    }
  };

  const markNotificationsRead = async (recipientId) => {
    dispatch({ type: 'MARK_NOTIFICATIONS_READ', payload: { recipientId } });
    try {
      await api.markNotificationsAsRead(recipientId);
    } catch (err) {
      console.warn('Backend notification read warning:', err.message);
    }
  };

  const voteReward = async (rewardId, memberId) => {
    dispatch({ type: 'VOTE_REWARD', payload: { rewardId, memberId } });
    try {
      await api.voteForReward(memberId, rewardId);
      syncWithBackend();
    } catch (err) {
      console.warn('Backend vote warning:', err.message);
    }
  };

  const value = {
    state,
    members,
    monthlyGoal: MONTHLY_GOAL,
    todayEntries,
    monthEntries,
    memberScoresToday,
    memberScoresMonth,
    totalScoreMonth,
    totalScoreToday,
    feedPosts: state.feedPosts || DEFAULT_FEED_POSTS,
    notifications: state.notifications || DEFAULT_NOTIFICATIONS,
    markNotificationsRead,
    getWeeklyData,
    getMonthlyData,
    getYearlyData,
    addChoreEntry,
    addRoutineEntry,
    likePost,
    addComment,
    voteReward,
    getRewardVotes,
    getMemberVote,
    unlockedRewards,
    rewards: REWARDS,
    syncWithBackend,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
