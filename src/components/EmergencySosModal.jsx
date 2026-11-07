import { useState, useEffect, useRef } from 'react';
import {
  WarningOctagon,
  PhoneCall,
  ChatCircleText,
  MapPin,
  X,
  CheckCircle,
  SpeakerHigh,
  Copy,
  Check,
  FirstAid,
  ShieldWarning,
  NavigationArrow,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { speakThai, stopSpeaking } from '../utils/speechHelper';

export default function EmergencySosModal({ isOpen, onClose, initialCountdown = true }) {
  const { currentUser, members } = useAuth();
  const { activeSosAlert, triggerSos, resolveSos, seniorMode, t } = useApp();

  const [countdown, setCountdown] = useState(5);
  const [isCountingDown, setIsCountingDown] = useState(initialCountdown && !activeSosAlert);
  const [coords, setCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState('กำลังระบุพิกัด GPS...');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const countdownIntervalRef = useRef(null);

  // Determine whether current user is the one who called SOS or a family responder
  const isSender = activeSosAlert?.memberId === currentUser?.id || !activeSosAlert;
  const alertMemberName = activeSosAlert?.memberName || currentUser?.name || 'สมาชิกในบ้าน';
  const alertMapsUrl =
    activeSosAlert?.mapsUrl ||
    (coords ? `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}` : null);

  // 1. Fetch GPS Location automatically
  useEffect(() => {
    if (!isOpen) return;

    if (navigator.geolocation) {
      setLocationStatus('กำลังค้นหาพิกัดดาวเทียม GPS...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
          });
          setLocationStatus(`พิกัดแม่นยำระยะ ${Math.round(pos.coords.accuracy)} ม.`);
        },
        (err) => {
          console.warn('Geolocation warning:', err.message);
          setLocationStatus('ใช้พิกัดที่อยู่บ้านสุขใจ (ไม่พบดาวเทียม GPS)');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationStatus('ใช้พิกัดที่อยู่บ้านสุขใจ');
    }
  }, [isOpen]);

  // 2. Handle Countdown Timer (5s Accidental Tap Protection)
  useEffect(() => {
    if (!isOpen) {
      clearInterval(countdownIntervalRef.current);
      setCountdown(5);
      setIsCountingDown(false);
      return;
    }

    if (activeSosAlert) {
      // If there is already an active alert, don't countdown, show emergency view directly
      setIsCountingDown(false);
      return;
    }

    if (initialCountdown) {
      setIsCountingDown(true);
      setCountdown(5);
      speakThai('กำลังจะส่งสัญญาณขอความช่วยเหลือฉุกเฉินใน 5 วินาทีค่ะ หากกดผิดสามารถกดยกเลิกได้นะคะ');

      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            handleActivateSos();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(countdownIntervalRef.current);
  }, [isOpen, activeSosAlert]);

  // 3. Trigger SOS Action
  const handleActivateSos = async () => {
    clearInterval(countdownIntervalRef.current);
    setIsCountingDown(false);
    setIsSubmitting(true);

    try {
      await triggerSos({
        latitude: coords?.latitude || null,
        longitude: coords?.longitude || null,
        address: 'บ้านสุขใจ (Family Home)',
        note: 'ขอความช่วยเหลือฉุกเฉิน หน้ามืด หกล้ม หรือมีอาการผิดปกติ',
      });

      speakThai(
        `ส่งสัญญาณขอความช่วยเหลือและพิกัดไปยังลูกหลานทุกคนแล้วค่ะ หากต้องการเรียกรถพยาบาล สามารถแตะปุ่มสีแดงโทร 1669 ได้ทันทีนะคะ`
      );
    } catch (err) {
      console.error('Trigger SOS error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Cancel Countdown (Accidental Tap)
  const handleCancelCountdown = () => {
    clearInterval(countdownIntervalRef.current);
    stopSpeaking();
    setIsCountingDown(false);
    onClose();
  };

  // 5. Resolve SOS (Mark Safe)
  const handleResolve = async () => {
    if (!activeSosAlert?.id) {
      onClose();
      return;
    }
    setIsResolving(true);
    try {
      await resolveSos(activeSosAlert.id, 'ปลอดภัยเรียบร้อยแล้ว');
      speakThai('ยกเลิกสัญญาณขอความช่วยเหลือแล้วค่ะ ขอบคุณที่ปลอดภัยนะคะ');
      onClose();
    } catch (err) {
      console.error('Resolve SOS error:', err);
    } finally {
      setIsResolving(false);
    }
  };

  const copyMapsLink = () => {
    if (alertMapsUrl) {
      navigator.clipboard?.writeText?.(alertMapsUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (!isOpen) return null;

  // Filter other family members with phone numbers
  const otherMembersWithPhone = (members || []).filter(
    (m) => m.id !== (activeSosAlert?.memberId || currentUser?.id) && m.phone
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fadeIn select-none"
      onClick={isCountingDown ? handleCancelCountdown : onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-rose-500/80 flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============================================================== */}
        {/* A. 5-SECOND ACCIDENTAL TAP COUNTDOWN SCREEN                     */}
        {/* ============================================================== */}
        {isCountingDown ? (
          <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-5 bg-gradient-to-b from-rose-50 via-white to-white">
            {/* Header Badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-700 font-black text-xs">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              <span>ระบบป้องกันการกดโดนโดยไม่ได้ตั้งใจ</span>
            </div>

            {/* Pulsing Countdown Clock Circle */}
            <div className="relative w-36 h-36 flex items-center justify-center my-2">
              <div className="absolute inset-0 rounded-full border-4 border-rose-200 animate-ping opacity-75" />
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-rose-500 to-red-600 flex flex-col items-center justify-center text-white shadow-xl shadow-rose-200 border-4 border-white">
                <span className="text-5xl font-black font-mono leading-none">{countdown}</span>
                <span className="text-[11px] font-bold mt-1 text-rose-100">วินาที</span>
              </div>
            </div>

            <div className="space-y-1 max-w-sm">
              <h2 className="text-xl sm:text-2xl font-black text-[#2D2825]">
                กำลังส่งสัญญาณ SOS ด่วน!
              </h2>
              <p className="text-xs sm:text-sm text-[#746C65] font-medium leading-relaxed">
                ระบบกำลังเตรียมโทรออก และส่งพิกัด GPS ไปยังลูกหลานทุกคนในบ้าน
              </p>
            </div>

            {/* Action Buttons: Instant Bypass or Cancel */}
            <div className="w-full space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleActivateSos}
                className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-300 transition-all cursor-pointer active:scale-95"
              >
                <WarningOctagon size={22} weight="fill" className="shrink-0" />
                <span className="leading-snug break-words">ส่งสัญญาณและโทรทันที (ไม่ต้องรอ 5 วิ)</span>
              </button>

              <button
                type="button"
                onClick={handleCancelCountdown}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#FAF8F5] hover:bg-[#ECE7DF] text-[#746C65] hover:text-[#2D2825] font-black text-sm border border-[#ECE7DF] transition-all cursor-pointer active:scale-95"
              >
                <span>✕ ยกเลิก (กดผิด)</span>
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* B. ACTIVE EMERGENCY HUB (ฉุกเฉิน พร้อมโทร 1669 & ลูกหลาน)        */
          /* ============================================================== */
          <>
            {/* Top Red Beacon Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl border border-white/30 animate-bounce">
                  🚨
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black leading-tight">
                      สัญญาณฉุกเฉิน SOS ของบ้าน
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-white text-red-600 text-[10px] font-black animate-pulse">
                      LIVE
                    </span>
                  </div>
                  <p className="text-xs text-rose-100">
                    {activeSosAlert
                      ? `ผู้ขอความช่วยเหลือ: ${alertMemberName}`
                      : 'เตรียมพร้อมโทรช่วยเหลือทันที 24 ชม.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-5 space-y-4">
              {/* 1. TOP PRIMARY EMERGENCY ACTION: 1669 CALL (EXTRA LARGE HIGH-CONTRAST) */}
              <div className="p-4 rounded-3xl bg-red-50 border-2 border-red-300 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FirstAid size={22} weight="fill" className="text-red-600" />
                    <span className="text-xs font-black text-red-950 uppercase tracking-wide">
                      รถพยาบาลกู้ชีพฉุกเฉิน (ฟรี ทั่วไทย)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                    24 ชั่วโมง
                  </span>
                </div>

                <a
                  href="tel:1669"
                  className="w-full py-3.5 sm:py-4 px-4 sm:px-5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-sm sm:text-base md:text-lg flex items-center justify-center gap-2.5 shadow-lg shadow-red-200 transition-all cursor-pointer active:scale-95 text-center leading-snug"
                >
                  <PhoneCall size={24} weight="fill" className="animate-pulse shrink-0" />
                  <span className="leading-snug">โทร 1669 (สายด่วนแพทย์กู้ชีพ)</span>
                </a>

                <p className="text-[11px] text-red-800 text-center font-medium">
                  แตะปุ่มเพื่อต่อสายไปยังศูนย์สั่งการรถพยาบาลฉุกเฉินทันที
                </p>
              </div>

              {/* 2. FAMILY CONTACTS 1-TAP CALL & SMS (โทร/ส่งข้อความหาลูกหลานทุกคน) */}
              <div className="p-4 rounded-3xl bg-[#FAF8F5] border border-[#ECE7DF] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PhoneCall size={18} weight="bold" className="text-[#5F8D75]" />
                    <h3 className="text-xs font-black text-[#2D2825]">
                      โทรหาลูกหลานในบ้านทันที ({otherMembersWithPhone.length} คน)
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#746C65] font-semibold">แตะโทรหรือส่ง SMS</span>
                </div>

                <div className="space-y-2">
                  {otherMembersWithPhone.map((m) => {
                    const smsMessage = encodeURIComponent(
                      `🚨 ขอความช่วยเหลือด่วน! ${currentUser?.name || 'คนในบ้าน'} กดส่งสัญญาณ SOS พิกัด: ${
                        alertMapsUrl || 'บ้านสุขใจ'
                      } กรุณาโทรกลับด่วน!`
                    );

                    return (
                      <div
                        key={m.id}
                        className="p-3 rounded-2xl bg-white border border-[#ECE7DF] shadow-2xs flex items-center justify-between gap-2"
                      >
                        {/* Member Identity */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#ECE7DF] flex items-center justify-center font-bold text-base shrink-0 overflow-hidden">
                            {m.avatarType === 'image' && m.avatarImage ? (
                              <img src={m.avatarImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{m.avatar || '😊'}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-[#2D2825] truncate">{m.name}</h4>
                            <p className="text-[11px] text-[#746C65] font-mono font-bold truncate">
                              {m.phone}
                            </p>
                          </div>
                        </div>

                        {/* Direct Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* SMS Button */}
                          <a
                            href={`sms:${m.phone}?body=${smsMessage}`}
                            className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors cursor-pointer"
                            title="ส่งข้อความ SMS ด่วนพร้อมพิกัด"
                          >
                            <ChatCircleText size={18} weight="bold" />
                          </a>

                          {/* Direct Phone Call Button */}
                          <a
                            href={`tel:${m.phone}`}
                            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
                            title={`โทรหา ${m.name}`}
                          >
                            <PhoneCall size={16} weight="fill" className="shrink-0" />
                            <span className="whitespace-nowrap">โทร</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. LIVE GPS LOCATION & MAPS NAVIGATION */}
              <div className="p-4 rounded-3xl bg-white border border-[#ECE7DF] shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} weight="fill" className="text-rose-500" />
                    <h3 className="text-xs font-black text-[#2D2825]">พิกัดตำแหน่งปัจจุบัน</h3>
                  </div>
                  <span className="text-[10px] text-[#5F8D75] font-bold">{locationStatus}</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DF] space-y-2">
                  <p className="text-xs font-mono font-bold text-[#2D2825] break-words">
                    {coords
                      ? `ละติจูด ${coords.latitude.toFixed(6)}, ลองจิจูด ${coords.longitude.toFixed(6)}`
                      : 'ที่อยู่: บ้านสุขใจ (Family Home)'}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    {alertMapsUrl && (
                      <a
                        href={alertMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                      >
                        <NavigationArrow size={14} weight="bold" />
                        <span>เปิด Google Maps</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={copyMapsLink}
                      className="py-2 px-3 rounded-xl bg-white hover:bg-[#EEF4F0] border border-[#ECE7DF] text-xs font-bold text-[#746C65] hover:text-[#2D2825] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedLink ? <Check size={14} weight="bold" className="text-emerald-600" /> : <Copy size={14} weight="bold" />}
                      <span>{copiedLink ? 'คัดลอกแล้ว' : 'คัดลอกพิกัด'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. OTHER EMERGENCY HOTLINES (191 ตำรวจ, 199 ดับเพลิง) */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <a
                  href="tel:191"
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚓</span>
                    <div>
                      <p className="font-black text-xs leading-tight">โทร 191</p>
                      <p className="text-[10px] text-slate-500">ตำรวจ/เหตุด่วน</p>
                    </div>
                  </div>
                  <PhoneCall size={16} weight="bold" className="text-slate-600" />
                </a>

                <a
                  href="tel:199"
                  className="p-3 rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-950 font-bold flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚒</span>
                    <div>
                      <p className="font-black text-xs leading-tight">โทร 199</p>
                      <p className="text-[10px] text-orange-600">ดับเพลิง/สัตว์มีพิษ</p>
                    </div>
                  </div>
                  <PhoneCall size={16} weight="bold" className="text-orange-600" />
                </a>
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-4 border-t border-[#ECE7DF] bg-[#FAF8F5] flex items-center justify-between shrink-0 gap-2">
              <button
                type="button"
                onClick={handleResolve}
                disabled={isResolving}
                className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <CheckCircle size={18} weight="bold" />
                <span>ฉันปลอดภัยแล้ว (ปิดสัญญาณฉุกเฉิน)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-2xl bg-white hover:bg-[#ECE7DF] border border-[#ECE7DF] text-[#746C65] font-bold text-xs transition-colors cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// PERSISTENT SOS ALERT BANNER ACROSS ALL PAGES
// ==========================================
export function EmergencySosBanner({ onOpenSosModal }) {
  const { activeSosAlert } = useApp();

  if (!activeSosAlert) return null;

  return (
    <div
      onClick={onOpenSosModal}
      className="sticky top-0 z-45 w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-3 sm:px-4 py-2.5 shadow-md flex items-center justify-between cursor-pointer animate-pulse select-none"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-lg shrink-0">🚨</span>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-black leading-tight break-words">
            สัญญาณฉุกเฉิน SOS! {activeSosAlert.memberName} กำลังขอความช่วยเหลือ
          </p>
          <p className="text-[10px] text-rose-100 leading-tight mt-0.5">
            {activeSosAlert.mapsUrl ? 'มีพิกัดดาวเทียม GPS พร้อมนำทาง' : 'แตะเพื่อเปิดดูพิกัด & โทรกลับทันที'}
          </p>
        </div>
      </div>

      <button
        type="button"
        className="px-3 py-1 rounded-xl bg-white text-red-600 font-black text-xs shrink-0 shadow-xs hover:bg-rose-50 transition-colors whitespace-nowrap ml-2"
      >
        ช่วยเหลือด่วน →
      </button>
    </div>
  );
}
