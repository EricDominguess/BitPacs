import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-poppins font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent inline-flex items-center justify-center';

  const variants = {
    primary: 'bg-nautico text-white hover:bg-blue-intense focus:ring-nautico shadow-brand',
    secondary: 'bg-ultra text-tangaroa hover:bg-green-aqua focus:ring-ultra font-semibold',
    outline: 'border-2 border-nautico text-nautico hover:bg-nautico hover:text-white focus:ring-nautico',
    ghost: 'text-theme-muted hover:text-ultra hover:bg-nautico/10 focus:ring-ultra',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3 text-base gap-2.5',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
