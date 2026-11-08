import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { validateUsername, validatePassword } from '../utils/auth';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { authModal, setAuthModal, signUp, signIn, users, setActiveTab, theme } = useApp();

  const isLight = theme === 'light';

  const [mode, setMode] = useState<'signin' | 'signup'>(authModal || 'signup');
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
    if (authModal) {
      setMode(authModal);
      setFormError(null);
    }
  }, [authModal]);

  // Real-time username check (enforcing username can only be taken once)
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

  if (!authModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (mode === 'signup') {
      const res = signUp({
        username: username.trim(),
        password,
        location: location.trim() || undefined,
        bio: bio.trim() || undefined,
      });

      if (res.success) {
        setAuthModal(null);
        setActiveTab('explore');
      } else {
        setFormError(res.error || 'Failed to create account.');
      }
    } else {
      const res = signIn(username.trim(), password);

      if (res.success) {
        setAuthModal(null);
      } else {
        setFormError(res.error || 'Invalid username or password.');
      }
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in">
      <div
        className={`relative w-full max-w-md rounded-2xl border p-6 sm:p-8 shadow-2xl overflow-hidden transition-colors ${
          isLight
            ? 'bg-amber-50/95 border-amber-300 text-stone-900 shadow-orange-500/10'
            : 'bg-[#140b07] border-orange-500/30 text-white shadow-2xl shadow-orange-950/60'
        }`}
      >
        {/* Halloween ambient amber glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setAuthModal(null)}
          className={`absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
            isLight
              ? 'border-amber-300 text-stone-500 hover:bg-amber-100 hover:text-stone-900'
              : 'border-orange-500/30 text-neutral-400 hover:bg-[#20110a] hover:text-[#ff6b00]'
          }`}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#ff6b00] animate-pulse" />
            <span className="font-mono-code text-[10px] tracking-widest text-[#ff6b00] font-bold uppercase">
              🎃 NOIR ARCHIVE VAULT
            </span>
          </div>
          <h2 className="mt-1 font-sans text-2xl font-bold tracking-tight">
            {mode === 'signup' ? 'Create Unique Username' : 'Enter the Crypt'}
          </h2>
          <p className={`mt-1 font-sans text-xs ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
            {mode === 'signup'
              ? 'Claim your permanent unique handle (can only be registered once) and secure your account with a password.'
              : 'Sign in to access your projects, friends list, and client transfers.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div
          className={`mb-6 grid grid-cols-2 rounded-full border p-1 font-mono-code text-xs ${
            isLight ? 'bg-amber-100/70 border-amber-300' : 'bg-[#1f1008] border-orange-500/30'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setFormError(null);
            }}
            className={`py-1.5 rounded-full text-center transition-all font-medium ${
              mode === 'signup'
                ? 'bg-[#ff6b00] text-black font-bold shadow-md shadow-[#ff6b00]/30'
                : isLight
                ? 'text-stone-600 hover:text-stone-900'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setFormError(null);
            }}
            className={`py-1.5 rounded-full text-center transition-all font-medium ${
              mode === 'signin'
                ? 'bg-[#ff6b00] text-black font-bold shadow-md shadow-[#ff6b00]/30'
                : isLight
                ? 'text-stone-600 hover:text-stone-900'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div>
            <label className="block font-mono-code text-[11px] uppercase tracking-wider font-semibold">
              Unique Username <span className="text-[#ff6b00]">*</span>
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-code text-xs text-[#ff6b00]">
                @
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                aria-label="Username handle"
                className={`w-full rounded-xl border py-2 pl-7 pr-3 font-mono-code text-xs focus:outline-none transition-colors ${
                  isLight
                    ? 'bg-white border-amber-300 text-stone-900 focus:border-[#ff6b00]'
                    : 'bg-[#1b0e08] border-orange-500/30 text-white focus:border-[#ff6b00]'
                } ${
                  mode === 'signup' && usernameStatus
                    ? usernameStatus.isValid
                      ? 'border-emerald-500 focus:border-emerald-500'
                      : 'border-red-500 focus:border-red-500'
                    : ''
                }`}
              />
            </div>

            {/* Live Username Uniqueness Feedback */}
            {mode === 'signup' && username.length > 0 && usernameStatus && (
              <div className="mt-1 flex items-center gap-1.5 font-mono-code text-[10px]">
                {usernameStatus.isValid ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-3 w-3" />
                    Username is available (1 of 1 unique claim)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    {usernameStatus.error}
                  </span>
                )}
              </div>
            )}
            {mode === 'signup' && !username && (
              <p className="mt-1 font-mono-code text-[10px] opacity-60">
                Usernames are permanent and can only be taken once across the platform.
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block font-mono-code text-[11px] uppercase tracking-wider font-semibold">
              Password <span className="text-[#ff6b00]">*</span>
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                aria-label="Account password"
                className={`w-full rounded-xl border py-2 pl-3 pr-10 font-mono-code text-xs focus:outline-none transition-colors ${
                  isLight
                    ? 'bg-white border-amber-300 text-stone-900 focus:border-[#ff6b00]'
                    : 'bg-[#1b0e08] border-orange-500/30 text-white focus:border-[#ff6b00]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 text-[#ff6b00]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password strength meter for signup */}
            {mode === 'signup' && password.length > 0 && passwordStatus && (
              <div className="mt-2 space-y-1">
                <div className="flex h-1 w-full gap-1 overflow-hidden bg-stone-200 dark:bg-stone-800 rounded-full">
                  {[1, 2, 3, 4].map(step => (
                    <div
                      key={step}
                      className={`h-full flex-1 transition-all rounded-full ${
                        step <= passwordStatus.score
                          ? passwordStatus.score < 2
                            ? 'bg-red-500'
                            : passwordStatus.score < 4
                            ? 'bg-[#ff6b00]'
                            : 'bg-emerald-500'
                          : 'opacity-0'
                      }`}
                    />
                  ))}
                </div>
                <p className="font-mono-code text-[10px] opacity-75">
                  {passwordStatus.feedback}
                </p>
              </div>
            )}
          </div>

          {/* Optional Profile fields for signup */}
          {mode === 'signup' && (
            <div className="space-y-3 border-t pt-3 border-amber-200 dark:border-orange-500/20">
              <div>
                <label className="block font-mono-code text-[10px] uppercase tracking-wider opacity-75">
                  Location (optional)
                </label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#ff6b00] opacity-80" />
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    aria-label="Studio Location"
                    className={`w-full rounded-xl border py-1.5 pl-8 pr-3 font-mono-code text-xs focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-white border-amber-300 text-stone-900 focus:border-[#ff6b00]'
                        : 'bg-[#1b0e08] border-orange-500/30 text-white focus:border-[#ff6b00]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono-code text-[10px] uppercase tracking-wider opacity-75">
                  Bio / Focus (optional)
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  aria-label="Artist bio and focus"
                  className={`w-full rounded-xl border py-1.5 px-3 text-xs focus:outline-none transition-colors ${
                    isLight
                      ? 'bg-white border-amber-300 text-stone-900 focus:border-[#ff6b00]'
                      : 'bg-[#1b0e08] border-orange-500/30 text-white focus:border-[#ff6b00]'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6b00] py-3 text-xs font-bold text-black hover:bg-[#e05e00] transition-all shadow-lg shadow-[#ff6b00]/25 active:scale-[0.99]"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{mode === 'signup' ? 'Create Account & Claim Handle' : 'Sign In'}</span>
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 border-t pt-4 border-amber-200/60 dark:border-orange-500/20">
          <p className="font-sans text-[11px] text-stone-500 dark:text-neutral-400">
            🔒 Account credentials are encrypted. Your password is encrypted and never revealed.
          </p>
        </div>
      </div>
    </div>
  );
};
