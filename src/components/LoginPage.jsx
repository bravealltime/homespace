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
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

const EMOJI_AVATARS = ['😊', '😎', '🥰', '😄', '🤗', '👨', '👩', '👧', '👦', '👶', '🧑', '👴', '👵', '🐱', '🐶', '🌻', '⭐'];

const STEP = {
  PHONE: 'phone',
  OTP: 'otp',
  SETUP: 'setup',
  PENDING: 'pending',
};

export default function LoginPage() {
  const {
    currentUser,
    isPending,
    sendOtp,
    verifyOtp,
    registerWithRequest,
    login,
    logout,
    refreshMembers,
    currentFamily,
    families,
  } = useAuth();

  const [step, setStep] = useState(isPending ? STEP.PENDING : STEP.PHONE);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [receivedOtp, setReceivedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Profile Setup State
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [avatarImage, setAvatarImage] = useState(null);
  const [useImageAvatar, setUseImageAvatar] = useState(false);
  const [selectedFamilyCode, setSelectedFamilyCode] = useState('HOME-2026');
  const [invitedFamily, setInvitedFamily] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);

  // Check URL query parameters for invite link: e.g. ?invite=HOME-2026
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteParam = urlParams.get('invite') || urlParams.get('join') || urlParams.get('code');
    if (inviteParam) {
      setSelectedFamilyCode(inviteParam.toUpperCase());
      api.fetchFamilyByCode(inviteParam).then((fam) => {
        if (fam) {
          setInvitedFamily(fam);
        }
      }).catch(() => {});
    }
  }, []);

  // Update step if user status is pending
  useEffect(() => {
    if (currentUser?.status === 'pending') {
      setStep(STEP.PENDING);
    }
  }, [currentUser]);

  // OTP Countdown timer
  useEffect(() => {
    let timer;
    if (step === STEP.OTP && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

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

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    if (phone.length < 9) {
      setPhoneError('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
      return;
    }

    setIsLoading(true);
    setPhoneError('');
    try {
      const res = await sendOtp(phone);
      if (res?.otp) {
        setReceivedOtp(res.otp);
      }
      setStep(STEP.OTP);
      setCountdown(60);
      setCanResend(false);
      setOtpCode('');
      setOtpError('');
    } catch (err) {
      setPhoneError(err.message || 'ไม่สามารถส่ง OTP ได้ กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (codeToVerify) => {
    const code = codeToVerify || otpCode;
    if (code.length < 6) {
      setOtpError('กรุณากรอกรหัส OTP ให้ครบ 6 หลัก');
      return;
    }

    setIsLoading(true);
    setOtpError('');
    try {
      const res = await verifyOtp(phone, code);
      if (res?.verified) {
        if (res.isExisting && res.member) {
          if (res.member.status === 'pending') {
            setStep(STEP.PENDING);
          } else {
            login(phone);
            try {
              const url = new URL(window.location.href);
              url.searchParams.delete('invite');
              url.searchParams.delete('join');
              url.searchParams.delete('code');
              window.history.replaceState({}, '', url.toString());
            } catch {
              // ignore
            }
          }
        } else {
          // New User -> Move to Setup Profile & Request Join Family
          setStep(STEP.SETUP);
        }
      }
    } catch (err) {
      setOtpError(err.message || 'รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่');
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

  // Step 3: Register and Submit Request to Family Admin
  const handleRegisterRequest = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const res = await registerWithRequest({
        phone,
        name: name.trim(),
        role: role.trim() || 'สมาชิกในบ้าน',
        avatar: useImageAvatar ? '📷' : selectedEmoji,
        avatarType: useImageAvatar ? 'image' : 'emoji',
        avatarImage: useImageAvatar ? avatarImage : null,
        familyCode: selectedFamilyCode,
        familyId: invitedFamily?.id || currentFamily?.id || 'family-main',
      });

      if (res?.status === 'pending') {
        setStep(STEP.PENDING);
      } else {
        login(phone);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลงทะเบียน: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Check Approval Status
  const handleCheckStatus = async () => {
    setIsLoading(true);
    try {
      await refreshMembers();
      const updated = await login(phone || currentUser?.phone);
      if (updated && updated.status === 'active') {
        // Logged in!
      } else {
        alert('คำขอของคุณยังอยู่ระหว่างรอ Admin (คุณพ่อ/คุณแม่) กดอนุมัติ');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#FAF8F5] flex flex-col justify-between p-4 text-[#2D2825] overflow-y-auto no-scrollbar select-none">
      {/* Brand Header */}
      <header className="pt-6 pb-2 text-center max-w-sm mx-auto w-full">
        <div className="w-14 h-14 rounded-3xl bg-[#5F8D75] text-white mx-auto flex items-center justify-center text-3xl shadow-xs mb-2">
          🏡
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-[#2D2825]">HomeSpace</h1>
        <p className="text-xs text-[#746C65] mt-0.5">บันทึกความสุขและงานบ้านครอบครัว</p>

        {/* Invite link banner if arriving via link */}
        {invitedFamily && (
          <div className="mt-3 p-2.5 rounded-2xl bg-[#EEF4F0] border border-[#5F8D75]/30 text-center animate-enter-rise">
            <span className="text-[10px] font-black text-[#5F8D75] block">
              🎉 คุณได้รับคำเชิญเข้าร่วมครอบครัว
            </span>
            <p className="text-xs font-black text-[#2D2825]">{invitedFamily.name}</p>
            <p className="text-[9px] text-[#746C65]">รหัสบ้าน: {invitedFamily.code}</p>
          </div>
        )}
      </header>

      {/* Main Card */}
      <main className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center py-2">
        {/* ================= STEP 1: PHONE ================= */}
        {step === STEP.PHONE && (
          <div className="bg-white rounded-3xl border border-[#ECE7DF] p-5 sm:p-6 shadow-xs animate-enter-rise">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF4F0] text-[#5F8D75] flex items-center justify-center text-xl shrink-0">
                <Phone size={20} weight="bold" />
              </div>
              <div>
                <h2 className="text-sm font-black text-[#2D2825]">สมัคร / เข้าสู่ระบบ</h2>
                <p className="text-[11px] text-[#746C65]">กรอกเบอร์โทรเพื่อรับรหัส OTP ยืนยัน</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label htmlFor="phone-input" className="block text-xs font-bold text-[#2D2825] mb-1">
                  เบอร์โทรศัพท์มือถือ
                </label>
                <div className="relative">
                  <input
                    id="phone-input"
                    type="tel"
                    inputMode="numeric"
                    value={formatPhoneDisplay(phone)}
                    onChange={handlePhoneChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
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

              {/* Family Code Selection if multiple families */}
              {!invitedFamily && (
                <div>
                  <label className="block text-xs font-bold text-[#2D2825] mb-1">
                    รหัสครอบครัวที่ต้องการเข้า (Family Code)
                  </label>
                  <input
                    type="text"
                    value={selectedFamilyCode}
                    onChange={(e) => setSelectedFamilyCode(e.target.value.toUpperCase())}
                    placeholder="HOME-2026"
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-xs font-mono font-bold text-[#2D2825] focus:outline-none focus:border-[#5F8D75] focus:bg-white"
                  />
                  <p className="text-[9px] text-[#9E958D] mt-0.5">
                    (ค่าเริ่มต้น: HOME-2026 บ้านสุขใจ)
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={phone.length < 9 || isLoading}
                className="w-full py-3 bg-[#5F8D75] hover:bg-[#476E5B] text-white text-sm font-black rounded-2xl shadow-xs flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>รับรหัส OTP</span>
                    <ArrowRight size={16} weight="bold" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <span className="text-[10px] text-[#9E958D]">
                  💡 เบอร์ทดสอบในบ้าน: 0811111111 (พ่อ), 0822222222 (แม่)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: OTP VERIFICATION ================= */}
        {step === STEP.OTP && (
          <div className="bg-white rounded-3xl border border-[#ECE7DF] p-5 sm:p-6 shadow-xs animate-enter-rise space-y-4">
            <button
              type="button"
              onClick={() => setStep(STEP.PHONE)}
              className="flex items-center gap-1 text-xs text-[#5F8D75] font-bold hover:underline cursor-pointer"
            >
              <CaretLeft size={16} weight="bold" />
              <span>เปลี่ยนเบอร์โทรศัพท์</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FDF1EB] text-[#E88D67] flex items-center justify-center text-xl shrink-0">
                <Key size={20} weight="bold" />
              </div>
              <div>
                <h2 className="text-sm font-black text-[#2D2825]">ยืนยันรหัส OTP</h2>
                <p className="text-[11px] text-[#746C65]">ส่งไปยังเบอร์ {formatPhoneDisplay(phone)}</p>
              </div>
            </div>

            {/* Test Helper Banner */}
            <div className="p-3 rounded-2xl bg-[#EEF4F0] border border-[#5F8D75]/30 text-center space-y-1">
              <span className="text-[10px] font-black text-[#5F8D75] block">
                🔔 รหัส OTP จำลองสำหรับทดสอบ:
              </span>
              <p className="text-xl font-black text-[#2D2825] font-mono tracking-widest">
                {receivedOtp || '123456'}
              </p>
              <button
                type="button"
                onClick={() => {
                  const code = receivedOtp || '123456';
                  setOtpCode(code);
                  handleVerifyOtp(code);
                }}
                className="text-[10px] font-bold text-[#5F8D75] hover:underline cursor-pointer"
              >
                (แตะตรงนี้เพื่อกรอกอัตโนมัติทันที ⚡)
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#2D2825] mb-1 text-center">
                  กรอกรหัส 6 หลัก
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpCode(val);
                    setOtpError('');
                    if (val.length === 6) {
                      handleVerifyOtp(val);
                    }
                  }}
                  placeholder="• • • • • •"
                  className="w-full py-2.5 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-center text-xl font-mono tracking-widest font-black text-[#2D2825] focus:outline-none focus:border-[#5F8D75] focus:bg-white transition-all shadow-2xs"
                  autoFocus
                />
                {otpError && <p className="text-xs text-red-500 font-bold mt-1 text-center">{otpError}</p>}
              </div>

              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={otpCode.length < 6 || isLoading}
                className="w-full py-3 bg-[#5F8D75] hover:bg-[#476E5B] text-white text-sm font-black rounded-2xl shadow-xs flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>ยืนยันรหัส OTP</span>
                )}
              </button>

              <div className="text-center pt-1">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-xs text-[#5F8D75] font-bold hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
                  >
                    <ArrowClockwise size={14} weight="bold" />
                    <span>ขอรหัส OTP ใหม่</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-[#9E958D]">
                    ส่งรหัสอีกครั้งได้ใน {countdown} วินาที
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: SETUP PROFILE & JOIN FAMILY ================= */}
        {step === STEP.SETUP && (
          <div className="bg-white rounded-3xl border border-[#ECE7DF] p-5 sm:p-6 shadow-xs animate-enter-rise space-y-3.5">
            <div className="text-center pb-1">
              <span className="text-xs font-black text-[#5F8D75] bg-[#EEF4F0] px-2.5 py-0.5 rounded-full">
                ยืนยันเบอร์โทรสำเร็จ ✨
              </span>
              <h2 className="text-base font-black text-[#2D2825] mt-2">ตั้งค่าโปรไฟล์และขอเข้าบ้าน</h2>
              <p className="text-[11px] text-[#746C65]">เพื่อส่งให้ Admin ครอบครัวอนุมัติ</p>
            </div>

            {/* Avatar Selection */}
            <div className="flex flex-col items-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-18 h-18 rounded-3xl border-2 border-[#5F8D75] bg-[#FAF8F5] flex items-center justify-center cursor-pointer overflow-hidden shadow-xs hover:scale-105 transition-all relative group"
              >
                {useImageAvatar && avatarImage ? (
                  <img src={avatarImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">{selectedEmoji}</span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera size={20} weight="fill" />
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-[#5F8D75] font-bold mt-1.5 hover:underline cursor-pointer"
              >
                📸 อัปโหลดรูปภาพตัวเอง
              </button>
            </div>

            {/* Emoji Grid */}
            {!useImageAvatar && (
              <div className="grid grid-cols-6 gap-1 pt-1">
                {EMOJI_AVATARS.slice(0, 12).map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setSelectedEmoji(emoji);
                      setUseImageAvatar(false);
                    }}
                    className={`h-8 rounded-xl flex items-center justify-center text-base border transition-all cursor-pointer ${
                      selectedEmoji === emoji && !useImageAvatar
                        ? 'bg-[#EEF4F0] border-[#5F8D75] scale-105 font-bold shadow-2xs'
                        : 'bg-[#FAF8F5] border-[#ECE7DF]'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-[#2D2825] mb-1">
                ชื่อเล่นของคุณ
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น ปู่, ย่า, น้าปุ้ย, พี่กานต์"
                className="w-full px-3 py-2 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-xs font-bold text-[#2D2825] focus:outline-none focus:border-[#5F8D75] focus:bg-white"
                autoFocus
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-bold text-[#2D2825] mb-1">
                บทบาทในครอบครัว
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="เช่น คุณยาย, พี่ชาย, น้องสาว, น้า"
                className="w-full px-3 py-2 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-xs font-bold text-[#2D2825] focus:outline-none focus:border-[#5F8D75] focus:bg-white"
              />
            </div>

            {/* Target Family Info */}
            <div className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DF] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-[#746C65] block font-semibold">ขอเข้าร่วมครอบครัว:</span>
                <span className="font-bold text-[#2D2825]">
                  {invitedFamily?.name || currentFamily?.name || 'บ้านสุขใจ'}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-lg border border-[#ECE7DF]">
                {selectedFamilyCode}
              </span>
            </div>

            <button
              type="button"
              onClick={handleRegisterRequest}
              disabled={!name.trim() || isLoading}
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
          </div>
        )}

        {/* ================= STEP 4: PENDING APPROVAL ================= */}
        {step === STEP.PENDING && (
          <div className="bg-white rounded-3xl border border-[#ECE7DF] p-6 shadow-xs animate-enter-rise text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#FAF8F5] border border-[#ECE7DF] flex items-center justify-center text-3xl mx-auto shadow-2xs animate-pulse">
              ⏳
            </div>

            <div>
              <span className="text-[10px] font-black text-[#E88D67] bg-[#FDF1EB] px-2.5 py-0.8 rounded-full border border-[#E88D67]/20 uppercase">
                รอ Admin ยืนยันการเข้าครอบครัว
              </span>
              <h2 className="text-base font-black text-[#2D2825] mt-2">
                ส่งคำขอเรียบร้อยแล้ว!
              </h2>
              <p className="text-xs text-[#746C65] mt-1 leading-relaxed">
                คำขอของคุณถูกส่งไปยัง <span className="font-bold text-[#2D2825]">คุณพ่อ/คุณแม่ (Admin)</span> เรียบร้อยแล้ว เมื่อได้รับการอนุมัติ คุณจะสามารถเข้าใช้งาน HomeSpace ได้ทันที
              </p>
            </div>

            {/* Applicant Summary */}
            <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-left flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#ECE7DF] flex items-center justify-center text-xl overflow-hidden shrink-0">
                {currentUser?.avatarType === 'image' && currentUser?.avatarImage ? (
                  <img src={currentUser.avatarImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.avatar || '😊'
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
                  setStep(STEP.PHONE);
                }}
                className="text-xs text-[#746C65] hover:text-[#2D2825] hover:underline cursor-pointer block mx-auto py-1 font-semibold"
              >
                ออกจากระบบ / เข้าสู่ระบบด้วยเบอร์อื่น
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="py-2 text-center text-xs text-[#746C65]">
        <p>สร้างบรรยากาศบ้านที่อบอุ่นด้วยกันทุกวัน ❤️</p>
      </footer>
    </div>
  );
}
