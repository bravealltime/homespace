import { useState, useEffect } from 'react';
import {
  PushPin,
  Plus,
  Trash,
  Check,
  SpeakerHigh,
  X,
  Smiley,
  CalendarBlank,
  Globe,
  ShoppingCart,
  CheckCircle,
  Circle,
  Sparkle,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { speakThai, stopSpeaking } from '../utils/speechHelper';
import { translateText } from '../utils/translator';

const COLOR_MAP = {
  yellow: {
    bg: 'bg-[#FEF9C3]',
    border: 'border-[#FDE047]',
    pin: 'text-[#CA8A04]',
    badge: 'bg-[#FEF08A] text-[#854D0E]',
  },
  pink: {
    bg: 'bg-[#FCE7F3]',
    border: 'border-[#F472B6]',
    pin: 'text-[#DB2777]',
    badge: 'bg-[#FBCFE8] text-[#9D174D]',
  },
  green: {
    bg: 'bg-[#DCFCE7]',
    border: 'border-[#86EFAC]',
    pin: 'text-[#16A34A]',
    badge: 'bg-[#BBF7D0] text-[#166534]',
  },
  blue: {
    bg: 'bg-[#E0F2FE]',
    border: 'border-[#7DD3FC]',
    pin: 'text-[#0284C7]',
    badge: 'bg-[#BAE6FD] text-[#075985]',
  },
  peach: {
    bg: 'bg-[#FFEDD5]',
    border: 'border-[#FDBA74]',
    pin: 'text-[#EA580C]',
    badge: 'bg-[#FED7AA] text-[#9A3412]',
  },
};

const QUICK_NOTES = [
  'กับข้าวอยู่ในตู้เย็น อุ่นกินได้เลย 🍲',
  'วันนี้กลับดึกนิดหน่อยนะ ไม่ต้องรอ 🚗',
  'อย่าลืมปิดไฟและล็อคประตูหน้าบ้าน 🔒',
  'พรุ่งนี้มีช่างมาซ่อมแอร์ตอนบ่ายสอง ❄️',
  'อย่าลืมกินยาหลังอาหารเช้าด้วยนะจ๊ะ 💊',
  'ซื้อผลไม้กับขนมมาฝาก อยู่ในครัวนะ 🍉',
];

const QUICK_GROCERIES = [
  { name: 'ไข่ไก่', emoji: '🥚' },
  { name: 'นมสด', emoji: '🥛' },
  { name: 'ขนมปัง', emoji: '🍞' },
  { name: 'ผักสด', emoji: '🥬' },
  { name: 'หมู/ไก่', emoji: '🥩' },
  { name: 'ผลไม้', emoji: '🍎' },
  { name: 'ข้าวสาร', emoji: '🍚' },
  { name: 'ทิชชู่', emoji: '🧻' },
  { name: 'น้ำดื่ม', emoji: '💧' },
  { name: 'น้ำยาล้างจาน', emoji: '🧴' },
];

function timeAgo(timestamp) {
  if (!timestamp) return 'เมื่อสักครู่';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} น.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชม.`;
  return `${Math.floor(hours / 24)} วัน`;
}

export default function DigitalFridgeBoard({ isFullPage = false, onNavigateTab }) {
  const { notes, addNote, toggleNoteAck, deleteNote, members, t } = useApp();
  const { currentUser, isAdmin } = useAuth();

  const [activeFridgeTab, setActiveFridgeTab] = useState('notes'); // 'notes' | 'groceries'
  const [groceryFilter, setGroceryFilter] = useState('all'); // 'all' | 'unbought' | 'bought'
  const [newGroceryInput, setNewGroceryInput] = useState('');
  const [groceryToast, setGroceryToast] = useState('');

  // Persisted Groceries State
  const [groceries, setGroceries] = useState(() => {
    try {
      const saved = localStorage.getItem('homespace_shared_groceries');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      { id: 'g-1', name: 'ไข่ไก่ 1 แผง (เบอร์ 2)', emoji: '🥚', checked: false, addedBy: 'คุณแม่', createdAt: Date.now() - 3600000 },
      { id: 'g-2', name: 'นมสดจืด 2 ลิตร', emoji: '🥛', checked: false, addedBy: 'Fluke', createdAt: Date.now() - 7200000 },
      { id: 'g-3', name: 'ขนมปังโฮลวีท', emoji: '🍞', checked: true, checkedBy: 'Fluke', checkedAt: Date.now() - 1800000 },
      { id: 'g-4', name: 'ผักกาดขาว / แตงกวา', emoji: '🥬', checked: false, addedBy: 'คุณยาย', createdAt: Date.now() - 10800000 },
      { id: 'g-5', name: 'ทิชชู่ม้วนแพ็กใหญ่', emoji: '🧻', checked: true, checkedBy: 'คุณแม่', checkedAt: Date.now() - 5400000 },
    ];
  });

  const saveGroceries = (newList) => {
    setGroceries(newList);
    try {
      localStorage.setItem('homespace_shared_groceries', JSON.stringify(newList));
    } catch {}
  };

  const handleAddGrocery = (name, emoji = '🛒') => {
    if (!name || !name.trim()) return;
    const newItem = {
      id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      emoji: emoji || '🛒',
      checked: false,
      addedBy: currentUser?.name || 'สมาชิกในบ้าน',
      createdAt: Date.now(),
    };
    saveGroceries([newItem, ...groceries]);
    setNewGroceryInput('');
    setGroceryToast(`เพิ่ม "${name.trim()}" เข้าลิสต์ของต้องซื้อแล้วจ้า 🛒`);
    setTimeout(() => setGroceryToast(''), 2500);
  };

  const handleToggleGrocery = (id) => {
    const updated = groceries.map((item) => {
      if (item.id === id) {
        const nextChecked = !item.checked;
        if (nextChecked) {
          setGroceryToast(`ซื้อ "${item.name}" เรียบร้อยแล้ว! ขอบคุณที่ช่วยดูแลบ้านนะจ๊ะ ✨`);
          setTimeout(() => setGroceryToast(''), 2500);
        }
        return {
          ...item,
          checked: nextChecked,
          checkedBy: nextChecked ? (currentUser?.name || 'สมาชิกในบ้าน') : null,
          checkedAt: nextChecked ? Date.now() : null,
        };
      }
      return item;
    });
    saveGroceries(updated);
  };

  const handleDeleteGrocery = (id) => {
    saveGroceries(groceries.filter((item) => item.id !== id));
  };

  const handleClearBoughtGroceries = () => {
    if (window.confirm('คุณต้องการล้างรายการที่ซื้อแล้วทั้งหมดใช่หรือไม่?')) {
      saveGroceries(groceries.filter((item) => !item.checked));
    }
  };

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState('yellow');
  const [speakingNoteId, setSpeakingNoteId] = useState(null);

  // Close modals on Android hardware back button
  useEffect(() => {
    const onBack = (e) => {
      if (isCreateOpen) {
        setIsCreateOpen(false);
        e.preventDefault();
      }
    };
    window.addEventListener('app:android-back', onBack);
    return () => window.removeEventListener('app:android-back', onBack);
  }, [isCreateOpen]);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    addNote({
      memberId: currentUser?.id || 'member-fluke',
      text: noteText.trim(),
      color: noteColor,
      isPinned: 1,
    });
    setNoteText('');
    setIsCreateOpen(false);
  };

  const handleSpeakNote = (noteId, text) => {
    if (speakingNoteId === noteId) {
      stopSpeaking();
      setSpeakingNoteId(null);
      return;
    }
    setSpeakingNoteId(noteId);
    speakThai(
      text,
      () => setSpeakingNoteId(noteId),
      () => setSpeakingNoteId(null)
    );
  };

  const renderNoteCard = (note, isCarousel = false) => {
    const author = members.find((m) => m.id === note.memberId);
    const colorStyle = COLOR_MAP[note.color] || COLOR_MAP.yellow;
    const acks = Array.isArray(note.acknowledgments) ? note.acknowledgments : [];
    const isAckedByMe = currentUser ? acks.includes(currentUser.id) : false;
    const isOwnerOrAdmin =
      isAdmin ||
      note.memberId === currentUser?.id ||
      currentUser?.role?.includes('พ่อ') ||
      currentUser?.role?.includes('แม่') ||
      currentUser?.role?.includes('เจ้าบ้าน');

    return (
      <div
        key={note.id}
        className={`rounded-2xl p-3 border shadow-xs flex flex-col justify-between transition-all relative ${
          isCarousel ? 'w-52 sm:w-56 shrink-0' : 'w-full'
        } ${colorStyle.bg} ${colorStyle.border}`}
      >
        {/* Pushpin / Magnet Icon */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <PushPin size={16} weight="fill" className={colorStyle.pin} />
            <span className="text-[11px] font-bold text-[#2D2825] truncate">
              {author?.name || 'สมาชิก'}
            </span>
            <span className="text-[10px] text-[#746C65]">
              · {timeAgo(note.timestamp)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Speech button for seniors */}
            <button
              type="button"
              onClick={() => handleSpeakNote(note.id, `${author?.name || 'สมาชิก'} แปะโน้ตว่า ${note.text}`)}
              className={`p-1.5 rounded-full text-[#746C65] hover:text-[#2D2825] transition-colors cursor-pointer ${
                speakingNoteId === note.id ? 'text-[#5F8D75] animate-pulse' : ''
              }`}
              title="ฟังเสียงอ่านโน้ตนี้"
            >
              <SpeakerHigh size={14} weight={speakingNoteId === note.id ? 'fill' : 'regular'} />
            </button>

            {/* Delete button */}
            {isOwnerOrAdmin && (
              <button
                type="button"
                onClick={() => deleteNote(note.id)}
                className="p-1.5 rounded-full text-[#9E958D] hover:text-[#C84B31] transition-colors cursor-pointer"
                title="เอาโน้ตนี้ออก"
              >
                <Trash size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Note Content */}
        <p className="text-xs sm:text-[13px] font-semibold text-[#2D2825] leading-relaxed my-2 break-words">
          {note.text}
        </p>

        {/* Bottom Acknowledgment Action */}
        <div className="pt-2 border-t border-black/10 flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => toggleNoteAck(note.id)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
              isAckedByMe
                ? 'bg-[#5F8D75] text-white shadow-2xs'
                : 'bg-white/80 hover:bg-white text-[#2D2825] border border-black/10'
            }`}
          >
            <Check size={11} weight="bold" />
            <span>{isAckedByMe ? 'รับทราบแล้ว 👍' : 'แตะรับทราบ'}</span>
          </button>

          {acks.length > 0 && (
            <span className="text-[10px] text-[#746C65] font-bold truncate">
              เห็นแล้ว {acks.length} คน
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderCreateModal = () => {
    if (!isCreateOpen) return null;

    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none"
        onClick={() => setIsCreateOpen(false)}
      >
        <div
          className="bg-white rounded-3xl border border-[#ECE7DF] shadow-2xl w-full max-w-sm overflow-hidden animate-enter-rise"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="p-4 border-b border-[#ECE7DF] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FEF08A] text-[#854D0E] flex items-center justify-center text-base shadow-2xs">
                📌
              </div>
              <div>
                <h3 className="text-sm font-black text-[#2D2825]">แปะโน้ตบนตู้เย็น</h3>
                <p className="text-[10px] text-[#746C65]">ทุกคนในบ้านจะเห็นทันทีเมื่อเปิดแอป</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="w-7 h-7 rounded-full bg-[#FAF8F5] text-[#746C65] hover:bg-[#ECE7DF] flex items-center justify-center cursor-pointer"
            >
              <X size={15} weight="bold" />
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="p-4 space-y-3.5">
            {/* Note text input */}
            <div>
              <label className="text-[11px] font-bold text-[#746C65] block mb-1">
                ข้อความที่อยากบอกคนในบ้าน
              </label>
              <textarea
                required
                rows={3}
                placeholder="เช่น กับข้าวอยู่ในตู้เย็นนะ อุ่นกินได้เลย..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full p-2.5 rounded-2xl border border-[#ECE7DF] bg-[#FAF8F5] text-xs font-medium text-[#2D2825] focus:outline-none focus:border-[#5F8D75] focus:bg-white resize-none"
              />
            </div>

            {/* Quick Templates */}
            <div>
              <label className="text-[10px] font-bold text-[#746C65] block mb-1">
                หรือเลือกข้อความสำเร็จรูป
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {QUICK_NOTES.map((text, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNoteText(text)}
                    className="px-2 py-1 rounded-full bg-[#FAF8F5] hover:bg-[#ECE7DF] text-[#2D2825] text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer border border-[#ECE7DF]"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>

            {/* Color selection */}
            <div>
              <label className="text-[11px] font-bold text-[#746C65] block mb-1">
                เลือกสีกระดาษโน้ต
              </label>
              <div className="flex items-center gap-2">
                {Object.keys(COLOR_MAP).map((colorKey) => {
                  const conf = COLOR_MAP[colorKey];
                  const isSelected = noteColor === colorKey;
                  return (
                    <button
                      key={colorKey}
                      type="button"
                      onClick={() => setNoteColor(colorKey)}
                      className={`w-7 h-7 rounded-xl border-2 transition-all cursor-pointer ${conf.bg} ${conf.border} ${
                        isSelected ? 'scale-115 shadow-sm ring-2 ring-[#2D2825]/30' : 'hover:scale-105'
                      }`}
                      title={colorKey}
                    />
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#ECE7DF] text-[#746C65] text-xs font-bold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-2xl bg-[#5F8D75] hover:bg-[#476E5B] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                แปะโน้ตเลย 📌
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const unboughtCount = groceries.filter((g) => !g.checked).length;
  const filteredGroceries = groceries.filter((item) => {
    if (groceryFilter === 'unbought') return !item.checked;
    if (groceryFilter === 'bought') return item.checked;
    return true;
  });

  // 1. Full Page Dedicated Tab View
  if (isFullPage) {
    return (
      <div className="space-y-4 pb-28 sm:pb-36 relative">
        {/* Floating Toast Notification */}
        {groceryToast && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#2D2825] text-white px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-xl border border-white/20 animate-enter-rise flex items-center gap-2 pointer-events-none">
            <span>🛒</span>
            <span>{groceryToast}</span>
          </div>
        )}

        {/* Full Page Header with Tab Switcher */}
        <section className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ECE7DF] shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FFFBEB] text-[#CA8A04] border border-[#FDE047] flex items-center justify-center text-xl shadow-2xs">
                {activeFridgeTab === 'groceries' ? '🛒' : '📌'}
              </div>
              <div>
                <h1 className="text-base font-black text-[#2D2825]">
                  {activeFridgeTab === 'groceries' ? 'รายการซื้อของเข้าบ้าน' : (t ? t('fridgeTitle', 'ตู้เย็น & กระดานโน้ตของบ้าน') : 'ตู้เย็น & กระดานโน้ตของบ้าน')}
                </h1>
                <p className="text-[11px] text-[#746C65]">
                  {activeFridgeTab === 'groceries'
                    ? 'ช่วยกันจดของที่ขาด ใครซื้อแล้วกดติ๊กถูกบอกคนในบ้านได้เลย'
                    : (t ? t('fridgeSubtitle', 'แปะโพสต์อิทบอกกัน ฟังเสียงอ่าน และกดรับทราบ 👍') : 'แปะโพสต์อิทบอกกัน ฟังเสียงอ่าน และกดรับทราบ 👍')}
                </p>
              </div>
            </div>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('calendar')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#FFF5EB] text-[#E88D67] border border-[#E88D67]/40 text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <CalendarBlank size={14} weight="bold" />
                <span>{t ? t('tabCalendar', 'ปฏิทิน') : 'ปฏิทินบ้าน'}</span>
              </button>
            )}
          </div>

          {/* Fridge Door Tab Switcher */}
          <div className="flex p-1 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] gap-1">
            <button
              type="button"
              onClick={() => setActiveFridgeTab('notes')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeFridgeTab === 'notes'
                  ? 'bg-white text-[#2D2825] shadow-xs'
                  : 'text-[#746C65] hover:text-[#2D2825]'
              }`}
            >
              <span>📌 โน้ตแปะตู้เย็น</span>
              {notes.length > 0 && (
                <span className="text-[10px] bg-[#FEF08A] text-[#854D0E] font-bold px-2 py-0.2 rounded-full">
                  {notes.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveFridgeTab('groceries')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeFridgeTab === 'groceries'
                  ? 'bg-white text-[#2D2825] shadow-xs'
                  : 'text-[#746C65] hover:text-[#2D2825]'
              }`}
            >
              <span>🛒 ของต้องซื้อเข้าบ้าน</span>
              {unboughtCount > 0 && (
                <span className="text-[10px] bg-[#E88D67] text-white font-bold px-2 py-0.2 rounded-full">
                  {unboughtCount}
                </span>
              )}
            </button>
          </div>

          {/* Subheader controls for Notes Tab */}
          {activeFridgeTab === 'notes' && (
            <>
              <div className="bg-[#FAF8F5] rounded-2xl p-2.5 px-3 border border-[#ECE7DF] flex items-center justify-between">
                <span className="text-xs font-bold text-[#746C65]">
                  มีทั้งหมด {notes.length} โน้ตบนตู้เย็น
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#5F8D75] hover:bg-[#476E5B] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Plus size={14} weight="bold" />
                  <span>{t ? t('postStickyNote', 'แปะโน้ตใหม่ 📌') : '+ แปะโน้ตใหม่'}</span>
                </button>
              </div>

              <div>
                <p className="text-[10px] font-bold text-[#9E958D] mb-1.5">ไอเดียข้อความเร็ว (แตะเพื่อแปะได้ทันที):</p>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {QUICK_NOTES.map((text, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNoteText(text);
                        setIsCreateOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-full bg-[#FAF8F5] hover:bg-[#FEF08A] text-[#2D2825] border border-[#ECE7DF] text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Subheader controls for Groceries Tab */}
          {activeFridgeTab === 'groceries' && (
            <div className="space-y-3">
              {/* Quick Preset Pills */}
              <div>
                <p className="text-[10px] font-bold text-[#746C65] mb-1.5 flex items-center gap-1">
                  <span>⚡ แตะเพิ่มของสดของกินด่วน:</span>
                </p>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {QUICK_GROCERIES.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddGrocery(q.name, q.emoji)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF8F5] hover:bg-[#EEF4F0] text-[#2D2825] border border-[#ECE7DF] hover:border-[#5F8D75] text-xs font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <span>{q.emoji}</span>
                      <span>+ {q.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Custom Grocery Item Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddGrocery(newGroceryInput);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={newGroceryInput}
                  onChange={(e) => setNewGroceryInput(e.target.value)}
                  placeholder="พิมพ์ของที่ต้องซื้อ เช่น ไข่ไก่, น้ำปลา, ผลไม้..."
                  className="flex-1 px-3.5 py-2 rounded-2xl border border-[#ECE7DF] bg-[#FAF8F5] text-xs font-medium text-[#2D2825] focus:outline-none focus:border-[#5F8D75] focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={!newGroceryInput.trim()}
                  className="px-3.5 py-2 rounded-2xl bg-[#5F8D75] hover:bg-[#4E7661] disabled:opacity-40 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
                >
                  <Plus size={14} weight="bold" />
                  <span>เพิ่ม</span>
                </button>
              </form>

              {/* Grocery Filter & Clear Completed Bar */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#ECE7DF]/70">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGroceryFilter('all')}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                      groceryFilter === 'all'
                        ? 'bg-[#2D2825] text-white'
                        : 'bg-[#FAF8F5] text-[#746C65] hover:bg-[#ECE7DF]'
                    }`}
                  >
                    ทั้งหมด ({groceries.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroceryFilter('unbought')}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                      groceryFilter === 'unbought'
                        ? 'bg-[#E88D67] text-white'
                        : 'bg-[#FAF8F5] text-[#746C65] hover:bg-[#ECE7DF]'
                    }`}
                  >
                    ต้องซื้อ ({unboughtCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroceryFilter('bought')}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                      groceryFilter === 'bought'
                        ? 'bg-[#5F8D75] text-white'
                        : 'bg-[#FAF8F5] text-[#746C65] hover:bg-[#ECE7DF]'
                    }`}
                  >
                    ซื้อแล้ว ({groceries.length - unboughtCount})
                  </button>
                </div>

                {groceries.some((g) => g.checked) && (
                  <button
                    type="button"
                    onClick={handleClearBoughtGroceries}
                    className="text-[10px] text-[#9E958D] hover:text-red-500 font-bold transition-colors cursor-pointer"
                  >
                    ล้างที่ซื้อแล้ว
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Content Section: Notes vs Groceries */}
        {activeFridgeTab === 'notes' && (
          <section className="space-y-2">
            {notes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {notes.map((note) => renderNoteCard(note, false))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 border border-[#ECE7DF] text-center space-y-2">
                <span className="text-4xl">🧊</span>
                <p className="text-sm font-black text-[#2D2825]">ตู้เย็นยังว่างอยู่</p>
                <p className="text-xs text-[#746C65] max-w-xs mx-auto">
                  ยังไม่มีใครแปะโน้ตไว้ แตะปุ่ม "+ แปะโน้ตใหม่" เพื่อบอกเรื่องอาหาร การกลับบ้าน หรือเตือนความจำได้เลย!
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#5F8D75] text-white text-xs font-bold shadow-xs hover:bg-[#476E5B] transition-colors cursor-pointer mt-2"
                >
                  <Plus size={14} weight="bold" />
                  <span>แปะโน้ตคนแรก</span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* Content Section: Groceries List */}
        {activeFridgeTab === 'groceries' && (
          <section className="space-y-2">
            {filteredGroceries.length > 0 ? (
              <div className="space-y-2">
                {filteredGroceries.map((item) => {
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleGrocery(item.id)}
                      className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group select-none ${
                        item.checked
                          ? 'bg-[#FAF8F5]/80 border-[#ECE7DF] opacity-75'
                          : 'bg-white border-[#ECE7DF] hover:border-[#5F8D75]/40 shadow-2xs hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Checkbox Icon */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleGrocery(item.id);
                          }}
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            item.checked
                              ? 'bg-[#5F8D75] text-white shadow-2xs'
                              : 'border-2 border-[#D6CFC7] hover:border-[#5F8D75] bg-white'
                          }`}
                        >
                          {item.checked && <Check size={14} weight="bold" />}
                        </button>

                        <span className="text-xl shrink-0">{item.emoji || '🛒'}</span>

                        <div className="min-w-0">
                          <p
                            className={`text-xs sm:text-sm font-bold truncate transition-all ${
                              item.checked
                                ? 'line-through text-[#9E958D]'
                                : 'text-[#2D2825]'
                            }`}
                          >
                            {item.name}
                          </p>
                          <p className="text-[10px] text-[#746C65] truncate mt-0.5">
                            {item.checked ? (
                              <span className="text-[#5F8D75] font-semibold">
                                ซื้อเรียบร้อยแล้วโดย {item.checkedBy || 'สมาชิกในบ้าน'} ✅
                              </span>
                            ) : (
                              <span>เพิ่มโดย {item.addedBy || 'สมาชิก'} • ยังไม่ได้ซื้อ</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGrocery(item.id);
                        }}
                        className="w-7 h-7 rounded-full text-[#B0A79E] hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer shrink-0 opacity-60 group-hover:opacity-100"
                        title="ลบรายการนี้"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 border border-[#ECE7DF] text-center space-y-2">
                <span className="text-4xl">🛒</span>
                <p className="text-sm font-black text-[#2D2825]">
                  {groceryFilter === 'unbought'
                    ? 'ซื้อของครบหมดแล้ว เยี่ยมมาก! ✨'
                    : 'ยังไม่มีรายการของต้องซื้อ'}
                </p>
                <p className="text-xs text-[#746C65] max-w-xs mx-auto">
                  แตะเลือกของสดด้านบน หรือพิมพ์สิ่งที่อยากให้คนในบ้านช่วยซื้อเข้าตู้เย็นได้เลยครับ
                </p>
              </div>
            )}
          </section>
        )}

        {/* Create Modal */}
        {renderCreateModal()}
      </div>
    );
  }

  // 2. Compact Carousel View (when embedded in TodayHome or widgets)
  return (
    <section className="bg-white rounded-3xl p-3 sm:p-3.5 border border-[#ECE7DF] shadow-2xs space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#FAF8F5] border border-[#ECE7DF] flex items-center justify-center text-sm shadow-2xs">
            📌
          </div>
          <div>
            <h3 className="text-xs font-black text-[#2D2825] flex items-center gap-1.5">
              <span>ตู้เย็นของบ้าน</span>
              <span className="text-[10px] bg-[#EEF4F0] text-[#5F8D75] px-2 py-0.2 rounded-full font-bold">
                {notes.length} โน้ต
              </span>
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF8F5] hover:bg-[#EEF4F0] text-[#5F8D75] border border-[#5F8D75]/30 text-[10px] font-black shadow-2xs cursor-pointer active:scale-95 transition-all"
        >
          <Plus size={12} weight="bold" />
          <span>+ แปะโน้ตใหม่</span>
        </button>
      </div>

      {/* Sticky Notes Horizontal Carousel */}
      <div className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar py-1 px-0.5">
        {notes.map((note) => renderNoteCard(note, true))}

        {notes.length === 0 && (
          <div className="w-full py-4 text-center text-xs text-[#9E958D] bg-[#FAF8F5] rounded-2xl border border-dashed border-[#ECE7DF]">
            ยังไม่มีโน้ตแปะบนตู้เย็น แตะ "+ แปะโน้ตใหม่" เพื่อบอกคนในบ้านได้เลย 📌
          </div>
        )}
      </div>

      {/* Create Sticky Note Modal */}
      {renderCreateModal()}
    </section>
  );
}
