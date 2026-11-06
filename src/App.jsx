import { useState, useEffect, useRef } from 'react';
import {
  House,
  ChartBar,
  Gift,
  SignOut,
  UsersThree,
  PencilSimple,
  Sparkle,
  Flame,
  Camera,
  Bell,
  UserCircle,
  MagnifyingGlass,
  Plus,
  ShieldCheck,
  Trash,
  TextAa,
  PushPin,
  CalendarBlank,
  Globe,
} from '@phosphor-icons/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import LoginPage from './components/LoginPage';
import ProfileModal from './components/ProfileModal';
import TodayHome from './components/TodayHome';
import MyFeedProfile from './components/MyFeedProfile';
import NotificationModal from './components/NotificationModal';
import SearchModal from './components/SearchModal';
import FamilySummary from './components/FamilySummary';
import MonthlyRewards from './components/MonthlyRewards';
import FamilyAdminModal from './components/FamilyAdminModal';
import DigitalFridgeBoard from './components/DigitalFridgeBoard';
import FamilyCalendarView from './components/FamilyCalendarView';
import ErrorBoundary from './components/ErrorBoundary';
import InstallAppModal from './components/InstallAppModal';
import HomeSpaceLogo from './components/HomeSpaceLogo';
import DesktopTopNav from './components/DesktopTopNav';
import DesktopLeftSidebar from './components/DesktopLeftSidebar';
import DesktopRightSidebar from './components/DesktopRightSidebar';
import HomeHandbookModal from './components/HomeHandbookModal';
import { FamilyGardenModal } from './components/FamilyTreeGarden';
import EmergencySosModal, { EmergencySosBanner } from './components/EmergencySosModal';
import QuickHouseMenu from './components/QuickHouseMenu';
import FamilyLedgerModal from './components/FamilyLedgerModal';

const TABS = [
  { id: 'home', label: 'หน้าหลัก', icon: House, subtitle: 'โหลคะแนน & งานบ้าน' },
  { id: 'fridge', label: 'ตู้เย็น', icon: PushPin, subtitle: 'กระดานโน้ตตู้เย็น' },
  { id: 'calendar', label: 'ปฏิทิน', icon: CalendarBlank, subtitle: 'วันสำคัญ & แท็กคน' },
  { id: 'my-feed', label: 'โพสต์ฉัน', icon: UserCircle, subtitle: 'ฟีดและคอมเมนต์ของฉัน' },
  { id: 'rewards', label: 'ของรางวัล', icon: Gift, subtitle: 'ปลดล็อก & โหวตของกิน' },
];

function HeaderAvatar({ member, size = 'sm' }) {
  const sizeMap = {
    sm: 'w-10 h-10 rounded-2xl text-xl',
    md: 'w-12 h-12 rounded-2xl text-2xl',
  };

  if (member?.avatarType === 'image' && member?.avatarImage) {
    return (
      <img
        src={member.avatarImage}
        alt={member.name}
        className={`${sizeMap[size]} object-cover border-2 border-white shadow-xs ring-2 ring-[#5F8D75]/30`}
      />
    );
  }

  return (
    <div
      className={`${sizeMap[size]} flex items-center justify-center border-2 border-white shadow-xs ring-2 ring-[#5F8D75]/30 font-bold`}
      style={{ backgroundColor: `${member?.color || '#5F8D75'}25` }}
    >
      {member?.avatar || '😊'}
    </div>
  );
}

