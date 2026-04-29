// Created by Kiro
// Formatting Utilities Tests

import {
  formatDate,
  formatRelativeTime,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatFileSize,
  formatPhoneNumber,
  truncateText,
  capitalize,
  toTitleCase,
  toSlug,
  getInitials,
  formatDuration,
  maskEmail,
} from '../../src/utils/formatting';

describe('Formatting Utilities', () => {
  // Date formatting tests
  describe('formatDate', () => {
    const testDate = new Date('2024-01-15');

    it('should format date in short format', () => {
      const result = formatDate(testDate, 'short');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
    });

    it('should format date in long format', () => {
      const result = formatDate(testDate, 'long');
      expect(result).toContain('January');
      expect(result).toContain('15');
    });

    it('should handle invalid dates', () => {
      expect(formatDate('invalid')).toBe('Invalid date');
    });
  });

  // Relative time formatting tests
  describe('formatRelativeTime', () => {
    it('should format recent time as "just now"', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('just now');
    });

    it('should format time in minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toContain('minute');
    });

    it('should format time in hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo)).toContain('hour');
    });
  });

  // Number formatting tests
  describe('formatNumber', () => {
    it('should format number with thousand separators', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should format number with decimals', () => {
      expect(formatNumber(1234.567, 2)).toBe('1,234.57');
    });
  });

  // Currency formatting tests
  describe('formatCurrency', () => {
    it('should format currency in USD', () => {
      const result = formatCurrency(100);
      expect(result).toContain('100');
    });

    it('should format currency with decimals', () => {
      const result = formatCurrency(99.99);
      expect(result).toContain('99.99');
    });
  });

  // Percentage formatting tests
  describe('formatPercentage', () => {
    it('should format percentage', () => {
      expect(formatPercentage(50)).toBe('50%');
      expect(formatPercentage(33.33, 2)).toBe('33.33%');
    });
  });

  // File size formatting tests
  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(512)).toContain('Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toContain('KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toContain('MB');
    });
  });

  // Phone number formatting tests
  describe('formatPhoneNumber', () => {
    it('should format 10-digit phone number', () => {
      expect(formatPhoneNumber('9876543210')).toBe('(987) 654-3210');
    });

    it('should handle already formatted numbers', () => {
      const result = formatPhoneNumber('(987) 654-3210');
      expect(result).toContain('987');
    });
  });

  // Text truncation tests
  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = 'This is a long text that needs truncation';
      const result = truncateText(text, 20);
      expect(result).toHaveLength(20);
      expect(result).toContain('...');
    });

    it('should not truncate short text', () => {
      const text = 'Short';
      expect(truncateText(text, 20)).toBe('Short');
    });
  });

  // Capitalize tests
  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('HELLO');
    });
  });

  // Title case tests
  describe('toTitleCase', () => {
    it('should convert to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
      expect(toTitleCase('HELLO WORLD')).toBe('Hello World');
    });
  });

  // Slug tests
  describe('toSlug', () => {
    it('should convert to slug format', () => {
      expect(toSlug('Hello World')).toBe('hello-world');
      expect(toSlug('Hello  World')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(toSlug('Hello@World!')).toBe('helloworld');
    });
  });

  // Initials tests
  describe('getInitials', () => {
    it('should get initials from name', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Jane Smith')).toBe('JS');
    });

    it('should handle single name', () => {
      expect(getInitials('John')).toBe('J');
    });
  });

  // Duration formatting tests
  describe('formatDuration', () => {
    it('should format duration in seconds', () => {
      expect(formatDuration(45)).toContain('45s');
    });

    it('should format duration in minutes and seconds', () => {
      expect(formatDuration(125)).toContain('2m');
    });

    it('should format duration in hours, minutes, and seconds', () => {
      expect(formatDuration(3665)).toContain('1h');
    });
  });

  // Email masking tests
  describe('maskEmail', () => {
    it('should mask email address', () => {
      const result = maskEmail('john.doe@example.com');
      expect(result).toContain('@example.com');
      expect(result).toContain('*');
    });
  });
});
