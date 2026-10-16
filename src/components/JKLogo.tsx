import React from 'react';

interface JKLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  subtitleText?: string;
  onClick?: () => void;
}

export const JKLogo: React.FC<JKLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  subtitleText = 'Owned by JKSoftonics',
  onClick
}) => {
  const sizeConfig = {
    sm: {
      svgH: 'h-7 sm:h-8 max-w-[140px] sm:max-w-none',
      sub: 'text-[9px] -mt-0.5'
    },
    md: {
      svgH: 'h-8 sm:h-10 lg:h-11 max-w-[160px] xs:max-w-[190px] sm:max-w-none',
      sub: 'text-[10px] sm:text-[11px] -mt-0.5'
    },
    lg: {
      svgH: 'h-14 sm:h-18 lg:h-20 max-w-[260px] sm:max-w-none',
      sub: 'text-xs sm:text-sm mt-0.5'
    },
    xl: {
      svgH: 'h-20 sm:h-26 max-w-[340px] sm:max-w-none',
      sub: 'text-sm sm:text-base mt-1'
    }
  }[size];

  const hasItemAlign = className.includes('items-');

  return (
    <div
      onClick={onClick}
      className={`inline-flex flex-col shrink-0 select-none ${hasItemAlign ? '' : 'items-start'} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Exact User Given JKVoyage Vector Logo */}
      <svg
        viewBox="0 0 380 155"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeConfig.svgH} w-auto max-w-full drop-shadow-sm transition-transform duration-200 hover:scale-[1.02]`}
        aria-label="JKVoyage Logo"
      >
        <defs>
          {/* Orange Location Pin Gradient */}
          <linearGradient id="jk-pin-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFA000" />
            <stop offset="100%" stopColor="#FF5722" />
          </linearGradient>

          {/* Sun Warm Dawn Gradient */}
          <linearGradient id="jk-sun-grad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FFB300" />
            <stop offset="45%" stopColor="#FF7043" />
            <stop offset="100%" stopColor="#F4511E" />
          </linearGradient>

          {/* J Cyan-to-Navy Gradient */}
          <linearGradient id="jk-j-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00A0F6" />
            <stop offset="50%" stopColor="#0066CC" />
            <stop offset="100%" stopColor="#002D62" />
          </linearGradient>

          {/* K Upper Arm Gradient */}
          <linearGradient id="jk-k-arm" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0066CC" />
            <stop offset="100%" stopColor="#00B4D8" />
          </linearGradient>

          {/* Flight Swoosh Gradient */}
          <linearGradient id="jk-swoosh-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0096C7" />
            <stop offset="50%" stopColor="#00B4D8" />
            <stop offset="100%" stopColor="#48CAE4" />
          </linearGradient>

          {/* Sun Mountains Gradient */}
          <linearGradient id="jk-mount-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0077B6" />
            <stop offset="100%" stopColor="#001F54" />
          </linearGradient>
        </defs>

        {/* 1. RISING SUN BEHIND MOUNTAINS */}
        <g id="sun-element">
          <path d="M 185 85 A 42 42 0 0 1 269 85 Z" fill="url(#jk-sun-grad)" />
          {/* Subtle Sun Clouds */}
          <path d="M 175 76 Q 185 73 195 76 Q 200 76 205 77 L 175 77 Z" fill="#FFE0B2" opacity="0.85" />
          <path d="M 245 78 Q 255 75 268 78 L 245 78 Z" fill="#FFE0B2" opacity="0.85" />
        </g>

        {/* 2. MAJESTIC MOUNTAINS IN FRONT OF SUN */}
        <g id="sun-mountains">
          <path d="M 165 85 L 180 77 L 195 83 L 208 67 L 225 82 L 236 75 L 248 85 Z" fill="url(#jk-mount-grad)" />
          <polygon points="208,67 225,82 236,75 248,85 165,85 180,77 195,83" fill="#002D62" />
          <polygon points="208,67 218,85 225,82" fill="#001845" />
          {/* Center snowcap */}
          <polygon points="208,67 202,74 205,73 208,76 211,73 214,75 212,71" fill="#FFFFFF" />
          {/* Left snowcap */}
          <polygon points="180,77 176,82 178,81 180,83 182,81 184,82" fill="#FFFFFF" />
          {/* Right snowcap */}
          <polygon points="236,75 232,80 234,79 236,81 238,79 240,80" fill="#FFFFFF" />
        </g>

        {/* 3. J HOOK & NESTED MOUNTAIN */}
        {/* Main J Stem & Hook */}
        <path
          d="M 82 66 L 98 66 L 98 116 C 98 128 91 138 78 143 C 65 147 48 144 38 135 C 32 129 27 121 34 112 C 40 105 48 112 53 118 C 60 126 69 127 75 122 C 81 117 82 110 82 102 Z"
          fill="url(#jk-j-grad)"
        />

        {/* Mountain Inside J Hook */}
        <g id="j-mountain-nested">
          <path d="M 33 118 L 47 104 L 62 118 L 74 109 L 83 120 L 33 125 Z" fill="#001845" />
          <polygon points="47,104 42,112 45,110 47,114 50,110 52,112" fill="#FFFFFF" />
          <polygon points="47,104 50,110 52,112 47,115" fill="#E0F2FE" />
          <polygon points="74,109 71,114 73,113 74,115 76,113 78,114" fill="#FFFFFF" />
        </g>

        {/* 4. ORANGE MAP PIN ON TOP OF J */}
        <g id="j-map-pin">
          <path
            d="M 80 28 C 69 28 60 37 60 48 C 60 59 73 72 80 78 C 87 72 100 59 100 48 C 100 37 91 28 80 28 Z"
            fill="url(#jk-pin-grad)"
            filter="drop-shadow(0px 2px 3px rgba(255,87,34,0.45))"
          />
          <circle cx="80" cy="47" r="7.5" fill="#FFFFFF" />
        </g>

        {/* 5. K VERTICAL STEM & BRANCHES */}
        {/* K Vertical Spine */}
        <path d="M 98 66 L 118 66 L 118 135 L 98 135 Z" fill="#0052A3" />

        {/* K Upper Arm (Cyan Gradient) */}
        <path d="M 118 90 L 163 60 L 186 60 L 134 98 Z" fill="url(#jk-k-arm)" />

        {/* K Lower Arm (Adaptive Navy / High Contrast in Dark Mode) */}
        <path
          d="M 125 93 L 172 135 L 146 135 L 110 102 Z"
          className="fill-[#001845] dark:fill-[#003875]"
        />

        {/* 6. SWOOSH FLIGHT STREAM */}
        <g id="flight-swoosh-stream">
          <path
            d="M 52 142 C 85 142 108 122 138 98 C 172 71 216 75 272 73 C 285 72 298 68 312 60 C 298 65 282 68 268 68 C 210 68 166 76 128 103 C 102 122 80 137 52 142 Z"
            fill="url(#jk-swoosh-grad)"
          />
          <path
            d="M 105 124 C 132 102 172 82 225 80 C 255 79 285 75 305 65 C 285 71 255 74 225 75 C 172 77 132 96 105 124 Z"
            fill="#FFFFFF"
            opacity="0.95"
          />
        </g>

        {/* 7. ASCENDING AIRPLANE */}
        <g id="travel-airplane" transform="translate(305, 50) rotate(10)">
          <path
            d="M 28 5 L 18 10 L 14 3 L 11 5 L 13 12 L 2 17 L 0 13 L -3 15 L -1 21 L -6 24 L -6 27 L 1 24 L 14 17 L 18 23 L 21 21 L 19 16 L 31 10 C 34 8 34 6 31 5 Z"
            className="fill-[#002D62] dark:fill-sky-300"
          />
        </g>

        {/* 8. VOYAGE TYPOGRAPHY (Deep Navy in Light, Pure White in Dark Mode) */}
        <g id="voyage-letters" className="fill-[#001845] dark:fill-white transition-colors duration-200">
          {/* V */}
          <path d="M 128 98 L 141 98 L 153 133 L 154 133 L 166 98 L 178 98 L 160 144 L 146 144 Z" />
          {/* o */}
          <path d="M 197 106 C 187 106 179 114 179 125 C 179 136 187 144 197 144 C 207 144 215 136 215 125 C 215 114 207 106 197 106 Z M 197 116 C 202 116 205 120 205 125 C 205 130 202 134 197 134 C 192 134 189 130 189 125 C 189 120 192 116 197 116 Z" />
          {/* y */}
          <path d="M 220 108 L 229 108 L 235 128 L 236 128 L 243 108 L 252 108 L 241 138 C 237 148 231 154 221 154 L 217 154 L 217 146 L 221 146 C 226 146 229 143 231 137 Z" />
          {/* a */}
          <path d="M 268 116 C 265 114 262 113 258 113 C 252 113 247 117 247 122 C 247 127 251 130 258 131 L 261 131 C 265 132 268 133 268 136 C 268 139 265 141 260 141 C 255 141 251 138 250 135 L 242 139 C 244 144 251 148 260 148 C 270 148 277 143 277 135 L 277 108 L 268 108 Z M 268 124 L 268 126 C 265 125 262 124 259 123 C 257 122 256 121 256 119 C 256 117 258 116 261 116 C 264 116 266 117 268 120 Z" />
          {/* g */}
          <path d="M 295 106 C 285 106 278 114 278 125 C 278 136 285 144 295 144 C 300 144 305 141 308 137 L 308 142 C 308 149 303 153 296 153 C 290 153 286 150 284 146 L 277 150 C 280 157 287 161 296 161 C 309 161 317 153 317 140 L 317 108 L 308 108 L 308 113 C 305 109 300 106 295 106 Z M 297 114 C 302 114 306 119 306 125 C 306 131 302 136 297 136 C 292 136 288 131 288 125 C 288 119 292 114 297 114 Z" />
          {/* e */}
          <path d="M 334 106 C 323 106 315 114 315 125 C 315 136 323 144 334 144 C 342 144 348 140 351 134 L 343 130 C 341 133 338 136 334 136 C 329 136 325 132 324 127 L 352 127 C 352 126 352 125 352 123 C 352 113 345 106 334 106 Z M 324 121 C 325 116 329 113 334 113 C 339 113 343 116 344 121 Z" />
        </g>
      </svg>

      {/* Subtitle / Brand attribution */}
      {showSubtitle && (
        <span
          className={`${sizeConfig.sub} pl-1 font-semibold tracking-wide text-slate-600 dark:text-slate-300 truncate max-w-[200px] sm:max-w-none`}
        >
          {subtitleText}
        </span>
      )}
    </div>
  );
};
