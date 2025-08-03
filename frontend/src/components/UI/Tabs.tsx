import React, { useState } from 'react'
import { LucideIcon } from 'lucide-react'

interface TabItem {
  id: string
  label: string
  icon?: LucideIcon
  content: React.ReactNode
  disabled?: boolean
  badge?: string | number
}

interface TabsProps {
  items: TabItem[]
  defaultActiveTab?: string
  activeTab?: string
  onTabChange?: (tabId: string) => void
  variant?: 'default' | 'pills' | 'underline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultActiveTab,
  activeTab: controlledActiveTab,
  onTabChange,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultActiveTab || items[0]?.id || ''
  )
  
  const activeTab = controlledActiveTab || internalActiveTab
  const activeItem = items.find(item => item.id === activeTab)
  
  const handleTabClick = (tabId: string) => {
    const item = items.find(item => item.id === tabId)
    if (item?.disabled) return
    
    if (!controlledActiveTab) {
      setInternalActiveTab(tabId)
    }
    onTabChange?.(tabId)
  }
  
  const getTabClasses = (item: TabItem, isActive: boolean) => {
    const baseClasses = 'inline-flex items-center gap-2 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    }
    
    const variantClasses = {
      default: isActive
        ? 'bg-primary-100 text-primary-700 border border-primary-200'
        : 'text-gray-600 hover:text-gray-900 border border-transparent hover:border-gray-200',
      pills: isActive
        ? 'bg-primary-600 text-white'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
      underline: isActive
        ? 'text-primary-600 border-b-2 border-primary-600'
        : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300'
    }
    
    const disabledClasses = item.disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'cursor-pointer'
    
    const radiusClasses = variant === 'underline' ? '' : 'rounded-md'
    
    return `
      ${baseClasses}
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      ${disabledClasses}
      ${radiusClasses}
    `.trim()
  }
  
  const containerClasses = variant === 'underline' 
    ? 'border-b border-gray-200' 
    : 'bg-gray-50 p-1 rounded-lg'
  
  return (
    <div className={className}>
      {/* Tab Headers */}
      <div className={`flex ${containerClasses}`}>
        {items.map((item) => {
          const isActive = item.id === activeTab
          const Icon = item.icon
          
          return (
            <button
              key={item.id}
              type="button"
              className={getTabClasses(item, isActive)}
              onClick={() => handleTabClick(item.id)}
              disabled={item.disabled}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${item.id}`}
            >
              {Icon && <Icon size={16} />}
              <span>{item.label}</span>
              {item.badge && (
                <span className={`
                  inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full
                  ${isActive 
                    ? 'bg-primary-200 text-primary-800' 
                    : 'bg-gray-200 text-gray-700'
                  }
                `}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
      
      {/* Tab Content */}
      <div className="mt-4">
        {items.map((item) => (
          <div
            key={item.id}
            id={`tabpanel-${item.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${item.id}`}
            className={activeTab === item.id ? 'block' : 'hidden'}
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Tabs