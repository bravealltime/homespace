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
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';

const TABS = [
  { id: 'weekly', label: 'รายสัปดาห์', icon: CalendarBlank },
  { id: 'monthly', label: 'รายเดือน', icon: TrendUp },
  { id: 'yearly', label: 'รายปี', icon: Trophy },
];

function MemberAvatar({ member, size = 'sm' }) {
  const sizeMap = {
    sm: 'w-9 h-9 rounded-2xl text-base',
    md: 'w-12 h-12 rounded-2xl text-xl',
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

export default function FamilySummary() {
  const {
    members,
    getWeeklyData,
    getMonthlyData,
    getYearlyData,
    memberScoresMonth,
    state,
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
    return [...state.history]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }, [state.history]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-xl shadow-md border border-[#ECE7DF] p-3 text-xs">
          <p className="font-black text-[#2D2825] mb-1.5">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-[#746C65] font-semibold">{entry.name}</span>
                </div>
                <span className="font-black text-[#2D2825]">+{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Time Filter Tabs Bar */}
      <div className="bg-white rounded-2xl p-1 border border-[#ECE7DF] shadow-xs flex gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black transition-all ${
                isActive
                  ? 'bg-[#5F8D75] text-white shadow-2xs'
                  : 'text-[#746C65] hover:bg-[#FAF8F5]'
              }`}
            >
              <Icon size={15} weight={isActive ? 'bold' : 'regular'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. MVP Ranking Card */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ECE7DF] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#ECE7DF]/70">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#FDF1EB] text-[#E88D67] flex items-center justify-center text-lg shadow-2xs shrink-0">
              👑
            </div>
            <div>
              <h3 className="text-sm font-black text-[#2D2825]">อันดับ MVP ประจำบ้าน</h3>
              <p className="text-[11px] text-[#746C65]">สะสมแต้มความขยันเดือนนี้</p>
            </div>
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FDF1EB] text-[#E88D67]">
            RANKING
          </span>
        </div>

        {/* Podium Top 3 */}
        {ranking.length >= 2 && (
          <div className="grid grid-cols-3 gap-1.5 items-end pt-2 pb-4 border-b border-[#ECE7DF]/70">
            {/* 2nd Place */}
            {ranking[1] && (
              <div className="flex flex-col items-center text-center">
                <span className="text-lg mb-0.5">🥈</span>
                <MemberAvatar member={ranking[1]} size="sm" />
                <p className="text-xs font-bold text-[#2D2825] mt-1 truncate max-w-[80px]">
                  {ranking[1].name}
                </p>
                <span className="text-[10px] font-black text-[#746C65] bg-[#FAF8F5] px-2 py-0.5 rounded-lg border border-[#ECE7DF] mt-0.5">
                  {ranking[1].score} แต้ม
                </span>
              </div>
            )}

            {/* 1st Place (Center) */}
            {ranking[0] && (
              <div className="flex flex-col items-center text-center relative -top-2">
                <span className="text-2xl animate-bounce mb-0.5">👑</span>
                <div className="ring-3 ring-[#E88D67]/40 rounded-2xl">
                  <MemberAvatar member={ranking[0]} size="md" />
                </div>
                <p className="text-xs font-black text-[#2D2825] mt-1 truncate max-w-[90px]">
                  {ranking[0].name}
                </p>
                <span className="text-[11px] font-black text-[#E88D67] bg-[#FDF1EB] px-2.5 py-0.5 rounded-lg border border-[#E88D67]/30 mt-0.5 shadow-2xs">
                  {ranking[0].score} แต้ม
                </span>
              </div>
            )}

            {/* 3rd Place */}
            {ranking[2] && (
              <div className="flex flex-col items-center text-center">
                <span className="text-lg mb-0.5">🥉</span>
                <MemberAvatar member={ranking[2]} size="sm" />
                <p className="text-xs font-bold text-[#2D2825] mt-1 truncate max-w-[80px]">
                  {ranking[2].name}
                </p>
                <span className="text-[10px] font-black text-[#746C65] bg-[#FAF8F5] px-2 py-0.5 rounded-lg border border-[#ECE7DF] mt-0.5">
                  {ranking[2].score} แต้ม
                </span>
              </div>
            )}
          </div>
        )}

        {/* Member Ranking List */}
        <div className="space-y-2">
          {ranking.map((member, index) => (
            <div
              key={member.id}
              className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                index === 0
                  ? 'bg-[#FDF1EB] border-[#E88D67]/30'
                  : 'bg-[#FAF8F5] border-[#ECE7DF]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                  index === 0 ? 'bg-[#E88D67] text-white shadow-2xs' : index === 1 ? 'bg-[#7BA7C2] text-white' : 'bg-[#ECE7DF] text-[#746C65]'
                }`}>
                  {index + 1}
                </span>
                <MemberAvatar member={member} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-black text-[#2D2825] truncate">{member.name}</p>
                  <p className="text-[10px] text-[#746C65]">{member.role}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-black" style={{ color: member.color || '#5F8D75' }}>
                  {member.score}
                </span>
                <span className="text-[10px] text-[#746C65] ml-1">แต้ม</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Comparison Bar Chart Card */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ECE7DF] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#ECE7DF]/70">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#EEF4F0] text-[#5F8D75] flex items-center justify-center text-lg shadow-2xs shrink-0">
              📈
            </div>
            <div>
              <h3 className="text-sm font-black text-[#2D2825]">กราฟเปรียบเทียบคะแนน</h3>
              <p className="text-[11px] text-[#746C65]">
                {activeTab === 'weekly' ? '7 วันย้อนหลัง' : activeTab === 'monthly' ? 'ตามสัปดาห์ในเดือนนี้' : 'ตลอดทั้งปี'}
              </p>
            </div>
          </div>
        </div>

        <div className="h-60 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" stroke="#ECE7DF" vertical={false} />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11, fill: '#746C65' }}
                tickLine={false}
                axisLine={{ stroke: '#ECE7DF' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#746C65' }}
                tickLine={false}
                axisLine={{ stroke: '#ECE7DF' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-[11px] text-[#2D2825] font-bold">{value}</span>}
              />
              {members.map((m) => (
                <Bar
                  key={m.id}
                  dataKey={m.id}
                  name={m.name}
                  fill={m.color || '#5F8D75'}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 3. Completed Chores Gallery */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ECE7DF] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#ECE7DF]/70">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#EEF4F0] text-[#5F8D75] flex items-center justify-center text-lg shadow-2xs shrink-0">
              🖼️
            </div>
            <div>
              <h3 className="text-sm font-black text-[#2D2825]">ผลงานที่ทำสำเร็จ</h3>
              <p className="text-[11px] text-[#746C65]">บันทึกงานบ้านและเรื่องราวความสุขของสมาชิก</p>
            </div>
          </div>
          <span className="text-[10px] font-black text-[#5F8D75] bg-[#EEF4F0] px-2 py-0.5 rounded-full">
            {recentEntries.length} รายการ
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {recentEntries.map((entry) => {
            const member = members.find((m) => m.id === entry.memberId);
            return (
              <div
                key={entry.id}
                className="bg-[#FAF8F5] rounded-xl p-2.5 border border-[#ECE7DF] hover:border-[#5F8D75]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xl">{entry.choreEmoji}</span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white text-[#5F8D75] border border-[#ECE7DF]">
                      +{entry.points}
                    </span>
                  </div>

                  <p className="text-xs font-black text-[#2D2825] truncate">{entry.choreName}</p>
                  <p className="text-[10px] text-[#E88D67] font-bold truncate mt-0.5">
                    {entry.praise}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-[#ECE7DF]/70 text-[9px] text-[#746C65]">
                  <span className="font-bold truncate max-w-[65px]">{member?.name || 'สมาชิก'}</span>
                  <span>{entry.date ? new Date(entry.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : 'วันนี้'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
