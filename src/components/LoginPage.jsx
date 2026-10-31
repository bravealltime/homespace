import { useState, useRef, useEffect } from 'react';
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
  Key,
  ShieldCheck,
  Clock,
  ArrowClockwise,
  Eye,
  EyeSlash,
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import HomeSpaceLogo from './HomeSpaceLogo';

const EMOJI_AVATARS = ['😊', '😎', '🥰', '😄', '🤗', '👨', '👩', '👧', '👦', '👶', '🧑', '👴', '👵', '🐱', '🐶', '🌻', '⭐'];

export default function LoginPage() {
  const {
    currentUser,
    isPending,
    registerWithRequest,
    loginWithPin,
    login,
    logout,
    refreshMembers,
    currentFamily,
  } = useAuth();

  // Check if opened via invite link query
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const inviteCodeParam = urlParams ? (urlParams.get('invite') || urlParams.get('join') || urlParams.get('code')) : null;

  // View Mode: 'login' | 'register' | 'pending'
  const [mode, setMode] = useState(
    isPending ? 'pending' : (inviteCodeParam ? 'register' : 'login')
  );

  // Common credentials
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [pinError, setPinError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Register state
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [avatarImage, setAvatarImage] = useState(null);
  const [useImageAvatar, setUseImageAvatar] = useState(false);
  const [selectedFamilyCode, setSelectedFamilyCode] = useState(inviteCodeParam ? inviteCodeParam.toUpperCase() : 'HOME-2026');
  const [invitedFamily, setInvitedFamily] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);

  // Check URL query parameters for invite link
  useEffect(() => {
    if (inviteCodeParam) {
      setSelectedFamilyCode(inviteCodeParam.toUpperCase());
      api.fetchFamilyByCode(inviteCodeParam).then((fam) => {
        if (fam) {
          setInvitedFamily(fam);
        }
      }).catch(() => {});
    }
  }, [inviteCodeParam]);

  // Update mode if user status is pending
  useEffect(() => {
    if (currentUser?.status === 'pending') {
      setMode('pending');
    }
  }, [currentUser]);

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
    setGeneralError('');
  };

  const handlePinChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(raw);
    setPinError('');
    setGeneralError('');
  };

  // 1. Handle Login with Phone + PIN
  const handleLogin = async (e) => {
    e?.preventDefault();
    if (phone.length < 9) {
      setPhoneError('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
      return;
    }
    if (pin.length < 4) {
      setPinError('กรุณากรอกรหัส PIN 4 หลัก');
      return;
    }

    setIsLoading(true);
    setGeneralError('');
    try {
      const res = await loginWithPin(phone, pin);
      if (res?.status === 'pending' || res?.member?.status === 'pending') {
        setMode('pending');
      } else if (res?.success || res?.member) {
        // Clean invite URL parameters on successful login
        if (typeof window !== 'undefined' && window.history.replaceState) {
          const url = new URL(window.location.href);
          url.searchParams.delete('invite');
          url.searchParams.delete('join');
          url.searchParams.delete('code');
          window.history.replaceState({}, '', url.toString());
        }
      }
    } catch (err) {
      if (err.status === 403 || err.data?.status === 'pending' || err.message?.includes('รอคุณ Fluke')) {
        setMode('pending');
        return;
      }
      setGeneralError(err.message || 'รหัส PIN หรือเบอร์โทรศัพท์ไม่ถูกต้อง');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Register & Send Request to Family Admin
  const handleRegister = async (e) => {
    e?.preventDefault();
    if (phone.length < 9) {
      setPhoneError('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
      return;
    }
    if (pin.length < 4) {
      setPinError('กรุณาตั้งรหัส PIN 4 หลักสำหรับล็อกอิน');
      return;
    }
    if (!name.trim()) {
      setGeneralError('กรุณาระบุชื่อเล่นของคุณ');
      return;
    }

    setIsLoading(true);
    setGeneralError('');
    try {
      const res = await registerWithRequest({
        phone,
        pin,
        name: name.trim(),
        role: role.trim() || 'สมาชิกในบ้าน',
        avatar: useImageAvatar ? '📷' : selectedEmoji,
        avatarType: useImageAvatar ? 'image' : 'emoji',
        avatarImage: useImageAvatar ? avatarImage : null,
        familyCode: selectedFamilyCode,
        familyId: invitedFamily?.id || currentFamily?.id || 'family-main',
      });

      if (res?.status === 'pending') {
        setMode('pending');
      } else {
        await loginWithPin(phone, pin);
      }
    } catch (err) {
      setGeneralError(err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
      setIsLoading(false);
    }
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

  // 3. Check Approval Status
  const handleCheckStatus = async () => {
    setIsLoading(true);
    try {
      await refreshMembers();
      const updated = await login(phone || currentUser?.phone);
      if (updated && updated.status === 'active') {
        // Success
      } else {
        alert('คำขอของคุณยังอยู่ระหว่างรอคุณ Fluke (เจ้าบ้าน) กดยืนยันอนุมัติ');
      }
    } catch {
      alert('คำขอยังรอการอนุมัติ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      data-scrollable="true"
      className="w-full h-full flex-1 min-h-0 bg-[#FAF8F5] flex flex-col justify-between p-4 text-[#2D2825] overflow-y-auto no-scrollbar scroll-area"
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }}
    >
      {/* Brand Header */}
      <header className="pt-5 pb-2 text-center max-w-sm mx-auto w-full">
        <div className="mx-auto flex items-center justify-center mb-2.5">
          <HomeSpaceLogo size={62} rounded="rounded-3xl" className="shadow-md" />
        </div>
        <h1 className="text-xl font-black tracking-tight text-[#2D2825]">HomeSpace</h1>
        <p className="text-xs text-[#746C65] mt-0.5">บันทึกความสุขและงานบ้านครอบครัว</p>

        {/* Invite Link Welcome Banner */}
        {inviteCodeParam && (
          <div className="mt-3 p-3 rounded-2xl bg-[#EEF4F0] border border-[#5F8D75]/30 text-center animate-enter-rise shadow-2xs">
            <span className="text-[10px] font-black text-[#5F8D75] uppercase tracking-wider block">
              🎉 คุณได้รับคำเชิญเข้าร่วมครอบครัว
            </span>
            <p className="text-sm font-black text-[#2D2825] mt-0.5">
              {invitedFamily?.name || 'บ้านสุขใจ (Family Home)'}
            </p>
            <p className="text-[10px] text-[#746C65]">
              รหัสบ้าน: <span className="font-mono font-bold">{selectedFamilyCode}</span> · โดยคุณ Fluke (เจ้าบ้าน)
            </p>
          </div>
        )}
      </header>

      {/* Main Form Area */}
      <main className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center py-2">
        {/* ==================================================== */}
        {/* 1. LOGIN MODE: เข้าสู่ระบบ (Phone + PIN 4 หลัก)       */}
        {/* ==================================================== */}
        {mode === 'login' && (
          <div className="bg-white rounded-3xl border border-[#ECE7DF] p-5 sm:p-6 shadow-xs animate-enter-rise space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF4F0] text-[#5F8D75] flex items-center justify-center text-xl shrink-0">
                <Key size={20} weight="bold" />
              </div>
              <div>
                <h2 className="text-sm font-black text-[#2D2825]">เข้าสู่ระบบ</h2>
                <p className="text-[11px] text-[#746C65]">กรอกเบอร์โทรและรหัส PIN 4 หลักของคุณ</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5">
              {/* Phone Input */}
              <div>
                <label className="block text-xs font-bold text-[#2D2825] mb-1">
                  เบอร์โทรศัพท์
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={formatPhoneDisplay(phone)}
                    onChange={handlePhoneChange}
                    placeholder="08X XXX XXXX"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-sm font-bold text-[#2D2825] focus:outline-none focus:border-[#5F8D75] focus:bg-white transition-all shadow-2xs"
                    autoFocus
                  />
                  {phone.length === 10 && (
                    <span className="absolute right-3.5 top-3 text-[#5F8D75]">
                      <Check size={18} weight="bold" />
                    </span>
                  )}
                </div>
                {phoneError && <p className="text-xs text-red-500 font-bold mt-1">{phoneError}</p>}
              </div>

              {/* PIN Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#2D2825]">
                    รหัส PIN 4 หลัก
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-[10px] text-[#746C65] hover:text-[#2D2825] flex items-center gap-1 cursor-pointer"
                  >
                    {showPin ? <EyeSlash size={13} /> : <Eye size={13} />}
                    <span>{showPin ? 'ซ่อน' : 'แสดงรหัส'}</span>
                  </button>
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="••••"
                  className="w-full text-center tracking-[0.8em] text-xl font-mono font-bold py-2.5 px-4 bg-[#FAF8F5] border border-[#ECE7DF] rounded-2xl focus:outline-none focus:border-[#5F8D75] focus:bg-white transition-all shadow-2xs"
                />
                {pinError && <p className="text-xs text-red-500 font-bold mt-1 text-center">{pinError}</p>}
              </div>

              {generalError && (
                <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-center animate-enter-rise space-y-2">
                  <p className="text-xs text-red-600 font-bold">{generalError}</p>
                  {(generalError.includes('ยังไม่มีเบอร์') || generalError.includes('เชิญ')) && (
                    <button
                      type="button"
                      onClick={() => {
                        setGeneralError('');
                        setMode('register');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-[#5F8D75] hover:bg-[#476E5B] px-3.5 py-1.5 rounded-xl cursor-pointer shadow-xs transition-all active:scale-95"
                    >
                      <Sparkle size={14} weight="fill" />
                      <span>สมัครเข้าร่วมครอบครัวทันที</span>
                    </button>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={phone.length < 9 || pin.length < 4 || isLoading}
                className="w-full py-3 bg-[#5F8D75] hover:bg-[#476E5B] text-white text-sm font-black rounded-2xl shadow-xs flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>เข้าสู่ระบบ</span>
                    <ArrowRight size={16} weight="bold" />
                  </>
                )}
              </button>

              {/* Switch to Register */}
              <div className="pt-2 text-center border-t border-[#ECE7DF]/60">
                <button
                  type="button"
                  onClick={() => {
                    setGeneralError('');
                    setMode('register');
                  }}
                  className="text-xs text-[#5F8D75] font-bold hover:underline cursor-pointer"
                >
                  ✨ ยังไม่มีบัญชี? สมัครเข้าร่วมครอบครัวที่นี่
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. REGISTER / JOIN MODE: สมัครเข้าร่วมครอบครัว (Invite Link + Set PIN)     */}
        {/* ========================================================================= */}
        {mode === 'register' && (
          <div className="bg-white rounded-3xl border border-[#ECE7DF] p-5 sm:p-6 shadow-xs animate-enter-rise space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#EEF4F0] text-[#5F8D75] flex items-center justify-center text-lg">
                  <UserPlus size={19} weight="bold" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-[#2D2825]">สมัครเข้าร่วมครอบครัว</h2>
                  <p className="text-[10px] text-[#746C65]">กรอกข้อมูลเพื่อส่งให้เจ้าบ้านอนุมัติ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGeneralError('');
                  setMode('login');
                }}
                className="text-[11px] font-bold text-[#5F8D75] hover:underline cursor-pointer"
              >
                มีบัญชีแล้ว? ล็อกอิน
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-3">
              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-[#2D2825] mb-1">
                  1. เบอร์โทรศัพท์ของคุณ
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={formatPhoneDisplay(phone)}
                  onChange={handlePhoneChange}
                  placeholder="08X XXX XXXX"
                  className="w-full px-3 py-2 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-xs font-bold text-[#2D2825] focus:outline-none focus:border-[#5F8D75] focus:bg-white"
                  autoFocus
                />
                {phoneError && <p className="text-[11px] text-red-500 font-bold mt-0.5">{phoneError}</p>}
              </div>

              {/* Set PIN 4 digits */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#2D2825]">
                    2. ตั้งรหัส PIN 4 หลัก (สำหรับใช้ล็อกอิน)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-[10px] text-[#746C65] hover:text-[#2D2825] flex items-center gap-1 cursor-pointer"
                  >
                    {showPin ? <EyeSlash size={12} /> : <Eye size={12} />}
                    <span>{showPin ? 'ซ่อน' : 'แสดง'}</span>
                  </button>
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="ตั้งรหัสเลข 4 หลัก เช่น 1234"
                  className="w-full text-center tracking-[0.5em] text-base font-mono font-bold py-2 px-3 bg-[#FAF8F5] border border-[#ECE7DF] rounded-2xl focus:outline-none focus:border-[#5F8D75] focus:bg-white"
                />
                {pinError && <p className="text-[11px] text-red-500 font-bold mt-0.5 text-center">{pinError}</p>}
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-[#2D2825] mb-1">
                  3. ชื่อเล่นของคุณ
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น ปู่, ย่า, น้าปุ้ย, พี่กานต์"
                  className="w-full px-3 py-2 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-xs font-bold text-[#2D2825] focus:outline-none focus:border-[#5F8D75] focus:bg-white"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-[#2D2825] mb-1">
                  4. บทบาทในบ้าน
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="เช่น คุณแม่, ลูกสาว, พี่ชาย, น้องสาว"
                  className="w-full px-3 py-2 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-xs font-bold text-[#2D2825] focus:outline-none focus:border-[#5F8D75] focus:bg-white"
                />
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="block text-xs font-bold text-[#2D2825] mb-1">
                  5. รูปโปรไฟล์
                </label>
                <div className="flex items-center gap-2.5">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-12 h-12 rounded-2xl border-2 border-[#5F8D75] bg-[#FAF8F5] flex items-center justify-center cursor-pointer overflow-hidden shadow-2xs hover:scale-105 transition-all shrink-0"
                    title="แตะเพื่อเลือกรูปภาพ"
                  >
                    {useImageAvatar && avatarImage ? (
                      <img src={avatarImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{selectedEmoji}</span>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

                  <div className="flex-1 overflow-x-auto no-scrollbar py-1">
                    <div className="flex gap-1">
                      {EMOJI_AVATARS.slice(0, 8).map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setSelectedEmoji(emoji);
                            setUseImageAvatar(false);
                          }}
                          className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center border transition-all cursor-pointer ${
                            selectedEmoji === emoji && !useImageAvatar
                              ? 'bg-[#EEF4F0] border-[#5F8D75] scale-110 shadow-2xs'
                              : 'bg-[#FAF8F5] border-transparent'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Family Info */}
              <div className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DF] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9px] text-[#746C65] block font-semibold">ขอเข้าร่วมครอบครัว:</span>
                  <span className="font-bold text-[#2D2825]">
                    {invitedFamily?.name || currentFamily?.name || 'บ้านสุขใจ'}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-lg border border-[#ECE7DF]">
                  {selectedFamilyCode}
                </span>
              </div>

              {generalError && (
                <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-center animate-enter-rise space-y-2">
                  <p className="text-xs text-red-600 font-bold">{generalError}</p>
                  {(generalError.includes('ยังไม่มีเบอร์') || generalError.includes('เชิญ')) && (
                    <button
                      type="button"
                      onClick={() => {
                        setGeneralError('');
                        setMode('register');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-[#5F8D75] hover:bg-[#476E5B] px-3.5 py-1.5 rounded-xl cursor-pointer shadow-xs transition-all active:scale-95"
                    >
                      <Sparkle size={14} weight="fill" />
                      <span>สมัครเข้าร่วมครอบครัวทันที</span>
                    </button>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={phone.length < 9 || pin.length < 4 || !name.trim() || isLoading}
                className="w-full py-3 bg-[#E88D67] hover:bg-[#CF6E46] text-white text-sm font-black rounded-2xl shadow-xs flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>ส่งคำขอเข้าร่วมบ้าน</span>
                    <Sparkle size={16} weight="fill" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ==================================================== */}
        {/* 3. PENDING APPROVAL MODE: รอการอนุมัติจากเจ้าบ้าน    */}
        {/* ==================================================== */}
        {mode === 'pending' && (
          <div className="bg-white rounded-3xl border border-[#ECE7DF] p-6 shadow-xs animate-enter-rise text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#FAF8F5] border border-[#ECE7DF] flex items-center justify-center text-3xl mx-auto shadow-2xs animate-pulse">
              ⏳
            </div>

            <div>
              <span className="text-[10px] font-black text-[#E88D67] bg-[#FDF1EB] px-2.5 py-0.8 rounded-full border border-[#E88D67]/20 uppercase">
                รอเจ้าบ้านอนุมัติคำขอ
              </span>
              <h2 className="text-base font-black text-[#2D2825] mt-2">
                ส่งคำขอเรียบร้อยแล้ว!
              </h2>
              <p className="text-xs text-[#746C65] mt-1 leading-relaxed">
                คำขอเข้าร่วมบ้านของคุณถูกส่งไปยัง <span className="font-bold text-[#2D2825]">คุณ Fluke (เจ้าบ้าน)</span> เรียบร้อยแล้ว เมื่อได้รับการอนุมัติ คุณสามารถเข้าสู่ระบบด้วยรหัส PIN 4 หลักได้ทันที
              </p>
            </div>

            {/* Applicant Summary */}
            <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-left flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#ECE7DF] flex items-center justify-center text-xl overflow-hidden shrink-0">
                {currentUser?.avatarType === 'image' && currentUser?.avatarImage ? (
                  <img src={currentUser.avatarImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.avatar || selectedEmoji || '😊'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#2D2825] truncate">
                    {currentUser?.name || name || 'คุณ'}
                  </span>
                  <span className="text-[10px] text-[#5F8D75] bg-[#EEF4F0] px-1.5 py-0.2 rounded font-bold">
                    {currentUser?.role || role || 'สมาชิก'}
                  </span>
                </div>
                <p className="text-[10px] text-[#746C65] font-mono">
                  เบอร์โทร: {currentUser?.phone || phone}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={isLoading}
                className="w-full py-2.5 bg-[#5F8D75] hover:bg-[#476E5B] text-white text-xs font-bold rounded-2xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ArrowClockwise size={14} weight="bold" />
                    <span>ตรวจสอบสถานะการอนุมัติ</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  logout();
                  setMode('login');
                }}
                className="text-xs text-[#746C65] hover:text-[#2D2825] hover:underline cursor-pointer block mx-auto py-1 font-semibold"
              >
                เข้าสู่ระบบด้วยเบอร์อื่น / เข้าหน้าหลัก
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-2 text-center text-xs text-[#746C65]">
        <p>สร้างบรรยากาศบ้านที่อบอุ่นด้วยกันทุกวัน ❤️</p>
      </footer>
    </div>
  );
}
