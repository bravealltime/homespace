import { useState, useRef, useEffect } from 'react';
import {
  Heart,
  ChatCircle,
  PaperPlaneRight,
  Camera,
  Broom,
  Sparkle,
  CaretRight,
  CaretLeft,
  DotsThree,
  X,
  Trash,
  Copy,
  Check,
  Flame,
  Target,
  Plus,
  SpeakerHigh,
  Microphone,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  speakThai,
  stopSpeaking,
  createThaiSpeechRecognition,
  SENIOR_QUICK_BLESSINGS,
} from '../utils/speechHelper';
import CreatePostModal from './CreatePostModal';
import CreateStoryModal from './CreateStoryModal';

const MEMBER_THEMES = {
  'member-fluke': { bg: 'from-[#DCECE5] to-[#C2DDD0]', border: 'from-[#5F8D75] via-[#7BA7C2] to-[#E88D67]' },
  'member-dad': { bg: 'from-[#F5E6D3] to-[#EBD2B6]', border: 'from-[#E88D67] via-[#D57B56] to-[#5F8D75]' },
  'member-mom': { bg: 'from-[#FCE4DC] to-[#F5C7B8]', border: 'from-[#FF8A00] via-[#E52E71] to-[#FF0077]' },
  'member-big': { bg: 'from-[#DCECE5] to-[#C2DDD0]', border: 'from-[#5F8D75] via-[#7BA7C2] to-[#E88D67]' },
  'member-little': { bg: 'from-[#DEEBF7] to-[#C3DAEE]', border: 'from-[#7BA7C2] via-[#5F8D75] to-[#E88D67]' },
  default: { bg: 'from-[#FAF8F5] to-[#ECE7DF]', border: 'from-[#E88D67] to-[#5F8D75]' },
};

function MemberAvatar({ member, size = 'md' }) {
  const sizeMap = {
    xs: 'w-6 h-6 text-xs rounded-full',
    comment: 'w-7 h-7 text-xs rounded-full',
    sm: 'w-8 h-8 text-sm rounded-full',
    md: 'w-10 h-10 text-base rounded-full',
    lg: 'w-13 h-13 text-xl rounded-full',
  };

  if (member?.avatarType === 'image' && member?.avatarImage) {
    return (
      <img
        src={member.avatarImage}
        alt={member.name}
        className={`${sizeMap[size]} object-cover border border-[#ECE7DF] shadow-2xs shrink-0`}
      />
    );
  }

  const theme = MEMBER_THEMES[member?.id] || MEMBER_THEMES.default;

  return (
    <div
      className={`${sizeMap[size]} flex items-center justify-center border border-[#ECE7DF] shadow-2xs font-bold shrink-0 bg-gradient-to-br ${theme.bg}`}
    >
      {member?.avatar || '😊'}
    </div>
  );
}

