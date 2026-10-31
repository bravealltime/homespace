import { useState } from 'react';
import {
  PushPin,
  Plus,
  Trash,
  Check,
  SpeakerHigh,
  X,
  Smiley,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { speakThai, stopSpeaking } from '../utils/speechHelper';

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

export default function DigitalFridgeBoard() {
  const { notes, addNote, toggleNoteAck, deleteNote, members } = useApp();
  const { currentUser, isAdmin } = useAuth();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState('yellow');
  const [speakingNoteId, setSpeakingNoteId] = useState(null);

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
        {notes.map((note) => {
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
              className={`w-52 sm:w-56 shrink-0 rounded-2xl p-3 border shadow-xs flex flex-col justify-between transition-all relative ${colorStyle.bg} ${colorStyle.border}`}
            >
              {/* Pushpin / Magnet Icon */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <PushPin size={15} weight="fill" className={colorStyle.pin} />
                  <span className="text-[10px] font-bold text-[#2D2825] truncate">
                    {author?.name || 'สมาชิก'}
                  </span>
                  <span className="text-[9px] text-[#746C65]">
                    · {timeAgo(note.timestamp)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Speech button for seniors */}
                  <button
                    type="button"
                    onClick={() => handleSpeakNote(note.id, `${author?.name || 'สมาชิก'} แปะโน้ตว่า ${note.text}`)}
                    className={`p-1 rounded-full text-[#746C65] hover:text-[#2D2825] transition-colors cursor-pointer ${
                      speakingNoteId === note.id ? 'text-[#5F8D75] animate-pulse' : ''
                    }`}
                    title="ฟังเสียงอ่านโน้ตนี้"
                  >
                    <SpeakerHigh size={13} weight={speakingNoteId === note.id ? 'fill' : 'regular'} />
                  </button>

                  {/* Delete button */}
                  {isOwnerOrAdmin && (
                    <button
                      type="button"
                      onClick={() => deleteNote(note.id)}
                      className="p-1 rounded-full text-[#9E958D] hover:text-red-500 transition-colors cursor-pointer"
                      title="เอาโน้ตนี้ออก"
                    >
                      <Trash size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Note Content */}
              <p className="text-xs font-semibold text-[#2D2825] leading-relaxed my-1.5 break-words">
                {note.text}
              </p>

              {/* Bottom Acknowledgment Action */}
              <div className="pt-2 border-t border-black/10 flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => toggleNoteAck(note.id)}
                  className={`px-2 py-1 rounded-full text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                    isAckedByMe
                      ? 'bg-[#5F8D75] text-white shadow-2xs'
                      : 'bg-white/80 hover:bg-white text-[#2D2825] border border-black/10'
                  }`}
                >
                  <Check size={11} weight="bold" />
                  <span>{isAckedByMe ? 'รับทราบแล้ว 👍' : 'แตะรับทราบ'}</span>
                </button>

                {acks.length > 0 && (
                  <span className="text-[9px] text-[#746C65] font-bold truncate">
                    เห็นแล้ว {acks.length} คน
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {notes.length === 0 && (
          <div className="w-full py-4 text-center text-xs text-[#9E958D] bg-[#FAF8F5] rounded-2xl border border-dashed border-[#ECE7DF]">
            ยังไม่มีโน้ตแปะบนตู้เย็น แตะ "+ แปะโน้ตใหม่" เพื่อบอกคนในบ้านได้เลย 📌
          </div>
        )}
      </div>

      {/* Create Sticky Note Modal */}
      {isCreateOpen && (
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
                className="w-7 h-7 rounded-full bg-[#FAF8F5] hover:bg-[#ECE7DF] flex items-center justify-center text-xs cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="p-4 space-y-3.5">
              {/* Color Chooser */}
              <div>
                <label className="block text-[11px] font-bold text-[#746C65] mb-1.5">
                  เลือกสีกระดาษโน้ต:
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'yellow', label: 'เหลือง', bg: 'bg-[#FEF08A]' },
                    { id: 'pink', label: 'ชมพู', bg: 'bg-[#FBCFE8]' },
                    { id: 'green', label: 'เขียว', bg: 'bg-[#BBF7D0]' },
                    { id: 'blue', label: 'ฟ้า', bg: 'bg-[#BAE6FD]' },
                    { id: 'peach', label: 'พีช', bg: 'bg-[#FED7AA]' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNoteColor(c.id)}
                      className={`w-7 h-7 rounded-full ${c.bg} transition-all cursor-pointer flex items-center justify-center border ${
                        noteColor === c.id
                          ? 'border-[#2D2825] ring-2 ring-[#5F8D75] scale-110 shadow-xs'
                          : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      title={c.label}
                    >
                      {noteColor === c.id && <Check size={13} weight="bold" className="text-[#2D2825]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div>
                <label className="block text-[11px] font-bold text-[#746C65] mb-1.5">
                  ข้อความโน้ต:
                </label>
                <textarea
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="เช่น กับข้าวอยู่ในตู้เย็นนะ, พรุ่งนี้ช่างแอร์มาบ่ายสอง..."
                  className={`w-full p-3 rounded-2xl border text-xs font-semibold text-[#2D2825] focus:outline-none resize-none leading-relaxed shadow-inner ${
                    COLOR_MAP[noteColor]?.bg || 'bg-[#FEF9C3]'
                  } ${COLOR_MAP[noteColor]?.border || 'border-[#FDE047]'}`}
                  autoFocus
                />
              </div>

              {/* Quick Preset Phrases */}
              <div>
                <span className="text-[10px] text-[#746C65] font-semibold block mb-1">
                  แตะข้อความด่วน:
                </span>
                <div className="flex flex-wrap gap-1">
                  {QUICK_NOTES.map((phrase, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNoteText(phrase)}
                      className="text-[10px] text-[#5F8D75] bg-[#EEF4F0] hover:bg-[#DFEDE3] px-2 py-0.5 rounded-lg border border-[#5F8D75]/20 text-left cursor-pointer transition-colors"
                    >
                      "{phrase}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!noteText.trim()}
                className="w-full py-3 bg-[#5F8D75] hover:bg-[#476E5B] disabled:opacity-40 text-white text-xs font-black rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <PushPin size={15} weight="fill" />
                <span>แปะโน้ตบนตู้เย็นเลย ✨</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
