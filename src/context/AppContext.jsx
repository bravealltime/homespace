import { createContext, useContext, useReducer, useEffect, useMemo, useCallback, useState } from 'react';
import { MONTHLY_GOAL, REWARDS, PRAISE_STICKERS, generateInitialHistory } from '../data';
import { useAuth } from './AuthContext';
import * as api from '../services/api';
import { getUIText } from '../utils/i18n';

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

    case 'SET_NOTES':
      return { ...state, notes: action.payload };

    case 'ADD_NOTE':
      return {
        ...state,
        notes: [action.payload, ...(state.notes || []).filter((n) => n.id !== action.payload.id)],
      };

    case 'UPDATE_NOTE_ACK': {
      const { noteId, acknowledgments } = action.payload;
      return {
        ...state,
        notes: (state.notes || []).map((n) => (n.id === noteId ? { ...n, acknowledgments } : n)),
      };
    }

    case 'DELETE_NOTE':
      return {
        ...state,
        notes: (state.notes || []).filter((n) => n.id !== action.payload.noteId),
      };

    case 'SET_MILESTONES':
      return { ...state, milestones: action.payload };

    case 'ADD_MILESTONE':
      return {
        ...state,
        milestones: [...(state.milestones || []).filter((m) => m.id !== action.payload.id), action.payload].sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        ),
      };

    case 'DELETE_MILESTONE':
      return {
        ...state,
        milestones: (state.milestones || []).filter((m) => m.id !== action.payload.milestoneId),
      };

    case 'SET_REWARDS_DATA':
      return {
        ...state,
        backendVotes: action.payload.memberVotes || {},
        totalScoreMonth: action.payload.totalScoreMonth ?? state.totalScoreMonth,
      };

    case 'SET_STATS_DATA':
      return {
        ...state,
        backendMemberScores: action.payload.memberScores || {},
        totalScoreMonth: action.payload.totalScoreMonth ?? state.totalScoreMonth,
        history: action.payload.recentEntries || state.history,
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
      const { memberId, caption, photo, photos, category, points } = action.payload;
      const today = new Date().toISOString().split('T')[0];
      const routineId = `routine-${Date.now()}`;
      const postPhotos = Array.isArray(photos) && photos.length > 0 ? photos : (photo ? [photo] : []);
      const primaryPhoto = postPhotos[0] || null;

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
        imageUrl: primaryPhoto,
      };

      const newFeedPost = {
        id: `post-routine-${Date.now()}`,
        type: 'routine',
        memberId,
        caption,
        photo: primaryPhoto,
        photos: postPhotos,
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
      const { recipientId, notificationId } = action.payload || {};
      return {
        ...state,
        notifications: (state.notifications || []).map((n) => {
          if (notificationId && n.id === notificationId) {
            return { ...n, isRead: true };
          }
          if (recipientId && n.recipientId === recipientId) {
            return { ...n, isRead: true };
          }
          if (!recipientId && !notificationId) {
            return { ...n, isRead: true };
          }
          return n;
        }),
      };
    }

    case 'CLEAR_NOTIFICATIONS': {
      const { recipientId } = action.payload || {};
      return {
        ...state,
        notifications: recipientId
          ? (state.notifications || []).filter((n) => n.recipientId !== recipientId)
          : [],
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

    case 'TOGGLE_SENIOR_MODE': {
      const nextVal = !state.seniorMode;
      try {
        localStorage.setItem('homespace_senior_mode', String(nextVal));
      } catch {}
      return {
        ...state,
        seniorMode: nextVal,
      };
    }

    case 'SET_SENIOR_MODE': {
      const nextVal = Boolean(action.payload);
      try {
        localStorage.setItem('homespace_senior_mode', String(nextVal));
      } catch {}
      return {
        ...state,
        seniorMode: nextVal,
      };
    }

    default:
      return state;
  }
}

