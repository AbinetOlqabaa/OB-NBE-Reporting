/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronUp, ChevronDown, Check } from 'lucide-react';
import { vibrate } from '../utils/haptics.ts';

interface InputAccessoryViewProps {
  isVisible: boolean;
  currentIndex?: number;
  totalFields?: number;
  currentCode?: string;
  currentLabel?: string;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onDone: () => void;
}

/**
 * Mobile Input Accessory View that docks above the soft keyboard
 * Provides 'Previous', 'Next', and 'Done' navigation for numeric financial inputs
 */
export const InputAccessoryView: React.FC<InputAccessoryViewProps> = ({
  isVisible,
  currentIndex = 0,
  totalFields = 0,
  currentCode,
  currentLabel,
  hasPrevious = false,
  hasNext = false,
  onPrevious,
  onNext,
  onDone,
}) => {
  if (!isVisible) return null;

  return (
    <div
      role="toolbar"
      aria-label="Input Navigation Toolbar"
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-700/80 text-white shadow-2xl px-3 py-2 flex items-center justify-between gap-2 pb-safe animate-in slide-in-from-bottom-2 duration-150"
    >
      {/* Navigation Buttons (Previous / Next) */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={!hasPrevious}
          onClick={(e) => {
            e.preventDefault();
            vibrate(15);
            onPrevious();
          }}
          aria-label="Previous Field"
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all touch-manipulation touch-press ${
            hasPrevious
              ? 'bg-slate-800 text-white hover:bg-slate-700 active:scale-95 cursor-pointer shadow-xs'
              : 'bg-slate-800/40 text-slate-500 cursor-not-allowed opacity-50'
          }`}
        >
          <ChevronUp className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <button
          type="button"
          disabled={!hasNext}
          onClick={(e) => {
            e.preventDefault();
            vibrate(15);
            onNext();
          }}
          aria-label="Next Field"
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all touch-manipulation touch-press ${
            hasNext
              ? 'bg-slate-800 text-white hover:bg-slate-700 active:scale-95 cursor-pointer shadow-xs'
              : 'bg-slate-800/40 text-slate-500 cursor-not-allowed opacity-50'
          }`}
        >
          <ChevronDown className="w-4 h-4" />
          <span className="hidden sm:inline">Next</span>
        </button>
      </div>

      {/* Center Indicator (Field details) */}
      <div className="flex-1 min-w-0 px-2 text-center">
        {currentCode && (
          <div className="flex items-center justify-center gap-1.5 truncate">
            <span className="font-mono text-[11px] font-bold text-ob-indigo-300 bg-ob-indigo-950/80 px-1.5 py-0.5 rounded border border-ob-indigo-800/60">
              {currentCode}
            </span>
            {totalFields > 0 && (
              <span className="text-[10px] text-slate-400 font-medium">
                ({currentIndex + 1}/{totalFields})
              </span>
            )}
          </div>
        )}
        {currentLabel && (
          <p className="text-[10px] text-slate-300 truncate max-w-[180px] sm:max-w-xs mx-auto">
            {currentLabel}
          </p>
        )}
      </div>

      {/* Done Button */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            vibrate(20);
            onDone();
          }}
          aria-label="Done Editing"
          className="min-h-[44px] min-w-[64px] px-3.5 py-1.5 bg-ob-indigo-600 hover:bg-ob-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 touch-manipulation touch-press flex items-center justify-center gap-1 cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Done</span>
        </button>
      </div>
    </div>
  );
};
