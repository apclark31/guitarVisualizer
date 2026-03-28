/**
 * Design Token Definitions — Single Source of Truth
 *
 * All visual decisions flow from this file.
 * CSS custom properties in design-tokens.css are derived from these values.
 * theme.ts imports from here so JS and CSS stay in sync.
 */

export const tokens = {
  color: {
    // Surfaces (no-line rule: boundaries via bg shifts, not borders)
    surface: {
      base: '#000000',
      default: '#121212',
      container: '#1a1a1a',
      containerHigh: '#232323',
      bright: '#2c2c2c',
    },

    // Text on surfaces
    on: {
      surface: '#e5e5e5',
      surfaceMuted: '#a3a3a3',
      surfaceSubtle: '#737373',
      primary: '#ffffff',
    },

    // Primary accent
    primary: {
      default: '#3b82f6',
      hover: '#2563eb',
      dim: '#1d4ed8',
      bg: 'rgba(59,130,246,0.15)',
    },

    // Interval colors (musical visualization)
    interval: {
      root: '#ef4444',
      third: '#3b82f6',
      fifth: '#22c55e',
      seventh: '#eab308',
      extension: '#a855f7',
    },

    // Fretboard
    fretboard: {
      wood: '#3d3533',
      fret: '#d4d4d8',
      nut: '#fafaf9',
      string: '#d4d4d8',
      marker: '#292524',
      background: '#1c1917',
    },

    // Semantic
    success: '#22c55e',
    successHover: '#16a34a',
    danger: '#ef4444',

    // Outlines
    outline: {
      ghost: 'rgba(72,72,71,0.15)',
      default: '#404040',
      hover: '#525252',
    },
  },

  font: {
    display: "'Space Grotesk', 'Inter', system-ui, sans-serif",
    ui: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  fontSize: {
    displayLg: '3.5rem',
    headlineMd: '1.75rem',
    titleMd: '1.125rem',
    bodyMd: '0.875rem',
    bodySm: '0.8125rem',
    labelSm: '0.6875rem',
  },

  spacing: {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
    12: '3rem',
  },

  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  shadow: {
    ambient: '0px 20px 40px rgba(59,130,246,0.06)',
    elevated: '0px 8px 24px rgba(0,0,0,0.3)',
    card: '0px 1px 3px rgba(0,0,0,0.2)',
  },
} as const;

// Light theme surface overrides
export const lightOverrides = {
  surface: {
    base: '#ffffff',
    default: '#f5f5f5',
    container: '#ebebeb',
    containerHigh: '#e0e0e0',
    bright: '#d6d6d6',
  },
  on: {
    surface: '#1a1a1a',
    surfaceMuted: '#525252',
    surfaceSubtle: '#737373',
  },
  outline: {
    ghost: 'rgba(0,0,0,0.08)',
    default: '#d4d4d4',
    hover: '#a3a3a3',
  },
  shadow: {
    ambient: '0px 20px 40px rgba(59,130,246,0.04)',
    elevated: '0px 8px 24px rgba(0,0,0,0.1)',
    card: '0px 1px 3px rgba(0,0,0,0.08)',
  },
} as const;
