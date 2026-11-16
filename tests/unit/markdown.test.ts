import { describe, expect, it } from 'vitest'
import { htmlToMarkdown, markdownToHtml } from '@/lib/markdown'

describe('markdownToHtml', () => {
  it('renders common markdown syntax', () => {
    const html = markdownToHtml('# Hello\n\nSome **bold** and *italic* text.\n\n- one\n- two\n\n[link](https://example.com)')
    expect(html).toContain('<h1>Hello</h1>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
    expect(html).toContain('<ul>')
    expect(html).toContain('<a href="https://example.com">link</a>')
  })

  it('returns empty string for empty input', () => {
    expect(markdownToHtml('')).toBe('')
  })

  it('strips scripts, event handlers and javascript: urls', () => {
    const html = markdownToHtml(
      '<script>alert(1)</script>\n\n<img src=x onerror="alert(2)">\n\n[click](javascript:alert(3))',
    )
    expect(html).not.toContain('<script')
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('javascript:')
    expect(html).not.toContain('alert(')
  })
})

describe('htmlToMarkdown', () => {
  it('converts rich editor html back into markdown', () => {
    const md = htmlToMarkdown('<h1>Title</h1><p>Some <strong>bold</strong> text.</p><ul><li>a</li><li>b</li></ul>')
    expect(md).toContain('# Title')
    expect(md).toContain('**bold**')
    expect(md).toMatch(/- +a/)
  })

  it('returns empty string for empty input', () => {
    expect(htmlToMarkdown('')).toBe('')
  })
})
