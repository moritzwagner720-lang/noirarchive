import React, { useState } from 'react';
import { getDefaultAvatarInitial, getAvatarColorForUsername } from '../utils/avatar';

interface UserAvatarProps {
  username?: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'squircle' | 'circle';
  className?: string;
  showStatus?: boolean;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
}

const SIZE_MAP = {
  xs: { box: 'h-6 w-6', text: 'text-[11px]', status: 'h-2 w-2 -bottom-0.5 -right-0.5', radius: 'rounded-lg' },
  sm: { box: 'h-8 w-8', text: 'text-xs', status: 'h-2.5 w-2.5 -bottom-0.5 -right-0.5', radius: 'rounded-xl' },
  md: { box: 'h-10 w-10', text: 'text-sm', status: 'h-3 w-3 -bottom-0.5 -right-0.5', radius: 'rounded-xl' },
  lg: { box: 'h-12 w-12', text: 'text-base font-bold', status: 'h-3.5 w-3.5 -bottom-0.5 -right-0.5', radius: 'rounded-2xl' },
  xl: { box: 'h-16 w-16', text: 'text-2xl font-bold', status: 'h-4 w-4 bottom-0 right-0', radius: 'rounded-2xl' },
  '2xl': { box: 'h-20 w-20', text: 'text-3xl font-extrabold', status: 'h-5 w-5 bottom-0 right-0', radius: 'rounded-3xl' },
};

const STATUS_COLORS = {
  online: 'bg-emerald-500',
  idle: 'bg-amber-500',
  dnd: 'bg-rose-500',
  offline: 'bg-neutral-500',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  username = 'User',
  avatarUrl,
  size = 'md',
  shape = 'squircle',
  className = '',
  showStatus = false,
  status = 'online',
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const initial = getDefaultAvatarInitial(username);
  const color = getAvatarColorForUsername(username);
  const dimensions = SIZE_MAP[size] || SIZE_MAP.md;
  const roundedClass = shape === 'circle' ? 'rounded-full' : dimensions.radius;

  const hasCustomImage = Boolean(avatarUrl && !imgFailed && !avatarUrl.includes('unsplash.com'));

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}>
      {hasCustomImage ? (
        <img
          src={avatarUrl!}
          alt={`@${username}`}
          onError={() => setImgFailed(true)}
          className={`${dimensions.box} ${roundedClass} object-cover shadow-sm border border-white/10`}
          title={`@${username}`}
        />
      ) : (
        <div
          className={`${dimensions.box} ${roundedClass} flex items-center justify-center font-bold text-white shadow-sm transition-transform duration-150`}
          style={{
            backgroundColor: color.bgHex,
            background: `linear-gradient(135deg, ${color.bgHex} 0%, #1e1f22 100%)`,
            boxShadow: `0 2px 8px ${color.bgHex}35`,
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
          title={`@${username}`}
          aria-label={`Avatar for @${username}`}
        >
          <span className={`${dimensions.text} tracking-tight font-sans drop-shadow-sm`}>
            {initial}
          </span>
        </div>
      )}

      {showStatus && (
        <span
          className={`absolute ${dimensions.status} rounded-full ring-2 ring-[#1e1f22] ${STATUS_COLORS[status]}`}
          title={status}
        />
      )}
    </div>
  );
};