function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชม. ที่แล้ว`;
  const days = Math.floor(hours / 24);
  return `${days} วันที่แล้ว`;
}

export default function TodayHome({ onNavigateTab, onViewMemberProfile }) {
  const { currentUser, isAdmin } = useAuth();
  const {
    members,
    totalScoreMonth,
    monthlyGoal,
    feedPosts,
    stories,
    addStory,
    deleteStory,
    replyStory,
    likePost,
    addComment,
    deletePost,
    deleteComment,
    unlockedRewards,
  } = useApp();

  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [createPostMode, setCreatePostMode] = useState('routine');
  const [selectedChoreId, setSelectedChoreId] = useState('dishes');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentText, setCommentText] = useState({});

  // IG Story / Highlight States
  const [createStoryModalOpen, setCreateStoryModalOpen] = useState(false);
  const [storyViewer, setStoryViewer] = useState(null); // { member, stories, currentIndex }
  const [storyReplyText, setStoryReplyText] = useState('');
  const [storyToast, setStoryToast] = useState('');

  // Senior & Voice States (ระบบอ่านออกเสียง & คำตอบด่วนสำหรับผู้สูงวัย)
  const [speakingPostId, setSpeakingPostId] = useState(null);
  const [speakingCommentId, setSpeakingCommentId] = useState(null);
  const [recordingPostId, setRecordingPostId] = useState(null);
  const [seniorToast, setSeniorToast] = useState('');
  const activeRecognitionRef = useRef(null);

  const [activePostMenuId, setActivePostMenuId] = useState(null);
  const [viewingPhoto, setViewingPhoto] = useState(null);
  const [copiedPostId, setCopiedPostId] = useState(null);
  const [showQuests, setShowQuests] = useState(false);

  const storiesContainerRef = useRef(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const isDraggingRef = useRef(false);

  const openCreatePost = (mode = 'routine', choreId = 'dishes') => {
    setCreatePostMode(mode);
    setSelectedChoreId(choreId);
    setCreatePostModalOpen(true);
  };

  const handleDeletePost = (postId) => {
    if (window.confirm('คุณต้องการลบโพสต์นี้ใช่หรือไม่?')) {
      deletePost(postId);
      setActivePostMenuId(null);
    }
  };

  const handleCopyCaption = (postId, text) => {
    if (text) {
      navigator.clipboard?.writeText(text);
      setCopiedPostId(postId);
      setTimeout(() => setCopiedPostId(null), 2000);
      setActivePostMenuId(null);
    }
  };

  // Story Auto-advance Timer (6s per story)
  useEffect(() => {
    if (!storyViewer || !storyViewer.stories || storyViewer.stories.length === 0) return;
    const timer = setTimeout(() => {
      if (storyViewer.currentIndex < storyViewer.stories.length - 1) {
        setStoryViewer((prev) => ({
          ...prev,
          currentIndex: prev.currentIndex + 1,
        }));
      } else {
        setStoryViewer(null);
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, [storyViewer]);

  const handleOpenMemberStory = (member) => {
    const memberStories = (stories || []).filter((s) => s.memberId === member.id);
    if (memberStories.length === 0) {
      if (member.id === currentUser?.id) {
        setCreateStoryModalOpen(true);
      } else {
        alert(`${member.name} ยังไม่มีไฮไลท์ใหม่ในขณะนี้ครับ ✨`);
      }
      return;
    }

    setStoryViewer({
      member,
      stories: memberStories,
      currentIndex: 0,
    });
    setStoryReplyText('');
    setStoryToast('');
  };

  const handleNextStory = () => {
    if (!storyViewer) return;
    if (storyViewer.currentIndex < storyViewer.stories.length - 1) {
      setStoryViewer((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
      }));
    } else {
      setStoryViewer(null);
    }
  };

  const handlePrevStory = () => {
    if (!storyViewer) return;
    if (storyViewer.currentIndex > 0) {
      setStoryViewer((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex - 1,
      }));
    }
  };

  const handleDeleteCurrentStory = async (storyId) => {
    if (!window.confirm('คุณต้องการลบไฮไลท์สตอรี่นี้ใช่หรือไม่?')) return;
    await deleteStory(storyId);
    if (!storyViewer) return;
    const remaining = storyViewer.stories.filter((s) => s.id !== storyId);
    if (remaining.length === 0) {
      setStoryViewer(null);
    } else {
      setStoryViewer({
        ...storyViewer,
        stories: remaining,
        currentIndex: Math.max(0, Math.min(storyViewer.currentIndex, remaining.length - 1)),
      });
    }
  };

  const handleSendStoryReaction = async (emoji) => {
    const currentStory = storyViewer?.stories[storyViewer.currentIndex];
    if (!currentStory) return;
    await replyStory(currentStory.id, { senderId: currentUser?.id, emoji });
    setStoryToast(`ส่ง ${emoji} ให้ ${storyViewer.member.name} แล้ว! ✨`);
    setTimeout(() => setStoryToast(''), 1800);
  };

  const handleSendStoryText = async () => {
    const currentStory = storyViewer?.stories[storyViewer.currentIndex];
    if (!currentStory || !storyReplyText.trim()) return;
    await replyStory(currentStory.id, { senderId: currentUser?.id, text: storyReplyText.trim() });
    setStoryReplyText('');
    setStoryToast(`ส่งข้อความถึง ${storyViewer.member.name} เรียบร้อยแล้ว ✨`);
    setTimeout(() => setStoryToast(''), 1800);
  };

  // Mouse drag-to-scroll (Smooth swiping for desktop & mobile)
  const handleMouseDown = (e) => {
    if (!storiesContainerRef.current) return;
    setIsMouseDown(true);
    isDraggingRef.current = false;
    setStartX(e.pageX - storiesContainerRef.current.offsetLeft);
    setScrollLeftState(storiesContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown || !storiesContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - storiesContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 4) {
      isDraggingRef.current = true;
    }
    storiesContainerRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 60);
  };

  // Mouse wheel horizontal scrolling
  const handleWheel = (e) => {
    if (!storiesContainerRef.current) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      storiesContainerRef.current.scrollLeft += e.deltaX;
    } else if (Math.abs(e.deltaY) > 0) {
      storiesContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  const progress = Math.min(Math.round((totalScoreMonth / monthlyGoal) * 100), 100);

  // Filter posts
  const filteredPosts = feedPosts.filter((post) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'chore') return post.type === 'chore';
    if (activeFilter === 'routine') return post.type === 'routine';
    return post.memberId === activeFilter;
  });

  // Filter other family members (excluding currentUser so avatar isn't duplicated)
  const otherMembers = members.filter((m) => m.id !== currentUser?.id);
  const myStories = (stories || []).filter((s) => s.memberId === currentUser?.id);

  const handleSendComment = (postId) => {
    const text = commentText[postId]?.trim();
    if (!text) return;
    addComment(postId, currentUser?.id || 'member-fluke', text);
    setCommentText((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleToggleSpeakPost = (postId, text) => {
    if (speakingPostId === postId) {
      stopSpeaking();
      setSpeakingPostId(null);
      return;
    }
    setSpeakingCommentId(null);
    setSpeakingPostId(postId);
    speakThai(
      text,
      () => setSpeakingPostId(postId),
      () => setSpeakingPostId(null)
    );
  };

  const handleToggleSpeakComment = (commentId, text) => {
    if (speakingCommentId === commentId) {
      stopSpeaking();
      setSpeakingCommentId(null);
      return;
    }
    setSpeakingPostId(null);
    setSpeakingCommentId(commentId);
    speakThai(
      text,
      () => setSpeakingCommentId(commentId),
      () => setSpeakingCommentId(null)
    );
  };

  const handleSendQuickBlessing = (postId, text) => {
    addComment(postId, currentUser?.id || 'member-fluke', text);
    setSeniorToast(`ส่ง "${text}" ให้กำลังใจแล้ว 💖`);
    setTimeout(() => setSeniorToast(''), 2500);
  };

  const handleToggleVoiceRecord = (postId) => {
    if (recordingPostId === postId) {
      if (activeRecognitionRef.current) {
        activeRecognitionRef.current.stop();
        activeRecognitionRef.current = null;
      }
      setRecordingPostId(null);
      return;
    }

    if (activeRecognitionRef.current) {
      activeRecognitionRef.current.stop();
      activeRecognitionRef.current = null;
    }

    const recognition = createThaiSpeechRecognition({
      onResult: (transcript) => {
        setCommentText((prev) => ({
          ...prev,
          [postId]: transcript,
        }));
      },
      onError: () => {
        setRecordingPostId(null);
        activeRecognitionRef.current = null;
      },
      onEnd: () => {
        setRecordingPostId(null);
        activeRecognitionRef.current = null;
      },
    });

    if (recognition) {
      try {
        recognition.start();
        activeRecognitionRef.current = recognition;
        setRecordingPostId(postId);
      } catch (err) {
        console.warn('Voice record start error:', err);
      }
    } else {
      alert('เบราว์เซอร์นี้ยังไม่รองรับระบบสั่งการด้วยเสียง กรุณาใช้ปุ่มคำตอบด่วนด้านล่างแทนครับ');
    }
  };

  return (
    <div className="space-y-3 pb-24 relative">
      {/* Floating Accessibility Toast (Feedback when elderly send blessings) */}
      {seniorToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#2D2825] text-white px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-xl border border-white/20 animate-enter-rise flex items-center gap-2 pointer-events-none">
          <span>✨</span>
          <span>{seniorToast}</span>
        </div>
      )}

      {/* 1. Ultra-Clean Instagram Stories / Highlights Bar (แยกกับโพสต์ฟีด) */}
      <section className="bg-white rounded-3xl p-3 sm:p-3.5 border border-[#ECE7DF] shadow-2xs space-y-2.5 select-none">
        {/* Story Bar Subheader */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-[#2D2825]">สตอรี่ครอบครัว</span>
            <span className="text-[10px] bg-[#EEF4F0] text-[#5F8D75] px-2 py-0.5 rounded-full font-bold">
              24 ชม.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCreateStoryModalOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#E88D67] to-[#F15BB5] hover:opacity-90 text-white text-[10px] font-black shadow-2xs cursor-pointer active:scale-95 transition-all"
          >
            <Sparkle size={12} weight="fill" />
            <span>+ ลงไฮไลท์</span>
          </button>
        </div>

        {/* Scrollable Story Avatars */}
        <div
          ref={storiesContainerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`flex items-center gap-4 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-1 pb-0.5 ${
            isMouseDown ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Your Story with + badge */}
          <button
            type="button"
            onClick={() => {
              if (isDraggingRef.current) return;
              if (myStories.length > 0) {
                handleOpenMemberStory(currentUser);
              } else {
                setCreateStoryModalOpen(true);
              }
            }}
            className="flex flex-col items-center gap-1.5 group text-center cursor-pointer select-none shrink-0"
          >
            <div className="relative">
              {/* Outer ring: IG gradient if active stories, or dashed/soft ring if none */}
              <div
                className={`w-[62px] h-[62px] rounded-full p-[2.5px] transition-transform group-hover:scale-105 shadow-2xs ${
                  myStories.length > 0
                    ? 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]'
                    : 'bg-gradient-to-tr from-[#5F8D75] via-[#7BA7C2] to-[#E88D67]'
                }`}
              >
                <div className="w-full h-full rounded-full p-[2px] bg-white">
                  <div className="w-full h-full rounded-full bg-[#FAF8F5] flex items-center justify-center text-2xl font-bold overflow-hidden">
                    {currentUser?.avatarType === 'image' && currentUser?.avatarImage ? (
                      <img src={currentUser.avatarImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      currentUser?.avatar || '😊'
                    )}
                  </div>
                </div>
              </div>

              {/* Instagram-style Plus Badge (Tap opens CreateStoryModal directly) */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setCreateStoryModalOpen(true);
                }}
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#E88D67] hover:bg-[#CF6E46] text-white flex items-center justify-center text-xs font-black border-2 border-white shadow-xs cursor-pointer active:scale-90"
                title="ลงไฮไลท์สตอรี่ใหม่"
              >
                +
              </div>
            </div>
            <div className="flex items-center gap-0.5 justify-center">
              <span className="text-[11px] font-bold text-[#2D2825] tracking-tight">คุณ</span>
              {myStories.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#E88D67] shrink-0" />
              )}
            </div>
          </button>

          {/* Other Members Stories */}
          {otherMembers.map((member) => {
            const memberStories = (stories || []).filter((s) => s.memberId === member.id);
            const hasStories = memberStories.length > 0;
            const theme = MEMBER_THEMES[member.id] || MEMBER_THEMES.default;
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  if (isDraggingRef.current) return;
                  handleOpenMemberStory(member);
                }}
                className="flex flex-col items-center gap-1.5 group text-center cursor-pointer select-none shrink-0"
              >
                {/* Vivid Instagram Story Ring if active stories, or subtle ring if none */}
                <div
                  className={`w-[62px] h-[62px] rounded-full p-[2.5px] transition-transform group-hover:scale-105 shadow-2xs ${
                    hasStories
                      ? 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]'
                      : 'bg-[#ECE7DF]'
                  }`}
                >
                  <div className="w-full h-full rounded-full p-[2px] bg-white">
                    <div
                      className={`w-full h-full rounded-full flex items-center justify-center text-2xl overflow-hidden ${
                        hasStories ? `bg-gradient-to-br ${theme.bg}` : 'bg-[#FAF8F5]'
                      }`}
                    >
                      {member.avatarType === 'image' && member.avatarImage ? (
                        <img src={member.avatarImage} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl drop-shadow-2xs">{member.avatar}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 justify-center">
                  <span
                    className={`text-[11px] font-bold tracking-tight truncate max-w-[62px] ${
                      hasStories ? 'text-[#2D2825]' : 'text-[#9E958D]'
                    }`}
                  >
                    {member.name}
                  </span>
                  {hasStories && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E88D67] shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Mini Clean Jar Bar (แถบโหลคะแนนย่อแบบคลีน) */}
      <section
        onClick={() => onNavigateTab && onNavigateTab('rewards')}
        className="bg-white hover:bg-[#FAF8F5] cursor-pointer rounded-2xl p-2.5 px-3.5 border border-[#ECE7DF] shadow-2xs flex items-center justify-between gap-3 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl shrink-0">🍯</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-[#2D2825]">โหลของบ้าน:</span>
              <span className="text-xs font-black text-[#5F8D75]">{totalScoreMonth}</span>
              <span className="text-[10px] text-[#746C65]">/ {monthlyGoal} แต้ม ({progress}%)</span>
            </div>
            <p className="text-[10px] text-[#E88D67] font-bold truncate">
              {unlockedRewards.length > 0 ? `🎉 ปลดล็อก ${unlockedRewards[0].emoji} ${unlockedRewards[0].name} แล้ว!` : 'สะสมเพื่อปลดล็อกชาบู'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold text-[#5F8D75] shrink-0">
          <span>รางวัล</span>
          <CaretRight size={13} weight="bold" />
        </div>
      </section>

      {/* 2.1 Daily Quests Card (เควสต์งานบ้านประจำวัน แตะเลือกทำได้ทันที) */}
      <section className="bg-white rounded-2xl p-3 border border-[#ECE7DF] shadow-2xs space-y-2">
        <div
          onClick={() => setShowQuests(!showQuests)}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🎯</span>
            <span className="text-xs font-black text-[#2D2825]">เควสต์งานบ้านวันนี้</span>
            <span className="text-[10px] text-[#5F8D75] bg-[#EEF4F0] px-2 py-0.5 rounded-full font-bold">
              รับสูงสุด +120 แต้ม
            </span>
          </div>
          <span className="text-xs font-bold text-[#5F8D75]">
            {showQuests ? 'ซ่อน ▲' : 'ดูเควสต์ทั้งหมด ▼'}
          </span>
        </div>

        {showQuests && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#ECE7DF]">
            {[
              { id: 'dishes', name: 'ล้างจานชาม', emoji: '🧽', points: 25 },
              { id: 'clean', name: 'กวาดถูบ้าน', emoji: '🧹', points: 20 },
              { id: 'laundry', name: 'ซักผ้า-พับผ้า', emoji: '🧺', points: 25 },
              { id: 'bed', name: 'จัดห้องนอน', emoji: '🛏️', points: 20 },
              { id: 'trash', name: 'ทิ้งขยะ', emoji: '🗑️', points: 15 },
            ].map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => openCreatePost('chore', q.id)}
                className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EEF4F0] border border-[#ECE7DF] hover:border-[#5F8D75]/40 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-lg">{q.emoji}</span>
                  <span className="text-[11px] font-bold text-[#2D2825] truncate">{q.name}</span>
                </div>
                <span className="text-[10px] font-black text-[#5F8D75] shrink-0">+{q.points}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 3. Sleek Mobile Create Post Bar (แถบโพสต์เร็วแบบมินิมอล) */}
      <section className="bg-white rounded-2xl p-2 px-3 border border-[#ECE7DF] shadow-2xs flex items-center gap-2.5">
        <div
          onClick={() => onViewMemberProfile && onViewMemberProfile(currentUser)}
          className="cursor-pointer hover:scale-105 transition-transform shrink-0"
          title="ดูโปรไฟล์ของฉัน"
        >
          <MemberAvatar member={currentUser} size="sm" />
        </div>

        <button
          type="button"
          onClick={() => openCreatePost('routine')}
          className="flex-1 bg-[#FAF8F5] hover:bg-[#F2EFEA] text-[#746C65] text-xs font-medium px-3.5 py-2 rounded-full border border-[#ECE7DF] text-left transition-colors cursor-pointer truncate"
        >
          แชร์รูปหรือเรื่องราววันนี้...
        </button>

        <button
          type="button"
          onClick={() => openCreatePost('chore')}
          className="flex items-center gap-1 py-1.5 px-2.5 rounded-full bg-[#EEF4F0] hover:bg-[#E3EEE6] text-[#5F8D75] text-[11px] font-black transition-colors cursor-pointer shrink-0"
          title="ส่งงานบ้าน"
        >
          <Broom size={14} weight="bold" />
          <span>งานบ้าน</span>
        </button>
      </section>

      {/* 4. Filter Pills */}
      <div className="flex items-center gap-1.5 px-1 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            activeFilter === 'all'
              ? 'bg-[#2D2825] text-white shadow-2xs'
              : 'bg-white text-[#746C65] border border-[#ECE7DF]'
          }`}
        >
          ทั้งหมด
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('chore')}
          className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            activeFilter === 'chore'
              ? 'bg-[#5F8D75] text-white shadow-2xs'
              : 'bg-white text-[#746C65] border border-[#ECE7DF]'
          }`}
        >
          🧹 งานบ้าน
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('routine')}
          className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            activeFilter === 'routine'
              ? 'bg-[#E88D67] text-white shadow-2xs'
              : 'bg-white text-[#746C65] border border-[#ECE7DF]'
          }`}
        >
          📸 กิจกรรม
        </button>

        {activeFilter !== 'all' && activeFilter !== 'chore' && activeFilter !== 'routine' && (
          <span className="text-[11px] text-[#5F8D75] bg-[#EEF4F0] px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 whitespace-nowrap shrink-0">
            <span>ดูเฉพาะคนนี้</span>
            <button type="button" onClick={() => setActiveFilter('all')} className="text-xs cursor-pointer">✕</button>
          </span>
        )}
      </div>

      {/* 5. Pure Social Media Timeline Feed (Instagram / Threads Style) */}
      <div className="space-y-3.5">
        {filteredPosts.map((post) => {
          const author = members.find((m) => m.id === post.memberId);
          const isChore = post.type === 'chore';
          const isCommentOpen = activeCommentPostId === post.id;
          const commentsList = post.comments || [];

          return (
            <article
              key={post.id}
              className="bg-white rounded-3xl border border-[#ECE7DF] shadow-xs overflow-hidden"
            >
              {/* Post Header */}
              <div className="p-3.5 flex items-center justify-between">
                <div
                  onClick={() => onViewMemberProfile && onViewMemberProfile(author)}
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                  title={`ดูโปรไฟล์ของ ${author?.name || 'สมาชิก'}`}
                >
                  <MemberAvatar member={author} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#2D2825] group-hover:text-[#5F8D75] truncate transition-colors">
                        {author?.name || 'สมาชิกในบ้าน'}
                      </span>
                      <span className="text-[10px] text-[#9E958D]">({author?.role})</span>
                    </div>
                    <p className="text-[10px] text-[#9E958D]">
                      {timeAgo(post.timestamp)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 relative">
                  {isChore ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EEF4F0] text-[#5F8D75] text-[10px] font-bold border border-[#5F8D75]/20 flex items-center gap-1">
                      <span>{post.choreEmoji || '🧹'}</span>
                      <span>{post.choreName || 'งานบ้าน'}</span>
                      <span className="font-black">+{post.points} แต้ม</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FFF5EB] text-[#E88D67] text-[10px] font-bold border border-[#E88D67]/20 flex items-center gap-1">
                      <span>📸</span>
                      <span>เรื่องราว</span>
                      <span className="font-black">+{post.points} แต้ม</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setActivePostMenuId(activePostMenuId === post.id ? null : post.id)}
                    className="p-1 rounded-full text-[#9E958D] hover:text-[#2D2825] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                    title="ตัวเลือกโพสต์"
                  >
                    <DotsThree size={20} weight="bold" />
                  </button>

                  {/* Post Options Menu */}
                  {activePostMenuId === post.id && (
                    <div className="absolute right-0 top-8 z-30 bg-white rounded-2xl shadow-xl border border-[#ECE7DF] py-1.5 min-w-[140px] animate-enter-rise text-xs">
                      {post.caption && (
                        <button
                          type="button"
                          onClick={() => handleCopyCaption(post.id, post.caption)}
                          className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[#FAF8F5] text-[#2D2825] font-semibold cursor-pointer"
                        >
                          {copiedPostId === post.id ? <Check size={14} className="text-[#5F8D75]" /> : <Copy size={14} />}
                          <span>{copiedPostId === post.id ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความ'}</span>
                        </button>
                      )}
                      {(isAdmin || post.memberId === currentUser?.id || currentUser?.role?.includes('เจ้าบ้าน') || currentUser?.role?.includes('หัวหน้า') || currentUser?.role?.includes('พ่อ') || currentUser?.role?.includes('แม่')) && (
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-red-50 text-red-500 font-semibold cursor-pointer border-t border-[#ECE7DF]/50"
                        >
                          <Trash size={14} />
                          <span>ลบโพสต์นี้</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* POST MEDIA / PHOTO */}
              {isChore ? (
                /* Chore Before & After Proof Display */
                (post.beforeImage || post.afterImage || post.imageUrl) && (
                  <div className="px-3.5 space-y-1.5">
                    {post.beforeImage && (post.afterImage || post.imageUrl) ? (
                      /* Both Before & After are present: show side-by-side comparison */
                      <div className="grid grid-cols-2 gap-2">
                        {/* Before Image */}
                        <div
                          onClick={() => setViewingPhoto(post.beforeImage)}
                          className="relative rounded-2xl overflow-hidden bg-black/5 aspect-4/3 border border-[#ECE7DF] cursor-pointer group"
                          title="แตะเพื่อดูรูปขนาดเต็ม"
                        >
                          <img src={post.beforeImage} alt="ก่อนทำ" className="w-full h-full object-cover group-hover:scale-102 transition-transform" />
                          <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                            ก่อนทำ 🔍
                          </span>
                        </div>

                        {/* After Image */}
                        <div
                          onClick={() => setViewingPhoto(post.afterImage || post.imageUrl)}
                          className="relative rounded-2xl overflow-hidden bg-black/5 aspect-4/3 border border-[#5F8D75]/40 ring-1 ring-[#5F8D75]/20 cursor-pointer group"
                          title="แตะเพื่อดูรูปขนาดเต็ม"
                        >
                          <img src={post.afterImage || post.imageUrl} alt="หลังทำ" className="w-full h-full object-cover group-hover:scale-102 transition-transform" />
                          <span className="absolute bottom-2 left-2 bg-[#5F8D75] text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-2xs">
                            หลังทำ ✨ 🔍
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Only one image is present (e.g. only after or only before) */
                      <div
                        onClick={() => setViewingPhoto(post.afterImage || post.imageUrl || post.beforeImage)}
                        className="w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-[#ECE7DF] bg-black/5 cursor-pointer group relative"
                        title="แตะเพื่อดูรูปขนาดเต็ม"
                      >
                        <img
                          src={post.afterImage || post.imageUrl || post.beforeImage}
                          alt="รูปงานบ้าน"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                        />
                        <span className="absolute bottom-2.5 left-2.5 bg-[#5F8D75] text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm">
                          {post.afterImage || post.imageUrl ? 'รูปผลงาน ✨' : 'รูปก่อนทำ 🔍'}
                        </span>
                      </div>
                    )}
                  </div>
                )
              ) : (
                /* Routine Lifestyle Photo */
                post.photo && (
                  <div className="px-3.5">
                    <div
                      onClick={() => setViewingPhoto(post.photo)}
                      className="w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-[#ECE7DF] bg-black/5 cursor-pointer group"
                      title="แตะเพื่อดูรูปขนาดเต็ม"
                    >
                      <img src={post.photo} alt="รูปกิจกรรม" className="w-full h-full object-cover group-hover:scale-102 transition-transform" />
                    </div>
                  </div>
                )
              )}

              {/* Social Action Bar (Like & Comment Icons) */}
              <div className="px-3.5 pt-3 pb-1 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => likePost(post.id)}
                    className="flex items-center gap-1 text-[#2D2825] hover:text-[#E88D67] transition-all active:scale-125"
                  >
                    <Heart
                      size={22}
                      weight={post.isLiked ? 'fill' : 'regular'}
                      className={post.isLiked ? 'text-[#E88D67]' : 'text-[#2D2825]'}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCommentPostId(isCommentOpen ? null : post.id)}
                    className="flex items-center gap-1 text-[#2D2825] hover:text-[#5F8D75] transition-colors"
                  >
                    <ChatCircle size={22} weight="regular" />
                  </button>
                </div>

                {isChore && (
                  <span className="text-[10px] font-bold text-[#5F8D75] bg-[#EEF4F0] px-2 py-0.5 rounded-full flex items-center gap-1 border border-[#5F8D75]/20">
                    <span>✨</span>
                    <span>สะอาดเรียบร้อย</span>
                  </span>
                )}
              </div>

              {/* Likes Count */}
              <div className="px-3.5 pb-1.5">
                {(post.likes || 0) > 0 ? (
                  <p className="text-xs font-bold text-[#2D2825]">
                    ถูกใจ {post.likes} คน
                  </p>
                ) : (
                  <p className="text-[11px] text-[#9E958D]">
                    ส่งหัวใจคนแรกให้โพสต์นี้ 💖
                  </p>
                )}
              </div>

              {/* Caption (Instagram Format: Username + Text) with Audio Read Button */}
              {post.caption && (
                <div className="px-3.5 pb-2 text-xs leading-relaxed text-[#2D2825] flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-bold mr-1.5">{author?.name || 'สมาชิก'}</span>
                    <span>{post.caption}</span>
                  </div>

                  {/* Audio Read Button (🔊 ฟังเสียงอ่านภาษาไทยสำหรับผู้ใหญ่) */}
                  <button
                    type="button"
                    onClick={() => handleToggleSpeakPost(post.id, `${author?.name || 'สมาชิก'} เล่าว่า ${post.caption}`)}
                    className={`shrink-0 px-2 py-0.5 rounded-full transition-all cursor-pointer flex items-center gap-1 border text-[10px] font-bold ${
                      speakingPostId === post.id
                        ? 'bg-[#5F8D75] text-white border-[#5F8D75] animate-pulse shadow-xs'
                        : 'bg-[#FAF8F5] hover:bg-[#EEF4F0] text-[#746C65] hover:text-[#5F8D75] border-[#ECE7DF]'
                    }`}
                    title={speakingPostId === post.id ? 'แตะเพื่อหยุดอ่าน' : 'แตะเพื่อให้มือถืออ่านข้อความให้ฟัง'}
                  >
                    <SpeakerHigh size={13} weight={speakingPostId === post.id ? 'fill' : 'bold'} />
                    <span>{speakingPostId === post.id ? 'หยุดอ่าน' : 'ฟังเสียง'}</span>
                  </button>
                </div>
              )}

              {/* Comments Section */}
              <div className="px-3.5 pb-3.5 pt-2 border-t border-[#ECE7DF]/60 space-y-2.5">
                {commentsList.length > 0 ? (
                  <div className="space-y-2">
                    {commentsList.map((c) => {
                      const commenter = members.find((m) => m.id === c.memberId);
                      return (
                        <div key={c.id} className="flex items-start gap-2 group">
                          {/* Commenter Avatar (Clickable to view their profile) */}
                          <div
                            onClick={() => onViewMemberProfile && onViewMemberProfile(commenter)}
                            className="cursor-pointer hover:scale-105 transition-transform shrink-0"
                            title={`ดูโปรไฟล์ของ ${commenter?.name}`}
                          >
                            <MemberAvatar member={commenter} size="comment" />
                          </div>

                          {/* Comment Bubble (Instagram / Facebook Style) */}
                          <div className="flex-1 bg-[#FAF8F5] rounded-2xl rounded-tl-xs px-3 py-2 border border-[#ECE7DF]/80 text-xs shadow-2xs">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <div
                                onClick={() => onViewMemberProfile && onViewMemberProfile(commenter)}
                                className="flex items-center gap-1.5 cursor-pointer hover:opacity-80"
                              >
                                <span className="font-bold text-[#2D2825] text-xs">
                                  {commenter?.name || 'สมาชิก'}
                                </span>
                                {commenter?.role && (
                                  <span className="text-[10px] text-[#9E958D]">
                                    ({commenter.role})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {/* Comment Audio Speaker */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleSpeakComment(c.id, `${commenter?.name || 'สมาชิก'} บอกว่า ${c.text}`)}
                                  className={`p-0.5 rounded-full transition-colors cursor-pointer ${
                                    speakingCommentId === c.id ? 'text-[#5F8D75] animate-pulse font-bold' : 'text-[#B0A79E] hover:text-[#5F8D75]'
                                  }`}
                                  title="ฟังเสียงคอมเมนต์นี้"
                                >
                                  <SpeakerHigh size={13} weight={speakingCommentId === c.id ? 'fill' : 'regular'} />
                                </button>
                                {c.timestamp && (
                                  <span className="text-[9px] text-[#B0A79E]">
                                    {timeAgo(c.timestamp)}
                                  </span>
                                )}
                                {(c.memberId === currentUser?.id || post.memberId === currentUser?.id || currentUser?.role?.includes('พ่อ') || currentUser?.role?.includes('แม่')) && (
                                  <button
                                    type="button"
                                    onClick={() => deleteComment(post.id, c.id)}
                                    className="text-[#B0A79E] hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                                    title="ลบคอมเมนต์"
                                  >
                                    <Trash size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-[#3E3834] leading-relaxed break-words text-xs">
                              {c.text}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#9E958D] py-1 text-center">ยังไม่มีความคิดเห็น มาเป็นคนแรกที่ส่งกำลังใจกันเลย ✨</p>
                )}

                {/* 1-Tap Quick Blessings / Praise for Seniors & Family (ปุ่มตอบด่วนสำหรับผู้สูงวัย) */}
                <div className="pt-1 pb-0.5 space-y-1">
                  <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-[#746C65]">
                    <span className="flex items-center gap-1">
                      <span>💬</span>
                      <span>คำตอบด่วนความรัก:</span>
                    </span>
                    <span className="text-[10px] text-[#5F8D75] font-bold">แตะ 1 ครั้งส่งทันที</span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {SENIOR_QUICK_BLESSINGS.map((blessing, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendQuickBlessing(post.id, blessing.text)}
                        className="px-3 py-1.5 rounded-full bg-[#FAF8F5] hover:bg-[#EEF4F0] active:scale-95 text-[#2D2825] hover:text-[#5F8D75] border border-[#ECE7DF] hover:border-[#5F8D75]/40 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs whitespace-nowrap"
                      >
                        {blessing.text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inline Comment Input Box with Voice-to-Text Button */}
                <div className="pt-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <MemberAvatar member={currentUser} size="comment" />
                    <div className="flex-1 relative flex items-center">
                      <input
                        type="text"
                        value={commentText[post.id] || ''}
                        onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendComment(post.id)}
                        placeholder="พิมพ์ข้อความ หรือแตะปุ่มไมค์เพื่อพูด..."
                        className="w-full pl-3.5 pr-22 py-2 bg-[#FAF8F5] focus:bg-white rounded-full border border-[#ECE7DF] focus:border-[#5F8D75] text-xs text-[#2D2825] placeholder:text-[#9E958D] focus:outline-none transition-all shadow-2xs"
                      />
                      <div className="absolute right-1.5 flex items-center gap-1">
                        {/* Voice to Text Microphone Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleVoiceRecord(post.id)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            recordingPostId === post.id
                              ? 'bg-red-500 text-white animate-pulse shadow-xs'
                              : 'text-[#746C65] hover:text-[#5F8D75] hover:bg-black/5'
                          }`}
                          title={recordingPostId === post.id ? 'กำลังฟังเสียง... แตะเพื่อหยุด' : 'แตะแล้วพูดแทนการพิมพ์'}
                        >
                          <Microphone size={15} weight={recordingPostId === post.id ? 'fill' : 'bold'} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendComment(post.id)}
                          disabled={!commentText[post.id]?.trim()}
                          className="px-3 py-1 text-xs font-bold text-white bg-[#5F8D75] hover:bg-[#476E5B] disabled:bg-[#ECE7DF] disabled:text-[#9E958D] rounded-full disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                        >
                          ส่ง
                        </button>
                      </div>
                    </div>
                  </div>

                  {recordingPostId === post.id && (
                    <div className="flex items-center justify-between px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold animate-pulse border border-red-200">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span>กำลังฟังเสียงพูดภาษาไทย... พูดใส่ไมค์ได้เลยครับ</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleVoiceRecord(post.id)}
                        className="text-[10px] underline cursor-pointer"
                      >
                        เสร็จแล้ว
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}

        {filteredPosts.length === 0 && (
          <div className="bg-white/90 backdrop-blur-xs rounded-3xl p-8 border border-[#ECE7DF] shadow-xs text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EEF4F0] text-[#5F8D75] flex items-center justify-center text-2xl shadow-inner">
              🏡
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-[#2D2825] text-base">ยังไม่มีโพสต์ในบ้าน</h3>
              <p className="text-xs text-[#746C65] max-w-xs mx-auto">
                มาร่วมแชร์เรื่องราวความสุข หรือส่งภาพงานบ้านที่ทำสำเร็จเป็นคนแรกของบ้านกันเถอะ ✨
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => openCreatePost('chore')}
                className="px-4 py-2 rounded-xl bg-[#5F8D75] text-white text-xs font-bold shadow-xs hover:bg-[#476E5B] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>🧽 ส่งงานบ้าน (+25 แต้ม)</span>
              </button>
              <button
                type="button"
                onClick={() => openCreatePost('routine')}
                className="px-4 py-2 rounded-xl bg-[#FAF8F5] text-[#2D2825] border border-[#ECE7DF] text-xs font-bold hover:bg-white transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>📸 แชร์เรื่องราว</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Real Instagram Story Fullscreen Viewer Modal */}
      {storyViewer && storyViewer.stories && storyViewer.stories.length > 0 && (() => {
        const currentStory = storyViewer.stories[storyViewer.currentIndex] || storyViewer.stories[0];
        const isOwner = currentStory.memberId === currentUser?.id;
        const stickersArray = currentStory.stickers ? currentStory.stickers.split(',').filter(Boolean) : [];

        return (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-3 sm:p-5 animate-enter-rise text-white backdrop-blur-md select-none"
            onClick={() => setStoryViewer(null)}
          >
            {/* Top Segmented Progress Bars & Header */}
            <div className="space-y-2.5 max-w-sm mx-auto w-full" onClick={(e) => e.stopPropagation()}>
              {/* Progress Bars (1 line per story) */}
              <div className="flex items-center gap-1.5 w-full">
                {storyViewer.stories.map((st, idx) => (
                  <div key={st.id || idx} className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        idx < storyViewer.currentIndex
                          ? 'bg-white w-full'
                          : idx === storyViewer.currentIndex
                          ? 'bg-white w-full animate-pulse'
                          : 'w-0'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Author Row & Close */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2.5">
                  <MemberAvatar member={storyViewer.member} size="sm" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-black text-white leading-tight">
                        {storyViewer.member.name}
                      </p>
                      <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.2 rounded font-bold">
                        {storyViewer.currentIndex + 1}/{storyViewer.stories.length}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/70">
                      {timeAgo(currentStory.timestamp)} · ไฮไลท์สตอรี่
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCurrentStory(currentStory.id)}
                      className="w-8 h-8 rounded-full bg-red-500/30 hover:bg-red-500/50 text-red-200 flex items-center justify-center transition-colors cursor-pointer"
                      title="ลบสตอรี่นี้"
                    >
                      <Trash size={16} weight="bold" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setStoryViewer(null)}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>
              </div>
            </div>

            {/* Center Story Display with Left/Right Tap zones */}
            <div
              className="relative flex-1 max-w-sm mx-auto w-full my-3 flex items-center justify-center overflow-hidden rounded-3xl bg-[#23201D] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Background: Photo or Gradient */}
              {currentStory.photo ? (
                <img
                  src={currentStory.photo}
                  alt="Story"
                  className="w-full h-full object-cover rounded-3xl"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${currentStory.bgGradient || 'from-rose-500 to-amber-500'} flex items-center justify-center p-6 text-center rounded-3xl`} />
              )}

              {/* Subtle top/bottom gradient overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none rounded-3xl" />

              {/* Story Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-between p-5 pointer-events-none">
                <div />

                {/* Center text / caption & stickers */}
                <div className="text-center space-y-2">
                  {currentStory.caption && (
                    <div className="inline-block max-w-[280px] bg-black/50 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-white font-bold text-sm leading-relaxed shadow-lg">
                      {currentStory.caption}
                    </div>
                  )}

                  {stickersArray.length > 0 && (
                    <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                      {stickersArray.map((stk, i) => (
                        <span key={i} className="text-3xl drop-shadow-lg">
                          {stk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Floating toast notification */}
                {storyToast ? (
                  <div className="mx-auto bg-white text-[#2D2825] px-4 py-2 rounded-full font-bold text-xs shadow-xl animate-enter-rise">
                    {storyToast}
                  </div>
                ) : <div />}
              </div>

              {/* Left Tap Zone (Previous Story) */}
              <button
                type="button"
                onClick={handlePrevStory}
                className="absolute left-0 inset-y-0 w-1/3 opacity-0 cursor-pointer"
                title="สตอรี่ก่อนหน้า"
              />

              {/* Right Tap Zone (Next Story) */}
              <button
                type="button"
                onClick={handleNextStory}
                className="absolute right-0 inset-y-0 w-2/3 opacity-0 cursor-pointer"
                title="สตอรี่ถัดไป"
              />
            </div>

            {/* Bottom Controls: Emojis & Reply */}
            <div className="space-y-2 max-w-sm mx-auto w-full" onClick={(e) => e.stopPropagation()}>
              {/* Quick Emojis Reaction Bar */}
              <div className="flex items-center justify-around py-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
                {['❤️', '🔥', '👏', '😂', '😍', '🥳'].map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => handleSendStoryReaction(em)}
                    className="text-2xl hover:scale-125 active:scale-95 transition-transform p-1 cursor-pointer"
                    title={`ส่ง ${em}`}
                  >
                    {em}
                  </button>
                ))}
              </div>

              {/* Text Input Row */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={storyReplyText}
                  onChange={(e) => setStoryReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendStoryText()}
                  placeholder={`ส่งข้อความถึง ${storyViewer.member.name}...`}
                  className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-full text-xs text-white placeholder:text-white/50 focus:outline-none focus:border-white focus:bg-white/20 transition-all"
                />
                <button
                  type="button"
                  onClick={handleSendStoryText}
                  disabled={!storyReplyText.trim()}
                  className="px-4 py-2.5 rounded-full bg-gradient-to-r from-[#E88D67] to-[#F15BB5] text-white font-bold text-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md disabled:opacity-40"
                >
                  ส่ง ✨
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Fullscreen Photo Zoom Preview Modal */}
      {viewingPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md animate-enter-rise"
          onClick={() => setViewingPhoto(null)}
        >
          <div className="relative max-w-lg w-full max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setViewingPhoto(null)}
              className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-sm font-bold cursor-pointer hover:bg-white/40 transition-colors"
            >
              ✕
            </button>
            <img
              src={viewingPhoto}
              alt="ดูรูปขนาดเต็ม"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Fast & Clean Social Media Post Modal (Instagram / Facebook Style) */}
      <CreatePostModal
        isOpen={createPostModalOpen}
        onClose={() => setCreatePostModalOpen(false)}
        initialMode={createPostMode}
        initialChoreId={selectedChoreId}
      />

      {/* Instagram Story / Highlight Creator Modal (แยกเฉพาะ) */}
      <CreateStoryModal
        isOpen={createStoryModalOpen}
        onClose={() => setCreateStoryModalOpen(false)}
      />
    </div>
  );
}
