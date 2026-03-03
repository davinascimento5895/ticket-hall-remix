import { cn } from '@/lib/utils';
import { AnimatePresence, motion, type Variants, type Transition } from 'framer-motion';
import React from 'react';

export type PresetType = 'blur' | 'fade-in-blur' | 'scale' | 'fade' | 'slide';
export type PerType = 'word' | 'char' | 'line';

export type TextEffectProps = {
  children: string;
  per?: PerType;
  as?: keyof React.JSX.IntrinsicElements;
  variants?: { container?: Variants; item?: Variants };
  className?: string;
  preset?: PresetType;
  delay?: number;
  speedReveal?: number;
  speedSegment?: number;
  trigger?: boolean;
  onAnimationComplete?: () => void;
  segmentWrapperClassName?: string;
  containerTransition?: Transition;
  segmentTransition?: Transition;
  style?: React.CSSProperties;
};

const defaultStaggerTimes: Record<PerType, number> = { char: 0.03, word: 0.05, line: 0.1 };

const defaultVariants: Record<PresetType, { container: Variants; item: Variants }> = {
  blur: {
    container: { visible: { transition: { staggerChildren: 0.05 } } },
    item: { hidden: { opacity: 0, filter: 'blur(10px)' }, visible: { opacity: 1, filter: 'blur(0px)' } },
  },
  'fade-in-blur': {
    container: { visible: { transition: { staggerChildren: 0.05 } } },
    item: { hidden: { opacity: 0, y: 20, filter: 'blur(10px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)' } },
  },
  scale: {
    container: { visible: { transition: { staggerChildren: 0.05 } } },
    item: { hidden: { opacity: 0, scale: 0 }, visible: { opacity: 1, scale: 1 } },
  },
  fade: {
    container: { visible: { transition: { staggerChildren: 0.05 } } },
    item: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  },
  slide: {
    container: { visible: { transition: { staggerChildren: 0.05 } } },
    item: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } },
  },
};

export function TextEffect({
  children,
  per = 'word',
  as = 'p',
  variants,
  className,
  preset = 'fade',
  delay = 0,
  speedReveal = 1,
  speedSegment = 1,
  trigger = true,
  onAnimationComplete,
  segmentWrapperClassName,
  containerTransition,
  segmentTransition,
  style,
}: TextEffectProps) {
  const segments = per === 'line' ? children.split('\n') : per === 'word' ? children.split(/(\s+)/) : children.split('');
  const Tag = as as any;
  const selectedVariants = variants || defaultVariants[preset];
  const staggerTime = defaultStaggerTimes[per] / speedReveal;

  return (
    <Tag className={cn('inline-block', className)} style={style}>
      <AnimatePresence mode='wait'>
        {trigger && (
          <motion.span
            variants={selectedVariants.container}
            initial='hidden'
            animate='visible'
            exit='hidden'
            transition={{ staggerChildren: staggerTime, delayChildren: delay, ...containerTransition }}
            onAnimationComplete={onAnimationComplete}
          >
            {segments.map((segment, index) => (
              <motion.span
                key={`${segment}-${index}`}
                variants={selectedVariants.item}
                transition={{ duration: 0.3 / speedSegment, ...segmentTransition }}
                className={cn('inline-block whitespace-pre', segmentWrapperClassName)}
              >
                {segment}
              </motion.span>
            ))}
          </motion.span>
        )}
      </AnimatePresence>
    </Tag>
  );
}
