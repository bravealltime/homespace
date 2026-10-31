import { useState, useEffect } from 'react';
import { X, DeviceMobile, ShareNetwork, PlusSquare, DotsThreeVertical, CheckCircle, ArrowSquareOut, DownloadSimple } from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';

export default function InstallAppModal({ isOpen, onClose }) {
  const { deferredInstallPrompt, isStandalone, language, t } = useApp();
  const [activePlatform, setActivePlatform] = useState('ios');

  useEffect(() => {
    // Detect iOS vs Android automatically
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/android/i.test(ua)) {
        setActivePlatform('android');
      } else if (/iphone|ipad|ipod/i.test(ua)) {
        setActivePlatform('ios');
      }
    }
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (!deferredInstallPrompt) return;
    try {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        onClose();
      }
    } catch (err) {
      console.warn('Install click error:', err);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-[#ECE7DF] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-enter-rise"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#ECE7DF] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#5F8D75] text-white flex items-center justify-center text-base shadow-xs">
              📲
            </div>
            <div>
              <h2 className="text-sm font-black text-[#2D2825]">ติดตั้ง HomeSpace ลงมือถือ</h2>
              <p className="text-[10px] text-[#746C65]">เปิดแบบเต็มจอ ไม่ต้องโหลดผ่าน Store</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#746C65] hover:bg-[#ECE7DF] cursor-pointer"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Tab switch between iOS & Android */}
        <div className="p-3 pb-0">
          <div className="grid grid-cols-2 p-1 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF]">
            <button
              type="button"
              onClick={() => setActivePlatform('ios')}
              className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activePlatform === 'ios'
                  ? 'bg-white text-[#2D2825] shadow-xs'
                  : 'text-[#746C65] hover:text-[#2D2825]'
              }`}
            >
              <span>🍎 iPhone / iPad</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePlatform('android')}
              className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activePlatform === 'android'
                  ? 'bg-white text-[#2D2825] shadow-xs'
                  : 'text-[#746C65] hover:text-[#2D2825]'
              }`}
            >
              <span>🤖 Android</span>
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {isStandalone ? (
            <div className="p-4 rounded-2xl bg-[#EEF4F0] border border-[#5F8D75]/30 text-center space-y-2">
              <CheckCircle size={36} className="text-[#5F8D75] mx-auto" weight="fill" />
              <p className="text-xs font-bold text-[#2D2825]">แอปได้รับการติดตั้งบนอุปกรณ์นี้แล้ว!</p>
              <p className="text-[11px] text-[#5F8D75]">คุณกำลังใช้งาน HomeSpace จากหน้าจอโฮมแบบเต็มจอ</p>
            </div>
          ) : activePlatform === 'ios' ? (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DF] flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-white border border-[#ECE7DF] flex items-center justify-center text-[#2563EB] shrink-0 font-bold text-xs shadow-2xs">
                  1
                </div>
                <div className="text-xs">
                  <p className="font-bold text-[#2D2825] flex items-center gap-1">
                    เปิดใน <b>Safari</b> แล้วกดปุ่มแชร์
                  </p>
                  <p className="text-[11px] text-[#746C65] mt-0.5">
                    กดปุ่ม <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white border border-[#ECE7DF] font-bold text-blue-600">แชร์ <ArrowSquareOut size={12} className="inline ml-0.5" /></span> ที่แถบล่างสุดของหน้าจอ Safari
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DF] flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-white border border-[#ECE7DF] flex items-center justify-center text-[#2563EB] shrink-0 font-bold text-xs shadow-2xs">
                  2
                </div>
                <div className="text-xs">
                  <p className="font-bold text-[#2D2825]">เลื่อนลงมาเลือก &quot;เพิ่มไปยังหน้าจอโฮม&quot;</p>
                  <p className="text-[11px] text-[#746C65] mt-0.5">
                    แตะที่ <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white border border-[#ECE7DF] font-bold text-[#2D2825]"><PlusSquare size={12} className="inline mr-1" /> เพิ่มไปยังหน้าจอโฮม</span> (Add to Home Screen)
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DF] flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-white border border-[#ECE7DF] flex items-center justify-center text-[#5F8D75] shrink-0 font-bold text-xs shadow-2xs">
                  3
                </div>
                <div className="text-xs">
                  <p className="font-bold text-[#2D2825]">กดปุ่ม &quot;เพิ่ม&quot; (Add) มุมขวาบน</p>
                  <p className="text-[11px] text-[#746C65] mt-0.5">
                    ไอคอน <b>HomeSpace 🏡</b> จะปรากฏบนหน้าจอโฮมของคุณ เปิดเข้าใช้งานแบบเต็มจอได้เลย!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Direct APK Download Option for Android */}
              <a
                href="https://github.com/bravealltime/homespace/releases/download/apk-latest/HomeSpace.apk"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#E88D67] to-[#D57B56] text-white text-xs font-black shadow-md hover:opacity-95 transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer no-underline"
              >
                <span>📦 ดาวน์โหลดไฟล์ HomeSpace.apk (Android) ⬇️</span>
              </a>

              {deferredInstallPrompt && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full py-2 rounded-2xl bg-[#5F8D75] text-white text-xs font-bold shadow-xs hover:bg-[#4E7661] transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <DeviceMobile size={16} weight="bold" />
                  <span>กดตรงนี้เพื่อติดตั้งลงหน้าจอทันที (PWA 1 คลิก) 📲</span>
                </button>
              )}

              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DF] flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-white border border-[#ECE7DF] flex items-center justify-center text-[#2563EB] shrink-0 font-bold text-xs shadow-2xs">
                  1
                </div>
                <div className="text-xs">
                  <p className="font-bold text-[#2D2825]">เปิดใน <b>Google Chrome</b></p>
                  <p className="text-[11px] text-[#746C65] mt-0.5">
                    แตะปุ่ม <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white border border-[#ECE7DF] font-bold text-[#2D2825]">⋮</span> (จุด 3 จุด) ที่มุมขวาบนของหน้าจอ
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DF] flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-white border border-[#ECE7DF] flex items-center justify-center text-[#2563EB] shrink-0 font-bold text-xs shadow-2xs">
                  2
                </div>
                <div className="text-xs">
                  <p className="font-bold text-[#2D2825]">เลือก &quot;ติดตั้งแอป&quot; หรือ &quot;เพิ่มลงในหน้าจอหลัก&quot;</p>
                  <p className="text-[11px] text-[#746C65] mt-0.5">
                    แตะเมนู <span className="font-bold text-[#2D2825]">ติดตั้งแอป (Install App)</span>
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DF] flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-white border border-[#ECE7DF] flex items-center justify-center text-[#5F8D75] shrink-0 font-bold text-xs shadow-2xs">
                  3
                </div>
                <div className="text-xs">
                  <p className="font-bold text-[#2D2825]">กดยืนยัน &quot;ติดตั้ง&quot;</p>
                  <p className="text-[11px] text-[#746C65] mt-0.5">
                    ระบบจะเพิ่มแอป HomeSpace ลงในหน้ารวมแอปและหน้าจอหลัก พร้อมใช้งานทันที
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Highlights */}
          <div className="p-3 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-[11px] text-[#166534] space-y-1">
            <p className="font-bold flex items-center gap-1">
              ✨ ข้อดีของการติดตั้งเป็นแอป:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[10px] text-[#15803D]">
              <li>เปิดแบบเต็มหน้าจอ ไร้แถบเว็บเหมือนแอปแท้ 100%</li>
              <li>แตะไอคอนบนหน้าจอโฮมเข้าใช้งานได้ทันที</li>
              <li>โหลดข้อมูลเร็ว ประหยัดอินเทอร์เน็ต</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#ECE7DF] bg-[#FAF8F5] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#2D2825] hover:bg-[#1A1816] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  );
}
