import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Camera,
  FolderOpen,
  Send,
  Users,
  Grid,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Globe,
  Upload,
  Palette,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    setSelectedPhotographer,
    setSelectedProject,
    theme,
    toggleTheme,
    searchQuery,
    setSearchQuery,
    setAuthModal,
    signOut,
    users,
    switchUserQuick,
    setIsTransferModalOpen,
    setIsPublishModalOpen,
    setIsAvatarModalOpen,
    friendRequests,
    publishedPackages,
  } = useApp();


  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const pendingCount = friendRequests.filter(
    r => currentUser && r.toUsername.toLowerCase() === currentUser.username.toLowerCase() && r.status === 'pending'
  ).length;

  const isLight = theme === 'light';

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-200 ${
        isLight
          ? 'bg-[#fcf8f5]/95 border-amber-200/80 text-stone-900 shadow-sm'
          : 'bg-[#090503]/95 border-orange-500/20 text-white shadow-[0_4px_25px_rgba(0,0,0,0.8)]'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand / Logo (Halloween themed insignia matching screenshot 1) */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              setActiveTab('explore');
              setSelectedPhotographer(null);
              setSelectedProject(null);
            }}
            className="group flex flex-col text-left focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#ff6b00] text-black font-black text-xs shadow-md shadow-orange-950/60 transition-transform group-hover:scale-110">
                ✦
              </span>
              <span className={`font-sans text-lg font-black tracking-wider ${isLight ? 'text-stone-900' : 'text-white'}`}>
                NOIR ARCHIVE
              </span>
            </div>
            <span className="text-[10px] font-mono-code tracking-widest text-[#ff6b00] font-semibold">
              HALLOWEEN VAULT · NOCTURNAL EDITION
            </span>
          </button>

          {/* Navigation Links */}
          <nav className="hidden items-center gap-1.5 md:flex">
            <button
              onClick={() => {
                setActiveTab('explore');
                setSelectedPhotographer(null);
                setSelectedProject(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'explore'
                  ? 'bg-[#ff6b00] text-black shadow-sm'
                  : isLight
                  ? 'text-stone-600 hover:text-stone-900 hover:bg-amber-100/70'
                  : 'text-neutral-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Grid className="h-3.5 w-3.5" />
                Gallery
              </span>
            </button>

            {/* Published Files Tab with counter */}
            <button
              onClick={() => {
                setActiveTab('published');
              }}
              className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'published'
                  ? 'bg-[#ff6b00] text-black shadow-sm'
                  : isLight
                  ? 'text-stone-600 hover:text-stone-900 hover:bg-amber-100/70'
                  : 'text-neutral-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                Public Downloads
                <span
                  className={`ml-1 text-[10px] font-mono-code px-1.5 py-0.2 rounded-full ${
                    activeTab === 'published'
                      ? 'bg-black/25 text-black font-bold'
                      : isLight
                      ? 'bg-amber-100 border border-amber-300 text-stone-700'
                      : 'bg-orange-950/60 border border-orange-500/30 text-orange-300'
                  }`}
                >
                  {publishedPackages.length}
                </span>
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('projects');
                setSelectedProject(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'projects'
                  ? 'bg-[#ff6b00] text-black shadow-sm'
                  : isLight
                  ? 'text-stone-600 hover:text-stone-900 hover:bg-amber-100/70'
                  : 'text-neutral-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <FolderOpen className="h-3.5 w-3.5" />
                Projects
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('friends');
              }}
              className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'friends'
                  ? 'bg-[#ff6b00] text-black shadow-sm'
                  : isLight
                  ? 'text-stone-600 hover:text-stone-900 hover:bg-amber-100/70'
                  : 'text-neutral-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Friends & Chat
                {pendingCount > 0 && (
                  <span className="ml-1 h-4 w-4 rounded-full bg-orange-600 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('transfers');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'transfers'
                  ? 'bg-[#ff6b00] text-black shadow-sm'
                  : isLight
                  ? 'text-stone-600 hover:text-stone-900 hover:bg-amber-100/70'
                  : 'text-neutral-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5" />
                Transfers
              </span>
            </button>

            {currentUser && (
              <button
                onClick={() => {
                  setActiveTab('manage');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'manage'
                    ? 'bg-[#ff6b00] text-black shadow-sm'
                    : isLight
                    ? 'text-stone-600 hover:text-stone-900 hover:bg-amber-100/70'
                    : 'text-neutral-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5" />
                  Studio
                </span>
              </button>
            )}
          </nav>
        </div>

        {/* Search, Theme Pill Switch & User Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="relative hidden lg:block">
            <Search className={`absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${isLight ? 'text-amber-600/70' : 'text-orange-400/60'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Search portfolios and files"
              placeholder="Search vault..."
              className={`w-44 rounded-lg border py-1.5 pl-8 pr-3 font-mono-code text-xs transition-all focus:w-60 focus:border-[#ff6b00] focus:outline-none ${
                isLight
                  ? 'border-amber-300 bg-white text-stone-900 placeholder:text-stone-400 shadow-inner'
                  : 'border-orange-500/30 bg-[#160d09] text-orange-100 placeholder:text-neutral-500'
              }`}
            />
          </div>

          {/* Interactive Light / Dark Mode Toggle Switch */}
          <div
            onClick={toggleTheme}
            role="button"
            tabIndex={0}
            title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
            className={`flex items-center p-1 rounded-full border cursor-pointer select-none transition-all shadow-sm ${
              isLight ? 'border-amber-300 bg-amber-100/70' : 'border-orange-500/30 bg-[#170e0a]'
            }`}
          >
            <div
              className={`flex items-center justify-center h-6 w-6 rounded-full transition-all duration-200 ${
                isLight
                  ? 'bg-amber-400 text-stone-900 shadow-sm font-bold scale-110'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
            </div>
            <div
              className={`flex items-center justify-center h-6 w-6 rounded-full transition-all duration-200 ${
                !isLight
                  ? 'bg-[#ff6b00] text-black shadow-sm font-bold scale-110'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Primary Action Button: Publish Files */}
          <button
            onClick={() => {
              if (!currentUser) {
                setAuthModal('signin');
              } else {
                setIsPublishModalOpen(true);
              }
            }}
            className="hidden items-center gap-1.5 rounded-lg bg-[#ff6b00] px-4 py-1.5 text-xs font-bold text-black shadow-md shadow-orange-950/50 hover:bg-[#ff7d1f] hover:scale-105 active:scale-95 transition-all sm:flex"
          >
            <Upload className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Publish Files</span>
          </button>

          {/* Account Dropdown */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-left transition-colors ${
                  isLight
                    ? 'border-amber-300 bg-amber-50 hover:bg-amber-100/80 text-stone-900 shadow-sm'
                    : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700 text-white'
                }`}
              >
                <div className="relative">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.username}
                    className="h-6 w-6 rounded-full object-cover ring-1 ring-orange-500/50"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#ff6b00] ring-1 ring-black" />
                </div>
                <div className="hidden text-left sm:block">
                  <div className={`font-mono-code text-[11px] font-semibold ${isLight ? 'text-stone-800' : 'text-orange-200'}`}>
                    @{currentUser.username}
                  </div>
                </div>
              </button>

              {/* User Dropdown */}
              {showUserDropdown && (
                <div
                  className={`absolute right-0 mt-2 w-64 rounded-2xl border p-4 shadow-2xl z-50 animate-in fade-in transition-colors ${
                    isLight
                      ? 'bg-white border-amber-200 text-stone-900 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)]'
                      : 'bg-[#150c08] border-orange-500/30 text-white shadow-[0_10px_40px_-10px_rgba(255,107,0,0.25)]'
                  }`}
                >
                  <div className="border-b pb-3 border-orange-500/20">
                    <p className="font-mono-code text-xs font-bold text-[#ff6b00]">@{currentUser.username}</p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-500 font-mono-code">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Password Secured • 1-of-1 Claim</span>
                    </div>
                  </div>

                  <div className="py-2 space-y-1">
                    <button
                      onClick={() => {
                        setIsPublishModalOpen(true);
                        setShowUserDropdown(false);
                      }}
                      className={`flex w-full items-center justify-between py-1.5 px-2 rounded-lg text-xs font-semibold ${
                        isLight
                          ? 'text-[#ff6b00] hover:bg-orange-50'
                          : 'text-[#ff6b00] hover:bg-orange-500/10'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Upload className="h-3.5 w-3.5" />
                        Publish Files
                      </span>
                      <ArrowRight className="h-3 w-3" />
                    </button>

                    <button
                      onClick={() => {
                        setIsAvatarModalOpen(true);
                        setShowUserDropdown(false);
                      }}
                      className={`flex w-full items-center justify-between py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors ${
                        isLight
                          ? 'text-stone-700 hover:text-stone-950 hover:bg-amber-50'
                          : 'text-neutral-300 hover:text-white hover:bg-orange-500/10'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Palette className="h-3.5 w-3.5 text-blue-500" />
                        Switch Profile Picture
                      </span>
                      <ArrowRight className="h-3 w-3" />
                    </button>


                    <button
                      onClick={() => {
                        setActiveTab('published');
                        setShowUserDropdown(false);
                      }}
                      className={`flex w-full items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors ${
                        isLight
                          ? 'text-stone-700 hover:text-stone-950 hover:bg-amber-50'
                          : 'text-neutral-300 hover:text-white hover:bg-orange-500/10'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-orange-500" />
                        Community Downloads
                      </span>
                      <ArrowRight className="h-3 w-3" />
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('friends');
                        setShowUserDropdown(false);
                      }}
                      className={`flex w-full items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors ${
                        isLight
                          ? 'text-stone-700 hover:text-stone-950 hover:bg-amber-50'
                          : 'text-neutral-300 hover:text-white hover:bg-orange-500/10'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-orange-500" />
                        Friends & Chat
                      </span>
                      <ArrowRight className="h-3 w-3" />
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('manage');
                        setShowUserDropdown(false);
                      }}
                      className={`flex w-full items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors ${
                        isLight
                          ? 'text-stone-700 hover:text-stone-950 hover:bg-amber-50'
                          : 'text-neutral-300 hover:text-white hover:bg-orange-500/10'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Camera className="h-3.5 w-3.5 text-orange-500" />
                        Project Studio
                      </span>
                      <ArrowRight className="h-3 w-3" />
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('transfers');
                        setShowUserDropdown(false);
                      }}
                      className={`flex w-full items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors ${
                        isLight
                          ? 'text-stone-700 hover:text-stone-950 hover:bg-amber-50'
                          : 'text-neutral-300 hover:text-white hover:bg-orange-500/10'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Send className="h-3.5 w-3.5 text-orange-500" />
                        Transfers Hub
                      </span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="mt-3 border-t pt-2 border-orange-500/20">
                    <button
                      onClick={() => {
                        signOut();
                        setShowUserDropdown(false);
                      }}
                      className="flex w-full items-center gap-2 text-xs text-rose-400 hover:text-rose-300 py-1"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuthModal('signin')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isLight ? 'text-stone-700 hover:text-stone-900' : 'text-neutral-300 hover:text-white'
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => setAuthModal('signup')}
                className="rounded-lg bg-[#ff6b00] px-4 py-1.5 text-xs font-bold text-black hover:bg-[#ff7d1f] transition-colors shadow-sm"
              >
                Join
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Submenu Bar */}
      <div
        className={`flex items-center justify-around border-t px-2 py-2 md:hidden text-[11px] font-medium uppercase tracking-wider ${
          isLight ? 'bg-[#fcf8f5] border-amber-200 text-stone-800' : 'bg-[#100906] border-orange-500/20 text-neutral-300'
        }`}
      >
        <button
          onClick={() => {
            setActiveTab('explore');
            setSelectedPhotographer(null);
            setSelectedProject(null);
          }}
          className={activeTab === 'explore' ? 'text-[#ff6b00] font-bold' : 'opacity-70'}
        >
          Gallery
        </button>

        <button
          onClick={() => setActiveTab('published')}
          className={activeTab === 'published' ? 'text-[#ff6b00] font-bold' : 'opacity-70'}
        >
          Downloads ({publishedPackages.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('projects');
            setSelectedProject(null);
          }}
          className={activeTab === 'projects' ? 'text-[#ff6b00] font-bold' : 'opacity-70'}
        >
          Projects
        </button>

        <button
          onClick={() => setActiveTab('friends')}
          className={`flex items-center gap-1 ${activeTab === 'friends' ? 'text-[#ff6b00] font-bold' : 'opacity-70'}`}
        >
          Friends
          {pendingCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />}
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={activeTab === 'transfers' ? 'text-[#ff6b00] font-bold' : 'opacity-70'}
        >
          Transfers
        </button>
      </div>
    </header>
  );
};
