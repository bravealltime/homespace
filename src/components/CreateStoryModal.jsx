import { useState, useRef } from 'react';
import {
  X,
  Camera,
  Image as ImageIcon,
  Sparkle,
  PaintBrush,
  TextT,
  Check,
  Trash,
  CircleNotch,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import { compressImage } from '../utils/imageCompressor';

// Aesthetic preset gradients for text/color stories
const GRADIENTS = [
  { id: 'sunset', name: 'Sunset Glow', class: 'from-[#FF6B6B] via-[#FF8E53] to-[#FFE66D]' },
  { id: 'matcha', name: 'Matcha Forest', class: 'from-[#5F8D75] via-[#4E7D63] to-[#88D49E]' },
  { id: 'berry', name: 'Berry Pop', class: 'from-[#E88D67] via-[#D84A75] to-[#F15BB5]' },
  { id: 'midnight', name: 'Midnight Violet', class: 'from-[#2B5876] via-[#3B4371] to-[#4E4376]' },
  { id: 'caramel', name: 'Warm Caramel', class: 'from-[#8A5A36] via-[#B87A4C] to-[#E2A76F]' },
  { id: 'dark', name: 'Clean Slate', class: 'from-[#23201D] via-[#36302B] to-[#4A423B]' },
];

// Quick fun stickers
const STICKERS = ['✨', '💖', '🏡', '☕', '🌸', '🍳', '🔥', '🐱', '🐶', '🍕', '⭐', '🌿', '🥳', '💤'];

export default function CreateStoryModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { addStory } = useApp();

  const [mode, setMode] = useState('photo'); // 'photo' | 'gradient'
  const [photo, setPhoto] = useState(null);
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0]);
  const [caption, setCaption] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textBadge, setTextBadge] = useState(true);
  const [selectedStickers, setSelectedStickers] = useState(['✨']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setCompressing(true);
        const compressed = await compressImage(file, { maxWidth: 1080, maxHeight: 1920, quality: 0.82 });
        setPhoto(compressed);
      } catch (err) {
        console.warn('Compress story photo warning:', err);
      } finally {
        setCompressing(false);
      }
    }
  };

  const toggleSticker = (emoji) => {
    if (selectedStickers.includes(emoji)) {
      setSelectedStickers(selectedStickers.filter((s) => s !== emoji));
    } else {
      if (selectedStickers.length >= 4) {
        alert('เลือกสติกเกอร์ได้สูงสุด 4 ตัวครับ');
        return;
      }
      setSelectedStickers([...selectedStickers, emoji]);
    }
  };

  const handleSubmit = async () => {
    if (mode === 'photo' && !photo && !caption.trim()) {
      alert('กรุณาเลือกรูปภาพหรือพิมพ์ข้อความสำหรับสตอรี่');
      return;
    }
    if (mode === 'gradient' && !caption.trim()) {
      alert('กรุณาพิมพ์ข้อความสำหรับสตอรี่การ์ด');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalPhoto = null;
      if (mode === 'photo' && photo) {
        try {
          const res = await api.uploadBase64Image(photo, 'story');
          finalPhoto = res?.url || photo;
        } catch {
          finalPhoto = photo;
        }
      }

      await addStory({
        memberId: currentUser?.id,
        photo: mode === 'photo' ? finalPhoto : null,
        caption: caption.trim(),
        bgGradient: selectedGradient.class,
        textColor,
        stickers: selectedStickers.join(','),
      });

      // Reset
      setCaption('');
      setPhoto(null);
      setSelectedStickers(['✨']);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Failed to create story:', err);
      setIsSubmitting(false);
      alert('เกิดข้อผิดพลาดในการลงสตอรี่ กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm select-none animate-enter-rise"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl border border-[#ECE7DF] shadow-2xl w-full max-w-md max-h-[92dvh] overflow-hidden flex flex-col text-[#2D2825]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#ECE7DF] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#E88D67] via-[#F15BB5] to-[#7BA7C2] text-white flex items-center justify-center text-lg shadow-2xs">
              <Sparkle size={20} weight="fill" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#2D2825] flex items-center gap-1.5">
                <span>ลงไฮไลท์สตอรี่ (แบบ IG)</span>
                <span className="text-[10px] bg-[#EEF4F0] text-[#5F8D75] px-2 py-0.5 rounded-full font-bold">
                  แยกกับโพสต์ฟีด
                </span>
              </h3>
              <p className="text-[10px] text-[#746C65]">
                จะปรากฏที่วงกลมสตอรี่ด้านบน ไม่ปนกับโพสต์งานบ้าน
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF8F5] hover:bg-[#ECE7DF] text-[#746C65] flex items-center justify-center text-sm cursor-pointer transition-colors"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar [scrollbar-width:none]">
          {/* Mode Switcher */}
          <div className="flex p-1 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('photo')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'photo'
                  ? 'bg-white text-[#2D2825] shadow-xs'
                  : 'text-[#746C65] hover:text-[#2D2825]'
              }`}
            >
              <Camera size={16} weight="bold" />
              <span>โหมดรูปภาพ (Photo)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('gradient')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'gradient'
                  ? 'bg-white text-[#2D2825] shadow-xs'
                  : 'text-[#746C65] hover:text-[#2D2825]'
              }`}
            >
              <PaintBrush size={16} weight="bold" />
              <span>โหมดสีการ์ด (Create)</span>
            </button>
          </div>

          {/* Live IG Story Preview */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-[#746C65] block">
              ตัวอย่างหน้าตาไฮไลท์สตอรี่ของคุณ:
            </span>
            <div className="relative mx-auto w-full max-w-[260px] h-[360px] rounded-3xl overflow-hidden shadow-lg border border-[#ECE7DF] bg-[#23201D] flex flex-col justify-between p-3.5 select-none transition-all">
              {/* Background */}
              {mode === 'photo' ? (
                photo ? (
                  <img
                    src={photo}
                    alt="Story Preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-[#FAF8F5] text-[#746C65] cursor-pointer hover:bg-[#F5F1EB] transition-colors p-4 text-center border-2 border-dashed border-[#ECE7DF]"
                  >
                    <div className="w-12 h-12 rounded-full bg-white shadow-xs flex items-center justify-center text-2xl mb-2 text-[#E88D67]">
                      <Camera size={24} weight="bold" />
                    </div>
                    <span className="text-xs font-bold text-[#2D2825]">แตะเพื่อเลือกรูปภาพ</span>
                    <span className="text-[10px] text-[#9E958D] mt-0.5">จากมือถือหรือคอมพิวเตอร์</span>
                  </div>
                )
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${selectedGradient.class}`} />
              )}

              {/* Dark subtle overlay on photo for readability */}
              {mode === 'photo' && photo && (
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
              )}

              {/* Top Story Header in Preview */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-white">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs overflow-hidden">
                    {currentUser?.avatarType === 'image' && currentUser?.avatarImage ? (
                      <img src={currentUser.avatarImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      currentUser?.avatar || '😊'
                    )}
                  </div>
                  <span className="text-[11px] font-bold leading-none">{currentUser?.name || 'คุณ'}</span>
                  <span className="text-[9px] text-white/70 leading-none">เมื่อสักครู่</span>
                </div>
              </div>

              {/* Center Story Content & Stickers */}
              <div className="relative z-10 my-auto text-center px-2">
                {caption && (
                  <div
                    className={`inline-block max-w-[230px] rounded-2xl px-3 py-2 text-xs font-bold leading-relaxed shadow-sm transition-all ${
                      textBadge ? 'bg-black/60 backdrop-blur-md text-white' : ''
                    }`}
                    style={{ color: textBadge ? '#ffffff' : textColor }}
                  >
                    {caption}
                  </div>
                )}

                {/* Stickers Display */}
                {selectedStickers.length > 0 && (
                  <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
                    {selectedStickers.map((stk, i) => (
                      <span key={i} className="text-2xl drop-shadow-md animate-bounce-short">
                        {stk}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom IG Pill in Preview */}
              <div className="relative z-10 flex items-center justify-between text-white/80 text-[10px] bg-black/30 backdrop-blur-xs px-3 py-1.5 rounded-full">
                <span>ส่งข้อความ...</span>
                <span>❤️ 🔥</span>
              </div>
            </div>
          </div>

          {/* Photo Mode Controls */}
          {mode === 'photo' && (
            <div className="space-y-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2.5 px-3 bg-[#FAF8F5] hover:bg-[#F2ECE4] border border-[#ECE7DF] rounded-2xl text-xs font-bold text-[#2D2825] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera size={16} weight="bold" className="text-[#5F8D75]" />
                  <span>{photo ? 'เปลี่ยนรูปภาพ' : 'เลือกรูปภาพจากเครื่อง'}</span>
                </button>

                {photo && (
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="p-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-2xl border border-red-200 transition-colors cursor-pointer"
                    title="ลบรูปภาพ"
                  >
                    <Trash size={16} weight="bold" />
                  </button>
                )}
              </div>

              {/* Supabase Storage Notice */}
              <div className="p-2.5 rounded-2xl bg-[#EEF4F0] border border-[#5F8D75]/20 flex items-center justify-between text-[11px] text-[#5F8D75] font-semibold">
                <span className="flex items-center gap-1.5">
                  <span>☁️</span>
                  <span>บันทึกรูปลง Supabase Storage คมชัด โหลดเร็ว</span>
                </span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-md font-bold shadow-2xs">
                  ระบบคลาวด์
                </span>
              </div>
            </div>
          )}

          {/* Gradient Mode Controls */}
          {mode === 'gradient' && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#746C65] block">
                เลือกโทนสีการ์ดสตอรี่:
              </span>
              <div className="grid grid-cols-6 gap-2">
                {GRADIENTS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGradient(g)}
                    className={`h-10 rounded-xl bg-gradient-to-br ${g.class} border-2 transition-all cursor-pointer flex items-center justify-center text-white ${
                      selectedGradient.id === g.id ? 'border-[#2D2825] scale-105 shadow-xs' : 'border-transparent opacity-80'
                    }`}
                    title={g.name}
                  >
                    {selectedGradient.id === g.id && <Check size={14} weight="bold" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Caption Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="story-caption" className="text-xs font-bold text-[#2D2825] flex items-center gap-1">
                <TextT size={14} weight="bold" className="text-[#E88D67]" />
                <span>ข้อความบนสตอรี่</span>
              </label>
              <button
                type="button"
                onClick={() => setTextBadge(!textBadge)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                  textBadge
                    ? 'bg-[#2D2825] text-white border-[#2D2825]'
                    : 'bg-[#FAF8F5] text-[#746C65] border-[#ECE7DF]'
                }`}
              >
                {textBadge ? 'มีกรอบทึบ' : 'ไม่มีกรอบ'}
              </button>
            </div>
            <textarea
              id="story-caption"
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="พิมพ์ข้อความสตอรี่ ความรู้สึก หรือคำทักทายวันนี้..."
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-xs font-semibold text-[#2D2825] focus:outline-none focus:ring-2 focus:ring-[#5F8D75] resize-none"
            />
          </div>

          {/* Stickers Selector */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[#746C65] block">
              แตะเพื่อแปะสติกเกอร์อีโมจิ (สูงสุด 4 ตัว):
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {STICKERS.map((stk) => {
                const isSelected = selectedStickers.includes(stk);
                return (
                  <button
                    key={stk}
                    type="button"
                    onClick={() => toggleSticker(stk)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EEF4F0] border-[#5F8D75] scale-110 shadow-2xs'
                        : 'bg-[#FAF8F5] border-[#ECE7DF] hover:bg-white'
                    }`}
                  >
                    {stk}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#ECE7DF] bg-[#FAF8F5] flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-[#ECE7DF] bg-white hover:bg-[#F2ECE4] text-xs font-bold text-[#746C65] transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (mode === 'photo' && !photo && !caption.trim()) || (mode === 'gradient' && !caption.trim())}
            className="flex-2 py-3 rounded-2xl bg-gradient-to-r from-[#E88D67] to-[#F15BB5] hover:opacity-95 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer active:scale-[0.98]"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkle size={16} weight="fill" />
                <span>แชร์ลงไฮไลท์สตอรี่ ✨</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
