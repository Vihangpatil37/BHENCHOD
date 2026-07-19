export const lighting = {
  direction: 'top-left-to-bottom-right',
  glows: {
    ai: {
      color: '#70E1FF',
      intensity: { min: 0.15, max: 0.25 },
      cycle: 2800, // ms
    },
    recommendation: {
      color: '#8B5CF6',
      opacity: 0.10, // static
    },
  },
  hover: {
    translateY: '-2px',
  },
  focus: {
    outlineColor: '#70E1FF',
  },
} as const;
