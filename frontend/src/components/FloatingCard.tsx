import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface FloatingCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
  duration?: number;
}

export const FloatingCard = ({
  children,
  className = '',
  delay = 0,
  yOffset = 15,
  duration = 4,
}: FloatingCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{
        opacity: 1,
        y: [yOffset, -yOffset, yOffset],
      }}
      transition={{
        opacity: { duration: 0.6, delay },
        y: {
          repeat: Infinity,
          repeatType: 'reverse',
          duration,
          ease: 'easeInOut',
          delay,
        },
      }}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
