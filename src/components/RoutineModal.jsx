import { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Sparkle,
  Heart,
  Check,
  Cpu,
  ChatCircleText,
  Smiley,
  Plant,
  BookOpen,
  Coffee,
  Barbell,
  Lightbulb,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { analyzeDailyRoutine, PRESET_ROUTINES } from '../services/aiAdvisor';

export default function RoutineModal({ isOpen, onClose, currentMemberId }) {
  const { members, addRoutineEntry } = useApp();
  const [selectedMember, setSelectedMember] = useState(currentMemberId || '');
  const [photo, setPhoto] = useState(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('สุขภาพ & กายใจ');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentMemberId) setSelectedMember(currentMemberId);
  }, [currentMemberId]);

  useEffect(() => {
    if (isOpen) {
      // Default with a preset so user can test right away
      const preset = PRESET_ROUTINES[0];
      setPhoto(preset.photo);
      setCaption(preset.caption);
      setCategory(preset.category);
      setAnalysisResult(null);
      setIsAnalyzing(false);
    }
  }, [isOpen]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhoto(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const applyPreset = (preset) => {
    setPhoto(preset.photo);
    setCaption(preset.caption);
    setCategory(preset.category);
  };

  const handleStartAnalysis = async () => {
    if (!caption.trim() || !selectedMember) return;

    setIsAnalyzing(true);
    const memberObj = members.find((m) => m.id === selectedMember) || members[0];

    const result = await analyzeDailyRoutine({
      memberName: memberObj?.name || 'สมาชิก',
      caption,
      photo,
      category,
    });

    setTimeout(() => {
      setAnalysisResult(result);
      setIsAnalyzing(false);

      // Save into App Context and Family Jar
      addRoutineEntry({
        memberId: selectedMember,
        caption,
        photo,
        category,
        aiAnalysis: result,
        points: result.pointsAwarded,
        exp: result.expAwarded,
      });
    }, 1200);
  };

  if (!isOpen) return null;

  const memberData = members.find((m) => m.id === selectedMember) || members[0];

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
              📸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#2D2825]">บันทึกกิจวัตรประจำวัน</h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#EEF4F0] text-[#5F8D75]">
                  AI LIFESTYLE
                </span>
              </div>
              <p className="text-xs text-[#746C65]">ถ่ายรูปพร้อมแคปชั่น ให้ AI วิเคราะห์พลังบวก & แจกแต้ม</p>
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

        {/* Content */}
        {!analysisResult ? (
          <div className="p-5 space-y-4">
            {/* Quick 1-click Preset Selector */}
            <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#ECE7DF]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#746C65] flex items-center gap-1">
                  <Sparkle size={14} className="text-[#E88D67]" weight="fill" />
                  <span>แตะเพื่อทดสอบด้วยภาพ & แคปชั่นตัวอย่างทันที:</span>
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {PRESET_ROUTINES.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="p-2.5 rounded-xl bg-white hover:bg-[#EEF4F0] border border-[#ECE7DF] hover:border-[#5F8D75]/40 text-center transition-all group"
                  >
                    <span className="text-xl block mb-1 group-hover:scale-110 transition-transform">
                      {preset.emoji}
                    </span>
                    <span className="text-[11px] font-bold text-[#2D2825] block truncate">
                      {preset.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Upload Area */}
            <div>
              <label className="block text-xs font-bold text-[#2D2825] mb-1.5 flex items-center justify-between">
                <span>1. รูปถ่ายกิจกรรม / กิจวัตร</span>
                <span className="text-[11px] text-[#5F8D75] font-semibold">แตะเพื่อเปลี่ยนรูป</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full h-44 rounded-2xl border-2 border-dashed border-[#ECE7DF] hover:border-[#5F8D75] bg-[#FAF8F5] cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all group p-2 text-center"
              >
                {photo ? (
                  <img src={photo} alt="รูปกิจวัตร" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="space-y-1.5">
                    <Camera size={28} className="mx-auto text-[#5F8D75]" />
                    <p className="text-xs font-bold text-[#2D2825]">แตะถ่ายรูปหรือเลือกจากคลังภาพ</p>
                    <p className="text-[10px] text-[#746C65]">เช่น วิ่งตอนเช้า, กินข้าวพร้อมหน้า, อ่านหนังสือ</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                  📷 แตะเพื่อเปลี่ยนรูปภาพ
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Caption Textarea */}
            <div>
              <label htmlFor="caption-input" className="block text-xs font-bold text-[#2D2825] mb-1.5">
                2. แคปชั่นบรรยาย (วันนี้ทำอะไรไป มีความรู้สึกอย่างไร?)
              </label>
              <textarea
                id="caption-input"
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="เช่น วันนี้ตื่นเช้ามาวิ่ง 5 กิโล รู้สึกสดชื่นมากๆ พร้อมลุยงาน!"
                className="w-full px-4 py-3 bg-[#FAF8F5] rounded-2xl border border-[#ECE7DF] text-sm text-[#2D2825] placeholder:text-[#9E958D] focus:outline-none focus:ring-2 focus:ring-[#5F8D75] resize-none"
              />
            </div>

            {/* Member Selector */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DF]">
              <span className="text-xs text-[#746C65] font-semibold">โพสต์ในชื่อ:</span>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="bg-white border border-[#ECE7DF] rounded-xl px-3 py-1.5 text-xs font-bold text-[#2D2825] focus:outline-none focus:ring-2 focus:ring-[#5F8D75]"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Submit AI Button */}
            <button
              type="button"
              onClick={handleStartAnalysis}
              disabled={!caption.trim() || isAnalyzing}
              className="w-full py-3.5 bg-gradient-to-r from-[#5F8D75] to-[#476E5B] hover:brightness-105 text-white text-base font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 transition-all"
            >
              {isAnalyzing ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AI กำลังวิเคราะห์กิจวัตร & ความสุข...</span>
                </div>
              ) : (
                <>
                  <Cpu size={22} weight="fill" />
                  <span>ให้ AI วิเคราะห์กิจวัตร & รับแต้มสะสม</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Analysis Result Screen */
          <div className="p-6 space-y-4 animate-pop-stamp">
            <div className="text-center">
              <span className="inline-block px-3 py-1 bg-[#EEF4F0] text-[#5F8D75] rounded-full text-xs font-bold mb-2">
                🌟 AI ROUTINE ANALYZED · วิเคราะห์สำเร็จ
              </span>
              <h3 className="text-2xl font-extrabold text-[#2D2825]">
                {analysisResult.activityTitle}
              </h3>
              <p className="text-xs text-[#746C65] mt-0.5">
                บันทึกของ <span className="font-bold text-[#2D2825]">{memberData?.name}</span>
              </p>
            </div>

            {/* Score Metrics */}
            <div className="bg-[#FAF8F5] p-4 rounded-3xl border border-[#ECE7DF] grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] font-bold text-[#746C65] uppercase">พลังบวก</p>
                <p className="text-2xl font-black text-[#5F8D75] mt-0.5">
                  {analysisResult.positivityScore}%
                </p>
                <p className="text-[9px] text-[#746C65]">Positivity</p>
              </div>
              <div className="border-x border-[#ECE7DF]">
                <p className="text-[10px] font-bold text-[#746C65] uppercase">แต้มที่ได้</p>
                <p className="text-2xl font-black text-[#E88D67] mt-0.5">
                  +{analysisResult.pointsAwarded}
                </p>
                <p className="text-[9px] text-[#746C65]">เข้าโหลบ้าน</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#746C65] uppercase">EXP เควสต์</p>
                <p className="text-2xl font-black text-[#7BA7C2] mt-0.5">
                  +{analysisResult.expAwarded}
                </p>
                <p className="text-[9px] text-[#746C65]">อัปเลเวล</p>
              </div>
            </div>

            {/* AI Reflection Feedback */}
            <div className="bg-[#EEF4F0] p-4 rounded-2xl border border-[#5F8D75]/20">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xl">✨</span>
                <span className="text-xs font-bold text-[#5F8D75]">บทวิเคราะห์จาก AI โค้ชครอบครัว:</span>
              </div>
              <p className="text-xs text-[#2D2825] leading-relaxed">
                "{analysisResult.aiReflection}"
              </p>

              {/* Badges / Benefits */}
              {analysisResult.benefits && (
                <div className="mt-3 pt-2.5 border-t border-[#5F8D75]/15 flex flex-wrap gap-1.5">
                  {analysisResult.benefits.map((b, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[11px] font-bold bg-white text-[#5F8D75] px-2.5 py-1 rounded-lg border border-[#5F8D75]/20"
                    >
                      <Check size={12} weight="bold" />
                      <span>{b}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 bg-[#5F8D75] hover:bg-[#476E5B] text-white text-base font-extrabold rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Check size={20} weight="bold" />
              <span>บันทึกเข้าฟีดครอบครัวเรียบร้อย</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
