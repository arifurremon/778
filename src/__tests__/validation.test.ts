import { describe, it, expect } from 'vitest';
import { sanitizeUserInput, sanitizePostContent, validateFileUpload } from '@/lib/sanitize';

describe('Input Validation & Sanitization Tests', () => {
  describe('sanitizeUserInput', () => {
    it('should remove all HTML tags from standard user input', () => {
      const input = '<script>alert("xss")</script>Hello <b>World</b>';
      const output = sanitizeUserInput(input);
      expect(output).toBe('Hello World');
    });

    it('should handle empty strings', () => {
      expect(sanitizeUserInput('')).toBe('');
    });

    it('should return plain text unchanged', () => {
      const input = 'This is a normal user biography.';
      expect(sanitizeUserInput(input)).toBe(input);
    });
    
    it('should strip out iframe and malicious tags', () => {
      const input = '<iframe src="malicious.com"></iframe>SafeText';
      expect(sanitizeUserInput(input)).toBe('SafeText');
    });
  });

  describe('sanitizePostContent', () => {
    it('should allow safe HTML formatting like bold and italic', () => {
      const input = 'This is <b>bold</b> and <i>italic</i>';
      const output = sanitizePostContent(input);
      expect(output).toBe('This is <b>bold</b> and <i>italic</i>');
    });

    it('should remove script tags but keep safe HTML', () => {
      const input = '<script>alert(1)</script><p>Hello</p>';
      const output = sanitizePostContent(input);
      expect(output).toBe('<p>Hello</p>');
    });

    it('should remove onclick handlers from safe tags', () => {
      const input = '<a href="http://example.com" onclick="steal()">Click me</a>';
      const output = sanitizePostContent(input);
      // DOMPurify removes the onclick attribute
      expect(output).toContain('href="http://example.com"');
      expect(output).not.toContain('onclick');
    });
  });

  describe('validateFileUpload', () => {
    it('should accept valid image files under 10MB', () => {
      const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
      expect(validateFileUpload(file)).toBe(true);
    });

    it('should reject files exceeding the 10MB size limit', () => {
      // Mocking a large file by overriding size property
      const file = new File([''], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
      
      expect(validateFileUpload(file)).toBe(false);
    });

    it('should reject invalid file types', () => {
      const file = new File(['dummy content'], 'test.exe', { type: 'application/x-msdownload' });
      expect(validateFileUpload(file)).toBe(false);
    });
  });
});
