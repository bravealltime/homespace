import { useState } from 'react';
import {
  CalendarBlank,
  Plus,
  Trash,
  X,
  Sparkle,
  Clock,
  Heart,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const EMOJI_OPTIONS = ['🎂', '🏥', '🏖️', '✈️', '💍', '🎓', '🚗', '🏡', '🍲', '🎉', '💖', '🐾'];

const CATEGORIES = [
  { id: 'birthday', label: 'วันเกิด', emoji: '🎂' },
  { id: 'health', label: 'สุขภาพ / หาหมอ', emoji: '🏥' },
  { id: 'trip', label: 'ทริปครอบครัว', emoji: '🏖️' },
  { id: 'event', label: 'นัดหมายทั่วไป', emoji: '📅' },
];

export function getCountdownInfo(dateStr) {
  if (!dateStr) return { days: 0, text: '', isToday: false, isPast: false };

  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { days: 0, text: '🎉 วันนี้แล้ว!', isToday: true, isPast: false };
  } else if (diffDays === 1) {
    return { days: 1, text: 'พรุ่งนี้แล้ว! ⭐', isToday: false, isPast: false };
  } else if (diffDays > 1) {
    return { days: diffDays, text: `อีก ${diffDays} วัน`, isToday: false, isPast: false };
  } else {
    return { days: Math.abs(diffDays), text: `ผ่านไป ${Math.abs(diffDays)} วัน`, isToday: false, isPast: true };
  }
}

