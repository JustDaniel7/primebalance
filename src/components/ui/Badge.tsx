'use client'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}: BadgeProps) {
  const variantStyles = {
    success: 'bg-primary-500/15 text-primary-400 ring-1 ring-primary-500/30',
    warning: 'bg-accent-500/15 text-accent-400 ring-1 ring-accent-500/30',
    danger: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
    info: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
    neutral: 'bg-surface-500/15 text-surface-300 ring-1 ring-surface-500/30',
  }

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  }

  const dotColors = {
    success: 'bg-primary-400',
    warning: 'bg-accent-400',
    danger: 'bg-red-400',
    info: 'bg-blue-400',
    neutral: 'bg-surface-400',
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`}
        />
      )}
      {children}
    </span>
  )
}
