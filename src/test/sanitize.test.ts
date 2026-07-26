import { describe, it, expect } from 'vitest';
import { escapeHtml, stripHtml, MAX_IMAGE_SIZE_BYTES, MAX_IMAGE_SIZE_LABEL } from '../utils/sanitize';

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('a&b')).toBe('a&amp;b');
  });

  it('escapes less-than signs', () => {
    expect(escapeHtml('a<b')).toBe('a&lt;b');
  });

  it('escapes greater-than signs', () => {
    expect(escapeHtml('a>b')).toBe('a&gt;b');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('a"b')).toBe('a&quot;b');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("a'b")).toBe('a&#039;b');
  });

  it('escapes multiple special characters in one string', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('returns plain text unchanged', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });

  it('handles all special chars together', () => {
    expect(escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#039;');
  });

  it('handles repeated special characters', () => {
    expect(escapeHtml('<<>>')).toBe('&lt;&lt;&gt;&gt;');
  });
});

describe('sanitize constants', () => {
  it('MAX_IMAGE_SIZE_BYTES is 10 MB', () => {
    expect(MAX_IMAGE_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });

  it('MAX_IMAGE_SIZE_LABEL is a human-readable string', () => {
    expect(MAX_IMAGE_SIZE_LABEL).toBe('10 MB');
  });
});

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello</p>')).toBe('Hello');
  });

  it('removes nested tags', () => {
    expect(stripHtml('<div><p>Nested</p></div>')).toBe('Nested');
  });

  it('returns text content between tags', () => {
    expect(stripHtml('<b>bold</b> and <i>italic</i>')).toBe('bold and italic');
  });

  it('handles self-closing tags', () => {
    expect(stripHtml('Hello<br/>World')).toBe('HelloWorld');
  });

  it('handles an empty string', () => {
    expect(stripHtml('')).toBe('');
  });

  it('returns plain text unchanged', () => {
    expect(stripHtml('Just text')).toBe('Just text');
  });

  it('handles malformed HTML with unclosed tags', () => {
    expect(stripHtml('<p>Unclosed')).toBe('Unclosed');
  });

  it('handles non-string input', () => {
    expect(stripHtml(null as unknown as string)).toBe('');
    expect(stripHtml(undefined as unknown as string)).toBe('');
  });

  it('normalizes whitespace', () => {
    expect(stripHtml('<div>  Lots   of   spaces  </div>')).toBe('Lots of spaces');
  });

  it('collapses adjacent block elements', () => {
    expect(stripHtml('<p>Line1</p><p>Line2</p>')).toBe('Line1Line2');
  });
});
