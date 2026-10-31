import { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Broom,
  PencilSimple,
  CircleNotch,
  Plus,
  Images,
  Microphone,
  Sparkle,
  Heart,
  ChatCircleDots,
  Trash,
  Check,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import { compressImage } from '../utils/imageCompressor';
import { createThaiSpeechRecognition } from '../utils/speechHelper';

// Quick 1-Tap Greetings for Seniors & Family
const SENIOR_GREETINGS = [
  'สวัสดีตอนเช้า ขอให้มีความสุขนะจ๊ะ 🌸',
  'กินข้าวกันหรือยังลูก ดูแลสุขภาพด้วยนะ 🍲',
  'คิดถึงลูกหลานทุกคนในบ้านนะจ้ะ 💖',
  'วันนี้สบายดี สดชื่นแจ่มใสจ้า ☀️',
  'กินยาเรียบร้อยแล้ว ไม่ต้องเป็นห่วงนะ 💊',
  'วันนี้ออกกำลังกายแล้ว แข็งแรงดีจ้า 🏃',
];

// Photo Mode Quick Chips
const PHOTO_QUICK_CHIPS = [
  'อาหารมื้อนี้อร่อยมาก 🍲',
  'ดอกไม้หน้าบ้านสดชื่นจ้า 🌸',
  'คิดถึงทุกคนในบ้านนะ 💖',
  'วันนี้สบายดีจ้า ☀️',
];

// 5 Common Household Chores + 1 Custom Option
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

export default function CreatePostModal({
  isOpen,
  onClose,
  initialMode = 'photo',
  initialChoreId = 'dishes',
}) {
  const { currentUser } = useAuth();
  const { addRoutineEntry, addChoreEntry, seniorMode } = useApp();

  // Normalized Mode: 'photo' (ส่งรูปภาพ) | 'voice' (พูดทักทาย) | 'chore' (ส่งงานบ้าน)
  const normalizeMode = (m) => {
    if (m === 'routine') return 'photo';
    if (m === 'voice' || m === 'chore') return m;
    return 'photo';
  };

  const [mode, setMode] = useState(() => normalizeMode(initialMode));

  // Selected chore state (used ONLY when mode === 'chore')
  const [selectedChoreId, setSelectedChoreId] = useState(initialChoreId || 'dishes');
  const [isCustomChore, setIsCustomChore] = useState(false);
  const [customChoreName, setCustomChoreName] = useState('');

  // Caption text (fully editable by user)
  const [caption, setCaption] = useState('');

  // Photos (user-uploaded only - supports multiple photos)
  const [photos, setPhotos] = useState([]);
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);

  const [compressing, setCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const photosInputRef = useRef(null);
  const beforeInputRef = useRef(null);
  const afterInputRef = useRef(null);

  // Current active chore
  const currentChore = CHORE_OPTIONS.find((c) => c.id === selectedChoreId);

  // Voice-to-Text Recognition for Seniors
  const handleToggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    const recognition = createThaiSpeechRecognition({
      onResult: (transcript) => {
        setCaption((prev) => (prev ? `${prev} ${transcript}` : transcript));
      },
      onError: () => {
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (recognition) {
      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Start voice recognition failed:', err);
        setIsListening(false);
      }
    } else {
      alert('เบราว์เซอร์นี้ยังไม่รองรับการพูดด้วยเสียง สามารถพิมพ์หรือแตะเลือกคำทักทายด่วนแทนได้ครับ');
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMode(normalizeMode(initialMode));
      setSelectedChoreId(initialChoreId || 'dishes');
      setIsCustomChore(false);
      setCustomChoreName('');
      setCaption('');
      setPhotos([]);
      setBeforeImage(null);
      setAfterImage(null);
      setIsSubmitting(false);
      setCompressing(false);
    }
  }, [isOpen, initialMode, initialChoreId]);

  // Upload Handlers with Automatic Client-Side Compression
  const handlePhotosUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      try {
        setCompressing(true);
        const compressedList = await Promise.all(
          files.map((file) =>
            compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.82 })
          )
        );
        setPhotos((prev) => [...prev, ...compressedList].slice(0, 10)); // max 10 photos
      } catch (err) {
        console.warn('Compress photos warning:', err);
      } finally {
        setCompressing(false);
        if (photosInputRef.current) photosInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
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

    // Validation for photo mode: if no photos and no text
    if (mode === 'photo' && photos.length === 0 && !caption.trim()) {
      alert('กรุณาแตะเลือกรูปภาพ หรือพิมพ์ข้อความสั้นๆ ก่อนส่งนะครับ 😊');
      return;
    }

    // Validation for voice mode: if no speech/text
    if (mode === 'voice' && !caption.trim()) {
      alert('กรุณาแตะปุ่มไมค์เพื่อพูด หรือแตะเลือกคำทักทายด่วนก่อนส่งนะครับ 😊');
      return;
    }

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
      } else if (mode === 'voice') {
        // Voice / Text Greeting Mode (No Photo Required)
        const finalCaption = caption.trim() || 'สวัสดีทุกคนในบ้าน ขอให้มีความสุขนะจ๊ะ 💖';

        await addRoutineEntry({
          memberId,
          caption: finalCaption,
          photo: null,
          photos: [],
          category: 'ทักทายครอบครัว',
          points: 25,
          exp: 150,
        });
      } else {
        // Photo Mode: Sharing photos + optional caption
        const finalCaption = caption.trim() || 'แชร์ภาพถ่ายกิจกรรมของบ้าน 📸';

        let uploadedPhotos = [];
        if (photos.length > 0) {
          uploadedPhotos = await Promise.all(
            photos.map(async (p, idx) => {
              try {
                const res = await api.uploadBase64Image(p, `routine-${idx}`);
                return res?.url || p;
              } catch {
                return p;
              }
            })
          );
        }

        await addRoutineEntry({
          memberId,
          caption: finalCaption,
          photo: uploadedPhotos[0] || null,
          photos: uploadedPhotos,
          category: 'ภาพถ่ายกิจกรรม',
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
        className="relative bg-white rounded-3xl border border-[#ECE7DF] shadow-2xl w-full max-w-md max-h-[92dvh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden animate-enter-rise text-[#2D2825] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dynamic Modal Header Based on Active Mode */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 px-4 py-3 border-b border-[#ECE7DF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">
              {mode === 'photo' && '📸'}
              {mode === 'voice' && '🎙️'}
              {mode === 'chore' && '🧹'}
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#2D2825] leading-tight">
                {mode === 'photo' && 'ส่งรูปภาพให้คนในบ้าน'}
                {mode === 'voice' && 'พูดทักทายลูกหลาน'}
                {mode === 'chore' && 'ส่งงานบ้านสะสมแต้ม'}
              </h2>
              <p className="text-[11px] text-[#746C65]">
                {mode === 'photo' && 'แตะถ่ายรูป หรือเลือกรูปจากมือถือได้เลยจ้า'}
                {mode === 'voice' && 'แตะไมค์แล้วพูด หรือแตะเลือกคำทักทายด่วน'}
                {mode === 'chore' && 'เลือกงานบ้านที่ทำ พร้อมรูปผลงานรับแต้มโหล 🍯'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF8F5] hover:bg-[#ECE7DF] text-[#746C65] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="ปิดหน้าต่าง"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Author Profile Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#FAF8F5] flex items-center justify-center text-lg overflow-hidden border border-[#ECE7DF]">
                {currentUser?.avatarType === 'image' && currentUser?.avatarImage ? (
                  <img src={currentUser.avatarImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.avatar || '😊'
                )}
              </div>
              <div>
                <p className="text-xs sm:text-sm font-black text-[#2D2825] leading-tight">
                  {currentUser?.name || 'คุณ'}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#746C65]">แชร์ให้ทุกคนในบ้านดู</p>
              </div>
            </div>

            <span className="text-[10px] sm:text-[11px] font-bold text-[#5F8D75] bg-[#EEF4F0] px-2.5 py-1 rounded-full border border-[#5F8D75]/20 flex items-center gap-1">
              <span>🍯</span>
              <span>+25 แต้ม</span>
            </span>
          </div>

          {/* 3 Dedicated Segmented Tabs (Uncluttered, Progressive Disclosure) */}
          <div className="grid grid-cols-3 p-1 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-xs font-bold gap-1">
            {/* Tab 1: ส่งรูปภาพ */}
            <button
              type="button"
              onClick={() => setMode('photo')}
              className={`py-2 px-1 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                mode === 'photo'
                  ? 'bg-[#5F8D75] text-white shadow-xs font-black'
                  : 'text-[#746C65] hover:text-[#2D2825] hover:bg-white/60'
              }`}
            >
              <Camera size={16} weight={mode === 'photo' ? 'fill' : 'bold'} />
              <span className="text-[11px] sm:text-xs">ส่งรูปภาพ</span>
            </button>

            {/* Tab 2: พูดทักทาย */}
            <button
              type="button"
              onClick={() => setMode('voice')}
              className={`py-2 px-1 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                mode === 'voice'
                  ? 'bg-[#E88D67] text-white shadow-xs font-black'
                  : 'text-[#746C65] hover:text-[#2D2825] hover:bg-white/60'
              }`}
            >
              <Microphone size={16} weight={mode === 'voice' ? 'fill' : 'bold'} />
              <span className="text-[11px] sm:text-xs">พูดทักทาย</span>
            </button>

            {/* Tab 3: ส่งงานบ้าน */}
            <button
              type="button"
              onClick={() => setMode('chore')}
              className={`py-2 px-1 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                mode === 'chore'
                  ? 'bg-[#2E7D32] text-white shadow-xs font-black'
                  : 'text-[#746C65] hover:text-[#2D2825] hover:bg-white/60'
              }`}
            >
              <Broom size={16} weight={mode === 'chore' ? 'fill' : 'bold'} />
              <span className="text-[11px] sm:text-xs">ส่งงานบ้าน</span>
            </button>
          </div>

          {/* =========================================================================
              VIEW 1: PHOTO MODE (ส่งรูปภาพ) - Focused 100% on photos & simple caption
             ========================================================================= */}
          {mode === 'photo' && (
            <div className="space-y-3.5">
              {/* Photo Upload Area */}
              <div>
                {photos.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#5F8D75] flex items-center gap-1.5">
                        <Images size={16} weight="bold" />
                        <span>เลือกแล้ว {photos.length} รูป (ใส่ได้สูงสุด 10 รูป)</span>
                      </span>
                      {photos.length < 10 && (
                        <button
                          type="button"
                          onClick={() => photosInputRef.current?.click()}
                          className="text-[#2563EB] hover:underline font-bold flex items-center gap-1 cursor-pointer text-xs"
                        >
                          <Plus size={14} weight="bold" />
                          <span>เพิ่มรูปอีก</span>
                        </button>
                      )}
                    </div>

                    {/* Thumbnail Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {photos.map((src, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-2xl overflow-hidden border border-[#ECE7DF] bg-black/5"
                        >
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-xs font-bold shadow-xs cursor-pointer"
                            title="ลบรูปนี้"
                          >
                            ✕
                          </button>
                          {idx === 0 && (
                            <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md backdrop-blur-2xs">
                              รูปหน้าปก
                            </span>
                          )}
                        </div>
                      ))}

                      {/* Add more button tile */}
                      {photos.length < 10 && (
                        <button
                          type="button"
                          onClick={() => photosInputRef.current?.click()}
                          className="aspect-square rounded-2xl border-2 border-dashed border-[#ECE7DF] hover:border-[#5F8D75] bg-[#FAF8F5] flex flex-col items-center justify-center gap-1 text-[#746C65] hover:text-[#5F8D75] transition-all cursor-pointer"
                        >
                          {compressing ? (
                            <CircleNotch size={22} className="text-[#5F8D75] animate-spin" />
                          ) : (
                            <Plus size={22} weight="bold" />
                          )}
                          <span className="text-[10px] font-bold">เพิ่มรูป</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Big Friendly Photo Picker Box */
                  <div
                    onClick={() => photosInputRef.current?.click()}
                    className="relative h-44 sm:h-48 rounded-2xl border-2 border-dashed border-[#5F8D75]/40 hover:border-[#5F8D75] bg-gradient-to-b from-[#FAF8F5] to-[#EEF4F0]/60 cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all p-4 text-center group shadow-2xs hover:shadow-xs active:scale-99"
                  >
                    <div className="space-y-2">
                      {compressing ? (
                        <CircleNotch size={36} className="mx-auto text-[#5F8D75] animate-spin" />
                      ) : (
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#5F8D75] text-white flex items-center justify-center group-hover:scale-108 transition-transform shadow-md">
                          <Camera size={32} weight="bold" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-black text-[#2D2825]">
                          แตะถ่ายรูป หรือเลือกรูปจากมือถือ 📸
                        </p>
                        <p className="text-[11px] text-[#746C65] mt-0.5">
                          ภาพกับข้าว ดอกไม้ ทริปครอบครัว หรือหลานๆ (ใส่ได้ 1-10 รูป)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <input
                  ref={photosInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotosUpload}
                  className="hidden"
                />
              </div>

              {/* Simple Caption Box with Microphone */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#746C65]">
                    เขียนข้อความบอกเล่า (ไม่ใส่ก็ได้จ้า):
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleVoiceInput}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-[#EEF4F0] text-[#5F8D75] hover:bg-[#E2EEE6]'
                    }`}
                  >
                    <Microphone size={14} weight={isListening ? 'fill' : 'bold'} />
                    <span>{isListening ? 'กำลังฟัง...' : 'พูดใส่ไมค์'}</span>
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="เช่น มื้อนี้ทำต้มยำกุ้งอร่อยมาก ทานข้าวด้วยกันนะ..."
                  className="w-full p-3 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-xs sm:text-sm text-[#2D2825] placeholder:text-[#9E958D] focus:outline-none focus:border-[#5F8D75] focus:bg-white resize-none leading-relaxed"
                />

                {/* 4 Quick Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {PHOTO_QUICK_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCaption(chip)}
                      className="text-[11px] font-medium text-[#5F8D75] bg-[#FAF8F5] hover:bg-[#EEF4F0] px-2.5 py-1 rounded-xl border border-[#ECE7DF] hover:border-[#5F8D75]/40 transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || compressing}
                className="w-full py-3.5 bg-[#5F8D75] hover:bg-[#476E5B] active:scale-98 disabled:opacity-50 text-white text-sm font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <CircleNotch size={18} className="animate-spin" />
                    <span>กำลังแชร์รูปภาพให้ครอบครัว... ✨</span>
                  </>
                ) : (
                  <span>🚀 แชร์รูปให้คนในบ้านดูเลย (+25 แต้ม) 📸</span>
                )}
              </button>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: VOICE MODE (พูดทักทาย) - 100% Focused on Speaking & Quick Greetings
             ========================================================================= */}
          {mode === 'voice' && (
            <div className="space-y-4">
              {/* Hero Round Microphone Button */}
              <div className="flex flex-col items-center justify-center py-2 text-center">
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center text-white transition-all cursor-pointer active:scale-95 shadow-lg ${
                    isListening
                      ? 'bg-rose-500 animate-pulse ring-8 ring-rose-300/50'
                      : 'bg-gradient-to-tr from-[#E88D67] to-[#F1A281] hover:scale-105 shadow-[#E88D67]/30 ring-4 ring-[#E88D67]/20'
                  }`}
                  title="แตะแล้วพูดได้เลย"
                >
                  <Microphone size={38} weight={isListening ? 'fill' : 'bold'} />
                </button>

                <p className="mt-3 text-xs sm:text-sm font-black text-[#2D2825]">
                  {isListening ? (
                    <span className="text-rose-600 animate-pulse">
                      🔴 กำลังฟังอยู่จ้า... พูดได้เลย (แตะอีกครั้งเมื่อพูดเสร็จ)
                    </span>
                  ) : (
                    <span>🎙️ แตะที่ไมค์แล้วพูดได้เลยจ้า (ไม่ต้องพิมพ์)</span>
                  )}
                </p>
                <p className="text-[11px] text-[#746C65] mt-0.5">
                  ระบบจะแปลงเสียงพูดของคุณเป็นข้อความให้อัตโนมัติ
                </p>
              </div>

              {/* Transcription & Editable Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#746C65]">
                    ข้อความที่จะส่ง:
                  </label>
                  {caption && (
                    <button
                      type="button"
                      onClick={() => setCaption('')}
                      className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash size={12} weight="bold" />
                      <span>ล้างข้อความ</span>
                    </button>
                  )}
                </div>

                <textarea
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="แตะปุ่มไมค์ด้านบน หรือแตะเลือกคำทักทายด้านล่างได้เลยจ้า..."
                  className="w-full p-3 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-sm sm:text-base text-[#2D2825] font-semibold placeholder:text-[#9E958D] placeholder:font-normal focus:outline-none focus:border-[#E88D67] focus:bg-white resize-none leading-relaxed"
                />
              </div>

              {/* 1-Tap Quick Senior Greetings */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-[#746C65] flex items-center gap-1.5">
                  <span>🌸</span>
                  <span>หรือแตะเลือกคำทักทายด่วน (ไม่ต้องพิมพ์ ไม่ต้องพูด):</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {SENIOR_GREETINGS.map((phrase, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCaption(phrase)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all active:scale-98 cursor-pointer flex items-center justify-between gap-2 shadow-2xs ${
                        caption === phrase
                          ? 'bg-[#E88D67] text-white border-[#E88D67]'
                          : 'bg-[#FAF8F5] text-[#2D2825] border-[#ECE7DF] hover:bg-[#FFF5EB] hover:border-[#E88D67]/40'
                      }`}
                    >
                      <span className="truncate">{phrase}</span>
                      {caption === phrase && <Check size={14} weight="bold" className="shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !caption.trim()}
                className="w-full py-3.5 bg-[#E88D67] hover:bg-[#D9774F] active:scale-98 disabled:opacity-50 text-white text-sm font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <>
                    <CircleNotch size={18} className="animate-spin" />
                    <span>กำลังส่งข้อความทักทาย... 💖</span>
                  </>
                ) : (
                  <span>🚀 ส่งข้อความทักทายคนในบ้าน (+25 แต้ม) 💖</span>
                )}
              </button>
            </div>
          )}

          {/* =========================================================================
              VIEW 3: CHORE MODE (ส่งงานบ้าน) - Chore Selection + Photo Proof + Points
             ========================================================================= */}
          {mode === 'chore' && (
            <div className="space-y-3.5">
              {/* Chore Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#746C65] flex items-center justify-between">
                  <span>1. แตะเลือกงานบ้านที่ทำ:</span>
                  <span className="text-[10px] text-[#2E7D32] font-semibold">รับทันที 25 แต้มโหล</span>
                </label>

                {/* 3x2 Grid */}
                <div className="grid grid-cols-3 gap-2">
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
                        className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-[#2E7D32] text-white border-[#2E7D32] shadow-sm scale-102 font-black'
                            : 'bg-[#FAF8F5] text-[#2D2825] border-[#ECE7DF] hover:bg-white hover:border-[#2E7D32]/40 font-bold'
                        }`}
                      >
                        <span className="text-2xl">{chore.emoji}</span>
                        <span className="text-xs leading-tight text-center font-bold break-words">
                          {chore.name}
                        </span>
                      </button>
                    );
                  })}

                  {/* 6th Option: พิมพ์เอง */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomChore(true);
                    }}
                    className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer active:scale-95 ${
                      isCustomChore
                        ? 'bg-[#E88D67] text-white border-[#E88D67] shadow-sm scale-102 font-black'
                        : 'bg-[#FAF8F5] text-[#2D2825] border-[#ECE7DF] hover:bg-white font-bold'
                    }`}
                  >
                    <PencilSimple size={24} weight="bold" />
                    <span className="text-xs leading-tight text-center font-bold">พิมพ์เอง...</span>
                  </button>
                </div>

                {/* Custom Chore Input Field */}
                {isCustomChore && (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={customChoreName}
                      onChange={(e) => setCustomChoreName(e.target.value)}
                      placeholder="พิมพ์ชื่องานบ้าน เช่น ขัดห้องน้ำ, ล้างรถ, รดน้ำต้นไม้..."
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] rounded-xl border border-[#E88D67] text-xs sm:text-sm text-[#2D2825] placeholder:text-[#9E958D] focus:outline-none focus:bg-white"
                      autoFocus
                    />
                  </div>
                )}

                {/* Quick Caption Suggestions for selected chore */}
                {!isCustomChore && currentChore?.quickCaptions && (
                  <div className="space-y-1 pt-0.5">
                    <span className="text-[10px] text-[#746C65] font-semibold block">
                      แตะใส่ข้อความผลงานด่วน:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {currentChore.quickCaptions.map((phrase, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCaption(phrase)}
                          className="text-[10.5px] text-[#2E7D32] bg-[#EEF4F0] hover:bg-[#E2EFE6] px-2.5 py-1 rounded-lg border border-[#2E7D32]/20 transition-colors text-left cursor-pointer"
                        >
                          "{phrase}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Proof Photos: Before & After Dual Boxes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#746C65]">
                  2. รูปถ่ายผลงาน (ไม่บังคับ แต่ช่วยสะสมแต้ม):
                </label>
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
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                            ก่อนทำ
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <Camera size={22} className="mx-auto text-red-400" />
                          <p className="text-[11px] font-bold text-[#2D2825]">1. รูปก่อนทำ</p>
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
                      className="relative aspect-4/3 rounded-2xl border-2 border-dashed border-[#2E7D32]/40 hover:border-[#2E7D32] bg-[#EEF4F0]/40 cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all p-1.5 text-center group"
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
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                          <span className="absolute bottom-1 left-1 bg-[#2E7D32] text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                            หลังทำ ✨
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <Camera size={22} className="mx-auto text-[#2E7D32]" />
                          <p className="text-[11px] font-bold text-[#2D2825]">2. รูปหลังทำ ✨</p>
                          <p className="text-[9px] text-[#2E7D32] font-semibold">(แนะนำโชว์ผลงาน)</p>
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
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || compressing}
                className="w-full py-3.5 bg-[#2E7D32] hover:bg-[#236027] active:scale-98 disabled:opacity-50 text-white text-sm font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <>
                    <CircleNotch size={18} className="animate-spin" />
                    <span>กำลังบันทึกและส่งงานบ้าน... ✨</span>
                  </>
                ) : (
                  <span>🚀 ส่งงานบ้านรับ +25 แต้มโหล 🍯</span>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
