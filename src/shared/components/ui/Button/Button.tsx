import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  icon?: ReactNode;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://w3.org"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

export const Button = ({
  children,
  icon,
  isLoading = false,
  variant = 'primary',
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) => {
  const isButtonDisabled = disabled || isLoading;

  // Base : On utilise active:enabled:scale pour que l'effet clic ne s'active que si le bouton est cliquable
  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed active:enabled:scale-[0.98]';

  // Solution : Classes statiques complètes. 
  // "enabled:hover:..." garantit que le survol fonctionne uniquement si le bouton n'est pas désactivé.
  const variantStyles = {
    primary: 'bg-primary text-white enabled:hover:bg-primary-hover focus:ring-primary',
    secondary: 'bg-secondary text-secondary-text enabled:hover:bg-secondary-hover focus:ring-secondary',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={isButtonDisabled}
      {...props}
    >
      {isLoading ? <Spinner /> : icon}
      {children}
    </button>
  );
};

export default Button;
