import { useState } from 'react';
import {
  X,
  PhoneCall,
  Plus,
  Trash,
  CheckCircle,
  Wrench,
  Sparkle,
  Copy,
  Check,
  CalendarBlank,
  Clock,
  Warning,
  FirstAid,
  Buildings,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export function getMaintenanceStatus(nextDueDateStr) {
  if (!nextDueDateStr) return { days: 999, text: '', isDue: false, isOverdue: false, badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

  const target = new Date(nextDueDateStr);
  target.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      days: diffDays,
      text: `เลยกำหนดมาแล้ว ${Math.abs(diffDays)} วัน! ⚠️`,
      isDue: true,
      isOverdue: true,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-black',
    };
  } else if (diffDays === 0) {
    return {
      days: 0,
      text: 'ถึงกำหนดวันนี้! 🔔',
      isDue: true,
      isOverdue: false,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-black animate-pulse',
    };
  } else if (diffDays <= 14) {
    return {
      days: diffDays,
      text: `ใกล้ถึงกำหนด (อีก ${diffDays} วัน) ⏰`,
      isDue: true,
      isOverdue: false,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
    };
  } else {
    return {
      days: diffDays,
      text: `รอบถัดไปอีก ${diffDays} วัน 🟢`,
      isDue: false,
      isOverdue: false,
      badgeClass: 'bg-emerald-50 text-[#5F8D75] border-[#5F8D75]/30',
    };
  }
}

