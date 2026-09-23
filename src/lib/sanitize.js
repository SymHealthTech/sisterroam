import sanitizeHtml from 'sanitize-html'

/**
 * Travel-story HTML comes from members (contentEditable editor), so it is
 * untrusted. Allow-list only what the editor produces; everything else —
 * scripts, event handlers (quoted or not), javascript:/data: URLs, iframes,
 * styles — is removed. Run on save AND on read (covers stories saved before
 * this existed).
 */
const STORY_OPTIONS = {
  allowedTags: [
    'p', 'br', 'div', 'span', 'hr',
    'b', 'strong', 'i', 'em', 'u', 's', 'strike',
    'h1', 'h2', 'h3', 'h4',
    'ul', 'ol', 'li', 'blockquote',
    'a', 'img',
  ],
  allowedAttributes: {
    a: ['href', 'title'],
    img: ['src', 'alt'],
  },
  allowedSchemes: ['https', 'http', 'mailto'],
  allowedSchemesByTag: { img: ['https'] },
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow', target: '_blank' }),
  },
}

export function sanitizeStoryHtml(html) {
  if (typeof html !== 'string') return ''
  return sanitizeHtml(html, {
    ...STORY_OPTIONS,
    allowedAttributes: { ...STORY_OPTIONS.allowedAttributes, a: ['href', 'title', 'rel', 'target'] },
  })
}

/**
 * JSON for a <script type="application/ld+json"> tag. JSON.stringify alone
 * lets a value containing "</script>" close the tag and inject HTML, so escape
 * the characters that matter inside a script element.
 */
export function safeJsonLd(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .split(String.fromCharCode(0x2028)).join('\\u2028')
    .split(String.fromCharCode(0x2029)).join('\\u2029')
}
