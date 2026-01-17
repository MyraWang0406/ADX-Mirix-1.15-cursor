'use client'

import { useMemo } from 'react'
import { DollarSign, TrendingUp, Target } from 'lucide-react'
import { WhiteboxTrace } from '../types'

interface MonetizationLayerProps {
  logs: WhiteboxTrace[]
  selectedRequestId?: string | null
}

export default function MonetizationLayer({ logs, selectedRequestId }: MonetizationLayerProps) {
  const monetizationData = useMemo(() => {
    const requestLogs = selectedRequestId
      ? logs.filter(l => l.request_id === selectedRequestId)
      : logs
    
    // 统计竞价数据
    const auctionLogs = requestLogs.filter(l => l.action === 'AUCTION_RESULT')
    const totalBids = requestLogs.filter(l => 
      l.action === 'BID_CALCULATION' || l.action === 'BID_SUBMITTED'
    ).length
    
    const totalSaved = requestLogs
      .filter(l => l.saved_amount && l.saved_amount > 0)
      .reduce((sum, l) => sum + (l.saved_amount || 0), 0)
    
    const totalPaid = requestLogs
      .filter(l => l.actual_paid_price && l.actual_paid_price > 0)
      .reduce((sum, l) => sum + (l.actual_paid_price || 0), 0)
    
    const totalEcpm = requestLogs
      .filter(l => l.eCPM && l.eCPM > 0)
      .reduce((sum, l) => sum + (l.eCPM || 0), 0)
    
    // 获取分发结果
    const distributionLog = requestLogs.find(l => 
      l.action === 'OPPORTUNITY_COST_CHECK' || l.action === 'AUCTION_RESULT'
    )
    const distributionOutlet = distributionLog?.internal_variables?.distribution_outlet || 
                               distributionLog?.distribution_outlet || 
                               '首页资源位'
    const selectedPath = distributionLog?.internal_variables?.selected_path || 
                        distributionLog?.selected_path || 
                        'ads'
    
    return {
      totalBids,
      winCount: auctionLogs.length,
      totalSaved,
      totalPaid,
      totalEcpm,
      distributionOutlet,
      selectedPath,
      winRate: totalBids > 0 ? (auctionLogs.length / totalBids * 100) : 0
    }
  }, [logs, selectedRequestId])
  
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-[#2563eb]" />
        <h3 className="text-sm font-bold text-[#2563eb]">下游-变现</h3>
      </div>
      
      <div className="flex-1 space-y-3">
        {/* 广告竞价 */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <div className="text-xs font-semibold text-gray-700">广告竞价</div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <div className="text-gray-600">总出价数</div>
              <div className="font-bold text-blue-700">{monetizationData.totalBids}</div>
            </div>
            <div>
              <div className="text-gray-600">中标数</div>
              <div className="font-bold text-green-700">{monetizationData.winCount}</div>
            </div>
            <div>
              <div className="text-gray-600">中标率</div>
              <div className="font-bold text-purple-700">{monetizationData.winRate.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-gray-600">总 eCPM</div>
              <div className="font-bold text-blue-700">${(monetizationData.totalEcpm / 1000).toFixed(2)}</div>
            </div>
          </div>
        </div>
        
        {/* 二价机制节省 */}
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <div className="text-xs font-semibold text-gray-700">二价机制节省</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gray-600">累计节省</span>
              <span className="font-bold text-green-700">${monetizationData.totalSaved.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gray-600">实际支付</span>
              <span className="font-bold text-blue-700">${monetizationData.totalPaid.toFixed(2)}</span>
            </div>
            <div className="text-[9px] text-gray-500 mt-1">
              节省率：{monetizationData.totalPaid > 0 
                ? ((monetizationData.totalSaved / monetizationData.totalPaid) * 100).toFixed(1) 
                : 0}%
            </div>
          </div>
        </div>
        
        {/* 最终分发结果 */}
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <div className="text-xs font-semibold text-gray-700 mb-2">最终分发结果</div>
          <div className="space-y-1 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">分发出口</span>
              <span className="font-semibold text-purple-700">{monetizationData.distributionOutlet}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">选择路径</span>
              <span className="font-semibold text-purple-700">
                {monetizationData.selectedPath === 'ads' ? '广告位' : 
                 monetizationData.selectedPath === 'search' ? '搜索推荐' : 'Push权益'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


