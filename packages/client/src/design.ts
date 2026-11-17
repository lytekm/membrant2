/** Cross-platform semantic colors. Usage rules: docs/design_language.md. */
export const palettes = {
  dark: {
    bg: '#111915',
    surface: '#19231d',
    surfaceAlt: '#222e26',
    text: '#ecebe3',
    muted: '#a4afa3',
    border: '#34443a',
    controlBorder: '#657c69',
    brand: '#7f9b83',
    accent: '#b3d4a5',
    accentHover: '#c6dfbb',
    onAccent: '#142017',
    soft: '#27392b',
    mid: '#5d7b60',
    success: '#b3d4a5',
    danger: '#e8a59b',
    dangerSoft: '#362320',
    warning: '#dec891',
    warningSoft: '#302b1f',
  },
  light: {
    bg: '#f4f6f0',
    surface: '#fafbf7',
    surfaceAlt: '#e9eee5',
    text: '#29382d',
    muted: '#5e6e60',
    border: '#d9e0d5',
    controlBorder: '#7d907d',
    brand: '#58765a',
    accent: '#356442',
    accentHover: '#294d33',
    onAccent: '#fafbf7',
    soft: '#e2ebde',
    mid: '#8da789',
    success: '#356442',
    danger: '#9b3e35',
    dangerSoft: '#f6e9e4',
    warning: '#775c25',
    warningSoft: '#f2eddd',
  },
};

export type Appearance = 'dark' | 'light' | 'system';
export const isAppearance = (value: unknown): value is Appearance =>
  value === 'dark' || value === 'light' || value === 'system';
