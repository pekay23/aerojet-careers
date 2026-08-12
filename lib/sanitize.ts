import DOMPurify from 'dompurify'

/**
 * Sanitizes HTML strings to prevent XSS attacks.
 * Uses DOMPurify with a strict configuration that strips all dangerous elements and attributes.
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof dirty !== 'string') return ''
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'strong', 'span'],
    ALLOWED_ATTR: ['href', 'title', 'class'],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
  })
}

/**
 * Sanitizes a string by escaping HTML entities.
 * Use this for plain text that should never contain HTML.
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') return ''
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
