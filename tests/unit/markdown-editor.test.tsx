import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MarkdownEditor } from '@/components/markdown-editor'
import { fontStack, type FontId } from '@/lib/fonts'

const lines = (...parts: string[]) => parts.join('\n')

function StatefulEditor({ onChange = vi.fn(), font = 'default' }: { onChange?: (v: string) => void; font?: FontId }) {
  const [value, setValue] = useState('')
  return <MarkdownEditor value={value} onChange={(v) => { setValue(v); onChange(v) }} font={font} />
}

describe('MarkdownEditor', () => {
  it('edits markdown source and reports changes', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<StatefulEditor onChange={onChange} />)

    const source = screen.getByRole('textbox', { name: 'Markdown source' })
    await user.type(source, '# Hi')
    expect(source).toHaveValue('# Hi')
    expect(onChange.mock.calls.at(-1)?.[0]).toBe('# Hi')
  })

  it('renders a read-only preview when Preview is chosen', async () => {
    const user = userEvent.setup()
    render(<MarkdownEditor value={lines('# Hello', '', '- one', '- two')} onChange={vi.fn()} font="default" />)

    expect(screen.getByRole('textbox', { name: 'Markdown source' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Preview' }))

    const preview = screen.getByTestId('markdown-preview')
    expect(within(preview).getByRole('heading', { level: 1, name: 'Hello' })).toBeInTheDocument()
    expect(within(preview).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.queryByRole('textbox', { name: 'Markdown source' })).not.toBeInTheDocument()
  })

  it('returns to source editing from preview', async () => {
    const user = userEvent.setup()
    render(<MarkdownEditor value="text" onChange={vi.fn()} font="default" />)
    await user.click(screen.getByRole('button', { name: 'Preview' }))
    await user.click(screen.getByRole('button', { name: 'Write' }))
    expect(screen.getByRole('textbox', { name: 'Markdown source' })).toBeInTheDocument()
  })

  it('applies the chosen font to both views', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<MarkdownEditor value="hi" onChange={vi.fn()} font="georgia" />)
    expect(screen.getByRole('textbox', { name: 'Markdown source' })).toHaveStyle({ fontFamily: fontStack('georgia') })

    await user.click(screen.getByRole('button', { name: 'Preview' }))
    expect(screen.getByTestId('markdown-preview')).toHaveStyle({ fontFamily: fontStack('georgia') })

    rerender(<MarkdownEditor value="hi" onChange={vi.fn()} font="courier" />)
    expect(screen.getByTestId('markdown-preview')).toHaveStyle({ fontFamily: fontStack('courier') })
  })

  it('never renders unsafe html in preview', async () => {
    const user = userEvent.setup()
    render(
      <MarkdownEditor
        value={lines('<script>alert(1)</script>', '', '[bad](javascript:alert(2))')}
        onChange={vi.fn()}
        font="default"
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Preview' }))
    const preview = screen.getByTestId('markdown-preview')
    expect(preview.querySelector('script')).toBeNull()
    expect(preview.innerHTML).not.toContain('javascript:')
    expect(preview.innerHTML).not.toContain('alert(')
  })
})
