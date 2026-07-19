export const glass = {
  levels: {
    1: {
      name: 'Background glass',
      blur: '25px', // 25-35px range
      reflection: 0.05,
      shadow: '0 10px 30px rgba(0, 0, 0, 0.30)',
      bg: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.08)',
    },
    2: {
      name: 'Cards',
      blur: '30px', // 30-40px range
      reflection: 0.08,
      shadow: '0 10px 30px rgba(0, 0, 0, 0.30)', // default -> floating on hover
      bg: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.08)',
    },
    3: {
      name: 'Floating',
      blur: '30px', // 30-40px range
      reflection: 0.10,
      shadow: '0 20px 60px rgba(0, 0, 0, 0.45)',
      bg: 'rgba(255, 255, 255, 0.08)', // elevated
      border: 'rgba(255, 255, 255, 0.12)',
    },
    4: {
      name: 'Modal',
      blur: '45px',
      reflection: 0.12,
      shadow: '0 40px 120px rgba(0, 0, 0, 0.55)',
      bg: 'rgba(255, 255, 255, 0.10)', // modal
      border: 'rgba(255, 255, 255, 0.12)', // Default border hover intensity is 12%
    },
  },
} as const;
