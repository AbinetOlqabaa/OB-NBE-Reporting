/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Trash2, Archive, Check, ArrowRight } from 'lucide-react';
import { haptics } from '../utils/haptics.ts';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  leftActionLabel?: string;
  leftActionIcon?: React.ReactNode;
  leftActionColor?: string;
  onSwipeRight?: () => void;
  rightActionLabel?: string;
  rightActionIcon?: React.ReactNode;
  rightActionColor?: string;
  threshold?: number;
  className?: string;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  leftActionLabel = 'Delete',
  leftActionIcon = <Trash2 className="w-5 h-5" />,
  leftActionColor = 'bg-rose-600',
  onSwipeRight,
  rightActionLabel = 'Archive',
  rightActionIcon = <Archive className="w-5 h-5" />,
  rightActionColor = 'bg-amber-600',
  threshold = 80,
  className = '',
}) => {
  const x = useMotionValue(0);
  const [hasCrossedThreshold, setHasCrossedThreshold] = useState(false);

  // Background action opacities
  const leftOpacity = useTransform(x, [-threshold, -20], [1, 0]);
  const rightOpacity = useTransform(x, [20, threshold], [0, 1]);

  const handleDragEnd = (_: any, info: any) => {
    const offset = info.offset.x;
    if (offset < -threshold && onSwipeLeft) {
      haptics.error();
      onSwipeLeft();
    } else if (offset > threshold && onSwipeRight) {
      haptics.success();
      onSwipeRight();
    }
    setHasCrossedThreshold(false);
  };

  const handleDrag = (_: any, info: any) => {
    const offset = Math.abs(info.offset.x);
    if (offset > threshold && !hasCrossedThreshold) {
      haptics.medium();
      setHasCrossedThreshold(true);
    } else if (offset <= threshold && hasCrossedThreshold) {
      setHasCrossedThreshold(false);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {/* Background Left Action (Triggered on Swipe Left, reveals on right side) */}
      {onSwipeLeft && (
        <motion.div
          style={{ opacity: leftOpacity }}
          className={`absolute inset-y-0 right-0 w-24 ${leftActionColor} text-white flex flex-col items-center justify-center p-2 rounded-r-xl z-0`}
        >
          {leftActionIcon}
          <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">
            {leftActionLabel}
          </span>
        </motion.div>
      )}

      {/* Background Right Action (Triggered on Swipe Right, reveals on left side) */}
      {onSwipeRight && (
        <motion.div
          style={{ opacity: rightOpacity }}
          className={`absolute inset-y-0 left-0 w-24 ${rightActionColor} text-white flex flex-col items-center justify-center p-2 rounded-l-xl z-0`}
        >
          {rightActionIcon}
          <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">
            {rightActionLabel}
          </span>
        </motion.div>
      )}

      {/* Foreground Swipeable Content */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: onSwipeLeft ? -100 : 0, right: onSwipeRight ? 100 : 0 }}
        dragElastic={0.15}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="relative z-10 bg-white dark:bg-slate-900 touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
};
