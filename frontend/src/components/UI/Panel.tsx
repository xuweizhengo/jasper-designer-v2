import React, { useState } from 'react'
import { ChevronDown, LucideIcon } from 'lucide-react'

interface PanelProps {
  title: string
  icon?: LucideIcon
  children: React.ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
  className?: string
}

export const Panel: React.FC<PanelProps> = ({
  title,
  icon: Icon,
  children,
  collapsible = false,
  defaultCollapsed = false,
  className = '',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div 
        className={`
          flex items-center justify-between px-4 py-3 border-b border-gray-100
          ${collapsible ? 'cursor-pointer hover:bg-gray-50' : ''}
        `}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} className="text-gray-600" />}
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        </div>
        
        {collapsible && (
          <ChevronDown 
            size={16} 
            className={`text-gray-400 transition-transform duration-200 ${
              isCollapsed ? 'transform rotate-180' : ''
            }`}
          />
        )}
      </div>
      
      {(!collapsible || !isCollapsed) && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  )
}

// Property Group Component for nested grouping
interface PropertyGroupProps {
  title: string
  icon?: LucideIcon
  children: React.ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export const PropertyGroup: React.FC<PropertyGroupProps> = ({
  title,
  icon: Icon,
  children,
  collapsible = true,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  
  return (
    <div className="border border-gray-200 rounded-md mb-3 last:mb-0">
      <div 
        className={`
          flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200
          ${collapsible ? 'cursor-pointer hover:bg-gray-100' : ''}
        `}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-gray-500" />}
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        
        {collapsible && (
          <ChevronDown 
            size={14} 
            className={`text-gray-400 transition-transform duration-200 ${
              isCollapsed ? 'transform rotate-180' : ''
            }`}
          />
        )}
      </div>
      
      {(!collapsible || !isCollapsed) && (
        <div className="p-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  )
}

export default Panel