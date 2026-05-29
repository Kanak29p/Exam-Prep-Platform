import { ArrowLeft, Home } from 'lucide-react';

export interface Option {
  label: string;
  nextId: string;
}

interface OptionButtonsProps {
  options?: Option[];
  showBack: boolean;
  showHome: boolean;
  onOptionClick: (option: Option) => void;
  onBackClick: () => void;
  onHomeClick: () => void;
}

export function OptionButtons({
  options = [],
  showBack,
  showHome,
  onOptionClick,
  onBackClick,
  onHomeClick,
}: OptionButtonsProps) {
  // Decide grid class based on options count
  const isLargeSet = options.length > 4;

  return (
    <div className="space-y-3 mt-2">
      {/* Option grid */}
      {options.length > 0 && (
        <div className={`grid gap-2 ${isLargeSet ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => onOptionClick(option)}
              className={`w-full text-left px-3.5 py-2.5 text-xs font-medium rounded-xl border transition-all duration-200 cursor-pointer ${
                isLargeSet
                  ? 'bg-white hover:bg-blue-50/50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-750 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm'
                  : 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-850 dark:to-gray-800 hover:from-blue-100/70 hover:to-purple-100/70 dark:hover:from-gray-750 dark:hover:to-gray-700 text-gray-850 dark:text-gray-100 border-gray-150 dark:border-gray-700 hover:border-blue-300 dark:hover:border-purple-500 shadow-sm'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Navigation action buttons (Back & Home) */}
      {(showBack || showHome) && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-150 dark:border-gray-700/60">
          {showBack && (
            <button
              onClick={onBackClick}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50 hover:bg-blue-50/40 dark:bg-gray-800/40 dark:hover:bg-gray-700/60 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          )}
          {showHome && (
            <button
              onClick={onHomeClick}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 bg-gray-50 hover:bg-purple-50/40 dark:bg-gray-800/40 dark:hover:bg-gray-700/60 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 cursor-pointer"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Main Menu</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
