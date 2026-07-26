import DOMPurify from 'dompurify';

/**
 * Escapes HTML special characters to prevent XSS when interpolating
 * user-supplied strings into HTML templates.
 */
export const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Sanitizes a URL to prevent javascript: protocol and other dangerous schemes.
 * Returns the URL if safe, or undefined if unsafe.
 */
export const sanitizeUrl = (url: string): string | undefined => {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim().toLowerCase();
  // Block dangerous protocols
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return undefined;
  // Allow http, https, mailto, tel, and relative URLs
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(trimmed) || trimmed.startsWith('/')) {
    return url;
  }
  // If it looks like a relative path, allow it
  if (!trimmed.includes(':')) return url;
  return undefined;
};

/**
 * Strips HTML tags from a string, returning plain text.
 */
export const stripHtml = (html: string): string => {
  if (!html || typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }).replace(/\s+/g, ' ').trim();
};

/** Maximum allowed file size for image uploads (10 MB). */
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/** Human-readable label for the upload limit. */
export const MAX_IMAGE_SIZE_LABEL = '10 MB';

/** Allowed image MIME types */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/**
 * Validates that a file is an allowed image type and within size limits.
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    return { valid: false, error: `Invalid file type "${file.type}". Allowed: JPEG, PNG, WebP.` };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, error: `File size exceeds ${MAX_IMAGE_SIZE_LABEL} limit.` };
  }
  return { valid: true };
};
