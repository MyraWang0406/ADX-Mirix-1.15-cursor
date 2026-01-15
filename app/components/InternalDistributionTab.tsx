'use client'

import { useState } from 'react'
import InternalReachbackTab from './InternalReachbackTab'
import UserJourneyTab from './UserJourneyTab'
import { WhiteboxTrace } from '../types'

interface InternalDistributionTabProps {
  logs: WhiteboxTrace[]
  selectedRequestId?: string | null
  diversity?: number
  onNewAuthorBoostChange?: (enabled: boolean) => void
}

export default function InternalDistributionTab({ logs, selectedRequestId, diversity, onNewAuthorBoostChange }: InternalDistributionTabProps) {
  const [activeModule, setActiveModule] = useState<'reachback' | 'journey'>('reachback')
  return (
    <div className="space-y-4">
      {/* 模块切换 */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-lg overflow-x-auto">
        <button
          onClick={() => setActiveModule('reachback')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeModule === 'reachback'
              ? 'text-[#2563eb] border-b-2 border-[#2563eb] bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <span>内回流</span>
        </button>
        <button
          onClick={() => setActiveModule('journey')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeModule === 'journey'
              ? 'text-[#2563eb] border-b-2 border-[#2563eb] bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <span>用户动线</span>
        </button>
      </div>
      
      {/* 模块内容 */}
      <div className="bg-white rounded-b-lg border border-gray-100 p-4 shadow-sm">
        {activeModule === 'reachback' ? (
          <InternalReachbackTab />
        ) : (
          <UserJourneyTab 
            logs={logs} 
            selectedRequestId={selectedRequestId}
            diversity={diversity}
            onNewAuthorBoostChange={onNewAuthorBoostChange}
          />
        )}
      </div>
    </div>
  )
}

