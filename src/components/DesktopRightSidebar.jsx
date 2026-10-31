import { UsersThree, PushPin, CalendarBlank, Sparkle, Plus, Broom } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function DesktopRightSidebar({
  onViewMember,
  onNavigateTab,
  onOpenChore,
  onOpenAdmin,
}) {
  const { members, currentUser, isAdmin } = useAuth();
  const { notes, milestones, backendMemberScores } = useApp();

  // Pinned fridge notes (top 2)
  const pinnedNotes = (notes || []).filter((n) => n.isPinned !== 0).slice(0, 2);

  // Upcoming milestones (top 2)
  const upcomingMilestones = (milestones || [])
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 2);

  const getDaysLeft = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'วันนี้!';
    if (diff > 0) return `อีก ${diff} วัน`;
    return `ผ่านมาแล้ว ${Math.abs(diff)} วัน`;
  };

  return (
    <aside className="w-72 xl:w-80 shrink-0 h-full overflow-y-auto no-scrollbar py-3 px-2 space-y-3.5 select-none hidden lg:block">
      {/* 1. Household Contacts (เหมือน Facebook Contacts) */}
      <div className="p-3.5 rounded-2xl bg-white border border-[#ECE7DF] shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <UsersThree size={16} weight="bold" className="text-[#5F8D75]" />
            <h3 className="text-xs font-black text-[#2D2825]">
              สมาชิกในบ้าน ({members?.length || 1})
            </h3>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="text-[10px] font-bold text-[#5F8D75] hover:underline cursor-pointer"
            >
              + เชิญคน
            </button>
          )}
        </div>

        {/* Member items */}
        <div className="space-y-1">
          {(members || []).map((m) => {
            const isMe = m.id === currentUser?.id;
            const score = backendMemberScores?.[m.id] ?? m.points ?? 0;
            return (
              <div
                key={m.id}
                onClick={() => onViewMember(m)}
                className="p-2 rounded-xl hover:bg-[#FAF8F5] transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#ECE7DF] shrink-0">
                    {m.avatarType === 'image' && m.avatarImage ? (
                      <img src={m.avatarImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold">
                        {m.avatar || '😊'}
                      </div>
                    )}
                    {/* Live Online Badge */}
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-[#2D2825] truncate group-hover:text-[#5F8D75] transition-colors">
                      {m.name} {isMe && '(คุณ)'}
                    </p>
                    <p className="text-[10px] text-[#746C65] truncate">{m.role || 'สมาชิก'}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#E88D67] bg-[#FDF1EB] px-1.5 py-0.5 rounded-md shrink-0">
                  {score} แต้ม
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Quick Digital Fridge Pinned Notes */}
      <div className="p-3.5 rounded-2xl bg-white border border-[#ECE7DF] shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <PushPin size={15} weight="bold" className="text-[#E88D67]" />
            <h3 className="text-xs font-black text-[#2D2825]">กระดานตู้เย็น</h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('fridge')}
            className="text-[10px] font-bold text-[#5F8D75] hover:underline cursor-pointer"
          >
            เปิดตู้เย็น →
          </button>
        </div>

        {pinnedNotes.length > 0 ? (
          <div className="space-y-2">
            {pinnedNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onNavigateTab('fridge')}
                className="p-2.5 rounded-xl bg-[#FEF9C3]/70 border border-[#FDE047]/60 shadow-2xs cursor-pointer hover:scale-101 transition-transform"
              >
                <div className="flex items-start gap-1.5">
                  <span className="text-xs">📌</span>
                  <p className="text-xs font-bold text-[#713F12] leading-relaxed line-clamp-2">
                    {note.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            onClick={() => onNavigateTab('fridge')}
            className="p-3 rounded-xl bg-[#FAF8F5] border border-dashed border-[#ECE7DF] text-center cursor-pointer hover:bg-white transition-colors"
          >
            <p className="text-[11px] font-bold text-[#746C65]">ยังไม่มีโน้ตที่ปักหมุด</p>
            <p className="text-[10px] text-[#5F8D75] mt-0.5">+ แปะโน้ตบนตู้เย็นเลย</p>
          </div>
        )}
      </div>

      {/* 3. Upcoming Family Milestones / Events */}
      <div className="p-3.5 rounded-2xl bg-white border border-[#ECE7DF] shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CalendarBlank size={15} weight="bold" className="text-[#3B82F6]" />
            <h3 className="text-xs font-black text-[#2D2825]">กิจกรรมใกล้ถึง</h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('calendar')}
            className="text-[10px] font-bold text-[#5F8D75] hover:underline cursor-pointer"
          >
            ดูปฏิทิน →
          </button>
        </div>

        {upcomingMilestones.length > 0 ? (
          <div className="space-y-2">
            {upcomingMilestones.map((m) => (
              <div
                key={m.id}
                onClick={() => onNavigateTab('calendar')}
                className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECE7DF] hover:bg-[#F2EFEA] transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{m.emoji || '🎂'}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-[#2D2825] truncate">{m.title}</p>
                    <p className="text-[10px] text-[#746C65]">{m.date}</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-[#3B82F6] bg-[#EFF6FF] px-2 py-0.5 rounded-full shrink-0">
                  {getDaysLeft(m.date)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div
            onClick={() => onNavigateTab('calendar')}
            className="p-3 rounded-xl bg-[#FAF8F5] border border-dashed border-[#ECE7DF] text-center cursor-pointer hover:bg-white transition-colors"
          >
            <p className="text-[11px] font-bold text-[#746C65]">ไม่มีนัดหมายเร็ว ๆ นี้</p>
            <p className="text-[10px] text-[#3B82F6] mt-0.5">+ เพิ่มวันสำคัญ</p>
          </div>
        )}
      </div>

      {/* 4. Quick Chores Claim (ส่งงานบ้านด่วน) */}
      <div className="p-3.5 rounded-2xl bg-white border border-[#ECE7DF] shadow-2xs space-y-2">
        <div className="flex items-center gap-1.5">
          <Broom size={15} weight="bold" className="text-[#5F8D75]" />
          <h3 className="text-xs font-black text-[#2D2825]">เควสต์งานบ้านด่วน (+25 แต้ม)</h3>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onOpenChore?.('dishes')}
            className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EEF4F0] border border-[#ECE7DF] hover:border-[#5F8D75]/40 text-left cursor-pointer transition-all"
          >
            <span className="text-base block mb-0.5">🧽</span>
            <p className="text-[11px] font-black text-[#2D2825]">ล้างจาน</p>
            <p className="text-[9px] text-[#5F8D75] font-bold">+25 แต้ม</p>
          </button>
          <button
            type="button"
            onClick={() => onOpenChore?.('clean')}
            className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EEF4F0] border border-[#ECE7DF] hover:border-[#5F8D75]/40 text-left cursor-pointer transition-all"
          >
            <span className="text-base block mb-0.5">🧹</span>
            <p className="text-[11px] font-black text-[#2D2825]">กวาดถูบ้าน</p>
            <p className="text-[9px] text-[#5F8D75] font-bold">+20 แต้ม</p>
          </button>
          <button
            type="button"
            onClick={() => onOpenChore?.('laundry')}
            className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EEF4F0] border border-[#ECE7DF] hover:border-[#5F8D75]/40 text-left cursor-pointer transition-all"
          >
            <span className="text-base block mb-0.5">🧺</span>
            <p className="text-[11px] font-black text-[#2D2825]">ซักผ้า</p>
            <p className="text-[9px] text-[#5F8D75] font-bold">+25 แต้ม</p>
          </button>
          <button
            type="button"
            onClick={() => onOpenChore?.('trash')}
            className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EEF4F0] border border-[#ECE7DF] hover:border-[#5F8D75]/40 text-left cursor-pointer transition-all"
          >
            <span className="text-base block mb-0.5">🗑️</span>
            <p className="text-[11px] font-black text-[#2D2825]">ทิ้งขยะ</p>
            <p className="text-[9px] text-[#5F8D75] font-bold">+15 แต้ม</p>
          </button>
        </div>
      </div>
    </aside>
  );
}
