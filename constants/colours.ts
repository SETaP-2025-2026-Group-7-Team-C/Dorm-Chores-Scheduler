/**
 * Centralized colour system for the Dorm Chores Scheduler app, use COLOURS.primary,
 * COLOURS.error.background, etc. to maintain consistency across the app.
 */

export const COLOURS = {
  // Primary brand colours
  primary: '#153000',
  primaryLight: '#87EA5C',
  primaryMuted: '#9BE36D',
  primarySoft: '#DDF7D2',

  // Neutral colours
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Gray colours
  gray: {
    50: '#F5F5F5',
    100: '#F1F1ED',
    200: '#F0F0F0',
    300: '#CCCCCC',
    400: '#C0C0C0',
    500: '#868685',
    600: '#888888',
    700: '#666666',
    800: '#333333',
    900: '#000000',
  },

  // State colours
  error: {
    background: '#FFE9EA',
    text: '#B70000',
    border: '#B70000',
  },

  warning: {
    background: '#FFF7D3',
    text: 'rgba(0, 0, 0, 0.65)',
    icon: '#FFCF00',
  },

  info: {
    background: '#F1F1ED',
    text: 'rgba(0, 0, 0, 0.65)',
    icon: 'rgba(0, 0, 0, 0.65)',
  },

  success: {
    background: '#DDF7D2',
    text: '#1F5800',
    icon: '#1F5800',
  },

  tip: {
    background: '#DAF8F7',
    text: '#004F4E',
    icon: '#004F4E',
  },

  // Input states
  input: {
    default: '#868685',
    focus: '#000000',
    error: '#B70000',
    placeholder: '#868685',
    text: '#000000',
  },

  // Special cases
  disabled: '#888888',
} as const;

export type colourKeys = keyof typeof COLOURS;
