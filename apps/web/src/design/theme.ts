import { isAppearance, palettes, type Appearance } from '@membrant/client';

export function storedAppearance(): Appearance {
  try {
    const value = localStorage.getItem('membrant.theme');
    return isAppearance(value) ? value : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyAppearance(appearance: Appearance) {
  const theme =
    appearance === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : appearance;
  const root = document.documentElement;
  root.dataset.theme = theme;
  for (const [token, value] of Object.entries(palettes[theme])) {
    root.style.setProperty(
      `--${token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
      value,
    );
  }
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', palettes[theme].bg);
  return theme;
}
