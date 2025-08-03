import React from 'react'
import { LucideIcon } from 'lucide-react'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'icon' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  children?: React.ReactNode
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  children,
  onClick,
  className = '',
  type = 'button',
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-primary-500 shadow-sm',
    icon: 'bg-transparent text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus:ring-primary-500',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-primary-500'
  }
  
  const sizeClasses = {
    sm: variant === 'icon' ? 'w-8 h-8 p-1' : 'px-3 py-1.5 text-sm',
    md: variant === 'icon' ? 'w-9 h-9 p-2' : 'px-4 py-2 text-sm',
    lg: variant === 'icon' ? 'w-10 h-10 p-2.5' : 'px-6 py-3 text-base'
  }
  
  const radiusClasses = variant === 'icon' ? 'rounded-md' : 'rounded-md'
  
  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${radiusClasses}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `.trim()
  
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 18
  
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon size={iconSize} className={children ? 'mr-2' : ''} />
          )}
          {children}
          {Icon && iconPosition === 'right' && (
            <Icon size={iconSize} className={children ? 'ml-2' : ''} />
          )}
        </>
      )}
    </button>
  )
}

export default Button