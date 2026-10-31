import { useState } from 'react';
import {
  Heart,
  ChatCircle,
  Plus,
  SquaresFour,
  Rows,
  Broom,
  Camera,
  Sparkle,
  ArrowLeft,
  X,
  Trash,
  PencilSimple,
  SpeakerHigh,
  Microphone,
  Globe,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { translateText, hasThaiCharacters, getTargetLanguage } from '../utils/translator';
import {
  speakThai,
  stopSpeaking,
  createThaiSpeechRecognition,
  SENIOR_QUICK_BLESSINGS,
} from '../utils/speechHelper';
import CreatePostModal from './CreatePostModal';
import CreateStoryModal from './CreateStoryModal';
import ProfileModal from './ProfileModal';

function timeAgo(timestamp) {
  if (!timestamp) return 'เมื่อสักครู่';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชม. ที่แล้ว`;
  const days = Math.floor(hours / 24);
  return `${days} วันที่แล้ว`;
}

function MemberAvatar({ member, size = 'md' }) {
  const sizeMap = {
    xs: 'w-6 h-6 text-xs rounded-full',
    comment: 'w-7 h-7 text-xs rounded-full',
    sm: 'w-8 h-8 text-sm rounded-full',
    md: 'w-10 h-10 text-base rounded-full',
    lg: 'w-16 h-16 text-2xl rounded-full',
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

  return (
    <div
      className={`${sizeMap[size]} flex items-center justify-center border border-[#ECE7DF] shadow-2xs font-bold shrink-0 bg-[#FAF8F5]`}
    >
      {member?.avatar || '😊'}
    </div>
  );
}

export default function MyFeedProfile({ onNavigateTab, viewingMember, onBackToMe }) {
  const { currentUser, members } = useAuth();
  const { feedPosts, stories, deleteStory, replyStory, likePost, addComment, deletePost, deleteComment, language, t } = useApp();

  const [viewMode, setViewMode] = useState('feed'); // 'feed' | 'grid'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'chore' | 'routine'
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [viewingStoryItem, setViewingStoryItem] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedGridPost, setSelectedGridPost] = useState(null);
  const [translations, setTranslations] = useState({});

  const handleTranslate = async (key, text) => {
    if (!text) return;
    if (translations[key]?.isVisible) {
      setTranslations((prev) => ({
        ...prev,
        [key]: { ...prev[key], isVisible: false },
      }));
      return;
    }
    if (translations[key]?.text) {
      setTranslations((prev) => ({
        ...prev,
        [key]: { ...prev[key], isVisible: true },
      }));
      return;
    }
    setTranslations((prev) => ({
      ...prev,
      [key]: { isTranslating: true, isVisible: true, text: '' },
    }));
    try {
      const translated = await translateText(text);
      setTranslations((prev) => ({
        ...prev,
        [key]: { isTranslating: false, isVisible: true, text: translated },
      }));
    } catch {
      setTranslations((prev) => ({
        ...prev,
        [key]: { isTranslating: false, isVisible: false, text },
      }));
    }
  };

  // Senior & Voice States (ระบบอ่านออกเสียง & คำตอบด่วนสำหรับผู้สูงวัย)
  const [speakingPostId, setSpeakingPostId] = useState(null);
  const [speakingCommentId, setSpeakingCommentId] = useState(null);
  const [recordingPostId, setRecordingPostId] = useState(null);
  const [seniorToast, setSeniorToast] = useState('');

  const handleDeletePost = (postId) => {
    if (window.confirm('คุณต้องการลบโพสต์นี้ใช่หรือไม่?')) {
      deletePost(postId);
    }
  };

  // Determine which profile is being viewed: currentUser or another member
  const activeMember = viewingMember || currentUser;
  const isMe = activeMember?.id === currentUser?.id;
  const memberStories = (stories || []).filter((s) => s.memberId === activeMember?.id);

  // Filter posts that belong to this member
  // (Matches memberId, and also pairs member-big with the older sibling/Fluke)
  const memberPosts = (feedPosts || []).filter((p) => {
    if (p.memberId === activeMember?.id) return true;
    if (
      p.memberId === 'member-big' &&
      (activeMember?.name?.toLowerCase().includes('fluke') ||
        activeMember?.role?.includes('พี่') ||
        activeMember?.name === 'พี่เบล')
    ) {
      return true;
    }
    return false;
  });

  // Filter by type
  const filteredPosts = memberPosts.filter((post) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'chore') return post.type === 'chore';
    if (activeFilter === 'routine') return post.type === 'routine';
    return true;
  });

  // Calculate stats
  const totalPoints = memberPosts.reduce((sum, p) => sum + (p.points || 0), 0);
  const totalLikes = memberPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalComments = memberPosts.reduce((sum, p) => sum + (p.comments?.length || 0), 0);

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
      setRecordingPostId(null);
      return;
    }

    const recognition = createThaiSpeechRecognition({
      onResult: (transcript) => {
        setCommentText((prev) => ({
          ...prev,
          [postId]: transcript,
        }));
      },
      onError: () => setRecordingPostId(null),
      onEnd: () => setRecordingPostId(null),
    });

    if (recognition) {
      try {
        recognition.start();
        setRecordingPostId(postId);
      } catch (err) {
        console.warn('Voice record start error:', err);
      }
    } else {
      alert('เบราว์เซอร์นี้ยังไม่รองรับระบบสั่งการด้วยเสียง กรุณาใช้ปุ่มคำตอบด่วนด้านล่างแทนครับ');
    }
  };

  return (
    <div className="space-y-3.5 pb-24 animate-enter-rise select-none relative">
      {/* Accessibility Toast */}
      {seniorToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#2D2825] text-white px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-xl border border-white/20 animate-enter-rise flex items-center gap-2 pointer-events-none">
          <span>✨</span>
          <span>{seniorToast}</span>
        </div>
      )}

      {/* Back button if viewing another family member */}
      {!isMe && (
        <button
          type="button"
          onClick={onBackToMe}
          className="flex items-center gap-1.5 text-xs font-bold text-[#5F8D75] hover:underline px-1 py-0.5 cursor-pointer"
        >
          <ArrowLeft size={16} weight="bold" />
          <span>กลับไปหน้าโปรไฟล์ของฉัน</span>
        </button>
      )}

      {/* 1. Profile Header Card */}
      <section className="bg-white rounded-3xl p-4 border border-[#ECE7DF] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-[#5F8D75] to-[#E88D67] shadow-xs">
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#FAF8F5] flex items-center justify-center text-2xl font-bold">
                    {activeMember?.avatarType === 'image' && activeMember?.avatarImage ? (
                      <img src={activeMember.avatarImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      activeMember?.avatar || '😊'
                    )}
                  </div>
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#5F8D75] text-white text-[9px] font-black border border-white">
                {activeMember?.role || 'สมาชิก'}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black text-[#2D2825]">{activeMember?.name}</h2>
                {isMe && (
                  <span className="text-[10px] text-[#5F8D75] bg-[#EEF4F0] px-1.5 py-0.2 rounded-md font-bold">
                    คุณ
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#746C65]">
                {isMe ? 'ฟีดและบันทึกส่วนตัวของคุณ' : `โพสต์และงานบ้านของ ${activeMember?.name}`}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-[#5F8D75] font-bold mt-0.5">
                <span>🍯 แต้มโหลสะสม:</span>
                <span className="bg-[#EEF4F0] px-1.5 py-0.2 rounded-md">+{totalPoints} แต้ม</span>
              </div>
            </div>
          </div>

          {/* Actions: Edit Profile + Create Post */}
          {isMe && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="flex items-center gap-1 px-3 py-2 bg-[#FAF8F5] hover:bg-[#ECE7DF] text-[#746C65] hover:text-[#2D2825] text-xs font-bold rounded-2xl border border-[#ECE7DF] transition-all cursor-pointer shadow-2xs"
                title="แก้ไขข้อมูลส่วนตัว"
              >
                <PencilSimple size={14} weight="bold" />
                <span>แก้ไข</span>
              </button>
              <button
                type="button"
                onClick={() => setCreatePostOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#5F8D75] hover:bg-[#476E5B] text-white text-xs font-black rounded-2xl shadow-xs transition-all cursor-pointer"
              >
                <Plus size={15} weight="bold" />
                <span>โพสต์</span>
              </button>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#ECE7DF]/70 text-center">
          <div className="bg-[#FAF8F5] p-2 rounded-2xl">
            <p className="text-sm font-black text-[#2D2825]">{memberPosts.length}</p>
            <p className="text-[10px] text-[#746C65] font-semibold">โพสต์</p>
          </div>
          <div className="bg-[#FAF8F5] p-2 rounded-2xl">
            <p className="text-sm font-black text-[#E88D67]">{totalLikes}</p>
            <p className="text-[10px] text-[#746C65] font-semibold">ได้รับหัวใจ ❤️</p>
          </div>
          <div className="bg-[#FAF8F5] p-2 rounded-2xl">
            <p className="text-sm font-black text-[#5F8D75]">{totalComments}</p>
            <p className="text-[10px] text-[#746C65] font-semibold">คอมเมนต์ 💬</p>
          </div>
        </div>

        {/* Instagram-Style Highlights Bar */}
        <div className="pt-2.5 border-t border-[#ECE7DF]/70">
          <div className="flex items-center justify-between mb-2 px-0.5">
            <span className="text-[11px] font-black text-[#2D2825] flex items-center gap-1.5">
              <span>ไฮไลท์สตอรี่</span>
              <span className="text-[9px] bg-[#EEF4F0] text-[#5F8D75] px-1.5 py-0.2 rounded font-bold">
                {memberStories.length}
              </span>
            </span>
            {isMe && (
              <button
                type="button"
                onClick={() => setCreateStoryOpen(true)}
                className="text-[10px] font-bold text-[#E88D67] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <Plus size={12} weight="bold" />
                <span>+ ลงไฮไลท์ใหม่</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            {/* If isMe, show Add Highlight circle */}
            {isMe && (
              <button
                type="button"
                onClick={() => setCreateStoryOpen(true)}
                className="flex flex-col items-center gap-1 group text-center cursor-pointer shrink-0"
              >
                <div className="w-13 h-13 rounded-full border-2 border-dashed border-[#ECE7DF] hover:border-[#5F8D75] bg-[#FAF8F5] flex items-center justify-center text-[#746C65] group-hover:text-[#5F8D75] transition-all">
                  <Plus size={18} weight="bold" />
                </div>
                <span className="text-[10px] font-bold text-[#746C65]">ใหม่</span>
              </button>
            )}

            {/* Member Stories Circles */}
            {memberStories.map((st, idx) => (
              <button
                key={st.id || idx}
                type="button"
                onClick={() => setViewingStoryItem(st)}
                className="flex flex-col items-center gap-1 group text-center cursor-pointer shrink-0"
              >
                <div className="w-13 h-13 rounded-full p-[2px] bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] shadow-2xs group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full bg-white p-[1.5px]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#FAF8F5] flex items-center justify-center">
                      {st.photo ? (
                        <img src={st.photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${st.bgGradient || 'from-rose-500 to-amber-500'} flex items-center justify-center text-xs text-white font-bold`}>
                          ✨
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#2D2825] truncate max-w-[54px]">
                  {st.caption ? st.caption.slice(0, 6) + '...' : `สตอรี่ ${idx + 1}`}
                </span>
              </button>
            ))}

            {!isMe && memberStories.length === 0 && (
              <p className="text-[10px] text-[#9E958D] italic py-2">
                ยังไม่มีไฮไลท์สตอรี่ที่บันทึกไว้
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 2. Controls: Filter Pills & View Mode (Timeline vs Grid) */}
      <div className="flex items-center justify-between gap-1.5 px-0.5">
        {/* Filter Pills with horizontal scroll support on small screens */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar min-w-0 pr-1">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all whitespace-nowrap text-[11px] sm:text-xs font-bold cursor-pointer shrink-0 ${
              activeFilter === 'all'
                ? 'bg-[#2D2825] text-white shadow-2xs'
                : 'bg-white text-[#746C65] border border-[#ECE7DF]'
            }`}
          >
            ทั้งหมด ({memberPosts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('chore')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all whitespace-nowrap text-[11px] sm:text-xs font-bold cursor-pointer shrink-0 ${
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
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all whitespace-nowrap text-[11px] sm:text-xs font-bold cursor-pointer shrink-0 ${
              activeFilter === 'routine'
                ? 'bg-[#E88D67] text-white shadow-2xs'
                : 'bg-white text-[#746C65] border border-[#ECE7DF]'
            }`}
          >
            📸 กิจกรรม
          </button>
        </div>

        {/* View Switcher (Feed vs Grid) */}
        <div className="flex items-center bg-white p-0.5 rounded-xl border border-[#ECE7DF] shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('feed')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'feed'
                ? 'bg-[#2D2825] text-white shadow-2xs'
                : 'text-[#746C65] hover:text-[#2D2825]'
            }`}
            title="มุมมองฟีดเต็ม"
          >
            <Rows size={16} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-[#2D2825] text-white shadow-2xs'
                : 'text-[#746C65] hover:text-[#2D2825]'
            }`}
            title="มุมมองตารางรูป"
          >
            <SquaresFour size={16} weight="bold" />
          </button>
        </div>
      </div>

      {/* 3. Empty State */}
      {filteredPosts.length === 0 && (
        <div className="bg-white rounded-3xl p-8 border border-[#ECE7DF] shadow-2xs text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#FAF8F5] flex items-center justify-center text-3xl">
            📷
          </div>
          <div>
            <h3 className="text-sm font-black text-[#2D2825]">
              {isMe ? 'ยังไม่มีโพสต์ของคุณ' : `ยังไม่มีโพสต์ของ ${activeMember?.name}`}
            </h3>
            <p className="text-xs text-[#746C65] mt-1">
              {isMe
                ? 'เริ่มแชร์ภาพกิจกรรมหรืองานบ้าน เพื่อสะสมแต้มเข้าโหลและรับคอมเมนต์จากครอบครัว'
                : 'เมื่อคนนี้โพสต์เรื่องราวหรืองานบ้าน จะแสดงที่นี่'}
            </p>
          </div>
          {isMe && (
            <button
              type="button"
              onClick={() => setCreatePostOpen(true)}
              className="px-4 py-2.5 bg-[#5F8D75] text-white text-xs font-bold rounded-2xl shadow-xs hover:bg-[#476E5B] transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={15} weight="bold" />
              <span>สร้างโพสต์แรกของคุณเลย ✨</span>
            </button>
          )}
        </div>
      )}

      {/* 4. GRID VIEW (Instagram Style 3x3) */}
      {viewMode === 'grid' && filteredPosts.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {filteredPosts.map((post) => {
            const photoUrl = post.photo || post.afterImage || post.beforeImage;
            return (
              <div
                key={post.id}
                onClick={() => setSelectedGridPost(post)}
                className="relative aspect-square rounded-2xl overflow-hidden bg-black/5 border border-[#ECE7DF] cursor-pointer group"
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl bg-[#FAF8F5]">
                    {post.type === 'chore' ? '🧹' : '📸'}
                  </div>
                )}

                {/* Overlay with Likes and Comments count */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold">
                  <span className="flex items-center gap-0.5">
                    <Heart size={13} weight="fill" />
                    <span>{post.likes || 0}</span>
                  </span>
                  <span className="flex items-center gap-0.5">
                    <ChatCircle size={13} weight="fill" />
                    <span>{post.comments?.length || 0}</span>
                  </span>
                </div>

                {post.type === 'chore' && (
                  <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded backdrop-blur-xs font-bold">
                    งานบ้าน
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. TIMELINE FEED VIEW (Full Post Cards with Comments) */}
      {viewMode === 'feed' && filteredPosts.length > 0 && (
        <div className="space-y-3.5">
          {filteredPosts.map((post) => {
            const isChore = post.type === 'chore';
            const commentsList = post.comments || [];

            return (
              <article
                key={post.id}
                className="bg-white rounded-3xl border border-[#ECE7DF] shadow-xs overflow-hidden"
              >
                {/* Post Header */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <MemberAvatar member={activeMember} size="md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#2D2825]">
                          {activeMember?.name}
                        </span>
                        <span className="text-[10px] text-[#9E958D]">({activeMember?.role})</span>
                      </div>
                      <p className="text-[10px] text-[#9E958D]">{timeAgo(post.timestamp)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-[#EEF4F0] text-[#5F8D75] text-[10px] font-black border border-[#5F8D75]/20">
                      +{post.points} แต้ม
                    </span>
                    {isMe && (
                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1 text-[#9E958D] hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="ลบโพสต์นี้"
                      >
                        <Trash size={16} weight="bold" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Media */}
                {isChore ? (
                  <div className="px-3.5 space-y-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative rounded-2xl overflow-hidden bg-black/5 aspect-4/3 border border-[#ECE7DF]">
                        {post.beforeImage ? (
                          <img src={post.beforeImage} alt="ก่อนทำ" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[#746C65]">ก่อนทำ</div>
                        )}
                        <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                          ก่อนทำ
                        </span>
                      </div>

                      <div className="relative rounded-2xl overflow-hidden bg-black/5 aspect-4/3 border border-[#5F8D75]/40 ring-1 ring-[#5F8D75]/20">
                        {post.afterImage || post.imageUrl ? (
                          <img src={post.afterImage || post.imageUrl} alt="หลังทำ" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[#746C65]">หลังทำ</div>
                        )}
                        <span className="absolute bottom-2 left-2 bg-[#5F8D75] text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-2xs">
                          หลังทำ ✨
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  post.photo && (
                    <div className="px-3.5">
                      <div className="w-full h-52 rounded-2xl overflow-hidden border border-[#ECE7DF] bg-black/5">
                        <img src={post.photo} alt="รูปกิจกรรม" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )
                )}

                {/* Action Bar (Likes & Comments Count) */}
                <div className="px-3.5 pt-3 pb-1 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => likePost(post.id, currentUser?.id)}
                      className="flex items-center gap-1 text-[#2D2825] hover:text-[#E88D67] transition-all active:scale-125 cursor-pointer"
                    >
                      <Heart
                        size={22}
                        weight={post.isLiked ? 'fill' : 'regular'}
                        className={post.isLiked ? 'text-[#E88D67]' : 'text-[#2D2825]'}
                      />
                    </button>
                    <span className="flex items-center gap-1 text-xs text-[#746C65] font-bold">
                      <ChatCircle size={22} weight="regular" />
                      <span>{commentsList.length}</span>
                    </span>
                  </div>

                  {isChore && (
                    <span className="text-[10px] font-bold text-[#5F8D75] bg-[#EEF4F0] px-2 py-0.5 rounded-full flex items-center gap-1 border border-[#5F8D75]/20">
                      <span>✨</span>
                      <span>สะอาดเรียบร้อย</span>
                    </span>
                  )}
                </div>

                {/* Likes count */}
                <div className="px-3.5 pb-1">
                  {(post.likes || 0) > 0 ? (
                    <p className="text-xs font-bold text-[#2D2825]">
                      ถูกใจ {post.likes} คน
                    </p>
                  ) : (
                    <p className="text-[11px] text-[#9E958D]">
                      ยังไม่มีคนกดถูกใจ
                    </p>
                  )}
                </div>

                {/* Caption with Audio Speaker */}
                {post.caption && (
                  <div className="px-3.5 pb-2 text-xs leading-relaxed text-[#2D2825]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-bold mr-1.5">{activeMember?.name}:</span>
                        <span>{post.caption}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Audio Read Button (🔊) */}
                        <button
                          type="button"
                          onClick={() => handleToggleSpeakPost(post.id, `${activeMember?.name || 'สมาชิก'} เล่าว่า ${post.caption}`)}
                          className={`shrink-0 px-2 py-0.5 rounded-full transition-all cursor-pointer flex items-center gap-1 border text-[10px] font-bold ${
                            speakingPostId === post.id
                              ? 'bg-[#5F8D75] text-white border-[#5F8D75] animate-pulse shadow-xs'
                              : 'bg-[#FAF8F5] hover:bg-[#EEF4F0] text-[#746C65] hover:text-[#5F8D75] border-[#ECE7DF]'
                          }`}
                          title="ฟังเสียงอ่านข้อความนี้"
                        >
                          <SpeakerHigh size={12} weight={speakingPostId === post.id ? 'fill' : 'bold'} />
                          <span>{speakingPostId === post.id ? (t ? t('stopListen', 'หยุด') : 'หยุด') : (t ? t('listen', 'ฟัง') : 'ฟัง')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                <div className="px-3.5 pb-3.5 pt-2 border-t border-[#ECE7DF]/60 space-y-2.5">
                  <p className="text-[11px] font-bold text-[#746C65] flex items-center justify-between">
                    <span>💬 ความคิดเห็น ({commentsList.length})</span>
                    {commentsList.length > 0 && (
                      <span className="text-[10px] text-[#5F8D75]">คนในบ้านมาให้กำลังใจ</span>
                    )}
                  </p>

                  {commentsList.length > 0 ? (
                    <div className="space-y-2">
                      {commentsList.map((c) => {
                        const commenter = members.find((m) => m.id === c.memberId);
                        return (
                          <div key={c.id} className="flex items-start gap-2">
                            <MemberAvatar member={commenter} size="comment" />
                            <div className="flex-1 bg-[#FAF8F5] rounded-2xl rounded-tl-xs px-3 py-2 border border-[#ECE7DF]/80 text-xs shadow-2xs">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-[#2D2825] text-xs">
                                    {commenter?.name || 'สมาชิก'}
                                  </span>
                                  {commenter?.role && (
                                    <span className="text-[10px] text-[#9E958D]">({commenter.role})</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {/* Comment Translate Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleTranslate(`comment-${c.id}`, c.text)}
                                    className="text-[10px] font-semibold text-[#3B82F6] hover:underline flex items-center gap-0.5 cursor-pointer"
                                    title="แปลภาษาคอมเมนต์นี้"
                                  >
                                    <Globe size={11} />
                                    <span>{translations[`comment-${c.id}`]?.isVisible ? (t ? t('translatedComment', 'แปลแล้ว') : 'แปลแล้ว') : (t ? t('translateComment', 'แปล') : 'แปล')}</span>
                                  </button>

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
                                    <span className="text-[9px] text-[#B0A79E]">{timeAgo(c.timestamp)}</span>
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
                              <p className="text-[#3E3834] leading-relaxed break-words text-xs">{c.text}</p>

                              {/* Translated Comment Box */}
                              {translations[`comment-${c.id}`]?.isVisible && (
                                <div className="mt-1 pt-1 border-t border-[#BFDBFE]/40 text-[11px] text-[#1E3A8A] flex items-start gap-1">
                                  <Globe size={11} className="text-[#3B82F6] shrink-0 mt-0.5" />
                                  <p className="font-medium">
                                    {translations[`comment-${c.id}`]?.isTranslating
                                      ? (t ? t('translating', 'กำลังแปล...') : 'กำลังแปล...')
                                      : translations[`comment-${c.id}`]?.text || c.text}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#9E958D] py-1 text-center bg-[#FAF8F5] rounded-xl border border-dashed border-[#ECE7DF]">
                      ยังไม่มีใครคอมเมนต์ในโพสต์นี้
                    </p>
                  )}

                  {/* 1-Tap Quick Blessings (ปุ่มตอบด่วน 1 คลิก) */}
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

                  {/* Inline Reply Box with Voice Mic */}
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
        </div>
      )}

      {/* 6. Post Detail Modal (when clicked from Grid View) */}
      {selectedGridPost && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs select-none"
          onClick={() => setSelectedGridPost(null)}
        >
          <div
            className="relative bg-white rounded-3xl border border-[#ECE7DF] shadow-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto animate-enter-rise text-[#2D2825] p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#ECE7DF]">
              <h3 className="text-sm font-black text-[#2D2825]">รายละเอียดโพสต์</h3>
              <button
                type="button"
                onClick={() => setSelectedGridPost(null)}
                className="w-7 h-7 rounded-full bg-[#FAF8F5] flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden aspect-4/3 bg-black/5 border border-[#ECE7DF]">
              <img
                src={selectedGridPost.photo || selectedGridPost.afterImage || selectedGridPost.beforeImage}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-xs text-[#2D2825] leading-relaxed">
              <span className="font-bold mr-1.5">{activeMember?.name}:</span>
              {selectedGridPost.caption}
            </p>

            <div className="space-y-1.5 pt-2 border-t border-[#ECE7DF]">
              <p className="text-[11px] font-bold text-[#746C65]">ความคิดเห็น ({selectedGridPost.comments?.length || 0}):</p>
              {(selectedGridPost.comments || []).map((c) => {
                const commenter = members.find((m) => m.id === c.memberId);
                return (
                  <div key={c.id} className="flex items-start gap-1.5 text-xs bg-[#FAF8F5] p-2 rounded-xl">
                    <MemberAvatar member={commenter} size="xs" />
                    <div>
                      <span className="font-bold mr-1">{commenter?.name}:</span>
                      <span className="text-[#3E3834]">{c.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        initialMode="routine"
      />

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={createStoryOpen}
        onClose={() => setCreateStoryOpen(false)}
      />

      {/* Story Quick Preview Modal from Profile */}
      {viewingStoryItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-enter-rise text-white"
          onClick={() => setViewingStoryItem(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl bg-[#23201D] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="p-3.5 flex items-center justify-between bg-black/40 backdrop-blur-md border-b border-white/10">
              <div className="flex items-center gap-2">
                <MemberAvatar member={activeMember} size="sm" />
                <div>
                  <p className="text-xs font-bold leading-none">{activeMember?.name}</p>
                  <p className="text-[10px] text-white/70 leading-none mt-1">{timeAgo(viewingStoryItem.timestamp)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isMe && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('คุณต้องการลบไฮไลท์สตอรี่นี้ใช่หรือไม่?')) {
                        deleteStory(viewingStoryItem.id);
                        setViewingStoryItem(null);
                      }
                    }}
                    className="w-7 h-7 rounded-full bg-red-500/30 hover:bg-red-500/50 text-red-200 flex items-center justify-center transition-colors cursor-pointer"
                    title="ลบสตอรี่นี้"
                  >
                    <Trash size={15} weight="bold" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingStoryItem(null)}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                >
                  <X size={15} weight="bold" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="relative h-[380px] flex items-center justify-center overflow-hidden">
              {viewingStoryItem.photo ? (
                <img
                  src={viewingStoryItem.photo}
                  alt="Story"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${viewingStoryItem.bgGradient || 'from-rose-500 to-amber-500'}`} />
              )}

              {/* Overlay Caption */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-4 text-center">
                {viewingStoryItem.caption && (
                  <div className="inline-block mx-auto bg-black/50 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-xs font-bold text-white leading-relaxed max-w-[260px]">
                    {viewingStoryItem.caption}
                  </div>
                )}
                {viewingStoryItem.stickers && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {viewingStoryItem.stickers.split(',').filter(Boolean).map((stk, i) => (
                      <span key={i} className="text-2xl drop-shadow-md">
                        {stk}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
