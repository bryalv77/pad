import { AlertCircle, Check, Cloud, Copy, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Header } from '@/components/header'
import { PadEditor, type SaveStatus } from '@/components/pad-editor'
import { Button } from '@/components/ui/button'
import { getPad, isValidId, type Pad } from '@/lib/pads'

type State = { kind: 'loading' } | { kind: 'missing' } | { kind: 'error' } | { kind: 'ready'; pad: Pad }

function expiryLabel(expiresAt: number) {
  if (expiresAt === 0) return 'Never expires'
  const hours = Math.max(1, Math.round((expiresAt - Date.now()) / 36e5))
  return hours < 48 ? `Expires in ${hours}h` : `Expires in ${Math.round(hours / 24)} days`
}

const statusView: Record<SaveStatus, { icon: React.ReactNode; text: string }> = {
  saved: { icon: <Check className="size-3.5" />, text: 'Saved' },
  saving: { icon: <Loader2 className="size-3.5 animate-spin" />, text: 'Saving…' },
  error: { icon: <AlertCircle className="size-3.5 text-destructive" />, text: 'Not saved' },
}

export default function PadPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [status, setStatus] = useState<SaveStatus>('saved')

  useEffect(() => {
    let cancelled = false
    setState({ kind: 'loading' })
    if (!isValidId(id)) {
      setState({ kind: 'missing' })
      return
    }
    getPad(id)
      .then((pad) => !cancelled && setState(pad ? { kind: 'ready', pad } : { kind: 'missing' }))
      .catch(() => !cancelled && setState({ kind: 'error' }))
    return () => {
      cancelled = true
    }
  }, [id])

  const onGone = useCallback(() => {
    toast.error('This pad has expired or was deleted.')
    navigate('/')
  }, [navigate])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy the link')
    }
  }

  if (state.kind !== 'ready') {
    return (
      <div className="flex min-h-svh flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
          {state.kind === 'loading' ? (
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          ) : (
            <>
              <h1 className="text-xl font-semibold">
                {state.kind === 'missing' ? 'Pad not found' : 'Could not load the pad'}
              </h1>
              <p className="max-w-sm text-sm text-muted-foreground">
                {state.kind === 'missing'
                  ? 'This pad does not exist or it has expired.'
                  : 'Check your connection and try again.'}
              </p>
              <Button render={<Link to="/" />} nativeButton={false}>
                Create a pad
              </Button>
            </>
          )}
        </main>
      </div>
    )
  }

  const { icon, text } = statusView[status]
  return (
    <div className="flex min-h-svh flex-col">
      <Header>
        <span className="mr-2 hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
          <Cloud className="size-3.5" />
          <span className="font-medium text-foreground">{id}</span>
          <span>· {expiryLabel(state.pad.expiresAt)}</span>
        </span>
        <span className="mr-1 flex items-center gap-1 text-xs text-muted-foreground">
          {icon}
          {text}
        </span>
        <Button variant="outline" size="sm" onClick={() => void copyLink()}>
          <Copy /> Share
        </Button>
      </Header>
      <PadEditor
        id={id}
        initialContent={state.pad.content}
        onStatus={setStatus}
        onGone={onGone}
      />
    </div>
  )
}
