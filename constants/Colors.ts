/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#7047EB';
const tintColorDark = '#BB86FC';

export default {
  light: {
    text: '#333333',
    background: '#F8F9FB',
    tint: tintColorLight,
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',
    border: '#E5E7EB',
    notification: '#FF5A5A',
    primary: '#7047EB',
    secondary: '#5D6CFA',
    accent: '#FE7F6A',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    muted: '#9CA3AF',
    subtle: '#F3F4F6',
    gradient: {
      primary: ['#7047EB', '#8B5FFF'],
      secondary: ['#5D6CFA', '#38BDF8'],
      accent: ['#FE7F6A', '#FEB18F'],
      focus: ['#7047EB', '#38BDF8'],
      success: ['#22C55E', '#4ADE80'],
      warning: ['#F59E0B', '#FBBF24'],
      danger: ['#EF4444', '#F87171'],
    },
  },
  dark: {
    text: '#F3F4F6',
    background: '#121217',
    tint: tintColorDark,
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorDark,
    card: '#1E1E24',
    border: '#374151',
    notification: '#FF5A5A',
    primary: '#BB86FC',
    secondary: '#6E7DFB',
    accent: '#FE7F6A',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    muted: '#6B7280',
    subtle: '#1F2937',
    gradient: {
      primary: ['#BB86FC', '#9D74EB'],
      secondary: ['#6E7DFB', '#38BDF8'],
      accent: ['#FE7F6A', '#FEB18F'],
      focus: ['#BB86FC', '#38BDF8'],
      success: ['#22C55E', '#4ADE80'],
      warning: ['#F59E0B', '#FBBF24'],
      danger: ['#EF4444', '#F87171'],
    },
  },
} as const;
