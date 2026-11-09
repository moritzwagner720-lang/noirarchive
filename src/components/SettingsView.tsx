import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { THEMES } from '../utils/themes';
import { ThemeId, GroupPrivacySetting } from '../types';
import { UserAvatar } from './UserAvatar';
import {
  Palette,
  Shield,
  User as UserIcon,
  Check,
  Sparkles,
  Users,
  Lock,
  LogOut,
  Layers,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    selectedTheme,
    setThemeAction,
    groupPrivacy,
    setGroupPrivacyAction,
    signOut,
    groups,
  } = useApp();

  const [activeSection, setActiveSection] = useState<'appearance' | 'privacy' | 'account'>('appearance');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  if (!currentUser) return null;

  const handleSelectTheme = async (themeId: ThemeId) => {
    await setThemeAction(themeId);
    setSaveSuccessMsg(`Theme updated to ${THEMES.find(t => t.id === themeId)?.name}!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleSelectPrivacy = async (setting: GroupPrivacySetting) => {
    await setGroupPrivacyAction(setting);
    setSaveSuccessMsg(`Group invitation setting updated: ${setting === 'everyone' ? 'Everyone' : setting === 'friends' ? 'Friends only' : 'Nobody'}`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const standardThemes = THEMES.filter(t => t.type === 'standard');
  const seasonalThemes = THEMES.filter(t => t.type === 'seasonal');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-5 border-[#383a40]">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
            />
            <span className="font-mono-code text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              USER PREFERENCES & VAULT SETTINGS
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Account Settings
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Personalize your theme, control group invitation privacy, and manage your account.
          </p>
        </div>

        {saveSuccessMsg && (
          <div className="mt-3 sm:mt-0 flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1.5 text-xs text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Side: Discord-style Settings Sidebar */}
        <div className="md:col-span-3 space-y-1">
          <button
            onClick={() => setActiveSection('appearance')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all text-left ${
              activeSection === 'appearance'
                ? 'bg-[#313338] text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#2b2d31]'
            }`}
          >
            <Palette className="h-4 w-4" style={{ color: activeSection === 'appearance' ? 'var(--color-accent)' : undefined }} />
            <span>Appearance</span>
          </button>

          <button
            onClick={() => setActiveSection('privacy')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all text-left ${
              activeSection === 'privacy'
                ? 'bg-[#313338] text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#2b2d31]'
            }`}
          >
            <Shield className="h-4 w-4" style={{ color: activeSection === 'privacy' ? 'var(--color-accent)' : undefined }} />
            <span>Privacy & Groups</span>
          </button>

          <button
            onClick={() => setActiveSection('account')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all text-left ${
              activeSection === 'account'
                ? 'bg-[#313338] text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#2b2d31]'
            }`}
          >
            <UserIcon className="h-4 w-4" style={{ color: activeSection === 'account' ? 'var(--color-accent)' : undefined }} />
            <span>My Account</span>
          </button>

          <div className="pt-4 border-t border-[#383a40]">
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Right Side: Content Area */}
        <div className="md:col-span-9 space-y-8">
          {/* 1. APPEARANCE SECTION */}
          {activeSection === 'appearance' && (
            <div className="space-y-8 animate-in fade-in">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Palette className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
                  Appearance & Themes
                </h2>
                <p className="mt-1 text-xs text-neutral-400">
                  Select a theme to customize Noir Archive. Changes apply instantly and synchronize with your account.
                </p>
              </div>

              {/* Standard Themes (10 Options) */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono-code text-[11px] uppercase tracking-wider font-bold text-neutral-300">
                    Standard Color Themes (10 Themes)
                  </span>
                  <span className="font-mono-code text-[10px] text-neutral-500">
                    Default: Graphite
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {standardThemes.map(t => {
                    const isSelected = selectedTheme === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleSelectTheme(t.id)}
                        className={`group relative rounded-2xl border p-4 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'ring-2 ring-offset-2 ring-offset-[#1e1f22] border-transparent shadow-lg'
                            : 'border-[#383a40] hover:border-[#4e5058] bg-[#2b2d31]'
                        }`}
                        style={{
                          backgroundColor: isSelected ? t.bgSurface : undefined,
                          borderColor: isSelected ? t.accentHex : undefined,
                          boxShadow: isSelected ? `0 8px 24px ${t.accentHex}25` : undefined,
                        }}
                      >
                        {/* Theme Palette Preview Visualizer */}
                        <div
                          className="h-16 w-full rounded-xl overflow-hidden border border-white/10 flex p-2 gap-2 shadow-inner"
                          style={{ backgroundColor: t.bgBase }}
                        >
                          <div
                            className="w-1/3 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                            style={{ backgroundColor: t.bgSurface }}
                          >
                            <span className="opacity-80">UI</span>
                          </div>
                          <div
                            className="w-1/3 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                            style={{ backgroundColor: t.bgElevated }}
                          >
                            <span className="opacity-80">Card</span>
                          </div>
                          <div
                            className="w-1/3 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-md"
                            style={{ backgroundColor: t.accentHex, color: t.accentText }}
                          >
                            <span>Act</span>
                          </div>
                        </div>

                        {/* Theme Name & Description */}
                        <div className="mt-3 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm"
                                style={{ backgroundColor: t.accentHex }}
                              />
                              <h3 className="font-sans text-sm font-bold text-white">
                                {t.name}
                              </h3>
                            </div>
                            <p className="mt-1 text-[11px] text-neutral-400 line-clamp-2">
                              {t.description}
                            </p>
                          </div>

                          <div
                            className={`h-5 w-5 rounded-full flex items-center justify-center border shrink-0 ml-2 transition-all ${
                              isSelected
                                ? 'bg-white text-black font-bold border-transparent shadow-sm'
                                : 'border-[#383a40] group-hover:border-neutral-400'
                            }`}
                            style={{
                              backgroundColor: isSelected ? t.accentHex : undefined,
                              color: isSelected ? t.accentText : undefined,
                            }}
                          >
                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optional Seasonal Themes */}
              <div className="pt-4 border-t border-[#383a40]">
                <div className="mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <span className="font-mono-code text-[11px] uppercase tracking-wider font-bold text-neutral-300">
                      Seasonal Themes (Optional)
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Seasonal themes are completely optional and never activate automatically.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  {seasonalThemes.map(t => {
                    const isSelected = selectedTheme === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleSelectTheme(t.id)}
                        className={`group relative rounded-2xl border p-4 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'ring-2 ring-offset-2 ring-offset-[#1e1f22] border-transparent shadow-lg'
                            : 'border-[#383a40] hover:border-[#4e5058] bg-[#2b2d31]'
                        }`}
                        style={{
                          backgroundColor: isSelected ? t.bgSurface : undefined,
                          borderColor: isSelected ? t.accentHex : undefined,
                          boxShadow: isSelected ? `0 8px 24px ${t.accentHex}25` : undefined,
                        }}
                      >
                        <div
                          className="h-16 w-full rounded-xl overflow-hidden border border-white/10 flex p-2 gap-2 shadow-inner"
                          style={{ backgroundColor: t.bgBase }}
                        >
                          <div
                            className="w-1/3 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                            style={{ backgroundColor: t.bgSurface }}
                          >
                            <span className="opacity-80">Pine</span>
                          </div>
                          <div
                            className="w-1/3 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                            style={{ backgroundColor: t.bgElevated }}
                          >
                            <span className="opacity-80">Trim</span>
                          </div>
                          <div
                            className="w-1/3 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-md"
                            style={{ backgroundColor: t.accentHex, color: t.accentText }}
                          >
                            <span>Festive</span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm"
                                style={{ backgroundColor: t.accentHex }}
                              />
                              <h3 className="font-sans text-sm font-bold text-white">
                                {t.name}
                              </h3>
                            </div>
                            <p className="mt-1 text-[11px] text-neutral-400">
                              {t.description}
                            </p>
                          </div>

                          <div
                            className={`h-5 w-5 rounded-full flex items-center justify-center border shrink-0 ml-2 transition-all ${
                              isSelected
                                ? 'bg-white text-black font-bold border-transparent'
                                : 'border-[#383a40] group-hover:border-neutral-400'
                            }`}
                            style={{
                              backgroundColor: isSelected ? t.accentHex : undefined,
                              color: isSelected ? t.accentText : undefined,
                            }}
                          >
                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2. PRIVACY & GROUP INVITATION SETTINGS */}
          {activeSection === 'privacy' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Shield className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
                  Group Invitation Privacy Setting
                </h2>
                <p className="mt-1 text-xs text-neutral-400">
                  Control who is allowed to add your account (@{currentUser.username}) to friend groups.
                </p>
              </div>

              {/* Requirement 5: "Who can add me to groups?" */}
              <div className="rounded-2xl border border-[#383a40] bg-[#2b2d31] p-6 space-y-4 shadow-sm">
                <div className="border-b border-[#383a40] pb-3">
                  <h3 className="font-sans text-sm font-bold text-white">
                    Who can add me to groups?
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Choose who can organize you into their friend groups for group file sharing.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Option 1: Everyone */}
                  <label
                    onClick={() => handleSelectPrivacy('everyone')}
                    className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      groupPrivacy === 'everyone'
                        ? 'border-[var(--color-accent)] bg-[#313338] text-white shadow-sm'
                        : 'border-[#383a40] hover:border-[#4e5058] bg-[#232428] text-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="groupPrivacy"
                      value="everyone"
                      checked={groupPrivacy === 'everyone'}
                      onChange={() => handleSelectPrivacy('everyone')}
                      className="mt-1 accent-[var(--color-accent)]"
                    />
                    <div>
                      <span className="block font-sans text-xs font-bold text-white">
                        Everyone
                      </span>
                      <span className="block text-[11px] text-neutral-400 mt-0.5">
                        Any permitted user on Noir Archive can add your account to their groups.
                      </span>
                    </div>
                  </label>

                  {/* Option 2: Friends only */}
                  <label
                    onClick={() => handleSelectPrivacy('friends')}
                    className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      groupPrivacy === 'friends'
                        ? 'border-[var(--color-accent)] bg-[#313338] text-white shadow-sm'
                        : 'border-[#383a40] hover:border-[#4e5058] bg-[#232428] text-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="groupPrivacy"
                      value="friends"
                      checked={groupPrivacy === 'friends'}
                      onChange={() => handleSelectPrivacy('friends')}
                      className="mt-1 accent-[var(--color-accent)]"
                    />
                    <div>
                      <span className="block font-sans text-xs font-bold text-white">
                        Friends only
                      </span>
                      <span className="block text-[11px] text-neutral-400 mt-0.5">
                        Only users currently in your friends list can add you to their groups. (Default)
                      </span>
                    </div>
                  </label>

                  {/* Option 3: Nobody */}
                  <label
                    onClick={() => handleSelectPrivacy('nobody')}
                    className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      groupPrivacy === 'nobody'
                        ? 'border-[var(--color-accent)] bg-[#313338] text-white shadow-sm'
                        : 'border-[#383a40] hover:border-[#4e5058] bg-[#232428] text-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="groupPrivacy"
                      value="nobody"
                      checked={groupPrivacy === 'nobody'}
                      onChange={() => handleSelectPrivacy('nobody')}
                      className="mt-1 accent-[var(--color-accent)]"
                    />
                    <div>
                      <span className="block font-sans text-xs font-bold text-white">
                        Nobody
                      </span>
                      <span className="block text-[11px] text-neutral-400 mt-0.5">
                        Other users cannot add your account to groups. If anyone tries, the system prevents the action and shows a clear message.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="pt-2 text-[11px] text-neutral-400 flex items-center gap-1.5 font-mono-code">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Existing group memberships remain intact when changing this setting.</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. MY ACCOUNT SECTION */}
          {activeSection === 'account' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserIcon className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
                  Account Overview
                </h2>
                <p className="mt-1 text-xs text-neutral-400">
                  Your credentials and registered identity on the Noir Archive platform.
                </p>
              </div>

              {/* Profile Card with Letter-Based Avatar */}
              <div className="rounded-2xl border border-[#383a40] bg-[#2b2d31] p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <UserAvatar username={currentUser.username} size="2xl" showStatus={true} status="online" />
                  <div>
                    <h3 className="text-xl font-extrabold text-white">
                      @{currentUser.username}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {currentUser.bio || 'Noir Archive file sharing member.'}
                    </p>
                    <div className="mt-2 flex items-center gap-3 font-mono-code text-[11px] text-neutral-400">
                      <span>Friends: <strong className="text-white">{currentUser.friends?.length || 0}</strong></span>
                      <span>•</span>
                      <span>Groups: <strong className="text-white">{groups.length}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#383a40] font-mono-code text-xs">
                  <div className="rounded-xl bg-[#232428] border border-[#383a40] p-3">
                    <span className="block text-[10px] uppercase text-neutral-400">Account ID</span>
                    <span className="text-white font-semibold">{currentUser.id}</span>
                  </div>
                  <div className="rounded-xl bg-[#232428] border border-[#383a40] p-3">
                    <span className="block text-[10px] uppercase text-neutral-400">Member Since</span>
                    <span className="text-white font-semibold">
                      {new Date(currentUser.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={signOut}
                    className="flex items-center gap-2 rounded-xl bg-rose-500/15 border border-rose-500/30 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 transition-all"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out from Device</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
