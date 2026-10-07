import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Toggle } from '@/components/ui/toggle'

function Tool({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Toggle
      size="sm"
      aria-label={label}
      title={label}
      pressed={!!active}
      disabled={disabled}
      onPressedChange={onClick}
      onMouseDown={(e) => e.preventDefault()}
    >
      {children}
    </Toggle>
  )
}

const Sep = () => <Separator orientation="vertical" className="mx-1 h-5" />

export function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h1: e.isActive('heading', { level: 1 }),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      code: e.isActive('code'),
      link: e.isActive('link'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      task: e.isActive('taskList'),
      quote: e.isActive('blockquote'),
      left: e.isActive({ textAlign: 'left' }),
      center: e.isActive({ textAlign: 'center' }),
      right: e.isActive({ textAlign: 'right' }),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })
  const run = () => editor.chain().focus()

  function setLink() {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL (leave empty to remove)', prev ?? 'https://')
    if (url === null) return
    if (url.trim() === '') run().unsetLink().run()
    else run().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-card px-2 py-1.5">
      <Tool label="Undo" disabled={!s.canUndo} onClick={() => run().undo().run()}><Undo2 /></Tool>
      <Tool label="Redo" disabled={!s.canRedo} onClick={() => run().redo().run()}><Redo2 /></Tool>
      <Sep />
      <Tool label="Heading 1" active={s.h1} onClick={() => run().toggleHeading({ level: 1 }).run()}>
        <span className="text-xs font-bold">H1</span>
      </Tool>
      <Tool label="Heading 2" active={s.h2} onClick={() => run().toggleHeading({ level: 2 }).run()}>
        <span className="text-xs font-bold">H2</span>
      </Tool>
      <Tool label="Heading 3" active={s.h3} onClick={() => run().toggleHeading({ level: 3 }).run()}>
        <span className="text-xs font-bold">H3</span>
      </Tool>
      <Sep />
      <Tool label="Bold" active={s.bold} onClick={() => run().toggleBold().run()}><Bold /></Tool>
      <Tool label="Italic" active={s.italic} onClick={() => run().toggleItalic().run()}><Italic /></Tool>
      <Tool label="Underline" active={s.underline} onClick={() => run().toggleUnderline().run()}><Underline /></Tool>
      <Tool label="Strikethrough" active={s.strike} onClick={() => run().toggleStrike().run()}><Strikethrough /></Tool>
      <Tool label="Code" active={s.code} onClick={() => run().toggleCode().run()}><Code /></Tool>
      <Tool label="Link" active={s.link} onClick={setLink}><LinkIcon /></Tool>
      <Sep />
      <Tool label="Align left" active={s.left} onClick={() => run().setTextAlign('left').run()}><AlignLeft /></Tool>
      <Tool label="Align center" active={s.center} onClick={() => run().setTextAlign('center').run()}><AlignCenter /></Tool>
      <Tool label="Align right" active={s.right} onClick={() => run().setTextAlign('right').run()}><AlignRight /></Tool>
      <Sep />
      <Tool label="Bullet list" active={s.bullet} onClick={() => run().toggleBulletList().run()}><List /></Tool>
      <Tool label="Numbered list" active={s.ordered} onClick={() => run().toggleOrderedList().run()}><ListOrdered /></Tool>
      <Tool label="Checklist" active={s.task} onClick={() => run().toggleTaskList().run()}><ListChecks /></Tool>
      <Tool label="Quote" active={s.quote} onClick={() => run().toggleBlockquote().run()}><Quote /></Tool>
      <Tool label="Divider" onClick={() => run().setHorizontalRule().run()}><Minus /></Tool>
    </div>
  )
}
