import React from 'react';

interface NoirArchiveLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const NoirArchiveLogo: React.FC<NoirArchiveLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { box: 'h-7 w-7', img: 'h-5 w-5', text: 'text-sm' },
    md: { box: 'h-9 w-9', img: 'h-6 w-6', text: 'text-base' },
    lg: { box: 'h-11 w-11', img: 'h-8 w-8', text: 'text-lg' },
  };

  const dim = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Noir Archive Logo Container */}
      <div
        className={`${dim.box} rounded-xl bg-[#1e1f22] border border-[#383a40] flex items-center justify-center p-1 shadow-sm transition-transform group-hover:scale-105 shrink-0 overflow-hidden`}
        style={{
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        }}
        title="Noir Archive"
      >
        <img
          src="/logo.png"
          alt="Noir Archive NA Logo"
          className={`${dim.img} object-contain filter drop-shadow`}
          onError={(e) => {
            // Elegant SVG fallback with official NA monogram if image cannot load
            const parent = (e.target as HTMLElement).parentElement;
            if (parent) {
              parent.innerHTML = `<span style="font-family: inherit; font-weight: 900; font-size: 13px; color: #ffffff; letter-spacing: -0.5px;">NA</span>`;
            }
          }}
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-sans font-extrabold tracking-wider text-white ${dim.text}`}>
              NOIR ARCHIVE
            </span>
          </div>
          <span className="font-mono-code text-[10px] text-neutral-400 tracking-wider uppercase mt-0.5 hidden sm:inline-block">
            FILE & FOLDER SHARING
          </span>
        </div>
      )}
    </div>
  );
};
