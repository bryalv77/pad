/** Web-safe font stacks: these families ship with every major OS and browser. */
export type FontId =
  | 'default'
  | 'arial'
  | 'verdana'
  | 'tahoma'
  | 'trebuchet'
  | 'georgia'
  | 'times'
  | 'courier'
  | 'comic'
  | 'garamond'

export interface FontOption {
  id: FontId
  label: string
  stack: string
}

export const FONTS: readonly FontOption[] = [
  { id: 'default', label: 'Default', stack: "'Geist Variable', ui-sans-serif, system-ui, sans-serif" },
  { id: 'arial', label: 'Arial', stack: 'Arial, Helvetica, sans-serif' },
  { id: 'verdana', label: 'Verdana', stack: 'Verdana, Geneva, sans-serif' },
  { id: 'tahoma', label: 'Tahoma', stack: 'Tahoma, Geneva, sans-serif' },
  { id: 'trebuchet', label: 'Trebuchet MS', stack: "'Trebuchet MS', 'Lucida Sans Unicode', sans-serif" },
  { id: 'georgia', label: 'Georgia', stack: "Georgia, 'Times New Roman', serif" },
  { id: 'times', label: 'Times New Roman', stack: "'Times New Roman', Times, serif" },
  { id: 'courier', label: 'Courier New', stack: "'Courier New', Courier, monospace" },
  { id: 'comic', label: 'Comic Sans MS', stack: "'Comic Sans MS', 'Comic Sans', cursive" },
  { id: 'garamond', label: 'Garamond', stack: "Garamond, 'Palatino Linotype', serif" },
]

export const DEFAULT_FONT: FontId = 'default'

export const isFontId = (value: unknown): value is FontId =>
  typeof value === 'string' && FONTS.some((font) => font.id === value)

/** Resolve a stored font id, falling back to the default for old or corrupt data. */
export const fontStack = (value: unknown): string =>
  (isFontId(value) ? FONTS.find((font) => font.id === value)! : FONTS[0]).stack
