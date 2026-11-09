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
  Bell,
  HardDrive,
  Camera,
  RotateCcw,
  ShieldAlert,
  FileCheck,
  EyeOff,
  Clock,
  KeyRound,
  Save,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    selectedTheme,
    setThemeAction,
    seasonalEffectsEnabled,
    setSeasonalEffectsEnabled,
    groupPrivacy,
    setGroupPrivacyAction,
    updateUserSettingsAction,
    changePasswordAction,
    setIsAvatarEditorOpen,
    updateCustomAvatarAction,
    signOut,
    groups,
    transfers,
  } = useApp();

  const [activeSection, setActiveSection] = useState<'appearance' | 'privacy' | 'security' | 'notifications' | 'account'>('appearance');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile fields state
  const [displayName, setDisplayName] = useState(currentUser?.displayName || currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [location, setLocation] = useState(currentUser?.location || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!currentUser) return null;

  const userSettings = currentUser.settings || {};

  const showSuccess = (msg: string) => {
    setSaveSuccessMsg(msg);
    setErrorMsg(null);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const handleSelectTheme = async (themeId: ThemeId) => {
    await setThemeAction(themeId);
    showSuccess(`Theme updated to ${THEMES.find(t => t.id === themeId)?.name}!`);
  };

  const handleSelectPrivacy = async (setting: GroupPrivacySetting) => {
    await setGroupPrivacyAction(setting);
    showSuccess(`Group invitation setting updated: ${setting === 'everyone' ? 'Everyone' : setting === 'friends' ? 'Friends only' : 'Nobody'}`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await updateUserSettingsAction({}, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
      });
      if (res.success) {
        showSuccess('Profile details updated successfully.');
      } else {
        showError(res.error || 'Failed to update profile.');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showError('Please fill out all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      showError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changePasswordAction(currentPassword, newPassword);
      if (res.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showSuccess('Password updated successfully.');
      } else {
        showError(res.error || 'Failed to change password.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Storage Stats calculation
  const totalUserFiles = transfers
    .filter(t => t.senderId === currentUser.id)
    .reduce((acc, t) => acc + (t.files?.length || 0), 0);

  const totalUserTransfers = transfers.filter(t => t.senderId === currentUser.id).length;

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
            Account & System Settings
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Personalize your theme, customize your profile picture, control group privacy, and manage file sharing preferences.
          </p>
        </div>

        {saveSuccessMsg && (
          <div className="mt-3 sm:mt-0 flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1.5 text-xs text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-3 sm:mt-0 flex items-center gap-2 rounded-xl bg-rose-500/15 border border-rose-500/30 px-3.5 py-1.5 text-xs text-rose-400 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Side: Discord-style Settings Sidebar */}
        <div className="md:col-span-3 space-y-1">
          <button
            onClick={() => setActiveSection('appearance')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all text-left cursor-pointer ${
              activeSection === 'appearance'
                ? 'bg-[#313338] text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#2b2d31]'
            }`}
          >
            <Palette className="h-4 w-4" style={{ color: activeSection === 'appearance' ? 'var(--color-accent)' : undefined }} />
            <span>Appearance & Themes</span>
          </button>

          <button
            onClick={() => setActiveSection('privacy')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all text-left cursor-pointer ${
              activeSection === 'privacy'
                ? 'bg-[#313338] text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#2b2d31]'
            }`}
          >
            <Shield className="h-4 w-4" style={{ color: activeSection === 'privacy' ? 'var(--color-accent)' : undefined }} />
            <span>Privacy & Groups</span>
          </button>

          <button
            onClick={() => setActiveSection('security')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all text-left cursor-pointer ${
              activeSection === 'security'
                ? 'bg-[#313338] text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#2b2d31]'
            }`}
          >
            <Lock className="h-4 w-4" style={{ color: activeSection === 'security' ? 'var(--color-accent)' : undefined }} />
            <span>Security & File Sharing</span>
          </button>

          <button
            onClick={() => setActiveSection('notifications')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all text-left cursor-pointer ${
              activeSection === 'notifications'
                ? 'bg-[#313338] text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#2b2d31]'
            }`}
          >
            <Bell className="h-4 w-4" style={{ color: activeSection === 'notifications' ? 'var(--color-accent)' : undefined }} />
            <span>Notifications & Audio</span>
          </button>

          <button
            onClick={() => setActiveSection('account')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all text-left cursor-pointer ${
              activeSection === 'account'
                ? 'bg-[#313338] text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#2b2d31]'
            }`}
          >
            <UserIcon className="h-4 w-4" style={{ color: activeSection === 'account' ? 'var(--color-accent)' : undefined }} />
            <span>My Account & Identity</span>
          </button>

          <div className="pt-4 border-t border-[#383a40]">
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
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

              {/* Optional Seasonal Themes & Particle Engine */}
              <div className="pt-4 border-t border-[#383a40]">
                <div className="mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <span className="font-mono-code text-[11px] uppercase tracking-wider font-bold text-neutral-300">
                      Seasonal Themes (Optional)
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Seasonal themes provide atmospheric backgrounds (snow or Halloween mist). They are completely optional and never activate automatically.
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
                            <span className="opacity-80">Atmosphere</span>
                          </div>
                          <div
                            className="w-1/3 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                            style={{ backgroundColor: t.bgElevated }}
                          >
                            <span className="opacity-80">Glow</span>
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

                {/* Animated Particles Toggle */}
                <div className="mt-5 p-4 rounded-2xl border border-[#383a40] bg-[#2b2d31] flex items-center justify-between">
                  <div>
                    <h4 className="font-sans text-xs font-bold text-white">
                      Animated Atmospheric Particles
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Renders falling snowflakes for Christmas theme or rising mist & embers for Halloween theme.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seasonalEffectsEnabled}
                      onChange={e => {
                        setSeasonalEffectsEnabled(e.target.checked);
                        showSuccess(e.target.checked ? 'Atmospheric particles enabled.' : 'Atmospheric particles disabled.');
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#1e1f22] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent,#5865f2)] border border-[#383a40]"></div>
                  </label>
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
                  Privacy & Group Access Controls
                </h2>
                <p className="mt-1 text-xs text-neutral-400">
                  Control who is allowed to add your account (@{currentUser.username}) to friend groups and view your public profile.
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

              {/* Public Visibility Setting */}
              <div className="rounded-2xl border border-[#383a40] bg-[#2b2d31] p-6 space-y-4 shadow-sm">
                <div className="border-b border-[#383a40] pb-3">
                  <h3 className="font-sans text-sm font-bold text-white">
                    Public Profile Visibility
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Choose who can view your profile and public uploads.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'everyone', label: 'Everyone', desc: 'Visible to public and web visitors' },
                    { id: 'users', label: 'Members Only', desc: 'Visible only to registered users' },
                    { id: 'friends', label: 'Friends Only', desc: 'Visible only to confirmed friends' },
                  ].map(item => {
                    const active = (userSettings.publicVisibility || 'everyone') === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          updateUserSettingsAction({ publicVisibility: item.id as any });
                          showSuccess(`Visibility set to ${item.label}`);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          active
                            ? 'border-[var(--color-accent)] bg-[#313338] text-white shadow-sm'
                            : 'border-[#383a40] hover:border-neutral-500 bg-[#232428] text-neutral-300'
                        }`}
                      >
                        <p className="font-sans text-xs font-bold text-white">{item.label}</p>
                        <p className="text-[10px] text-neutral-400 mt-1">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. SECURITY & FILE SHARING SETTINGS */}
          {activeSection === 'security' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Lock className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
                  Security & File Sharing Preferences
                </h2>
                <p className="mt-1 text-xs text-neutral-400">
                  Configure mature content classification filters, transfer expirations, download modes, and review safety guidance.
                </p>
              </div>

              {/* Mature Content Filter */}
              <div className="rounded-2xl border border-[#383a40] bg-[#2b2d31] p-6 space-y-4 shadow-sm">
                <div className="border-b border-[#383a40] pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                    <h3 className="font-sans text-sm font-bold text-white">
                      Mature Content Classification Filter
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    How you wish to view packages marked as sensitive or mature in public listings.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'warn', label: 'Warn Before Reveal (Recommended)', desc: 'Displays a sensitive content warning before showing media or files.' },
                    { id: 'hide', label: 'Hide Completely', desc: 'Never display marked mature packages in your feed or search.' },
                    { id: 'show', label: 'Always Show', desc: 'Show without extra confirmation dialogs.' },
                  ].map(opt => {
                    const active = (userSettings.matureContentFilter || 'warn') === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          updateUserSettingsAction({ matureContentFilter: opt.id as any });
                          showSuccess(`Mature content filter: ${opt.label}`);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          active
                            ? 'border-[var(--color-accent)] bg-[#313338] text-white shadow-sm'
                            : 'border-[#383a40] hover:border-neutral-500 bg-[#232428] text-neutral-300'
                        }`}
                      >
                        <p className="font-sans text-xs font-bold text-white">{opt.label}</p>
                        <p className="text-[10px] text-neutral-400 mt-1">{opt.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Default Transfer Expiration */}
              <div className="rounded-2xl border border-[#383a40] bg-[#2b2d31] p-6 space-y-4 shadow-sm">
                <div className="border-b border-[#383a40] pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-400" />
                    <h3 className="font-sans text-sm font-bold text-white">
                      Default Transfer Expiry
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Automatically pre-select default expiration for new outgoing file packages.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { days: 7, label: '7 Days' },
                    { days: 14, label: '14 Days' },
                    { days: 30, label: '30 Days' },
                    { days: null, label: 'Unlimited / Never' },
                  ].map(item => {
                    const active = (userSettings.defaultExpiryDays ?? 7) === item.days;
                    return (
                      <div
                        key={String(item.days)}
                        onClick={() => {
                          updateUserSettingsAction({ defaultExpiryDays: item.days });
                          showSuccess(`Default expiry set to ${item.label}`);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${
                          active
                            ? 'border-[var(--color-accent)] bg-[#313338] text-white font-bold'
                            : 'border-[#383a40] bg-[#232428] text-neutral-300 hover:border-neutral-500'
                        }`}
                      >
                        <span className="text-xs">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Storage Usage Overview */}
              <div className="rounded-2xl border border-[#383a40] bg-[#2b2d31] p-6 space-y-4 shadow-sm">
                <div className="border-b border-[#383a40] pb-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-emerald-400" />
                    <h3 className="font-sans text-sm font-bold text-white">
                      Storage Usage & Quota
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    High-speed disk space allocated to your account on the Noir Archive network.
                  </p>
                </div>

                <div className="space-y-3 font-mono-code text-xs">
                  <div className="flex items-center justify-between text-neutral-300">
                    <span>Used Space: <strong className="text-white">{(totalUserFiles * 12.4).toFixed(1)} MB</strong> / 10.0 GB</span>
                    <span className="text-[11px] text-emerald-400">{(totalUserFiles * 0.12).toFixed(1)}% Quota</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-[#1e1f22] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(3, totalUserFiles * 0.5))}%`,
                        backgroundColor: 'var(--color-accent, #5865f2)',
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-[#232428] border border-[#383a40]">
                      <span className="block text-[10px] text-neutral-400 uppercase">Active Dispatches</span>
                      <span className="text-white font-bold text-sm">{totalUserTransfers} transfers</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#232428] border border-[#383a40]">
                      <span className="block text-[10px] text-neutral-400 uppercase">Stored Files & Assets</span>
                      <span className="text-white font-bold text-sm">{totalUserFiles} files</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Advisory & Virus Disclaimer Box */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-2 text-xs text-amber-200">
                <div className="flex items-center gap-2 font-bold font-mono-code text-[11px] uppercase tracking-wider text-amber-300">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Important Safety & Security Notice</span>
                </div>
                <p className="leading-relaxed">
                  Files and folders shared on this platform may contain viruses or malicious software. Uploaded files are not automatically scanned. Always verify a file's provenance before opening it.
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-300/80 pt-1">
                  <li>Only download files from sources and collaborators you trust.</li>
                  <li>Never upload passwords, private keys, or sensitive personal information.</li>
                  <li>Be especially careful when opening executable or script files (.exe, .sh, .bat).</li>
                  <li>Only share files and assets that you have the legal right to distribute.</li>
                </ul>
              </div>
            </div>
          )}

          {/* 4. NOTIFICATIONS SECTION */}
          {activeSection === 'notifications' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bell className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
                  Notifications & Audio Feedback
                </h2>
                <p className="mt-1 text-xs text-neutral-400">
                  Customize incoming sound alerts and desktop status indicators.
                </p>
              </div>

              <div className="rounded-2xl border border-[#383a40] bg-[#2b2d31] p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-[#383a40]">
                  <div>
                    <h3 className="font-sans text-xs font-bold text-white">
                      Notification Sounds
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Play a subtle Discord-inspired audio chime when messages or transfers arrive.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userSettings.notificationSounds !== false}
                      onChange={e => {
                        updateUserSettingsAction({ notificationSounds: e.target.checked });
                        showSuccess(e.target.checked ? 'Notification sounds enabled.' : 'Notification sounds muted.');
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#1e1f22] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent,#5865f2)] border border-[#383a40]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-sans text-xs font-bold text-white">
                      Direct Download Notifications
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Log notifications whenever an active recipient accesses or downloads your transfer package.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono-code font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 5. MY ACCOUNT & IDENTITY SECTION */}
          {activeSection === 'account' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserIcon className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
                  Account Identity & Profile Picture
                </h2>
                <p className="mt-1 text-xs text-neutral-400">
                  Manage your public handle, bio, uploaded profile picture, and security credentials.
                </p>
              </div>

              {/* Profile Card & Avatar Studio Action */}
              <div className="rounded-2xl border border-[#383a40] bg-[#2b2d31] p-6 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <UserAvatar
                    username={currentUser.username}
                    avatarUrl={currentUser.customAvatar || currentUser.avatar}
                    size="2xl"
                    showStatus={true}
                    status="online"
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl font-extrabold text-white">
                      {currentUser.displayName || `@${currentUser.username}`}
                    </h3>
                    <p className="font-mono-code text-xs text-neutral-400">
                      @{currentUser.username}
                    </p>
                    <p className="text-xs text-neutral-300 mt-1 max-w-lg">
                      {currentUser.bio || 'Noir Archive file sharing member.'}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsAvatarEditorOpen(true)}
                        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                        style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>Customize Picture</span>
                      </button>

                      {currentUser.customAvatar && (
                        <button
                          type="button"
                          onClick={() => {
                            updateCustomAvatarAction(null);
                            showSuccess('Reset to letter avatar.');
                          }}
                          className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-mono-code text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Reset to Letter Avatar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit Profile Details Form */}
                <form onSubmit={handleSaveProfile} className="space-y-4 pt-4 border-t border-[#383a40]">
                  <h4 className="font-mono-code text-xs uppercase font-bold text-neutral-300">
                    Profile Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono-code uppercase font-semibold text-neutral-400 mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder="e.g. Moritz W."
                        className="w-full rounded-xl border py-2 px-3 text-xs bg-[#1e1f22] border-[#383a40] text-white focus:outline-none focus:border-[var(--color-accent,#5865f2)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono-code uppercase font-semibold text-neutral-400 mb-1">
                        Location / Timezone
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="e.g. Berlin, Germany"
                        className="w-full rounded-xl border py-2 px-3 text-xs bg-[#1e1f22] border-[#383a40] text-white focus:outline-none focus:border-[var(--color-accent,#5865f2)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono-code uppercase font-semibold text-neutral-400 mb-1">
                      Bio / Description
                    </label>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Tell collaborators about the archives and packages you share..."
                      className="w-full rounded-xl border py-2 px-3 text-xs bg-[#1e1f22] border-[#383a40] text-white focus:outline-none focus:border-[var(--color-accent,#5865f2)] resize-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
                      style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                    </button>
                  </div>
                </form>

                {/* Change Password Sub-form */}
                <form onSubmit={handleChangePassword} className="space-y-4 pt-5 border-t border-[#383a40]">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-neutral-400" />
                    <h4 className="font-mono-code text-xs uppercase font-bold text-neutral-300">
                      Security & Password
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono-code uppercase text-neutral-400 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border py-2 px-3 text-xs bg-[#1e1f22] border-[#383a40] text-white focus:outline-none focus:border-[var(--color-accent,#5865f2)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono-code uppercase text-neutral-400 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full rounded-xl border py-2 px-3 text-xs bg-[#1e1f22] border-[#383a40] text-white focus:outline-none focus:border-[var(--color-accent,#5865f2)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono-code uppercase text-neutral-400 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full rounded-xl border py-2 px-3 text-xs bg-[#1e1f22] border-[#383a40] text-white focus:outline-none focus:border-[var(--color-accent,#5865f2)]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="flex items-center gap-1.5 rounded-xl border border-[#383a40] bg-[#232428] hover:bg-[#313338] px-5 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>{isChangingPassword ? 'Updating...' : 'Update Password'}</span>
                    </button>
                  </div>
                </form>

                {/* Account Metadata */}
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
                    className="flex items-center gap-2 rounded-xl bg-rose-500/15 border border-rose-500/30 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 transition-all cursor-pointer"
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
