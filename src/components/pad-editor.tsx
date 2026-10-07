import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import TextAlign from '@tiptap/extension-text-align'
import StarterKit from '@tiptap/starter-kit'
import { onValue } from 'firebase/database'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Toolbar } from '@/components/toolbar'
import { IMAGE_ACCEPT, ImageError, imageToDataUrl } from '@/lib/image'
import { isExpired, MAX_CONTENT, padRef, savePad, type Pad } from '@/lib/pads'

export type SaveStatus = 'saved' | 'saving' | 'error'

interface Props {
  id: string
  initialContent: string
  onStatus: (status: SaveStatus) => void
  onGone: () => void
}

async function insertImages(editor: Editor, files: File[]) {
  for (const file of files) {
    try {
      const src = await imageToDataUrl(file)
      if (editor.getHTML().length + src.length > MAX_CONTENT) {
        toast.error('This pad is full. Remove some content or images first.')
        return
      }
      editor.chain().focus().setImage({ src }).run()
    } catch (e) {
      toast.error(e instanceof ImageError ? e.message : 'Could not add that image.')
    }
  }
}

const imageFiles = (list?: FileList | null) =>
  Array.from(list ?? []).filter((f) => f.type.startsWith('image/'))

const SAVE_DELAY = 1500 // the database rules allow one write per second per pad

/** Rich-text editor kept in sync with a Realtime Database pad (last write wins). */
export function PadEditor({ id, initialContent, onStatus, onGone }: Props) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const dirty = useRef(false)
  const lastSynced = useRef(initialContent)
  const fileInput = useRef<HTMLInputElement>(null)
  const editorRef = useRef<Editor | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ allowBase64: true }),
      Placeholder.configure({ placeholder: 'Start typing…' }),
    ],
    content: initialContent,
    editorProps: {
      attributes: { class: 'pad-prose', spellcheck: 'true' },
      handlePaste: (_view, event) => {
        const files = imageFiles(event.clipboardData?.files)
        if (!files.length || !editorRef.current) return false
        void insertImages(editorRef.current, files)
        return true
      },
      handleDrop: (_view, event) => {
        const files = imageFiles(event.dataTransfer?.files)
        if (!files.length || !editorRef.current) return false
        void insertImages(editorRef.current, files)
        return true
      },
    },
    onUpdate: ({ editor }) => {
      dirty.current = true
      onStatus('saving')
      clearTimeout(timer.current)
      timer.current = setTimeout(async () => {
        const html = editor.getHTML()
        if (html.length > MAX_CONTENT) return onStatus('error')
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

  editorRef.current = editor
  if (!editor) return null
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
            void insertImages(editor, imageFiles(e.target.files))
            e.target.value = ''
          }}
        />
        <Toolbar editor={editor} onPickImage={() => fileInput.current?.click()} />
        <EditorContent editor={editor} className="flex flex-1 cursor-text flex-col" onClick={() => editor.commands.focus()} />
      </div>
    </div>
  )
}
