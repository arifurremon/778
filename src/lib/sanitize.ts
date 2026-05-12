import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes post content allowing safe formatting (bold, italic, etc).
 */
export function sanitizePostContent(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
  });
}

/**
 * Sanitizes user input, stripping all HTML entirely.
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Validates file upload (type and size).
 * Returns true if valid, false otherwise.
 */
export function validateFileUpload(file: File): boolean {
  if (!file) return false;
  
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) return false;

  const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!validTypes.includes(file.type)) return false;

  return true;
}
