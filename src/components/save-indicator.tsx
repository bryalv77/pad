import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { SaveStatus } from '@/components/pad-editor'
import { cn } from '@/lib/utils'

const CONFIRM_MS = 2000

/**
 * Google-Docs-style save indicator: a spinner while the write is pending, then a
 * brief animated "Synced" confirmation so finishing a sync is noticeable, before
 * settling back to a quiet "Saved" label.
 */
export function SaveIndicator({ status }: { status: SaveStatus }) {
  const [previous, setPrevious] = useState(status)
  const [confirming, setConfirming] = useState(false)

  // React's "adjust state when a prop changes" pattern — no setState-in-effect.
  if (status !== previous) {
    setPrevious(status)
    setConfirming(status === 'saved' && previous === 'saving')
  }

  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), CONFIRM_MS)
    return () => clearTimeout(timer)
  }, [confirming])

  const view = confirming
    ? {
        icon: <Check className="size-3.5" />,
        text: 'Synced',
        className: 'animate-in zoom-in-75 fade-in duration-200 text-foreground',
      }
    : status === 'saving'
      ? { icon: <Loader2 className="size-3.5 animate-spin" />, text: 'Saving…', className: '' }
      : status === 'error'
        ? { icon: <AlertCircle className="size-3.5 text-destructive" />, text: 'Not saved', className: '' }
        : { icon: <Check className="size-3.5" />, text: 'Saved', className: '' }

  return (
    <span
      key={confirming ? 'synced' : status}
      className={cn('mr-1 flex items-center gap-1 text-xs text-muted-foreground', view.className)}
    >
      {view.icon}
      {view.text}
    </span>
  )
}
