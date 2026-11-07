import { useState, useRef } from 'react';
import {
  X,
  ArrowSquareOut,
  ArrowClockwise,
  BookBookmark,
  ShieldCheck,
  SpeakerHigh,
  DeviceMobile,
} from '@phosphor-icons/react';

const BANCHEERUB_URL = 'https://bancheerub.vercel.app';

export default function FamilyLedgerModal({ isOpen, onClose }) {
  const iframeRef = useRef(null);
  const [iframeKey, setIframeKey] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleOpenExternal = () => {
    window.open(BANCHEERUB_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs select-none animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#ECE7DF] flex flex-col max-h-[95dvh] overflow-hidden animate-enter-rise"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#ECE7DF] bg-[#FAF8F5] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl shadow-2xs shrink-0">
              📒
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-[#2D2825] truncate flex items-center gap-1.5">
                <span>สมุดเงินทอง ครอบครัว</span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  เชื่อมต่อแล้ว 🟢
                </span>
              </h2>
              <p className="text-[11px] text-[#746C65] truncate">
                บัญชีรายรับ-รายจ่ายครอบครัว ปรับตัวหนังสือโต & มีเสียงอ่านคนแก่
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Refresh iframe */}
            <button
              type="button"
              onClick={handleRefresh}
              className="p-2 rounded-xl text-[#746C65] hover:text-[#2D2825] hover:bg-white border border-transparent hover:border-[#ECE7DF] transition-all cursor-pointer"
              title="โหลดสมุดบัญชีใหม่"
            >
              <ArrowClockwise size={18} weight="bold" />
            </button>

            {/* Open full in new tab */}
            <button
              type="button"
              onClick={handleOpenExternal}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-[#ECE7DF] hover:border-amber-400 text-amber-900 font-bold text-xs flex items-center gap-1 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              title="เปิดเต็มหน้าจอในแท็บใหม่"
            >
              <ArrowSquareOut size={16} weight="bold" />
              <span className="hidden sm:inline">เปิดแท็บใหม่</span>
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#746C65] hover:text-red-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X size={20} weight="bold" />
            </button>
          </div>
        </div>

        {/* Quick Tips Bar */}
        <div className="px-3 py-2 bg-gradient-to-r from-amber-50 to-[#FAF8F5] border-b border-amber-200/60 flex items-center justify-between gap-2 text-[11px] text-amber-900 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar font-medium">
            <span className="shrink-0 font-bold">💡 จุดเด่น:</span>
            <span className="shrink-0 bg-white/80 px-2 py-0.5 rounded-lg border border-amber-200">
              📊 ยอดคงเหลือสะสมทุกรายการ
            </span>
            <span className="shrink-0 bg-white/80 px-2 py-0.5 rounded-lg border border-amber-200">
              👵 สลับสมุดแต่ละคนได้ (PIN 4 ตัว)
            </span>
            <span className="shrink-0 bg-white/80 px-2 py-0.5 rounded-lg border border-amber-200">
              📸 แนบรูปสลิป/ใบเสร็จ
            </span>
            <span className="shrink-0 bg-white/80 px-2 py-0.5 rounded-lg border border-amber-200">
              🔊 เสียงพูดอ่านยอดเงิน
            </span>
          </div>

          <a
            href={BANCHEERUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-amber-800 hover:underline shrink-0 hidden md:inline-block"
          >
            bancheerub.vercel.app ↗
          </a>
        </div>

        {/* Iframe Container */}
        <div className="relative flex-1 bg-[#F6F4EF] w-full min-h-[65dvh] sm:min-h-[75dvh]">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F6F4EF] z-10 gap-2">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-stone-600">กำลังเปิดสมุดเงินทอง...</p>
            </div>
          )}

          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={BANCHEERUB_URL}
            title="สมุดเงินทอง ครอบครัว"
            className="w-full h-full min-h-[65dvh] sm:min-h-[75dvh] border-0"
            allow="camera; microphone; clipboard-write"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>
    </div>
  );
}
