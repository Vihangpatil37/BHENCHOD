import { motion } from 'framer-motion';

export function AmbientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-accent glass-orb"
        animate={{ translateY: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] rounded-full bg-accent-2 glass-orb"
        animate={{ translateY: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
    </div>
  );
}
