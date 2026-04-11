// src/utils/sanitize.ts

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

/** Maximum allowed file size for image uploads (10 MB). */
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/** Human-readable label for the upload limit. */
export const MAX_IMAGE_SIZE_LABEL = '10 MB';
