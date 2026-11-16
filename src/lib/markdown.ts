import DOMPurify from 'dompurify'
import { marked } from 'marked'
import TurndownService from 'turndown'

marked.setOptions({ gfm: true, breaks: true })

const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' })

/** Markdown -> sanitized HTML, safe to inject into the preview or the rich editor. */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return ''
  const html = marked.parse(markdown, { async: false }) as string
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  })
}

/** Rich-editor HTML -> Markdown, so switching modes never loses content. */
export function htmlToMarkdown(html: string): string {
  return html ? turndown.turndown(html) : ''
}
