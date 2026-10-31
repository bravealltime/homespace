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
  } = useApp();
  const [activeTab, setActiveTab] = useState('home');
  const [profileOpen, setProfileOpen] = useState(false);
  const [familyAdminOpen, setFamilyAdminOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [familyMembersOpen, setFamilyMembersOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [viewingMember, setViewingMember] = useState(null);
  const scrollContainerRef = useRef(null);

  const tabs = [
    { id: 'home', label: t('tabHome', 'หน้าหลัก'), icon: House, subtitle: t('tabHomeSub', 'โหลคะแนน & งานบ้าน') },
    { id: 'fridge', label: t('tabFridge', 'ตู้เย็น'), icon: PushPin, subtitle: t('tabFridgeSub', 'กระดานโน้ตตู้เย็น') },
    { id: 'calendar', label: t('tabCalendar', 'ปฏิทิน'), icon: CalendarBlank, subtitle: t('tabCalendarSub', 'วันสำคัญ & แท็กคน') },
    { id: 'my-feed', label: t('tabMyFeed', 'โพสต์ฉัน'), icon: UserCircle, subtitle: t('tabMyFeedSub', 'ฟีดและคอมเมนต์ของฉัน') },
    { id: 'rewards', label: t('tabRewards', 'ของรางวัล'), icon: Gift, subtitle: t('tabRewardsSub', 'ปลดล็อก & โหวตของกิน') },
  ];

  // Reset scroll position when changing tabs or profiles
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeTab, viewingMember]);

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

  // Phone App View (Rendered inside Phone Mockup or Centered on Desktop)
  return (
    <div className={`relative w-full h-full min-h-full flex flex-col overflow-hidden bg-[#FAF8F5] text-[#2D2825] font-sans select-text ${seniorMode ? 'senior-mode' : ''}`}>
      {/* Mobile Top Header - Ultra Clean & Elegant */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ECE7DF] px-3 sm:px-4 py-2.5 flex items-center justify-between shadow-2xs safe-area-top shrink-0">
        <div
          onClick={() => {
            setViewingMember(null);
            setActiveTab('home');
          }}
          className="flex items-center gap-2 cursor-pointer shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-[#5F8D75] text-white flex items-center justify-center text-base shadow-xs">
            🏡
          </div>
          <div>
            <h1 className="text-sm font-black text-[#2D2825] leading-tight tracking-tight">HomeSpace</h1>
            <p className="text-[9px] text-[#746C65]">{t('appSubtitle', 'บันทึกความสุขของบ้าน')}</p>
          </div>
        </div>

        {/* Right Actions: Senior Mode (🔤) + Language Switcher (🌐) + Admin Shield (🛡️) + Search (🔍) + Notification (🔔) + User Avatar (👤) + Members (👥) */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Senior & Easy-Reading Mode Toggle (โหมดสบายตา / ตัวหนังสือใหญ่) */}
          <button
            type="button"
            onClick={toggleSeniorMode}
            className={`w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
              seniorMode
                ? 'bg-[#5F8D75] text-white border-[#5F8D75] shadow-xs'
                : 'bg-[#FAF8F5] text-[#746C65] hover:text-[#2D2825] border-[#ECE7DF]'
            }`}
            title={seniorMode ? 'ปิดโหมดตัวหนังสือใหญ่' : 'เปิดโหมดตัวหนังสือใหญ่ (สบายตา)'}
          >
            <TextAa size={15} weight={seniorMode ? 'bold' : 'regular'} />
          </button>

          {/* Language Switcher for UX/UI (สลับภาษาไทย 🇹🇭 / English 🇬🇧) */}
          <button
            type="button"
            onClick={toggleLanguage}
            className={`h-7.5 px-1.5 sm:px-2 rounded-full flex items-center gap-1 transition-all cursor-pointer border text-[11px] font-black ${
              language === 'en'
                ? 'bg-[#3B82F6] text-white border-[#3B82F6] shadow-xs'
                : 'bg-[#FAF8F5] text-[#746C65] hover:text-[#2D2825] border-[#ECE7DF]'
            }`}
            title={t('langToggleTitle', 'สลับภาษาไทย / Switch to English')}
          >
            <Globe size={13} weight="bold" />
            <span>{language === 'en' ? 'EN' : 'ไทย'}</span>
          </button>

          {/* Admin Family Requests & Invite Link Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setFamilyAdminOpen(true)}
              className="relative w-7.5 h-7.5 rounded-full flex items-center justify-center text-[#5F8D75] hover:bg-[#EEF4F0] transition-colors cursor-pointer"
              title={t('adminManage', 'จัดการคำขอเข้าครอบครัว & ลิงก์เชิญ')}
            >
              <ShieldCheck size={18} weight="bold" />
              {pendingRequests.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#E88D67] text-white text-[8px] font-black flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          )}

          {/* Search Button (ค้นหาคนในบ้าน หรืองานบ้าน) */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="w-7.5 h-7.5 rounded-full flex items-center justify-center text-[#746C65] hover:text-[#2D2825] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            title={t('searchTitle', 'ค้นหาคนในบ้าน หรืองานบ้าน')}
          >
            <MagnifyingGlass size={17} weight="bold" />
          </button>

          {/* Notification Bell with Badge */}
          <button
            type="button"
            onClick={() => {
              setNotificationOpen(true);
              if (currentUser?.id && unreadCount > 0) {
                markNotificationsRead(currentUser.id);
              }
            }}
            className="relative w-7.5 h-7.5 rounded-full flex items-center justify-center text-[#746C65] hover:text-[#2D2825] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            title={t('notificationsTitle', 'การแจ้งเตือน')}
          >
            <Bell
              size={17}
              weight={unreadCount > 0 ? 'fill' : 'bold'}
              className={unreadCount > 0 ? 'text-[#E88D67]' : 'text-[#746C65]'}
            />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-[#E88D67] text-white text-[8px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Clean User Profile Avatar */}
          <button
            type="button"
            onClick={() => {
              setViewingMember(null);
              setActiveTab('my-feed');
            }}
            className={`w-7.5 h-7.5 rounded-full overflow-hidden border-2 transition-transform hover:scale-105 cursor-pointer shrink-0 ${
              activeTab === 'my-feed' && !viewingMember
                ? 'border-[#5F8D75] ring-2 ring-[#5F8D75]/30'
                : 'border-[#ECE7DF]'
            }`}
            title={t('myProfileTitle', 'ไปที่โปรไฟล์ของฉัน')}
          >
            {currentUser?.avatarType === 'image' && currentUser?.avatarImage ? (
              <img src={currentUser.avatarImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#FAF8F5] flex items-center justify-center text-xs font-bold">
                {currentUser?.avatar || '😊'}
              </div>
            )}
          </button>

          {/* Household Members Button */}
          <button
            type="button"
            onClick={() => setFamilyMembersOpen(true)}
            className="w-7.5 h-7.5 rounded-full flex items-center justify-center text-[#746C65] hover:text-[#2D2825] hover:bg-[#FAF8F5] transition-colors cursor-pointer border border-[#ECE7DF] shrink-0"
            title={t('familyMembersTitle', 'สมาชิกในบ้าน')}
          >
            <UsersThree size={16} weight="bold" />
          </button>
        </div>
      </header>

      {/* Scrollable View Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-y-auto overflow-x-hidden no-scrollbar overscroll-contain relative"
      >
        <main className="w-full px-3.5 pt-3 pb-28">
          {activeTab === 'home' && (
            <TodayHome
              onNavigateTab={setActiveTab}
              onViewMemberProfile={handleViewMember}
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
        </main>
      </div>

      {/* Floating Mobile Bottom Navigation Island - Permanently Docked at Bottom of Viewport */}
      <nav
        aria-label="เมนูหลักมือถือ"
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-full max-w-[390px] px-3.5 pointer-events-auto"
      >
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-[#ECE7DF] p-1 shadow-2xl flex items-center justify-around">
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
                className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-0.5 sm:px-1 rounded-2xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#5F8D75] text-white shadow-xs font-bold'
                    : 'text-[#746C65] hover:text-[#2D2825] font-semibold'
                }`}
              >
                <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
                <span className="text-[9.5px] sm:text-[10px] tracking-tight whitespace-nowrap">{tab.label}</span>
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
      <InstallAppModal isOpen={installModalOpen} onClose={() => setInstallModalOpen(false)} />

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
    <div className="min-h-[100dvh] w-full bg-[#EDE7DF] flex justify-center">
      <div className="w-full max-w-md min-h-[100dvh] bg-[#FAF8F5] flex flex-col relative sm:border-x sm:border-[#ECE7DF] sm:shadow-xl overflow-hidden">
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
