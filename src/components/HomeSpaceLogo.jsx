import React from 'react';

/**
 * HomeSpace Warm Family Logo
 * Warm radiant terracotta/peach sunset, cozy cottage with heart chimney,
 * loving family silhouette embraced in the warm hearth doorway, and green growth sprout.
 */
export default function HomeSpaceLogo({ size = 32, className = '', rounded = 'rounded-xl', shadow = true }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden shrink-0 select-none ${rounded} ${
        shadow ? 'shadow-xs' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      aria-label="HomeSpace Logo"
    >
      <svg
        viewBox="0 0 512 512"
        width="100%"
        height="100%"
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="hsBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9371" />
            <stop offset="45%" stopColor="#FA7850" />
            <stop offset="100%" stopColor="#D95432" />
          </linearGradient>

          <radialGradient id="hsSunGlow" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#FFF9EE" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#FFE7C4" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#FFE7C4" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="hsHearth" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF3E0" />
            <stop offset="100%" stopColor="#FFE0B2" />
          </linearGradient>

          <linearGradient id="hsHeart" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF5E62" />
            <stop offset="100%" stopColor="#E8304C" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect width="512" height="512" fill="url(#hsBgGrad)" />
        <circle cx="256" cy="200" r="230" fill="url(#hsSunGlow)" />

        {/* Cozy Cottage */}
        <g>
          {/* Chimney & Smoke */}
          <path d="M 334 145 L 372 145 L 372 215 L 334 190 Z" fill="#FFF8F0" />
          <rect x="330" y="138" width="46" height="10" rx="4" fill="#FFEFE2" />
          <path
            d="M 353 118 C 353 118, 345 109, 340 105 C 334 100, 334 92, 340 86 C 346 81, 353 87, 353 88 C 353 87, 360 81, 366 86 C 372 92, 372 100, 366 105 Z"
            fill="#FFF9F5"
            opacity="0.95"
          />

          {/* Cottage Base Walls */}
          <rect x="136" y="222" width="240" height="188" rx="28" fill="#FFFDF8" />

          {/* Roof */}
          <path
            d="M 96 238 L 256 112 L 416 238"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="32"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 116 235 L 256 126 L 396 235"
            fill="none"
            stroke="#FFEFE6"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hearth Arch */}
          <path d="M 194 410 L 194 316 C 194 282, 318 282, 318 316 L 318 410 Z" fill="url(#hsHearth)" />

          {/* Family Silhouette (Loving Hug) */}
          <circle cx="222" cy="302" r="16" fill="#5A2E1F" />
          <path d="M 194 410 C 194 346, 238 340, 240 410 Z" fill="#5A2E1F" />

          <circle cx="290" cy="302" r="16" fill="#5A2E1F" />
          <path d="M 272 410 C 274 340, 318 346, 318 410 Z" fill="#5A2E1F" />

          <circle cx="256" cy="326" r="13" fill="#E25C37" />
          <path d="M 234 410 C 235 362, 277 362, 278 410 Z" fill="#E25C37" />

          {/* Heart above family */}
          <path
            d="M 256 285 C 256 285, 244 272, 237 266 C 230 259, 230 248, 238 241 C 246 234, 256 242, 256 244 C 256 242, 266 234, 274 241 C 282 248, 282 259, 275 266 Z"
            fill="url(#hsHeart)"
          />

          {/* Green Sprout Accent (#5F8D75) */}
          <g transform="translate(108, 376)">
            <path d="M 12 34 Q 10 18, 16 10" fill="none" stroke="#5F8D75" strokeWidth="4" strokeLinecap="round" />
            <path d="M 14 14 C 4 11, 2 1, 14 6 C 16 11, 16 13, 14 14 Z" fill="#5F8D75" />
            <path d="M 16 20 C 27 17, 28 8, 18 12 C 16 16, 16 19, 16 20 Z" fill="#78A68E" />
          </g>

          {/* Sparkles */}
          <path
            d="M 142 165 Q 142 177, 130 177 Q 142 177, 142 189 Q 142 177, 154 177 Q 142 177, 142 165 Z"
            fill="#FFF2B8"
            opacity="0.95"
          />
          <path
            d="M 388 270 Q 388 280, 378 280 Q 388 280, 388 290 Q 388 280, 398 280 Q 388 280, 388 270 Z"
            fill="#FFF2B8"
            opacity="0.9"
          />
        </g>
      </svg>
    </div>
  );
}
