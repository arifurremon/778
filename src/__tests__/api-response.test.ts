import { describe, it, expect } from 'vitest';
import { formatAPIError } from '@/lib/error-handler';

describe('API Response Formatting Tests', () => {
  describe('formatAPIError', () => {
    it('should format a standard Error object correctly in test environment', () => {
      const error = new Error('Test error message');
      const formatted = formatAPIError(error);
      
      expect(formatted).toEqual({
        code: 'INTERNAL_ERROR',
        message: 'Test error message', // in non-production, it returns the error message
        statusCode: 500
      });
    });

    it('should handle null or undefined input gracefully', () => {
      const formatted = formatAPIError(null);
      
      expect(formatted).toEqual({
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
        statusCode: 500
      });
    });

    it('should format a generic string error', () => {
      const formatted = formatAPIError('Something went wrong');
      
      expect(formatted).toEqual({
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
        statusCode: 500
      });
    });
  });
});
