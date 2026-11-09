import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { validateUsername, validatePassword } from '../utils/auth';
import { APP_VERSION } from '../version';
import {
  Lock,
  User as UserIcon,
  MapPin,
  FileText,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { NoirArchiveLogo } from './NoirArchiveLogo';

export const AuthGate: React.FC = () => {
  const { signIn, signUp, users } = useApp();

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
    <div className="min-h-screen flex flex-col justify-between bg-transparent text-white relative overflow-hidden">
      {/* Top Bar with brand & version */}
      <header className="border-b px-4 py-4 sm:px-8 bg-[#2b2d31]/80 border-[#383a40] backdrop-blur-md relative z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <NoirArchiveLogo size="sm" showText={true} />
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono-code text-[11px] font-semibold text-neutral-400 px-2.5 py-1 rounded-lg bg-[#1e1f22] border border-[#383a40]">
              v{APP_VERSION}
            </span>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Header text */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono-code text-[11px] uppercase tracking-wider mb-3 bg-[#2b2d31] border-[#383a40] text-neutral-300">
              <Shield className="h-3.5 w-3.5 text-indigo-400" />
              <span>Identity & Access</span>
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {mode === 'signin' ? 'Sign In to Noir Archive' : 'Create Unique Username'}
            </h1>
            <p className="mt-2 font-sans text-xs max-w-sm mx-auto text-neutral-400">
              {mode === 'signin'
                ? 'Sign in to access your file transfers, organized friend groups, and peer chats.'
                : 'Claim your permanent unique username handle to start sharing files and folders.'}
            </p>
          </div>

          {/* Auth Card */}
          <div className="rounded-2xl border p-6 sm:p-8 shadow-xl bg-[#2b2d31] border-[#383a40]">
            {/* Mode Switcher Tabs */}
            <div className="mb-6 grid grid-cols-2 rounded-xl border p-1 font-mono-code text-xs bg-[#1e1f22] border-[#383a40]">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`rounded-lg py-2 font-bold transition-all ${
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
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`rounded-lg py-2 font-bold transition-all ${
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
            </div>

            {/* Error Message */}
            {formError && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div>
                <label className="block font-mono-code text-xs font-semibold uppercase tracking-wider mb-1.5 text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5" style={{ color: 'var(--color-accent, #5865f2)' }} />
                    <span>Username Handle</span>
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono-code text-xs font-bold text-neutral-400">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    aria-label="Username Handle"
                    placeholder="your_handle"
                    className="w-full rounded-xl border py-2.5 pl-8 pr-3 font-mono-code text-xs transition-colors bg-[#1e1f22] border-[#383a40] text-white focus:outline-none focus:border-[var(--color-accent,#5865f2)]"
                  />
                </div>
                {mode === 'signup' && usernameStatus && (
                  <div className="mt-1.5 flex items-center gap-1.5 font-mono-code text-[11px]">
                    {usernameStatus.isValid ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Handle is available</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-400">
                        <AlertCircle className="h-3 w-3" />
                        <span>{usernameStatus.error}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block font-mono-code text-xs font-semibold uppercase tracking-wider mb-1.5 text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" style={{ color: 'var(--color-accent, #5865f2)' }} />
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
                    placeholder="Enter password..."
                    className="w-full rounded-xl border py-2.5 pl-3.5 pr-10 font-mono-code text-xs transition-colors bg-[#1e1f22] border-[#383a40] text-white focus:outline-none focus:border-[var(--color-accent,#5865f2)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
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
                          ? 'text-emerald-400'
                          : passwordStatus.score === 2
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {passwordStatus.feedback}
                    </span>
                  </div>
                )}
              </div>

              {/* Extra Signup Details: Location & Bio */}
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block font-mono-code text-xs font-semibold uppercase tracking-wider mb-1.5 text-neutral-300">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                        <span>Location (Optional)</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      aria-label="Location"
                      placeholder="e.g. Berlin, Germany"
                      className="w-full rounded-xl border py-2.5 px-3.5 font-mono-code text-xs transition-colors bg-[#1e1f22] border-[#383a40] text-white focus:outline-none focus:border-[var(--color-accent,#5865f2)]"
                    />
                  </div>

                  <div>
                    <label className="block font-mono-code text-xs font-semibold uppercase tracking-wider mb-1.5 text-neutral-300">
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-neutral-400" />
                        <span>Bio (Optional)</span>
                      </span>
                    </label>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      aria-label="Bio"
                      placeholder="Share your interests..."
                      className="w-full rounded-xl border py-2.5 px-3.5 font-sans text-xs transition-colors bg-[#1e1f22] border-[#383a40] text-white focus:outline-none focus:border-[var(--color-accent,#5865f2)] resize-none"
                    />
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl py-3 font-sans text-xs font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.99] cursor-pointer"
                style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
              >
                <span>{mode === 'signin' ? 'Sign In & Access Platform' : 'Register Handle & Enter'}</span>
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </button>

              <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-neutral-400 font-mono-code">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>Persistent login active: Stays signed in across browser sessions</span>
              </div>
            </form>

            {/* Notice */}
            <div className="mt-5 border-t pt-4 border-[#383a40] text-neutral-400">
              <div className="flex items-center gap-1.5 font-mono-code text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                <Lock className="h-3.5 w-3.5" />
                <span>Protected Archive Access</span>
              </div>
              <p className="font-sans text-[11px] opacity-75">
                Passwords are authenticated securely and stored hashed. Persistent sessions are validated server-side using secure HttpOnly cookies.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Discord-style Footer */}
      <footer className="border-t py-6 px-4 text-center font-mono-code text-[11px] bg-[#1e1f22] border-[#383a40] text-neutral-400">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>NOIR ARCHIVE — High-Speed File & Folder Sharing Platform</span>
          <div className="flex items-center gap-4 text-neutral-400">
            <span>Direct Transfers</span>
            <span>•</span>
            <span>Friend Groups</span>
            <span>•</span>
            <span>Encrypted Delivery</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
