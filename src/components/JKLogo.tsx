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
      imgH: 'h-7 sm:h-8',
      sub: 'text-[9px] -mt-0.5'
    },
    md: {
      imgH: 'h-8 sm:h-9 md:h-10',
      sub: 'text-[10px] sm:text-[11px] -mt-0.5'
    },
    lg: {
      imgH: 'h-12 sm:h-14 md:h-16',
      sub: 'text-xs sm:text-sm mt-0.5'
    },
    xl: {
      imgH: 'h-16 sm:h-20',
      sub: 'text-sm sm:text-base mt-1'
    }
  }[size];

  const hasItemAlign = className.includes('items-');

  return (
    <div
      onClick={onClick}
      className={`inline-flex flex-col shrink-0 select-none ${hasItemAlign ? '' : 'items-start'} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Light mode logo (hidden in dark mode) */}
      <img
        src="/jkvoyage-logo.svg"
        alt="JKVoyage"
        className={`${sizeConfig.imgH} w-auto object-contain shrink-0 drop-shadow-xs transition-transform duration-200 hover:scale-[1.01] dark:hidden`}
      />

      {/* Dark mode logo with crisp white typography and luminous blue accents (hidden in light mode) */}
      <img
        src="/jkvoyage-logo-dark.svg"
        alt="JKVoyage"
        className={`${sizeConfig.imgH} w-auto object-contain shrink-0 drop-shadow-xs transition-transform duration-200 hover:scale-[1.01] hidden dark:block`}
      />

      {/* Subtitle brand attribution */}
      {showSubtitle && (
        <span
          className={`${sizeConfig.sub} pl-1 font-semibold tracking-wide text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-none`}
        >
          {subtitleText}
        </span>
      )}
    </div>
  );
};
