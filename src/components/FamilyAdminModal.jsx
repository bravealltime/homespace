import { useState } from 'react';
import {
  X,
  UsersThree,
  Check,
  UserCheck,
  UserMinus,
  LinkSimple,
  Copy,
  Clock,
  ShieldCheck,
  House,
  Sparkle,
  Trash,
} from '@phosphor-icons/react';
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

export default function FamilyAdminModal({ isOpen, onClose }) {
  const {
    currentFamily,
    pendingRequests,
    members,
    approveRequest,
    rejectRequest,
    currentUser,
    removeMember,
  } = useAuth();

  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'invite'
  const [copied, setCopied] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  if (!isOpen) return null;

  // Generate invite link based on current host/IP
  const inviteCode = currentFamily?.code || 'HOME-2026';
  const currentOrigin = window.location.origin;
  const inviteLink = `${currentOrigin}/?invite=${inviteCode}`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleApprove = async (memberId) => {
    setProcessingId(memberId);
    await approveRequest(memberId);
    setProcessingId(null);
  };

  const handleReject = async (memberId) => {
    if (window.confirm('คุณต้องการปฏิเสธคำขอนี้ใช่หรือไม่?')) {
      setProcessingId(memberId);
      await rejectRequest(memberId);
      setProcessingId(null);
    }
  };

  const handleDeleteMember = async (member) => {
    if (member.id === currentUser?.id) {
      alert('คุณไม่สามารถลบตัวเองออกจากครอบครัวได้');
      return;
    }
    const confirmed = window.confirm(
      `คุณต้องการลบ "${member.name}" (${member.role}) ออกจากครอบครัวใช่หรือไม่?`
    );
    if (!confirmed) return;

    try {
      await removeMember(member.id);
    } catch (err) {
      console.error('Delete member error:', err);
      alert('เกิดข้อผิดพลาดในการลบสมาชิก');
    }
  };

  const activeMembers = members.filter((m) => m.status === 'active');

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl border border-[#ECE7DF] shadow-2xl w-full max-w-sm max-h-[88dvh] overflow-hidden animate-enter-rise text-[#2D2825] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#ECE7DF] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#EEF4F0] text-[#5F8D75] flex items-center justify-center text-lg shadow-2xs">
              <ShieldCheck size={20} weight="fill" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black text-[#2D2825]">จัดการครอบครัว (Admin)</h2>
                <span className="text-[9px] bg-[#5F8D75] text-white px-1.5 py-0.2 rounded-md font-bold">
                  หัวหน้าบ้าน
                </span>
              </div>
              <p className="text-[10px] text-[#746C65] truncate max-w-[200px]">
                {currentFamily?.name || 'บ้านสุขใจ'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#FAF8F5] hover:bg-[#ECE7DF] text-[#746C65] flex items-center justify-center text-xs cursor-pointer transition-colors"
          >
            <X size={15} weight="bold" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-[#FAF8F5] border-b border-[#ECE7DF] text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'requests'
                ? 'bg-white text-[#2D2825] shadow-xs'
                : 'text-[#746C65] hover:text-[#2D2825]'
            }`}
          >
            <Clock size={15} weight="bold" className="shrink-0" />
            <span className="whitespace-nowrap">คำขอเข้าบ้าน</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#E88D67] text-white text-[9px] font-black shrink-0">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invite')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'invite'
                ? 'bg-white text-[#2D2825] shadow-xs'
                : 'text-[#746C65] hover:text-[#2D2825]'
            }`}
          >
            <LinkSimple size={15} weight="bold" className="shrink-0" />
            <span className="whitespace-nowrap">ลิงก์เชิญ & สมาชิก</span>
          </button>
        </div>

        {/* Tab 1: Pending Join Requests */}
        {activeTab === 'requests' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar [scrollbar-width:none]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#2D2825]">
                คำขอที่รอการอนุมัติ ({pendingRequests.length})
              </span>
              <span className="text-[10px] text-[#746C65]">เฉพาะ Admin ที่อนุมัติได้</span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="bg-[#FAF8F5] rounded-2xl p-6 text-center border border-dashed border-[#ECE7DF] space-y-2 mt-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-white flex items-center justify-center text-2xl shadow-2xs">
                  ✨
                </div>
                <p className="text-xs font-bold text-[#2D2825]">ยังไม่มีคำขอใหม่ในขณะนี้</p>
                <p className="text-[11px] text-[#746C65]">
                  เมื่อมีคนเข้าเว็บผ่านลิงก์เชิญและสมัครด้วยเบอร์โทร คำขอจะปรากฏที่นี่เพื่อรอคุณอนุมัติ
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('invite')}
                  className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#5F8D75] text-white text-xs font-bold shadow-xs cursor-pointer hover:bg-[#476E5B] transition-colors"
                >
                  <LinkSimple size={13} weight="bold" />
                  <span>ดูลิงก์เชิญครอบครัว</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-11 h-11 rounded-2xl bg-white border border-[#ECE7DF] flex items-center justify-center text-xl shrink-0 overflow-hidden shadow-2xs">
                        {req.avatarType === 'image' && req.avatarImage ? (
                          <img src={req.avatarImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          req.avatar || '😊'
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-[#2D2825] truncate">{req.name}</h4>
                          <span className="text-[10px] bg-[#EEF4F0] text-[#5F8D75] px-1.5 py-0.2 rounded font-bold">
                            {req.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#746C65] font-mono mt-0.5">
                          เบอร์โทร: {req.phone}
                        </p>
                        <p className="text-[9px] text-[#9E958D]">
                          ส่งคำขอ {timeAgo(req.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Approve / Reject */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#ECE7DF]/60">
                      <button
                        type="button"
                        onClick={() => handleReject(req.id)}
                        disabled={processingId === req.id}
                        className="py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-500 border border-[#ECE7DF] hover:border-red-200 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <UserMinus size={14} weight="bold" />
                        <span>ปฏิเสธ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApprove(req.id)}
                        disabled={processingId === req.id}
                        className="py-1.5 rounded-xl bg-[#5F8D75] hover:bg-[#476E5B] text-white text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      >
                        {processingId === req.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <UserCheck size={14} weight="bold" />
                            <span>อนุมัติเข้าบ้าน</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Invite Link & Family Code */}
        {activeTab === 'invite' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar [scrollbar-width:none]">
            {/* Family Code Card */}
            <div className="bg-[#EEF4F0] rounded-2xl p-4 border border-[#5F8D75]/25 text-center space-y-2">
              <span className="text-[10px] font-black text-[#5F8D75] uppercase tracking-wider block">
                รหัสครอบครัว (FAMILY CODE)
              </span>
              <p className="text-2xl font-black text-[#2D2825] tracking-widest font-mono">
                {inviteCode}
              </p>
              <p className="text-[10px] text-[#746C65]">
                ใช้รหัสนี้กรอกตอนสมัคร หรือแชร์ลิงก์ด้านล่างให้คนในบ้านเปิดผ่านเบราว์เซอร์ได้ทันที
              </p>
            </div>

            {/* Shareable Link Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#746C65] block">
                ลิงก์เชิญเข้าร่วมครอบครัว:
              </label>
              <div className="flex items-center gap-2 p-2 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF]">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 bg-transparent text-[11px] font-mono text-[#2D2825] focus:outline-none select-all truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-xl bg-[#5F8D75] hover:bg-[#476E5B] text-white text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  {copied ? <Check size={13} weight="bold" /> : <Copy size={13} weight="bold" />}
                  <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                </button>
              </div>
              {copied && (
                <p className="text-[10px] text-[#5F8D75] font-bold text-center animate-enter-rise">
                  ✨ คัดลอกลิงก์สำเร็จ ส่งให้คนในครอบครัวทาง LINE หรือแชทได้เลย!
                </p>
              )}
            </div>

            {/* Active Members in Family */}
            <div className="space-y-2 pt-2 border-t border-[#ECE7DF]">
              <span className="text-xs font-black text-[#2D2825] block">
                สมาชิกในครอบครัวปัจจุบัน ({activeMembers.length} คน)
              </span>
              <div className="space-y-1.5">
                {activeMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#ECE7DF]"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-base border border-[#ECE7DF] overflow-hidden">
                        {m.avatarType === 'image' && m.avatarImage ? (
                          <img src={m.avatarImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          m.avatar
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-[#2D2825]">{m.name}</span>
                          {(m.isAdmin === 1 || m.role?.includes('เจ้าบ้าน') || m.role?.includes('หัวหน้า') || m.role?.includes('พ่อ') || m.role?.includes('แม่') || currentFamily?.adminMemberId === m.id) && (
                            <span className="text-[9px] bg-[#5F8D75] text-white px-1 py-0.1 rounded font-bold">
                              Admin
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#746C65]">{m.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#9E958D]">{m.phone}</span>
                      {m.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(m)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title={`ลบ ${m.name} ออกจากบ้าน`}
                        >
                          <Trash size={14} weight="bold" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
