/**
 * Unit Tests for Input Validation, Data Sanitization, and Boundary Enforcement
 */

'use strict';

const {
  validateHours,
  validatePay,
  validateHazardDescription,
  normalizeSector
} = require('../logic/validator');
const { sanitizeString } = require('../middleware/security');

describe('Input Validation & Data Sanitization (logic/validator.js & middleware/security.js)', () => {
  describe('validateHours', () => {
    test('accepts valid shift hours within weekly boundary', () => {
      const res = validateHours(45);
      expect(res.valid).toBe(true);
      expect(res.value).toBe(45);
    });

    test('rejects negative hours', () => {
      const res = validateHours(-8);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/cannot be negative/i);
    });

    test('rejects hours exceeding statutory weekly maximum of 168', () => {
      const res = validateHours(170);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/cannot exceed 168/i);
    });

    test('rejects non-numeric hours input', () => {
      const res = validateHours('forty');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/valid number/i);
    });

    test('rejects missing or empty hours input', () => {
      expect(validateHours(null).valid).toBe(false);
      expect(validateHours('').valid).toBe(false);
    });
  });

  describe('validatePay', () => {
    test('accepts valid pay amount', () => {
      const res = validatePay(3800.50);
      expect(res.valid).toBe(true);
      expect(res.value).toBe(3800.50);
    });

    test('rejects negative pay', () => {
      const res = validatePay(-100);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/cannot be negative/i);
    });

    test('rejects non-numeric pay input', () => {
      const res = validatePay('invalid_amount');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/numeric value/i);
    });
  });

  describe('validateHazardDescription', () => {
    test('accepts valid workplace hazard description', () => {
      const res = validateHazardDescription('Chemical leak detected near ICU');
      expect(res.valid).toBe(true);
      expect(res.sanitized).toBe('Chemical leak detected near ICU');
    });

    test('rejects empty or whitespace hazard description', () => {
      const res = validateHazardDescription('   ');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/required/i);
    });

    test('rejects overly short hazard description (< 3 chars)', () => {
      const res = validateHazardDescription('no');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/at least 3 characters/i);
    });
  });

  describe('normalizeSector', () => {
    test('normalizes hospital variations', () => {
      expect(normalizeSector('hospital')).toBe('hospital');
      expect(normalizeSector('HOSPITAL')).toBe('hospital');
      expect(normalizeSector('  Hospital  ')).toBe('hospital');
    });

    test('defaults to construction for unknown sectors', () => {
      expect(normalizeSector('construction')).toBe('construction');
      expect(normalizeSector('mining')).toBe('construction');
      expect(normalizeSector(null)).toBe('construction');
    });
  });

  describe('sanitizeString', () => {
    test('strips dangerous HTML and script tags', () => {
      const raw = '<script>alert("xss")</script><b>Worker</b>';
      const clean = sanitizeString(raw);
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('&lt;script&gt;');
    });
  });
});
