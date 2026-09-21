import { vars } from 'nativewind';
import palette from './palette.json';

// NativeWind and inline styles share the same light/dark palette.
export function themeVariables(colors: typeof palette.light) {
  return vars(Object.fromEntries(
    Object.entries(colors)
      .filter(([, value]) => /^#[\da-f]{6}$/i.test(value))
      .map(([key, value]) => [
        `--color-${key}`,
        [1, 3, 5].map(offset => parseInt(value.slice(offset, offset + 2), 16)).join(' '),
      ])
  ));
}
