import { useState, useRef, useEffect } from 'react';
import {
  Heart,
  ChatCircle,
  PaperPlaneRight,
  Camera,
  Broom,
  Sparkle,
  CaretRight,
  DotsThree,
  X,
  Trash,
  Copy,
  Check,
  Flame,
  Target,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import CreatePostModal from './CreatePostModal';

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
  const { currentUser } = useAuth();
  const {
    members,
    totalScoreMonth,
    monthlyGoal,
    feedPosts,
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
  const [viewingStory, setViewingStory] = useState(null); // Story viewer state
  const [storyReplyText, setStoryReplyText] = useState('');
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

  const handleSendStoryReply = () => {
    if (!storyReplyText.trim() || !viewingStory?.post?.id) {
      setViewingStory(null);
      return;
    }
    addComment(viewingStory.post.id, currentUser?.id || 'member-fluke', storyReplyText.trim());
    setStoryReplyText('');
    setViewingStory(null);
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

  const handleOpenStory = (member) => {
    // Find member's most recent post or photo
    const post = feedPosts.find((p) => p.memberId === member.id);
    setViewingStory({
      member,
      post: post || {
        caption: `${member.name} กำลังเพลิดเพลินกับวันสบาย ๆ ที่บ้าน ✨`,
        photo: member.avatarImage || 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=600&q=80',
        timestamp: Date.now() - 3600000,
      },
    });
  };

  const handleSendComment = (postId) => {
    const text = commentText[postId]?.trim();
    if (!text) return;
    addComment(postId, currentUser?.id || 'member-fluke', text);
    setCommentText((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className="space-y-3 pb-24">
      {/* 1. Ultra-Clean Instagram/Facebook Stories Bar (ไฮไลท์สตอรี่คลีน ๆ แบบไม่มีลูกศร) */}
      <section
        ref={storiesContainerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`bg-white rounded-3xl py-3 px-3.5 border border-[#ECE7DF] shadow-2xs overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none ${
          isMouseDown ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div className="flex items-center gap-4 min-w-max">
          {/* Your Story (เรื่องราวของคุณ) with + badge */}
          <button
            type="button"
            onClick={() => {
              if (isDraggingRef.current) return;
              openCreatePost('routine');
            }}
            className="flex flex-col items-center gap-1.5 group text-center cursor-pointer select-none"
          >
            <div className="relative">
              {/* Clean outer ring for user */}
              <div className="w-[62px] h-[62px] rounded-full p-[2.5px] bg-gradient-to-tr from-[#5F8D75] via-[#7BA7C2] to-[#E88D67] group-hover:scale-105 transition-transform shadow-2xs">
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
              {/* Instagram-style Blue/Coral Plus Badge */}
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#E88D67] text-white flex items-center justify-center text-xs font-black border-2 border-white shadow-xs">
                +
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#2D2825] tracking-tight">คุณ</span>
          </button>

          {/* Other Members Stories (พ่อ, แม่, พี่, น้อง) - No Duplicates! */}
          {otherMembers.map((member) => {
            const theme = MEMBER_THEMES[member.id] || MEMBER_THEMES.default;
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  if (isDraggingRef.current) return;
                  handleOpenStory(member);
                }}
                className="flex flex-col items-center gap-1.5 group text-center cursor-pointer select-none"
              >
                {/* Vivid Instagram Story Ring */}
                <div className={`w-[62px] h-[62px] rounded-full p-[2.5px] bg-gradient-to-tr ${theme.border} group-hover:scale-105 transition-transform shadow-2xs`}>
                  {/* Clean white gap separator */}
                  <div className="w-full h-full rounded-full p-[2px] bg-white">
                    {/* Inner avatar container that fills completely */}
                    <div className={`w-full h-full rounded-full bg-gradient-to-br ${theme.bg} flex items-center justify-center text-2xl overflow-hidden`}>
                      {member.avatarType === 'image' && member.avatarImage ? (
                        <img src={member.avatarImage} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl drop-shadow-2xs">{member.avatar}</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#2D2825] tracking-tight truncate max-w-[62px]">
                  {member.name}
                </span>
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
                  <span className="px-2 py-0.5 rounded-full bg-[#EEF4F0] text-[#5F8D75] text-[10px] font-black border border-[#5F8D75]/20">
                    +{post.points} แต้ม
                  </span>
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
                      {(post.memberId === currentUser?.id || currentUser?.role?.includes('พ่อ') || currentUser?.role?.includes('แม่')) && (
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
                <div className="px-3.5 space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Before Image */}
                    <div
                      onClick={() => post.beforeImage && setViewingPhoto(post.beforeImage)}
                      className="relative rounded-2xl overflow-hidden bg-black/5 aspect-4/3 border border-[#ECE7DF] cursor-pointer group"
                      title="แตะเพื่อดูรูปขนาดเต็ม"
                    >
                      {post.beforeImage ? (
                        <img src={post.beforeImage} alt="ก่อนทำ" className="w-full h-full object-cover group-hover:scale-102 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[#746C65]">
                          ก่อนทำ
                        </div>
                      )}
                      <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                        ก่อนทำ 🔍
                      </span>
                    </div>

                    {/* After Image */}
                    <div
                      onClick={() => (post.afterImage || post.imageUrl) && setViewingPhoto(post.afterImage || post.imageUrl)}
                      className="relative rounded-2xl overflow-hidden bg-black/5 aspect-4/3 border border-[#5F8D75]/40 ring-1 ring-[#5F8D75]/20 cursor-pointer group"
                      title="แตะเพื่อดูรูปขนาดเต็ม"
                    >
                      {post.afterImage || post.imageUrl ? (
                        <img src={post.afterImage || post.imageUrl} alt="หลังทำ" className="w-full h-full object-cover group-hover:scale-102 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[#746C65]">
                          หลังทำ
                        </div>
                      )}
                      <span className="absolute bottom-2 left-2 bg-[#5F8D75] text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-2xs">
                        หลังทำ ✨ 🔍
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Routine Lifestyle Photo */
                post.photo && (
                  <div className="px-3.5">
                    <div
                      onClick={() => setViewingPhoto(post.photo)}
                      className="w-full h-52 sm:h-56 rounded-2xl overflow-hidden border border-[#ECE7DF] bg-black/5 cursor-pointer group"
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
                <p className="text-xs font-bold text-[#2D2825]">
                  ถูกใจ {post.likes || 1} คน
                </p>
              </div>

              {/* Caption (Instagram Format: Username + Text) */}
              {post.caption && (
                <div className="px-3.5 pb-2 text-xs leading-relaxed text-[#2D2825]">
                  <span className="font-bold mr-1.5">{author?.name || 'สมาชิก'}</span>
                  <span>{post.caption}</span>
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

                {/* Inline Comment Input Box with Current User Avatar */}
                <div className="pt-1 flex items-center gap-2">
                  <MemberAvatar member={currentUser} size="comment" />
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="text"
                      value={commentText[post.id] || ''}
                      onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendComment(post.id)}
                      placeholder="เขียนความคิดเห็นให้กำลังใจ..."
                      className="w-full pl-3.5 pr-14 py-2 bg-[#FAF8F5] focus:bg-white rounded-full border border-[#ECE7DF] focus:border-[#5F8D75] text-xs text-[#2D2825] placeholder:text-[#9E958D] focus:outline-none transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendComment(post.id)}
                      disabled={!commentText[post.id]?.trim()}
                      className="absolute right-1.5 px-3 py-1 text-xs font-bold text-white bg-[#5F8D75] hover:bg-[#476E5B] disabled:bg-[#ECE7DF] disabled:text-[#9E958D] rounded-full disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                    >
                      ส่ง
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Instagram Story Fullscreen Viewer Modal */}
      {viewingStory && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between p-4 animate-enter-rise text-white backdrop-blur-md"
          onClick={() => setViewingStory(null)}
        >
          {/* Top Progress Bar & Header */}
          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
            {/* Story Progress Bar Line */}
            <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full w-full animate-pulse" />
            </div>

            {/* Author Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MemberAvatar member={viewingStory.member} size="sm" />
                <div>
                  <p className="text-xs font-bold text-white leading-tight">
                    {viewingStory.member.name}
                  </p>
                  <p className="text-[10px] text-white/70">
                    {viewingStory.member.role} · สตอรี่วันนี้
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingStory(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
          </div>

          {/* Center Story Photo */}
          <div className="flex-1 flex items-center justify-center my-4 overflow-hidden rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={viewingStory.post.photo || viewingStory.post.afterImage || viewingStory.member.avatarImage}
              alt="Story"
              className="max-h-[60vh] w-full object-cover rounded-3xl shadow-2xl"
            />
          </div>

          {/* Bottom Story Caption & Quick Heart */}
          <div className="space-y-3 max-w-sm mx-auto w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
              <p className="text-xs text-white leading-relaxed">
                {viewingStory.post.caption}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={storyReplyText}
                onChange={(e) => setStoryReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendStoryReply()}
                placeholder={`ส่งข้อความถึง ${viewingStory.member.name}...`}
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-xs text-white placeholder:text-white/50 focus:outline-none focus:border-white"
              />
              <button
                type="button"
                onClick={handleSendStoryReply}
                className="px-3.5 py-2 rounded-full bg-[#E88D67] text-white flex items-center justify-center font-bold text-xs hover:scale-105 transition-transform cursor-pointer shadow-md"
              >
                ส่ง ✨
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
