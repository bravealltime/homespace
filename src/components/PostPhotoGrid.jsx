import { useState, useEffect, useCallback } from 'react';
import { CaretLeft, CaretRight, X } from '@phosphor-icons/react';

/**
 * Facebook-style Post Photo Grid
 * Supports 1, 2, 3, 4, and 5+ photos with responsive grid layout and interactive full-screen lightbox.
 */
export default function PostPhotoGrid({ photos = [], singlePhoto = null, alt = 'รูปกิจกรรม' }) {
  // Normalize photo array
  const photoList = Array.isArray(photos) && photos.length > 0
    ? photos.filter(Boolean)
    : (singlePhoto ? [singlePhoto] : []);

  const [lightboxIndex, setLightboxIndex] = useState(null);

  const openLightbox = (index) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const prevPhoto = useCallback((e) => {
    e?.stopPropagation?.();
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : photoList.length - 1));
  }, [photoList.length]);

  const nextPhoto = useCallback((e) => {
    e?.stopPropagation?.();
    setLightboxIndex((prev) => (prev < photoList.length - 1 ? prev + 1 : 0));
  }, [photoList.length]);

  // Handle keyboard events (ESC, Left, Right)
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, prevPhoto, nextPhoto]);

  if (photoList.length === 0) return null;

  return (
    <div className="w-full">
      {/* 1 Photo */}
      {photoList.length === 1 && (
        <div
          onClick={() => openLightbox(0)}
          className="w-full max-h-[460px] sm:max-h-[540px] rounded-2xl overflow-hidden bg-black/5 cursor-pointer group relative border border-[#ECE7DF]"
          title="แตะเพื่อดูรูปขนาดเต็ม"
        >
          <img
            src={photoList[0]}
            alt={alt}
            className="w-full h-full max-h-[460px] sm:max-h-[540px] object-cover group-hover:scale-101 transition-transform"
            loading="lazy"
          />
        </div>
      )}

      {/* 2 Photos: Side-by-side split */}
      {photoList.length === 2 && (
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden aspect-16/10 bg-black/5 border border-[#ECE7DF]">
          {photoList.map((src, idx) => (
            <div
              key={idx}
              onClick={() => openLightbox(idx)}
              className="relative w-full h-full overflow-hidden cursor-pointer group"
              title="แตะเพื่อดูรูปขนาดเต็ม"
            >
              <img
                src={src}
                alt={`${alt} ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-103 transition-transform"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* 3 Photos: 1 big left, 2 stacked right */}
      {photoList.length === 3 && (
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden aspect-16/10 bg-black/5 border border-[#ECE7DF]">
          {/* Big Photo Left (row-span-2) */}
          <div
            onClick={() => openLightbox(0)}
            className="relative w-full h-full overflow-hidden cursor-pointer group row-span-2"
            title="แตะเพื่อดูรูปขนาดเต็ม"
          >
            <img
              src={photoList[0]}
              alt={`${alt} 1`}
              className="w-full h-full object-cover group-hover:scale-103 transition-transform"
              loading="lazy"
            />
          </div>

          {/* Right Top */}
          <div
            onClick={() => openLightbox(1)}
            className="relative w-full h-full overflow-hidden cursor-pointer group"
            title="แตะเพื่อดูรูปขนาดเต็ม"
          >
            <img
              src={photoList[1]}
              alt={`${alt} 2`}
              className="w-full h-full object-cover group-hover:scale-103 transition-transform"
              loading="lazy"
            />
          </div>

          {/* Right Bottom */}
          <div
            onClick={() => openLightbox(2)}
            className="relative w-full h-full overflow-hidden cursor-pointer group"
            title="แตะเพื่อดูรูปขนาดเต็ม"
          >
            <img
              src={photoList[2]}
              alt={`${alt} 3`}
              className="w-full h-full object-cover group-hover:scale-103 transition-transform"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* 4 Photos: 2x2 Grid */}
      {photoList.length === 4 && (
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden aspect-square sm:aspect-16/10 bg-black/5 border border-[#ECE7DF]">
          {photoList.map((src, idx) => (
            <div
              key={idx}
              onClick={() => openLightbox(idx)}
              className="relative w-full h-full overflow-hidden cursor-pointer group"
              title="แตะเพื่อดูรูปขนาดเต็ม"
            >
              <img
                src={src}
                alt={`${alt} ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-103 transition-transform"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* 5+ Photos: 2x2 Grid with +N overlay on the 4th item (Facebook style) */}
      {photoList.length >= 5 && (
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden aspect-square sm:aspect-16/10 bg-black/5 border border-[#ECE7DF]">
          {photoList.slice(0, 3).map((src, idx) => (
            <div
              key={idx}
              onClick={() => openLightbox(idx)}
              className="relative w-full h-full overflow-hidden cursor-pointer group"
              title="แตะเพื่อดูรูปขนาดเต็ม"
            >
              <img
                src={src}
                alt={`${alt} ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-103 transition-transform"
                loading="lazy"
              />
            </div>
          ))}

          {/* 4th item with overlay */}
          <div
            onClick={() => openLightbox(3)}
            className="relative w-full h-full overflow-hidden cursor-pointer group"
            title={`ดูรูปทั้งหมด (${photoList.length} รูป)`}
          >
            <img
              src={photoList[3]}
              alt={`${alt} 4`}
              className="w-full h-full object-cover filter brightness-60 group-hover:scale-103 transition-transform"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center text-white font-black text-2xl sm:text-3xl select-none backdrop-blur-2xs">
              <span>+{photoList.length - 3}</span>
              <span className="text-[11px] font-medium text-white/90 mt-0.5">ดูทั้งหมด {photoList.length} รูป</span>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Interactive Lightbox */}
      {lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-fadeIn"
          onClick={closeLightbox}
        >
          {/* Top Bar: Counter & Close */}
          <div
            className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold border border-white/10">
              📷 {lightboxIndex + 1} / {photoList.length}
            </div>
            <button
              type="button"
              onClick={closeLightbox}
              className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center text-lg border border-white/10 transition-colors cursor-pointer"
              title="ปิด (Esc)"
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          {/* Left Arrow (Prev) */}
          {photoList.length > 1 && (
            <button
              type="button"
              onClick={prevPhoto}
              className="absolute left-3 sm:left-6 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer z-20 border border-white/10"
              title="รูปก่อนหน้า (ลูกศรซ้าย)"
            >
              <CaretLeft size={24} weight="bold" />
            </button>
          )}

          {/* Center Image */}
          <div
            className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center p-2 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photoList[lightboxIndex]}
              alt={`${alt} ${lightboxIndex + 1}`}
              className="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-2xl animate-scaleUp"
            />
          </div>

          {/* Right Arrow (Next) */}
          {photoList.length > 1 && (
            <button
              type="button"
              onClick={nextPhoto}
              className="absolute right-3 sm:right-6 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer z-20 border border-white/10"
              title="รูปถัดไป (ลูกศรขวา)"
            >
              <CaretRight size={24} weight="bold" />
            </button>
          )}

          {/* Bottom Thumbnails Strip (if multiple photos) */}
          {photoList.length > 1 && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 max-w-[90vw] overflow-x-auto no-scrollbar p-2 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              {photoList.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    idx === lightboxIndex
                      ? 'border-[#5F8D75] scale-105 ring-2 ring-[#5F8D75]/40'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
