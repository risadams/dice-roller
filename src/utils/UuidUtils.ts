/**
 * Utility functions for UUID generation with secure random sources
 */

/**
 * Generates a secure UUID v4 using the best available random source
 * 
 * Attempts to use:
 * 1. Node.js crypto.randomUUID() (fastest)
 * 2. Node.js crypto.randomBytes() (secure manual)
 * 3. Browser crypto.randomUUID() (modern browsers)
 * 4. Browser crypto.getRandomValues() (secure manual)
 * 
 * Throws an error if no secure random source is available.
 * Never falls back to Math.random() for security reasons.
 */
export function generateUUID(): string {
  // Try Node.js crypto first - check for Node.js specific globals
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const { randomUUID, randomBytes } = require('crypto');
      if (typeof randomUUID === 'function') {
        return randomUUID();
      }
      // Secure manual v4 UUID using crypto.randomBytes
      const bytes = randomBytes(16);
      // Per RFC4122 v4: set version (byte 6) and variant (byte 8)
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
      return (
        hex.substring(0, 8) + '-' +
        hex.substring(8, 12) + '-' +
        hex.substring(12, 16) + '-' +
        hex.substring(16, 20) + '-' +
        hex.substring(20, 32)
      );
    } catch (error) {
      // Fall through to browser/manual implementation
    }
  }
  
  // Browser implementation
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Secure manual fallback for browsers, using crypto.getRandomValues
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // Per RFC4122 v4: set version (byte 6) and variant (byte 8)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return (
      hex.substring(0, 8) + '-' +
      hex.substring(8, 12) + '-' +
      hex.substring(12, 16) + '-' +
      hex.substring(16, 20) + '-' +
      hex.substring(20, 32)
    );
  }
  
  // As a last resort, throw -- never use Math.random
  throw new Error('No secure random source available for UUID generation');
}

/**
 * Validates if a string is a valid UUID v4 format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generates a short UUID (8 characters) for when full UUIDs are too long
 * Still uses secure random sources but produces shorter identifiers
 */
export function generateShortUUID(): string {
  // Try Node.js crypto first - check for Node.js specific globals
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const { randomBytes } = require('crypto');
      const bytes = randomBytes(4);
      return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      // Fall through to browser implementation
    }
  }
  
  // Browser implementation
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // As a last resort, throw -- never use Math.random
  throw new Error('No secure random source available for short UUID generation');
}
