import { describe, expect, it } from 'vitest'
import { DEFAULT_FONT, FONTS, fontStack, isFontId } from '@/lib/fonts'

describe('font registry', () => {
  it('offers exactly the 10 classic web-safe choices', () => {
    expect(FONTS).toHaveLength(10)
    expect(FONTS.map((f) => f.id)).toEqual([
      'default',
      'arial',
      'verdana',
      'tahoma',
      'trebuchet',
      'georgia',
      'times',
      'courier',
      'comic',
      'garamond',
    ])
  })

  it('gives every font a human label and a fallback stack', () => {
    for (const font of FONTS) {
      expect(font.label.length).toBeGreaterThan(0)
      expect(font.stack).toMatch(/,\s*(sans-serif|serif|monospace|cursive)$/)
    }
  })

  it('resolves ids to their stack and unknown values to the default', () => {
    const georgia = FONTS.find((f) => f.id === 'georgia')!
    expect(fontStack('georgia')).toBe(georgia.stack)
    expect(fontStack('not-a-font')).toBe(fontStack(DEFAULT_FONT))
    expect(fontStack(undefined)).toBe(fontStack(DEFAULT_FONT))
  })

  it('recognises only known ids', () => {
    expect(isFontId('arial')).toBe(true)
    expect(isFontId('Comic Sans')).toBe(false)
    expect(isFontId(null)).toBe(false)
  })
})
