import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FontPicker } from '@/components/font-picker'
import { FONTS } from '@/lib/fonts'

describe('FontPicker', () => {
  it('lists all 10 fonts and marks the current one', () => {
    render(<FontPicker value="georgia" onChange={vi.fn()} />)
    const select = screen.getByRole('combobox', { name: 'Font' })
    expect(select).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(FONTS.length)
    expect(select).toHaveValue('georgia')
  })

  it('reports the chosen font', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<FontPicker value="default" onChange={onChange} />)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Font' }), 'courier')
    expect(onChange).toHaveBeenCalledWith('courier')
  })
})
