import { motion, useScroll, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';
import { type RefObject } from 'react';

type ScrollProgressProps = {
  className?: string;
  containerRef?: RefObject<HTMLElement>;
};

export function ScrollProgress({ className, containerRef }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll({
    container: containerRef,
  });

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 50,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className={cn(
        'fixed inset-x-0 top-0 z-[1000] h-0.5 origin-left bg-primary',
        className
      )}
      style={{ scaleX }}
    />
  );
}
