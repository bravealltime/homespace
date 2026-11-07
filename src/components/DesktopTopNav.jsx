import {
  House,
  PushPin,
  CalendarBlank,
  UserCircle,
  Gift,
  MagnifyingGlass,
  Bell,
  ShieldCheck,
  UsersThree,
  TextAa,
  Globe,
  SignOut,
  CaretDown,
} from '@phosphor-icons/react';
import HomeSpaceLogo from './HomeSpaceLogo';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function DesktopTopNav({
  activeTab,
  onNavigateTab,
  onOpenSearch,
  onOpenNotifications,
  onOpenAdmin,
  onOpenMembers,
  onOpenProfile,
  onOpenSos,
  onOpenQuickMenu,
  onOpenLedger,
}) {
  const { currentUser, currentFamily, isAdmin, pendingRequests } = useAuth();
  const {
    seniorMode,
    toggleSeniorMode,
    language,
    toggleLanguage,
    notifications,
    t,
  } = useApp();

  const myNotifications = (notifications || []).filter(
    (n) => n.recipientId === currentUser?.id
  );
  const unreadCount = myNotifications.filter((n) => !n.isRead).length;

  const tabs = [
    { id: 'home', label: t('tabHome', 'หน้าหลัก'), icon: House },
    { id: 'fridge', label: t('tabFridge', 'กระดานตู้เย็น'), icon: PushPin },
    { id: 'calendar', label: t('tabCalendar', 'ปฏิทินบ้าน'), icon: CalendarBlank },
    { id: 'my-feed', label: t('tabMyFeed', 'โพสต์ของฉัน'), icon: UserCircle },
    { id: 'rewards', label: t('tabRewards', 'ของรางวัล'), icon: Gift },
  ];

  return (
    <header className="sticky top-0 z-40 h-14 bg-white/95 backdrop-blur-md border-b border-[#ECE7DF] px-4 shadow-2xs flex items-center justify-between select-none">
      {/* LEFT: Brand Logo + Family Badge + Search Input */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          onClick={() => onNavigateTab('home')}
          className="flex items-center gap-2.5 cursor-pointer shrink-0 group"
          title="HomeSpace หน้าหลัก"
        >
          <HomeSpaceLogo size={36} rounded="rounded-xl" className="shadow-xs group-hover:scale-105 transition-transform" />
          <div className="hidden sm:block">
            <h1 className="text-sm font-black text-[#2D2825] leading-tight tracking-tight">HomeSpace</h1>
            <p className="text-[9px] text-[#746C65]">{currentFamily?.name || 'บ้านสุขใจ'}</p>
          </div>
        </div>

        {/* Facebook-style Search Bar Input */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-48 xl:w-60 bg-[#FAF8F5] hover:bg-white border border-[#ECE7DF] hover:border-[#5F8D75]/40 rounded-full px-3.5 py-1.5 flex items-center gap-2 text-xs text-[#746C65] transition-all cursor-pointer shadow-2xs"
          title="ค้นหาคนในบ้าน กิจกรรม หรืองานบ้าน"
        >
          <MagnifyingGlass size={15} weight="bold" className="text-[#9E958D]" />
          <span className="truncate">ค้นหาใน HomeSpace...</span>
        </button>
      </div>

      {/* CENTER: Iconic Facebook 5-Tab Navigation Bar */}
      <nav aria-label="แถบเมนูหลัก" className="flex items-center gap-1 sm:gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigateTab(tab.id)}
              className={`relative h-12 px-4 sm:px-6 rounded-xl flex items-center justify-center transition-all cursor-pointer group ${
                isActive ? 'text-[#5F8D75]' : 'text-[#746C65] hover:bg-[#FAF8F5] hover:text-[#2D2825]'
              }`}
              title={tab.label}
            >
              <div className="flex flex-col items-center justify-center">
                <Icon size={24} weight={isActive ? 'fill' : 'bold'} className="transition-transform group-hover:scale-110" />
                <span className={`text-[10px] font-bold mt-0.5 hidden xl:block whitespace-nowrap ${isActive ? 'text-[#5F8D75] font-black' : 'text-[#746C65]'}`}>
                  {tab.label}
                </span>
              </div>
              {/* Facebook Active Bottom Indicator Bar */}
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-1 rounded-full bg-[#5F8D75]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* RIGHT: Actions + Notifications + Profile Hub */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Red Emergency SOS Button */}
        <button
          type="button"
          onClick={onOpenSos}
          className="h-8.5 px-3 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 animate-pulse shrink-0"
          title="ปุ่มขอความช่วยเหลือฉุกเฉิน (SOS)"
        >
          <span className="text-sm">🚨</span>
          <span className="tracking-wide">SOS</span>
        </button>

        {/* Family Ledger Quick Icon */}
        <button
          type="button"
          onClick={onOpenLedger}
          className="h-8.5 px-2.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          title="สมุดเงินทอง ครอบครัว (บันทึกรายรับ-รายจ่าย)"
        >
          <span className="text-sm">📒</span>
          <span className="hidden xl:inline">สมุดเงิน</span>
        </button>

        {/* Notification Bell with Badge */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative w-8.5 h-8.5 rounded-full flex items-center justify-center text-[#746C65] hover:text-[#2D2825] bg-[#FAF8F5] hover:bg-[#F2EFEA] border border-[#ECE7DF] transition-colors cursor-pointer"
          title="การแจ้งเตือน"
        >
          <Bell
            size={18}
            weight={unreadCount > 0 ? 'fill' : 'bold'}
            className={unreadCount > 0 ? 'text-[#E88D67]' : 'text-[#746C65]'}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#E88D67] text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-xs">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile & House Center Pill (Avatar + Name + CaretDown) */}
        <button
          type="button"
          onClick={onOpenQuickMenu || onOpenProfile}
          className="relative h-8.5 p-1 pr-3 rounded-full bg-[#FAF8F5] hover:bg-[#F2EFEA] border border-[#ECE7DF] hover:border-[#5F8D75]/40 flex items-center gap-2 cursor-pointer transition-all ml-0.5 shadow-2xs group"
          title="ศูนย์จัดการบ้าน & ข้อมูลโปรไฟล์"
        >
          <div className="w-6.5 h-6.5 rounded-full overflow-hidden bg-white border border-[#ECE7DF] shrink-0">
            {currentUser?.avatarType === 'image' && currentUser?.avatarImage ? (
              <img src={currentUser.avatarImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                {currentUser?.avatar || '😊'}
              </div>
            )}
          </div>
          <span className="text-xs font-black text-[#2D2825] max-w-[100px] truncate">
            {currentUser?.name || 'คุณ'}
          </span>
          <CaretDown size={12} weight="bold" className="text-[#9E958D] group-hover:text-[#2D2825] transition-transform" />

          {/* Admin Pending Requests Warning Badge */}
          {isAdmin && pendingRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
