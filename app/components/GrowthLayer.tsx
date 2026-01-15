'use client'

import { useMemo } from 'react'
import { TrendingUp, DollarSign, Shield } from 'lucide-react'
import { WhiteboxTrace } from '../types'

interface GrowthLayerProps {
  logs: WhiteboxTrace[]
}

export default function GrowthLayer({ logs }: GrowthLayerProps) {
  const growthData = useMemo(() => {
    // 统计流量来源
    const trafficChannels = new Map<string, number>()
    const attributionCosts: number[] = []
    const attributionConfidences: number[] = []
    const qualityScores: number[] = []
    
    logs.forEach(log => {
      const channel = log.traffic_channel || log.internal_variables?.traffic_channel || '自然流量'
      trafficChannels.set(channel, (trafficChannels.get(channel) || 0) + 1)
      
      const cost = log.attribution_cost || log.internal_variables?.attribution_cost
      if (cost !== undefined && cost !== null) {
        attributionCosts.push(cost)
      }
      
      const confidence = log.attribution_confidence || log.internal_variables?.attribution_confidence
      if (confidence !== undefined && confidence !== null) {
        attributionConfidences.push(confidence)
      }
      
      const qFactor = log.internal_variables?.q_factor
      if (qFactor !== undefined && qFactor !== null) {
        qualityScores.push(qFactor)
      }
    })
    
    // 计算平均值
    const avgCAC = attributionCosts.length > 0 
      ? attributionCosts.reduce((a, b) => a + b, 0) / attributionCosts.length 
      : 1.0 // 默认 CAC
    
    const avgConfidence = attributionConfidences.length > 0
      ? attributionConfidences.reduce((a, b) => a + b, 0) / attributionConfidences.length
      : 0.75 // 默认置信度
    
    const avgQuality = qualityScores.length > 0
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
      : 0.85 // 默认质量分
    
    // 获取主要流量渠道
    const topChannels = Array.from(trafficChannels.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([channel, count]) => ({ channel, count }))
    
    return {
      topChannels,
      avgCAC,
      avgConfidence,
      avgQuality,
      totalTraffic: logs.length
    }
  }, [logs])
  
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-[#2563eb]" />
        <h3 className="text-sm font-bold text-[#2563eb]">上游-增长</h3>
      </div>
      
      <div className="space-y-3">
        {/* 流量来源 */}
        <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
          <div className="text-xs font-semibold text-gray-700 mb-1.5">买量渠道</div>
          <div className="space-y-1">
            {growthData.topChannels.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[10px]">
                <span className="text-gray-600">{item.channel}</span>
                <span className="font-semibold text-blue-700">{item.count} 次</span>
              </div>
            ))}
            {growthData.topChannels.length === 0 && (
              <div className="text-[10px] text-gray-500">自然流量</div>
            )}
          </div>
        </div>
        
        {/* CAC 成本 */}
        <div className="bg-green-50 rounded-lg p-2 border border-green-200">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-green-600" />
            <div className="text-xs font-semibold text-gray-700">CAC 成本</div>
          </div>
          <div className="text-lg font-bold text-green-700">${growthData.avgCAC.toFixed(2)}</div>
          <div className="text-[9px] text-gray-500 mt-0.5">平均归因成本</div>
        </div>
        
        {/* 流量质量初评 */}
        <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
          <div className="flex items-center gap-1.5 mb-1">
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <div className="text-xs font-semibold text-gray-700">流量质量</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-purple-700">{(growthData.avgQuality * 100).toFixed(1)}%</div>
            <div className="text-[9px] text-gray-500">置信度 {(growthData.avgConfidence * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}

