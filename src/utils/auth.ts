import { User } from '../types';

export interface UsernameValidationResult {
  isValid: boolean;
  error?: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 1 to 4
  feedback: string;
}

/**
 * Validates a proposed username against rules and existing users.
 * The username can only be taken once (unique, case-insensitive).
 */
export function validateUsername(
  username: string,
  existingUsers: Pick<User, 'username'>[]
): UsernameValidationResult {
  const trimmed = username.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Username is required' };
  }

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }

  if (trimmed.length > 20) {
    return { isValid: false, error: 'Username must be 20 characters or fewer' };
  }

  const validRegex = /^[a-zA-Z0-9_]+$/;
  if (!validRegex.test(trimmed)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }

  const lower = trimmed.toLowerCase();
  const isTaken = existingUsers.some(
    u => u.username.toLowerCase() === lower
  );

  if (isTaken) {
    return { isValid: false, error: `The username "${trimmed}" is already taken` };
  }

  return { isValid: true };
}

/**
 * Validates password strength and criteria.
 */
export function validatePassword(password: string): PasswordValidationResult {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      score: 1,
      feedback: 'Password must be at least 6 characters long',
    };
  }

  let score = 1;
  if (password.length >= 8) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) || /[A-Z]/.test(password)) score++;

  return {
    isValid: true,
    score: Math.min(score, 4),
    feedback: score >= 3 ? 'Secure password' : 'Fair password, consider adding special symbols or numbers',
  };
}

/**
 * Deterministic hash simulation for in-browser client security demo.
 */
export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `hash_${Math.abs(hash).toString(16)}_${password.length}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  return hashPassword(password) === storedHash;
}
