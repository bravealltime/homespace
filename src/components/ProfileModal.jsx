import { useState, useRef, useEffect } from 'react';
import { X, Camera, User, Check, Trash, Sparkle } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const EMOJI_AVATARS = ['😊', '😎', '🥰', '😄', '🤗', '👨', '👩', '👧', '👦', '👶', '🧑', '👴', '👵', '🐱', '🐶', '🌻', '⭐', '🎈'];

export default function ProfileModal({ isOpen, onClose }) {
  const { currentUser, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [avatarImage, setAvatarImage] = useState(null);
  const [useImageAvatar, setUseImageAvatar] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentUser && isOpen) {
      setName(currentUser.name || '');
      setRole(currentUser.role || '');
      setSelectedEmoji(currentUser.avatarType === 'emoji' ? currentUser.avatar : '😊');
      setAvatarImage(currentUser.avatarImage || null);
      setUseImageAvatar(currentUser.avatarType === 'image');
      setSaved(false);
    }
  }, [currentUser, isOpen]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('ไฟล์ใหญ่เกินไป กรุณาเลือกรูปขนาดไม่เกิน 5 MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarImage(ev.target.result);
        setUseImageAvatar(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!name.trim() || !currentUser) return;

    updateProfile(currentUser.phone, {
      name: name.trim(),
      role: role.trim() || 'สมาชิกในบ้าน',
      avatar: useImageAvatar ? '📷' : selectedEmoji,
      avatarType: useImageAvatar ? 'image' : 'emoji',
      avatarImage: useImageAvatar ? avatarImage : null,
    });

    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  if (!isOpen || !currentUser) return null;

  const formatPhoneDisplay = (digits) => {
    if (!digits) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl border border-[#ECE7DF] shadow-xl w-full max-w-sm max-h-[90dvh] overflow-y-auto no-scrollbar animate-enter-rise p-5 sm:p-6 text-[#2D2825]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#ECE7DF]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EEF4F0] text-[#5F8D75] flex items-center justify-center text-lg">
              👤
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2D2825]">แก้ไขโปรไฟล์ส่วนตัว</h2>
              <p className="text-[11px] text-[#746C65]">เปลี่ยนรูปภาพหรือชื่อเล่นของคุณ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#FAF8F5] hover:bg-[#F5F1EB] text-[#746C65] hover:text-[#2D2825] flex items-center justify-center transition-colors"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className="space-y-4 pt-4">
          {/* Avatar Preview & Upload */}
          <div className="flex flex-col items-center">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-3xl overflow-hidden cursor-pointer border-3 border-[#ECE7DF] hover:border-[#5F8D75] transition-all group bg-[#FAF8F5] flex items-center justify-center shadow-xs"
              title="แตะเพื่อเลือกรูปภาพจากมือถือหรือคอมพิวเตอร์"
            >
              {useImageAvatar && avatarImage ? (
                <img src={avatarImage} alt="รูปโปรไฟล์" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl">{selectedEmoji}</span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs">
                <Camera size={26} weight="fill" />
                <span className="font-semibold text-[10px] mt-1">เปลี่ยนรูป</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-[#5F8D75] font-bold mt-2 hover:underline flex items-center gap-1"
            >
              <Camera size={14} />
              <span>แตะเพื่ออัปโหลดรูปภาพตัวเอง</span>
            </button>
          </div>

          {/* Emoji selector if not photo */}
          {!useImageAvatar && (
            <div>
              <span className="block text-xs font-bold text-[#746C65] mb-1.5 text-center">
                หรือเลือกอิโมจิแทนตัวเอง:
              </span>
              <div className="grid grid-cols-6 gap-1.5">
                {EMOJI_AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setSelectedEmoji(emoji);
                      setUseImageAvatar(false);
                    }}
                    className={`h-9 rounded-xl flex items-center justify-center text-lg border transition-all ${
                      selectedEmoji === emoji
                        ? 'bg-[#EEF4F0] border-[#5F8D75] scale-105'
                        : 'bg-[#FAF8F5] border-[#ECE7DF] hover:bg-white'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {useImageAvatar && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setUseImageAvatar(false);
                  setAvatarImage(null);
                }}
                className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline"
              >
                <Trash size={14} />
                <span>ลบรูปภาพและเปลี่ยนไปใช้อิโมจิแทน</span>
              </button>
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="edit-name" className="block text-xs font-bold text-[#2D2825] mb-1">
              ชื่อเล่นของคุณ
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น พ่อ, แม่, พี่นนท์"
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] rounded-xl border border-[#ECE7DF] text-sm font-semibold text-[#2D2825] focus:outline-none focus:ring-2 focus:ring-[#5F8D75]"
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="edit-role" className="block text-xs font-bold text-[#2D2825] mb-1">
              บทบาทในครอบครัว
            </label>
            <input
              id="edit-role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="เช่น คุณพ่อ, คุณแม่, ลูกคนโต, น้องเล็ก"
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] rounded-xl border border-[#ECE7DF] text-sm font-semibold text-[#2D2825] focus:outline-none focus:ring-2 focus:ring-[#5F8D75]"
            />
          </div>

          {/* Phone (read-only) */}
          <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#ECE7DF] flex items-center justify-between">
            <span className="text-xs text-[#746C65]">เบอร์โทรศัพท์ประจำตัว:</span>
            <span className="text-xs font-bold text-[#2D2825]">{formatPhoneDisplay(currentUser.phone)}</span>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className={`w-full py-3.5 text-base font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${
              saved
                ? 'bg-[#5F8D75] text-white'
                : 'bg-[#E88D67] hover:bg-[#CF6E46] text-white disabled:opacity-40'
            }`}
          >
            {saved ? (
              <>
                <Check size={20} weight="bold" />
                <span>บันทึกเรียบร้อยแล้ว!</span>
              </>
            ) : (
              <span>บันทึกการเปลี่ยนแปลง</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