function AppContent() {
  const { currentUser, members, logout, isAdmin, pendingRequests, removeMember, currentFamily } = useAuth();
  const {
    notifications,
    seniorMode,
    toggleSeniorMode,
    markNotificationsRead,
    language,
    toggleLanguage,
    t,
    installModalOpen,
    setInstallModalOpen,
    promptInstallApp,
    isStandalone,
    isViewingContent,
    activeSosAlert,
  } = useApp();
  const [activeTab, setActiveTab] = useState('home');
  const [profileOpen, setProfileOpen] = useState(false);
  const [familyAdminOpen, setFamilyAdminOpen] = useState(false);
  const [homeHandbookOpen, setHomeHandbookOpen] = useState(false);
  const [familyGardenOpen, setFamilyGardenOpen] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosInitialCountdown, setSosInitialCountdown] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [familyMembersOpen, setFamilyMembersOpen] = useState(false);
  const [quickHouseMenuOpen, setQuickHouseMenuOpen] = useState(false);
  const [familyLedgerOpen, setFamilyLedgerOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [viewingMember, setViewingMember] = useState(null);

  // Dynamic Navigation Auto-Hide on Scroll & Content View
  const [isNavVisible, setIsNavVisible] = useState(true);
  const scrollContainerRef = useRef(null);
  const mobileScrollContainerRef = useRef(null);
  const lastScrollYRef = useRef(0);

  const tabs = [
    { id: 'home', label: t('tabHome', 'หน้าหลัก'), icon: House, subtitle: t('tabHomeSub', 'โหลคะแนน & งานบ้าน') },
    { id: 'fridge', label: t('tabFridge', 'ตู้เย็น'), icon: PushPin, subtitle: t('tabFridgeSub', 'กระดานโน้ตตู้เย็น') },
    { id: 'calendar', label: t('tabCalendar', 'ปฏิทิน'), icon: CalendarBlank, subtitle: t('tabCalendarSub', 'วันสำคัญ & แท็กคน') },
    { id: 'my-feed', label: t('tabMyFeed', 'โพสต์ฉัน'), icon: UserCircle, subtitle: t('tabMyFeedSub', 'ฟีดและคอมเมนต์ของฉัน') },
    { id: 'rewards', label: t('tabRewards', 'ของรางวัล'), icon: Gift, subtitle: t('tabRewardsSub', 'ปลดล็อก & โหวตของกิน') },
  ];

  // Mobile Scroll Handler: Auto-hide bars when scrolling DOWN, reveal when scrolling UP
  const handleMobileScroll = (e) => {
    if (isViewingContent) return;
    const currentScrollY = e.currentTarget.scrollTop;

    // Always reveal near the top
    if (currentScrollY <= 25) {
      setIsNavVisible(true);
      lastScrollYRef.current = currentScrollY;
      return;
    }

    const diff = currentScrollY - lastScrollYRef.current;
    if (Math.abs(diff) > 8) {
      if (diff > 0 && currentScrollY > 60) {
        // Scrolling DOWN -> Hide bars for immersion
        setIsNavVisible(false);
      } else if (diff < 0) {
        // Scrolling UP -> Reveal bars
        setIsNavVisible(true);
      }
      lastScrollYRef.current = currentScrollY;
    }
  };

  // Reset scroll position and restore nav bars when changing tabs or profiles
  useEffect(() => {
    setIsNavVisible(true);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    if (mobileScrollContainerRef.current) {
      mobileScrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeTab, viewingMember]);

  // Handle Android Native Hardware Back Button (Capacitor)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let lastBackPress = 0;
    const backListenerPromise = CapApp.addListener('backButton', () => {
      // 1. Let active child modals/views intercept the back gesture first
      const backEvt = new CustomEvent('app:android-back', { cancelable: true });
      window.dispatchEvent(backEvt);
      if (backEvt.defaultPrevented) return;

      // 2. Close AppContent level modals in priority order
      if (showLogoutConfirm) { setShowLogoutConfirm(false); return; }
      if (familyLedgerOpen) { setFamilyLedgerOpen(false); return; }
      if (quickHouseMenuOpen) { setQuickHouseMenuOpen(false); return; }
      if (familyMembersOpen) { setFamilyMembersOpen(false); return; }
      if (searchOpen) { setSearchOpen(false); return; }
      if (notificationOpen) { setNotificationOpen(false); return; }
      if (sosModalOpen) { setSosModalOpen(false); return; }
      if (familyGardenOpen) { setFamilyGardenOpen(false); return; }
      if (homeHandbookOpen) { setHomeHandbookOpen(false); return; }
      if (familyAdminOpen) { setFamilyAdminOpen(false); return; }
      if (profileOpen) { setProfileOpen(false); return; }
      if (installModalOpen) { setInstallModalOpen(false); return; }

      // 3. Clear profile view in my-feed
      if (viewingMember) { setViewingMember(null); return; }

      // 4. Return to Home tab if on another tab
      if (activeTab !== 'home') {
        setActiveTab('home');
        return;
      }

      // 5. Double tap back within 2 seconds to exit app
      const now = Date.now();
      if (now - lastBackPress < 2000) {
        CapApp.exitApp();
      } else {
        lastBackPress = now;
      }
    });

    return () => {
      backListenerPromise.then((sub) => sub.remove());
    };
  }, [
    showLogoutConfirm,
    quickHouseMenuOpen,
    familyMembersOpen,
    searchOpen,
    notificationOpen,
    sosModalOpen,
    familyGardenOpen,
    homeHandbookOpen,
    familyAdminOpen,
    profileOpen,
    installModalOpen,
    viewingMember,
    activeTab,
  ]);

  // Check if any modal or fullscreen content is open
  const isAnyModalOpen = Boolean(
    searchOpen ||
    notificationOpen ||
    profileOpen ||
    familyAdminOpen ||
    homeHandbookOpen ||
    familyGardenOpen ||
    sosModalOpen ||
    quickHouseMenuOpen ||
    installModalOpen ||
    familyMembersOpen ||
    showLogoutConfirm ||
    isViewingContent
  );

  const isBottomNavHidden = !isNavVisible || isAnyModalOpen;

  const myNotifications = (notifications || []).filter(
    (n) => n.recipientId === currentUser?.id
  );
  const unreadCount = myNotifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const handleViewMember = (member) => {
    setViewingMember(member);
    setActiveTab('my-feed');
  };

  const handleDeleteMember = async (member) => {
    if (member.id === currentUser?.id) {
      alert('คุณไม่สามารถลบตัวเองออกจากบ้านได้');
      return;
    }
    const confirmed = window.confirm(
      `คุณต้องการลบ "${member.name}" (${member.role}) ออกจากครอบครัวใช่หรือไม่?\n\nการลบนี้จะนำสมาชิกออกจากครอบครัวและลบข้อมูลที่เกี่ยวข้อง`
    );
    if (!confirmed) return;

    try {
      await removeMember(member.id);
    } catch (err) {
      console.error('Delete member error:', err);
      alert('เกิดข้อผิดพลาดในการลบสมาชิก กรุณาลองใหม่อีกครั้ง');
    }
  };

  const renderTabContent = () => (
    <>
      {activeTab === 'home' && (
        <TodayHome
          onNavigateTab={setActiveTab}
          onViewMemberProfile={handleViewMember}
          onOpenHandbook={() => setHomeHandbookOpen(true)}
        onOpenLedger={() => setFamilyLedgerOpen(true)}
          onOpenGarden={() => setFamilyGardenOpen(true)}
          onOpenLedger={() => setFamilyLedgerOpen(true)}
          onOpenSos={() => {
            setSosInitialCountdown(!activeSosAlert);
            setSosModalOpen(true);
          }}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenLedger={() => setFamilyLedgerOpen(true)}
        />
      )}
      {activeTab === 'fridge' && (
        <DigitalFridgeBoard
          isFullPage={true}
          onNavigateTab={setActiveTab}
        />
      )}
      {activeTab === 'calendar' && (
        <FamilyCalendarView
          onNavigateTab={setActiveTab}
        />
      )}
      {activeTab === 'my-feed' && (
        <MyFeedProfile
          onNavigateTab={setActiveTab}
          viewingMember={viewingMember}
          onBackToMe={() => setViewingMember(null)}
        />
      )}
      {activeTab === 'summary' && <FamilySummary />}
      {activeTab === 'rewards' && <MonthlyRewards />}
    </>
  );

  return (
    <div className={`relative w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden bg-[#FAF8F5] text-[#2D2825] font-sans select-text ${seniorMode ? 'senior-mode' : ''}`}>
      {/* 1. Desktop Facebook-Style Top Header (Screens >= 1024px) */}
      <div className="hidden lg:block w-full shrink-0">
        <DesktopTopNav
          activeTab={activeTab}
          onNavigateTab={(tab) => {
            if (tab === 'my-feed') setViewingMember(null);
            setActiveTab(tab);
          }}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNotifications={() => {
            setNotificationOpen(true);
            if (currentUser?.id && unreadCount > 0) markNotificationsRead(currentUser.id);
          }}
          onOpenAdmin={() => setFamilyAdminOpen(true)}
          onOpenMembers={() => setFamilyMembersOpen(true)}
          onOpenProfile={() => setQuickHouseMenuOpen(true)}
          onOpenQuickMenu={() => setQuickHouseMenuOpen(true)}
          onOpenSos={() => {
            setSosInitialCountdown(!activeSosAlert);
            setSosModalOpen(true);
          }}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenLedger={() => setFamilyLedgerOpen(true)}
        />
      </div>

      {/* 2. Mobile Top Header - Ultra Clean & Full Featured (< 1024px) */}
      <header
        className={`lg:hidden bg-white/95 backdrop-blur-md border-b border-[#ECE7DF] px-2.5 sm:px-4 py-2 flex items-center justify-between shadow-2xs safe-area-top shrink-0 z-30 ${
          isViewingContent ? 'hidden' : ''
        }`}
      >
        <div
          onClick={() => {
            setViewingMember(null);
            setActiveTab('home');
          }}
          className="flex items-center gap-2 cursor-pointer shrink-0 min-w-0"
        >
          <HomeSpaceLogo size={32} rounded="rounded-xl" className="shadow-xs shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-black text-[#2D2825] leading-none tracking-tight">HomeSpace</h1>
            <p className="text-[9px] text-[#746C65] font-medium leading-none mt-0.5 truncate">
              {language === 'en' ? 'Our Family Space' : 'บันทึกความสุขของบ้าน'}
            </p>
          </div>
        </div>

        {/* Right Actions: Clean & Spacious (SOS + Search + Notifications + Profile Hub) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 1. Emergency SOS Button */}
          <button
            type="button"
            onClick={() => {
              setSosInitialCountdown(!activeSosAlert);
              setSosModalOpen(true);
            }}
            className="h-8 px-2.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer active:scale-95 animate-pulse shrink-0"
            title="ปุ่มขอความช่วยเหลือฉุกเฉิน (SOS)"
          >
            <span className="text-xs">🚨</span>
            <span className="font-mono font-black tracking-tight">SOS</span>
          </button>

          {/* 2. Search Button */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#746C65] hover:text-[#2D2825] bg-[#FAF8F5] hover:bg-[#F2EFEA] border border-[#ECE7DF] transition-colors cursor-pointer shrink-0"
            title={t('searchTitle', 'ค้นหาในบ้าน')}
          >
            <MagnifyingGlass size={16} weight="bold" />
          </button>

          {/* 3. Notification Bell with Badge */}
          <button
            type="button"
            onClick={() => {
              setNotificationOpen(true);
              if (currentUser?.id && unreadCount > 0) {
                markNotificationsRead(currentUser.id);
              }
            }}
            className="relative w-8 h-8 rounded-full flex items-center justify-center text-[#746C65] hover:text-[#2D2825] bg-[#FAF8F5] hover:bg-[#F2EFEA] border border-[#ECE7DF] transition-colors cursor-pointer shrink-0"
            title={t('notificationsTitle', 'การแจ้งเตือน')}
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

          {/* 4. Quick House Menu & Profile Avatar Hub */}
          <button
            type="button"
            onClick={() => setQuickHouseMenuOpen(true)}
            className="relative p-0.5 rounded-full border-2 border-[#5F8D75]/40 hover:border-[#5F8D75] transition-all hover:scale-105 cursor-pointer shrink-0"
            title="ศูนย์จัดการบ้าน & การตั้งค่า"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white">
              {currentUser?.avatarType === 'image' && currentUser?.avatarImage ? (
                <img src={currentUser.avatarImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#FAF8F5] flex items-center justify-center text-sm font-bold">
                  {currentUser?.avatar || '😊'}
                </div>
              )}
            </div>
            {isAdmin && pendingRequests.length > 0 && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </button>
        </div>
      </header>

      {/* Persistent SOS Emergency Alert Banner (Active when SOS is triggered) */}
      <EmergencySosBanner
        onOpenSosModal={() => {
          setSosInitialCountdown(false);
          setSosModalOpen(true);
        }}
      />

      {/* 3. Facebook 3-Column Desktop View (Screens >= 1024px) */}
      <div className="hidden lg:flex flex-1 min-h-0 w-full max-w-[1440px] mx-auto justify-between px-3 xl:px-6 overflow-hidden">
        {/* Left Sidebar */}
        <DesktopLeftSidebar
          activeTab={activeTab}
          onNavigateTab={(tab) => {
            if (tab === 'my-feed') setViewingMember(null);
            setActiveTab(tab);
          }}
          onOpenAdmin={() => setFamilyAdminOpen(true)}
          onOpenSummary={() => setActiveTab('summary')}
          onOpenInstall={() => setInstallModalOpen(true)}
          onOpenHandbook={() => setHomeHandbookOpen(true)}
        onOpenLedger={() => setFamilyLedgerOpen(true)}
          onOpenGarden={() => setFamilyGardenOpen(true)}
          onOpenLedger={() => setFamilyLedgerOpen(true)}
        />

        {/* Center Feed (Main Content, Scrollable) */}
        <main
          ref={scrollContainerRef}
          data-scrollable="true"
          className="flex-1 max-w-[680px] h-full overflow-y-auto no-scrollbar py-3 px-2 pb-24 scroll-area"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
          {renderTabContent()}
        </main>

        {/* Right Sidebar */}
        <DesktopRightSidebar
          onViewMember={handleViewMember}
          onNavigateTab={setActiveTab}
          onOpenChore={() => {
            setActiveTab('home');
          }}
          onOpenAdmin={() => setFamilyAdminOpen(true)}
        />
      </div>

      {/* 4. Mobile Single-Column Scrollable View (< 1024px) */}
      <div
        ref={mobileScrollContainerRef}
        onScroll={handleMobileScroll}
        className="lg:hidden flex-1 min-h-0 w-full max-w-md mx-auto overflow-y-auto overflow-x-hidden no-scrollbar relative scroll-area"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        <main className="w-full px-3.5 pt-3 pb-24 sm:pb-28">
          {renderTabContent()}
        </main>
      </div>

      {/* 5. Modern Native Mobile Bottom Navigation (< 1024px) */}
      <nav
        aria-label="เมนูหลักมือถือ"
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 w-full bg-white/95 backdrop-blur-md border-t border-[#ECE7DF] shadow-md transition-transform duration-250 ease-out safe-area-bottom ${
          isBottomNavHidden
            ? 'translate-y-full opacity-0 pointer-events-none'
            : 'translate-y-0 opacity-100 pointer-events-auto'
        }`}
      >
        <div className="max-w-md mx-auto flex items-center justify-around py-1.5 px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === 'my-feed') {
                    setViewingMember(null);
                  }
                  setActiveTab(tab.id);
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-2xl transition-all cursor-pointer relative ${
                  isActive
                    ? 'text-[#5F8D75] font-black'
                    : 'text-[#746C65] hover:text-[#2D2825] font-semibold'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    isActive ? 'bg-[#EEF4F0] text-[#5F8D75] scale-105' : ''
                  }`}
                >
                  <Icon size={22} weight={isActive ? 'fill' : 'regular'} />
                </div>
                <span className="text-[11px] font-bold tracking-tight whitespace-nowrap leading-none">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectMember={handleViewMember}
      />

      {/* Notification Drawer Modal */}
      <NotificationModal
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        onNavigateToMyFeed={() => {
          setViewingMember(null);
          setActiveTab('my-feed');
        }}
      />

      {/* Edit Profile Modal */}
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      <FamilyAdminModal isOpen={familyAdminOpen} onClose={() => setFamilyAdminOpen(false)} />
      <HomeHandbookModal isOpen={homeHandbookOpen} onClose={() => setHomeHandbookOpen(false)} />
      <FamilyGardenModal isOpen={familyGardenOpen} onClose={() => setFamilyGardenOpen(false)} />
      <EmergencySosModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        initialCountdown={sosInitialCountdown}
      />
      <QuickHouseMenu
        isOpen={quickHouseMenuOpen}
        onClose={() => setQuickHouseMenuOpen(false)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenAdmin={() => setFamilyAdminOpen(true)}
        onOpenMembers={() => setFamilyMembersOpen(true)}
        onOpenHandbook={() => setHomeHandbookOpen(true)}
        onOpenLedger={() => setFamilyLedgerOpen(true)}
        onNavigateTab={(tab) => {
          if (tab === 'my-feed') setViewingMember(null);
          setActiveTab(tab);
        }}
        onLogout={() => setShowLogoutConfirm(true)}
      />
      <InstallAppModal isOpen={installModalOpen} onClose={() => setInstallModalOpen(false)} />
      <FamilyLedgerModal isOpen={familyLedgerOpen} onClose={() => setFamilyLedgerOpen(false)} />

        {/* Household Members Modal (Directory & Member Management) */}
        {familyMembersOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs select-none"
            onClick={() => setFamilyMembersOpen(false)}
          >
            <div
              className="bg-white rounded-3xl border border-[#ECE7DF] shadow-2xl w-full max-w-sm max-h-[85dvh] flex flex-col overflow-hidden animate-enter-rise"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-[#ECE7DF] flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#EEF4F0] text-[#5F8D75] flex items-center justify-center text-lg shadow-2xs">
                    👨‍👩‍👧‍👦
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#2D2825]">สมาชิกในบ้าน</h3>
                    <p className="text-[10px] text-[#746C65]">
                      {currentFamily?.name || 'บ้านสุขใจ'} · {members.filter((m) => m.status !== 'pending').length} คน
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFamilyMembersOpen(false)}
                  className="w-7 h-7 rounded-full bg-[#FAF8F5] hover:bg-[#ECE7DF] text-[#746C65] flex items-center justify-center text-xs cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Admin Panel Shortcut */}
              {isAdmin && (
                <div className="px-4 pt-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setFamilyMembersOpen(false);
                      setFamilyAdminOpen(true);
                    }}
                    className="w-full py-2 px-3 rounded-2xl bg-[#EEF4F0] hover:bg-[#DFEDE3] text-[#5F8D75] text-xs font-bold flex items-center justify-between border border-[#5F8D75]/30 transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={16} weight="bold" />
                      <span>คำขอเข้าบ้าน & ลิงก์เชิญ</span>
                    </div>
                    {pendingRequests.length > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#E88D67] text-white text-[9px] font-black animate-pulse">
                        {pendingRequests.length} คำขอ
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#5F8D75]">จัดการ →</span>
                    )}
                  </button>
                </div>
              )}

              {/* Members Directory List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 no-scrollbar">
                {members
                  .filter((m) => m.status !== 'pending')
                  .map((m) => {
                    const isCurrent = m.id === currentUser?.id;
                    const isMemberAdmin =
                      m.isAdmin === 1 || m.role?.includes('เจ้าบ้าน') || m.role?.includes('หัวหน้า') || m.role?.includes('พ่อ') || m.role?.includes('แม่') || currentFamily?.adminMemberId === m.id;
                    return (
                      <div
                        key={m.id}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'bg-[#EEF4F0]/60 border-[#5F8D75]/40 shadow-xs'
                            : 'bg-[#FAF8F5] border-[#ECE7DF] hover:bg-white'
                        }`}
                      >
                        {/* Member Info */}
                        <div
                          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                          onClick={() => {
                            setFamilyMembersOpen(false);
                            handleViewMember(m);
                          }}
                        >
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 overflow-hidden border border-[#ECE7DF] shadow-2xs"
                            style={{ backgroundColor: `${m.color || '#5F8D75'}20` }}
                          >
                            {m.avatarType === 'image' && m.avatarImage ? (
                              <img
                                src={m.avatarImage}
                                alt={m.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              m.avatar || '😊'
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-black text-[#2D2825] truncate">
                                {m.name}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] bg-[#5F8D75] text-white px-1.5 py-0.2 rounded font-bold">
                                  คุณ
                                </span>
                              )}
                              {isMemberAdmin && (
                                <span className="text-[9px] bg-[#2D2825] text-[#F3EFEA] px-1.5 py-0.2 rounded font-bold">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-[#746C65] mt-0.5">
                              <span>{m.role}</span>
                              <span>•</span>
                              <span className="font-mono">{m.phone}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions: View Profile & Delete (Admin only, not self) */}
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {isCurrent ? (
                            <button
                              type="button"
                              onClick={() => {
                                setFamilyMembersOpen(false);
                                setProfileOpen(true);
                              }}
                              className="text-[10px] font-bold text-[#5F8D75] hover:text-[#476E5B] px-2.5 py-1 bg-white hover:bg-[#EEF4F0] rounded-xl border border-[#5F8D75]/30 shadow-2xs transition-colors cursor-pointer"
                            >
                              ✏️ แก้ไข
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setFamilyMembersOpen(false);
                                  handleViewMember(m);
                                }}
                                className="text-[10px] font-bold text-[#746C65] hover:text-[#2D2825] px-2 py-1 bg-white hover:bg-[#ECE7DF] rounded-xl border border-[#ECE7DF] shadow-2xs transition-colors cursor-pointer"
                                title="ดูหน้าโปรไฟล์และผลงาน"
                              >
                                โปรไฟล์
                              </button>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMember(m)}
                                  className="p-1.5 rounded-xl bg-white hover:bg-red-50 text-red-400 hover:text-red-600 border border-[#ECE7DF] hover:border-red-200 transition-colors cursor-pointer shadow-2xs"
                                  title={`ลบ ${m.name} ออกจากครอบครัว`}
                                >
                                  <Trash size={14} weight="bold" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Install App on Phone Banner */}
              <div className="px-3.5 py-2.5 bg-[#FAF8F5] border-t border-[#ECE7DF] shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setFamilyMembersOpen(false);
                    promptInstallApp();
                  }}
                  className="w-full py-2 px-3 rounded-2xl bg-gradient-to-r from-[#5F8D75] to-[#4E7661] text-white flex items-center justify-between shadow-xs hover:opacity-95 transition-transform active:scale-98 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">📲</span>
                    <div className="text-left leading-tight">
                      <p className="text-xs font-black">{t('installAppTitle', 'ติดตั้งแอปลงมือถือ')}</p>
                      <p className="text-[10px] text-white/80">{t('installAppSubtitle', 'iPhone & Android เปิดเต็มจอเหมือนแอปแท้')}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">{t('installAppBtn', 'วิธีลง ↗')}</span>
                </button>
              </div>

              {/* Footer with Logout & Close */}
              <div className="p-3 border-t border-[#ECE7DF] flex items-center justify-between bg-[#FAF8F5] shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setFamilyMembersOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="text-xs text-red-500 hover:text-red-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <SignOut size={14} weight="bold" />
                  <span>{t('logout', 'ออกจากระบบ')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFamilyMembersOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#ECE7DF] text-xs font-bold text-[#746C65] border border-[#ECE7DF] shadow-2xs transition-colors cursor-pointer"
                >
                  {t('close', 'ปิด')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logout Confirmation */}
        {showLogoutConfirm && (
          <div
            role="alertdialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <div
              className="bg-white rounded-3xl border border-[#ECE7DF] shadow-xl w-full max-w-xs p-5 text-center animate-enter-rise"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FDF1EB] text-[#E88D67] flex items-center justify-center text-xl mb-3">
                <SignOut size={24} weight="bold" />
              </div>
              <h3 className="text-base font-bold text-[#2D2825] mb-1">ออกจากระบบ?</h3>
              <p className="text-xs text-[#746C65] mb-4">
                คุณสามารถเข้าสู่ระบบกลับมาได้ตลอดเวลาด้วยเบอร์เดิม
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-[#FAF8F5] text-[#746C65] border border-[#ECE7DF]"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-[#E88D67] text-white"
                >
                  ออกจากระบบ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

function AppRouter() {
  const { isLoggedIn, isPending } = useAuth();

  // If opening via invite link (e.g. ?invite=HOME-2026), always show LoginPage so the invited person can enter their phone and register!
  const hasInviteLink = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).has('invite') ||
    new URLSearchParams(window.location.search).has('join') ||
    new URLSearchParams(window.location.search).has('code')
  );

  return (
    <div className="h-full min-h-[100dvh] w-full bg-[#FAF8F5] flex justify-center overflow-hidden">
      <div className="w-full h-full flex flex-col relative overflow-hidden">
        {!isLoggedIn || isPending || hasInviteLink ? (
          <LoginPage />
        ) : (
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </AuthProvider>
  );
}
