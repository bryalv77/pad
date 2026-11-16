import { useEditor, type Editor } from '@tiptap/react'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import TextAlign from '@tiptap/extension-text-align'
import StarterKit from '@tiptap/starter-kit'
import { onValue } from 'firebase/database'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { PadEditorSurface } from '@/components/pad-editor-surface'
import { ImageError, imageToDataUrl } from '@/lib/image'
import type { FontId } from '@/lib/fonts'
import { markdownToHtml } from '@/lib/markdown'
import { draftFromPad, toMarkdownMode, toRichMode, type PadDraft } from '@/lib/pad-format'
import { isExpired, MAX_CONTENT, padRef, savePad, type Pad } from '@/lib/pads'

export type SaveStatus = 'saved' | 'saving' | 'error'

interface Props {
  id: string
  initialContent: string
  initialMarkdown?: string
  initialFont?: FontId
  initialMarkdownMode?: boolean
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

/** Rich-text or Markdown editor kept in sync with a Realtime Database pad (last write wins). */
export function PadEditor({
  id,
  initialContent,
  initialMarkdown,
  initialFont,
  initialMarkdownMode,
  onStatus,
  onGone,
}: Props) {
  const [draft, setDraft] = useState<PadDraft>(() =>
    draftFromPad({
      content: initialContent,
      markdown: initialMarkdown,
      font: initialFont,
      markdownMode: initialMarkdownMode,
    }),
  )
  const draftRef = useRef(draft)
  const dirty = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const fileInput = useRef<HTMLInputElement>(null)
  const editorRef = useRef<Editor | null>(null)

  const commit = useCallback(
    (partial: Partial<PadDraft>) => {
      const next = { ...draftRef.current, ...partial }
      draftRef.current = next
      setDraft(next)
      dirty.current = true
      onStatus('saving')
      clearTimeout(timer.current)
      timer.current = setTimeout(async () => {
        try {
          await savePad(id, draftRef.current)
          dirty.current = false
          onStatus('saved')
        } catch {
          onStatus('error')
        }
      }, SAVE_DELAY)
    },
    [id, onStatus],
  )
  const commitRef = useRef(commit)
  useEffect(() => {
    commitRef.current = commit
  }, [commit])

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
    onUpdate: ({ editor: e }) => commitRef.current({ content: e.getHTML(), markdownMode: false }),
  })

  function toggleMode() {
    const next = draftRef.current.markdownMode ? toRichMode(draftRef.current) : toMarkdownMode(draftRef.current)
    commit(next)
    if (!next.markdownMode) editor?.commands.setContent(next.content, { emitUpdate: false })
  }

  function changeFont(font: FontId) {
    commit({ font })
  }

  function changeMarkdown(markdown: string) {
    commit({ markdown, content: markdownToHtml(markdown), markdownMode: true })
  }

  // Live updates from other people editing the same pad.
  useEffect(() => {
    if (!editor) return
    return onValue(padRef(id), (snap) => {
      const pad = snap.val() as Pad | null
      if (!pad || isExpired(pad)) return onGone()
      if (dirty.current) return
      const next = draftFromPad(pad)
      draftRef.current = next
      setDraft(next)
      if (!next.markdownMode) editor.commands.setContent(next.content, { emitUpdate: false })
    })
  }, [editor, id, onGone])

  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  if (!editor) return null

  return (
    <PadEditorSurface
      draft={draft}
      editor={editor}
      fileInput={fileInput}
      onFontChange={changeFont}
      onToggleMode={toggleMode}
      onMarkdownChange={changeMarkdown}
      onPickImage={() => fileInput.current?.click()}
      onFiles={(files) => void insertImages(editor, imageFiles(files))}
    />
  )
}
