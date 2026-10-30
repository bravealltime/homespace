import { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Broom,
  PencilSimple,
  CircleNotch,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import { compressImage } from '../utils/imageCompressor';

// 5 Common Household Chores + 1 Custom Option (Production - Clean without mock images)
const CHORE_OPTIONS = [
  {
    id: 'dishes',
    name: 'ล้างจานชาม',
    emoji: '🧽',
    quickCaptions: [
      'ล้างจานชามสะอาดเงาวับแล้วครับ ✨',
      'ช่วยพ่อแม่ล้างจานมื้อนี้เรียบร้อย 🍽️',
      'ซิงค์สะอาดวิ้ง คว่ำจานเรียบร้อยแล้ว',
    ],
  },
  {
    id: 'clean',
    name: 'กวาดถูบ้าน',
    emoji: '🧹',
    quickCaptions: [
      'กวาดถูพื้นเรียบร้อย พื้นเงาวับเดินสบายเท้า ✨',
      'เก็บกวาดห้องนั่งเล่นสะอาดเอี่ยมแล้วครับ',
      'บ้านสะอาด อากาศสดชื่นขึ้นเยอะ 🌿',
    ],
  },
  {
    id: 'laundry',
    name: 'ซักผ้า-พับผ้า',
    emoji: '🧺',
    quickCaptions: [
      'ซักผ้าและพับเก็บเข้าตู้เรียบร้อย หอมสดชื่น 🌸',
      'ตากผ้าเสร็จแล้ว รับแดดดีมาก ☀️',
      'ช่วยพับผ้าของทุกคนในบ้านเข้าที่แล้วครับ',
    ],
  },
  {
    id: 'bed',
    name: 'จัดห้องนอน',
    emoji: '🛏️',
    quickCaptions: [
      'จัดเตียงพับผ้าห่มเรียบร้อย น่านอนสุดๆ 😴',
      'เก็บโต๊ะทำงานและห้องนอนเรียบร้อยแล้วครับ',
      'ห้องสะอาด สบายตาพร้อมพักผ่อน ✨',
    ],
  },
  {
    id: 'trash',
    name: 'ทิ้งขยะ',
    emoji: '🗑️',
    quickCaptions: [
      'มัดถุงขยะไปทิ้งหน้าบ้านเรียบร้อยครับ 🚮',
      'เปลี่ยนถุงขยะใหม่ทุกห้องในบ้านแล้ว',
      'เคลียร์ขยะในครัว สะอาดไร้กลิ่นรบกวน ✨',
    ],
  },
];

export default function CreatePostModal({ isOpen, onClose, initialMode = 'routine', initialChoreId = 'dishes' }) {
  const { currentUser } = useAuth();
  const { addRoutineEntry, addChoreEntry } = useApp();

  // Mode: 'routine' (แชร์กิจกรรมทั่วไป) | 'chore' (ส่งงานบ้าน)
  const [mode, setMode] = useState(initialMode);

  // Selected chore state (used ONLY when mode === 'chore')
  const [selectedChoreId, setSelectedChoreId] = useState(initialChoreId || 'dishes');
  const [isCustomChore, setIsCustomChore] = useState(false);
  const [customChoreName, setCustomChoreName] = useState('');

  // Caption text (fully editable by user)
  const [caption, setCaption] = useState('');

  // Photos (user-uploaded only)
  const [singlePhoto, setSinglePhoto] = useState(null);
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);

  const [compressing, setCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const singleInputRef = useRef(null);
  const beforeInputRef = useRef(null);
  const afterInputRef = useRef(null);

  // Current active chore
  const currentChore = CHORE_OPTIONS.find((c) => c.id === selectedChoreId);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'routine');
      setSelectedChoreId(initialChoreId || 'dishes');
      setIsCustomChore(false);
      setCustomChoreName('');
      setCaption('');
      setSinglePhoto(null);
      setBeforeImage(null);
      setAfterImage(null);
      setIsSubmitting(false);
      setCompressing(false);
    }
  }, [isOpen, initialMode, initialChoreId]);

  // Upload Handlers with Automatic Client-Side Compression
  const handleSingleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setCompressing(true);
        const compressed = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.82 });
        setSinglePhoto(compressed);
      } catch (err) {
        console.warn('Compress single photo warning:', err);
      } finally {
        setCompressing(false);
      }
    }
  };

  const handleBeforeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setCompressing(true);
        const compressed = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.82 });
        setBeforeImage(compressed);
      } catch (err) {
        console.warn('Compress before image warning:', err);
      } finally {
        setCompressing(false);
      }
    }
  };

  const handleAfterUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setCompressing(true);
        const compressed = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.82 });
        setAfterImage(compressed);
      } catch (err) {
        console.warn('Compress after image warning:', err);
      } finally {
        setCompressing(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const memberId = currentUser?.id || 'member-fluke';

    try {
      if (mode === 'chore') {
        const choreName = isCustomChore
          ? customChoreName.trim() || 'งานบ้าน'
          : currentChore?.name || 'ล้างจานชาม';

        const choreEmoji = isCustomChore ? '🧹' : currentChore?.emoji || '🧽';

        const finalCaption =
          caption.trim() || `${choreName} เสร็จเรียบร้อยแล้วครับ สะอาดน่าอยู่ ✨`;

        // Upload images directly to Supabase Storage if attached
        let finalBefore = null;
        let finalAfter = null;

        if (beforeImage) {
          try {
            const res = await api.uploadBase64Image(beforeImage, 'chore-before');
            finalBefore = res?.url || beforeImage;
          } catch {
            finalBefore = beforeImage;
          }
        }

        if (afterImage) {
          try {
            const res = await api.uploadBase64Image(afterImage, 'chore-after');
            finalAfter = res?.url || afterImage;
          } catch {
            finalAfter = afterImage;
          }
        }

        await addChoreEntry({
          memberId,
          choreName,
          choreEmoji,
          points: 25,
          praise: 'สะอาดเรียบร้อยดีมาก! ✨',
          praiseEmoji: '✨',
          beforeImage: finalBefore,
          afterImage: finalAfter,
          imageUrl: finalAfter || finalBefore || null,
          caption: finalCaption,
        });
      } else {
        // General Lifestyle / Routine Story
        const finalCaption = caption.trim() || 'แชร์เรื่องราวดี ๆ ร่วมกับทุกคนในบ้าน 💖';

        let finalPhoto = null;
        if (singlePhoto) {
          try {
            const res = await api.uploadBase64Image(singlePhoto, 'routine');
            finalPhoto = res?.url || singlePhoto;
          } catch {
            finalPhoto = singlePhoto;
          }
        }

        await addRoutineEntry({
          memberId,
          caption: finalCaption,
          photo: finalPhoto,
          category: 'เรื่องราววันนี้',
          points: 25,
          exp: 150,
        });
      }

      onClose();
    } catch (err) {
      console.error('Submit post error:', err);
      alert('เกิดข้อผิดพลาดในการโพสต์ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl border border-[#ECE7DF] shadow-2xl w-full max-w-md max-h-[90dvh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden animate-enter-rise text-[#2D2825] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 px-4 py-3 border-b border-[#ECE7DF] flex items-center justify-between">
          <h2 className="text-sm font-black text-[#2D2825]">สร้างโพสต์ใหม่</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#FAF8F5] hover:bg-[#ECE7DF] text-[#746C65] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {/* Author Profile */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#FAF8F5] flex items-center justify-center text-lg overflow-hidden border border-[#ECE7DF]">
              {currentUser?.avatarType === 'image' && currentUser?.avatarImage ? (
                <img src={currentUser.avatarImage} alt="" className="w-full h-full object-cover" />
              ) : (
                currentUser?.avatar || '😊'
              )}
            </div>
            <div>
              <p className="text-xs font-black text-[#2D2825] leading-tight">
                {currentUser?.name || 'คุณ'}
              </p>
              <p className="text-[10px] text-[#746C65]">แชร์ให้คนในครอบครัวดู</p>
            </div>
          </div>

          {/* Mode Switcher (แชร์กิจกรรมทั่วไป vs ส่งงานบ้าน) */}
          <div className="grid grid-cols-2 p-1 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('routine')}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'routine'
                  ? 'bg-white text-[#2D2825] shadow-xs font-black'
                  : 'text-[#746C65] hover:text-[#2D2825]'
              }`}
            >
              <Camera size={15} weight="bold" />
              <span>แชร์กิจกรรมทั่วไป</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('chore')}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'chore'
                  ? 'bg-[#5F8D75] text-white shadow-xs font-black'
                  : 'text-[#746C65] hover:text-[#2D2825]'
              }`}
            >
              <Broom size={15} weight="bold" />
              <span>ส่งงานบ้าน</span>
            </button>
          </div>

          {/* CHORE SELECTOR: ONLY SHOWN WHEN MODE IS 'CHORE' */}
          {mode === 'chore' && (
            <div className="space-y-2 pt-0.5">
              <label className="text-[11px] font-bold text-[#746C65] flex items-center justify-between">
                <span>เลือกงานบ้านที่ทำ:</span>
                <span className="text-[10px] text-[#5F8D75] font-semibold">แตะเลือกได้ทันที</span>
              </label>

              {/* 3x2 Grid */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {CHORE_OPTIONS.map((chore) => {
                  const isSelected = selectedChoreId === chore.id && !isCustomChore;
                  return (
                    <button
                      key={chore.id}
                      type="button"
                      onClick={() => {
                        setSelectedChoreId(chore.id);
                        setIsCustomChore(false);
                      }}
                      className={`py-2 sm:py-2.5 px-1 sm:px-2 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#5F8D75] text-white border-[#5F8D75] shadow-xs scale-102 font-black'
                          : 'bg-[#FAF8F5] text-[#2D2825] border-[#ECE7DF] hover:bg-white hover:border-[#5F8D75]/40 font-bold'
                      }`}
                    >
                      <span className="text-xl sm:text-2xl">{chore.emoji}</span>
                      <span className="text-[10px] sm:text-[11px] leading-tight text-center font-bold break-words">{chore.name}</span>
                    </button>
                  );
                })}

                {/* 6th Option: พิมพ์เอง */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomChore(true);
                  }}
                  className={`py-2 sm:py-2.5 px-1 sm:px-2 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                    isCustomChore
                      ? 'bg-[#E88D67] text-white border-[#E88D67] shadow-xs scale-102 font-black'
                      : 'bg-[#FAF8F5] text-[#2D2825] border-[#ECE7DF] hover:bg-white font-bold'
                  }`}
                >
                  <PencilSimple size={20} weight="bold" />
                  <span className="text-[10px] sm:text-[11px] leading-tight text-center font-bold">พิมพ์เอง...</span>
                </button>
              </div>

              {/* Custom Chore Input Field */}
              {isCustomChore && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={customChoreName}
                    onChange={(e) => setCustomChoreName(e.target.value)}
                    placeholder="พิมพ์ชื่องานบ้าน เช่น ขัดห้องน้ำ, ล้างรถ, เช็ดกระจก..."
                    className="w-full px-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#E88D67] text-xs text-[#2D2825] placeholder:text-[#9E958D] focus:outline-none focus:bg-white"
                    autoFocus
                  />
                </div>
              )}

              {/* Quick Caption Suggestions for selected chore */}
              {!isCustomChore && currentChore?.quickCaptions && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-[#746C65] font-semibold block">
                    แตะใส่ข้อความด่วน:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {currentChore.quickCaptions.map((phrase, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCaption(phrase)}
                        className="text-[10px] text-[#5F8D75] bg-[#EEF4F0] hover:bg-[#E2EFE6] px-2 py-0.5 rounded-lg border border-[#5F8D75]/20 transition-colors text-left"
                      >
                        "{phrase}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Caption Textarea (พิมพ์ข้อความอิสระ) */}
          <div className="space-y-1">
            <textarea
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={
                mode === 'chore'
                  ? 'เล่าเรื่องงานบ้าน เช่น ล้างสะอาดหมดจด พร้อมใช้งานแล้วครับ 😊'
                  : 'วันนี้ทำอะไรมาบ้าง? เขียนเล่าให้คนในบ้านฟัง...'
              }
              className="w-full p-2.5 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-xs text-[#2D2825] placeholder:text-[#9E958D] focus:outline-none focus:border-[#5F8D75] focus:bg-white resize-none leading-relaxed"
            />
          </div>

          {/* Photos Upload Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#746C65]">
                {mode === 'chore' ? 'รูปถ่ายผลงาน (ก่อนทำ & หลังทำ):' : 'รูปภาพประกอบ:'}
              </label>
              <span className="text-[10px] text-[#5F8D75] font-semibold">
                บันทึกลง Supabase Storage ☁️
              </span>
            </div>

            {mode === 'routine' ? (
              /* Single Photo Box (General Post) */
              <div>
                <div
                  onClick={() => singleInputRef.current?.click()}
                  className="relative h-38 sm:h-44 rounded-2xl border-2 border-dashed border-[#ECE7DF] hover:border-[#5F8D75] bg-[#FAF8F5] cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all p-2 text-center group"
                >
                  {singlePhoto ? (
                    <div className="relative w-full h-full">
                      <img
                        src={singlePhoto}
                        alt="รูปกิจกรรม"
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSinglePhoto(null);
                        }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black cursor-pointer"
                      >
                        ✕
                      </button>
                      <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-md font-bold">
                        แตะเพื่อเปลี่ยนรูป
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {compressing ? (
                        <CircleNotch size={28} className="mx-auto text-[#5F8D75] animate-spin" />
                      ) : (
                        <Camera size={28} className="mx-auto text-[#746C65] group-hover:scale-110 transition-transform" />
                      )}
                      <p className="text-xs font-bold text-[#2D2825]">แตะถ่ายรูป หรือเลือกรูปจากเครื่อง</p>
                      <p className="text-[10px] text-[#9E958D]">รองรับทั้งรูปกล้องและแกลเลอรี</p>
                    </div>
                  )}
                </div>
                <input
                  ref={singleInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSingleUpload}
                  className="hidden"
                />
              </div>
            ) : (
              /* Before & After Dual Boxes (Chore Mode) */
              <div className="grid grid-cols-2 gap-2">
                {/* Before Photo */}
                <div>
                  <div
                    onClick={() => beforeInputRef.current?.click()}
                    className="relative aspect-4/3 rounded-2xl border-2 border-dashed border-[#ECE7DF] hover:border-red-400 bg-[#FAF8F5] cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all p-1.5 text-center group"
                  >
                    {beforeImage ? (
                      <div className="relative w-full h-full">
                        <img
                          src={beforeImage}
                          alt="ก่อนทำ"
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBeforeImage(null);
                          }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px] cursor-pointer"
                        >
                          ✕
                        </button>
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                          ก่อนทำ
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <Camera size={20} className="mx-auto text-red-400" />
                        <p className="text-[10px] font-bold text-[#2D2825]">1. รูปก่อนทำ</p>
                        <p className="text-[9px] text-[#9E958D]">(ไม่ใส่ก็ได้)</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={beforeInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBeforeUpload}
                    className="hidden"
                  />
                </div>

                {/* After Photo */}
                <div>
                  <div
                    onClick={() => afterInputRef.current?.click()}
                    className="relative aspect-4/3 rounded-2xl border-2 border-dashed border-[#5F8D75]/40 hover:border-[#5F8D75] bg-[#EEF4F0]/30 cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all p-1.5 text-center group"
                  >
                    {afterImage ? (
                      <div className="relative w-full h-full">
                        <img
                          src={afterImage}
                          alt="หลังทำ"
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAfterImage(null);
                          }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px] cursor-pointer"
                        >
                          ✕
                        </button>
                        <span className="absolute bottom-1 left-1 bg-[#5F8D75] text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                          หลังทำ ✨
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <Camera size={20} className="mx-auto text-[#5F8D75]" />
                        <p className="text-[10px] font-bold text-[#2D2825]">2. รูปหลังทำ ✨</p>
                        <p className="text-[9px] text-[#5F8D75] font-semibold">(แนะนำเพื่อโชว์ผลงาน)</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={afterInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAfterUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Points Bonus Badge */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-[#EEF4F0] border border-[#5F8D75]/20 text-xs">
            <span className="font-bold text-[#5F8D75] flex items-center gap-1.5 text-[11px]">
              <span>🍯</span>
              <span>โพสต์นี้สะสมแต้มเข้าโหลของบ้านทันที</span>
            </span>
            <span className="font-black text-[#5F8D75] bg-white px-2 py-0.5 rounded-md text-[11px] shadow-2xs">
              +25 แต้ม
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || compressing}
            className="w-full py-3 bg-[#5F8D75] hover:bg-[#476E5B] active:scale-98 disabled:opacity-50 text-white text-xs font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <CircleNotch size={16} className="animate-spin" />
                <span>กำลังอัปโหลดรูปภาพไปยัง Supabase... ☁️</span>
              </>
            ) : (
              <span>{mode === 'chore' ? 'ส่งงานบ้านให้ครอบครัวดูเลย ✨' : 'แชร์เรื่องราวให้ครอบครัวดูเลย 💖'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
