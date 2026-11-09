import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './UserAvatar';
import { NoirArchiveLogo } from './NoirArchiveLogo';
import {
  Send,
  Users,
  Globe,
  Settings,
  LogOut,
  Upload,
  Search,
  Shield,
  Palette,
  Camera,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    setAuthModal,
    signOut,
    setIsTransferModalOpen,
    setIsAvatarEditorOpen,
    friendRequests,
    publishedPackages,
  } = useApp();

  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const pendingCount = friendRequests.filter(
    r => currentUser && r.toUsername.toLowerCase() === currentUser.username.toLowerCase() && r.status === 'pending'
  ).length;

  return (
    <header className="sticky top-0 z-40 border-b border-[#383a40] bg-[#1e1f22]/95 backdrop-blur-md text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('transfers')}
            className="group flex items-center text-left focus:outline-none cursor-pointer"
          >
            <NoirArchiveLogo size="sm" />
          </button>

          {/* Navigation Links */}
          <nav className="hidden items-center gap-1.5 md:flex">
            <button
              onClick={() => setActiveTab('transfers')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'transfers'
                  ? 'bg-[#313338] text-white shadow-sm border border-[var(--color-accent)]'
                  : 'text-neutral-400 hover:text-white hover:bg-[#2b2d31]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5" style={{ color: activeTab === 'transfers' ? 'var(--color-accent)' : undefined }} />
                Transfers
              </span>
            </button>

            <button
              onClick={() => setActiveTab('friends')}
              className={`relative px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'friends'
                  ? 'bg-[#313338] text-white shadow-sm border border-[var(--color-accent)]'
                  : 'text-neutral-400 hover:text-white hover:bg-[#2b2d31]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" style={{ color: activeTab === 'friends' ? 'var(--color-accent)' : undefined }} />
                Friends & Groups
                {pendingCount > 0 && (
                  <span className="ml-1 h-4 w-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('published')}
              className={`relative px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'published'
                  ? 'bg-[#313338] text-white shadow-sm border border-[var(--color-accent)]'
                  : 'text-neutral-400 hover:text-white hover:bg-[#2b2d31]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" style={{ color: activeTab === 'published' ? 'var(--color-accent)' : undefined }} />
                Shared Vault
                <span className="ml-1 text-[10px] font-mono-code px-1.5 py-0.2 rounded-full bg-[#313338] text-neutral-300">
                  {publishedPackages.length}
                </span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#313338] text-white shadow-sm border border-[var(--color-accent)]'
                  : 'text-neutral-400 hover:text-white hover:bg-[#2b2d31]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Settings className="h-3.5 w-3.5" style={{ color: activeTab === 'settings' ? 'var(--color-accent)' : undefined }} />
                Settings
              </span>
            </button>
          </nav>
        </div>

        {/* Right Side: Search, New Transfer, Profile Avatar */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search packages..."
              className="w-40 rounded-xl border border-[#383a40] bg-[#1e1f22] py-1.5 pl-8 pr-3 font-mono-code text-xs text-white placeholder:text-neutral-500 transition-all focus:w-56 focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>

          {/* Send Transfer Button */}
          <button
            onClick={() => {
              if (!currentUser) {
                setAuthModal('signin');
              } else {
                setIsTransferModalOpen(true);
              }
            }}
            className="flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold text-white shadow-md transition-all active:scale-95 cursor-pointer"
            style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
          >
            <Upload className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Send Transfer</span>
          </button>

          {/* Account Profile Button with Letter Avatar */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 rounded-xl border border-[#383a40] bg-[#2b2d31] hover:bg-[#313338] px-2.5 py-1 text-left transition-colors cursor-pointer"
              >
                <UserAvatar
                  username={currentUser.username}
                  avatarUrl={currentUser.customAvatar || currentUser.avatar}
                  size="xs"
                  showStatus={true}
                  status="online"
                />
                <span className="hidden sm:inline font-mono-code text-xs font-semibold text-white">
                  @{currentUser.username}
                </span>
              </button>

              {/* User Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#383a40] bg-[#2b2d31] p-3 shadow-2xl z-50 animate-in fade-in space-y-2">
                  <div className="border-b border-[#383a40] pb-2 px-1">
                    <p className="font-mono-code text-xs font-bold text-white">
                      @{currentUser.username}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {currentUser.bio || 'Noir Archive member'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setIsAvatarEditorOpen(true);
                        setShowUserDropdown(false);
                      }}
                      className="flex w-full items-center gap-2 py-1.5 px-2 rounded-xl text-xs text-neutral-200 hover:bg-[#313338] transition-colors cursor-pointer"
                    >
                      <Camera className="h-4 w-4 text-indigo-400" />
                      <span>Customize Profile Picture</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setShowUserDropdown(false);
                      }}
                      className="flex w-full items-center gap-2 py-1.5 px-2 rounded-xl text-xs text-neutral-200 hover:bg-[#313338] transition-colors"
                    >
                      <Palette className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
                      <span>Appearance & Themes</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setShowUserDropdown(false);
                      }}
                      className="flex w-full items-center gap-2 py-1.5 px-2 rounded-xl text-xs text-neutral-200 hover:bg-[#313338] transition-colors"
                    >
                      <Shield className="h-4 w-4 text-emerald-400" />
                      <span>Group Privacy Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('friends');
                        setShowUserDropdown(false);
                      }}
                      className="flex w-full items-center gap-2 py-1.5 px-2 rounded-xl text-xs text-neutral-200 hover:bg-[#313338] transition-colors"
                    >
                      <Users className="h-4 w-4 text-amber-400" />
                      <span>Friends & Groups</span>
                    </button>
                  </div>

                  <div className="border-t border-[#383a40] pt-2">
                    <button
                      onClick={() => {
                        signOut();
                        setShowUserDropdown(false);
                      }}
                      className="flex w-full items-center gap-2 py-1.5 px-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuthModal('signin')}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Log In
              </button>
              <button
                onClick={() => setAuthModal('signup')}
                className="rounded-xl px-4 py-1.5 text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
              >
                Join
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Submenu Bar */}
      <div className="flex items-center justify-around border-t border-[#383a40] px-2 py-2 md:hidden text-[11px] font-medium bg-[#1e1f22]">
        <button
          onClick={() => setActiveTab('transfers')}
          className={activeTab === 'transfers' ? 'font-bold' : 'text-neutral-400'}
          style={{ color: activeTab === 'transfers' ? 'var(--color-accent)' : undefined }}
        >
          Transfers
        </button>

        <button
          onClick={() => setActiveTab('friends')}
          className={`flex items-center gap-1 ${activeTab === 'friends' ? 'font-bold' : 'text-neutral-400'}`}
          style={{ color: activeTab === 'friends' ? 'var(--color-accent)' : undefined }}
        >
          Friends & Groups
          {pendingCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
        </button>

        <button
          onClick={() => setActiveTab('published')}
          className={activeTab === 'published' ? 'font-bold' : 'text-neutral-400'}
          style={{ color: activeTab === 'published' ? 'var(--color-accent)' : undefined }}
        >
          Vault ({publishedPackages.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={activeTab === 'settings' ? 'font-bold' : 'text-neutral-400'}
          style={{ color: activeTab === 'settings' ? 'var(--color-accent)' : undefined }}
        >
          Settings
        </button>
      </div>
    </header>
  );
};
