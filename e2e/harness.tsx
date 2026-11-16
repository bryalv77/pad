import { useEditor } from '@tiptap/react'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import TextAlign from '@tiptap/extension-text-align'
import StarterKit from '@tiptap/starter-kit'
import { createRoot } from 'react-dom/client'
import { useRef, useState } from 'react'
import { PadEditorSurface } from '@/components/pad-editor-surface'
import type { FontId } from '@/lib/fonts'
import { markdownToHtml } from '@/lib/markdown'
import { draftFromPad, toMarkdownMode, toRichMode, type PadDraft } from '@/lib/pad-format'
import '@/index.css'

/** Same editor UI as production, with in-memory persistence so e2e needs no Firebase. */
function Harness() {
  const [draft, setDraft] = useState<PadDraft>(() =>
    draftFromPad({ content: '<h1>Hello</h1><p>World</p>' }),
  )
  const [saved, setSaved] = useState(draft)
  const fileInput = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ allowBase64: true }),
      Placeholder.configure({ placeholder: 'Start typing…' }),
    ],
    content: draft.content,
  })

  if (!editor) return null

  const commit = (partial: Partial<PadDraft>) => {
    const next = { ...draft, ...partial }
    setDraft(next)
    setSaved(next)
  }

  const toggleMode = () => {
    const next = draft.markdownMode ? toRichMode(draft) : toMarkdownMode(draft)
    commit(next)
    if (!next.markdownMode) editor.commands.setContent(next.content, { emitUpdate: false })
    else editor.commands.setContent('', { emitUpdate: false })
  }

  return (
    <div data-font={draft.font} data-mode={draft.markdownMode ? 'markdown' : 'rich'}>
      <PadEditorSurface
        draft={draft}
        editor={editor}
        fileInput={fileInput}
        onFontChange={(font: FontId) => commit({ font })}
        onToggleMode={toggleMode}
        onMarkdownChange={(markdown) => commit({ markdown, content: markdownToHtml(markdown), markdownMode: true })}
        onPickImage={() => fileInput.current?.click()}
        onFiles={() => {}}
      />
      <output data-testid="saved" data-saved={JSON.stringify(saved)} />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Harness />)
