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

/**
 * Calculates accurate age from a birth date string (YYYY-MM-DD).
 */
export function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Validates date of birth string:
 * - Must be a valid date
 * - Must be in the past
 * - Must be reasonably bounded (< 120 years ago)
 */
export function validateDateOfBirth(dobString: string): {
  isValid: boolean;
  error?: string;
  age?: number;
  isAdult?: boolean;
} {
  if (!dobString || !dobString.trim()) {
    return { isValid: false, error: 'Date of birth is required for content safety & verification.' };
  }

  const clean = dobString.trim();
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(clean)) {
    return { isValid: false, error: 'Please enter date of birth in YYYY-MM-DD format.' };
  }

  const date = new Date(clean);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date of birth entered.' };
  }

  const today = new Date();
  if (date > today) {
    return { isValid: false, error: 'Date of birth cannot be in the future.' };
  }

  const age = calculateAge(clean);
  if (age > 120) {
    return { isValid: false, error: 'Please enter a realistic date of birth.' };
  }

  return {
    isValid: true,
    age,
    isAdult: age >= 18,
  };
}
