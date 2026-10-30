import { useState, useEffect } from 'react';
import {
  DeviceMobile,
  Monitor,
  WifiHigh,
  CellSignalFull,
  Sparkle,
} from '@phosphor-icons/react';

export default function PhoneMockup({ children, displayMode, onToggleMode }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Desktop Centered Mode (When user toggles 'desktop' mode)
  if (displayMode === 'desktop') {
    return (
      <div className="min-h-screen bg-[#EDE7DF] flex flex-col justify-start">
        {/* Top Desktop Switcher Bar */}
        <div className="hidden md:flex items-center justify-between px-6 py-2.5 bg-[#2D2825] text-white text-xs font-semibold z-50 sticky top-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🏡</span>
            <div>
              <span className="font-black text-sm tracking-tight text-[#FAF8F5]">HomeSpace</span>
              <span className="text-white/60 text-xs ml-2">บันทึกความสุขและงานบ้านครอบครัว</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => onToggleMode('phone')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all font-bold"
            >
              <DeviceMobile size={16} weight="bold" />
              <span>โหมดกรอบมือถือ (Phone Mockup)</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleMode('desktop')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5F8D75] text-white shadow-xs font-bold"
            >
              <Monitor size={16} weight="bold" />
              <span>โหมดจอคอม (Centered View)</span>
            </button>
          </div>
        </div>

        {/* Centered Mobile App Container for Desktop */}
        <div className="flex-1 flex justify-center py-0 md:py-6 px-0 md:px-4">
          <div className="w-full max-w-[420px] bg-[#FAF8F5] h-[100dvh] md:h-[860px] md:max-h-[94vh] md:rounded-3xl shadow-xl border border-[#ECE7DF] overflow-hidden relative flex flex-col">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Realistic Smartphone Mockup View (Default on PC)
  return (
    <div className="min-h-screen bg-[#FAF8F5] md:bg-gradient-to-br md:from-[#EAE5DE] md:via-[#FAF8F5] md:to-[#DFD6CB] flex flex-col items-center justify-center p-0 md:p-6 select-none">
      {/* Top Controller Bar (Visible only on PC desktop) */}
      <header className="w-full max-w-[420px] hidden md:flex items-center justify-between mb-3 px-2 text-xs font-semibold text-[#746C65]">
        <div className="flex items-center gap-2">
          <span className="text-base">📱</span>
          <span className="font-black text-[#2D2825]">มุมมองแอปมือถือ HomeSpace</span>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-white/85 backdrop-blur-xs p-1 rounded-2xl border border-[#ECE7DF] shadow-xs">
          <button
            type="button"
            onClick={() => onToggleMode('phone')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5F8D75] text-white shadow-xs font-black transition-all text-xs"
          >
            <DeviceMobile size={15} weight="bold" />
            <span>กรอบมือถือ</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleMode('desktop')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[#746C65] hover:text-[#2D2825] hover:bg-white transition-all font-bold text-xs"
          >
            <Monitor size={15} weight="bold" />
            <span>จอคอม</span>
          </button>
        </div>
      </header>

      {/* Smartphone Chassis Frame */}
      <div className="relative w-full h-full min-h-[100dvh] md:min-h-0 md:w-[412px] md:h-[860px] md:max-h-[94vh] bg-[#FAF8F5] md:bg-[#1E1C1A] md:rounded-[52px] p-0 md:p-[10px] md:shadow-[0_25px_80px_rgba(45,40,37,0.38)] md:border md:border-[#3E3A36] md:ring-1 md:ring-white/20 flex flex-col justify-between">
        {/* Left Hardware Buttons (Volume & Action - Visible only on PC desktop) */}
        <div className="hidden md:block absolute -left-[14px] top-28 w-[4px] h-9 bg-[#2E2B27] rounded-l-md border-l border-white/20" />
        <div className="hidden md:block absolute -left-[14px] top-42 w-[4px] h-14 bg-[#2E2B27] rounded-l-md border-l border-white/20" />
        <div className="hidden md:block absolute -left-[14px] top-60 w-[4px] h-14 bg-[#2E2B27] rounded-l-md border-l border-white/20" />

        {/* Right Hardware Button (Power) */}
        <div className="hidden md:block absolute -right-[14px] top-36 w-[4px] h-20 bg-[#2E2B27] rounded-r-md border-r border-white/20" />

        {/* Inner Phone Display Container */}
        <div className="relative w-full h-full min-h-[100dvh] md:min-h-0 bg-[#FAF8F5] md:rounded-[42px] overflow-hidden flex flex-col justify-between shadow-inner [transform:translateZ(0)]">
          {/* Top Phone Status Bar (Simulated on PC; native mobile uses real status bar) */}
          <div className="hidden md:flex sticky top-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-md px-6 pt-3 pb-2 items-center justify-between text-[#2D2825] text-xs font-bold select-none shrink-0 border-b border-[#ECE7DF]/50">
            {/* Clock */}
            <span className="font-extrabold text-[13px] tracking-tight ml-1">{time || '19:45'}</span>

            {/* Dynamic Island Pill */}
            <div className="w-24 h-5 bg-[#1C1A18] rounded-full flex items-center justify-end px-2 gap-1.5 shadow-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2E2B27] ring-1 ring-white/10" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#0E0D0C]" />
            </div>

            {/* Connectivity & Battery Icons */}
            <div className="flex items-center gap-1.5 text-[#2D2825] mr-1">
              <CellSignalFull size={14} weight="fill" />
              <WifiHigh size={14} weight="bold" />
              <div className="w-5 h-2.5 rounded-sm border border-[#2D2825] p-0.5 flex items-center">
                <div className="w-full h-full bg-[#2D2825] rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Phone App View Container */}
          <div className="flex-1 w-full h-full overflow-hidden relative flex flex-col">
            {children}
          </div>

          {/* Bottom Native Home Swipe Bar */}
          <div className="hidden md:flex w-full bg-[#FAF8F5]/95 backdrop-blur-xs py-1.5 shrink-0 items-center justify-center border-t border-[#ECE7DF]/40">
            <div className="w-32 h-1 bg-[#2D2825]/35 rounded-full" />
          </div>
        </div>
      </div>

      {/* Helpful tip below mockup */}
      <footer className="hidden md:block text-center mt-3 text-xs text-[#746C65]">
        <p>💡 สามารถแตะใช้งาน ถ่ายรูปงานบ้าน บันทึกกิจวัตร และโหวตรางวัลได้เสมือนแอพมือถือจริง</p>
      </footer>
    </div>
  );
}
