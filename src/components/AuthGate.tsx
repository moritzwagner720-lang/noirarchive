import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { validateUsername, validatePassword } from '../utils/auth';
import {
  Lock,
  User as UserIcon,
  MapPin,
  FileText,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Camera,
  FolderLock,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';

export const AuthGate: React.FC = () => {
  const { signIn, signUp, users, theme, toggleTheme } = useApp();
  const isLight = theme === 'light';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Live validation states for signup
  const [usernameStatus, setUsernameStatus] = useState<{
    isValid: boolean;
    error?: string;
  } | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<{
    isValid: boolean;
    score: number;
    feedback: string;
  } | null>(null);

  useEffect(() => {
    setFormError(null);
  }, [mode]);

  // Real-time username uniqueness check
  useEffect(() => {
    if (mode === 'signup' && username.trim().length > 0) {
      const result = validateUsername(username, users);
      setUsernameStatus(result);
    } else {
      setUsernameStatus(null);
    }
  }, [username, users, mode]);

  // Real-time password strength check
  useEffect(() => {
    if (mode === 'signup' && password.length > 0) {
      const result = validatePassword(password);
      setPasswordStatus(result);
    } else {
      setPasswordStatus(null);
    }
  }, [password, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (mode === 'signup') {
      const res = await signUp({
        username: username.trim(),
        password,
        location: location.trim() || undefined,
        bio: bio.trim() || undefined,
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to create account.');
      }
    } else {
      const res = await signIn(username.trim(), password);
      if (!res.success) {
        setFormError(res.error || 'Invalid username or password.');
      }
    }
  };


  return (
    <div
      className={`min-h-screen flex flex-col justify-between transition-colors duration-200 relative overflow-hidden ${
        isLight ? 'bg-[#fcf8f5] text-stone-900' : 'bg-[#090503] text-white'
      }`}
    >
      {/* Background Halloween Ember Glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-[radial-gradient(circle,rgba(255,107,0,0.15)_0%,rgba(154,52,18,0.05)_50%,transparent_70%)] blur-[100px]" />

      {/* Top Bar with brand & theme toggle */}
      <header
        className={`border-b px-4 py-4 sm:px-8 transition-colors ${
          isLight ? 'bg-white/80 border-amber-200' : 'bg-[#0c0704]/80 border-orange-500/20'
        } backdrop-blur-md relative z-10`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#ff6b00] text-black font-black text-xs shadow-md shadow-orange-950/60">
              ✦
            </span>
            <div>
              <span className="font-editorial text-lg tracking-widest font-semibold uppercase">
                NOIR ARCHIVE
              </span>
              <span className="hidden sm:inline-block ml-3 font-mono-code text-[11px] text-[#ff6b00] uppercase tracking-widest font-semibold">
                / NOCTURNAL VAULT ENTRANCE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono-code text-xs transition-colors cursor-pointer ${
                isLight
                  ? 'border-amber-300 bg-amber-50 text-stone-700 hover:bg-amber-100'
                  : 'border-orange-500/30 bg-[#160d09] text-orange-200 hover:bg-[#1e110c]'
              }`}
            >
              {isLight ? (
                <>
                  <Moon className="h-3.5 w-3.5 text-stone-900" />
                  <span>Dark Vault</span>
                </>
              ) : (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span>Dusk Mode</span>
                  <span className="font-mono-code text-[11px] font-bold text-[#ff6b00] px-1.5 py-0.5 rounded bg-orange-500/15 border border-orange-500/30">
                    v1.28
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Hero Banner text */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono-code text-[11px] uppercase tracking-wider mb-3 bg-orange-500/10 border-orange-500/30 text-[#ff6b00]">
              <Shield className="h-3.5 w-3.5" />
              <span>Identity Verification</span>
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight">
              {mode === 'signin' ? 'Sign In to Enter Archive' : 'Create Unique Username'}
            </h1>
            <p className={`mt-2 font-sans text-xs max-w-sm mx-auto ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
              {mode === 'signin'
                ? 'Authentication is required before accessing photography portfolios, private transfers, and the darkroom messenger.'
                : 'Claim your permanent unique handle (can only be registered once) and secure your account with a password.'}
            </p>
          </div>

          {/* Auth Card */}
          <div
            className={`rounded-2xl border p-6 sm:p-8 shadow-xl transition-colors ${
              isLight ? 'bg-white border-amber-200' : 'bg-[#130b08]/95 border-orange-500/25 shadow-[0_20px_60px_-15px_rgba(255,107,0,0.15)]'
            }`}
          >
            {/* Mode Switcher Tabs */}
            <div
              className={`mb-6 grid grid-cols-2 rounded-lg border p-1 font-mono-code text-xs ${
                isLight ? 'bg-amber-50 border-amber-200' : 'bg-[#1a0e0a] border-orange-500/20'
              }`}
            >
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`rounded-md py-2 font-bold transition-all ${
                  mode === 'signin'
                    ? 'bg-[#ff6b00] text-black shadow-sm'
                    : isLight
                    ? 'text-stone-600 hover:text-stone-900'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`rounded-md py-2 font-bold transition-all ${
                  mode === 'signup'
                    ? 'bg-[#ff6b00] text-black shadow-sm'
                    : isLight
                    ? 'text-stone-600 hover:text-stone-900'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-500">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field with visible label */}
              <div>
                <label className="block font-mono-code text-xs font-semibold uppercase tracking-wider mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-[#ff6b00]" />
                    <span>Username Handle</span>
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono-code text-xs font-bold text-[#ff6b00]">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    aria-label="Username Handle"
                    className={`w-full rounded-xl border py-2.5 pl-8 pr-3 font-mono-code text-xs transition-colors focus:border-[#ff6b00] focus:outline-none ${
                      isLight
                        ? 'bg-amber-50/50 border-amber-300 text-stone-900'
                        : 'bg-[#180e0a] border-orange-500/30 text-white'
                    }`}
                  />
                </div>
                {mode === 'signup' && usernameStatus && (
                  <div className="mt-1.5 flex items-center gap-1.5 font-mono-code text-[11px]">
                    {usernameStatus.isValid ? (
                      <span className="flex items-center gap-1 text-emerald-500">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Handle is available</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-500">
                        <AlertCircle className="h-3 w-3" />
                        <span>{usernameStatus.error}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Password Field with visible label */}
              <div>
                <label className="block font-mono-code text-xs font-semibold uppercase tracking-wider mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-[#ff6b00]" />
                    <span>Password</span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    aria-label="Account Password"
                    className={`w-full rounded-xl border py-2.5 pl-3.5 pr-10 font-mono-code text-xs transition-colors focus:border-[#ff6b00] focus:outline-none ${
                      isLight
                        ? 'bg-amber-50/50 border-amber-300 text-stone-900'
                        : 'bg-[#180e0a] border-orange-500/30 text-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                      isLight ? 'text-stone-400 hover:text-stone-700' : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === 'signup' && passwordStatus && (
                  <div className="mt-1.5">
                    <div className="flex gap-1 h-1 w-full bg-neutral-800 rounded-full overflow-hidden mb-1">
                      {[1, 2, 3, 4].map(idx => (
                        <div
                          key={idx}
                          className={`flex-1 transition-all ${
                            idx <= passwordStatus.score
                              ? passwordStatus.score >= 3
                                ? 'bg-emerald-500'
                                : passwordStatus.score === 2
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                              : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                    <span
                      className={`font-mono-code text-[10px] ${
                        passwordStatus.score >= 3
                          ? 'text-emerald-500'
                          : passwordStatus.score === 2
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}
                    >
                      {passwordStatus.feedback}
                    </span>
                  </div>
                )}
              </div>

              {/* Extra Signup Details: Location & Bio (visible labels) */}
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block font-mono-code text-xs font-semibold uppercase tracking-wider mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#ff6b00]" />
                        <span>Studio Location (Optional)</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      aria-label="Studio Location"
                      className={`w-full rounded-xl border py-2.5 px-3.5 font-mono-code text-xs transition-colors focus:border-[#ff6b00] focus:outline-none ${
                        isLight
                          ? 'bg-amber-50/50 border-amber-300 text-stone-900'
                          : 'bg-[#180e0a] border-orange-500/30 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block font-mono-code text-xs font-semibold uppercase tracking-wider mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-[#ff6b00]" />
                        <span>Artist Statement / Bio (Optional)</span>
                      </span>
                    </label>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      aria-label="Artist Statement and Bio"
                      className={`w-full rounded-xl border py-2.5 px-3.5 font-sans text-xs transition-colors focus:border-[#ff6b00] focus:outline-none resize-none ${
                        isLight
                          ? 'bg-amber-50/50 border-amber-300 text-stone-900'
                          : 'bg-[#180e0a] border-orange-500/30 text-white'
                      }`}
                    />
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#ff6b00] py-3 font-sans text-xs font-bold text-black shadow-lg shadow-orange-950/50 transition-all hover:bg-[#ff7d1f] hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>{mode === 'signin' ? 'Sign In & Access Archive' : 'Register Handle & Enter'}</span>
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </button>
            </form>

            {/* Security Notice */}
            <div
              className={`mt-6 border-t pt-4 ${
                isLight ? 'border-amber-200 text-stone-500' : 'border-orange-500/20 text-neutral-400'
              }`}
            >
              <div className="flex items-center gap-1.5 font-mono-code text-[11px] font-semibold text-[#ff6b00] uppercase tracking-wider mb-1">
                <Lock className="h-3.5 w-3.5" />
                <span>Protected Archive Access</span>
              </div>
              <p className="font-sans text-[11px] opacity-75">
                All credentials and archives are securely hashed. Your password is private and never visible to other users.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`border-t py-6 px-4 text-center font-mono-code text-[11px] transition-colors ${
          isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-black/60 border-neutral-800 text-neutral-400'
        }`}
      >
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>NOIR ARCHIVE — Minimalist Photography Portfolios & File Delivery</span>
          <div className="flex items-center gap-4">
            <span>Single Registration Handles</span>
            <span>•</span>
            <span>Protected Client Portals</span>
            <span>•</span>
            <span>ZIP Batch Transfers</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
