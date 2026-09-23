/**
 * Chat message formatting — WhatsApp-style markers, so members already know them:
 *   *bold*   _italic_   ~strikethrough~   (**bold** also works)
 * A marker only counts when it hugs the text and sits at a word boundary, so
 * things like snake_case_names or 2*3*4 are left alone. Line breaks are kept
 * as typed (the bubble uses white-space: pre-wrap).
 *
 * Messages are stored as plain text; formatting is applied only when shown,
 * and always as React elements (never HTML), so it can't inject markup.
 */

// $1 = boundary before, then one of: **bold** | *bold* | _italic_ | ~strike~
export const FORMAT_RE =
  /(^|[^\w*_~])(?:\*\*(?=\S)([^\n]*?\S)\*\*|\*(?=\S)([^*\n]*?\S)\*|_(?=\S)([^_\n]*?\S)_|~(?=\S)([^~\n]*?\S)~)(?=$|[^\w*_~])/g

/**
 * Split a message into plain-text and formatted pieces.
 * @returns {{ type: 'text'|'bold'|'italic'|'strike', text: string }[]}
 */
export function parseMessage(text = '') {
  const parts = []
  let last = 0
  FORMAT_RE.lastIndex = 0
  let m
  while ((m = FORMAT_RE.exec(text))) {
    const start = m.index + m[1].length
    if (start > last) parts.push({ type: 'text', text: text.slice(last, start) })
    if (m[2] !== undefined || m[3] !== undefined) parts.push({ type: 'bold', text: m[2] ?? m[3] })
    else if (m[4] !== undefined) parts.push({ type: 'italic', text: m[4] })
    else parts.push({ type: 'strike', text: m[5] })
    last = FORMAT_RE.lastIndex
  }
  if (last < text.length) parts.push({ type: 'text', text: text.slice(last) })
  return parts
}

/** Plain one-line version for previews, notifications and emails. */
export function stripFormatting(text = '') {
  return parseMessage(text).map((p) => p.text).join('').replace(/\s*\n+\s*/g, ' ').trim()
}
