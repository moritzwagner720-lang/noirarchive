import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Camera,
  MapPin,
  Send,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Instagram,
  Globe,
} from 'lucide-react';
import { User } from '../types';

export const PhotographersView: React.FC = () => {
  const {
    users,
    projects,
    photos,
    setSelectedPhotographer,
    setActiveTab,
    setIsTransferModalOpen,
    currentUser,
    setAuthModal,
    theme,
  } = useApp();

  const isLight = theme === 'light';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className={`mb-8 border-b pb-6 transition-colors ${isLight ? 'border-amber-200' : 'border-orange-500/20'}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono-code text-[10px] uppercase tracking-widest text-[#ff6b00] font-bold">
              <span className="h-2 w-2 rounded-full bg-[#ff6b00]" />
              <span>ROSTER OF REGISTERED PHOTOGRAPHERS</span>
            </div>
            <h1 className={`mt-1 font-sans text-2xl font-bold tracking-tight sm:text-3xl ${isLight ? 'text-stone-900' : 'text-white'}`}>
              Photographer Registry
            </h1>
            <p className={`mt-1 text-xs ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
              Explore monochrome artists, review verified portfolios, or transfer project folders directly to any member.
            </p>
          </div>

          {!currentUser && (
            <button
              onClick={() => setAuthModal('signup')}
              className="rounded-xl bg-[#ff6b00] px-4 py-2 font-mono-code text-xs font-bold uppercase text-black hover:bg-[#e05e00] shadow-md shadow-[#ff6b00]/25"
            >
              Claim Unique Username
            </button>
          )}
        </div>
      </div>

      {/* Grid of Photographers */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users.map(photographer => {
          const userProjects = projects.filter(p => p.userId === photographer.id);
          const userPhotos = photos.filter(p => p.userId === photographer.id);
          const isCurrent = currentUser?.id === photographer.id;

          return (
            <div
              key={photographer.id}
              className={`group rounded-2xl border p-6 transition-all duration-300 flex flex-col justify-between ${
                isLight
                  ? 'border-amber-200 bg-white/95 hover:border-amber-400 shadow-sm'
                  : 'border-orange-500/20 bg-[#140b07] hover:border-orange-500/40'
              }`}
            >
              <div>
                {/* Avatar & Header */}
                <div className="flex items-start gap-4">
                  <img
                    src={photographer.avatar}
                    alt={`@${photographer.username}`}
                    className={`h-14 w-14 rounded-xl grayscale object-cover ring-1 ${
                      isLight ? 'ring-amber-200' : 'ring-orange-500/30'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className={`font-mono-code text-base font-bold ${
                        isLight ? 'text-stone-900' : 'text-white'
                      }`}>
                        @{photographer.username}
                      </h3>
                      <span title="Verified Unique Handle">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#ff6b00]" />
                      </span>
                    </div>
                    <p className={`font-mono-code text-xs ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>
                      Verified Member
                    </p>
                    {isCurrent && (
                      <span className="mt-1 inline-block bg-[#ff6b00] text-black font-mono-code text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                        Current Session
                      </span>
                    )}
                  </div>
                </div>

                {/* Location & Bio */}
                <div className="mt-4">
                  {photographer.location && (
                    <div className={`flex items-center gap-1 font-mono-code text-[11px] mb-2 ${
                      isLight ? 'text-stone-500' : 'text-neutral-400'
                    }`}>
                      <MapPin className="h-3 w-3 text-[#ff6b00]" />
                      <span>{photographer.location}</span>
                    </div>
                  )}
                  <p className={`font-sans text-xs leading-relaxed line-clamp-3 ${
                    isLight ? 'text-stone-600' : 'text-neutral-300'
                  }`}>
                    {photographer.bio}
                  </p>
                </div>

                {/* Stat pills */}
                <div className={`mt-4 grid grid-cols-2 gap-2 border-t pt-3 font-mono-code text-xs ${
                  isLight ? 'border-amber-100' : 'border-orange-500/20'
                }`}>
                  <div>
                    <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>Albums</span>
                    <span className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>{userProjects.length} Projects</span>
                  </div>
                  <div>
                    <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>Negatives</span>
                    <span className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>{userPhotos.length} Works</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className={`mt-6 flex items-center gap-2 border-t pt-4 ${
                isLight ? 'border-amber-100' : 'border-orange-500/20'
              }`}>
                <button
                  onClick={() => {
                    setSelectedPhotographer(photographer);
                    setActiveTab('projects');
                  }}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 font-mono-code text-xs font-semibold transition-colors ${
                    isLight
                      ? 'border-amber-300 bg-amber-50 text-stone-800 hover:bg-amber-100'
                      : 'border-orange-500/30 bg-[#1c0f0a] text-neutral-200 hover:border-[#ff6b00] hover:text-[#ff6b00]'
                  }`}
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span>View Portfolio</span>
                </button>

                {currentUser && !isCurrent && (
                  <button
                    onClick={() => {
                      setIsTransferModalOpen(true);
                    }}
                    title={`Send files to @${photographer.username}`}
                    className="flex items-center justify-center rounded-xl bg-[#ff6b00] px-3.5 py-2.5 text-black hover:bg-[#e05e00] shadow-md shadow-[#ff6b00]/25 transition-all"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
