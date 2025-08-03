import React, { useState, useRef, useEffect } from 'react'
import { Palette } from 'lucide-react'

interface ColorPickerProps {
  value?: string
  label?: string
  disabled?: boolean
  onChange?: (color: string) => void
  className?: string
}

const PRESET_COLORS = [
  '#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#f3f4f6', '#ffffff',
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e'
]

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value = '#000000',
  label,
  disabled = false,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [customColor, setCustomColor] = useState(value)
  const pickerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  useEffect(() => {
    setCustomColor(value)
  }, [value])
  
  const handleColorSelect = (color: string) => {
    onChange?.(color)
    setIsOpen(false)
  }
  
  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setCustomColor(color)
    onChange?.(color)
  }
  
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative" ref={pickerRef}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            w-full h-9 rounded-md border border-gray-300 flex items-center gap-2 px-3
            ${disabled 
              ? 'bg-gray-50 cursor-not-allowed' 
              : 'bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer'
            }
            ${className}
          `}
        >
          <div 
            className="w-5 h-5 rounded border border-gray-200 flex-shrink-0"
            style={{ backgroundColor: value }}
          />
          <span className="text-sm text-gray-700 flex-1 text-left">
            {value.toUpperCase()}
          </span>
          <Palette size={16} className="text-gray-400" />
        </button>
        
        {isOpen && (
          <div className="absolute z-50 mt-1 p-4 bg-white border border-gray-200 rounded-lg shadow-lg w-64">
            {/* 预设颜色 */}
            <div className="mb-4">
              <div className="text-xs font-medium text-gray-700 mb-2">预设颜色</div>
              <div className="grid grid-cols-7 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`
                      w-6 h-6 rounded border-2 hover:scale-110 transition-transform
                      ${value === color ? 'border-primary-500' : 'border-gray-200'}
                    `}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            
            {/* 自定义颜色 */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">自定义颜色</div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value)
                    // 验证hex颜色格式
                    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                      onChange?.(e.target.value)
                    }
                  }}
                  placeholder="#000000"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
            
            {/* 透明选项 */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => handleColorSelect('transparent')}
                className={`
                  w-full h-8 rounded border-2 flex items-center justify-center text-xs font-medium
                  ${value === 'transparent' 
                    ? 'border-primary-500 bg-primary-50 text-primary-700' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }
                `}
                style={{
                  background: value === 'transparent' 
                    ? undefined 
                    : 'repeating-conic-gradient(#f3f4f6 0% 25%, white 0% 50%) 50% / 8px 8px'
                }}
              >
                透明
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ColorPicker