export default function HomeHandbookModal({ isOpen, onClose }) {
  const {
    homeContacts,
    addHomeContact,
    deleteHomeContact,
    homeMaintenance,
    addHomeMaintenance,
    completeHomeMaintenance,
    deleteHomeMaintenance,
    seniorMode,
    t,
  } = useApp();
  const { currentUser, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' | 'maintenance'
  const [copiedId, setCopiedId] = useState(null);

  // Forms state
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactCategory, setNewContactCategory] = useState('technician');
  const [newContactEmoji, setNewContactEmoji] = useState('🛠️');
  const [newContactNote, setNewContactNote] = useState('');

  const [showAddMaint, setShowAddMaint] = useState(false);
  const [newMaintTitle, setNewMaintTitle] = useState('');
  const [newMaintCategory, setNewMaintCategory] = useState('air');
  const [newMaintEmoji, setNewMaintEmoji] = useState('❄️');
  const [newMaintFreq, setNewMaintFreq] = useState(6);
  const [newMaintLastDate, setNewMaintLastDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newMaintCost, setNewMaintCost] = useState('');
  const [newMaintPhone, setNewMaintPhone] = useState('');
  const [newMaintNote, setNewMaintNote] = useState('');

  const [completingId, setCompletingId] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  if (!isOpen) return null;

  const handleCopyPhone = (id, phone) => {
    navigator.clipboard?.writeText?.(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    await addHomeContact({
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      category: newContactCategory,
      emoji: newContactEmoji,
      note: newContactNote.trim(),
    });

    setNewContactName('');
    setNewContactPhone('');
    setNewContactNote('');
    setShowAddContact(false);
  };

  const handleSaveMaint = async (e) => {
    e.preventDefault();
    if (!newMaintTitle.trim()) return;

    await addHomeMaintenance({
      title: newMaintTitle.trim(),
      category: newMaintCategory,
      emoji: newMaintEmoji,
      frequencyMonths: Number(newMaintFreq || 6),
      lastServicedDate: newMaintLastDate,
      cost: newMaintCost.trim(),
      technicianPhone: newMaintPhone.trim(),
      note: newMaintNote.trim(),
    });

    setNewMaintTitle('');
    setNewMaintCost('');
    setNewMaintPhone('');
    setNewMaintNote('');
    setShowAddMaint(false);
  };

  const handleCompleteItem = async (item) => {
    setCompletingId(item.id);
    try {
      await completeHomeMaintenance(item.id);
      setSuccessToast(`บันทึกเรียบร้อย! ✨ ได้รับ +25 แต้มลงโหลของบ้าน`);
      setTimeout(() => setSuccessToast(null), 3000);
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-[#ECE7DF] shadow-2xl w-full max-w-lg max-h-[90dvh] flex flex-col overflow-hidden animate-enter-rise"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-[#ECE7DF] flex items-center justify-between bg-[#FAF8F5]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5F8D75] text-white flex items-center justify-center text-xl shadow-xs">
              🏡
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#2D2825] leading-tight">
                สมุดคู่มือบ้าน & เบอร์ช่างฉุกเฉิน
              </h2>
              <p className="text-[11px] text-[#746C65]">เบอร์ติดต่อด่วน & บันทึกการดูแลบ้าน</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#746C65] hover:bg-[#ECE7DF] transition-colors cursor-pointer"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Tab Switcher: เบอร์ติดต่อสำคัญ vs บันทึกการดูแลบ้าน */}
        <div className="p-3 pb-0 bg-white border-b border-[#ECE7DF] shrink-0">
          <div className="grid grid-cols-2 p-1 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('contacts')}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'contacts'
                  ? 'bg-white text-[#2D2825] shadow-xs font-black'
                  : 'text-[#746C65] hover:text-[#2D2825]'
              }`}
            >
              <PhoneCall size={16} weight="bold" className="text-[#5F8D75]" />
              <span>เบอร์ช่าง & ฉุกเฉิน ({homeContacts.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('maintenance')}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'maintenance'
                  ? 'bg-white text-[#2D2825] shadow-xs font-black'
                  : 'text-[#746C65] hover:text-[#2D2825]'
              }`}
            >
              <Wrench size={16} weight="bold" className="text-[#E88D67]" />
              <span>บันทึกดูแลบ้าน ({homeMaintenance.length})</span>
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {successToast && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-xs">
            <CheckCircle size={18} weight="fill" className="text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-4 space-y-3.5">
          {/* ========================================================= */}
          {/* TAB 1: CONTACTS & TECHNICIANS                             */}
          {/* ========================================================= */}
          {activeTab === 'contacts' && (
            <div className="space-y-3">
              {/* Senior-Friendly Quick Emergency Strip */}
              <div className="p-2.5 rounded-2xl bg-[#FEF2F2] border border-red-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚑</span>
                  <div>
                    <p className="text-xs font-black text-red-900 leading-tight">สายด่วนกู้ชีพฉุกเฉิน (ทั่วไทย)</p>
                    <p className="text-[10px] text-red-700">โทรฟรี 24 ชั่วโมง</p>
                  </div>
                </div>
                <a
                  href="tel:1669"
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 no-underline"
                >
                  <PhoneCall size={14} weight="fill" />
                  <span>โทร 1669</span>
                </a>
              </div>

              {/* Contacts List */}
              <div className="space-y-2.5">
                {homeContacts.map((c) => {
                  return (
                    <div
                      key={c.id}
                      className="p-3 sm:p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DF] hover:border-[#5F8D75]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-[#ECE7DF] flex items-center justify-center text-xl shrink-0 shadow-2xs">
                          {c.emoji || '📞'}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-black text-[#2D2825] truncate">
                            {c.name}
                          </h3>
                          {c.note && (
                            <p className="text-[11px] text-[#746C65] mt-0.5 line-clamp-1">{c.note}</p>
                          )}
                          <p className="text-xs font-mono font-bold text-[#5F8D75] mt-0.5 flex items-center gap-1">
                            <span>📞 {c.phone}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyPhone(c.id, c.phone)}
                              className="text-[10px] text-[#746C65] hover:text-[#2D2825] cursor-pointer ml-1 underline"
                            >
                              {copiedId === c.id ? 'คัดลอกแล้ว' : 'คัดลอก'}
                            </button>
                          </p>
                        </div>
                      </div>

                      {/* Right Big Dial Button */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <a
                          href={`tel:${c.phone}`}
                          className="px-4 py-2 rounded-xl bg-[#5F8D75] hover:bg-[#4E7661] text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-xs active:scale-95 transition-all no-underline"
                          title="กดเพื่อโทรออกทันที"
                        >
                          <PhoneCall size={16} weight="fill" />
                          <span>โทรออก</span>
                        </a>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => deleteHomeContact(c.id)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#9E958D] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="ลบเบอร์นี้"
                          >
                            <Trash size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Contact Form Toggle */}
              {showAddContact ? (
                <form
                  onSubmit={handleSaveContact}
                  className="p-3.5 rounded-2xl bg-white border border-[#5F8D75]/40 shadow-xs space-y-3 animate-enter-rise"
                >
                  <h4 className="text-xs font-black text-[#2D2825]">เพิ่มเบอร์ติดต่อช่าง / บุคคลสำคัญ</h4>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-[#746C65] block mb-1">ชื่อช่าง / ร้าน / บริการ *</label>
                      <input
                        type="text"
                        required
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        placeholder="เช่น ช่างแอร์สมศักดิ์"
                        className="w-full text-xs p-2 rounded-xl border border-[#ECE7DF] focus:border-[#5F8D75] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#746C65] block mb-1">ไอคอน</label>
                      <select
                        value={newContactEmoji}
                        onChange={(e) => setNewContactEmoji(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-[#ECE7DF] bg-white outline-none"
                      >
                        <option value="❄️">❄️ แอร์</option>
                        <option value="⚡">⚡ ไฟฟ้า</option>
                        <option value="🚰">🚰 ประปา</option>
                        <option value="🏢">🏢 นิติ</option>
                        <option value="🚑">🚑 ฉุกเฉิน</option>
                        <option value="🚗">🚗 อู่รถ</option>
                        <option value="🐶">🐶 สัตว์เลี้ยง</option>
                        <option value="📞">📞 ทั่วไป</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#746C65] block mb-1">เบอร์โทรศัพท์ (ใส่ตัวเลขเพื่อโทรออกได้ทันที) *</label>
                    <input
                      type="tel"
                      required
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      placeholder="081xxxxxxx หรือ 02xxxxxxx"
                      className="w-full text-xs p-2 rounded-xl border border-[#ECE7DF] focus:border-[#5F8D75] outline-none font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#746C65] block mb-1">หมายเหตุเพิ่มเติม</label>
                    <input
                      type="text"
                      value={newContactNote}
                      onChange={(e) => setNewContactNote(e.target.value)}
                      placeholder="เช่น ค่าล้าง 500 บาท, ล้างดีมาก"
                      className="w-full text-xs p-2 rounded-xl border border-[#ECE7DF] focus:border-[#5F8D75] outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddContact(false)}
                      className="px-3 py-1.5 rounded-xl border border-[#ECE7DF] text-xs font-bold text-[#746C65] hover:bg-[#FAF8F5] cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-[#5F8D75] text-white text-xs font-black hover:bg-[#4E7661] cursor-pointer shadow-xs"
                    >
                      บันทึกเบอร์
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddContact(true)}
                  className="w-full py-2.5 rounded-2xl border-2 border-dashed border-[#ECE7DF] hover:border-[#5F8D75] bg-[#FAF8F5] text-xs font-bold text-[#5F8D75] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus size={16} weight="bold" />
                  <span>เพิ่มเบอร์ช่าง / บุคคลสำคัญใหม่</span>
                </button>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: HOME MAINTENANCE & REMINDERS                       */}
          {/* ========================================================= */}
          {activeTab === 'maintenance' && (
            <div className="space-y-3">
              <p className="text-[11px] text-[#746C65] leading-relaxed">
                ระบบคำนวณรอบการดูแลบ้านให้อัตโนมัติ เมื่อช่างมาทำเสร็จให้กดปุ่ม <b>"บันทึกว่าทำแล้ว"</b> เพื่ออัปเดตรอบถัดไปและรับแต้มโหลของบ้าน 🍯
              </p>

              {/* Maintenance Items List */}
              <div className="space-y-3">
                {homeMaintenance.map((m) => {
                  const status = getMaintenanceStatus(m.nextDueDate);
                  return (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DF] space-y-2.5 shadow-2xs hover:border-[#5F8D75]/40 transition-all"
                    >
                      {/* Top Row: Title + Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl shrink-0">{m.emoji || '🛠️'}</span>
                          <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-black text-[#2D2825] truncate">
                              {m.title}
                            </h3>
                            <p className="text-[10px] text-[#746C65]">
                              รอบทุก {m.frequencyMonths} เดือน {m.cost ? `· ค่าใช้จ่ายประมาณ ${m.cost}` : ''}
                            </p>
                          </div>
                        </div>

                        <span className={`text-[10px] px-2.5 py-1 rounded-full border shrink-0 ${status.badgeClass}`}>
                          {status.text}
                        </span>
                      </div>

                      {/* Schedule Info Box */}
                      <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-white border border-[#ECE7DF] text-[11px]">
                        <div>
                          <span className="text-[#9E958D] block text-[9px] font-bold">ทำครั้งล่าสุด:</span>
                          <span className="font-bold text-[#2D2825]">{m.lastServicedDate || 'ยังไม่ระบุ'}</span>
                        </div>
                        <div>
                          <span className="text-[#9E958D] block text-[9px] font-bold">รอบถัดไป:</span>
                          <span className="font-bold text-[#E88D67]">{m.nextDueDate || 'ยังไม่ระบุ'}</span>
                        </div>
                      </div>

                      {m.note && (
                        <p className="text-[10px] text-[#746C65] bg-white/60 p-2 rounded-lg border border-[#ECE7DF]">
                          💡 หมายเหตุ: {m.note}
                        </p>
                      )}

                      {/* Bottom Action Bar */}
                      <div className="flex items-center justify-between pt-1">
                        {m.technicianPhone ? (
                          <a
                            href={`tel:${m.technicianPhone}`}
                            className="text-[11px] font-bold text-[#5F8D75] hover:underline flex items-center gap-1 no-underline"
                          >
                            <PhoneCall size={13} weight="fill" />
                            <span>โทรหาช่าง ({m.technicianPhone})</span>
                          </a>
                        ) : (
                          <span />
                        )}

                        <div className="flex items-center gap-2">
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => deleteHomeMaintenance(m.id)}
                              className="w-7 h-7 rounded-lg text-[#9E958D] hover:text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer transition-colors"
                              title="ลบรายการนี้"
                            >
                              <Trash size={15} />
                            </button>
                          )}

                          {/* Complete Maintenance Button */}
                          <button
                            type="button"
                            disabled={completingId === m.id}
                            onClick={() => handleCompleteItem(m)}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#5F8D75] to-[#4E7661] text-white text-xs font-black shadow-xs hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle size={15} weight="bold" />
                            <span>{completingId === m.id ? 'กำลังบันทึก...' : 'บันทึกว่าทำแล้ว (+25 แต้ม)'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Maintenance Form Toggle */}
              {showAddMaint ? (
                <form
                  onSubmit={handleSaveMaint}
                  className="p-3.5 rounded-2xl bg-white border border-[#E88D67]/40 shadow-xs space-y-3 animate-enter-rise"
                >
                  <h4 className="text-xs font-black text-[#2D2825]">เพิ่มรายการดูแลรักษาบ้านใหม่</h4>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-[#746C65] block mb-1">ชื่อรายการ *</label>
                      <input
                        type="text"
                        required
                        value={newMaintTitle}
                        onChange={(e) => setNewMaintTitle(e.target.value)}
                        placeholder="เช่น ล้างแอร์ห้องนอนเล็ก"
                        className="w-full text-xs p-2 rounded-xl border border-[#ECE7DF] focus:border-[#E88D67] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#746C65] block mb-1">ไอคอน</label>
                      <select
                        value={newMaintEmoji}
                        onChange={(e) => setNewMaintEmoji(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-[#ECE7DF] bg-white outline-none"
                      >
                        <option value="❄️">❄️ แอร์</option>
                        <option value="💧">💧 เครื่องกรองน้ำ</option>
                        <option value="🐜">🐜 ปลวก/แมลง</option>
                        <option value="🧯">🧯 ถังดับเพลิง</option>
                        <option value="🚗">🚗 เช็กรถ</option>
                        <option value="🧹">🧹 ถังบำบัด</option>
                        <option value="🛠️">🛠️ ทั่วไป</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[#746C65] block mb-1">รอบการดูแล (ทุกกี่เดือน)</label>
                      <select
                        value={newMaintFreq}
                        onChange={(e) => setNewMaintFreq(Number(e.target.value))}
                        className="w-full text-xs p-2 rounded-xl border border-[#ECE7DF] bg-white outline-none font-bold"
                      >
                        <option value={1}>ทุก 1 เดือน</option>
                        <option value={3}>ทุก 3 เดือน</option>
                        <option value={6}>ทุก 6 เดือน (แนะนำสำหรับแอร์/ไส้กรอง)</option>
                        <option value={12}>ทุก 12 เดือน (1 ปี เช่น ฉีดปลวก)</option>
                        <option value={24}>ทุก 24 เดือน (2 ปี)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#746C65] block mb-1">ทำครั้งล่าสุดวันที่</label>
                      <input
                        type="date"
                        value={newMaintLastDate}
                        onChange={(e) => setNewMaintLastDate(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-[#ECE7DF] bg-white outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[#746C65] block mb-1">ค่าใช้จ่ายโดยประมาณ</label>
                      <input
                        type="text"
                        value={newMaintCost}
                        onChange={(e) => setNewMaintCost(e.target.value)}
                        placeholder="เช่น 500 บาท"
                        className="w-full text-xs p-2 rounded-xl border border-[#ECE7DF] focus:border-[#E88D67] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#746C65] block mb-1">เบอร์โทรช่างประจำรายการนี้</label>
                      <input
                        type="tel"
                        value={newMaintPhone}
                        onChange={(e) => setNewMaintPhone(e.target.value)}
                        placeholder="081xxxxxxx"
                        className="w-full text-xs p-2 rounded-xl border border-[#ECE7DF] focus:border-[#E88D67] outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#746C65] block mb-1">หมายเหตุเพิ่มเติม</label>
                    <input
                      type="text"
                      value={newMaintNote}
                      onChange={(e) => setNewMaintNote(e.target.value)}
                      placeholder="เช่น ช่างบอกให้ล้างก่อนหน้าร้อน"
                      className="w-full text-xs p-2 rounded-xl border border-[#ECE7DF] focus:border-[#E88D67] outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddMaint(false)}
                      className="px-3 py-1.5 rounded-xl border border-[#ECE7DF] text-xs font-bold text-[#746C65] hover:bg-[#FAF8F5] cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-[#E88D67] text-white text-xs font-black hover:bg-[#D57B56] cursor-pointer shadow-xs"
                    >
                      บันทึกรายการ
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddMaint(true)}
                  className="w-full py-2.5 rounded-2xl border-2 border-dashed border-[#ECE7DF] hover:border-[#E88D67] bg-[#FAF8F5] text-xs font-bold text-[#E88D67] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus size={16} weight="bold" />
                  <span>เพิ่มรายการดูแลบ้านใหม่</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
