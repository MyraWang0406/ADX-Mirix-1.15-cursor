'use client'

import { useMemo } from 'react'
import { TrendingUp, BarChart3, Target, AlertCircle } from 'lucide-react'
import { WhiteboxTrace } from '../types'

interface GlobalTrafficMetricsProps {
  logs: WhiteboxTrace[]
}

export default function GlobalTrafficMetrics({ logs }: GlobalTrafficMetricsProps) {
  const metrics = useMemo(() => {
    // 计算全域平均 LTV
    const totalValues = logs
      .filter(l => l.v_total !== null && l.v_total !== undefined)
      .map(l => l.v_total || 0)
    const avgLTV = totalValues.length > 0 
      ? totalValues.reduce((sum, v) => sum + v, 0) / totalValues.length 
      : 0
    
    // 计算广告贡献占比
    const adValues = logs
      .filter(l => l.selected_path === 'ads' && l.eCPM)
      .map(l => (l.eCPM || 0) / 1000.0)
    const totalAdValue = adValues.reduce((sum, v) => sum + v, 0)
    const totalValue = totalValues.reduce((sum, v) => sum + v, 0)
    const adContribution = totalValue > 0 ? (totalAdValue / totalValue * 100) : 0
    
    // 计算搜推分发效率（搜索路径选择率）
    const searchPaths = logs.filter(l => l.selected_path === 'search').length
    const totalPaths = logs.filter(l => l.selected_path).length
    const searchEfficiency = totalPaths > 0 ? (searchPaths / totalPaths * 100) : 0
    
    // 计算触达折损率（Push路径选择率，表示广告被Push替代）
    const pushPaths = logs.filter(l => l.selected_path === 'push').length
    const touchLossRate = totalPaths > 0 ? (pushPaths / totalPaths * 100) : 0
    
    return {
      avgLTV,
      adContribution,
      searchEfficiency,
      touchLossRate
    }
  }, [logs])
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2.5">
      {/* 全域平均 LTV */}
      <div className="col-span-1 p-2 bg-white border border-gray-100 rounded">
        <div className="flex items-center justify-between mb-1">
          <TrendingUp className="w-3 h-3 text-[#2563eb]" />
          <span className="text-[9px] text-gray-500">全域平均 LTV</span>
        </div>
        <div className="text-base font-bold text-[#2563eb]">
          ${metrics.avgLTV.toFixed(2)}
        </div>
        <div className="text-[8px] text-gray-500">平均用户生命周期价值</div>
      </div>
      
      {/* 广告贡献占比 */}
      <div className="col-span-1 p-2 bg-white border border-gray-100 rounded">
        <div className="flex items-center justify-between mb-1">
          <BarChart3 className="w-3 h-3 text-purple-600" />
          <span className="text-[9px] text-gray-500">广告贡献占比</span>
        </div>
        <div className="text-base font-bold text-purple-600">
          {metrics.adContribution.toFixed(1)}%
        </div>
        <div className="text-[8px] text-gray-500">广告在总价值中的占比</div>
      </div>
      
      {/* 搜推分发效率 */}
      <div className="col-span-1 p-2 bg-white border border-gray-100 rounded">
        <div className="flex items-center justify-between mb-1">
          <Target className="w-3 h-3 text-green-600" />
          <span className="text-[9px] text-gray-500">搜推分发效率</span>
        </div>
        <div className="text-base font-bold text-green-600">
          {metrics.searchEfficiency.toFixed(1)}%
        </div>
        <div className="text-[8px] text-gray-500">搜索路径选择率</div>
      </div>
      
      {/* 触达折损率 */}
      <div className="col-span-1 p-2 bg-white border border-gray-100 rounded">
        <div className="flex items-center justify-between mb-1">
          <AlertCircle className="w-3 h-3 text-orange-600" />
          <span className="text-[9px] text-gray-500">触达折损率</span>
        </div>
        <div className="text-base font-bold text-orange-600">
          {metrics.touchLossRate.toFixed(1)}%
        </div>
        <div className="text-[8px] text-gray-500">Push替代广告比例</div>
      </div>
    </div>
  )
}


