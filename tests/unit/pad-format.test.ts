import { describe, expect, it } from 'vitest'
import { DEFAULT_FONT } from '@/lib/fonts'
import { draftFromPad, toMarkdownMode, toRichMode } from '@/lib/pad-format'

describe('pad format', () => {
  it('fills in defaults for pads saved before fonts and markdown existed', () => {
    const draft = draftFromPad({ content: '<p>old pad</p>' })
    expect(draft).toEqual({
      content: '<p>old pad</p>',
      markdown: '',
      font: DEFAULT_FONT,
      markdownMode: false,
    })
  })

  it('keeps a valid stored font and markdown', () => {
    const draft = draftFromPad({ content: '<h1>Hi</h1>', markdown: '# Hi', font: 'georgia', markdownMode: true })
    expect(draft.font).toBe('georgia')
    expect(draft.markdown).toBe('# Hi')
    expect(draft.markdownMode).toBe(true)
  })

  it('falls back to the default font for corrupt stored values', () => {
    expect(draftFromPad({ content: '', font: 'wingdings' }).font).toBe(DEFAULT_FONT)
  })

  it('converts rich html to markdown when switching to markdown mode', () => {
    const draft = draftFromPad({ content: '<h1>Title</h1><p><strong>Bold</strong></p>' })
    const next = toMarkdownMode(draft)
    expect(next.markdownMode).toBe(true)
    expect(next.markdown).toContain('# Title')
    expect(next.markdown).toContain('**Bold**')
    expect(next.content).toBe(draft.content)
  })

  it('converts markdown to html when switching back to rich mode', () => {
    const draft = draftFromPad({ content: '', markdown: '# Title\n\nHello' })
    const next = toRichMode(draft)
    expect(next.markdownMode).toBe(false)
    expect(next.content).toContain('<h1>Title</h1>')
    expect(next.content).toContain('Hello')
    expect(next.markdown).toBe(draft.markdown)
  })

  it('round-trips content through both modes without losing text', () => {
    const original = draftFromPad({ content: '<h1>Notes</h1><ul><li>one</li><li>two</li></ul>' })
    const markdown = toMarkdownMode(original)
    const rich = toRichMode(markdown)
    expect(rich.content).toContain('Notes')
    expect(rich.content).toContain('one')
    expect(rich.content).toContain('two')
  })
})
