import { cn } from '../../utils/cn';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'outline';
}

export function Card({ title, children, className, variant = 'default' }: CardProps) {
  const variants = {
    default: 'bg-purple-dark/50 border border-purple/30',
    gradient: 'bg-gradient-dark border border-purple/20',
    outline: 'bg-transparent border-2 border-nautico/30',
  };

  return (
    <div
      className={cn(
        'rounded-xl p-6 backdrop-blur-sm animate-fade-in',
        variants[variant],
        className
      )}
    >
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      )}
      {children}
    </div>
  );
}
