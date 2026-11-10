import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { validateUsername, validatePassword, calculateAge, validateDateOfBirth } from '../utils/auth';
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
  Calendar,
} from 'lucide-react';

const GoogleIcon = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const DiscordIcon = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="#5865F2">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

export const AuthModal: React.FC = () => {
  const {
    authModal,
    setAuthModal,
    signUp,
    signIn,
    signInWithOAuth,
    oauthPendingData,
    setOauthPendingData,
    completeOAuthRegistration,
    users,
    setActiveTab,
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup'>(authModal || 'signup');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

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
    if (oauthPendingData) {
      setMode('signup');
      setUsername(oauthPendingData.suggestedUsername || '');
    } else if (authModal) {
      setMode(authModal);
    }
    setFormError(null);
  }, [authModal, oauthPendingData]);

  useEffect(() => {
    if (mode === 'signup' && username.trim().length > 0) {
      const result = validateUsername(username, users);
      setUsernameStatus(result);
    } else {
      setUsernameStatus(null);
    }
  }, [username, users, mode]);

  useEffect(() => {
    if (mode === 'signup' && password.length > 0 && !oauthPendingData) {
      const result = validatePassword(password);
      setPasswordStatus(result);
    } else {
      setPasswordStatus(null);
    }
  }, [password, mode, oauthPendingData]);

  if (!authModal && !oauthPendingData) return null;

  const handleOAuth = async (provider: 'google' | 'discord') => {
    setIsOAuthLoading(true);
    setFormError(null);
    const res = await signInWithOAuth(provider);
    if (res.error) {
      setFormError(res.error);
      setIsOAuthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // OAuth Completion flow
    if (oauthPendingData) {
      if (!dateOfBirth) {
        setFormError('Date of Birth is required to complete account registration.');
        return;
      }
      const dobCheck = validateDateOfBirth(dateOfBirth);
      if (!dobCheck.isValid) {
        setFormError(dobCheck.error || 'Please enter a valid Date of Birth');
        return;
      }

      const res = await completeOAuthRegistration({
        username: username.trim(),
        displayName: username.trim(),
        dateOfBirth,
      });

      if (res.success) {
        setAuthModal(null);
        setActiveTab('transfers');
      } else {
        setFormError(res.error || 'Failed to complete registration.');
      }
      return;
    }

    if (mode === 'signup') {
      if (!dateOfBirth) {
        setFormError('Date of Birth is required for content safety & age verification.');
        return;
      }
      const dobCheck = validateDateOfBirth(dateOfBirth);
      if (!dobCheck.isValid) {
        setFormError(dobCheck.error || 'Please enter a valid Date of Birth');
        return;
      }

      const res = await signUp({
        username: username.trim(),
        password,
        location: location.trim() || undefined,
        bio: bio.trim() || undefined,
        dateOfBirth,
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
