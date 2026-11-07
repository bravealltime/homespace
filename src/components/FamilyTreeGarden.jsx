import { useState, useRef, useEffect } from 'react';
import {
  Drop,
  Sparkle,
  CaretRight,
  X,
  Broom,
  Camera,
  Wrench,
  Heart,
  SpeakerHigh,
  ClockCounterClockwise,
  Info,
  CheckCircle,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { speakThai } from '../utils/speechHelper';

export const TREE_STAGES = {
  sprout: {
    key: 'sprout',
    minLevel: 1,
    maxLevel: 1,
    name: 'ต้นกล้าแห่งความหวัง',
    emoji: '🌱',
    desc: 'เมล็ดพันธุ์ความรักของบ้านเรา เพิ่งเริ่มผลิใบอ่อนขึ้นมา',
    bgGradient: 'from-[#EAF7ED] via-[#F3FAF4] to-[#FAF8F5]',
    accentColor: '#5F8D75',
    badgeBg: 'bg-[#E3F2E9] text-[#2F6B4C]',
  },
  sapling: {
    key: 'sapling',
    minLevel: 2,
    maxLevel: 3,
    name: 'ต้นน้อยผลิกิ่งใบ',
    emoji: '🌿',
    desc: 'ต้นไม้กำลังเติบโตแข็งแรง แตกกิ่งก้านใบเขียวขจี',
    bgGradient: 'from-[#E2F4EC] via-[#EEF8F3] to-[#FAF8F5]',
    accentColor: '#3E8E62',
    badgeBg: 'bg-[#D2EDE0] text-[#1E5D3A]',
  },
  blossom: {
    key: 'blossom',
    minLevel: 4,
    maxLevel: 5,
    name: 'ต้นไม้ช่อดอกไม้หอม',
    emoji: '🌸',
    desc: 'ดอกไม้สีชมพูผลิบานสะพรั่ง อบอวลไปด้วยกลิ่นหอมและความสุข',
    bgGradient: 'from-[#FDECEF] via-[#FFF3F5] to-[#FAF8F5]',
    accentColor: '#D85A7F',
    badgeBg: 'bg-[#FCE0E7] text-[#A6274E]',
  },
  golden: {
    key: 'golden',
    minLevel: 6,
    maxLevel: 99,
    name: 'ต้นไม้ใหญ่ผลไม้สีทอง',
    emoji: '🌳',
    desc: 'ต้นไม้ใหญ่ร่มรื่น ออกผลไม้ทองคำแห่งความสามัคคีของทุกคนในบ้าน',
    bgGradient: 'from-[#FEF6E4] via-[#FFFBF2] to-[#FAF8F5]',
    accentColor: '#D99B26',
    badgeBg: 'bg-[#FEEAC2] text-[#946108]',
  },
};

export function getTreeStageInfo(level = 1) {
  if (level <= 1) return TREE_STAGES.sprout;
  if (level <= 3) return TREE_STAGES.sapling;
  if (level <= 5) return TREE_STAGES.blossom;
  return TREE_STAGES.golden;
}

// ==========================================
// PURE SVG ANIMATED TREE ILLUSTRATIONS
// ==========================================
function TreeIllustration({ stage = 'sprout', isWatering = false, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24 sm:w-28 sm:h-28',
    lg: 'w-44 h-44 sm:w-52 sm:h-52',
  }[size] || 'w-28 h-28';

  return (
    <div className={`relative ${sizeClasses} flex items-center justify-center select-none`}>
      {/* Background Soft Glow */}
      <div
        className={`absolute inset-2 rounded-full blur-xl transition-all duration-700 ${
          stage === 'golden'
            ? 'bg-amber-300/40'
            : stage === 'blossom'
            ? 'bg-pink-300/35'
            : 'bg-emerald-300/35'
        } ${isWatering ? 'scale-125 opacity-100' : 'opacity-60'}`}
      />

      {/* Falling Water Droplets Animation during watering */}
      {isWatering && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden flex items-start justify-center">
          <div className="animate-bounce flex gap-3 pt-2">
            <span className="text-xl animate-pulse">💧</span>
            <span className="text-sm animate-ping">✨</span>
            <span className="text-2xl animate-pulse">💧</span>
            <span className="text-lg animate-bounce">💖</span>
            <span className="text-xl animate-pulse">💧</span>
          </div>
        </div>
      )}

      {/* Stage 1: Sprout 🌱 */}
      {stage === 'sprout' && (
        <svg viewBox="0 0 120 120" className={`w-full h-full transition-transform duration-500 ${isWatering ? 'scale-110' : 'scale-100'}`}>
          {/* Soil Mound */}
          <ellipse cx="60" cy="98" rx="42" ry="12" fill="#7D5836" opacity="0.3" />
          <ellipse cx="60" cy="96" rx="38" ry="10" fill="#8C6239" />
          <path d="M28 96 Q60 84 92 96 Z" fill="#6B4726" />

          {/* Stem */}
          <path
            d="M60 94 Q60 70 58 60"
            stroke="#5F8D75"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Left Leaf */}
          <path
            d="M58 65 C40 62 34 46 48 42 C56 40 60 52 58 65 Z"
            fill="#72A88B"
            className="origin-bottom-right transition-transform"
            style={{ transform: isWatering ? 'rotate(-8deg)' : 'rotate(0deg)' }}
          />
          {/* Right Leaf */}
          <path
            d="M58 60 C76 56 82 40 68 36 C60 34 56 48 58 60 Z"
            fill="#5F8D75"
            className="origin-bottom-left transition-transform"
            style={{ transform: isWatering ? 'rotate(8deg)' : 'rotate(0deg)' }}
          />

          {/* Dew Drop */}
          <circle cx="52" cy="46" r="2.5" fill="#60A5FA" opacity="0.8" />
          <circle cx="53" cy="45" r="1" fill="#FFFFFF" />
        </svg>
      )}

      {/* Stage 2: Young Sapling 🌿 */}
      {stage === 'sapling' && (
        <svg viewBox="0 0 140 140" className={`w-full h-full transition-transform duration-500 ${isWatering ? 'scale-110' : 'scale-100'}`}>
          {/* Soil Mound */}
          <ellipse cx="70" cy="116" rx="48" ry="14" fill="#6B4726" opacity="0.35" />
          <path d="M26 116 Q70 102 114 116 Z" fill="#8C6239" />

          {/* Trunk */}
          <path
            d="M70 114 Q68 85 70 55"
            stroke="#654321"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />

          {/* Branches */}
          <path d="M70 82 Q52 74 42 66" stroke="#654321" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M70 72 Q88 64 98 56" stroke="#654321" strokeWidth="4" strokeLinecap="round" fill="none" />

          {/* Leaf clusters */}
          <circle cx="40" cy="62" r="14" fill="#5F8D75" />
          <circle cx="48" cy="54" r="12" fill="#72A88B" />
          <circle cx="98" cy="52" r="15" fill="#4D7C63" />
          <circle cx="90" cy="44" r="13" fill="#6AA083" />
          <circle cx="70" cy="44" r="18" fill="#5F8D75" />
          <circle cx="70" cy="34" r="14" fill="#88B89E" />

          {/* Small Sparkle */}
          <circle cx="76" cy="32" r="2.5" fill="#FDE047" />
        </svg>
      )}

      {/* Stage 3: Flowering Blossom 🌸 */}
      {stage === 'blossom' && (
        <svg viewBox="0 0 160 160" className={`w-full h-full transition-transform duration-500 ${isWatering ? 'scale-110' : 'scale-100'}`}>
          {/* Soil Mound with flowers */}
          <ellipse cx="80" cy="138" rx="55" ry="15" fill="#6B4726" opacity="0.35" />
          <path d="M30 138 Q80 122 130 138 Z" fill="#8C6239" />
          <circle cx="50" cy="134" r="3" fill="#F472B6" />
          <circle cx="110" cy="135" r="3.5" fill="#F472B6" />

          {/* Curved Sturdy Trunk */}
          <path
            d="M80 136 C78 108 72 88 80 65"
            stroke="#5D3A1A"
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M76 95 Q54 82 44 76" stroke="#5D3A1A" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M78 84 Q104 74 116 66" stroke="#5D3A1A" strokeWidth="5" strokeLinecap="round" fill="none" />

          {/* Foliage Canopy */}
          <circle cx="80" cy="52" r="32" fill="#4B7A60" />
          <circle cx="52" cy="62" r="24" fill="#5E8D73" />
          <circle cx="108" cy="60" r="25" fill="#5E8D73" />
          <circle cx="80" cy="38" r="24" fill="#75A48A" />

          {/* Blossom Flowers (Cherry / Peach) */}
          <g className="animate-pulse">
            <circle cx="68" cy="42" r="6" fill="#F472B6" />
            <circle cx="68" cy="42" r="2.5" fill="#FDF2F8" />

            <circle cx="94" cy="44" r="7" fill="#FB7185" />
            <circle cx="94" cy="44" r="3" fill="#FFF1F2" />

            <circle cx="52" cy="62" r="6.5" fill="#F472B6" />
            <circle cx="52" cy="62" r="2.5" fill="#FDF2F8" />

            <circle cx="108" cy="58" r="6.5" fill="#FB7185" />
            <circle cx="108" cy="58" r="2.5" fill="#FFF1F2" />

            <circle cx="80" cy="64" r="8" fill="#F472B6" />
            <circle cx="80" cy="64" r="3" fill="#FFF1F2" />
          </g>
        </svg>
      )}

      {/* Stage 4: Majestic Golden Fruitful Tree 🌳 */}
      {stage === 'golden' && (
        <svg viewBox="0 0 180 180" className={`w-full h-full transition-transform duration-500 ${isWatering ? 'scale-110' : 'scale-100'}`}>
          {/* Lush Grass Mound */}
          <ellipse cx="90" cy="154" rx="66" ry="16" fill="#432810" opacity="0.35" />
          <path d="M30 154 Q90 134 150 154 Z" fill="#654321" />
          <path d="M26 154 Q90 138 154 154 Z" fill="#3D744E" />

          {/* Strong Mighty Trunk */}
          <path
            d="M90 152 C88 116 82 92 90 62"
            stroke="#4A2F17"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M85 106 Q54 88 42 78" stroke="#4A2F17" strokeWidth="7" strokeLinecap="round" fill="none" />
          <path d="M88 94 Q122 80 138 70" stroke="#4A2F17" strokeWidth="7" strokeLinecap="round" fill="none" />

          {/* Multi-layered Lush Canopy */}
          <circle cx="90" cy="52" r="38" fill="#2E6945" />
          <circle cx="56" cy="66" r="28" fill="#3A7E54" />
          <circle cx="124" cy="64" r="28" fill="#3A7E54" />
          <circle cx="90" cy="36" r="28" fill="#4E996B" />

          {/* Golden Fruits (Apples / Oranges) */}
          <g>
            {/* Fruit 1 */}
            <circle cx="70" cy="46" r="6.5" fill="#F59E0B" className="filter drop-shadow" />
            <circle cx="68" cy="44" r="2" fill="#FEF3C7" />
            {/* Fruit 2 */}
            <circle cx="110" cy="48" r="7" fill="#F59E0B" className="filter drop-shadow" />
            <circle cx="108" cy="46" r="2.2" fill="#FEF3C7" />
            {/* Fruit 3 */}
            <circle cx="54" cy="68" r="6" fill="#F59E0B" />
            <circle cx="52" cy="66" r="1.8" fill="#FEF3C7" />
            {/* Fruit 4 */}
            <circle cx="126" cy="66" r="6.5" fill="#F59E0B" />
            <circle cx="124" cy="64" r="2" fill="#FEF3C7" />
            {/* Fruit 5 Center Big Golden Fruit */}
            <circle cx="90" cy="62" r="8" fill="#EAB308" className="animate-pulse" />
            <circle cx="87" cy="59" r="2.5" fill="#FFFFFF" />
          </g>

          {/* Flying Butterfly / Bird */}
          <g className="animate-bounce" style={{ transformOrigin: '140px 30px' }}>
            <circle cx="140" cy="32" r="3" fill="#60A5FA" />
            <path d="M140 32 Q148 24 144 32 Q148 38 140 32 Z" fill="#93C5FD" />
            <path d="M140 32 Q132 24 136 32 Q132 38 140 32 Z" fill="#93C5FD" />
          </g>
        </svg>
      )}
    </div>
  );
}

