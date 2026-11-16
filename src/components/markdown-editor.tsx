import { useMemo, useState } from 'react'
import { Eye, Pencil } from 'lucide-react'
import { fontStack, type FontId } from '@/lib/fonts'
import { markdownToHtml } from '@/lib/markdown'

interface Props {
  value: string
  onChange: (markdown: string) => void
  font: FontId
}

type View = 'write' | 'preview'

/** Markdown source editor with a toggleable read-only rendered preview. */
export function MarkdownEditor({ value, onChange, font }: Props) {
  const [view, setView] = useState<View>('write')
  const html = useMemo(() => markdownToHtml(value), [value])
  const family = fontStack(font)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-1 border-b bg-card px-2 py-1.5">
        <button
          type="button"
          aria-label="Write"
          aria-pressed={view === 'write'}
          onClick={() => setView('write')}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium data-[active=true]:bg-muted"
          data-active={view === 'write'}
        >
          <Pencil className="size-3.5" /> Write
        </button>
        <button
          type="button"
          aria-label="Preview"
          aria-pressed={view === 'preview'}
          onClick={() => setView('preview')}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium data-[active=true]:bg-muted"
          data-active={view === 'preview'}
        >
          <Eye className="size-3.5" /> Preview
        </button>
      </div>

      {view === 'write' ? (
        <textarea
          aria-label="Markdown source"
          spellCheck
          value={value}
          onChange={(event) => onChange(event.target.value)}
          style={{ fontFamily: family }}
          className="pad-markdown-source min-h-60svh flex-1 resize-none bg-transparent p-6 text-base leading-7 outline-none sm:p-10"
        />
      ) : (
        <div
          data-testid="markdown-preview"
          className="pad-prose overflow-auto"
          style={{ fontFamily: family }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  )
}
