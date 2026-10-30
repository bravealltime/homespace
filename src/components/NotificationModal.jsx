import { useEffect } from 'react';
import {
  X,
  Bell,
  Heart,
  ChatCircle,
  CheckCircle,
  Sparkle,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

function timeAgo(timestamp) {
  if (!timestamp) return 'เมื่อสักครู่';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชม. ที่แล้ว`;
  const days = Math.floor(hours / 24);
  return `${days} วันที่แล้ว`;
}

export default function NotificationModal({ isOpen, onClose, onNavigateToMyFeed }) {
  const { currentUser } = useAuth();
  const { members, notifications, markNotificationsRead } = useApp();

  // Filter notifications for current user
  const userNotifications = (notifications || []).filter(
    (n) => n.recipientId === currentUser?.id
  );

  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    if (currentUser?.id) {
      markNotificationsRead(currentUser.id);
    }
  };

  const handleSelectNotif = (notif) => {
    if (currentUser?.id) {
      markNotificationsRead(currentUser.id);
    }
    onClose();
    if (onNavigateToMyFeed) {
      onNavigateToMyFeed(notif.postId);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl border border-[#ECE7DF] shadow-2xl w-full max-w-sm max-h-[85dvh] overflow-hidden animate-enter-rise text-[#2D2825] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 px-4 border-b border-[#ECE7DF] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#E88D67] flex items-center justify-center">
              <Bell size={18} weight="fill" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#2D2825]">การแจ้งเตือน</h2>
              <p className="text-[10px] text-[#746C65]">
                {unreadCount > 0 ? `มี ${unreadCount} รายการที่ยังไม่ได้อ่าน` : 'ไม่มีข้อความใหม่'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#FAF8F5] hover:bg-[#ECE7DF] text-[#746C65] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={15} weight="bold" />
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar [scrollbar-width:none]">
          {userNotifications.length > 0 ? (
            userNotifications.map((notif) => {
              const sender = members.find((m) => m.id === notif.senderId);
              const isComment = notif.type === 'comment';

              return (
                <div
                  key={notif.id}
                  onClick={() => handleSelectNotif(notif)}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                    notif.isRead
                      ? 'bg-white border-[#ECE7DF] hover:bg-[#FAF8F5]'
                      : 'bg-[#FDF9F5] border-[#E88D67]/40 shadow-2xs hover:bg-[#FAF5EE]'
                  }`}
                >
                  {/* Sender Avatar with Icon badge */}
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#ECE7DF] overflow-hidden flex items-center justify-center text-lg">
                      {sender?.avatarType === 'image' && sender?.avatarImage ? (
                        <img src={sender.avatarImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        sender?.avatar || '😊'
                      )}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white shadow-xs ${
                        isComment ? 'bg-[#5F8D75]' : 'bg-[#E88D67]'
                      }`}
                    >
                      {isComment ? <ChatCircle size={10} weight="fill" /> : <Heart size={10} weight="fill" />}
                    </div>
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#2D2825] leading-snug">
                      <span className="font-bold">{sender?.name || 'สมาชิกในบ้าน'}</span>{' '}
                      {isComment ? (
                        <span>
                          แสดงความคิดเห็น: <span className="font-semibold text-[#5F8D75]">"{notif.text}"</span>
                        </span>
                      ) : (
                        <span className="text-[#E88D67] font-semibold">{notif.text}</span>
                      )}
                    </p>

                    {notif.postSnippet && (
                      <p className="text-[10px] text-[#9E958D] truncate mt-0.5">
                        ในโพสต์: "{notif.postSnippet}"
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] text-[#B0A79E] font-medium">
                        {timeAgo(notif.timestamp)}
                      </span>
                      <span className="text-[10px] font-bold text-[#5F8D75] hover:underline">
                        ดูโพสต์ →
                      </span>
                    </div>
                  </div>

                  {/* Unread Red Dot */}
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-[#E88D67] shrink-0 mt-1" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF8F5] text-[#9E958D] flex items-center justify-center text-2xl">
                🔔
              </div>
              <p className="text-xs font-bold text-[#2D2825]">ยังไม่มีการแจ้งเตือน</p>
              <p className="text-[10px] text-[#746C65] max-w-[200px] mx-auto">
                เมื่อคนในบ้านมาคอมเมนต์หรือกดไลก์โพสต์ของคุณ จะมีแจ้งเตือนขึ้นที่นี่ทันที!
              </p>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        {userNotifications.length > 0 && (
          <div className="p-3 bg-[#FAF8F5] border-t border-[#ECE7DF] flex items-center justify-between">
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="text-xs font-bold text-[#5F8D75] hover:text-[#476E5B] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              อ่านทั้งหมดแล้ว ✓
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onNavigateToMyFeed) onNavigateToMyFeed();
              }}
              className="text-xs font-bold text-[#2D2825] hover:underline"
            >
              ไปที่ฟีดของฉัน →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
