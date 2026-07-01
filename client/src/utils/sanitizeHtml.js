import DOMPurify from 'dompurify';

/**
 * Sanitize a rich-text/HTML string before rendering it via
 * `dangerouslySetInnerHTML`. Strips <script>, event handlers (onerror,
 * onclick, ...), javascript: URLs, etc. while preserving normal formatting
 * tags (bold/italic/lists/links/etc.) authored via the app's rich text
 * editors (quiz questions, announcements, descriptions, email previews).
 *
 * @param {string|null|undefined} html
 * @returns {string} sanitized HTML safe to render
 */
export function sanitizeHtml(html) {
  if (!html) return '';
  return DOMPurify.sanitize(html);
}

export default sanitizeHtml;
