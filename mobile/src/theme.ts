export type ThemeName = 'light' | 'dark';

export interface Theme {
  background: string;
  surface: string;
  surfaceRaised: string;
  control: string;
  controlPressed: string;
  border: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentPressed: string;
  accentSoft: string;
  white: string;
  overlay: string;
  shadow: string;
}

export const themes: Record<ThemeName, Theme> = {
  light: {
    background: '#f5f5f7',
    surface: '#ffffff',
    surfaceRaised: '#ffffff',
    control: '#ececef',
    controlPressed: '#dedee3',
    border: '#e4e4e8',
    text: '#1d1d1f',
    textSecondary: '#6e6e73',
    textTertiary: '#a1a1a6',
    accent: '#fc3c44',
    accentPressed: '#e82f37',
    accentSoft: '#ffe8e9',
    white: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.38)',
    shadow: '#000000'
  },
  dark: {
    background: '#000000',
    surface: '#1c1c1e',
    surfaceRaised: '#2c2c2e',
    control: '#303033',
    controlPressed: '#48484a',
    border: '#3a3a3c',
    text: '#f5f5f7',
    textSecondary: '#aeaeb2',
    textTertiary: '#636366',
    accent: '#ff453a',
    accentPressed: '#ff6961',
    accentSoft: '#3a1718',
    white: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: '#000000'
  }
};
