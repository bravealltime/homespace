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

const DEFAULT_FEED_POSTS = [];
const DEFAULT_NOTIFICATIONS = [];
const DEFAULT_STORIES = [];

function reducer(state, action) {
  switch (action.type) {
    case 'SET_POSTS':
      return { ...state, feedPosts: action.payload };

    case 'SET_STORIES':
      return { ...state, stories: action.payload };

    case 'ADD_STORY':
      return {
        ...state,
        stories: [action.payload, ...(state.stories || []).filter((s) => s.id !== action.payload.id)],
      };

    case 'DELETE_STORY':
      return {
        ...state,
        stories: (state.stories || []).filter((s) => s.id !== action.payload.storyId),
      };

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

    case 'DELETE_POST': {
      const { postId } = action.payload;
      return {
        ...state,
        feedPosts: (state.feedPosts || []).filter((p) => p.id !== postId),
        history: (state.history || []).filter((h) => h.id !== postId && !h.id.includes(postId)),
      };
    }

    case 'DELETE_COMMENT': {
      const { postId, commentId } = action.payload;
      return {
        ...state,
        feedPosts: (state.feedPosts || []).map((p) =>
          p.id === postId
            ? { ...p, comments: (p.comments || []).filter((c) => c.id !== commentId) }
            : p
        ),
      };
    }

    case 'ADD_REWARD': {
      const newReward = action.payload;
      return {
        ...state,
        customRewards: [...(state.customRewards || []), newReward],
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
      // Clean out lingering post-1, story-welcome-fluke, or mock generator items from cache
      const cleanedFeed = (parsed.feedPosts || []).filter((p) => {
        if (p.id === 'post-1') return false;
        if (p.beforeImage?.includes('photo-1585837575652') || p.afterImage?.includes('photo-1556911220')) return false;
        return true;
      });
      const cleanedStories = (parsed.stories || []).filter((s) => s.id !== 'story-welcome-fluke');
      const cleanedHistory = (parsed.history || []).filter(
        (h) => !h.id.startsWith('hist-2026') && !h.id.startsWith('hist-2025')
      );
      return {
        ...parsed,
        history: cleanedHistory,
        feedPosts: cleanedFeed,
        stories: cleanedStories,
      };
    }
  } catch (e) {
    console.warn('Initial state parse error:', e);
  }

  return {
    history: [],
    feedPosts: [],
    stories: [],
    notifications: [],
    backendVotes: {
      'member-fluke': 'reward-1',
    },
  };
}

export function AppProvider({ children }) {
  const { members: authMembers, currentUser } = useAuth();
  const [state, dispatch] = useReducer(reducer, null, getInitialState);

  // 1. Initial & Recurring Sync with SQLite Backend
  const syncWithBackend = useCallback(async () => {
    try {
      // Sync Posts (can be empty array if no posts exist yet)
      const backendPosts = await api.fetchPosts(currentUser?.id);
      if (Array.isArray(backendPosts)) {
        dispatch({ type: 'SET_POSTS', payload: backendPosts });
      }

      // Sync Stories / Highlights (แยกกับโพสต์ฟีด)
      const backendStories = await api.fetchStories();
      if (Array.isArray(backendStories)) {
        dispatch({ type: 'SET_STORIES', payload: backendStories });
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

  const deletePost = async (postId) => {
    dispatch({ type: 'DELETE_POST', payload: { postId } });
    try {
      await api.deletePost(postId);
      syncWithBackend();
    } catch (err) {
      console.warn('Backend delete post warning:', err.message);
    }
  };

  const deleteComment = async (postId, commentId) => {
    dispatch({ type: 'DELETE_COMMENT', payload: { postId, commentId } });
    try {
      await api.deleteComment(postId, commentId);
      syncWithBackend();
    } catch (err) {
      console.warn('Backend delete comment warning:', err.message);
    }
  };

  const addReward = async (rewardData) => {
    try {
      const res = await api.createReward(rewardData);
      if (res?.reward) {
        dispatch({ type: 'ADD_REWARD', payload: res.reward });
      }
      syncWithBackend();
      return res;
    } catch (err) {
      console.warn('Backend add reward warning:', err.message);
      dispatch({
        type: 'ADD_REWARD',
        payload: {
          id: `reward-${Date.now()}`,
          ...rewardData,
          unlockAt: rewardData.target || 300,
        },
      });
    }
  };

  // STORIES / HIGHLIGHTS (แยกกับโพสต์ฟีด)
  const addStory = async (storyData) => {
    const tempId = `story-${Date.now()}`;
    const newStory = {
      id: tempId,
      memberId: storyData.memberId || currentUser?.id,
      photo: storyData.photo || null,
      caption: storyData.caption || '',
      bgGradient: storyData.bgGradient || 'from-rose-500 to-amber-500',
      textColor: storyData.textColor || '#ffffff',
      stickers: storyData.stickers || '',
      timestamp: Date.now(),
      member: currentUser,
    };

    dispatch({ type: 'ADD_STORY', payload: newStory });

    try {
      const res = await api.createStory(storyData);
      if (res?.story) {
        dispatch({ type: 'ADD_STORY', payload: res.story });
      }
      syncWithBackend();
      return res;
    } catch (err) {
      console.warn('Backend create story error, saved locally:', err.message);
    }
  };

  const deleteStory = async (storyId) => {
    dispatch({ type: 'DELETE_STORY', payload: { storyId } });
    try {
      await api.deleteStory(storyId);
      syncWithBackend();
    } catch (err) {
      console.warn('Backend delete story error:', err.message);
    }
  };

  const replyStory = async (storyId, { senderId, text, emoji }) => {
    try {
      await api.replyStory(storyId, { senderId: senderId || currentUser?.id, text, emoji });
      syncWithBackend();
    } catch (err) {
      console.warn('Backend reply story error:', err.message);
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
    stories: state.stories || DEFAULT_STORIES,
    notifications: state.notifications || DEFAULT_NOTIFICATIONS,
    markNotificationsRead,
    getWeeklyData,
    getMonthlyData,
    getYearlyData,
    addChoreEntry,
    addRoutineEntry,
    likePost,
    addComment,
    deletePost,
    deleteComment,
    addStory,
    deleteStory,
    replyStory,
    addReward,
    voteReward,
    getRewardVotes,
    getMemberVote,
    unlockedRewards,
    rewards: [...REWARDS, ...(state.customRewards || [])],
    syncWithBackend,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
