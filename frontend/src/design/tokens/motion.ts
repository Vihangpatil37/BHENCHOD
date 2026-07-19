export const motion = {
  durations: {
    ultraFast: 120, // checkbox, toggle, icon
    fast: 180,      // button hover/focus
    standard: 250,  // cards, nav, inputs
    medium: 350,    // dropdown, modal, sidebar
    slow: 600,      // page transitions, hero
    breathing: 2800, // AI breathing (2.8s)
    auroraMin: 40000,
    auroraMax: 90000,
  },
  easings: {
    default: 'ease-out',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // for glass/floating items
    page: 'ease-in-out',
  },
} as const;
