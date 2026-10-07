import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createPad,
  DURATIONS,
  getPad,
  isValidId,
  MAX_PADS_PER_USER,
  normalizeId,
  type Duration,
} from '@/lib/pads'

const CREATE_ERRORS = {
  taken: 'That pad name is already taken. Choose another, or open it.',
  limit: `You can keep up to ${MAX_PADS_PER_USER} pads at a time. Wait for some to expire.`,
  slow: 'You are creating pads too quickly. Wait a few seconds and try again.',
} as const

export default function Home() {
  const navigate = useNavigate()
  const [id, setId] = useState('')
  const [duration, setDuration] = useState<Duration>('1d')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const padId = normalizeId(id)

  async function run(action: 'create' | 'open') {
    setError('')
    if (!isValidId(padId)) {
      setError('Use 5–40 characters: letters, numbers and hyphens (not at the start or end).')
      return
    }
    setBusy(true)
    try {
      if (action === 'create') {
        const result = await createPad(padId, duration)
        if (result !== 'created') {
          setError(CREATE_ERRORS[result])
          return
        }
      } else if (!(await getPad(padId))) {
        setError('No pad with that name exists. Create it instead.')
        return
      }
      navigate(`/${padId}`)
    } catch (e) {
      console.error('[pad] request failed', e)
      const code = (e as { code?: string })?.code
      setError(`Something went wrong${code ? ` (${code})` : ''}. Please try again.`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">Create a pad</CardTitle>
            <CardDescription>
              A simple shared notepad. Anyone with the name can read and edit it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-5"
              onSubmit={(e) => {
                e.preventDefault()
                void run('create')
              }}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="pad-id">Pad name</Label>
                <Input
                  id="pad-id"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="my-meeting-notes"
                  autoComplete="off"
                  autoFocus
                  maxLength={40}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Keep it for</Label>
                <Select value={duration} onValueChange={(v) => setDuration(v as Duration)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {DURATIONS.find((d) => d.value === duration)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={busy || !padId} className="flex-1">
                  {busy && <Loader2 className="animate-spin" />}
                  Create pad
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy || !padId}
                  onClick={() => void run('open')}
                >
                  Open existing
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