function getInitialState() {
  try {
    // Purge any legacy stale mock state from localStorage
    localStorage.removeItem('homespace-state');
  } catch (e) {
    // ignore
  }

  let initialSeniorMode = false;
  try {
    initialSeniorMode = localStorage.getItem('homespace_senior_mode') === 'true';
  } catch (e) {}

  return {
    history: [],
    feedPosts: [],
    stories: [],
    notifications: [],
    notes: [],
    milestones: [],
    backendVotes: {},
    backendMemberScores: {},
    totalScoreMonth: 0,
    seniorMode: initialSeniorMode,
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

      // Sync Stats (scores, monthly total, recent real history)
      const stats = await api.fetchStatsSummary();
      if (stats) {
        dispatch({ type: 'SET_STATS_DATA', payload: stats });
      }

      // Sync Digital Fridge Notes (กระดานตู้เย็น)
      const backendNotes = await api.fetchNotes();
      if (Array.isArray(backendNotes)) {
        dispatch({ type: 'SET_NOTES', payload: backendNotes });
      }

      // Sync Family Milestones (วันสำคัญ & นับถอยหลัง)
      const backendMilestones = await api.fetchMilestones();
      if (Array.isArray(backendMilestones)) {
        dispatch({ type: 'SET_MILESTONES', payload: backendMilestones });
      }
    } catch (err) {
      // Backend momentarily restarting; silent fallback
    }
  }, [currentUser?.id]);

  useEffect(() => {
    syncWithBackend();
    const interval = setInterval(syncWithBackend, 8000); // 8-second background poll
    return () => clearInterval(interval);
  }, [syncWithBackend]);

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
    const calculatedMonth = monthEntries
      .filter((e) => e.memberId === m.id)
      .reduce((sum, e) => sum + (e.points || 0), 0);
    memberScoresMonth[m.id] = state.backendMemberScores?.[m.id] !== undefined
      ? state.backendMemberScores[m.id]
      : calculatedMonth;
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

  const markNotificationsRead = async (recipientId, notificationId) => {
    dispatch({ type: 'MARK_NOTIFICATIONS_READ', payload: { recipientId, notificationId } });
    try {
      await api.markNotificationsAsRead(recipientId, notificationId);
    } catch (err) {
      console.warn('Backend notification read warning:', err.message);
    }
  };

  const clearNotifications = async (recipientId) => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS', payload: { recipientId } });
    try {
      await api.clearNotifications(recipientId);
    } catch (err) {
      console.warn('Backend clear notifs warning:', err.message);
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

  // Digital Fridge Notes (กระดานตู้เย็น)
  const addNote = async (noteData) => {
    const tempId = `note-${Date.now()}`;
    const newNote = {
      id: tempId,
      familyId: 'family-main',
      memberId: noteData.memberId || currentUser?.id,
      text: noteData.text,
      color: noteData.color || 'yellow',
      isPinned: 1,
      acknowledgments: [],
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_NOTE', payload: newNote });
    try {
      const res = await api.createNote(noteData);
      if (res?.note) dispatch({ type: 'ADD_NOTE', payload: res.note });
      syncWithBackend();
      return res;
    } catch (err) {
      console.warn('Backend create note error:', err.message);
    }
  };

  const toggleNoteAck = async (noteId) => {
    const note = (state.notes || []).find((n) => n.id === noteId);
    if (!note || !currentUser?.id) return;
    const currentAcks = note.acknowledgments || [];
    const nextAcks = currentAcks.includes(currentUser.id)
      ? currentAcks.filter((m) => m !== currentUser.id)
      : [...currentAcks, currentUser.id];
    dispatch({ type: 'UPDATE_NOTE_ACK', payload: { noteId, acknowledgments: nextAcks } });
    try {
      await api.toggleNoteAck(noteId, currentUser.id);
      syncWithBackend();
    } catch (err) {
      console.warn('Backend toggle note ack error:', err.message);
    }
  };

  const deleteNote = async (noteId) => {
    dispatch({ type: 'DELETE_NOTE', payload: { noteId } });
    try {
      await api.deleteNote(noteId);
      syncWithBackend();
    } catch (err) {
      console.warn('Backend delete note error:', err.message);
    }
  };

  // Family Milestones & Countdown (ปฏิทินวันสำคัญ & นับถอยหลัง)
  const addMilestone = async (milestoneData) => {
    const tempId = `milestone-${Date.now()}`;
    const newMilestone = {
      id: tempId,
      familyId: 'family-main',
      title: milestoneData.title,
      date: milestoneData.date,
      emoji: milestoneData.emoji || '🎂',
      category: milestoneData.category || 'event',
      memberId: milestoneData.memberId || currentUser?.id,
      taggedMemberIds: milestoneData.taggedMemberIds || [],
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_MILESTONE', payload: newMilestone });
    try {
      const res = await api.createMilestone(milestoneData);
      if (res?.milestone) dispatch({ type: 'ADD_MILESTONE', payload: res.milestone });
      syncWithBackend();
      return res;
    } catch (err) {
      console.warn('Backend create milestone error:', err.message);
    }
  };

  const deleteMilestone = async (milestoneId) => {
    dispatch({ type: 'DELETE_MILESTONE', payload: { milestoneId } });
    try {
      await api.deleteMilestone(milestoneId);
      syncWithBackend();
    } catch (err) {
      console.warn('Backend delete milestone error:', err.message);
    }
  };

  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('hs_language') || 'th';
    } catch {
      return 'th';
    }
  });

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next = prev === 'th' ? 'en' : 'th';
      try {
        localStorage.setItem('hs_language', next);
      } catch {}
      return next;
    });
  };

  const t = useCallback((key, fallback = '') => {
    return getUIText(language, key, fallback);
  }, [language]);

  const [autoTranslate, setAutoTranslate] = useState(() => {
    try {
      return localStorage.getItem('hs_auto_translate') === 'true';
    } catch {
      return false;
    }
  });

  const toggleAutoTranslate = () => {
    setAutoTranslate((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('hs_auto_translate', String(next));
      } catch {}
      return next;
    });
  };

  // PWA Install Prompt State & Handlers
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
      setIsStandalone(isStandaloneMode);

      const handleBeforeInstallPrompt = (e) => {
        e.preventDefault();
        setDeferredInstallPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
  }, []);

  const promptInstallApp = useCallback(async () => {
    if (deferredInstallPrompt) {
      try {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsStandalone(true);
          setDeferredInstallPrompt(null);
          return true;
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }
    setInstallModalOpen(true);
    return false;
  }, [deferredInstallPrompt]);

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
    notes: state.notes || [],
    milestones: state.milestones || [],
    addNote,
    toggleNoteAck,
    deleteNote,
    addMilestone,
    deleteMilestone,
    markNotificationsRead,
    clearNotifications,
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
    seniorMode: Boolean(state.seniorMode),
    toggleSeniorMode: () => dispatch({ type: 'TOGGLE_SENIOR_MODE' }),
    setSeniorMode: (val) => dispatch({ type: 'SET_SENIOR_MODE', payload: val }),
    language,
    toggleLanguage,
    setLanguage,
    t,
    autoTranslate,
    toggleAutoTranslate,
    deferredInstallPrompt,
    isStandalone,
    installModalOpen,
    setInstallModalOpen,
    promptInstallApp,
    syncWithBackend,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
