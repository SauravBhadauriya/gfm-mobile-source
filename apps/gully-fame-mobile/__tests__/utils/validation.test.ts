// Created by Kiro
// Validation Utilities Tests

import {
  isValidEmail,
  isValidMobile,
  validatePassword,
  isValidUrl,
  isValidUsername,
  isValidDate,
  isValidAge,
  isValidOTP,
  isRequired,
  minLength,
  maxLength,
  matches,
} from '../../src/utils/validation';

describe('Validation Utilities', () => {
  // Email validation tests
  describe('isValidEmail', () => {
    it('should validate correct email format', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email format', () => {
      expect(isValidEmail('invalid.email')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
  });

  // Mobile validation tests
  describe('isValidMobile', () => {
    it('should validate 10-digit mobile number', () => {
      expect(isValidMobile('9876543210')).toBe(true);
      expect(isValidMobile('(987) 654-3210')).toBe(true);
    });

    it('should reject invalid mobile numbers', () => {
      expect(isValidMobile('123')).toBe(false);
      expect(isValidMobile('12345678901')).toBe(false);
      expect(isValidMobile('abcdefghij')).toBe(false);
    });
  });

  // Password validation tests
  describe('validatePassword', () => {
    it('should validate strong password', () => {
      const result = validatePassword('StrongPass123');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('should identify weak password', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
    });

    it('should check password requirements', () => {
      const result = validatePassword('Test1234');
      expect(result.checks.length).toBe(true);
      expect(result.checks.lowercase).toBe(true);
      expect(result.checks.uppercase).toBe(true);
      expect(result.checks.numbers).toBe(true);
      expect(result.checks.special).toBe(false);
    });
  });

  // URL validation tests
  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://www.example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('example')).toBe(false);
    });
  });

  // Username validation tests
  describe('isValidUsername', () => {
    it('should validate correct username', () => {
      expect(isValidUsername('user_name')).toBe(true);
      expect(isValidUsername('user-123')).toBe(true);
    });

    it('should reject invalid username', () => {
      expect(isValidUsername('ab')).toBe(false); // Too short
      expect(isValidUsername('user@name')).toBe(false); // Invalid character
    });
  });

  // Date validation tests
  describe('isValidDate', () => {
    it('should validate correct date format', () => {
      expect(isValidDate('2024-01-15')).toBe(true);
      expect(isValidDate('2000-12-31')).toBe(true);
    });

    it('should reject invalid date format', () => {
      expect(isValidDate('01-15-2024')).toBe(false);
      expect(isValidDate('2024/01/15')).toBe(false);
      expect(isValidDate('invalid')).toBe(false);
    });
  });

  // Age validation tests
  describe('isValidAge', () => {
    it('should validate age 18 or older', () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 20);
      expect(isValidAge(dob.toISOString().split('T')[0])).toBe(true);
    });

    it('should reject age under 18', () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 15);
      expect(isValidAge(dob.toISOString().split('T')[0])).toBe(false);
    });
  });

  // OTP validation tests
  describe('isValidOTP', () => {
    it('should validate 6-digit OTP', () => {
      expect(isValidOTP('123456')).toBe(true);
      expect(isValidOTP('000000')).toBe(true);
    });

    it('should reject invalid OTP', () => {
      expect(isValidOTP('12345')).toBe(false); // Too short
      expect(isValidOTP('1234567')).toBe(false); // Too long
      expect(isValidOTP('abcdef')).toBe(false); // Non-numeric
    });
  });

  // Required field validation tests
  describe('isRequired', () => {
    it('should validate non-empty values', () => {
      expect(isRequired('text')).toBe(true);
      expect(isRequired('0')).toBe(true);
    });

    it('should reject empty values', () => {
      expect(isRequired('')).toBe(false);
      expect(isRequired('   ')).toBe(false);
      expect(isRequired(null)).toBe(false);
      expect(isRequired(undefined)).toBe(false);
    });
  });

  // Min length validation tests
  describe('minLength', () => {
    it('should validate minimum length', () => {
      expect(minLength('hello', 5)).toBe(true);
      expect(minLength('hello', 3)).toBe(true);
    });

    it('should reject below minimum length', () => {
      expect(minLength('hi', 5)).toBe(false);
    });
  });

  // Max length validation tests
  describe('maxLength', () => {
    it('should validate maximum length', () => {
      expect(maxLength('hello', 5)).toBe(true);
      expect(maxLength('hello', 10)).toBe(true);
    });

    it('should reject above maximum length', () => {
      expect(maxLength('hello', 3)).toBe(false);
    });
  });

  // Matches validation tests
  describe('matches', () => {
    it('should validate matching values', () => {
      expect(matches('password', 'password')).toBe(true);
      expect(matches(123, 123)).toBe(true);
    });

    it('should reject non-matching values', () => {
      expect(matches('password', 'different')).toBe(false);
      expect(matches(123, 456)).toBe(false);
    });
  });
});
