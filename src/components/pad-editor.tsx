import { EditorContent, useEditor } from '@tiptap/react'
import Placeholder from '@tiptap/extension-placeholder'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import TextAlign from '@tiptap/extension-text-align'
import StarterKit from '@tiptap/starter-kit'
import { onValue } from 'firebase/database'
import { useEffect, useRef } from 'react'
import { Toolbar } from '@/components/toolbar'
import { isExpired, padRef, savePad, type Pad } from '@/lib/pads'

export type SaveStatus = 'saved' | 'saving' | 'error'

interface Props {
  id: string
  initialContent: string
  onStatus: (status: SaveStatus) => void
  onGone: () => void
}

const SAVE_DELAY = 500

/** Rich-text editor kept in sync with a Realtime Database pad (last write wins). */
export function PadEditor({ id, initialContent, onStatus, onGone }: Props) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const dirty = useRef(false)
  const lastSynced = useRef(initialContent)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Start typing…' }),
    ],
    content: initialContent,
    editorProps: { attributes: { class: 'pad-prose', spellcheck: 'true' } },
    onUpdate: ({ editor }) => {
      dirty.current = true
      onStatus('saving')
      clearTimeout(timer.current)
      timer.current = setTimeout(async () => {
        const html = editor.getHTML()
        try {
          await savePad(id, html)
          lastSynced.current = html
          dirty.current = html !== editor.getHTML()
          if (!dirty.current) onStatus('saved')
        } catch {
          onStatus('error')
        }
      }, SAVE_DELAY)
    },
  })

  // Live updates from other people editing the same pad.
  useEffect(() => {
    if (!editor) return
    return onValue(padRef(id), (snap) => {
      const pad = snap.val() as Pad | null
      if (!pad || isExpired(pad)) return onGone()
      if (dirty.current || pad.content === lastSynced.current) return
      lastSynced.current = pad.content
      editor.commands.setContent(pad.content, { emitUpdate: false })
    })
  }, [editor, id, onGone])

  useEffect(() => () => clearTimeout(timer.current), [])

  if (!editor) return null
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col sm:p-4">
      <div className="flex flex-1 flex-col overflow-hidden border bg-card shadow-sm sm:rounded-xl">
        <Toolbar editor={editor} />
        <EditorContent editor={editor} className="flex flex-1 cursor-text flex-col" onClick={() => editor.commands.focus()} />
      </div>
    </div>
  )
}