export default function FamilyMilestonesModal({ isOpen, onClose }) {
  const { milestones, addMilestone, deleteMilestone, members } = useApp();
  const { currentUser, isAdmin } = useAuth();

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [emoji, setEmoji] = useState('🎂');
  const [category, setCategory] = useState('birthday');

  if (!isOpen) return null;

  const sortedMilestones = [...milestones].sort((a, b) => new Date(a.date) - new Date(b.date));
  const upcomingMilestones = sortedMilestones.filter((m) => {
    const info = getCountdownInfo(m.date);
    return !info.isPast || info.isToday;
  });
  const pastMilestones = sortedMilestones.filter((m) => {
    const info = getCountdownInfo(m.date);
    return info.isPast && !info.isToday;
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    addMilestone({
      title: title.trim(),
      date,
      emoji,
      category,
      memberId: currentUser?.id || 'member-fluke',
    });
    setTitle('');
    setDate('');
    setIsAdding(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-[#ECE7DF] shadow-2xl w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden animate-enter-rise"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-[#ECE7DF] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FFF5EB] text-[#E88D67] border border-[#E88D67]/20 flex items-center justify-center text-lg shadow-2xs">
              🎂
            </div>
            <div>
              <h3 className="text-sm font-black text-[#2D2825]">วันสำคัญของบ้าน</h3>
              <p className="text-[10px] text-[#746C65]">นับถอยหลังวันพิเศษ & นัดหมายครอบครัว</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#FAF8F5] hover:bg-[#ECE7DF] flex items-center justify-center text-xs cursor-pointer transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* Add Milestone Toggle Button */}
          {!isAdding ? (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 px-3 rounded-2xl bg-[#EEF4F0] hover:bg-[#DFEDE3] text-[#5F8D75] text-xs font-black flex items-center justify-center gap-1.5 border border-[#5F8D75]/30 shadow-2xs cursor-pointer transition-all"
            >
              <Plus size={14} weight="bold" />
              <span>+ เพิ่มวันสำคัญ / นัดหมายใหม่</span>
            </button>
          ) : (
            /* Add Form */
            <form onSubmit={handleAddSubmit} className="bg-[#FAF8F5] rounded-2xl p-3.5 border border-[#5F8D75]/30 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-[#ECE7DF]">
                <span className="text-xs font-black text-[#2D2825]">เพิ่มวันพิเศษของบ้าน</span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-[#746C65] hover:text-[#2D2825] cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>

              {/* Emoji Picker */}
              <div>
                <label className="block text-[10px] font-bold text-[#746C65] mb-1">
                  เลือกไอคอน:
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {EMOJI_OPTIONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEmoji(em)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg border cursor-pointer transition-all ${
                        emoji === em
                          ? 'bg-white border-[#E88D67] shadow-xs scale-110'
                          : 'bg-[#ECE7DF]/50 border-transparent hover:bg-white'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold text-[#746C65] mb-1">
                  หมวดหมู่:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id);
                        setEmoji(cat.emoji);
                      }}
                      className={`p-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                        category === cat.id
                          ? 'bg-[#5F8D75] text-white border-[#5F8D75] shadow-xs'
                          : 'bg-white text-[#2D2825] border-[#ECE7DF] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-[10px] font-bold text-[#746C65] mb-1">
                  ชื่องาน / วันสำคัญ:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น วันเกิดคุณแม่, พาคุณยายไปหาหมอ, ทริปทะเล..."
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#ECE7DF] text-xs font-semibold text-[#2D2825] focus:outline-none focus:border-[#5F8D75]"
                  autoFocus
                />
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-[10px] font-bold text-[#746C65] mb-1">
                  วันที่:
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#ECE7DF] text-xs font-semibold text-[#2D2825] focus:outline-none focus:border-[#5F8D75]"
                />
              </div>

              <button
                type="submit"
                disabled={!title.trim() || !date}
                className="w-full py-2.5 bg-[#5F8D75] hover:bg-[#476E5B] disabled:opacity-40 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
              >
                บันทึกวันสำคัญ 💖
              </button>
            </form>
          )}

          {/* Upcoming Milestones List */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-[#2D2825] flex items-center justify-between px-0.5">
              <span>เร็ว ๆ นี้</span>
              <span className="text-[10px] text-[#5F8D75] font-bold">{upcomingMilestones.length} รายการ</span>
            </h4>

            {upcomingMilestones.map((m) => {
              const info = getCountdownInfo(m.date);
              const author = members.find((mem) => mem.id === m.memberId);
              const dateObj = new Date(m.date);
              const thaiDate = dateObj.toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={m.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                    info.isToday
                      ? 'bg-gradient-to-r from-[#FFF5EB] to-[#FFF0F5] border-[#E88D67] shadow-sm'
                      : 'bg-[#FAF8F5] border-[#ECE7DF] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl shrink-0">{m.emoji || '🎂'}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-[#2D2825] truncate">
                        {m.title}
                      </p>
                      <p className="text-[10px] text-[#746C65]">
                        {thaiDate} {author ? `· โดย ${author.name}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black shadow-2xs ${
                        info.isToday
                          ? 'bg-[#E88D67] text-white animate-pulse'
                          : info.days <= 7
                          ? 'bg-[#FEF08A] text-[#854D0E]'
                          : 'bg-[#EEF4F0] text-[#5F8D75]'
                      }`}
                    >
                      {info.text}
                    </span>

                    <button
                      type="button"
                      onClick={() => deleteMilestone(m.id)}
                      className="p-1 rounded-full text-[#9E958D] hover:text-red-500 transition-colors cursor-pointer"
                      title="ลบวันสำคัญนี้"
                    >
                      <Trash size={13} />
                    </button>
                  </div>
                </div>
              );
            })}

            {upcomingMilestones.length === 0 && (
              <p className="text-xs text-[#9E958D] text-center py-3 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#ECE7DF]">
                ยังไม่มีวันสำคัญที่กำลังจะมาถึง แตะ "+ เพิ่มวันสำคัญ" ด้านบนได้เลยครับ 🎂
              </p>
            )}
          </div>

          {/* Past Milestones (Accordion / Collapsible) */}
          {pastMilestones.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-[#ECE7DF]">
              <span className="text-[11px] font-bold text-[#746C65] block px-0.5">
                ที่ผ่านมาแล้ว ({pastMilestones.length})
              </span>
              <div className="space-y-1 opacity-60">
                {pastMilestones.slice(0, 3).map((m) => (
                  <div key={m.id} className="p-2 rounded-xl bg-[#FAF8F5] border border-[#ECE7DF] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span>{m.emoji}</span>
                      <span className="truncate">{m.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteMilestone(m.id)}
                      className="text-[#9E958D] hover:text-red-500 p-0.5"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
