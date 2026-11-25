import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  'aria-label': ariaLabel,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm shadow-blue-500/25 focus-visible:ring-blue-500 focus-visible:ring-offset-white',
    secondary: 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 focus-visible:ring-slate-400 focus-visible:ring-offset-white',
    outline: 'border border-slate-300/90 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 focus-visible:ring-blue-500 focus-visible:ring-offset-white',
    ghost: 'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-600 focus-visible:ring-slate-400',
    danger: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm shadow-rose-500/25 focus-visible:ring-rose-500 focus-visible:ring-offset-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm shadow-emerald-500/25 focus-visible:ring-emerald-500 focus-visible:ring-offset-white',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[34px]',
    md: 'text-sm px-4 py-2.5 gap-2 min-h-[42px]',
    lg: 'text-base px-5 py-3 gap-2.5 min-h-[48px]',
  };

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.015 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.975 } : {}}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-label={ariaLabel}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
    </motion.button>
  );
};
export default Button;