// ==========================================
// 1. FAMILY TREE COMPACT CARD (FOR HOME DASHBOARD)
// ==========================================
export function FamilyTreeCard({ onOpenGarden }) {
  const { currentUser } = useAuth();
  const { treeState, waterTree, t } = useApp();
  const [isWatering, setIsWatering] = useState(false);
  const [justWateredToast, setJustWateredToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const {
    level = 1,
    exp = 0,
    maxExp = 20,
    waterDrops = 0,
  } = treeState || {};

  const stageInfo = getTreeStageInfo(level);
  const progressPercent = Math.min(100, Math.round((exp / Math.max(1, maxExp)) * 100));

  const handleQuickWater = async (e) => {
    e.stopPropagation();
    if (isWatering) return;
    if (waterDrops <= 0) {
      setErrorMsg('ยังไม่มีหยดน้ำ ช่วยกันทำงานบ้านหรือแชร์รูปนะ 💧');
      speakThai('ตอนนี้ยังไม่มีหยดน้ำ ช่วยกันทำงานบ้านหรือส่งรูปภาพเพื่อสะสมหยดน้ำก่อนนะคะ');
      setTimeout(() => setErrorMsg(''), 3500);
      return;
    }

    try {
      setIsWatering(true);
      setErrorMsg('');
      const res = await waterTree(1);

      if (res?.didLevelUp) {
        setJustWateredToast(`🎉 ต้นไม้เลเวลอัปเป็น Lv.${res.tree.level}!`);
        speakThai(`ไชโย! ต้นไม้ความสุขของบ้านเราเติบโตเป็นเลเวล ${res.tree.level} แล้ว เก่งกันทุกคนเลยจ้า`);
      } else {
        setJustWateredToast('รดน้ำสำเร็จ +10 แต้ม 💧✨');
        speakThai('ชื่นใจจังเลยจ้า ขอบคุณที่รดน้ำให้ต้นไม้นะคะ ได้แต้มเพิ่มสิบแต้มด้วยจ้ะ');
      }

      setTimeout(() => setJustWateredToast(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'รดน้ำไม่สำเร็จ');
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setTimeout(() => setIsWatering(false), 900);
    }
  };

  return (
    <div
      onClick={onOpenGarden}
      className="p-3.5 sm:p-4 rounded-3xl bg-white border border-[#ECE7DF] shadow-2xs hover:shadow-xs transition-all cursor-pointer group relative overflow-hidden space-y-3"
    >
      {/* Soft background tint according to stage */}
      <div className={`absolute inset-0 bg-gradient-to-r ${stageInfo.bgGradient} opacity-60 pointer-events-none`} />

      {/* Top Row: Tree + Name + Drops + Water Button */}
      <div className="relative z-10 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Animated Tree Thumbnail */}
          <div className="relative shrink-0 flex items-center justify-center p-1 rounded-2xl bg-white/90 border border-[#ECE7DF]/80 shadow-2xs group-hover:scale-105 transition-transform">
            <TreeIllustration stage={stageInfo.key} isWatering={isWatering} size="sm" />
            <span className="absolute -top-1 -right-1 text-xs">✨</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-xs font-black shrink-0 ${stageInfo.badgeBg}`}>
                Lv.{level}
              </span>
              <h3 className="text-xs sm:text-sm font-black text-[#2D2825] truncate">
                {stageInfo.name}
              </h3>
            </div>

            {/* Available Water Drops Pill */}
            <div className="flex items-center gap-1 mt-1 text-blue-600 text-xs font-bold whitespace-nowrap">
              <Drop size={14} weight="fill" className="text-blue-500 animate-pulse shrink-0" />
              <span className="whitespace-nowrap">{waterDrops} หยดน้ำสะสม</span>
            </div>
          </div>
        </div>

        {/* Quick Water Action Button */}
        <button
          type="button"
          onClick={handleQuickWater}
          disabled={isWatering}
          className={`px-3 py-2 rounded-2xl font-black text-xs flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0 whitespace-nowrap ${
            waterDrops > 0
              ? 'bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white shadow-blue-200'
              : 'bg-[#FAF8F5] hover:bg-[#EEF4F0] text-[#746C65] border border-[#ECE7DF]'
          }`}
          title="รดน้ำต้นไม้ 1 หยด"
        >
          <Drop size={16} weight="fill" className={waterDrops > 0 ? 'text-white' : 'text-blue-400'} />
          <span className="whitespace-nowrap">รดน้ำ 💧</span>
        </button>
      </div>

      {/* Bottom Row: Full-Width Growth Progress Bar */}
      <div className="relative z-10 space-y-1.5 pt-0.5 border-t border-[#ECE7DF]/60">
        <div className="flex items-center justify-between text-xs text-[#746C65] font-semibold">
          <span className="flex items-center gap-1">
            <span>🌱 การเติบโต</span>
            <span className="font-bold text-[#5F8D75]">({progressPercent}%)</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[#5F8D75] font-black">
              {exp} / {maxExp} 💧
            </span>
            <span className="text-[#5F8D75] font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              ดูสวน →
            </span>
          </div>
        </div>

        <div className="w-full h-2 rounded-full bg-[#FAF8F5] border border-[#ECE7DF] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#5F8D75] to-[#88B09A] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Feedback messages */}
        {justWateredToast && (
          <p className="text-xs font-black text-emerald-600 animate-bounce pt-1">{justWateredToast}</p>
        )}
        {errorMsg && (
          <p className="text-xs font-bold text-rose-500 pt-1">{errorMsg}</p>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 2. FULL INTERACTIVE GARDEN MODAL
// ==========================================
export function FamilyGardenModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { treeState, waterTree, t } = useApp();
  const [isWatering, setIsWatering] = useState(false);
  const [wateringCount, setWateringCount] = useState(1);
  const [feedbackToast, setFeedbackToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const {
    level = 1,
    exp = 0,
    maxExp = 20,
    waterDrops = 0,
    totalWatered = 0,
    recentLogs = [],
  } = treeState || {};

  const stageInfo = getTreeStageInfo(level);
  const progressPercent = Math.min(100, Math.round((exp / Math.max(1, maxExp)) * 100));

  const handleWater = async (drops = 1) => {
    if (isWatering) return;
    if (waterDrops < drops) {
      setErrorMsg(`มีหยดน้ำไม่พอ (ต้องการ ${drops} หยด แต่มี ${waterDrops} หยด)`);
      speakThai('หยดน้ำไม่พอจ้า ช่วยกันทำงานบ้านหรือแชร์รูปภาพเพื่อสะสมหยดน้ำเพิ่มนะคะ');
      setTimeout(() => setErrorMsg(''), 3500);
      return;
    }

    try {
      setIsWatering(true);
      setErrorMsg('');
      const res = await waterTree(drops);

      if (res?.didLevelUp) {
        setFeedbackToast(`🎉 ไชโย! ต้นไม้เติบโตเป็น Lv.${res.tree.level} (${getTreeStageInfo(res.tree.level).name})`);
        speakThai(`ไชโย! ต้นไม้ความสุขของบ้านเราเติบโตเป็นเลเวล ${res.tree.level} แล้ว ขอบคุณทุกคนมากจ้า`);
      } else {
        setFeedbackToast(`รดน้ำ ${drops} หยดเรียบร้อย! ได้รับ +${res?.pointsAwarded || drops * 10} แต้มเข้าโหลบ้าน 🍯`);
        speakThai(`รดน้ำเรียบร้อยแล้วจ้า ต้นไม้ชุ่มฉ่ำมากเลย ได้รับแต้มเพิ่ม ${res?.pointsAwarded || drops * 10} แต้มด้วยค่ะ`);
      }

      setTimeout(() => setFeedbackToast(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'รดน้ำไม่สำเร็จ');
      setTimeout(() => setErrorMsg(''), 3500);
    } finally {
      setTimeout(() => setIsWatering(false), 1000);
    }
  };

  const handleListenSpeech = () => {
    speakThai(
      `ยินดีต้อนรับสู่สวนความสุขของบ้านเราค่ะ ขณะนี้ต้นไม้ของเราเป็น ${stageInfo.name} เลเวล ${level} สะสมหยดน้ำได้ ${exp} จาก ${maxExp} หยด ตอนนี้มีหยดน้ำพร้อมรด ${waterDrops} หยดค่ะ ทุกคนสามารถช่วยกันรดน้ำเพื่อสะสมแต้มเข้าโหลของบ้านได้เลยนะคะ`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden border border-[#ECE7DF] flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#ECE7DF] bg-[#FAF8F5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🌱</span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#2D2825] flex items-center gap-2">
                <span>ต้นไม้ความสุขของบ้าน</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${stageInfo.badgeBg}`}>
                  Lv.{level}
                </span>
              </h2>
              <p className="text-xs text-[#746C65]">ร่วมมือร่วมใจ รดน้ำความรักให้ต้นไม้เติบโต</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleListenSpeech}
              className="p-2 rounded-xl bg-white hover:bg-[#EEF4F0] border border-[#ECE7DF] text-[#5F8D75] transition-colors cursor-pointer"
              title="ฟังเสียงอ่านภาษาไทย"
            >
              <SpeakerHigh size={18} weight="bold" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white hover:bg-rose-50 border border-[#ECE7DF] text-[#746C65] hover:text-rose-600 transition-colors cursor-pointer"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Scrollable Garden Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-5">
          {/* Main Panoramic Tree Garden Scene */}
          <div
            className={`relative rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center border border-[#ECE7DF] overflow-hidden bg-gradient-to-b ${stageInfo.bgGradient}`}
          >
            {/* Soft Sun in Background */}
            <div className="absolute top-4 right-6 w-14 h-14 rounded-full bg-amber-200/50 blur-lg pointer-events-none" />

            {/* Tree Stage Badge */}
            <div className="mb-2 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 shadow-2xs border border-[#ECE7DF]/80">
              <span className="text-sm">{stageInfo.emoji}</span>
              <span className="text-xs font-black text-[#2D2825]">{stageInfo.name}</span>
            </div>

            {/* Big Tree Illustration */}
            <div className="my-2 z-10">
              <TreeIllustration stage={stageInfo.key} isWatering={isWatering} size="lg" />
            </div>

            {/* Tree Description */}
            <p className="text-xs sm:text-sm text-center text-[#554D47] font-medium max-w-sm mt-1 z-10 leading-relaxed break-words px-2">
              "{stageInfo.desc}"
            </p>

            {/* Growth Progress Bar */}
            <div className="w-full max-w-xs mt-4 z-10 bg-white/95 p-3 rounded-2xl border border-[#ECE7DF] shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-[#2D2825]">ความเติบโตสู่ระดับถัดไป</span>
                <span className="text-[#5F8D75] font-mono">{progressPercent}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#FAF8F5] border border-[#ECE7DF] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#5F8D75] via-[#88B09A] to-[#60A5FA] transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#746C65]">
                <span>รดน้ำแล้ว {exp} หยด</span>
                <span className="font-bold">เป้าหมาย {maxExp} หยด</span>
              </div>
            </div>

            {/* Feedback / Error Toast Banner */}
            {feedbackToast && (
              <div className="mt-3 px-4 py-2 rounded-2xl bg-emerald-500 text-white text-xs font-black shadow-md animate-bounce flex items-center gap-2 z-20">
                <CheckCircle size={16} weight="bold" />
                <span>{feedbackToast}</span>
              </div>
            )}
            {errorMsg && (
              <div className="mt-3 px-4 py-2 rounded-2xl bg-rose-500 text-white text-xs font-bold shadow-md animate-shake z-20">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Watering Controls Panel (Senior-friendly, Big Tappable Targets) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#FAF8F5] border border-[#ECE7DF] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Drop size={20} weight="fill" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#2D2825]">หยดน้ำของบ้าน</h3>
                  <p className="text-[11px] text-[#746C65]">พร้อมรดได้ทันที</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-white border border-blue-200 shadow-2xs">
                <span className="text-lg font-black text-blue-600">{waterDrops}</span>
                <span className="text-xs font-bold text-[#746C65]">หยด 💧</span>
              </div>
            </div>

            {/* Action Buttons: 1 drop, 3 drops, or all */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleWater(1)}
                disabled={isWatering || waterDrops < 1}
                className="py-3 px-1.5 sm:px-2 rounded-2xl bg-white hover:bg-blue-50 border border-[#ECE7DF] hover:border-blue-300 text-[#2D2825] font-black text-[11px] sm:text-xs transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex flex-col items-center justify-center gap-1 shadow-2xs"
              >
                <span className="text-lg">💧</span>
                <span className="whitespace-nowrap">รด 1 หยด</span>
                <span className="text-[10px] text-emerald-600 font-bold whitespace-nowrap">+10 แต้ม</span>
              </button>

              <button
                type="button"
                onClick={() => handleWater(3)}
                disabled={isWatering || waterDrops < 3}
                className="py-3 px-1.5 sm:px-2 rounded-2xl bg-white hover:bg-blue-50 border border-[#ECE7DF] hover:border-blue-300 text-[#2D2825] font-black text-[11px] sm:text-xs transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex flex-col items-center justify-center gap-1 shadow-2xs"
              >
                <span className="text-lg">💧💧💧</span>
                <span className="whitespace-nowrap">รด 3 หยด</span>
                <span className="text-[10px] text-emerald-600 font-bold whitespace-nowrap">+30 แต้ม</span>
              </button>

              <button
                type="button"
                onClick={() => handleWater(Math.min(waterDrops, 5))}
                disabled={isWatering || waterDrops <= 0}
                className="py-3 px-1.5 sm:px-2 rounded-2xl bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-black text-[11px] sm:text-xs transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex flex-col items-center justify-center gap-1 shadow-sm"
              >
                <span className="text-lg">🚿</span>
                <span className="whitespace-nowrap">รด {Math.min(waterDrops, 5)} หยด</span>
                <span className="text-[10px] text-white/90 font-bold whitespace-nowrap">+{Math.min(waterDrops, 5) * 10} แต้ม</span>
              </button>
            </div>
          </div>

          {/* How to Earn Water Drops Guide */}
          <div className="p-4 rounded-3xl bg-white border border-[#ECE7DF] space-y-2.5">
            <h3 className="text-xs font-black text-[#2D2825] flex items-center gap-1.5">
              <Info size={16} weight="bold" className="text-[#5F8D75]" />
              <span>วิธีสะสมหยดน้ำ 💧 เข้าบ้าน</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DF] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🧹</span>
                  <span className="font-bold text-[#2D2825]">ทำงานบ้านเสร็จ</span>
                </div>
                <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">+2 💧</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DF] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">📸</span>
                  <span className="font-bold text-[#2D2825]">โพสต์ภาพกิจกรรม</span>
                </div>
                <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">+1 💧</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DF] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">❄️</span>
                  <span className="font-bold text-[#2D2825]">ดูแลตรวจเช็กบ้าน</span>
                </div>
                <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">+3 💧</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DF] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">💊</span>
                  <span className="font-bold text-[#2D2825]">กินยาตรงเวลา</span>
                </div>
                <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">+2 💧</span>
              </div>
            </div>
          </div>

          {/* Watering History Log */}
          <div className="p-4 rounded-3xl bg-white border border-[#ECE7DF] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#2D2825] flex items-center gap-1.5">
                <ClockCounterClockwise size={16} weight="bold" className="text-[#E88D67]" />
                <span>ประวัติการรดน้ำ (รวม {totalWatered} ครั้ง)</span>
              </h3>
            </div>

            {recentLogs && recentLogs.length > 0 ? (
              <div className="space-y-2">
                {recentLogs.map((log) => {
                  const logTime = new Date(log.timestamp).toLocaleTimeString('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DF] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-white border border-[#ECE7DF] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                          {log.avatarType === 'image' && log.avatarImage ? (
                            <img src={log.avatarImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>{log.avatar || '💧'}</span>
                          )}
                        </div>
                        <p className="font-bold text-[#2D2825] truncate">
                          {log.message || `${log.memberName || 'สมาชิก'} รดน้ำ ${log.amount || 1} หยด 💧`}
                        </p>
                      </div>
                      <span className="text-[10px] text-[#9E958D] font-mono shrink-0">{logTime}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-center text-[#9E958D] py-3">ยังไม่มีประวัติการรดน้ำ มาเป็นคนแรกกันเถอะ!</p>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 border-t border-[#ECE7DF] bg-[#FAF8F5] flex items-center justify-between shrink-0">
          <p className="text-[11px] text-[#746C65]">
            ทุกหยดน้ำช่วยเติมแต้มลงใน <span className="font-bold text-[#E88D67]">🍯 โหลของบ้าน</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-[#2D2825] hover:bg-black text-white font-bold text-xs transition-colors cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

export default FamilyTreeCard;
