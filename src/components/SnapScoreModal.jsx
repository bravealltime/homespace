import { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  UploadSimple,
  Check,
  Sparkle,
  CaretDown,
  Lightning,
  Flame,
  ArrowsLeftRight,
  ShieldCheck,
  Cpu,
  Trophy,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { CHORE_TASKS, PRAISE_STICKERS } from '../data';
import { analyzeBeforeAfter, PRESET_CHORE_SCENARIOS } from '../services/aiAdvisor';

const PHASES = {
  SETUP: 'setup',
  SCANNING: 'scanning',
  RESULT: 'result',
};

function MemberAvatar({ member, size = 'sm' }) {
  const sizeMap = {
    sm: 'w-7 h-7 text-xs rounded-lg',
    md: 'w-9 h-9 text-sm rounded-xl',
  };

  if (member?.avatarType === 'image' && member?.avatarImage) {
    return (
      <img src={member.avatarImage} alt={member.name} className={`${sizeMap[size]} object-cover`} />
    );
  }

  return (
    <div
      className={`${sizeMap[size]} flex items-center justify-center font-bold`}
      style={{ backgroundColor: `${member?.color || '#5F8D75'}20` }}
    >
      {member?.avatar || '😊'}
    </div>
  );
}

export default function SnapScoreModal({ isOpen, onClose, preselectedMember, initialChoreId }) {
  const { members, addChoreEntry } = useApp();
  const [selectedMember, setSelectedMember] = useState(preselectedMember || '');
  const [selectedChore, setSelectedChore] = useState(initialChoreId ? String(initialChoreId) : '1');
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [phase, setPhase] = useState(PHASES.SETUP);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showChoreDropdown, setShowChoreDropdown] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  const beforeInputRef = useRef(null);
  const afterInputRef = useRef(null);
  const sliderContainerRef = useRef(null);

  useEffect(() => {
    if (preselectedMember) {
      setSelectedMember(preselectedMember);
    }
  }, [preselectedMember]);

  useEffect(() => {
    if (initialChoreId) {
      setSelectedChore(String(initialChoreId));
    }
  }, [initialChoreId]);

  // Load default preset on open so user can instantly test without hunting for photos
  useEffect(() => {
    if (isOpen) {
      const defaultPreset = PRESET_CHORE_SCENARIOS[0];
      setBeforeImage(defaultPreset.beforeImage);
      setAfterImage(defaultPreset.afterImage);
      setPhase(PHASES.SETUP);
      setAnalysisResult(null);
      setScanStep(0);
    }
  }, [isOpen]);

  const handleImageFile = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (type === 'before') setBeforeImage(ev.target.result);
        else setAfterImage(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyPreset = (preset) => {
    setBeforeImage(preset.beforeImage);
    setAfterImage(preset.afterImage);
    setSelectedChore(String(preset.id));
  };

  const handleStartAnalysis = async () => {
    if (!selectedMember || !selectedChore) return;

    setPhase(PHASES.SCANNING);
    setScanStep(1);

    const choreObj = CHORE_TASKS.find((c) => c.id === parseInt(selectedChore)) || CHORE_TASKS[0];
    const memberObj = members.find((m) => m.id === selectedMember) || members[0];

    // Trigger step changes in scanning animation
    setTimeout(() => setScanStep(2), 600);
    setTimeout(() => setScanStep(3), 1200);

    // Call AI analysis
    const aiData = await analyzeBeforeAfter({
      choreId: choreObj.id,
      choreName: choreObj.name,
      memberName: memberObj?.name || 'สมาชิก',
      beforeImage,
      afterImage,
    });

    setTimeout(() => {
      setAnalysisResult(aiData);
      setPhase(PHASES.RESULT);

      // Add points to household & create feed post
      addChoreEntry({
        memberId: selectedMember,
        choreName: choreObj.name,
        choreEmoji: choreObj.emoji,
        points: aiData.pointsBonus,
        praise: `ระดับ ${aiData.rank}! สะอาดขึ้น +${aiData.improvementPercent}%`,
        praiseEmoji: aiData.rank === 'SSS' ? '👑' : '✨',
        imageUrl: afterImage,
        beforeImage,
        afterImage,
        rank: aiData.rank,
        cleanlinessScore: aiData.cleanlinessScore,
        aiComment: aiData.critique,
      });
    }, 1800);
  };

  const handleSliderMove = (e) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, pos)));
  };

  if (!isOpen) return null;

  const selectedMemberData = members.find((m) => m.id === selectedMember) || members[0];
  const selectedChoreData = CHORE_TASKS.find((c) => c.id === parseInt(selectedChore)) || CHORE_TASKS[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl border border-[#ECE7DF] shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto animate-enter-rise text-[#2D2825]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-30 px-5 py-4 border-b border-[#ECE7DF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF4F0] text-[#5F8D75] flex items-center justify-center text-xl shadow-xs">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#2D2825]">ระบบ AI ตรวจสอบงานบ้าน</h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FDF1EB] text-[#E88D67]">
                  BEFORE & AFTER
                </span>
              </div>
              <p className="text-xs text-[#746C65]">เปรียบเทียบภาพก่อน-หลัง ประเมินคะแนน & แจก EXP</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#FAF8F5] hover:bg-[#F5F1EB] text-[#746C65] hover:text-[#2D2825] flex items-center justify-center transition-colors"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Phase 1: Setup & Upload */}
        {phase === PHASES.SETUP && (
          <div className="p-5 space-y-4">
            {/* Member & Chore Selectors Row */}
            <div className="grid grid-cols-1 gap-2.5">
              {/* Member Selector */}
              <div>
                <label className="block text-xs font-bold text-[#2D2825] mb-1">
                  ใครเป็นผู้ลงมือทำ?
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMemberDropdown(!showMemberDropdown);
                      setShowChoreDropdown(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-left hover:border-[#5F8D75] transition-all"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <MemberAvatar member={selectedMemberData} size="sm" />
                      <span className="text-xs font-bold text-[#2D2825] truncate">
                        {selectedMemberData?.name}
                      </span>
                    </span>
                    <CaretDown size={14} className="text-[#746C65] shrink-0" />
                  </button>

                  {showMemberDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-lg border border-[#ECE7DF] z-30 overflow-hidden max-h-48 overflow-y-auto">
                      {members.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedMember(m.id);
                            setShowMemberDropdown(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#FAF8F5] ${
                            selectedMember === m.id ? 'bg-[#EEF4F0] font-bold' : ''
                          }`}
                        >
                          <MemberAvatar member={m} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#2D2825] truncate">{m.name}</p>
                            <p className="text-[10px] text-[#746C65]">{m.role}</p>
                          </div>
                          {selectedMember === m.id && <Check size={14} className="text-[#5F8D75]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Chore Selector */}
              <div>
                <label className="block text-xs font-bold text-[#2D2825] mb-1">
                  ประเภทงานบ้าน
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChoreDropdown(!showChoreDropdown);
                      setShowMemberDropdown(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-left hover:border-[#5F8D75] transition-all"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="text-lg">{selectedChoreData.emoji}</span>
                      <span className="text-xs font-bold text-[#2D2825] truncate">
                        {selectedChoreData.name}
                      </span>
                    </span>
                    <CaretDown size={14} className="text-[#746C65] shrink-0" />
                  </button>

                  {showChoreDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-lg border border-[#ECE7DF] z-30 overflow-hidden max-h-48 overflow-y-auto">
                      {CHORE_TASKS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedChore(String(c.id));
                            setShowChoreDropdown(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#FAF8F5] ${
                            selectedChore === String(c.id) ? 'bg-[#EEF4F0] font-bold' : ''
                          }`}
                        >
                          <span>{c.emoji}</span>
                          <span className="flex-1 text-xs text-[#2D2825]">{c.name}</span>
                          <span className="text-[10px] font-bold text-[#5F8D75]">+{c.points} แต้ม</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick 1-Click Preset Scenario Buttons */}
            <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#ECE7DF]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#746C65] flex items-center gap-1">
                  <Sparkle size={13} className="text-[#E88D67]" weight="fill" />
                  <span>หรือแตะใช้ภาพตัวอย่างเพื่อทดสอบ AI ทันที:</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_CHORE_SCENARIOS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="p-2 rounded-xl bg-white hover:bg-[#EEF4F0] border border-[#ECE7DF] hover:border-[#5F8D75]/40 text-center transition-all group"
                  >
                    <span className="text-xl block mb-0.5">{preset.icon}</span>
                    <span className="text-[10px] font-bold text-[#2D2825] block truncate">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Before & After Photo Upload Panels */}
            <div className="grid grid-cols-2 gap-3">
              {/* Before Photo */}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-red-500 mb-1 flex items-center gap-1">
                  <span>📸 1. ภาพก่อนทำ (Before)</span>
                </span>
                <div
                  onClick={() => beforeInputRef.current?.click()}
                  className="relative aspect-square rounded-2xl border-2 border-dashed border-[#ECE7DF] hover:border-red-400 bg-[#FAF8F5] cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all group p-2 text-center"
                >
                  {beforeImage ? (
                    <img src={beforeImage} alt="ภาพก่อนทำ" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="space-y-1">
                      <Camera size={26} className="mx-auto text-red-400" />
                      <p className="text-[11px] font-bold text-[#2D2825]">แตะถ่าย/อัปโหลด</p>
                      <p className="text-[9px] text-[#746C65]">เช่น ซิงค์จานรก, ห้องรก</p>
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded-md font-bold backdrop-blur-xs">
                    BEFORE
                  </span>
                </div>
                <input
                  ref={beforeInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFile(e, 'before')}
                  className="hidden"
                />
              </div>

              {/* After Photo */}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#5F8D75] mb-1 flex items-center gap-1">
                  <span>✨ 2. ภาพหลังทำ (After)</span>
                </span>
                <div
                  onClick={() => afterInputRef.current?.click()}
                  className="relative aspect-square rounded-2xl border-2 border-dashed border-[#ECE7DF] hover:border-[#5F8D75] bg-[#FAF8F5] cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all group p-2 text-center"
                >
                  {afterImage ? (
                    <img src={afterImage} alt="ภาพหลังทำ" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="space-y-1">
                      <Camera size={26} className="mx-auto text-[#5F8D75]" />
                      <p className="text-[11px] font-bold text-[#2D2825]">แตะถ่าย/อัปโหลด</p>
                      <p className="text-[9px] text-[#746C65]">ภาพที่ทำความสะอาดเสร็จแล้ว</p>
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 bg-[#5F8D75]/90 text-white text-[9px] px-2 py-0.5 rounded-md font-bold backdrop-blur-xs">
                    AFTER
                  </span>
                </div>
                <input
                  ref={afterInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFile(e, 'after')}
                  className="hidden"
                />
              </div>
            </div>

            {/* Interactive Before/After Split Preview Slider if both images present */}
            {beforeImage && afterImage && (
              <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#ECE7DF]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#2D2825] flex items-center gap-1.5">
                    <ArrowsLeftRight size={14} className="text-[#5F8D75]" />
                    <span>ตัวอย่างสไลเดอร์เปรียบเทียบ (เลื่อนดูความแตกต่าง):</span>
                  </span>
                </div>

                <div
                  ref={sliderContainerRef}
                  onMouseMove={isDragging ? handleSliderMove : undefined}
                  onTouchMove={handleSliderMove}
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                  className="relative w-full h-44 rounded-xl overflow-hidden cursor-ew-resize select-none border border-[#ECE7DF]"
                >
                  {/* After Image (Background) */}
                  <img src={afterImage} alt="After" className="absolute inset-0 w-full h-full object-cover" />
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-[#5F8D75]/90 text-white rounded text-[10px] font-bold">
                    หลังทำ (สะอาด)
                  </span>

                  {/* Before Image (Foreground clipped) */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <img
                      src={beforeImage}
                      alt="Before"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ width: sliderContainerRef.current?.offsetWidth || '100%', maxWidth: 'none' }}
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 text-white rounded text-[10px] font-bold">
                      ก่อนทำ (รก)
                    </span>
                  </div>

                  {/* Slider divider line */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white text-[#2D2825] shadow-md flex items-center justify-center text-xs font-extrabold border border-[#ECE7DF]">
                      ↔
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Launch AI analysis button */}
            <button
              type="button"
              onClick={handleStartAnalysis}
              disabled={!beforeImage || !afterImage}
              className="w-full py-3.5 bg-gradient-to-r from-[#5F8D75] to-[#476E5B] hover:brightness-105 text-white text-base font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 transition-all"
            >
              <Cpu size={22} weight="fill" />
              <span>ให้ AI สแกนเปรียบเทียบ & คำนวณแต้ม</span>
            </button>
          </div>
        )}

        {/* Phase 2: Scanning Simulation Animation */}
        {phase === PHASES.SCANNING && (
          <div className="p-8 text-center space-y-5">
            <div className="relative w-48 h-48 mx-auto rounded-3xl overflow-hidden bg-[#FAF8F5] border-2 border-[#5F8D75] shadow-inner flex items-center justify-center">
              <img src={afterImage || beforeImage} alt="กำลังสแกน" className="w-full h-full object-cover" />

              {/* Holographic Radar Grid Overlay */}
              <div className="absolute inset-0 bg-[#5F8D75]/20 backdrop-brightness-110" />

              {/* Animated Scan Line */}
              <div className="absolute left-0 right-0 h-1.5 bg-[#5F8D75] shadow-[0_0_14px_#5F8D75] animate-scan-sweep" />

              {/* AI Detection boxes */}
              <div className="absolute top-4 left-4 w-12 h-12 border-2 border-white/80 rounded-lg animate-pulse" />
              <div className="absolute bottom-6 right-6 w-16 h-10 border-2 border-[#E88D67] rounded-lg animate-pulse" />

              <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono py-1 px-2 rounded-md">
                VISION_AI_ANALYZE_STREAM
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF4F0] text-[#5F8D75] text-xs font-bold animate-pulse">
                <Cpu size={16} />
                <span>
                  {scanStep === 1 && 'กำลังเทียบโครงสร้างภาพก่อน vs หลัง...'}
                  {scanStep === 2 && 'กำลังตรวจวัดดัชนีความสะอาดและความเป็นระเบียบ...'}
                  {scanStep === 3 && 'กำลังคำนวณแต้มโบนัส & EXP เควสต์...'}
                </span>
              </div>
              <p className="text-sm font-bold text-[#2D2825]">กำลังประมวลผลด้วย AI วิเคราะห์ภาพ</p>
              <p className="text-xs text-[#746C65]">รอสักครู่นะครับ กำลังออกใบรายงานคะแนน</p>
            </div>
          </div>
        )}

        {/* Phase 3: Gamified Result Stage Clear Screen */}
        {phase === PHASES.RESULT && analysisResult && (
          <div className="p-6 space-y-4 animate-pop-stamp">
            {/* Stage Clear Banner */}
            <div className="text-center">
              <span className="inline-block px-3 py-1 bg-[#EEF4F0] text-[#5F8D75] rounded-full text-xs font-bold mb-2">
                🎉 QUEST COMPLETED · ภารกิจสำเร็จ
              </span>
              <h3 className="text-2xl font-extrabold text-[#2D2825]">
                {selectedChoreData.name} สำเร็จแล้ว!
              </h3>
              <p className="text-xs text-[#746C65] mt-0.5">
                ผลงานของ <span className="font-bold text-[#2D2825]">{selectedMemberData?.name}</span>
              </p>
            </div>

            {/* Rank Grade & Rewards Row */}
            <div className="bg-[#FAF8F5] p-4 rounded-3xl border border-[#ECE7DF] flex items-center justify-around">
              {/* Rank Badge */}
              <div className="text-center">
                <p className="text-[10px] font-bold text-[#746C65] uppercase">AI Rank</p>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E88D67] to-[#CF6E46] text-white flex items-center justify-center text-2xl font-black shadow-md mt-1 mx-auto">
                  {analysisResult.rank}
                </div>
              </div>

              {/* Points Gained */}
              <div className="text-center border-x border-[#ECE7DF] px-4">
                <p className="text-[10px] font-bold text-[#746C65] uppercase">คะแนนเข้าบ้าน</p>
                <p className="text-2xl font-extrabold text-[#5F8D75] mt-1">
                  +{analysisResult.pointsBonus}
                </p>
                <p className="text-[10px] text-[#746C65]">แต้มสะสม</p>
              </div>

              {/* EXP Gained */}
              <div className="text-center">
                <p className="text-[10px] font-bold text-[#746C65] uppercase">EXP ที่ได้รับ</p>
                <p className="text-2xl font-extrabold text-[#7BA7C2] mt-1">
                  +{analysisResult.expGained}
                </p>
                <p className="text-[10px] text-[#746C65]">EXP สะสม</p>
              </div>
            </div>

            {/* AI Vision Metrics Breakdown */}
            <div className="space-y-2 bg-white p-3.5 rounded-2xl border border-[#ECE7DF]">
              <p className="text-xs font-bold text-[#2D2825] flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-[#5F8D75]" />
                <span>คะแนนวิเคราะห์จากระบบ AI:</span>
              </p>

              {/* Cleanliness Metric */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#746C65]">ความสะอาดหมดจด</span>
                  <span className="text-[#5F8D75] font-bold">{analysisResult.cleanlinessScore}%</span>
                </div>
                <div className="h-2 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#ECE7DF]">
                  <div
                    className="h-full bg-[#5F8D75] rounded-full transition-all duration-700"
                    style={{ width: `${analysisResult.cleanlinessScore}%` }}
                  />
                </div>
              </div>

              {/* Orderliness Metric */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#746C65]">ความเป็นระเบียบเรียบร้อย</span>
                  <span className="text-[#E88D67] font-bold">{analysisResult.orderlinessScore}%</span>
                </div>
                <div className="h-2 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#ECE7DF]">
                  <div
                    className="h-full bg-[#E88D67] rounded-full transition-all duration-700"
                    style={{ width: `${analysisResult.orderlinessScore}%` }}
                  />
                </div>
              </div>

              {/* Improvement Metric */}
              <div className="pt-1 flex items-center justify-between text-xs font-bold text-[#2D2825]">
                <span>ดัชนีการเปลี่ยนแปลงก่อน-หลัง (Delta):</span>
                <span className="text-[#5F8D75] bg-[#EEF4F0] px-2 py-0.5 rounded-md">
                  +{analysisResult.improvementPercent}% ดีขึ้นมาก
                </span>
              </div>
            </div>

            {/* AI Commentary Feedback */}
            <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE7DF]">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">💬</span>
                <span className="text-xs font-bold text-[#2D2825]">ข้อความประเมินจากโค้ช AI:</span>
              </div>
              <p className="text-xs text-[#746C65] leading-relaxed">
                "{analysisResult.aiSummary}"
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 bg-[#5F8D75] hover:bg-[#476E5B] text-white text-base font-extrabold rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Check size={20} weight="bold" />
              <span>รับแต้ม & กลับสู่หน้าหลัก</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
