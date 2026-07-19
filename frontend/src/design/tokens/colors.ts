export const colors = {
  bg: {
    primary: '#05070D',
    secondary: '#0A0A0F',
    tertiary: '#10131A',
  },
  brand: {
    default: '#5B7CFA',
    hover: '#4F6FF0',
    pressed: '#4565DA',
  },
  ai: {
    cyan: '#70E1FF',
  },
  recommendation: {
    purple: '#8B5CF6',
  },
  status: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    errorHover: '#DC2626',
    info: '#3B82F6',
  },
  glass: {
    surface: 'rgba(255, 255, 255, 0.05)',
    elevated: 'rgba(255, 255, 255, 0.08)',
    modal: 'rgba(255, 255, 255, 0.10)',
    hover: 'rgba(255, 255, 255, 0.12)',
    pressed: 'rgba(255, 255, 255, 0.16)',
  },
  border: {
    default: 'rgba(255, 255, 255, 0.08)',
    hover: 'rgba(255, 255, 255, 0.12)',
    focus: 'rgba(112, 225, 255, 0.30)',
    selected: 'rgba(91, 124, 250, 0.35)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.72)',
    muted: 'rgba(255, 255, 255, 0.45)',
    disabled: 'rgba(255, 255, 255, 0.25)',
  },
  categories: {
    Engineering: '#3B82F6',
    Medical: '#22C55E',
    Business: '#F59E0B',
    Arts: '#EC4899',
    Law: '#64748B',
    Defence: '#DC2626',
    Agriculture: '#84CC16',
    Research: '#8B5CF6',
    Teaching: '#14B8A6',
    Design: '#F97316',
  },
  charts: {
    primary: '#5B7CFA',
    ai: '#70E1FF',
    success: '#22C55E',
    warning: '#F59E0B',
    recommendation: '#8B5CF6',
  },
  shadows: {
    default: 'rgba(0, 0, 0, 0.30)',
    floating: 'rgba(0, 0, 0, 0.45)',
    dialog: 'rgba(0, 0, 0, 0.55)',
  },
  glows: {
    ai: 'rgba(112, 225, 255, 0.25)',
    recommendation: 'rgba(139, 92, 246, 0.25)',
  }
} as const;
