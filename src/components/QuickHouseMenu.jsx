import { useState } from 'react';
import {
  TextAa,
  Globe,
  ShieldCheck,
  UsersThree,
  UserCircle,
  Wrench,
  SignOut,
  X,
  Check,
  CaretRight,
  Sparkle,
  GearSix,
  Heart,
  House,
  Broadcast,
  PencilSimple,
  ArrowClockwise,
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { getApiBaseUrl, setCustomApiUrl, DEFAULT_LAN_API_URL } from '../services/api';

export default function QuickHouseMenu({
  isOpen,
  onClose,
  onOpenProfile,
  onOpenAdmin,
  onOpenMembers,
  onOpenHandbook,
  onNavigateTab,
  onLogout,
}) {
  const { currentUser, currentFamily, isAdmin, pendingRequests, members } = useAuth();
  const {
    seniorMode,
    toggleSeniorMode,
    language,
    setLanguage,
    backendMemberScores,
    t,
  } = useApp();

  if (!isOpen) return null;

  const userScore = backendMemberScores?.[currentUser?.id] ?? currentUser?.points ?? 0;
  const activeMembersCount = (members || []).filter((m) => m.status !== 'pending').length;

  const [isEditingServer, setIsEditingServer] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(() => getApiBaseUrl());
  const [serverSaveSuccess, setServerSaveSuccess] = useState(false);

  const handleSaveServer = (e) => {
    e.preventDefault();
    setCustomApiUrl(serverUrlInput);
    setServerSaveSuccess(true);
    setTimeout(() => {
      setServerSaveSuccess(false);
      setIsEditingServer(false);
      window.location.reload();
    }, 600);
  };

  const handleResetServer = () => {
    setCustomApiUrl('');
    setServerUrlInput(DEFAULT_LAN_API_URL);
    setServerSaveSuccess(true);
    setTimeout(() => {
      setServerSaveSuccess(false);
      setIsEditingServer(false);
      window.location.reload();
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs select-none animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#ECE7DF] flex flex-col max-h-[88vh] overflow-hidden animate-enter-rise"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Indicator */}
        <div className="w-12 h-1 bg-[#ECE7DF] rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* 1. Header & Close Button */}
        <div className="px-4 py-3 sm:p-4 border-b border-[#ECE7DF] bg-[#FAF8F5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏡</span>
            <div>
              <h2 className="text-sm font-black text-[#2D2825]">
                {currentFamily?.name || 'บ้านสุขใจ'}
              </h2>
              <p className="text-[10px] text-[#746C65]">ศูนย์จัดการบ้าน & การตั้งค่าด่วน</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#ECE7DF] text-[#746C65] hover:text-[#2D2825] flex items-center justify-center border border-[#ECE7DF] transition-colors cursor-pointer"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* 2. Scrollable Menu Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3.5">
          {/* User Profile Card */}
          <div
            onClick={() => {
              onClose();
              if (onNavigateTab) onNavigateTab('my-feed');
            }}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FAF8F5] to-[#F3F0EA] border border-[#ECE7DF] hover:border-[#5F8D75]/40 transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white border-2 border-white shadow-2xs ring-2 ring-[#5F8D75]/30 shrink-0">
                {currentUser?.avatarType === 'image' && currentUser?.avatarImage ? (
                  <img src={currentUser.avatarImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-[#FAF8F5]">
                    {currentUser?.avatar || '😊'}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-[#2D2825] truncate group-hover:text-[#5F8D75] transition-colors">
                    {currentUser?.name || 'คุณ'}
                  </h3>
                  {isAdmin && (
                    <span className="text-[9px] font-black text-[#5F8D75] bg-[#EEF4F0] px-1.5 py-0.2 rounded-md shrink-0">
                      เจ้าบ้าน
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#746C65] truncate flex items-center gap-1.5 mt-0.5">
                  <span>{currentUser?.role || 'สมาชิก'}</span>
                  <span>•</span>
                  <span className="font-bold text-[#E88D67]">🪙 {userScore} แต้ม</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold text-[#5F8D75] shrink-0 group-hover:translate-x-0.5 transition-transform">
              <span>ฟีดของฉัน</span>
              <CaretRight size={13} weight="bold" />
            </div>
          </div>

          {/* Quick Display & Accessibility Preferences (Senior Mode & Language) */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#ECE7DF] shadow-2xs space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-[#9E958D]">
              การแสดงผล & ความสบายตา
            </h4>

            {/* Senior Mode Toggle (โหมดตัวหนังสือใหญ่/สบายตา) */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  seniorMode ? 'bg-[#5F8D75] text-white shadow-2xs' : 'bg-[#FAF8F5] text-[#746C65] border border-[#ECE7DF]'
                }`}>
                  <TextAa size={20} weight={seniorMode ? 'bold' : 'regular'} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-[#2D2825] truncate">
                    {t('seniorModeTitle', 'โหมดตัวหนังสือใหญ่ (สบายตา)')}
                  </p>
                  <p className="text-[10px] text-[#746C65] truncate">
                    {seniorMode ? 'เปิดใช้งานอยู่ (ตัวอักษรใหญ่ สบายตา)' : 'ขยายฟอนต์และไอคอนให้อ่านง่ายสำหรับผู้ใหญ่'}
                  </p>
                </div>
              </div>

              {/* iOS Style Switch */}
              <button
                type="button"
                onClick={toggleSeniorMode}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  seniorMode ? 'bg-[#5F8D75]' : 'bg-[#E5DFD5]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    seniorMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Language Switcher Segmented Control */}
            <div className="pt-2 border-t border-[#ECE7DF]/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#ECE7DF] flex items-center justify-center text-[#746C65] shrink-0">
                  <Globe size={16} weight="bold" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#2D2825]">ภาษาของแอป (Language)</p>
                  <p className="text-[10px] text-[#746C65]">สลับภาษาไทย / English</p>
                </div>
              </div>

              {/* Segmented Switch */}
              <div className="flex p-0.5 rounded-xl bg-[#FAF8F5] border border-[#ECE7DF] shrink-0">
                <button
                  type="button"
                  onClick={() => setLanguage('th')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                    language === 'th'
                      ? 'bg-white text-[#2D2825] shadow-2xs'
                      : 'text-[#746C65] hover:text-[#2D2825]'
                  }`}
                >
                  ไทย
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                    language === 'en'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-[#746C65] hover:text-[#2D2825]'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>

          {/* House Management & Tools */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#ECE7DF] shadow-2xs space-y-1">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-[#9E958D] mb-1.5">
              เมนูบ้าน & สมาชิก
            </h4>

            {/* 1. สมาชิกในบ้าน (Family Directory) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenMembers) onOpenMembers();
              }}
              className="w-full p-2.5 rounded-xl hover:bg-[#FAF8F5] transition-colors cursor-pointer flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#EEF4F0] text-[#5F8D75] flex items-center justify-center shrink-0">
                  <UsersThree size={18} weight="bold" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-[#2D2825] group-hover:text-[#5F8D75] transition-colors truncate">
                    สมาชิกในบ้าน
                  </p>
                  <p className="text-[10px] text-[#746C65] truncate">
                    {activeMembersCount} คนในครอบครัว
                  </p>
                </div>
              </div>
              <CaretRight size={14} weight="bold" className="text-[#9E958D] group-hover:text-[#5F8D75]" />
            </button>

            {/* 2. จัดการครอบครัว (Admin & Invites) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAdmin) onOpenAdmin();
                }}
                className="w-full p-2.5 rounded-xl hover:bg-[#FAF8F5] transition-colors cursor-pointer flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} weight="bold" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-black text-[#2D2825] group-hover:text-amber-800 transition-colors truncate">
                        จัดการบ้าน & คำขอเข้า
                      </p>
                      {pendingRequests.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse">
                          {pendingRequests.length} คำขอ
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#746C65] truncate">
                      รหัสเชิญสมาชิก & ตั้งค่าบ้าน
                    </p>
                  </div>
                </div>
                <CaretRight size={14} weight="bold" className="text-[#9E958D] group-hover:text-amber-700" />
              </button>
            )}

            {/* 3. สมุดคู่มือบ้าน & เบอร์ช่างฉุกเฉิน */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenHandbook) onOpenHandbook();
              }}
              className="w-full p-2.5 rounded-xl hover:bg-[#FAF8F5] transition-colors cursor-pointer flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#FDF1EB] text-[#E88D67] flex items-center justify-center shrink-0">
                  <Wrench size={18} weight="bold" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-[#2D2825] group-hover:text-[#E88D67] transition-colors truncate">
                    สมุดคู่มือบ้าน & เบอร์ช่าง
                  </p>
                  <p className="text-[10px] text-[#746C65] truncate">
                    เบอร์ช่างแอร์ ช่างไฟ & ประวัติซ่อมบำรุง
                  </p>
                </div>
              </div>
              <CaretRight size={14} weight="bold" className="text-[#9E958D] group-hover:text-[#E88D67]" />
            </button>

            {/* 4. แก้ไขข้อมูลส่วนตัว & รหัส PIN */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenProfile) onOpenProfile();
              }}
              className="w-full p-2.5 rounded-xl hover:bg-[#FAF8F5] transition-colors cursor-pointer flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#ECE7DF] text-[#746C65] flex items-center justify-center shrink-0">
                  <GearSix size={18} weight="bold" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-[#2D2825] group-hover:text-[#2D2825] transition-colors truncate">
                    แก้ไขโปรไฟล์ & รหัส PIN
                  </p>
                  <p className="text-[10px] text-[#746C65] truncate">
                    เปลี่ยนรูปภาพ ชื่อ และรหัสผ่าน 4 หลัก
                  </p>
                </div>
              </div>
              <CaretRight size={14} weight="bold" className="text-[#9E958D]" />
            </button>
          </div>

          {/* Server Connection Settings Card (For Android APK / Wi-Fi Sync) */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#ECE7DF] shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#5F8D75] flex items-center justify-center">
                  <Broadcast size={18} weight="bold" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#2D2825]">
                    การเชื่อมต่อเซิร์ฟเวอร์บ้าน
                  </h4>
                  <p className="text-[10px] text-[#746C65]">เซิร์ฟเวอร์ฐานข้อมูล & การซิงก์ APK</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingServer(!isEditingServer)}
                className="text-[11px] font-bold text-[#5F8D75] hover:underline cursor-pointer flex items-center gap-1"
              >
                <PencilSimple size={12} weight="bold" />
                <span>{isEditingServer ? 'ยกเลิก' : 'ตั้งค่า IP'}</span>
              </button>
            </div>

            <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#ECE7DF] text-[11px] font-mono text-[#57534E] break-all flex items-center justify-between gap-2">
              <span className="truncate">{getApiBaseUrl()}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="พร้อมเชื่อมต่อ" />
            </div>

            {isEditingServer && (
              <form onSubmit={handleSaveServer} className="pt-2 border-t border-[#ECE7DF] space-y-2">
                <label className="block text-[10px] font-bold text-[#746C65]">
                  ระบุ IP คอมพิวเตอร์ เช่น http://192.168.1.42:3001/api
                </label>
                <input
                  type="text"
                  value={serverUrlInput}
                  onChange={(e) => setServerUrlInput(e.target.value)}
                  placeholder="http://192.168.1.42:3001/api"
                  className="w-full px-3 py-1.5 rounded-xl border border-[#ECE7DF] text-xs font-mono bg-white focus:outline-hidden focus:border-[#5F8D75]"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 rounded-xl bg-[#5F8D75] text-white text-xs font-bold hover:bg-[#4E7661] transition-colors cursor-pointer"
                  >
                    {serverSaveSuccess ? '✓ บันทึกแล้ว' : 'บันทึก & รีโหลด'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetServer}
                    className="px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#ECE7DF] text-[11px] text-[#746C65] hover:bg-[#ECE7DF] cursor-pointer"
                    title="คืนค่าเริ่มต้น"
                  >
                    รีเซ็ต
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onLogout) onLogout();
            }}
            className="w-full py-3 px-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-2 border border-rose-200/80 transition-colors cursor-pointer"
          >
            <SignOut size={16} weight="bold" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
