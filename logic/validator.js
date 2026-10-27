/**
 * Input Validation & Sanitization Module
 * Pure validation functions for pay records, hours, hazards, and worker profiles.
 */

'use strict';

/**
 * Validates shift hours worked within statutory limits (0 to 168 hours/week).
 * @param {any} hours
 * @returns {{ valid: boolean, value: number, error?: string }}
 */
function validateHours(hours) {
  if (hours === undefined || hours === null || String(hours).trim() === '') {
    return { valid: false, value: 0, error: 'Hours worked is required' };
  }

  const num = Number(hours);
  if (isNaN(num)) {
    return { valid: false, value: 0, error: 'Hours worked must be a valid number' };
  }

  if (num < 0) {
    return { valid: false, value: 0, error: 'Hours worked cannot be negative' };
  }

  if (num > 168) {
    return { valid: false, value: 0, error: 'Hours worked cannot exceed 168 hours per week' };
  }

  return { valid: true, value: Math.round(num * 100) / 100 };
}

/**
 * Validates pay amounts. Must be a non-negative number.
 * @param {any} pay
 * @returns {{ valid: boolean, value: number, error?: string }}
 */
function validatePay(pay) {
  if (pay === undefined || pay === null || String(pay).trim() === '') {
    return { valid: false, value: 0, error: 'Pay amount is required' };
  }

  const num = Number(pay);
  if (isNaN(num)) {
    return { valid: false, value: 0, error: 'Pay amount must be a valid numeric value' };
  }

  if (num < 0) {
    return { valid: false, value: 0, error: 'Pay amount cannot be negative' };
  }

  if (num > 1000000) {
    return { valid: false, value: 0, error: 'Pay amount exceeds maximum allowable limit' };
  }

  return { valid: true, value: Math.round(num * 100) / 100 };
}

/**
 * Validates hazard report descriptions.
 * @param {string} desc
 * @returns {{ valid: boolean, sanitized: string, error?: string }}
 */
function validateHazardDescription(desc) {
  if (!desc || typeof desc !== 'string' || !desc.trim()) {
    return { valid: false, sanitized: '', error: 'Hazard description is required' };
  }

  const trimmed = desc.trim();
  if (trimmed.length < 3) {
    return { valid: false, sanitized: '', error: 'Hazard description must be at least 3 characters' };
  }

  if (trimmed.length > 2000) {
    return { valid: false, sanitized: '', error: 'Hazard description cannot exceed 2000 characters' };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validates worker sector.
 * @param {string} sector
 * @returns {string} Normalized sector ('construction' | 'hospital')
 */
function normalizeSector(sector) {
  if (!sector || typeof sector !== 'string') return 'construction';
  const norm = sector.trim().toLowerCase();
  return norm === 'hospital' ? 'hospital' : 'construction';
}

module.exports = {
  validateHours,
  validatePay,
  validateHazardDescription,
  normalizeSector
};
