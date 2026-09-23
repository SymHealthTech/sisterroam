// Quick check: node e2e/sanitize.check.mjs — the story sanitizer must neutralise
// common XSS payloads and keep the editor's normal formatting.
import { sanitizeStoryHtml, safeJsonLd } from '../src/lib/sanitize.js'

const cases = [
  '<img src=x onerror=alert(1)>',
  '<svg/onload=alert(1)>',
  '<a href="javascript:alert(1)">x</a>',
  '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
  '<p style="background:url(x)" onclick=alert(1)>hi</p>',
  '<IMG SRC="jav&#x09;ascript:alert(1)">',
  '<scr<script>ipt>alert(1)</script>',
  '<h2>Title</h2><p><b>bold</b> <a href="https://ok.com">link</a></p><img src="https://res.cloudinary.com/x.jpg" alt="a">',
]
let bad = 0
for (const c of cases) {
  const out = sanitizeStoryHtml(c)
  const unsafe = /on\w+\s*=|javascript:|<script|<iframe|<svg|style=/i.test(out)
  if (unsafe) bad++
  console.log(unsafe ? 'UNSAFE' : 'ok    ', JSON.stringify(c), '=>', JSON.stringify(out))
}
const ld = safeJsonLd({ t: '</script><script>alert(1)</script>' })
console.log(ld.includes('</script>') ? 'UNSAFE' : 'ok    ', 'json-ld', ld)
process.exit(bad || ld.includes('</script>') ? 1 : 0)
