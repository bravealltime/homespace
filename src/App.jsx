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
  const { currentUser, members, setCurrentPhone, logout, register } = useAuth();
  const { notifications } = useApp();
  const [activeTab, setActiveTab] = useState('home');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [switchUserOpen, setSwitchUserOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [viewingMember, setViewingMember] = useState(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberEmoji, setNewMemberEmoji] = useState('🧑');

  // Auto-hiding floating nav on scroll & touch
  const [isNavVisible, setIsNavVisible] = useState(true);
  const scrollContainerRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const accumulatedDeltaRef = useRef(0);

  // Scroll event handler on container: smooth, reliable collapse & reveal
  const handleScroll = (e) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    const deltaY = currentScrollTop - lastScrollTopRef.current;

    // 1. If at top of feed (first 35px), ALWAYS show nav
    if (currentScrollTop <= 35) {
      setIsNavVisible(true);
      accumulatedDeltaRef.current = 0;
      lastScrollTopRef.current = currentScrollTop;
      return;
    }

    // 2. Accumulate delta in same direction
    if ((deltaY > 0 && accumulatedDeltaRef.current < 0) || (deltaY < 0 && accumulatedDeltaRef.current > 0)) {
      accumulatedDeltaRef.current = 0;
    }
    accumulatedDeltaRef.current += deltaY;

    // 3. Scrolling DOWN accumulated > 10px -> collapse/tuck ("ฮุบ") nav
    if (accumulatedDeltaRef.current > 10 && currentScrollTop > 40) {
      setIsNavVisible(false);
    }
    // 4. Scrolling UP accumulated < -6px -> smoothly reveal nav
    else if (accumulatedDeltaRef.current < -6) {
      setIsNavVisible(true);
    }

    lastScrollTopRef.current = currentScrollTop;
  };

  // Instantaneous touch & wheel listeners on the container
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let lastTouchY = 0;

    const handleTouchStart = (e) => {
      if (e.touches && e.touches[0]) {
        lastTouchY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (!e.touches || !e.touches[0]) return;
      const currentY = e.touches[0].clientY;
      const deltaY = lastTouchY - currentY; // positive = dragged up = scrolling down

      if (Math.abs(deltaY) > 6) {
        if (deltaY > 6 && container.scrollTop > 30) {
          setIsNavVisible(false);
        } else if (deltaY < -6) {
          setIsNavVisible(true);
        }
        lastTouchY = currentY;
      }
    };

    const handleWheel = (e) => {
      if (e.deltaY > 6 && container.scrollTop > 30) {
        setIsNavVisible(false);
      } else if (e.deltaY < -6) {
        setIsNavVisible(true);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

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
        className="flex-1 w-full overflow-y-auto overflow-x-hidden no-scrollbar overscroll-contain relative"
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
        className={`absolute bottom-3 inset-x-0 z-40 max-w-[390px] mx-auto px-3.5 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isNavVisible
            ? 'translate-y-0 opacity-100 pointer-events-auto scale-100'
            : 'translate-y-24 opacity-0 pointer-events-none scale-90'
        }`}
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
          className="absolute bottom-1.5 inset-x-0 mx-auto w-16 h-1.5 bg-[#2D2825]/40 hover:bg-[#5F8D75] active:bg-[#5F8D75] rounded-full transition-all z-30 cursor-pointer shadow-2xs animate-pulse"
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

              <div className="space-y-2 mb-3">
                {members.map((m) => {
                  const isCurrent = m.id === currentUser?.id;
                  return (
                    <div
                      key={m.id}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-[#EEF4F0] border-[#5F8D75] shadow-xs'
                          : 'bg-[#FAF8F5] border-[#ECE7DF] hover:bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPhone(m.phone);
                          setSwitchUserOpen(false);
                        }}
                        className="flex-1 flex items-center gap-2.5 text-left cursor-pointer"
                      >
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
                      </button>

                      {isCurrent ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSwitchUserOpen(false);
                              setProfileOpen(true);
                            }}
                            className="text-[10px] font-bold text-[#746C65] hover:text-[#2D2825] px-2 py-0.8 bg-white rounded-lg border border-[#ECE7DF] shadow-2xs cursor-pointer"
                            title="แก้ไขโปรไฟล์"
                          >
                            ✏️ แก้ไข
                          </button>
                          <span className="text-[10px] font-bold text-[#5F8D75] px-1.5 py-0.5 bg-white rounded-md">
                            ใช้งาน
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPhone(m.phone);
                            setSwitchUserOpen(false);
                          }}
                          className="text-[10px] font-bold text-[#5F8D75] hover:underline px-2 py-1 cursor-pointer"
                        >
                          สลับ →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add New Member Toggle / Form */}
              {!isAddingMember ? (
                <button
                  type="button"
                  onClick={() => setIsAddingMember(true)}
                  className="w-full mb-3 py-2 px-3 rounded-2xl border border-dashed border-[#5F8D75] bg-[#EEF4F0]/60 hover:bg-[#EEF4F0] text-[#5F8D75] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus size={14} weight="bold" />
                  <span>+ เพิ่มสมาชิกครอบครัว</span>
                </button>
              ) : (
                <div className="mb-3 p-3 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2D2825]">เพิ่มสมาชิกใหม่</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingMember(false)}
                      className="text-xs text-[#746C65] hover:text-[#2D2825]"
                    >
                      ยกเลิก
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="ชื่อ เช่น ปู่, ย่า, น้าปุ้ย, สัตว์เลี้ยง"
                    className="w-full px-2.5 py-1.5 bg-white rounded-xl border border-[#ECE7DF] text-xs text-[#2D2825] focus:outline-none focus:border-[#5F8D75]"
                  />
                  <input
                    type="text"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    placeholder="บทบาท เช่น คุณยาย, พี่ชาย, สุนัข"
                    className="w-full px-2.5 py-1.5 bg-white rounded-xl border border-[#ECE7DF] text-xs text-[#2D2825] focus:outline-none focus:border-[#5F8D75]"
                  />
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] text-[#746C65] shrink-0">อิโมจิ:</span>
                    <div className="flex gap-1 overflow-x-auto no-scrollbar">
                      {['👴', '👵', '🧑', '👧', '👶', '🐶', '🐱', '✨'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewMemberEmoji(emoji)}
                          className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center border transition-all cursor-pointer ${
                            newMemberEmoji === emoji ? 'bg-white border-[#5F8D75] shadow-xs scale-110 font-bold' : 'bg-transparent border-transparent'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newMemberName.trim()) return;
                      const dummyPhone = `08${Math.floor(10000000 + Math.random() * 90000000)}`;
                      await register(dummyPhone, newMemberName.trim(), newMemberRole.trim() || 'สมาชิกในบ้าน', {
                        avatar: newMemberEmoji,
                        avatarType: 'emoji',
                      });
                      setCurrentPhone(dummyPhone);
                      setNewMemberName('');
                      setNewMemberRole('');
                      setIsAddingMember(false);
                      setSwitchUserOpen(false);
                    }}
                    disabled={!newMemberName.trim()}
                    className="w-full py-2 bg-[#5F8D75] disabled:bg-[#ECE7DF] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    บันทึกสมาชิกใหม่ ✨
                  </button>
                </div>
              )}

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
