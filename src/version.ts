/**
 * Single consistent source of truth for Noir Archive application version.
 * Version sequence rules:
 * - First release: 1.0
 * - Next release: 1.1, 1.2, 1.3 ... 1.9, 1.10, 1.11 ... 1.50+
 * - Treat versions strictly as strings, not decimal numbers.
 * - Increment only when preparing a release, not on every app start.
 */
export const APP_VERSION = '1.0';
