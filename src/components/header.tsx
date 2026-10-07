import { NotebookPen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/theme-toggle'

export function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
        <NotebookPen className="size-5" />
        Pad
      </Link>
      <div className="ml-auto flex items-center gap-1">
        {children}
        <ThemeToggle />
      </div>
    </header>
  )
}
