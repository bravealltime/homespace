import React from 'react';
import {
  Heart,
  Sparkle,
  Camera,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';

function MemberAvatar({ member, size = 'sm' }) {
  const sizeMap = {
    sm: 'w-9 h-9 rounded-2xl text-lg',
    md: 'w-11 h-11 rounded-2xl text-xl',
  };

  if (member?.avatarType === 'image' && member?.avatarImage) {
    return (
      <img
        src={member.avatarImage}
        alt={member.name}
        className={`${sizeMap[size]} object-cover border-2 border-white shadow-2xs shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeMap[size]} flex items-center justify-center border-2 border-white shadow-2xs font-bold shrink-0`}
      style={{ backgroundColor: `${member?.color || '#5F8D75'}20` }}
    >
      {member?.avatar || '😊'}
    </div>
  );
}

export default function RoutineFeed({ onOpenNewRoutine }) {
  const { routines, members, likeRoutine } = useApp();

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ECE7DF] shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#ECE7DF]/70">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#FDF1EB] text-[#E88D67] flex items-center justify-center text-xl shadow-2xs shrink-0">
            📖
          </div>
          <div>
            <h3 className="text-sm font-black text-[#2D2825]">ไดอารี่กิจวัตรของบ้าน</h3>
            <p className="text-[11px] text-[#746C65]">บันทึกรูปและเรื่องราวดี ๆ ร่วมกัน</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenNewRoutine}
          className="px-3 py-1.5 bg-[#5F8D75] hover:bg-[#476E5B] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Camera size={15} weight="bold" />
          <span>+ โพสต์</span>
        </button>
      </div>

      {/* Routine Feed Cards */}
      <div className="space-y-4">
        {routines.map((item) => {
          const author = members.find((m) => m.id === item.memberId);
          return (
            <article
              key={item.id}
              className="bg-[#FAF8F5] rounded-2xl p-3.5 sm:p-4 border border-[#ECE7DF] space-y-3 shadow-2xs hover:border-[#5F8D75]/40 transition-colors"
            >
              {/* Author Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <MemberAvatar member={author} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold text-[#2D2825] truncate">
                        {author?.name || 'สมาชิกในบ้าน'}
                      </p>
                      <span className="text-[10px] text-[#746C65]">({author?.role})</span>
                    </div>
                    <p className="text-[10px] text-[#9E958D]">
                      {new Date(item.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น. · {item.category}
                    </p>
                  </div>
                </div>

                {/* Score & EXP Badges */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-[#EEF4F0] text-[#5F8D75] border border-[#5F8D75]/20">
                    +{item.points} แต้ม
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-[#FDF1EB] text-[#E88D67] border border-[#E88D67]/20">
                    +{item.exp} EXP
                  </span>
                </div>
              </div>

              {/* Caption */}
              <p className="text-xs sm:text-sm text-[#2D2825] font-semibold leading-relaxed px-0.5">
                "{item.caption}"
              </p>

              {/* Full-width Photo (Mobile-First) */}
              {item.photo && (
                <div className="w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-[#ECE7DF] bg-black/5 shadow-inner">
                  <img
                    src={item.photo}
                    alt="รูปกิจวัตรประจำวัน"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* AI Analysis Reflection Box */}
              {item.aiAnalysis && (
                <div className="p-3 bg-white rounded-xl border border-[#ECE7DF] space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[#5F8D75] flex items-center gap-1 truncate">
                      <Sparkle size={13} weight="fill" className="text-[#E88D67] shrink-0" />
                      <span className="truncate">AI วิเคราะห์: {item.aiAnalysis.activityTitle}</span>
                    </span>
                    <span className="text-[10px] font-black text-[#5F8D75] bg-[#EEF4F0] px-2 py-0.5 rounded-md shrink-0">
                      พลังบวก {item.aiAnalysis.positivityScore}%
                    </span>
                  </div>

                  <p className="text-xs text-[#746C65] leading-relaxed">
                    {item.aiAnalysis.aiReflection}
                  </p>

                  {/* 3 Metric Pills if available */}
                  {(item.aiAnalysis.positivityScore || item.aiAnalysis.healthScore || item.aiAnalysis.familyScore) && (
                    <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                      <div className="bg-[#FAF8F5] p-1 rounded-lg">
                        <span className="text-[9px] text-[#746C65] block">พลังบวก</span>
                        <span className="text-[11px] font-black text-[#5F8D75]">{item.aiAnalysis.positivityScore || 95}%</span>
                      </div>
                      <div className="bg-[#FAF8F5] p-1 rounded-lg">
                        <span className="text-[9px] text-[#746C65] block">สุขภาพ</span>
                        <span className="text-[11px] font-black text-[#7BA7C2]">{item.aiAnalysis.healthScore || 90}%</span>
                      </div>
                      <div className="bg-[#FAF8F5] p-1 rounded-lg">
                        <span className="text-[9px] text-[#746C65] block">ต่อครอบครัว</span>
                        <span className="text-[11px] font-black text-[#E88D67]">{item.aiAnalysis.familyScore || 92}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions & Heart Cheer */}
              <div className="flex items-center justify-between pt-1 px-0.5">
                <button
                  type="button"
                  onClick={() => likeRoutine(item.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-500 border border-[#ECE7DF] hover:border-red-200 text-xs font-bold transition-all active:scale-95 shadow-2xs"
                >
                  <Heart size={16} weight="fill" className="text-red-500" />
                  <span>{item.likes || 1} ให้กำลังใจ</span>
                </button>
                <span className="text-[11px] text-[#9E958D] font-medium">บันทึกความสุขแล้ว ✨</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
