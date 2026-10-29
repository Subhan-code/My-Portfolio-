import React from 'react';
import { cn } from '../lib/utils';

interface GSAPMenuLinkProps {
  text: string;
  onClick: () => void;
  className?: string;
  'aria-current'?: 'page' | undefined;
  tabIndex?: number;
}

export const GSAPMenuLink: React.FC<GSAPMenuLinkProps> = ({ text, onClick, className, tabIndex, ...rest }) => {
  return (
    <button
        type="button"
        onClick={onClick}
        tabIndex={tabIndex}
        aria-current={rest['aria-current']}
        className={cn(
            "relative cursor-pointer w-full h-[3.5rem] md:h-[5rem] flex items-center justify-center select-none",
            // Press is felt, not seen; hover only where a real pointer exists
            "transition-transform duration-200 ease-out active:scale-[0.97] [@media(hover:hover)_and_(pointer:fine)]:hover:scale-[1.02]",
            className
        )}
    >
        <span className="block w-full text-center leading-none">
            {text}
        </span>
    </button>
  );
};
