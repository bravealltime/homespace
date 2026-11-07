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
  AirplaneTakeoff,
  Sun,
  MapPin,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getCountdownInfo } from './FamilyMilestonesModal';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const EMOJI_OPTIONS = [
  '🏖️', '✈️', '🚗', '⛺', '🎂', '🏥', '🍲',
  '🎉', '💊', '🛒', '🐾', '💍', '🎓', '🏡', '💖',
];

const CATEGORIES = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'trip', label: 'ทริปเที่ยว/พักผ่อน', emoji: '🏖️' },
  { id: 'birthday', label: 'วันเกิด', emoji: '🎂' },
  { id: 'health', label: 'หาหมอ/ยา', emoji: '🏥' },
  { id: 'food', label: 'นัดกินข้าว', emoji: '🍲' },
  { id: 'event', label: 'กิจกรรมทั่วไป', emoji: '📅' },
];

// Parse local YYYY-MM-DD safely without timezone offset drift
const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Format Date object to local YYYY-MM-DD string
const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Calculate duration in days & nights
const calculateTripDuration = (startStr, endStr) => {
  if (!startStr) return { days: 1, nights: 0, text: '1 วัน' };
  if (!endStr || endStr <= startStr) return { days: 1, nights: 0, text: '1 วัน' };
  const s = parseLocalDate(startStr);
  const e = parseLocalDate(endStr);
  const diffTime = e.getTime() - s.getTime();
  const days = Math.round(diffTime / 86400000) + 1;
  if (days <= 1) return { days: 1, nights: 0, text: '1 วัน' };
  return { days, nights: days - 1, text: `${days} วัน ${days - 1} คืน` };
};

