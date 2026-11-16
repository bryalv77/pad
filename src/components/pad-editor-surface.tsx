import type { Editor } from '@tiptap/react'
import { EditorContent } from '@tiptap/react'
import { FileText } from 'lucide-react'
import type { RefObject } from 'react'
import { FontPicker } from '@/components/font-picker'
import { MarkdownEditor } from '@/components/markdown-editor'
import { Toolbar } from '@/components/toolbar'
import { fontStack, type FontId } from '@/lib/fonts'
import type { PadDraft } from '@/lib/pad-format'
import { IMAGE_ACCEPT } from '@/lib/image'

interface Props {
  draft: PadDraft
  editor: Editor
  fileInput: RefObject<HTMLInputElement | null>
  onFontChange: (font: FontId) => void
  onToggleMode: () => void
  onMarkdownChange: (markdown: string) => void
  onPickImage: () => void
  onFiles: (files: FileList | null) => void
}

/** Pure editor UI, shared by the live pad and the browser-test harness. */
export function PadEditorSurface({
  draft,
  editor,
  fileInput,
  onFontChange,
  onToggleMode,
  onMarkdownChange,
  onPickImage,
  onFiles,
}: Props) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col sm:p-4">
      <div className="flex flex-1 flex-col overflow-hidden border bg-card shadow-sm sm:rounded-xl">
        <input
          ref={fileInput}
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            onFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <div className="flex flex-wrap items-center gap-2 border-b bg-card px-2 py-1.5">
          <FontPicker value={draft.font} onChange={onFontChange} />
          <div className="mx-1 h-5 w-px bg-border" />
          <button
            type="button"
            aria-label="Markdown mode"
            aria-pressed={draft.markdownMode}
            onClick={onToggleMode}
            data-active={draft.markdownMode}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium data-[active=true]:bg-muted"
          >
            <FileText className="size-3.5" /> Markdown
          </button>
        </div>
        {draft.markdownMode ? (
          <MarkdownEditor value={draft.markdown} onChange={onMarkdownChange} font={draft.font} />
        ) : (
          <>
            <Toolbar editor={editor} onPickImage={onPickImage} />
            <EditorContent
              editor={editor}
              style={{ fontFamily: fontStack(draft.font) }}
              className="pad-prose flex flex-1 cursor-text flex-col"
              onClick={() => editor.commands.focus()}
            />
          </>
        )}
      </div>
    </div>
  )
}
