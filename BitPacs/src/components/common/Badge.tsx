import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-nautico/20 text-nautico border-nautico/30',
    success: 'bg-ultra/20 text-ultra border-ultra/30',
    warning: 'bg-accent-orange/20 text-accent-orange border-accent-orange/30',
    error: 'bg-accent-red/20 text-accent-red border-accent-red/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
