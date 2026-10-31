import { useState } from 'react';
import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
  Plus,
  Trash,
  PushPin,
  Users,
  Check,
  X,
  Sparkle,
  Clock,
  Heart,
  CalendarCheck,
  Globe,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getCountdownInfo } from './FamilyMilestonesModal';
import { translateText, hasThaiCharacters } from '../utils/translator';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const EMOJI_OPTIONS = [
  '🎂', '🏥', '🍲', '🏖️', '🚗', '✈️',
  '🎉', '💊', '🛒', '🐾', '💍', '🎓', '🏡', '💖',
];

const CATEGORIES = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'birthday', label: 'วันเกิด', emoji: '🎂' },
  { id: 'health', label: 'หาหมอ/ยา', emoji: '🏥' },
  { id: 'trip', label: 'ทริปเที่ยว', emoji: '🏖️' },
  { id: 'food', label: 'นัดกินข้าว', emoji: '🍲' },
  { id: 'event', label: 'ทั่วไป', emoji: '📅' },
];

export default function FamilyCalendarView({ onNavigateTab }) {
  const { milestones, addMilestone, deleteMilestone, members, t } = useApp();
  const { currentUser, isAdmin } = useAuth();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState(today.toISOString().split('T')[0]);

  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(today.toISOString().split('T')[0]);
  const [formEmoji, setFormEmoji] = useState('🎂');
  const [formCategory, setFormCategory] = useState('birthday');
  const [formTaggedIds, setFormTaggedIds] = useState([]);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDateStr(now.toISOString().split('T')[0]);
  };

  // Calendar Math
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Map milestones by date string "YYYY-MM-DD"
  const milestonesByDate = {};
  (milestones || []).forEach((m) => {
    if (!m.date) return;
    const dateKey = m.date.slice(0, 10);
    if (!milestonesByDate[dateKey]) {
      milestonesByDate[dateKey] = [];
    }
    milestonesByDate[dateKey].push(m);
  });

  // Calendar grid cells
  const calendarCells = [];
  // 1. Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonthDate = new Date(currentYear, currentMonth - 1, dayNum);
    const dateStr = prevMonthDate.toISOString().split('T')[0];
    calendarCells.push({
      dayNum,
      dateStr,
      isCurrentMonth: false,
      milestones: milestonesByDate[dateStr] || [],
    });
  }

  // 2. Current month days
  for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const dStr = String(dayNum).padStart(2, '0');
    const dateStr = `${currentYear}-${mStr}-${dStr}`;
    calendarCells.push({
      dayNum,
      dateStr,
      isCurrentMonth: true,
      milestones: milestonesByDate[dateStr] || [],
    });
  }

  // 3. Next month leading days (fill to multiple of 7)
  const remainingCells = 42 - calendarCells.length;
  for (let dayNum = 1; dayNum <= (remainingCells >= 7 ? remainingCells % 7 : remainingCells); dayNum++) {
    const nextMonthDate = new Date(currentYear, currentMonth + 1, dayNum);
    const dateStr = nextMonthDate.toISOString().split('T')[0];
    calendarCells.push({
      dayNum,
      dateStr,
      isCurrentMonth: false,
      milestones: milestonesByDate[dateStr] || [],
    });
  }

  const todayStr = today.toISOString().split('T')[0];
  const selectedDayMilestones = milestonesByDate[selectedDateStr] || [];

  // Filtered upcoming milestones
  const allSortedMilestones = [...(milestones || [])].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const upcomingMilestones = allSortedMilestones
    .map((m) => ({ ...m, info: getCountdownInfo(m.date) }))
    .filter((m) => {
      if (activeCategoryFilter === 'all') return true;
      return m.category === activeCategoryFilter;
    });

  // Open add modal pre-filling selected date
  const openAddWithDate = (dateStr) => {
    setFormDate(dateStr || selectedDateStr || todayStr);
    setFormTitle('');
    setFormEmoji('🎂');
    setFormCategory('birthday');
    setFormTaggedIds([]);
    setIsAddModalOpen(true);
  };

  // Toggle member tag in form
  const toggleTagMember = (memberId) => {
    setFormTaggedIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleTagAllMembers = () => {
    const allIds = (members || []).map((m) => m.id);
    if (formTaggedIds.length === allIds.length) {
      setFormTaggedIds([]);
    } else {
      setFormTaggedIds(allIds);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) return;

    await addMilestone({
      title: formTitle.trim(),
      date: formDate,
      emoji: formEmoji,
      category: formCategory,
      memberId: currentUser?.id || 'member-fluke',
      taggedMemberIds: formTaggedIds,
    });

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* 1. Header with Title & Quick Switch to Fridge Board */}
      <section className="bg-white rounded-3xl p-4 border border-[#ECE7DF] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF5EB] text-[#E88D67] border border-[#E88D67]/30 flex items-center justify-center text-xl shadow-2xs">
              📅
            </div>
            <div>
              <h1 className="text-base font-black text-[#2D2825]">{t ? t('calendarTitle', 'ปฏิทินวันสำคัญของบ้าน') : 'ปฏิทินวันสำคัญของบ้าน'}</h1>
              <p className="text-[11px] text-[#746C65]">{t ? t('calendarSubtitle', 'วันเกิด นัดหมอ กิจกรรม และแท็กคนที่ไปด้วยกัน 👥') : 'วันเกิด นัดหมอ กิจกรรม และแท็กคนที่ไปด้วยกัน 👥'}</p>
            </div>
          </div>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('fridge')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#FFFBEB] text-[#CA8A04] border border-[#FDE047] text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <PushPin size={14} weight="fill" />
              <span>{t ? t('tabFridge', 'ตู้เย็น') : 'ตู้เย็นโน้ต'}</span>
            </button>
          )}
        </div>

        {/* 2. Month Navigator Bar */}
        <div className="bg-[#FAF8F5] rounded-2xl p-2 px-3 border border-[#ECE7DF] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-xl bg-white hover:bg-[#ECE7DF] text-[#2D2825] flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
              title="เดือนก่อนหน้า"
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <h2 className="text-sm font-black text-[#2D2825] px-2 min-w-[130px] text-center">
              {THAI_MONTHS[currentMonth]} {currentYear + 543}
            </h2>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-xl bg-white hover:bg-[#ECE7DF] text-[#2D2825] flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
              title="เดือนถัดไป"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleJumpToToday}
              className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#EEF4F0] text-[#5F8D75] border border-[#5F8D75]/30 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              วันนี้
            </button>
            <button
              type="button"
              onClick={() => openAddWithDate(selectedDateStr)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#5F8D75] hover:bg-[#476E5B] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus size={13} weight="bold" />
              <span>เพิ่มวัน</span>
            </button>
          </div>
        </div>

        {/* 3. Interactive Monthly Calendar Grid */}
        <div className="space-y-1 select-none">
          {/* Weekday Labels (อา - ส) */}
          <div className="grid grid-cols-7 text-center">
            {WEEKDAYS.map((w, idx) => (
              <span
                key={w}
                className={`text-[11px] font-black py-1 ${
                  idx === 0 ? 'text-[#C84B31]' : idx === 6 ? 'text-[#3B82F6]' : 'text-[#746C65]'
                }`}
              >
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              const isToday = cell.dateStr === todayStr;
              const isSelected = cell.dateStr === selectedDateStr;
              const hasEvents = cell.milestones.length > 0;

              return (
                <div
                  key={`${cell.dateStr}-${idx}`}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[52px] sm:min-h-[58px] p-1 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#EEF4F0] border-[#5F8D75] ring-2 ring-[#5F8D75]/40 shadow-xs'
                      : isToday
                      ? 'bg-[#FFF9F5] border-[#E88D67] shadow-2xs'
                      : cell.isCurrentMonth
                      ? 'bg-white border-[#ECE7DF] hover:bg-[#FAF8F5]'
                      : 'bg-[#FAF8F5]/60 border-[#ECE7DF]/50 text-[#B0A79E] opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                        isToday
                          ? 'bg-[#E88D67] text-white font-black'
                          : isSelected
                          ? 'text-[#5F8D75] font-black'
                          : cell.isCurrentMonth
                          ? 'text-[#2D2825]'
                          : 'text-[#B0A79E]'
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    {hasEvents && (
                      <span className="text-[10px] leading-none shrink-0">
                        {cell.milestones[0]?.emoji || '•'}
                      </span>
                    )}
                  </div>

                  {/* Event indicators dots/emojis */}
                  <div className="flex items-center gap-0.5 justify-center flex-wrap min-h-[14px]">
                    {hasEvents ? (
                      cell.milestones.slice(0, 3).map((ev, eIdx) => (
                        <span
                          key={ev.id || eIdx}
                          className="w-1.5 h-1.5 rounded-full bg-[#E88D67]"
                          title={ev.title}
                        />
                      ))
                    ) : (
                      <span className="opacity-0">•</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Selected Date Inspector Card */}
        {selectedDateStr && (
          <div className="bg-[#FAF8F5] rounded-2xl p-3 border border-[#ECE7DF] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck size={18} className="text-[#5F8D75]" weight="bold" />
                <span className="text-xs font-black text-[#2D2825]">
                  วันที่ {new Date(selectedDateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {selectedDateStr === todayStr && (
                  <span className="text-[10px] bg-[#E88D67] text-white font-black px-2 py-0.5 rounded-full">
                    วันนี้
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => openAddWithDate(selectedDateStr)}
                className="text-xs font-bold text-[#5F8D75] hover:underline cursor-pointer"
              >
                + เพิ่มนัดวันนี้
              </button>
            </div>

            {selectedDayMilestones.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {selectedDayMilestones.map((m) => {
                  const creator = members.find((mem) => mem.id === m.memberId);
                  const taggedList = (m.taggedMemberIds || [])
                    .map((id) => members.find((mem) => mem.id === id))
                    .filter(Boolean);

                  return (
                    <div
                      key={m.id}
                      className="bg-white rounded-xl p-2.5 px-3 border border-[#ECE7DF] shadow-2xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl shrink-0">{m.emoji || '🎂'}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-[#2D2825] truncate">{m.title}</p>
                          {taggedList.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-[#746C65] font-bold">ไปด้วยกัน:</span>
                              <div className="flex items-center -space-x-1">
                                {taggedList.map((tagMem) => (
                                  <div
                                    key={tagMem.id}
                                    title={tagMem.name}
                                    className="w-4 h-4 rounded-full bg-[#FAF8F5] border border-white overflow-hidden text-[9px] flex items-center justify-center font-bold"
                                  >
                                    {tagMem.avatarType === 'image' && tagMem.avatarImage ? (
                                      <img src={tagMem.avatarImage} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      tagMem.avatar || '😊'
                                    )}
                                  </div>
                                ))}
                              </div>
                              <span className="text-[10px] text-[#5F8D75] font-semibold truncate">
                                {taggedList.map((t) => t.name).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {(isAdmin || currentUser?.id === m.memberId) && (
                        <button
                          type="button"
                          onClick={() => deleteMilestone(m.id)}
                          className="w-7 h-7 rounded-lg text-[#9E958D] hover:text-[#C84B31] hover:bg-[#FAF8F5] flex items-center justify-center transition-colors cursor-pointer"
                          title="ลบนัดหมาย"
                        >
                          <Trash size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#9E958D] text-center py-2">
                ยังไม่มีนัดหมายในวันนี้ แตะ "+ เพิ่มนัดวันนี้" เพื่อเพิ่มได้เลย
              </p>
            )}
          </div>
        )}
      </section>

      {/* 5. All Upcoming Milestones & Countdowns List */}
      <section className="bg-white rounded-3xl p-4 border border-[#ECE7DF] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎂</span>
            <h2 className="text-sm font-black text-[#2D2825]">รายการวันสำคัญ & นับถอยหลัง</h2>
          </div>
          <span className="text-xs font-bold text-[#746C65]">
            {upcomingMilestones.length} รายการ
          </span>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#5F8D75] text-white shadow-xs'
                    : 'bg-[#FAF8F5] text-[#746C65] hover:bg-[#ECE7DF]'
                }`}
              >
                {cat.emoji && <span className="mr-1">{cat.emoji}</span>}
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Milestones Cards */}
        <div className="space-y-2">
          {upcomingMilestones.length > 0 ? (
            upcomingMilestones.map((m) => {
              const creator = members.find((mem) => mem.id === m.memberId);
              const taggedList = (m.taggedMemberIds || [])
                .map((id) => members.find((mem) => mem.id === id))
                .filter(Boolean);
              const isToday = m.info?.isToday;

              return (
                <div
                  key={m.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isToday
                      ? 'bg-gradient-to-r from-[#FFF5EB] to-white border-[#E88D67] shadow-xs'
                      : 'bg-white border-[#ECE7DF] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-3xl shrink-0 mt-0.5">{m.emoji || '🎂'}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xs font-black text-[#2D2825]">{m.title}</h3>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              isToday
                                ? 'bg-[#E88D67] text-white animate-pulse'
                                : m.info?.isPast
                                ? 'bg-[#FAF8F5] text-[#9E958D]'
                                : 'bg-[#FFF5EB] text-[#E88D67]'
                            }`}
                          >
                            {m.info?.text}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#746C65] mt-0.5">
                          📅 {new Date(m.date).toLocaleDateString('th-TH', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>

                        {/* Tagged Family Members 👥 */}
                        {taggedList.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className="text-[10px] text-[#746C65] font-bold flex items-center gap-1">
                              <Users size={12} weight="fill" className="text-[#5F8D75]" />
                              <span>ไปด้วยกัน:</span>
                            </span>
                            <div className="flex items-center -space-x-1">
                              {taggedList.map((tagMem) => (
                                <div
                                  key={tagMem.id}
                                  title={tagMem.name}
                                  className="w-5 h-5 rounded-full bg-[#FAF8F5] border-2 border-white overflow-hidden text-[9px] flex items-center justify-center font-bold shadow-2xs"
                                >
                                  {tagMem.avatarType === 'image' && tagMem.avatarImage ? (
                                    <img src={tagMem.avatarImage} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    tagMem.avatar || '😊'
                                  )}
                                </div>
                              ))}
                            </div>
                            <span className="text-[10px] text-[#5F8D75] font-bold">
                              {taggedList.map((t) => t.name).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {(isAdmin || currentUser?.id === m.memberId) && (
                      <button
                        type="button"
                        onClick={() => deleteMilestone(m.id)}
                        className="w-7 h-7 rounded-lg text-[#9E958D] hover:text-[#C84B31] hover:bg-[#FAF8F5] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="ลบวันสำคัญ"
                      >
                        <Trash size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center space-y-1.5">
              <span className="text-3xl">📅</span>
              <p className="text-xs font-bold text-[#2D2825]">ยังไม่มีวันสำคัญในหมวดนี้</p>
              <p className="text-[11px] text-[#746C65]">แตะปุ่ม "+ เพิ่มวัน" ด้านบน เพื่อสร้างนัดหมายใหม่</p>
            </div>
          )}
        </div>
      </section>

      {/* 6. Modal: Add Milestone & Tag Family Members */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl border border-[#ECE7DF] shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-4 sm:p-5 space-y-4 animate-enter-rise"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#ECE7DF] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{formEmoji}</span>
                <h3 className="text-sm font-black text-[#2D2825]">เพิ่มวันสำคัญ & นัดหมาย</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#FAF8F5] text-[#746C65] hover:bg-[#ECE7DF] flex items-center justify-center cursor-pointer"
              >
                <X size={15} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              {/* Title */}
              <div>
                <label className="text-[11px] font-bold text-[#746C65] block mb-1">
                  ชื่อวันสำคัญ / กิจกรรม <span className="text-[#C84B31]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น วันเกิดคุณแม่, พาคุณตาไปหาหมอ, ไปกินหมูกะทะ"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ECE7DF] bg-[#FAF8F5] text-xs font-medium text-[#2D2825] focus:outline-none focus:border-[#5F8D75] focus:bg-white"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-[11px] font-bold text-[#746C65] block mb-1">
                  วันที่ <span className="text-[#C84B31]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ECE7DF] bg-[#FAF8F5] text-xs font-bold text-[#2D2825] focus:outline-none focus:border-[#5F8D75] focus:bg-white"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-[11px] font-bold text-[#746C65] block mb-1">หมวดหมู่</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setFormCategory(cat.id);
                        if (cat.emoji) setFormEmoji(cat.emoji);
                      }}
                      className={`p-1.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                        formCategory === cat.id
                          ? 'bg-[#EEF4F0] border-[#5F8D75] text-[#5F8D75]'
                          : 'bg-[#FAF8F5] border-[#ECE7DF] text-[#746C65]'
                      }`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emoji Icons */}
              <div>
                <label className="text-[11px] font-bold text-[#746C65] block mb-1">เลือกไอคอนอิโมจิ</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {EMOJI_OPTIONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setFormEmoji(em)}
                      className={`w-8 h-8 rounded-xl text-lg flex items-center justify-center transition-transform cursor-pointer ${
                        formEmoji === em
                          ? 'bg-[#FFF5EB] border-2 border-[#E88D67] scale-110 shadow-xs'
                          : 'bg-[#FAF8F5] border border-[#ECE7DF] hover:scale-105'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* TAG FAMILY MEMBERS 👥 */}
              <div className="pt-2 border-t border-[#ECE7DF]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Users size={15} weight="fill" className="text-[#5F8D75]" />
                    <label className="text-[11px] font-black text-[#2D2825]">
                      แท็กคนที่ไปด้วยกัน / เกี่ยวข้อง 👥
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleTagAllMembers}
                    className="text-[10px] font-bold text-[#5F8D75] hover:underline cursor-pointer"
                  >
                    {formTaggedIds.length === (members || []).length ? 'ล้างแท็ก' : 'แท็กทุกคน 🏠'}
                  </button>
                </div>
                <p className="text-[10px] text-[#746C65] mb-2">
                  คนที่ถูกแท็กจะเห็นในปฏิทิน และได้รับการแจ้งเตือน 🔔
                </p>

                {/* Member selection chips */}
                <div className="grid grid-cols-2 gap-2">
                  {(members || []).map((m) => {
                    const isTagged = formTaggedIds.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleTagMember(m.id)}
                        className={`p-2 rounded-2xl border transition-all cursor-pointer flex items-center gap-2 ${
                          isTagged
                            ? 'bg-[#EEF4F0] border-[#5F8D75] ring-2 ring-[#5F8D75]/30'
                            : 'bg-[#FAF8F5] border-[#ECE7DF] hover:bg-white'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-white border border-[#ECE7DF] overflow-hidden flex items-center justify-center text-xs shrink-0 font-bold">
                          {m.avatarType === 'image' && m.avatarImage ? (
                            <img src={m.avatarImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            m.avatar || '😊'
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#2D2825] truncate">{m.name}</p>
                          <p className="text-[9px] text-[#746C65] truncate">{m.role}</p>
                        </div>

                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] shrink-0 ${
                            isTagged ? 'bg-[#5F8D75]' : 'border border-[#D6CFC7] bg-white'
                          }`}
                        >
                          {isTagged && <Check size={10} weight="bold" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#ECE7DF] text-[#746C65] text-xs font-bold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-2xl bg-[#5F8D75] hover:bg-[#476E5B] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  บันทึกลงปฏิทิน ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
