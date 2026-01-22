import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-theme-secondary">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full px-4 py-2.5 bg-theme-primary border rounded-lg transition-all duration-200',
              'text-theme-primary placeholder:text-theme-muted',
              'focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent',
              error ? 'border-accent-red' : 'border-theme-border hover:border-nautico/50',
              icon && 'pl-10',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <span className="text-sm text-accent-red">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
