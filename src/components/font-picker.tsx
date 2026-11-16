import { FONTS, type FontId } from '@/lib/fonts'

interface Props {
  value: FontId
  onChange: (font: FontId) => void
}

/** Native select keeps the font picker keyboard- and screen-reader-friendly on every device. */
export function FontPicker({ value, onChange }: Props) {
  return (
    <>
      <label htmlFor="pad-font" className="sr-only">
        Font
      </label>
      <select
        id="pad-font"
        aria-label="Font"
        value={value}
        onChange={(event) => onChange(event.target.value as FontId)}
        className="h-8 max-w-36 rounded-lg border border-input bg-transparent px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {FONTS.map((font) => (
          <option key={font.id} value={font.id}>
            {font.label}
          </option>
        ))}
      </select>
    </>
  )
}
