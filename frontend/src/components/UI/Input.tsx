import React from 'react'
import { LucideIcon } from 'lucide-react'

interface InputProps {
  type?: 'text' | 'number' | 'email' | 'password' | 'search'
  value?: string | number
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  unit?: string
  min?: number
  max?: number
  step?: number
  onChange?: (value: string) => void
  onBlur?: () => void
  onFocus?: () => void
  className?: string
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  value,
  placeholder,
  disabled = false,
  error,
  label,
  icon: Icon,
  iconPosition = 'left',
  unit,
  min,
  max,
  step,
  onChange,
  onBlur,
  onFocus,
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value)
  }
  
  const baseClasses = 'w-full px-3 py-2 text-sm border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
  
  const stateClasses = error
    ? 'border-red-300 focus:ring-red-500'
    : disabled
    ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
    : 'border-gray-300 hover:border-gray-400 focus:border-primary-500'
  
  const iconClasses = 'absolute top-1/2 transform -translate-y-1/2 text-gray-400'
  const leftIconClasses = `${iconClasses} left-3`
  const rightIconClasses = `${iconClasses} right-3`
  
  const inputClasses = `
    ${baseClasses}
    ${stateClasses}
    ${Icon && iconPosition === 'left' ? 'pl-10' : ''}
    ${Icon && iconPosition === 'right' ? 'pr-10' : ''}
    ${unit ? 'pr-12' : ''}
    ${className}
  `.trim()
  
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <Icon size={16} className={leftIconClasses} />
        )}
        
        <input
          type={type}
          value={value ?? ''}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          className={inputClasses}
        />
        
        {Icon && iconPosition === 'right' && (
          <Icon size={16} className={rightIconClasses} />
        )}
        
        {unit && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
            {unit}
          </span>
        )}
      </div>
      
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}

export default Input