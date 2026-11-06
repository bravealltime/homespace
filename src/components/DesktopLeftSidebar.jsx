import { useState } from 'react';
import {
  House,
  PushPin,
  CalendarBlank,
  UserCircle,
  Gift,
  ChartBar,
  ShieldCheck,
  DeviceMobile,
  Copy,
  Check,
  Sparkle,
  Wrench,
  BookBookmark,
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { getTreeStageInfo } from './FamilyTreeGarden';

export default function DesktopLeftSidebar({
  activeTab,
  onNavigateTab,
  onOpenAdmin,
  onOpenSummary,
  onOpenInstall,
  onOpenHandbook,
  onOpenGarden,
  onOpenLedger,
}) {
  const { currentUser, currentFamily, isAdmin } = useAuth();
  const { totalScoreMonth, backendMemberScores, treeState, t } = useApp();
  const [copiedCode, setCopiedCode] = useState(false);

  const familyCode = currentFamily?.code || 'HAPPY123';
  const familyName = currentFamily?.name || 'บ้านสุขใจ (Family Home)';
  const userScore = backendMemberScores?.[currentUser?.id] ?? currentUser?.points ?? 125;
  const jarPoints = totalScoreMonth || 100;
  const jarMax = 500;
  const jarPercent = Math.min(100, Math.round((jarPoints / jarMax) * 100));

  const treeLevel = treeState?.level || 1;
  const stageInfo = getTreeStageInfo(treeLevel);
  const treeExp = treeState?.exp || 0;
  const treeMaxExp = treeState?.maxExp || 20;
  const treePercent = Math.min(100, Math.round((treeExp / Math.max(1, treeMaxExp)) * 100));

  const copyCode = () => {
    navigator.clipboard?.writeText?.(familyCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const navItems = [
    { id: 'home', label: t('tabHome', 'ฟีดหน้าหลัก & งานบ้าน'), icon: House, count: null },
    { id: 'fridge', label: t('tabFridge', 'กระดานตู้เย็นดิจิทัล'), icon: PushPin, count: null },
    { id: 'calendar', label: t('tabCalendar', 'ปฏิทินครอบครัว & นัดหมาย'), icon: CalendarBlank, count: null },
    { id: 'my-feed', label: t('tabMyFeed', 'โพสต์ & ฟีดของฉัน'), icon: UserCircle, count: null },
    { id: 'rewards', label: t('tabRewards', 'ตู้รางวัล & โหวตของกิน'), icon: Gift, count: null },
  ];

  return (
    <aside className="w-72 xl:w-80 shrink-0 h-full overflow-y-auto no-scrollbar py-3 px-2 space-y-3 select-none">
      {/* 1. User Profile Mini Card (Facebook Style) */}
      <div
        onClick={() => onNavigateTab('my-feed')}
        className="p-3 rounded-2xl bg-white border border-[#ECE7DF] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-white shadow-2xs ring-2 ring-[#5F8D75]/30 shrink-0">
            {currentUser?.avatarType === 'image' && currentUser?.avatarImage ? (
              <img src={currentUser.avatarImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#FAF8F5] flex items-center justify-center text-xl font-bold">
                {currentUser?.avatar || '😊'}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-[#2D2825] truncate group-hover:text-[#5F8D75] transition-colors">
              {currentUser?.name || 'คุณ'}
            </h2>
            <p className="text-[11px] text-[#746C65] flex items-center gap-1">
              <span>{currentUser?.role || 'สมาชิกในบ้าน'}</span>
              <span>•</span>
              <span className="font-bold text-[#E88D67]">🪙 {userScore} แต้ม</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Family House & Points Jar Card */}
      <div className="p-3.5 rounded-2xl bg-white border border-[#ECE7DF] shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-xs font-black text-[#2D2825] truncate flex items-center gap-1.5">
              <span>🏡</span>
              <span>{familyName}</span>
            </h3>
            <p className="text-[10px] text-[#746C65]">รหัสบ้าน: <span className="font-mono font-bold text-[#2D2825]">{familyCode}</span></p>
          </div>
          <button
            type="button"
            onClick={copyCode}
            className="px-2 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#EEF4F0] border border-[#ECE7DF] text-[10px] font-bold text-[#5F8D75] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            title="คัดลอกรหัสบ้าน"
          >
            {copiedCode ? <Check size={12} weight="bold" /> : <Copy size={12} weight="bold" />}
            <span>{copiedCode ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
          </button>
        </div>

        {/* Jar Progress */}
        <div
          onClick={() => onNavigateTab('rewards')}
          className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECE7DF] hover:bg-[#F4F1EA] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-[11px] font-black text-[#2D2825] mb-1.5">
            <span className="flex items-center gap-1">
              <span>🍯</span>
              <span>โหลของบ้าน</span>
            </span>
            <span className="text-[#E88D67]">{jarPoints} / {jarMax} แต้ม ({jarPercent}%)</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#E5DFD5] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#5F8D75] to-[#7DAF94] transition-all duration-500"
              style={{ width: `${jarPercent}%` }}
            />
          </div>
          <p className="text-[9px] text-[#746C65] mt-1 text-right">
            สะสมอีก {Math.max(0, jarMax - jarPoints)} แต้ม เพื่อปลดล็อกรางวัล →
          </p>
        </div>

        {/* Tree Progress Quick Card */}
        <div
          onClick={onOpenGarden}
          className="p-2.5 rounded-xl bg-gradient-to-r from-[#EAF7ED] to-[#F3FAF4] border border-[#5F8D75]/25 hover:border-[#5F8D75]/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[11px] font-black text-[#2D2825] mb-1">
            <span className="flex items-center gap-1.5">
              <span>{stageInfo.emoji}</span>
              <span className="group-hover:text-[#5F8D75] transition-colors truncate max-w-[110px]">{stageInfo.name}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white font-mono text-[#5F8D75]">Lv.{treeLevel}</span>
            </span>
            <span className="text-blue-600 font-bold flex items-center gap-0.5 shrink-0">
              <span>💧</span> {treeState?.waterDrops || 0} หยด
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#5F8D75] to-[#60A5FA] transition-all duration-500"
              style={{ width: `${treePercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[9px] text-[#746C65] mt-1">
            <span>{treeExp} / {treeMaxExp} 💧</span>
            <span className="text-[#5F8D75] font-bold group-hover:underline">เปิดสวนของบ้าน →</span>
          </div>
        </div>
      </div>

      {/* 3. Facebook-Style Shortcuts Navigation */}
      <nav aria-label="ทางลัดเดสก์ท็อป" className="space-y-1">
        <p className="px-2 text-[10px] font-black uppercase tracking-wider text-[#9E958D]">เมนูด่วนของบ้าน</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigateTab(item.id)}
              className={`w-full px-3 py-2.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer text-left text-xs font-bold ${
                isActive
                  ? 'bg-[#EEF4F0] text-[#5F8D75] shadow-2xs font-black'
                  : 'text-[#2D2825] hover:bg-white hover:shadow-2xs'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 transition-all ${
                  isActive ? 'bg-[#5F8D75] text-white shadow-xs' : 'bg-[#FAF8F5] text-[#746C65]'
                }`}
              >
                <Icon size={18} weight={isActive ? 'fill' : 'bold'} />
              </div>
              <span className="truncate flex-1">{item.label}</span>
            </button>
          );
        })}

        {/* Family Summary Report Shortcut */}
        <button
          type="button"
          onClick={onOpenSummary}
          className="w-full px-3 py-2.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer text-left text-xs font-bold text-[#2D2825] hover:bg-white hover:shadow-2xs"
        >
          <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] text-[#E88D67] flex items-center justify-center text-base shrink-0">
            <ChartBar size={18} weight="bold" />
          </div>
          <span className="truncate flex-1">สรุปความร่วมมือของบ้าน</span>
        </button>

        {/* Home Handbook & Maintenance Shortcut */}
        <button
          type="button"
          onClick={onOpenHandbook}
          className="w-full px-3 py-2.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer text-left text-xs font-bold text-[#2D2825] hover:bg-white hover:shadow-2xs"
        >
          <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] text-[#5F8D75] flex items-center justify-center text-base shrink-0">
            <Wrench size={18} weight="bold" />
          </div>
          <span className="truncate flex-1">สมุดคู่มือบ้าน & เบอร์ช่าง</span>
        </button>

        {/* Family Ledger (สมุดเงินทอง ครอบครัว) */}
        <button
          type="button"
          onClick={onOpenLedger}
          className="w-full px-3 py-2.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer text-left text-xs font-bold text-[#2D2825] hover:bg-white hover:shadow-2xs group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-base shrink-0 group-hover:bg-amber-100 transition-colors">
            <BookBookmark size={18} weight="bold" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="truncate block">สมุดเงินทอง ครอบครัว</span>
            <span className="text-[10px] text-[#746C65] font-normal block truncate">รายรับ-รายจ่าย & บัญชีคนแก่</span>
          </div>
        </button>

        {/* Admin Family Management Shortcut */}
        {isAdmin && (
          <button
            type="button"
            onClick={onOpenAdmin}
            className="w-full px-3 py-2.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer text-left text-xs font-bold text-[#2D2825] hover:bg-white hover:shadow-2xs"
          >
            <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] text-[#5F8D75] flex items-center justify-center text-base shrink-0">
              <ShieldCheck size={18} weight="bold" />
            </div>
            <span className="truncate flex-1">จัดการสมาชิก & รหัสบ้าน</span>
          </button>
        )}

        {/* Install App Shortcut */}
        <button
          type="button"
          onClick={onOpenInstall}
          className="w-full px-3 py-2.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer text-left text-xs font-bold text-[#2D2825] hover:bg-white hover:shadow-2xs"
        >
          <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] text-[#3B82F6] flex items-center justify-center text-base shrink-0">
            <DeviceMobile size={18} weight="bold" />
          </div>
          <span className="truncate flex-1">ติดตั้งแอปบนมือถือ (PWA / APK)</span>
        </button>
      </nav>

      {/* 4. Footer Warm Note */}
      <div className="pt-2 px-2 text-[10px] text-[#9E958D] space-y-1">
        <p className="font-semibold">HomeSpace · Our Family Space 🏡</p>
        <p>บันทึกความอบอุ่น ความสุข และงานบ้าน</p>
      </div>
    </aside>
  );
}
