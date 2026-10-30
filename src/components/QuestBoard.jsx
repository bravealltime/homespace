import React from 'react';
import {
  Sparkle,
  Flame,
  CheckCircle,
  PlayCircle,
  Star,
  Trophy,
} from '@phosphor-icons/react';

export const DAILY_QUESTS = [
  {
    id: 1,
    choreId: 1,
    title: 'ภารกิจ: จานชามใสวิ้ง',
    category: 'ครัว',
    description: 'ถ่ายภาพซิงค์ก่อนและหลังล้างจานให้สะอาด',
    emoji: '🍽️',
    points: 25,
    exp: 150,
  },
  {
    id: 2,
    choreId: 2,
    title: 'ภารกิจ: พื้นบ้านไร้ฝุ่น',
    category: 'ห้องนั่งเล่น',
    description: 'กวาดและดูดฝุ่นตามมุมห้องให้เรียบร้อย',
    emoji: '🧹',
    points: 20,
    exp: 120,
  },
  {
    id: 3,
    choreId: 7,
    title: 'ภารกิจ: ปูเตียงจัดห้องนอน',
    category: 'ห้องนอน',
    description: 'จัดที่นอนให้ตึงและพับผ้าห่มให้สวยงาม',
    emoji: '🛏️',
    points: 20,
    exp: 130,
  },
  {
    id: 4,
    choreId: 8,
    title: 'ภารกิจ: รดน้ำต้นไม้หน้าบ้าน',
    category: 'สวน',
    description: 'รดน้ำให้ชุ่มฉ่ำและเก็บใบไม้แห้ง',
    emoji: '🌱',
    points: 15,
    exp: 90,
  },
];

export default function QuestBoard({ onSelectQuest }) {
  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ECE7DF] shadow-xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#ECE7DF]/70">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#EEF4F0] text-[#5F8D75] flex items-center justify-center text-xl shadow-2xs shrink-0">
            🎯
          </div>
          <div>
            <h3 className="text-sm font-black text-[#2D2825]">กระดานเควสต์ประจำวัน</h3>
            <p className="text-[11px] text-[#746C65]">ถ่ายรูปก่อน-หลังเพื่อรับ EXP & แต้ม</p>
          </div>
        </div>

        {/* Daily Streak Badge */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FDF1EB] border border-[#E88D67]/30 text-[#E88D67] shrink-0">
          <Flame size={15} weight="fill" />
          <span className="text-xs font-black">5 วันติด</span>
        </div>
      </div>

      {/* Quest Cards (Single Column for Mobile Perfection) */}
      <div className="space-y-2.5">
        {DAILY_QUESTS.map((quest) => (
          <div
            key={quest.id}
            onClick={() => onSelectQuest(quest.choreId)}
            className="p-3 rounded-2xl bg-[#FAF8F5] hover:bg-[#EEF4F0] border border-[#ECE7DF] hover:border-[#5F8D75]/40 transition-all cursor-pointer group flex items-center justify-between gap-3 active:scale-98"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl shrink-0 p-1.5 bg-white rounded-xl border border-[#ECE7DF] shadow-2xs group-hover:scale-105 transition-transform">
                {quest.emoji}
              </span>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-[#2D2825] truncate group-hover:text-[#5F8D75]">
                  {quest.title}
                </h4>
                <p className="text-[11px] text-[#746C65] truncate mt-0.5">
                  {quest.description}
                </p>

                {/* Rewards tag */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white text-[#5F8D75] border border-[#ECE7DF]">
                    +{quest.points} แต้ม
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white text-[#E88D67] border border-[#ECE7DF]">
                    +{quest.exp} EXP
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <span className="w-8 h-8 rounded-xl bg-white group-hover:bg-[#5F8D75] text-[#5F8D75] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs border border-[#ECE7DF] group-hover:border-[#5F8D75]">
                <PlayCircle size={18} weight="fill" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
