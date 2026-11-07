import { useState, useMemo } from 'react';
import {
  Gift,
  LockKey,
  LockKeyOpen,
  Heart,
  Star,
  Users,
  Plus,
  X,
  Sparkle,
  Trophy,
  CheckCircle,
  Fire,
  Crown,
  Confetti,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import FamilySummary from './FamilySummary';

function MemberAvatar({ member, size = 'sm' }) {
  const sizeMap = {
    sm: 'w-7 h-7 text-xs rounded-xl',
    md: 'w-9 h-9 text-sm rounded-xl',
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
      className={`${sizeMap[size]} flex items-center justify-center text-xs border border-[#ECE7DF] shadow-2xs shrink-0 font-bold`}
      style={{ backgroundColor: `${member?.color || '#5F8D75'}20` }}
    >
      {member?.avatar || '😊'}
    </div>
  );
}

export default function MonthlyRewards() {
  const { currentUser } = useAuth();
  const {
    members,
    rewards,
    totalScoreMonth,
    monthlyGoal,
    voteReward,
    getRewardVotes,
    getMemberVote,
    unlockedRewards,
    addReward,
  } = useApp();

  const [subTab, setSubTab] = useState('rewards');
  const [filterCategory, setFilterCategory] = useState('all');
  const [votedRewardId, setVotedRewardId] = useState(null);
  const [isProposeOpen, setIsProposeOpen] = useState(false);
  const [proposeName, setProposeName] = useState('');
  const [proposeEmoji, setProposeEmoji] = useState('🍕');
  const [proposeTarget, setProposeTarget] = useState(300);
  const [proposeCategory, setProposeCategory] = useState('อาหาร');
  const [proposeDesc, setProposeDesc] = useState('');
  const [celebratedReward, setCelebratedReward] = useState(null);

  const monthName = new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

  // Current logged in member
  const myMember = members.find((m) => m.phone === currentUser?.phone) || currentUser;
  const votingMemberId = myMember?.id;
  const currentMemberVote = votingMemberId ? getMemberVote(votingMemberId) : null;

  const handleVote = (rewardId) => {
    if (!votingMemberId) return;
    voteReward(rewardId, votingMemberId);
    setVotedRewardId(rewardId);
    setTimeout(() => setVotedRewardId(null), 400);
  };

  const handleProposeSubmit = (e) => {
    e.preventDefault();
    if (!proposeName.trim()) return;
    addReward({
      name: proposeName.trim(),
      emoji: proposeEmoji || '🎁',
      target: parseInt(proposeTarget, 10) || 300,
      category: proposeCategory || 'กิจกรรม',
      description: proposeDesc.trim() || 'รางวัลพิเศษที่ครอบครัวเสนอ',
    });
    setProposeName('');
    setProposeDesc('');
    setIsProposeOpen(false);
  };

  const handleCelebrate = (reward) => {
    setCelebratedReward(reward);
  };

  // Find top-voted reward
  const topReward = useMemo(() => {
    return rewards.reduce((best, r) => {
      const votes = getRewardVotes(r.id);
      return votes > (best?.votes || 0) ? { ...r, votes } : best;
    }, null);
  }, [rewards, getRewardVotes]);

  const getVoters = (rewardId) => {
    return members.filter((m) => getMemberVote(m.id) === rewardId);
  };

  // Filter rewards
  const filteredRewards = useMemo(() => {
    return rewards.filter((r) => {
      const isUnlocked = totalScoreMonth >= r.unlockAt;
      if (filterCategory === 'unlocked') return isUnlocked;
      if (filterCategory === 'locked') return !isUnlocked;
      if (filterCategory === 'food') return r.category === 'อาหาร';
      if (filterCategory === 'trip') return r.category === 'ท่องเที่ยว' || r.category === 'กิจกรรม';
      return true;
    });
  }, [rewards, filterCategory, totalScoreMonth]);

  const progressTotal = Math.min(100, Math.round((totalScoreMonth / Math.max(1, monthlyGoal)) * 100));

  return (
    <div className="space-y-4 pb-28">
      {/* 1. iOS-style Subtab Switcher: Rewards vs Stats */}
      <div className="p-1.5 bg-white rounded-2xl border border-[#ECE7DF] shadow-xs flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSubTab('rewards')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'rewards'
              ? 'bg-[#5F8D75] text-white shadow-xs scale-100'
              : 'text-[#746C65] hover:text-[#2D2825] hover:bg-[#FAF8F5]'
          }`}
        >
          <span>🎁</span>
          <span className="whitespace-nowrap">ของรางวัลครอบครัว</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap shrink-0 ${
            subTab === 'rewards' ? 'bg-white/25 text-white' : 'bg-[#FAF8F5] text-[#746C65]'
          }`}>
            {unlockedRewards.length}/{rewards.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('summary')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'summary'
              ? 'bg-[#5F8D75] text-white shadow-xs scale-100'
              : 'text-[#746C65] hover:text-[#2D2825] hover:bg-[#FAF8F5]'
          }`}
        >
          <span>📊</span>
          <span className="whitespace-nowrap">สถิติบ้าน & อันดับ MVP</span>
        </button>
      </div>

      {subTab === 'summary' ? (
        <FamilySummary />
      ) : (
        <>
          {/* 2. Hero Goal Vault Card (เป้าหมายสะสมแต้มของบ้าน) */}
          <section className="bg-gradient-to-br from-white via-[#FAF8F5] to-[#EEF4F0] rounded-3xl p-4 sm:p-5 border border-[#ECE7DF] shadow-xs space-y-4 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF5EB] border border-[#E88D67]/30 text-[#E88D67] flex items-center justify-center text-2xl shadow-xs shrink-0">
                  🎁
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-[#2D2825] leading-tight">
                    หน้ารางวัลประจำเดือน
                  </h2>
                  <p className="text-xs text-[#746C65] mt-0.5">
                    {monthName} · ร่วมกันทำความสะอาดและสะสมแต้ม
                  </p>
                </div>
              </div>

              {/* Total Unlocked Badge */}
              <div className="px-3 py-1.5 rounded-2xl bg-white border border-[#5F8D75]/30 shadow-2xs text-center shrink-0">
                <span className="text-[10px] text-[#746C65] font-bold block leading-none">ปลดล็อกแล้ว</span>
                <span className="text-sm font-black text-[#5F8D75] leading-tight">
                  {unlockedRewards.length} / {rewards.length}
                </span>
              </div>
            </div>

            {/* Score Progress Bar */}
            <div className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-[#ECE7DF] shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#746C65] flex items-center gap-1.5">
                  <span>🏺 แต้มในโหลของบ้าน</span>
                  <span className="text-[#5F8D75] font-black">({progressTotal}%)</span>
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-base font-black text-[#5F8D75]">{totalScoreMonth}</span>
                  <span className="text-xs text-[#746C65] font-normal">/ {monthlyGoal} แต้ม</span>
                </div>
              </div>

              <div className="w-full h-3 rounded-full bg-[#FAF8F5] border border-[#ECE7DF] overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#5F8D75] via-[#7BB397] to-[#E88D67] transition-all duration-700 shadow-xs"
                  style={{ width: `${progressTotal}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#746C65] pt-0.5">
                <span>เป้าหมาย 0 แต้ม</span>
                <span className="font-semibold text-[#E88D67]">
                  {totalScoreMonth >= monthlyGoal
                    ? '🎉 บรรลุเป้าหมายเดือนนี้แล้ว!'
                    : `ขาดอีก ${monthlyGoal - totalScoreMonth} แต้ม ถึงเป้าหมายใหญ่`}
                </span>
                <span>{monthlyGoal} แต้ม</span>
              </div>
            </div>

            {/* Top Voted Family Choice Highlight Banner */}
            {topReward && topReward.votes > 0 && (
              <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-[#FFF5EB] to-[#FAF8F5] border border-[#E88D67]/40 shadow-2xs flex items-center gap-3">
                <span className="text-3xl shrink-0 p-1.5 bg-white rounded-xl shadow-2xs border border-[#ECE7DF]">
                  {topReward.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-[#E88D67] bg-white px-2 py-0.5 rounded-full border border-[#E88D67]/30 shadow-2xs">
                      🏆 อันดับ 1 ที่คนในบ้านอยากได้มากที่สุด
                    </span>
                  </div>
                  <p className="text-sm font-black text-[#2D2825] truncate mt-1">
                    {topReward.name}
                  </p>
                  <p className="text-xs text-[#746C65]">
                    มีคนในบ้านร่วมโหวตแล้ว <strong className="text-[#E88D67] font-black">{topReward.votes} คน</strong>
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* 3. Category Filter & Propose Button */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'all', label: `ทั้งหมด (${rewards.length})` },
                { id: 'unlocked', label: `🎉 ปลดล็อกแล้ว (${unlockedRewards.length})` },
                { id: 'locked', label: `🔒 รอดำเนินการ` },
                { id: 'food', label: `🍲 ของกิน` },
                { id: 'trip', label: `🏖️ ทริป/กิจกรรม` },
              ].map((pill) => {
                const isActive = filterCategory === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setFilterCategory(pill.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs ${
                      isActive
                        ? 'bg-[#2D2825] text-white shadow-xs'
                        : 'bg-white text-[#746C65] border border-[#ECE7DF] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsProposeOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5F8D75] hover:bg-[#476E5B] text-white text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95 shrink-0 ml-auto"
            >
              <Plus size={14} weight="bold" />
              <span>เสนอรางวัลใหม่</span>
            </button>
          </div>

          {/* 4. Rewards Cards Grid (Clean, Responsive, Spacious) */}
          <div className="space-y-3">
            {filteredRewards.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-[#ECE7DF] text-center space-y-2">
                <span className="text-3xl">🎁</span>
                <p className="text-sm font-bold text-[#2D2825]">ไม่พบรางวัลในหมวดนี้</p>
                <p className="text-xs text-[#746C65]">แตะเลือกหมวดหมู่อื่น หรือแตะ "เสนอรางวัลใหม่" ได้เลยจ้า</p>
              </div>
            ) : (
              filteredRewards.map((reward) => {
                const isUnlocked = totalScoreMonth >= reward.unlockAt;
                const votes = getRewardVotes(reward.id);
                const isVotedByMe = currentMemberVote === reward.id;
                const voters = getVoters(reward.id);
                const progress = Math.min(100, Math.round((totalScoreMonth / Math.max(1, reward.unlockAt)) * 100));

                return (
                  <div
                    key={reward.id}
                    className={`bg-white rounded-3xl p-4 sm:p-5 border transition-all shadow-xs space-y-3.5 relative overflow-hidden ${
                      isUnlocked
                        ? 'border-[#5F8D75]/40 ring-1 ring-[#5F8D75]/20 hover:border-[#5F8D75]'
                        : 'border-[#ECE7DF] hover:border-[#ECE7DF]/80'
                    }`}
                  >
                    {/* Header Row: Emoji Tile + Info + Vote Button */}
                    <div className="flex items-start gap-3">
                      {/* Big Emoji Box */}
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 border shadow-2xs transition-transform ${
                          isUnlocked
                            ? 'bg-[#EEF4F0] border-[#5F8D75]/30'
                            : 'bg-[#F5F1EB] border-[#ECE7DF] opacity-80'
                        }`}
                      >
                        {isUnlocked ? reward.emoji : '🔒'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#FAF8F5] text-[#746C65] border border-[#ECE7DF]">
                            {reward.category || 'รางวัลพิเศษ'}
                          </span>

                          {isUnlocked ? (
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-[#EEF4F0] text-[#5F8D75] border border-[#5F8D75]/30 flex items-center gap-1">
                              <span>✓</span>
                              <span>ปลดล็อกแล้ว</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#FAF8F5] text-[#9E958D] border border-[#ECE7DF]">
                              เป้าหมาย {reward.unlockAt} แต้ม
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-black text-[#2D2825] leading-tight">
                          {reward.name}
                        </h3>

                        <p className="text-xs text-[#746C65] leading-relaxed mt-1">
                          {reward.description}
                        </p>
                      </div>

                      {/* Heart Vote Pill on Top-Right */}
                      {isUnlocked && (
                        <button
                          type="button"
                          onClick={() => handleVote(reward.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-90 shrink-0 shadow-2xs border whitespace-nowrap ${
                            isVotedByMe
                              ? 'bg-[#E88D67] text-white border-[#E88D67] shadow-xs'
                              : 'bg-[#FAF8F5] hover:bg-[#FFF5EB] text-[#E88D67] border-[#E88D67]/30'
                          }`}
                          title={isVotedByMe ? 'แตะเพื่อยกเลิกการโหวต' : 'แตะเพื่อโหวตรางวัลนี้'}
                        >
                          <Heart size={16} weight={isVotedByMe ? 'fill' : 'bold'} className="shrink-0" />
                          <span className="whitespace-nowrap">{votes > 0 ? votes : 'โหวต'}</span>
                        </button>
                      )}
                    </div>

                    {/* Progress to Unlock (when locked) */}
                    {!isUnlocked ? (
                      <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#ECE7DF] space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-[#746C65] flex items-center gap-1">
                            <LockKey size={14} weight="bold" />
                            <span>ต้องการ {reward.unlockAt} แต้ม</span>
                          </span>
                          <span className="font-black text-[#E88D67]">
                            ขาดอีก {reward.unlockAt - totalScoreMonth} แต้ม ({progress}%)
                          </span>
                        </div>
                        <div className="h-2 bg-white rounded-full overflow-hidden border border-[#ECE7DF]">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-[#E88D67] rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Celebratory Unlocked Actions Bar */
                      <div className="p-3 rounded-2xl bg-[#EEF4F0]/60 border border-[#5F8D75]/25 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <span className="text-xs font-black text-[#5F8D75] flex items-center gap-1">
                            <CheckCircle size={16} weight="fill" />
                            <span>ทุกคนในบ้านปลดล็อกแล้ว!</span>
                          </span>

                          {votes > 0 && (
                            <div className="flex items-center gap-1 ml-auto sm:ml-2">
                              <div className="flex -space-x-1.5">
                                {voters.map((v) => (
                                  <MemberAvatar key={v.id} member={v} size="sm" />
                                ))}
                              </div>
                              <span className="text-[11px] font-bold text-[#746C65]">
                                {votes} คนโหวต
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Celebrate Button */}
                        <button
                          type="button"
                          onClick={() => handleCelebrate(reward)}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-black bg-[#5F8D75] hover:bg-[#476E5B] text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                        >
                          <Trophy size={15} weight="bold" />
                          <span>ฉลองรางวัลนี้กับครอบครัว 🎉</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Celebrate Modal */}
          {celebratedReward && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-enter-rise"
              onClick={() => setCelebratedReward(null)}
            >
              <div
                className="bg-white rounded-3xl border border-[#ECE7DF] shadow-2xl w-full max-w-sm p-6 text-center space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FFF5EB] border-2 border-[#E88D67]/40 flex items-center justify-center text-5xl shadow-md animate-bounce">
                  {celebratedReward.emoji}
                </div>

                <div>
                  <span className="text-xs font-black text-[#E88D67] bg-[#FFF5EB] px-3 py-1 rounded-full border border-[#E88D67]/30">
                    🎉 ปลดล็อกความสุขของบ้านสำเร็จ!
                  </span>
                  <h3 className="text-lg font-black text-[#2D2825] mt-2">
                    {celebratedReward.name}
                  </h3>
                  <p className="text-xs text-[#746C65] mt-1 leading-relaxed">
                    {celebratedReward.description}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[#EEF4F0] border border-[#5F8D75]/30 text-xs font-bold text-[#5F8D75]">
                  เก่งกันทุกคนเลยจ้า! มาร่วมฉลองด้วยกันในมื้อพิเศษนี้นะครับ ❤️
                </div>

                <button
                  type="button"
                  onClick={() => setCelebratedReward(null)}
                  className="w-full py-3 rounded-2xl bg-[#5F8D75] hover:bg-[#476E5B] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-95"
                >
                  เย้! รับทราบแล้ว 🥳
                </button>
              </div>
            </div>
          )}

          {/* Propose New Reward Modal */}
          {isProposeOpen && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-enter-rise"
              onClick={() => setIsProposeOpen(false)}
            >
              <div
                className="bg-white rounded-3xl border border-[#ECE7DF] shadow-2xl w-full max-w-sm p-5 space-y-4 text-[#2D2825]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#ECE7DF]">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎁</span>
                    <div>
                      <h3 className="text-sm font-black text-[#2D2825]">เสนอของรางวัลใหม่</h3>
                      <p className="text-[11px] text-[#746C65]">ให้ทุกคนในบ้านช่วยกันโหวตและสะสมแต้ม</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsProposeOpen(false)}
                    className="w-8 h-8 rounded-full bg-[#FAF8F5] flex items-center justify-center text-xs text-[#746C65] hover:text-[#2D2825] cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleProposeSubmit} className="space-y-3.5">
                  {/* Select Emoji */}
                  <div>
                    <label className="text-xs font-bold text-[#746C65] block mb-1.5">
                      เลือกไอคอนรางวัล:
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {['🍕', '🍣', '🎬', '🏖️', '🎮', '🍦', '🍖', '🎢', '⛺', '☕'].map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setProposeEmoji(em)}
                          className={`text-2xl p-2 rounded-2xl border text-center transition-all cursor-pointer ${
                            proposeEmoji === em
                              ? 'bg-[#EEF4F0] border-[#5F8D75] scale-105 shadow-2xs'
                              : 'bg-[#FAF8F5] border-[#ECE7DF] hover:bg-white'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Pill Toggle */}
                  <div>
                    <label className="text-xs font-bold text-[#746C65] block mb-1">
                      หมวดหมู่:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['อาหาร', 'ท่องเที่ยว', 'กิจกรรม'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setProposeCategory(cat)}
                          className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            proposeCategory === cat
                              ? 'bg-[#5F8D75] text-white border-[#5F8D75]'
                              : 'bg-[#FAF8F5] text-[#746C65] border-[#ECE7DF]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reward Name */}
                  <div>
                    <label className="text-xs font-bold text-[#746C65] block mb-1">
                      ชื่อของรางวัล (เช่น บุฟเฟต์ชาบู, ดูหนังที่โรง):
                    </label>
                    <input
                      type="text"
                      required
                      value={proposeName}
                      onChange={(e) => setProposeName(e.target.value)}
                      placeholder="เช่น ไปกินพิซซ่าฉลองพร้อมหน้า..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECE7DF] text-xs sm:text-sm text-[#2D2825] focus:outline-none focus:border-[#5F8D75]"
                    />
                  </div>

                  {/* Target Points */}
                  <div>
                    <label className="text-xs font-bold text-[#746C65] block mb-1.5">
                      แต้มที่ต้องสะสมเพื่อปลดล็อก:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[200, 350, 500].map((pts) => (
                        <button
                          key={pts}
                          type="button"
                          onClick={() => setProposeTarget(pts)}
                          className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                            proposeTarget === pts
                              ? 'bg-[#5F8D75] text-white border-[#5F8D75]'
                              : 'bg-[#FAF8F5] text-[#746C65] border-[#ECE7DF]'
                          }`}
                        >
                          {pts} แต้ม
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-bold text-[#746C65] block mb-1">
                      คำอธิบายเพิ่มเติม (ไม่บังคับ):
                    </label>
                    <input
                      type="text"
                      value={proposeDesc}
                      onChange={(e) => setProposeDesc(e.target.value)}
                      placeholder="เช่น นั่งล้อมวงกินพร้อมกันสุดสัปดาห์นี้..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECE7DF] text-xs text-[#2D2825] focus:outline-none focus:border-[#5F8D75]"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsProposeOpen(false)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[#FAF8F5] text-[#746C65] border border-[#ECE7DF] cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={!proposeName.trim()}
                      className="flex-1 py-2.5 rounded-xl text-xs font-black bg-[#5F8D75] text-white hover:bg-[#476E5B] shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                    >
                      บันทึกรางวัล ✨
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
