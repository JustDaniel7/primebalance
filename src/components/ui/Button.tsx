'use client'

import { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed'

    const variantStyles = {
      primary: 'bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 text-surface-950 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5 active:translate-y-0 focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-surface-950',
      secondary: 'bg-surface-800/80 border border-surface-700 text-surface-100 shadow-lg shadow-black/20 hover:bg-surface-700/80 hover:border-surface-600 hover:-translate-y-0.5 active:translate-y-0 focus:ring-2 focus:ring-surface-500 focus:ring-offset-2 focus:ring-offset-surface-950',
      ghost: 'bg-transparent text-surface-300 hover:text-surface-100 hover:bg-surface-800/50 focus:ring-2 focus:ring-surface-500 focus:ring-offset-2 focus:ring-offset-surface-950',
      accent: 'bg-gradient-to-br from-accent-400 via-accent-500 to-accent-600 text-surface-950 shadow-lg shadow-accent-500/25 hover:shadow-xl hover:shadow-accent-500/40 hover:-translate-y-0.5 active:translate-y-0 focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 focus:ring-offset-surface-950',
      danger: 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40 hover:-translate-y-0.5 active:translate-y-0 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-surface-950',
    }

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
      md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
      lg: 'px-6 py-3 text-base rounded-xl gap-2.5',
    }

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button
