'use client'

import { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  variant?: 'default' | 'glass' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      hover = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'rounded-2xl overflow-hidden'

    const variantStyles = {
      default: 'bg-white dark:bg-surface-900/60 border border-gray-200 dark:border-surface-800/50 shadow-sm dark:shadow-none',
      glass: 'glass-card',
      elevated: 'bg-white dark:bg-surface-900/80 border border-gray-200 dark:border-surface-700/50 shadow-lg dark:shadow-xl dark:shadow-black/20',
    }

    const paddingStyles = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }

    const hoverStyles = hover
      ? 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-gray-300 dark:hover:border-surface-700'
      : ''

    return (
      <motion.div
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

export default Card