export default function FamilyCalendarView({ onNavigateTab }) {
  const { milestones, addMilestone, deleteMilestone, members, t } = useApp();
  const { currentUser, isAdmin } = useAuth();

  const today = new Date();
  const todayStr = formatLocalDate(today);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);

  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states (Multi-day Range & Single Day)
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(todayStr);
  const [formEndDate, setFormEndDate] = useState(todayStr);
  const [formEmoji, setFormEmoji] = useState('🏖️');
  const [formCategory, setFormCategory] = useState('trip');
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
    setSelectedDateStr(formatLocalDate(now));
  };

  // Calendar Math
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Map milestones across ALL dates they span (Multi-Day Comprehensive Support)
  const milestonesByDate = {};
  (milestones || []).forEach((m) => {
    if (!m.date) return;
    const startDateStr = m.date.slice(0, 10);
    const endDateStr = m.endDate && m.endDate > startDateStr ? m.endDate.slice(0, 10) : null;

    if (endDateStr) {
      // Multi-day continuous event / trip
      const sDate = parseLocalDate(startDateStr);
      const eDate = parseLocalDate(endDateStr);
      const totalDays = Math.round((eDate.getTime() - sDate.getTime()) / 86400000) + 1;
      let curr = new Date(sDate);
      let dayIdx = 1;

      while (curr <= eDate) {
        const dKey = formatLocalDate(curr);
        if (!milestonesByDate[dKey]) milestonesByDate[dKey] = [];
        milestonesByDate[dKey].push({
          ...m,
          isMultiDay: true,
          multiDayStart: startDateStr,
          multiDayEnd: endDateStr,
          dayIndex: dayIdx,
          totalDays,
          isFirstDay: dKey === startDateStr,
          isLastDay: dKey === endDateStr,
        });
        curr.setDate(curr.getDate() + 1);
        dayIdx++;
      }
    } else {
      // Single-day event
      if (!milestonesByDate[startDateStr]) milestonesByDate[startDateStr] = [];
      milestonesByDate[startDateStr].push({
        ...m,
        isMultiDay: false,
        multiDayStart: startDateStr,
        multiDayEnd: startDateStr,
        dayIndex: 1,
        totalDays: 1,
        isFirstDay: true,
        isLastDay: true,
      });
    }
  });

  // Calendar grid cells
  const calendarCells = [];
  // 1. Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonthDate = new Date(currentYear, currentMonth - 1, dayNum);
    const dateStr = formatLocalDate(prevMonthDate);
    calendarCells.push({
      dayNum,
      dateStr,
      isCurrentMonth: false,
      milestones: milestonesByDate[dateStr] || [],
    });
  }

  // 2. Current month days
  for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
    const curDate = new Date(currentYear, currentMonth, dayNum);
    const dateStr = formatLocalDate(curDate);
    calendarCells.push({
      dayNum,
      dateStr,
      isCurrentMonth: true,
      milestones: milestonesByDate[dateStr] || [],
    });
  }

  // 3. Next month leading days (fill to 42 cells)
  const remainingCells = 42 - calendarCells.length;
  for (let dayNum = 1; dayNum <= (remainingCells >= 7 ? remainingCells % 7 : remainingCells); dayNum++) {
    const nextMonthDate = new Date(currentYear, currentMonth + 1, dayNum);
    const dateStr = formatLocalDate(nextMonthDate);
    calendarCells.push({
      dayNum,
      dateStr,
      isCurrentMonth: false,
      milestones: milestonesByDate[dateStr] || [],
    });
  }

  const selectedDayMilestones = milestonesByDate[selectedDateStr] || [];

  // Filtered upcoming milestones (Sorted by date)
  const allSortedMilestones = [...(milestones || [])].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const upcomingMilestones = allSortedMilestones
    .map((m) => ({ ...m, info: getCountdownInfo(m.date, m.endDate) }))
    .filter((m) => {
      if (activeCategoryFilter === 'all') return true;
      return m.category === activeCategoryFilter;
    });

  // Open add modal pre-filling selected date
  const openAddWithDate = (dateStr, asRange = false) => {
    const start = dateStr || selectedDateStr || todayStr;
    setFormDate(start);

    // Default multi-day end date (+2 days = 3 days 2 nights)
    const nextDay = parseLocalDate(start);
    nextDay.setDate(nextDay.getDate() + 2);
    setFormEndDate(formatLocalDate(nextDay));

    setIsRangeMode(asRange);
    setFormTitle('');
    setFormEmoji(asRange ? '🏖️' : '🎂');
    setFormCategory(asRange ? 'trip' : 'birthday');
    setFormTaggedIds([]);
    setIsAddModalOpen(true);
  };

  // Quick Preset Helper for Multi-day duration (+X days)
  const handleApplyPreset = (plusDays) => {
    const s = parseLocalDate(formDate);
    s.setDate(s.getDate() + plusDays);
    setFormEndDate(formatLocalDate(s));
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

    const finalEndDate = isRangeMode && formEndDate && formEndDate > formDate ? formEndDate : null;

    await addMilestone({
      title: formTitle.trim(),
      date: formDate,
      endDate: finalEndDate,
      emoji: formEmoji,
      category: formCategory,
      memberId: currentUser?.id || 'member-fluke',
      taggedMemberIds: formTaggedIds,
    });

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-36 sm:pb-40">
      {/* 1. Header with Title & Quick Switch to Fridge Board */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ECE7DF] shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF5EB] text-[#E88D67] border border-[#E88D67]/30 flex items-center justify-center text-xl shadow-2xs">
              📅
            </div>
            <div>
              <h1 className="text-base font-black text-[#2D2825]">
                {t ? t('calendarTitle', 'ปฏิทินวันสำคัญของบ้าน') : 'ปฏิทินวันสำคัญของบ้าน'}
              </h1>
              <p className="text-[11px] text-[#746C65]">
                วันเกิด นัดหมอ ทริปหลายวัน และแท็กคนที่ไปด้วยกัน 👥
              </p>
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
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#EEF4F0] text-[#5F8D75] border border-[#5F8D75]/30 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              วันนี้
            </button>

            <button
              type="button"
              onClick={() => openAddWithDate(selectedDateStr, false)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#5F8D75] hover:bg-[#476E5B] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Plus size={14} weight="bold" />
              <span>เพิ่มวัน</span>
            </button>
          </div>
        </div>

        {/* 3. Interactive Monthly Calendar Grid with Multi-Day Spanning */}
        <div className="bg-[#FAF8F5] rounded-2xl p-2 sm:p-3 border border-[#ECE7DF] space-y-1.5 select-none">
          {/* Weekday Labels (อา - ส) */}
          <div className="grid grid-cols-7 text-center pb-1">
            {WEEKDAYS.map((w, idx) => (
              <span
                key={w}
                className={`text-[11px] font-black py-0.5 ${
                  idx === 0 ? 'text-[#C84B31]' : idx === 6 ? 'text-[#3B82F6]' : 'text-[#746C65]'
                }`}
              >
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid - Harmonious, Unified Modern Layout */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarCells.map((cell, idx) => {
              const isToday = cell.dateStr === todayStr;
              const isSelected = cell.dateStr === selectedDateStr;
              const multiDayItem = cell.milestones.find((ev) => ev.isMultiDay);
              const singleEvents = cell.milestones.filter((ev) => !ev.isMultiDay);
              const dayOfWeek = (idx) % 7; // 0 = Sun, 6 = Sat

              return (
                <div
                  key={`${cell.dateStr}-${idx}`}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[46px] sm:min-h-[56px] p-1 rounded-xl transition-all cursor-pointer flex flex-col justify-between relative group ${
                    isSelected
                      ? 'bg-white ring-2 ring-[#5F8D75] shadow-xs z-10'
                      : isToday
                      ? 'bg-[#FFF5EB] border border-[#E88D67]/40 shadow-2xs'
                      : cell.isCurrentMonth
                      ? 'bg-white/80 hover:bg-white border border-[#ECE7DF]/80 hover:border-[#5F8D75]/40 shadow-2xs'
                      : 'bg-[#FAF8F5]/50 border border-transparent opacity-35 hover:opacity-70'
                  }`}
                >
                  {/* Top: Day Number & Single Event Indicator */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-105 ${
                        isToday
                          ? 'bg-[#E88D67] text-white font-black shadow-xs'
                          : isSelected
                          ? 'bg-[#5F8D75] text-white font-black shadow-xs'
                          : dayOfWeek === 0
                          ? 'text-[#C84B31]'
                          : dayOfWeek === 6
                          ? 'text-[#3B82F6]'
                          : cell.isCurrentMonth
                          ? 'text-[#2D2825]'
                          : 'text-[#9E958D]'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {/* Single Day Event Indicator Dot / Emoji */}
                    {singleEvents.length > 0 && !multiDayItem && (
                      <span className="text-[10px] leading-none shrink-0" title={singleEvents[0].title}>
                        {singleEvents[0]?.emoji || '🎂'}
                      </span>
                    )}

                    {multiDayItem && multiDayItem.isFirstDay && (
                      <span className="text-[11px] leading-none shrink-0" title={multiDayItem.title}>
                        {multiDayItem.emoji || '🏖️'}
                      </span>
                    )}
                  </div>

                  {/* Bottom: Multi-Day Continuous Ribbon or Single Event Dots */}
                  <div className="w-full mt-0.5">
                    {multiDayItem ? (
                      <div className="w-full">
                        {multiDayItem.isFirstDay && (
                          <div className="w-full rounded-l-md bg-gradient-to-r from-amber-400 to-amber-300 text-amber-950 font-black text-[8px] sm:text-[9px] px-1 py-0.5 truncate shadow-2xs">
                            {multiDayItem.title || 'เริ่มทริป'}
                          </div>
                        )}
                        {!multiDayItem.isFirstDay && !multiDayItem.isLastDay && (
                          <div className="w-full bg-amber-200/90 text-amber-900 font-bold text-[7.5px] sm:text-[8px] py-0.5 truncate text-center">
                            วันที่ {multiDayItem.dayIndex}
                          </div>
                        )}
                        {multiDayItem.isLastDay && (
                          <div className="w-full rounded-r-md bg-gradient-to-l from-amber-400 to-amber-300 text-amber-950 font-black text-[8px] sm:text-[9px] px-1 py-0.5 truncate text-center shadow-2xs">
                            🏁 จบ
                          </div>
                        )}
                      </div>
                    ) : singleEvents.length > 0 ? (
                      <div className="flex items-center gap-0.5 justify-center">
                        {singleEvents.slice(0, 3).map((ev, eIdx) => (
                          <span
                            key={ev.id || eIdx}
                            className="w-1.5 h-1.5 rounded-full bg-[#5F8D75]"
                            title={ev.title}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="h-1.5" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Selected Date Inspector Card with Multi-day Details (Clean, Uncluttered) */}
        {selectedDateStr && (
          <div className="bg-[#FAF8F5] rounded-2xl p-3 sm:p-4 border border-[#ECE7DF] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <CalendarCheck size={18} className="text-[#5F8D75] shrink-0" weight="bold" />
                <span className="text-xs sm:text-sm font-black text-[#2D2825] leading-tight break-words">
                  วันที่ {parseLocalDate(selectedDateStr).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {selectedDateStr === todayStr && (
                  <span className="text-[10px] bg-[#E88D67] text-white font-black px-2 py-0.5 rounded-full shrink-0 shadow-2xs whitespace-nowrap">
                    วันนี้
                  </span>
                )}
              </div>

              {/* Single Primary Action: Add Event or Trip */}
              <button
                type="button"
                onClick={() => openAddWithDate(selectedDateStr, false)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#5F8D75] hover:bg-[#4E7661] text-white text-xs font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 whitespace-nowrap"
              >
                <Plus size={14} weight="bold" />
                <span className="whitespace-nowrap">เพิ่มกิจกรรม</span>
              </button>
            </div>

            {selectedDayMilestones.length > 0 ? (
              <div className="space-y-2 pt-1">
                {selectedDayMilestones.map((m) => {
                  const creator = members.find((mem) => mem.id === m.memberId);
                  const taggedList = (m.taggedMemberIds || [])
                    .map((id) => members.find((mem) => mem.id === id))
                    .filter(Boolean);

                  const duration = m.isMultiDay
                    ? calculateTripDuration(m.multiDayStart, m.multiDayEnd)
                    : null;

                  return (
                    <div
                      key={m.id}
                      className={`bg-white rounded-2xl p-3 border shadow-2xs space-y-2 transition-all ${
                        m.isMultiDay ? 'border-[#E88D67]/40 ring-1 ring-[#E88D67]/20' : 'border-[#ECE7DF]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="text-3xl shrink-0 mt-0.5">{m.emoji || '🎂'}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs sm:text-sm font-black text-[#2D2825] truncate">
                                {m.title}
                              </p>
                              {m.isMultiDay && (
                                <span className="text-[10px] font-black bg-[#FFF5EB] text-[#E88D67] border border-[#E88D67]/30 px-2 py-0.5 rounded-full">
                                  🏖️ ทริป {duration?.text}
                                </span>
                              )}
                            </div>

                            {/* Multi-Day Progress Info */}
                            {m.isMultiDay ? (
                              <div className="mt-1 space-y-0.5">
                                <p className="text-[11px] font-bold text-[#5F8D75]">
                                  📍 วันนี้คือวันที่ {m.dayIndex} จากทั้งหมด {m.totalDays} วัน
                                </p>
                                <p className="text-[10px] text-[#746C65]">
                                  📅 {parseLocalDate(m.multiDayStart).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} ถึง {parseLocalDate(m.multiDayEnd).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                            ) : (
                              <p className="text-[10px] text-[#746C65] mt-0.5">
                                📅 นัดหมายวันเดียว
                              </p>
                            )}

                            {/* Tagged Family Members 👥 */}
                            {taggedList.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                <span className="text-[10px] text-[#746C65] font-bold">
                                  {m.isMultiDay ? 'คนที่ร่วมทริป:' : 'ไปด้วยกัน:'}
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
                            className="w-7 h-7 rounded-lg text-[#9E958D] hover:text-[#C84B31] hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            title="ลบนัดหมาย"
                          >
                            <Trash size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 px-3 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-[#EEF4F0] text-[#5F8D75] flex items-center justify-center mx-auto text-lg shadow-2xs">
                  🌿
                </div>
                <div>
                  <p className="text-xs font-bold text-[#2D2825]">ยังไม่มีนัดหมายในวันนี้</p>
                  <p className="text-[11px] text-[#746C65] mt-0.5">แตะเลือกจัดทริปหรือเพิ่มวันสำคัญของบ้านได้เลย</p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => openAddWithDate(selectedDateStr, false)}
                    className="text-xs font-bold text-[#5F8D75] bg-[#EEF4F0] hover:bg-[#DCEAE1] px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    + เพิ่มวันเกิด / นัดหมาย
                  </button>
                  <button
                    type="button"
                    onClick={() => openAddWithDate(selectedDateStr, true)}
                    className="text-xs font-bold text-[#E88D67] bg-[#FFF5EB] hover:bg-[#FFE8D6] px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs border border-[#E88D67]/30"
                  >
                    🏖️ วางแผนทริปหลายวัน
                  </button>
                </div>
              </div>
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
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
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
              const isOngoing = m.info?.isOngoing;
              const isMultiDay = Boolean(m.endDate && m.endDate > m.date);
              const duration = isMultiDay ? calculateTripDuration(m.date, m.endDate) : null;

              return (
                <div
                  key={m.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isOngoing
                      ? 'bg-gradient-to-r from-[#FFF5EB] via-white to-[#EEF4F0] border-[#E88D67] shadow-xs'
                      : isToday
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
                          {isMultiDay && (
                            <span className="text-[10px] font-black bg-[#FFF5EB] text-[#E88D67] px-2 py-0.2 rounded-full border border-[#E88D67]/30">
                              🏖️ {duration?.text}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              isOngoing
                                ? 'bg-[#5F8D75] text-white animate-pulse'
                                : isToday
                                ? 'bg-[#E88D67] text-white animate-pulse'
                                : m.info?.isPast
                                ? 'bg-[#FAF8F5] text-[#9E958D]'
                                : 'bg-[#FFF5EB] text-[#E88D67]'
                            }`}
                          >
                            {m.info?.text}
                          </span>
                        </div>

                        {/* Date info */}
                        <p className="text-[11px] text-[#746C65] mt-0.5">
                          {isMultiDay ? (
                            <span>
                              📅 {parseLocalDate(m.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - {parseLocalDate(m.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          ) : (
                            <span>
                              📅 {parseLocalDate(m.date).toLocaleDateString('th-TH', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </p>

                        {/* Tagged Family Members 👥 */}
                        {taggedList.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className="text-[10px] text-[#746C65] font-bold flex items-center gap-1">
                              <Users size={12} weight="fill" className="text-[#5F8D75]" />
                              <span>{isMultiDay ? 'ร่วมทริป:' : 'ไปด้วยกัน:'}</span>
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

      {/* 6. Modal: Add Milestone & Multi-day Trip Planner */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl border border-[#ECE7DF] shadow-2xl w-full max-w-sm max-h-[92vh] overflow-y-auto no-scrollbar p-4 sm:p-5 space-y-3.5 animate-enter-rise"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#ECE7DF] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{formEmoji}</span>
                <div>
                  <h3 className="text-sm font-black text-[#2D2825]">
                    {isRangeMode ? 'วางแผนทริป & กิจกรรมหลายวัน' : 'เพิ่มวันสำคัญ & นัดหมาย'}
                  </h3>
                  <p className="text-[10px] text-[#746C65]">
                    {isRangeMode ? 'กำหนดวันเริ่มต้น - วันกลับ พร้อมแท็กคนในบ้าน' : 'ระบุวันสำคัญ พร้อมแท็กคนที่ไปด้วยกัน'}
                  </p>
                </div>
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
              {/* Mode Switcher: Single Day vs Multi-Day Range */}
              <div className="grid grid-cols-2 p-1 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-xs font-bold gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsRangeMode(false);
                    setFormCategory('birthday');
                    setFormEmoji('🎂');
                  }}
                  className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    !isRangeMode
                      ? 'bg-white text-[#2D2825] shadow-xs font-black'
                      : 'text-[#746C65] hover:text-[#2D2825]'
                  }`}
                >
                  <span>🔘 วันเดียว</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsRangeMode(true);
                    setFormCategory('trip');
                    setFormEmoji('🏖️');
                    // Ensure end date is at least start date
                    if (formEndDate < formDate) {
                      const next = parseLocalDate(formDate);
                      next.setDate(next.getDate() + 2);
                      setFormEndDate(formatLocalDate(next));
                    }
                  }}
                  className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isRangeMode
                      ? 'bg-[#E88D67] text-white shadow-xs font-black'
                      : 'text-[#746C65] hover:text-[#2D2825]'
                  }`}
                >
                  <span>🏖️ หลายวัน (ทริปเที่ยว)</span>
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="text-[11px] font-bold text-[#746C65] block mb-1">
                  ชื่อกิจกรรม / ทริป <span className="text-[#C84B31]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isRangeMode ? "เช่น ทริปเที่ยวหัวหิน, ไปเชียงใหม่ 3 วัน, พักผ่อนเขาใหญ่" : "เช่น วันเกิดคุณแม่, พาคุณตาไปหาหมอ, ไปกินหมูกะทะ"}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ECE7DF] bg-[#FAF8F5] text-xs font-medium text-[#2D2825] focus:outline-none focus:border-[#5F8D75] focus:bg-white"
                />
              </div>

              {/* Single Day Date Picker */}
              {!isRangeMode ? (
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
              ) : (
                /* Multi-Day Range Pickers */
                <div className="space-y-2 p-3 rounded-2xl bg-gradient-to-b from-[#FFF5EB] to-[#FFF9F5] border border-[#E88D67]/30">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Start Date */}
                    <div>
                      <label className="text-[10.5px] font-black text-[#E88D67] block mb-1">
                        🚀 วันเริ่มต้น:
                      </label>
                      <input
                        type="date"
                        required
                        value={formDate}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          setFormDate(newStart);
                          if (formEndDate < newStart) {
                            setFormEndDate(newStart);
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-[#E88D67]/40 bg-white text-xs font-bold text-[#2D2825] focus:outline-none focus:border-[#E88D67]"
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="text-[10.5px] font-black text-[#5F8D75] block mb-1">
                        🏁 วันสิ้นสุด (กลับ):
                      </label>
                      <input
                        type="date"
                        required
                        min={formDate}
                        value={formEndDate}
                        onChange={(e) => {
                          const newEnd = e.target.value;
                          if (newEnd >= formDate) {
                            setFormEndDate(newEnd);
                          } else {
                            setFormEndDate(formDate);
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-[#5F8D75]/40 bg-white text-xs font-bold text-[#2D2825] focus:outline-none focus:border-[#5F8D75]"
                      />
                    </div>
                  </div>

                  {/* Dynamic Duration Preview Badge */}
                  <div className="flex items-center justify-between text-[11px] font-black text-[#E88D67] pt-0.5">
                    <span className="flex items-center gap-1">
                      <span>✨</span>
                      <span>ระยะเวลา: {calculateTripDuration(formDate, formEndDate).text}</span>
                    </span>
                    <span className="text-[10px] text-[#746C65] font-semibold">
                      ({parseLocalDate(formDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - {parseLocalDate(formEndDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })})
                    </span>
                  </div>

                  {/* Quick Duration Presets (+X days) */}
                  <div className="space-y-1 pt-1 border-t border-[#E88D67]/20">
                    <span className="text-[10px] font-bold text-[#746C65] block">
                      แตะเลือกความยาวทริปด่วน:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(1)}
                        className="px-2 py-0.5 rounded-lg bg-white hover:bg-[#FFE8D6] text-[#E88D67] border border-[#E88D67]/30 text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        +1 วัน (2 วัน 1 คืน)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(2)}
                        className="px-2 py-0.5 rounded-lg bg-white hover:bg-[#FFE8D6] text-[#E88D67] border border-[#E88D67]/30 text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        +2 วัน (3 วัน 2 คืน)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(3)}
                        className="px-2 py-0.5 rounded-lg bg-white hover:bg-[#FFE8D6] text-[#E88D67] border border-[#E88D67]/30 text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        +3 วัน (4 วัน 3 คืน)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(6)}
                        className="px-2 py-0.5 rounded-lg bg-white hover:bg-[#FFE8D6] text-[#E88D67] border border-[#E88D67]/30 text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        +6 วัน (1 สัปดาห์)
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
                      {isRangeMode ? 'ใครไปร่วมทริปนี้บ้าง? 👥' : 'แท็กคนที่ไปด้วยกัน / เกี่ยวข้อง 👥'}
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
                  {isRangeMode ? 'บันทึกทริปนี้ ✓' : 'บันทึกลงปฏิทิน ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
