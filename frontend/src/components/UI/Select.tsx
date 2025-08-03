import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface SelectProps {
  value?: string | number
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
  options: SelectOption[]
  onChange?: (value: string | number) => void
  className?: string
}

export const Select: React.FC<SelectProps> = ({
  value,
  placeholder = '请选择...',
  disabled = false,
  error,
  label,
  options,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const selectRef = useRef<HTMLDivElement>(null)
  
  const selectedOption = options.find(option => option.value === value)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1)
    }
  }, [isOpen])
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (isOpen && highlightedIndex >= 0) {
          const option = options[highlightedIndex]
          if (!option.disabled) {
            onChange?.(option.value)
            setIsOpen(false)
          }
        } else {
          setIsOpen(!isOpen)
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : prev
          )
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (isOpen) {
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev)
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }
  
  const handleOptionClick = (option: SelectOption) => {
    if (!option.disabled) {
      onChange?.(option.value)
      setIsOpen(false)
    }
  }
  
  const baseClasses = 'w-full px-3 py-2 text-sm border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer'
  
  const stateClasses = error
    ? 'border-red-300 focus:ring-red-500'
    : disabled
    ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
    : 'border-gray-300 hover:border-gray-400 focus:border-primary-500'
  
  const triggerClasses = `
    ${baseClasses}
    ${stateClasses}
    ${isOpen ? 'ring-2 ring-primary-500 border-primary-500' : ''}
    ${className}
  `.trim()
  
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative" ref={selectRef}>
        <div
          className={triggerClasses}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center justify-between">
            <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
              {selectedOption?.label || placeholder}
            </span>
            <ChevronDown 
              size={16} 
              className={`text-gray-400 transition-transform duration-200 ${
                isOpen ? 'transform rotate-180' : ''
              }`}
            />
          </div>
        </div>
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            <ul role="listbox" className="py-1">
              {options.map((option, index) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  className={`
                    px-3 py-2 text-sm cursor-pointer flex items-center justify-between
                    ${option.disabled 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : highlightedIndex === index
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-900 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => handleOptionClick(option)}
                  onMouseEnter={() => !option.disabled && setHighlightedIndex(index)}
                >
                  <span>{option.label}</span>
                  {option.value === value && (
                    <Check size={16} className="text-primary-600" />
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}

export default Select