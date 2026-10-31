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
                <span className={`text-[10px] font-bold mt-0.5 hidden xl:block ${isActive ? 'text-[#5F8D75] font-black' : 'text-[#746C65]'}`}>
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

      {/* RIGHT: Actions + Notifications + Profile Pill */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Senior & Easy-Reading Mode */}
        <button
          type="button"
          onClick={toggleSeniorMode}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
            seniorMode
              ? 'bg-[#5F8D75] text-white border-[#5F8D75] shadow-xs'
              : 'bg-[#FAF8F5] text-[#746C65] hover:text-[#2D2825] border-[#ECE7DF]'
          }`}
          title={seniorMode ? 'ปิดโหมดตัวหนังสือใหญ่' : 'เปิดโหมดตัวหนังสือใหญ่ (สบายตา)'}
        >
          <TextAa size={16} weight={seniorMode ? 'bold' : 'regular'} />
        </button>

        {/* Language Switcher */}
        <button
          type="button"
          onClick={toggleLanguage}
          className={`h-8 px-2 rounded-full flex items-center gap-1 transition-all cursor-pointer border text-xs font-black ${
            language === 'en'
              ? 'bg-[#3B82F6] text-white border-[#3B82F6] shadow-xs'
              : 'bg-[#FAF8F5] text-[#746C65] hover:text-[#2D2825] border-[#ECE7DF]'
          }`}
          title="สลับภาษาไทย / Switch to English"
        >
          <Globe size={14} weight="bold" />
          <span>{language === 'en' ? 'EN' : 'ไทย'}</span>
        </button>

        {/* Admin Family Requests Shield */}
        {isAdmin && (
          <button
            type="button"
            onClick={onOpenAdmin}
            className="relative w-8 h-8 rounded-full flex items-center justify-center text-[#5F8D75] bg-[#EEF4F0] hover:bg-[#E2EEE6] transition-colors cursor-pointer border border-[#5F8D75]/20"
            title="จัดการครอบครัว & คำขอเข้าบ้าน"
          >
            <ShieldCheck size={18} weight="bold" />
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E88D67] text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </button>
        )}

        {/* Household Members Button */}
        <button
          type="button"
          onClick={onOpenMembers}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#746C65] hover:text-[#2D2825] bg-[#FAF8F5] hover:bg-[#F2EFEA] border border-[#ECE7DF] transition-colors cursor-pointer"
          title="รายชื่อสมาชิกในบ้าน"
        >
          <UsersThree size={17} weight="bold" />
        </button>

        {/* Notification Bell with Badge */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative w-8 h-8 rounded-full flex items-center justify-center text-[#746C65] hover:text-[#2D2825] bg-[#FAF8F5] hover:bg-[#F2EFEA] border border-[#ECE7DF] transition-colors cursor-pointer"
          title="การแจ้งเตือน"
        >
          <Bell
            size={17}
            weight={unreadCount > 0 ? 'fill' : 'bold'}
            className={unreadCount > 0 ? 'text-[#E88D67]' : 'text-[#746C65]'}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#E88D67] text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-xs">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Pill (Avatar + Name) */}
        <div
          onClick={onOpenProfile}
          className="p-1 pr-2.5 rounded-full bg-[#FAF8F5] hover:bg-[#F2EFEA] border border-[#ECE7DF] flex items-center gap-2 cursor-pointer transition-all ml-1"
          title="โปรไฟล์และการตั้งค่า"
        >
          <div className="w-7 h-7 rounded-full overflow-hidden bg-white border border-[#ECE7DF] shrink-0">
            {currentUser?.avatarType === 'image' && currentUser?.avatarImage ? (
              <img src={currentUser.avatarImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                {currentUser?.avatar || '😊'}
              </div>
            )}
          </div>
          <span className="text-xs font-black text-[#2D2825] max-w-[90px] truncate hidden md:block">
            {currentUser?.name || 'คุณ'}
          </span>
        </div>
      </div>
    </header>
  );
}
