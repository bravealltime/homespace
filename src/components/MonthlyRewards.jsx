import { useState } from 'react';
import {
  Gift,
  LockKey,
  LockKeyOpen,
  Heart,
  Star,
  Users,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

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
      className={`${sizeMap[size]} flex items-center justify-center text-xs border border-[#ECE7DF] shadow-2xs shrink-0`}
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
  } = useApp();

  const [votedRewardId, setVotedRewardId] = useState(null);
  const monthName = new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

  // Current logged in member
  const myMember = members.find((m) => m.phone === currentUser?.phone) || currentUser;
  const votingMemberId = myMember?.id;

  const handleVote = (rewardId) => {
    if (!votingMemberId) return;
    voteReward(rewardId, votingMemberId);
    setVotedRewardId(rewardId);
    setTimeout(() => setVotedRewardId(null), 400);
  };

  const currentMemberVote = votingMemberId ? getMemberVote(votingMemberId) : null;

  // Find top-voted reward
  const topReward = rewards.reduce((best, r) => {
    const votes = getRewardVotes(r.id);
    return votes > (best?.votes || 0) ? { ...r, votes } : best;
  }, null);

  const getVoters = (rewardId) => {
    return members.filter((m) => getMemberVote(m.id) === rewardId);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* 1. Header Card */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ECE7DF] shadow-xs space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FDF1EB] text-[#E88D67] flex items-center justify-center text-xl shadow-2xs shrink-0">
              🎁
            </div>
            <div>
              <h2 className="text-sm font-black text-[#2D2825]">หน้ารางวัลประจำเดือน</h2>
              <p className="text-[11px] text-[#746C65]">{monthName} · โหวตรางวัลครอบครัว</p>
            </div>
          </div>

          {/* House Points Pill */}
          <div className="flex items-center gap-2 bg-[#FAF8F5] px-2.5 py-1.5 rounded-xl border border-[#ECE7DF] shrink-0">
            <div className="text-right">
              <span className="text-[9px] text-[#746C65] block font-semibold">แต้มสะสม</span>
              <span className="text-xs font-black text-[#5F8D75]">{totalScoreMonth}/{monthlyGoal}</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-[#EEF4F0] text-[#5F8D75] flex items-center justify-center font-black text-xs">
              {unlockedRewards.length}
            </div>
          </div>
        </div>

        {/* Top-voted Winner Banner */}
        {topReward && topReward.votes > 0 && (
          <div className="p-3 rounded-2xl bg-[#EEF4F0] border border-[#5F8D75]/25 flex items-center gap-3">
            <span className="text-2xl shrink-0">{topReward.emoji}</span>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black text-[#5F8D75] block">🏆 อันดับ 1 ที่โหวตมากที่สุด</span>
              <p className="text-xs font-black text-[#2D2825] truncate">{topReward.name}</p>
              <p className="text-[10px] text-[#746C65]">{topReward.votes} คนในบ้านโหวตเลือกแล้ว</p>
            </div>
          </div>
        )}
      </section>

      {/* 2. Rewards Single-Column Mobile Feed */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-[#2D2825]">
            รายการรางวัล ({rewards.length} รายการ)
          </h3>
          <span className="text-[11px] text-[#746C65]">
            โหวตในชื่อ: <span className="font-bold text-[#2D2825]">{myMember?.name}</span>
          </span>
        </div>

        <div className="space-y-3">
          {rewards.map((reward) => {
            const isUnlocked = totalScoreMonth >= reward.unlockAt;
            const votes = getRewardVotes(reward.id);
            const isVotedByMe = currentMemberVote === reward.id;
            const voters = getVoters(reward.id);
            const progress = Math.min(Math.round((totalScoreMonth / reward.unlockAt) * 100), 100);

            return (
              <div
                key={reward.id}
                className={`bg-white rounded-2xl p-4 border transition-all shadow-xs ${
                  isUnlocked
                    ? 'border-[#ECE7DF] hover:border-[#5F8D75]/40'
                    : 'border-[#ECE7DF] opacity-90'
                }`}
              >
                {/* Reward Top Row */}
                <div className="flex items-start gap-3 mb-2.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border shadow-2xs ${
                      isUnlocked
                        ? 'bg-[#FAF8F5] border-[#ECE7DF]'
                        : 'bg-[#F5F1EB] border-[#E8E2D9] text-[#9E958D]'
                    }`}
                  >
                    {isUnlocked ? reward.emoji : '🔒'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-[#FAF8F5] text-[#746C65] border border-[#ECE7DF]">
                        {reward.category}
                      </span>
                      {isUnlocked ? (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-[#EEF4F0] text-[#5F8D75]">
                          ปลดล็อกแล้ว
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#F5F1EB] text-[#9E958D]">
                          ต้องการ {reward.unlockAt} แต้ม
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-black text-[#2D2825] leading-tight truncate">
                      {reward.name}
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-[#746C65] leading-relaxed mb-3">
                  {reward.description}
                </p>

                {/* Status Bar */}
                {!isUnlocked ? (
                  <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#ECE7DF] mb-2.5">
                    <div className="flex justify-between items-center text-[10px] text-[#746C65] font-semibold mb-1">
                      <span className="flex items-center gap-1">
                        <LockKey size={12} weight="bold" />
                        <span>ต้องใช้ {reward.unlockAt} แต้ม</span>
                      </span>
                      <span className="font-black text-[#E88D67]">
                        ขาดอีก {reward.unlockAt - totalScoreMonth} แต้ม
                      </span>
                    </div>
                    <div className="h-1.5 bg-white rounded-full overflow-hidden border border-[#ECE7DF]">
                      <div
                        className="h-full bg-[#9E958D] rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#ECE7DF] mb-2.5">
                    <span className="text-xs font-bold text-[#5F8D75] flex items-center gap-1">
                      <LockKeyOpen size={13} weight="bold" />
                      <span>ปลดล็อกแล้ว</span>
                    </span>

                    {votes > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-[#E88D67] bg-[#FDF1EB] px-2 py-0.5 rounded-full">
                          {votes} เสียง
                        </span>
                        <div className="flex -space-x-1.5">
                          {voters.map((v) => (
                            <MemberAvatar key={v.id} member={v} size="sm" />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#9E958D]">ยังไม่มีใครโหวต</span>
                    )}
                  </div>
                )}

                {/* Vote Button */}
                {isUnlocked && (
                  <button
                    type="button"
                    onClick={() => handleVote(reward.id)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-98 border shadow-2xs ${
                      isVotedByMe
                        ? 'bg-[#E88D67] text-white border-transparent'
                        : 'bg-[#FAF8F5] hover:bg-[#FDF1EB] text-[#2D2825] border-[#ECE7DF] hover:border-[#E88D67]/40'
                    }`}
                  >
                    <Heart size={16} weight={isVotedByMe ? 'fill' : 'bold'} className={isVotedByMe ? 'text-white' : 'text-[#E88D67]'} />
                    <span>{isVotedByMe ? 'คุณโหวตแล้ว (แตะเพื่อถอน)' : 'กดโหวตเลือกรางวัลนี้'}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
