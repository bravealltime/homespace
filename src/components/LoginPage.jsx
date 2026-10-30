import { useState, useRef } from 'react';
import {
  Phone,
  ArrowRight,
  UserPlus,
  House,
  Camera,
  User,
  CaretLeft,
  Check,
  Sparkle,
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_FAMILY_MEMBERS } from '../data';

const EMOJI_AVATARS = ['😊', '😎', '🥰', '😄', '🤗', '👨', '👩', '👧', '👦', '👶', '🧑', '👴', '👵', '🐱', '🐶', '🌻', '⭐'];

const STEP = {
  PHONE: 'phone',
  SETUP: 'setup',
};

export default function LoginPage() {
  const { findMemberByPhone, login, register } = useAuth();
  const [step, setStep] = useState(STEP.PHONE);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [avatarImage, setAvatarImage] = useState(null);
  const [useImageAvatar, setUseImageAvatar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const formatPhoneDisplay = (digits) => {
    if (!digits) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  };

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(raw);
    setPhoneError('');
  };

  const executeLogin = (rawPhone) => {
    setIsLoading(true);
    setTimeout(() => {
      const existing = findMemberByPhone(rawPhone);
      if (existing) {
        login(rawPhone);
      } else {
        setPhone(rawPhone);
        setStep(STEP.SETUP);
      }
      setIsLoading(false);
    }, 350);
  };

  const handlePhoneSubmit = () => {
    if (phone.length < 9) {
      setPhoneError('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
      return;
    }
    executeLogin(phone);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarImage(ev.target.result);
        setUseImageAvatar(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = () => {
    if (!name.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      register(phone, name.trim(), role.trim() || 'สมาชิกในบ้าน', {
        avatar: useImageAvatar ? '📷' : selectedEmoji,
        avatarType: useImageAvatar ? 'image' : 'emoji',
        avatarImage: useImageAvatar ? avatarImage : null,
      });
      setIsLoading(false);
    }, 350);
  };

  return (
    <div className="w-full h-full bg-[#FAF8F5] flex flex-col justify-between p-4 text-[#2D2825] overflow-y-auto no-scrollbar">
      {/* Brand Header */}
      <header className="pt-8 pb-4 text-center max-w-sm mx-auto w-full">
        <div className="w-16 h-16 rounded-3xl bg-[#5F8D75] text-white mx-auto flex items-center justify-center text-3xl shadow-sm mb-3">
          🏡
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#2D2825]">HomeSpace</h1>
        <p className="text-xs text-[#746C65] mt-1">แอปพลิเคชันบันทึกความสุขและงานบ้านของครอบครัว</p>
      </header>

      {/* Main card */}
      <main className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
        {step === STEP.PHONE && (
          <div className="bg-white rounded-3xl border border-[#ECE7DF] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF4F0] text-[#5F8D75] flex items-center justify-center">
                <Phone size={22} weight="bold" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#2D2825]">เข้าสู่ระบบด้วยเบอร์โทร</h2>
                <p className="text-xs text-[#746C65]">เพื่อดูคะแนนและส่งงานบ้านของตัวเอง</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="phone-input" className="block text-xs font-bold text-[#2D2825] mb-1.5">
                  เบอร์โทรศัพท์มือถือ
                </label>
                <div className="relative">
                  <input
                    id="phone-input"
                    type="tel"
                    inputMode="numeric"
                    value={formatPhoneDisplay(phone)}
                    onChange={handlePhoneChange}
                    onKeyDown={(e) => e.key === 'Enter' && handlePhoneSubmit()}
                    placeholder="เช่น 081 234 5678"
                    className={`w-full px-4 py-3 bg-[#FAF8F5] rounded-2xl border text-base font-bold text-[#2D2825] placeholder:text-[#9E958D] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#5F8D75] ${
                      phoneError ? 'border-red-400 bg-red-50/20' : 'border-[#ECE7DF]'
                    }`}
                    autoFocus
                  />
                  {phone.length >= 9 && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5F8D75]">
                      <Check size={20} weight="bold" />
                    </div>
                  )}
                </div>
                {phoneError && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">{phoneError}</p>
                )}
              </div>

              <button
                type="button"
                onClick={handlePhoneSubmit}
                disabled={phone.length < 9 || isLoading}
                className="w-full py-3.5 bg-[#5F8D75] hover:bg-[#476E5B] text-white text-base font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 transition-all"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>เข้าสู่ระบบ</span>
                    <ArrowRight size={18} weight="bold" />
                  </>
                )}
              </button>
            </div>

            {/* Quick Login Chips for Family Members */}
            <div className="mt-6 pt-4 border-t border-[#ECE7DF]">
              <p className="text-xs font-bold text-[#746C65] mb-2.5 text-center">
                หรือแตะเพื่อเข้าสู่ระบบเป็นสมาชิกในบ้าน:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_FAMILY_MEMBERS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      executeLogin(m.phone);
                    }}
                    className="flex items-center gap-2 p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EEF4F0] border border-[#ECE7DF] hover:border-[#5F8D75]/40 transition-all text-left"
                  >
                    <span className="text-xl">{m.avatar}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#2D2825] truncate">{m.name}</p>
                      <p className="text-[10px] text-[#746C65]">{m.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === STEP.SETUP && (
          <div className="bg-white rounded-3xl border border-[#ECE7DF] p-6 shadow-sm">
            <button
              type="button"
              onClick={() => setStep(STEP.PHONE)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#746C65] hover:text-[#2D2825] mb-4"
            >
              <CaretLeft size={14} weight="bold" />
              <span>เปลี่ยนเบอร์โทรศัพท์</span>
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-[#FDF1EB] text-[#E88D67] flex items-center justify-center">
                <UserPlus size={22} weight="bold" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#2D2825]">สร้างโปรไฟล์สมาชิกใหม่</h2>
                <p className="text-xs text-[#746C65]">เบอร์ {formatPhoneDisplay(phone)}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Photo uploader */}
              <div className="flex flex-col items-center pb-1">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-20 h-20 rounded-3xl overflow-hidden cursor-pointer border-2 border-[#ECE7DF] hover:border-[#5F8D75] transition-all group bg-[#FAF8F5] flex items-center justify-center shadow-xs"
                >
                  {useImageAvatar && avatarImage ? (
                    <img src={avatarImage} alt="รูปโปรไฟล์" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{selectedEmoji}</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera size={24} weight="fill" />
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
                  className="text-xs text-[#5F8D75] font-bold mt-2 hover:underline"
                >
                  📸 แตะเพื่ออัปโหลดรูปภาพตัวเอง
                </button>
              </div>

              {/* Emoji choices */}
              {!useImageAvatar && (
                <div>
                  <span className="block text-[11px] font-bold text-[#746C65] mb-1.5 text-center">
                    หรือเลือกอิโมจิแทนตัวเอง:
                  </span>
                  <div className="grid grid-cols-6 gap-1.5">
                    {EMOJI_AVATARS.slice(0, 12).map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setSelectedEmoji(emoji);
                          setUseImageAvatar(false);
                        }}
                        className={`h-9 rounded-xl flex items-center justify-center text-lg border transition-all ${
                          selectedEmoji === emoji && !useImageAvatar
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

              {/* Name */}
              <div>
                <label htmlFor="user-name" className="block text-xs font-bold text-[#2D2825] mb-1">
                  ชื่อเล่น
                </label>
                <input
                  id="user-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น พี่นนท์, แม่ปุ๊ก, น้องกานต์"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] rounded-xl border border-[#ECE7DF] text-sm font-semibold text-[#2D2825] focus:outline-none focus:ring-2 focus:ring-[#5F8D75]"
                  autoFocus
                />
              </div>

              {/* Role */}
              <div>
                <label htmlFor="user-role" className="block text-xs font-bold text-[#2D2825] mb-1">
                  บทบาทในบ้าน
                </label>
                <input
                  id="user-role"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="เช่น คุณพ่อ, คุณแม่, ลูกคนโต, น้องเล็ก"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] rounded-xl border border-[#ECE7DF] text-sm font-semibold text-[#2D2825] focus:outline-none focus:ring-2 focus:ring-[#5F8D75]"
                />
              </div>

              <button
                type="button"
                onClick={handleRegister}
                disabled={!name.trim() || isLoading}
                className="w-full py-3.5 bg-[#E88D67] hover:bg-[#CF6E46] text-white text-base font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 transition-all"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>เข้าร่วมครอบครัว</span>
                    <Sparkle size={18} weight="fill" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-[#746C65]">
        <p>สร้างบรรยากาศบ้านที่อบอุ่นด้วยกันทุกวัน ❤️</p>
      </footer>
    </div>
  );
}
