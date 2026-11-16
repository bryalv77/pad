import { DEFAULT_FONT, isFontId, type FontId } from '@/lib/fonts'
import { htmlToMarkdown, markdownToHtml } from '@/lib/markdown'

export interface PadDraft {
  content: string
  markdown: string
  font: FontId
  markdownMode: boolean
}

type StoredPad = Partial<PadDraft>

export const defaultDraft = (): PadDraft => ({
  content: '',
  markdown: '',
  font: DEFAULT_FONT,
  markdownMode: false,
})

/** Normalize stored pad data, including pads created before fonts/markdown existed. */
export const draftFromPad = (pad: StoredPad): PadDraft => ({
  content: typeof pad.content === 'string' ? pad.content : '',
  markdown: typeof pad.markdown === 'string' ? pad.markdown : '',
  font: isFontId(pad.font) ? pad.font : DEFAULT_FONT,
  markdownMode: Boolean(pad.markdownMode),
})

/** Rich HTML -> Markdown source when entering markdown mode. */
export const toMarkdownMode = (draft: PadDraft): PadDraft => ({
  ...draft,
  markdownMode: true,
  markdown: draft.markdown || htmlToMarkdown(draft.content),
})

/** Markdown source -> HTML when leaving markdown mode. */
export const toRichMode = (draft: PadDraft): PadDraft => ({
  ...draft,
  markdownMode: false,
  content: markdownToHtml(draft.markdown),
})
