'use client'

import { useState } from 'react'
import { Search, Home, TrendingUp, Maximize2, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react'
import SearchQueryAnalysis from './SearchQueryAnalysis'
import SearchRecommendationFunnel from './SearchRecommendationFunnel'
import HomepageResourceSankey from './HomepageResourceSankey'
import UserJourneyFlow from './UserJourneyFlow'
import { WhiteboxTrace } from '../types'

interface UserJourneyTabProps {
  logs: WhiteboxTrace[]
  selectedRequestId?: string | null
  diversity?: number
  onNewAuthorBoostChange?: (enabled: boolean) => void
}

export default function UserJourneyTab({ logs, selectedRequestId, diversity, onNewAuthorBoostChange }: UserJourneyTabProps) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  
  const modules = [
    {
      id: 'search',
      name: '搜索',
      icon: <Search className="w-5 h-5" />,
      color: 'bg-blue-500',
      description: 'Query分析及转化效果'
    },
    {
      id: 'recommend',
      name: '推荐',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-purple-500',
      description: '搜推引擎四层漏斗'
    },
    {
      id: 'homepage',
      name: '首页',
      icon: <Home className="w-5 h-5" />,
      color: 'bg-green-500',
      description: '资源位动线及桑基图'
    },
    {
      id: 'resource',
      name: '资源位',
      icon: <Maximize2 className="w-5 h-5" />,
      color: 'bg-orange-500',
      description: '弹窗等资源位分析'
    }
  ]
  
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-800 mb-3">用户动线</h3>
      
      {/* 用户动线流 */}
      <UserJourneyFlow />
      
      {/* 模块列表 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {modules.map((module) => (
          <div key={module.id} className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
            <div
              onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col items-center gap-3">
                <div className={`w-12 h-12 rounded-full ${module.color} flex items-center justify-center text-white`}>
                  {module.icon}
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-800">{module.name}</div>
                  <div className="text-xs text-gray-500">{module.description}</div>
                </div>
                {expandedModule === module.id ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
            
            {/* 展开的详情 - 全屏展示 */}
            {expandedModule === module.id && (
              <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${module.color} flex items-center justify-center text-white`}>
                      {module.icon}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">{module.name}</h3>
                  </div>
                  <button
                    onClick={() => setExpandedModule(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                  >
                    关闭
                  </button>
                </div>
                <div className="p-6">
                  {module.id === 'search' && (
                    <SearchQueryAnalysis logs={logs} />
                  )}
                  
                  {module.id === 'recommend' && (
                    <div className="min-h-[600px]">
                      <SearchRecommendationFunnel 
                        logs={logs}
                        selectedRequestId={selectedRequestId}
                        diversity={diversity}
                        onNewAuthorBoostChange={onNewAuthorBoostChange}
                      />
                    </div>
                  )}
                  
                  {module.id === 'homepage' && (
                    <HomepageResourceSankey logs={logs} />
                  )}
                  
                  {module.id === 'resource' && (
                    <HomepageResourceSankey logs={logs} showResourceOnly={true} />
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

