import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  CalendarBlank,
  TrendUp,
  Trophy,
  Crown,
  Medal,
  Images,
  Sparkle,
  Broom,
  Drop,
  Heart,
  CheckCircle,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';

const TABS = [
  { id: 'weekly', label: '7 วันย้อนหลัง', icon: CalendarBlank },
  { id: 'monthly', label: 'ประจำเดือนนี้', icon: TrendUp },
  { id: 'yearly', label: 'ตลอดทั้งปี', icon: Trophy },
];

function MemberAvatar({ member, size = 'sm' }) {
  const sizeMap = {
    sm: 'w-8 h-8 rounded-xl text-sm',
    md: 'w-11 h-11 rounded-2xl text-lg',
    lg: 'w-14 h-14 rounded-2xl text-2xl',
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
      style={{ backgroundColor: `${member?.color || '#5F8D75'}25` }}
    >
      {member?.avatar || '😊'}
    </div>
  );
}

export default function FamilySummary() {
  const {
    members,
    getWeeklyData,
    getMonthlyData,
    getYearlyData,
    memberScoresMonth,
    state,
    totalScoreMonth,
    feedPosts,
    treeState,
  } = useApp();

  const [activeTab, setActiveTab] = useState('weekly');

  const chartData = useMemo(() => {
    switch (activeTab) {
      case 'weekly':
        return getWeeklyData();
      case 'monthly':
        return getMonthlyData();
      case 'yearly':
        return getYearlyData();
      default:
        return [];
    }
  }, [activeTab, getWeeklyData, getMonthlyData, getYearlyData]);

  const xKey = activeTab === 'weekly' ? 'label' : activeTab === 'monthly' ? 'week' : 'month';

  const ranking = useMemo(() => {
    return [...members]
      .map((m) => ({ ...m, score: memberScoresMonth[m.id] || 0 }))
      .sort((a, b) => b.score - a.score);
  }, [members, memberScoresMonth]);

  const recentEntries = useMemo(() => {
    return [...(state?.history || [])]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8);
  }, [state?.history]);

  const choreCount = (state?.history || []).length;
  const postCount = (feedPosts || []).length;
  const waterCount = treeState?.totalWatered || 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-2xl shadow-lg border border-[#ECE7DF] p-3 text-xs space-y-1.5 min-w-[130px]">
          <p className="font-black text-[#2D2825] border-b border-[#ECE7DF] pb-1">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-[#746C65] font-semibold truncate">{entry.name}</span>
                </div>
                <span className="font-black text-[#2D2825] shrink-0">+{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 pb-28">
      {/* 1. Time Range Selector Bar */}
      <div className="bg-white rounded-2xl p-1.5 border border-[#ECE7DF] shadow-xs flex gap-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#5F8D75] text-white shadow-2xs'
                  : 'text-[#746C65] hover:bg-[#FAF8F5] hover:text-[#2D2825]'
              }`}
            >
              <Icon size={16} weight={isActive ? 'bold' : 'regular'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Key Family Metrics (4 Cards Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Card 1: แต้มรวมของบ้าน */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#ECE7DF] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xl">🏺</span>
            <span className="text-[10px] font-black text-[#5F8D75] bg-[#EEF4F0] px-2 py-0.5 rounded-full">
              เดือนนี้
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#2D2825]">{totalScoreMonth}</p>
          <p className="text-xs text-[#746C65] font-semibold">แต้มรวมของบ้าน</p>
        </div>

        {/* Card 2: งานบ้านที่สำเร็จ */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#ECE7DF] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xl">🧹</span>
            <span className="text-[10px] font-black text-[#3B82F6] bg-[#EEF2F6] px-2 py-0.5 rounded-full">
              สำเร็จ
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#2D2825]">{choreCount}</p>
          <p className="text-xs text-[#746C65] font-semibold">งานบ้านที่ช่วยกันทำ</p>
        </div>

        {/* Card 3: รูปภาพ & บันทึกความสุข */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#ECE7DF] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xl">📸</span>
            <span className="text-[10px] font-black text-[#E88D67] bg-[#FFF5EB] px-2 py-0.5 rounded-full">
              ความทรงจำ
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#2D2825]">{postCount}</p>
          <p className="text-xs text-[#746C65] font-semibold">เรื่องราวความสุข</p>
        </div>

        {/* Card 4: รดน้ำต้นไม้ */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#ECE7DF] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xl">💧</span>
            <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
              Lv.{treeState?.level || 1}
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#2D2825]">{waterCount}</p>
          <p className="text-xs text-[#746C65] font-semibold">ครั้งที่รดน้ำต้นไม้</p>
        </div>
      </div>

      {/* 3. Hero MVP Podium Card (แท่นรับรางวัลสุดอลังการ) */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ECE7DF] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#ECE7DF]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF5EB] border border-[#E88D67]/30 text-[#E88D67] flex items-center justify-center text-xl shadow-2xs shrink-0">
              👑
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#2D2825]">อันดับ MVP ประจำบ้าน</h3>
              <p className="text-xs text-[#746C65]">คนขยันที่สะสมแต้มช่วยครอบครัวมากที่สุด</p>
            </div>
          </div>
          <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-[#FFF5EB] text-[#E88D67] border border-[#E88D67]/30">
            LEADERBOARD
          </span>
        </div>

        {/* 3D-Feel Stepped Podium */}
        {ranking.length >= 1 && (
          <div className="pt-2 pb-2">
            <div className="grid grid-cols-3 gap-2 items-end max-w-sm mx-auto">
              {/* 2nd Place (Silver) */}
              {ranking[1] ? (
                <div className="flex flex-col items-center text-center">
                  <span className="text-xl mb-1">🥈</span>
                  <div className="ring-3 ring-slate-300 rounded-2xl shadow-2xs">
                    <MemberAvatar member={ranking[1]} size="md" />
                  </div>
                  <p className="text-xs font-black text-[#2D2825] mt-1.5 truncate max-w-full">
                    {ranking[1].name}
                  </p>
                  <span className="text-xs font-black text-[#5F8D75] bg-[#EEF4F0] px-2 py-0.5 rounded-lg mt-0.5">
                    {ranking[1].score} แต้ม
                  </span>

                  {/* Silver Pillar */}
                  <div className="w-full h-16 sm:h-20 bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-2xl border-t-2 border-slate-300 flex items-center justify-center font-black text-slate-500 text-lg shadow-inner mt-2">
                    2
                  </div>
                </div>
              ) : (
                <div />
              )}

              {/* 1st Place (Gold, Tallest Center) */}
              {ranking[0] ? (
                <div className="flex flex-col items-center text-center -mt-4">
                  <span className="text-3xl animate-bounce mb-0.5">👑</span>
                  <div className="ring-4 ring-amber-400 shadow-md rounded-2xl">
                    <MemberAvatar member={ranking[0]} size="lg" />
                  </div>
                  <p className="text-sm font-black text-[#2D2825] mt-1.5 truncate max-w-full">
                    {ranking[0].name}
                  </p>
                  <span className="text-xs font-black text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-lg mt-0.5 shadow-2xs">
                    {ranking[0].score} แต้ม
                  </span>

                  {/* Gold Pillar */}
                  <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-amber-300 via-amber-200 to-amber-100 rounded-t-2xl border-t-2 border-amber-400 flex items-center justify-center font-black text-amber-800 text-2xl shadow-inner mt-2">
                    1
                  </div>
                </div>
              ) : (
                <div />
              )}

              {/* 3rd Place (Bronze) */}
              {ranking[2] ? (
                <div className="flex flex-col items-center text-center">
                  <span className="text-xl mb-1">🥉</span>
                  <div className="ring-3 ring-amber-700/30 rounded-2xl shadow-2xs">
                    <MemberAvatar member={ranking[2]} size="md" />
                  </div>
                  <p className="text-xs font-black text-[#2D2825] mt-1.5 truncate max-w-full">
                    {ranking[2].name}
                  </p>
                  <span className="text-xs font-black text-[#5F8D75] bg-[#EEF4F0] px-2 py-0.5 rounded-lg mt-0.5">
                    {ranking[2].score} แต้ม
                  </span>

                  {/* Bronze Pillar */}
                  <div className="w-full h-12 sm:h-14 bg-gradient-to-t from-amber-200/80 to-amber-100/60 rounded-t-2xl border-t-2 border-amber-700/30 flex items-center justify-center font-black text-amber-900/60 text-base shadow-inner mt-2">
                    3
                  </div>
                </div>
              ) : (
                <div />
              )}
            </div>
          </div>
        )}

        {/* Member Ranking List for 4th and beyond (or full list) */}
        {ranking.length > 3 && (
          <div className="space-y-2 pt-2 border-t border-[#ECE7DF]">
            <span className="text-xs font-bold text-[#746C65] block mb-1">
              อันดับอื่น ๆ ในบ้าน:
            </span>
            {ranking.slice(3).map((member, idx) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DF]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-[#ECE7DF] text-[#746C65] flex items-center justify-center text-xs font-black shrink-0">
                    {idx + 4}
                  </span>
                  <MemberAvatar member={member} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-black text-[#2D2825] truncate">{member.name}</p>
                    <p className="text-xs text-[#746C65] truncate">{member.role}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-[#5F8D75]">
                    {member.score}
                  </span>
                  <span className="text-xs text-[#746C65] ml-1">แต้ม</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Comparison Bar Chart Card */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ECE7DF] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#ECE7DF]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF4F0] text-[#5F8D75] flex items-center justify-center text-xl shadow-2xs shrink-0">
              📈
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#2D2825]">กราฟเปรียบเทียบคะแนน</h3>
              <p className="text-xs text-[#746C65]">
                {activeTab === 'weekly'
                  ? 'คะแนนสะสม 7 วันย้อนหลัง'
                  : activeTab === 'monthly'
                  ? 'คะแนนแบ่งตามสัปดาห์ในเดือนนี้'
                  : 'คะแนนสรุปตลอดทั้งปี'}
              </p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#ECE7DF" vertical={false} />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 12, fill: '#746C65', fontFamily: 'Prompt' }}
                tickLine={false}
                axisLine={{ stroke: '#ECE7DF' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#746C65', fontFamily: 'Prompt' }}
                tickLine={false}
                axisLine={{ stroke: '#ECE7DF' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-xs text-[#2D2825] font-bold">{value}</span>}
              />
              {members.map((m) => (
                <Bar
                  key={m.id}
                  dataKey={m.id}
                  name={m.name}
                  fill={m.color || '#5F8D75'}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={30}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 5. Completed Chores Activity Feed */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ECE7DF] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#ECE7DF]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF4F0] text-[#5F8D75] flex items-center justify-center text-xl shadow-2xs shrink-0">
              🖼️
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#2D2825]">ผลงานที่ทำสำเร็จล่าสุด</h3>
              <p className="text-xs text-[#746C65]">บันทึกงานบ้านและเรื่องราวความสุขของสมาชิก</p>
            </div>
          </div>
          <span className="text-xs font-black text-[#5F8D75] bg-[#EEF4F0] px-2.5 py-0.5 rounded-full">
            {recentEntries.length} รายการ
          </span>
        </div>

        {recentEntries.length === 0 ? (
          <div className="p-8 text-center bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] space-y-1">
            <p className="text-sm font-bold text-[#2D2825]">ยังไม่มีประวัติงานบ้าน</p>
            <p className="text-xs text-[#746C65]">เริ่มทำงานบ้านแล้วแตะ "ส่งงานบ้าน" เพื่อรับแต้มได้เลย</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recentEntries.map((entry) => {
              const member = members.find((m) => m.id === entry.memberId);
              return (
                <div
                  key={entry.id}
                  className="bg-[#FAF8F5] rounded-2xl p-3 border border-[#ECE7DF] hover:border-[#5F8D75]/40 transition-all flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl p-1.5 bg-white rounded-xl shadow-2xs border border-[#ECE7DF] shrink-0">
                        {entry.choreEmoji || '🧹'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-black text-[#2D2825] truncate">
                          {entry.choreName || 'งานบ้าน'}
                        </p>
                        <p className="text-xs text-[#E88D67] font-bold truncate">
                          {entry.praise || 'เรียบร้อยดีมาก ✨'}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-white text-[#5F8D75] border border-[#5F8D75]/30 shadow-2xs shrink-0">
                      +{entry.points || 25}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#ECE7DF]/70 text-xs text-[#746C65]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MemberAvatar member={member} size="sm" />
                      <span className="font-bold truncate">{member?.name || 'สมาชิก'}</span>
                    </div>
                    <span className="shrink-0">
                      {entry.date
                        ? new Date(entry.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
                        : 'วันนี้'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
