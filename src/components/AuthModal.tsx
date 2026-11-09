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
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { authModal, setAuthModal, signUp, signIn, users, setActiveTab } = useApp();

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

  useEffect(() => {
    if (mode === 'signup' && username.trim().length > 0) {
      const result = validateUsername(username, users);
      setUsernameStatus(result);
    } else {
      setUsernameStatus(null);
    }
  }, [username, users, mode]);

  useEffect(() => {
    if (mode === 'signup' && password.length > 0) {
      const result = validatePassword(password);
      setPasswordStatus(result);
    } else {
      setPasswordStatus(null);
    }
  }, [password, mode]);

  if (!authModal) return null;

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

      if (res.success) {
        setAuthModal(null);
        setActiveTab('transfers');
      } else {
        setFormError(res.error || 'Failed to create account.');
      }
    } else {
      const res = await signIn(username.trim(), password);

      if (res.success) {
        setAuthModal(null);
      } else {
        setFormError(res.error || 'Invalid username or password.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border p-6 sm:p-8 shadow-2xl bg-[#2b2d31] border-[#383a40] text-white">
        {/* Close Button */}
        <button
          onClick={() => setAuthModal(null)}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-xl border border-[#383a40] text-neutral-400 hover:bg-[#313338] hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
            />
            <span className="font-mono-code text-[10px] tracking-widest font-bold uppercase text-neutral-400">
              NOIR ARCHIVE AUTHENTICATION
            </span>
          </div>
          <h2 className="mt-1 font-sans text-2xl font-bold tracking-tight text-white">
            {mode === 'signup' ? 'Create Unique Username' : 'Sign In to Account'}
          </h2>
          <p className="mt-1 font-sans text-xs text-neutral-400">
            {mode === 'signup'
              ? 'Claim your permanent unique handle (registered once) and secure your account.'
              : 'Sign in to access your file transfers, friend groups, and messages.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="mb-6 grid grid-cols-2 rounded-xl border p-1 font-mono-code text-xs bg-[#1e1f22] border-[#383a40]">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setFormError(null);
            }}
            className={`py-1.5 rounded-lg text-center transition-all font-semibold ${
              mode === 'signup'
                ? 'text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            style={{
              backgroundColor: mode === 'signup' ? 'var(--color-accent, #5865f2)' : undefined,
            }}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setFormError(null);
            }}
            className={`py-1.5 rounded-lg text-center transition-all font-semibold ${
              mode === 'signin'
                ? 'text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            style={{
              backgroundColor: mode === 'signin' ? 'var(--color-accent, #5865f2)' : undefined,
            }}
          >
            Sign In
          </button>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div>
            <label className="block font-mono-code text-[11px] uppercase tracking-wider font-semibold text-neutral-300">
              Unique Username Handle *
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-code text-xs text-neutral-400">
                @
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                aria-label="Username handle"
                placeholder="handle"
                className="w-full rounded-xl border py-2 pl-7 pr-3 font-mono-code text-xs bg-[#1e1f22] border-[#383a40] text-white focus:outline-none focus:border-[var(--color-accent,#5865f2)] transition-colors"
              />
            </div>

            {mode === 'signup' && username.length > 0 && usernameStatus && (
              <div className="mt-1 flex items-center gap-1.5 font-mono-code text-[10px]">
                {usernameStatus.isValid ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-3 w-3" />
                    Username is available
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400">
                    <AlertCircle className="h-3 w-3" />
                    {usernameStatus.error}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block font-mono-code text-[11px] uppercase tracking-wider font-semibold text-neutral-300">
              Password *
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                aria-label="Account password"
                placeholder="Enter password..."
                className="w-full rounded-xl border py-2 pl-3 pr-10 font-mono-code text-xs bg-[#1e1f22] border-[#383a40] text-white focus:outline-none focus:border-[var(--color-accent,#5865f2)] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {mode === 'signup' && password.length > 0 && passwordStatus && (
              <div className="mt-2 space-y-1">
                <div className="flex h-1 w-full gap-1 overflow-hidden bg-neutral-800 rounded-full">
                  {[1, 2, 3, 4].map(step => (
                    <div
                      key={step}
                      className={`h-full flex-1 transition-all rounded-full ${
                        step <= passwordStatus.score
                          ? passwordStatus.score < 2
                            ? 'bg-rose-500'
                            : passwordStatus.score < 4
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                          : 'opacity-0'
                      }`}
                    />
                  ))}
                </div>
                <p className="font-mono-code text-[10px] text-neutral-400">
                  {passwordStatus.feedback}
                </p>
              </div>
            )}
          </div>

          {/* Optional Profile fields for signup */}
          {mode === 'signup' && (
            <div className="space-y-3 border-t pt-3 border-[#383a40]">
              <div>
                <label className="block font-mono-code text-[10px] uppercase tracking-wider text-neutral-400">
                  Location (optional)
                </label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    aria-label="Location"
                    placeholder="e.g. London, UK"
                    className="w-full rounded-xl border py-1.5 pl-8 pr-3 font-mono-code text-xs bg-[#1e1f22] border-[#383a40] text-white focus:outline-none focus:border-[var(--color-accent,#5865f2)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono-code text-[10px] uppercase tracking-wider text-neutral-400">
                  Bio (optional)
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  aria-label="Bio"
                  placeholder="Share a short bio..."
                  className="w-full rounded-xl border py-1.5 px-3 text-xs bg-[#1e1f22] border-[#383a40] text-white focus:outline-none focus:border-[var(--color-accent,#5865f2)] transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white transition-all hover:brightness-110 shadow-lg active:scale-[0.99]"
            style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{mode === 'signup' ? 'Create Account & Claim Handle' : 'Sign In'}</span>
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 border-t pt-4 border-[#383a40]">
          <p className="font-sans text-[11px] text-neutral-400">
            🔒 Account credentials are encrypted. Your password is encrypted and never revealed.
          </p>
        </div>
      </div>
    </div>
  );
};
