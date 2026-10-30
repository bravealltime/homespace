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
import PhoneMockup from './components/PhoneMockup';

const TABS = [
  { id: 'home', label: 'หน้าหลัก', icon: House, subtitle: 'โหลคะแนน & งานบ้าน' },
  { id: 'my-feed', label: 'โพสต์ของฉัน', icon: UserCircle, subtitle: 'ฟีดและคอมเมนต์ของฉัน' },
  { id: 'summary', label: 'สถิติบ้าน', icon: ChartBar, subtitle: 'อันดับ MVP & กราฟ' },
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

function AppContent({ displayMode, onToggleMode }) {
  const { currentUser, members, setCurrentPhone, logout } = useAuth();
  const { notifications } = useApp();
  const [activeTab, setActiveTab] = useState('home');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [switchUserOpen, setSwitchUserOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [viewingMember, setViewingMember] = useState(null);

  // Auto-hiding floating nav on scroll & touch
  const [isNavVisible, setIsNavVisible] = useState(true);
  const scrollContainerRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const accumulatedDeltaRef = useRef(0);

  // Universal touch, wheel and scroll detection for all mobile phones & PC
  useEffect(() => {
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      if (e.touches && e.touches[0]) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (!e.touches || !e.touches[0]) return;
      const currentY = e.touches[0].clientY;
      const diffY = touchStartY - currentY; // positive = swiping up = scrolling down

      // Swiped up by > 12px -> scroll down -> hide nav completely!
      if (diffY > 12) {
        setIsNavVisible(false);
      }
      // Swiped down by > 8px -> scroll up -> show nav!
      else if (diffY < -8) {
        setIsNavVisible(true);
      }
    };

    const handleWheel = (e) => {
      if (e.deltaY > 8) {
        setIsNavVisible(false);
      } else if (e.deltaY < -8) {
        setIsNavVisible(true);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleScroll = (e) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    const deltaY = currentScrollTop - lastScrollTopRef.current;

    // Reset when at top
    if (currentScrollTop <= 20) {
      setIsNavVisible(true);
      accumulatedDeltaRef.current = 0;
      lastScrollTopRef.current = currentScrollTop;
      return;
    }

    // Direction flip resets accumulator
    if ((deltaY > 0 && accumulatedDeltaRef.current < 0) || (deltaY < 0 && accumulatedDeltaRef.current > 0)) {
      accumulatedDeltaRef.current = 0;
    }
    accumulatedDeltaRef.current += deltaY;

    // Scrolling down accumulated > 14px -> hide nav
    if (accumulatedDeltaRef.current > 14 && currentScrollTop > 30) {
      setIsNavVisible(false);
    }
    // Scrolling up accumulated < -8px -> reveal nav
    else if (accumulatedDeltaRef.current < -8) {
      setIsNavVisible(true);
    }

    lastScrollTopRef.current = currentScrollTop;
  };

  // Reset scroll position and show nav when changing tabs or profiles
  useEffect(() => {
    setIsNavVisible(true);
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

  // Phone App View (Rendered inside Phone Mockup or Centered on Desktop)
  return (
    <div className="relative w-full h-full min-h-full flex flex-col overflow-hidden bg-[#FAF8F5] text-[#2D2825] font-sans select-text">
      {/* Mobile Top Header - Ultra Clean & Elegant */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ECE7DF] px-3.5 sm:px-4 py-2.5 flex items-center justify-between shadow-2xs safe-area-top shrink-0">
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
            <p className="text-[9px] text-[#746C65]">บันทึกความสุขของบ้าน</p>
          </div>
        </div>

        {/* Right Actions: Search (🔍) + Notification (🔔) + User Avatar (👤) + Switcher (👥) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Search Button (ค้นหาคนในบ้าน หรืองานบ้าน) */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#746C65] hover:text-[#2D2825] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            title="ค้นหาคนในบ้าน หรืองานบ้าน"
          >
            <MagnifyingGlass size={18} weight="bold" />
          </button>

          {/* Notification Bell with Badge */}
          <button
            type="button"
            onClick={() => setNotificationOpen(true)}
            className="relative w-8 h-8 rounded-full flex items-center justify-center text-[#746C65] hover:text-[#2D2825] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            title="การแจ้งเตือน"
          >
            <Bell
              size={18}
              weight={unreadCount > 0 ? 'fill' : 'bold'}
              className={unreadCount > 0 ? 'text-[#E88D67]' : 'text-[#746C65]'}
            />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#E88D67] text-white text-[8px] font-black flex items-center justify-center border-2 border-white shadow-xs">
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
            className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-transform hover:scale-105 cursor-pointer ${
              activeTab === 'my-feed' && !viewingMember
                ? 'border-[#5F8D75] ring-2 ring-[#5F8D75]/30'
                : 'border-[#ECE7DF]'
            }`}
            title="ไปที่โปรไฟล์ของฉัน"
          >
            {currentUser?.avatarType === 'image' && currentUser?.avatarImage ? (
              <img src={currentUser.avatarImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#FAF8F5] flex items-center justify-center text-sm font-bold">
                {currentUser?.avatar || '😊'}
              </div>
            )}
          </button>

          {/* Switch User Button */}
          <button
            type="button"
            onClick={() => setSwitchUserOpen(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9E958D] hover:text-[#2D2825] hover:bg-[#FAF8F5] transition-colors cursor-pointer ml-0.5"
            title="สลับสมาชิก"
          >
            <UsersThree size={16} weight="bold" />
          </button>
        </div>
      </header>

      {/* Scrollable View Area with Scroll Event Detection */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 w-full overflow-y-auto overflow-x-hidden no-scrollbar overscroll-contain relative [transform:translateZ(0)]"
      >
        <main className="w-full px-3.5 pt-3 pb-24">
          {activeTab === 'home' && (
            <TodayHome
              onNavigateTab={setActiveTab}
              onViewMemberProfile={handleViewMember}
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

      {/* Floating Mobile Bottom Navigation Island (Auto-hides / collapses gracefully on scroll down) */}
      <nav
        aria-label="เมนูหลักมือถือ"
        className={`fixed md:absolute inset-x-0 z-40 max-w-[390px] mx-auto px-3 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isNavVisible
            ? 'translate-y-0 opacity-100 pointer-events-auto scale-100'
            : 'translate-y-28 opacity-0 pointer-events-none scale-90'
        }`}
        style={{ bottom: 'max(10px, env(safe-area-inset-bottom, 10px))' }}
      >
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-[#ECE7DF] p-1 shadow-2xl flex items-center justify-around pointer-events-auto">
          {TABS.map((tab) => {
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

      {/* Floating Micro-Pill indicator: Shown when nav is tucked ("ฮุบ"), so user can 1-tap restore instantly */}
      {!isNavVisible && (
        <button
          type="button"
          onClick={() => setIsNavVisible(true)}
          className="fixed md:absolute bottom-2 inset-x-0 mx-auto w-16 h-1.5 bg-[#2D2825]/40 hover:bg-[#5F8D75] active:bg-[#5F8D75] rounded-full transition-all z-30 cursor-pointer shadow-sm animate-pulse"
          title="แตะเพื่อเปิดแถบเมนู"
        />
      )}

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

        {/* Fast Switch User Modal */}
        {switchUserOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setSwitchUserOpen(false)}
          >
            <div
              className="bg-white rounded-3xl border border-[#ECE7DF] shadow-xl w-full max-w-xs p-5 animate-enter-rise"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#ECE7DF] mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👨‍👩‍👧‍👦</span>
                  <h3 className="text-base font-bold text-[#2D2825]">สลับสมาชิกในบ้าน</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSwitchUserOpen(false)}
                  className="text-xs text-[#746C65] hover:text-[#2D2825]"
                >
                  ปิด
                </button>
              </div>

              <div className="space-y-2 mb-4">
                {members.map((m) => {
                  const isCurrent = m.id === currentUser?.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setCurrentPhone(m.phone);
                        setSwitchUserOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all text-left ${
                        isCurrent
                          ? 'bg-[#EEF4F0] border-[#5F8D75] shadow-xs'
                          : 'bg-[#FAF8F5] border-[#ECE7DF] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="text-xl">
                          {m.avatarType === 'image' && m.avatarImage ? (
                            <img src={m.avatarImage} alt={m.name} className="w-7 h-7 rounded-lg object-cover" />
                          ) : (
                            m.avatar
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#2D2825]">{m.name}</p>
                          <p className="text-[10px] text-[#746C65]">{m.role}</p>
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-[#5F8D75] px-1.5 py-0.5 bg-white rounded-md">
                          ใช้งาน
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[#ECE7DF] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSwitchUserOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="text-xs text-red-500 hover:underline font-semibold"
                >
                  ออกจากระบบ
                </button>
                <button
                  type="button"
                  onClick={() => setSwitchUserOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] text-xs font-semibold text-[#746C65]"
                >
                  ยกเลิก
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
  const { isLoggedIn } = useAuth();
  // Default to 'phone' mode on PC so it renders as a phone app mockup
  const [displayMode, setDisplayMode] = useState('phone');

  return (
    <PhoneMockup displayMode={displayMode} onToggleMode={setDisplayMode}>
      {!isLoggedIn ? <LoginPage /> : <AppContent displayMode={displayMode} onToggleMode={setDisplayMode} />}
    </PhoneMockup>
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
