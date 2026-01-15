'use client'

import { useState, ReactNode } from 'react'
import { TrendingUp, Zap, DollarSign } from 'lucide-react'

interface Tab {
  id: string
  label: string
  icon: ReactNode
  content: ReactNode
}

interface TabContainerProps {
  tabs: Tab[]
  defaultTab?: string
}

export default function TabContainer({ tabs, defaultTab }: TabContainerProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border border-gray-100 shadow-sm">
      {/* Tab 导航 */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-lg overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-[#2563eb] border-b-2 border-[#2563eb] bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split('（')[0]}</span>
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="flex-1 overflow-auto bg-[#f8f9fa] p-2 md:p-4">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  )
}

