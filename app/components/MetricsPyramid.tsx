'use client'

import { useMemo, useState, useEffect } from 'react'
import { Target, TrendingUp, Users, Zap, Filter, AlertCircle, CheckCircle } from 'lucide-react'
import { WhiteboxTrace } from '../types'

interface MetricsPyramidProps {
  logs: WhiteboxTrace[]
  onDiversityChange?: (diversity: number) => void
}

export default function MetricsPyramid({ logs, onDiversityChange }: MetricsPyramidProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // 计算北极星指标（使用稳定的计算，避免随机数导致hydration错误）
  const northStarMetrics = useMemo(() => {
    const totalRequests = new Set(logs.map(l => l.request_id)).size
    const totalEcpm = logs
      .filter(l => l.eCPM && l.eCPM > 0)
      .reduce((sum, l) => sum + (l.eCPM || 0), 0) / 1000
    
    // 使用稳定的计算，基于logs数量而非随机数
    const totalLtv = totalEcpm * 1.5 + (totalRequests * 2.5)
    
    // 广告eCPM平均值
    const avgEcpm = totalRequests > 0 ? (totalEcpm / totalRequests) : 0
    
    // 人均消费条数（基于请求数稳定计算）
    const avgConsumption = 12.5 + (totalRequests * 0.1)
    
    return {
      totalLtv: totalLtv,
      avgEcpm: avgEcpm,
      avgConsumption: avgConsumption
    }
  }, [logs])
  
  // 计算过程指标（使用稳定的计算）
  const processMetrics = useMemo(() => {
    const totalRequests = new Set(logs.map(l => l.request_id)).size
    // 召回层（基于请求数稳定计算）
    const interestMatchRate = 80 + (totalRequests % 10) // 兴趣匹配度
    const recallFreshness = 35 + (totalRequests % 10) // 召回新鲜度（24h内）
    
    // 排序层
    const top10Ctr = 18 + (totalRequests % 4) // 前10条点击率
    
    // 互动层
    const finishRate = 82 + (totalRequests % 8) // 完播率
    const interactionRate = 15 + (totalRequests % 5) // 互动率
    
    return {
      recall: {
        interestMatchRate,
        recallFreshness
      },
      ranking: {
        top10Ctr
      },
      interaction: {
        finishRate,
        interactionRate
      }
    }
  }, [logs])
  
  // 计算诊断指标（使用稳定的计算，并支持联动）
  const diagnosticMetrics = useMemo(() => {
    const totalRequests = new Set(logs.map(l => l.request_id)).size
    // 内容多样性（打散度）- 基于请求数稳定计算
    const diversity = 0.85 + ((totalRequests % 10) / 100)
    
    // 新创作者/新内容曝光率（公平性）
    const newCreatorExposure = 12 + (totalRequests % 5)
    
    // 负反馈率（用户体验底线）
    const negativeFeedbackRate = 4.2 + ((totalRequests % 15) / 10)
    
    return {
      diversity,
      newCreatorExposure,
      negativeFeedbackRate
    }
  }, [logs])
  
  // 通知父组件多样性变化
  useEffect(() => {
    if (onDiversityChange && mounted) {
      onDiversityChange(diagnosticMetrics.diversity)
    }
  }, [diagnosticMetrics.diversity, onDiversityChange, mounted])
  
  return (
    <div className="space-y-4">
      {/* 北极星指标层 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-gray-800">北极星指标层（业务目标）</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <div className="text-xs text-gray-600">全域总价值 (Total LTV)</div>
            </div>
            <div className="text-2xl font-bold text-blue-700">${northStarMetrics.totalLtv.toFixed(2)}</div>
            <div className="text-[10px] text-gray-500 mt-1">团队方向指标</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-green-600" />
              <div className="text-xs text-gray-600">广告 eCPM</div>
            </div>
            <div className="text-[20px] font-bold text-green-700">${mounted ? northStarMetrics.avgEcpm.toFixed(2) : '0.00'}</div>
            <div className="text-[10px] text-gray-500 mt-1">平均每千次曝光价值</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-purple-600" />
              <div className="text-xs text-gray-600">人均消费条数</div>
            </div>
            <div className="text-[20px] font-bold text-purple-700">{mounted ? northStarMetrics.avgConsumption.toFixed(1) : '0.0'}</div>
            <div className="text-[10px] text-gray-500 mt-1">用户活跃度指标</div>
          </div>
        </div>
      </div>
      
      {/* 过程指标层 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-orange-600" />
          <h3 className="text-sm font-bold text-gray-800">过程指标层（算法优化）</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 召回层 */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
            <div className="text-xs font-semibold text-gray-700 mb-2">召回层</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">兴趣匹配度</span>
                <span className="text-sm font-bold text-blue-700">{mounted ? processMetrics.recall.interestMatchRate.toFixed(1) : '0.0'}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">召回新鲜度 (24h)</span>
                <span className="text-sm font-bold text-green-700">{mounted ? processMetrics.recall.recallFreshness.toFixed(1) : '0.0'}%</span>
              </div>
            </div>
          </div>
          
          {/* 排序层 */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
            <div className="text-xs font-semibold text-gray-700 mb-2">排序层</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">前10条点击率</span>
                <span className="text-sm font-bold text-purple-700">{mounted ? processMetrics.ranking.top10Ctr.toFixed(1) : '0.0'}%</span>
              </div>
            </div>
          </div>
          
          {/* 互动层 */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
            <div className="text-xs font-semibold text-gray-700 mb-2">互动层</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">完播率</span>
                <span className="text-sm font-bold text-green-700">{mounted ? processMetrics.interaction.finishRate.toFixed(1) : '0.0'}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">互动率</span>
                <span className="text-sm font-bold text-orange-700">{mounted ? processMetrics.interaction.interactionRate.toFixed(1) : '0.0'}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 诊断指标层 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-red-600" />
          <h3 className="text-sm font-bold text-gray-800">诊断指标层（健康护栏）</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 内容多样性 */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700">内容多样性</span>
              <span className={`text-xs font-bold ${mounted && diagnosticMetrics.diversity >= 0.8 ? 'text-green-600' : 'text-red-600'}`}>
                {mounted ? diagnosticMetrics.diversity.toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${diagnosticMetrics.diversity >= 0.8 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${diagnosticMetrics.diversity * 100}%` }}
              />
            </div>
            <div className="text-[10px] text-gray-500 mt-1">打散度阈值: ≥0.8</div>
          </div>
          
          {/* 新创作者曝光率 */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700">新创作者曝光率</span>
              <span className={`text-xs font-bold ${mounted && diagnosticMetrics.newCreatorExposure >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                {mounted ? diagnosticMetrics.newCreatorExposure.toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${diagnosticMetrics.newCreatorExposure >= 10 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(diagnosticMetrics.newCreatorExposure, 20)}%` }}
              />
            </div>
            <div className="text-[10px] text-gray-500 mt-1">公平性阈值: ≥10%</div>
          </div>
          
          {/* 负反馈率 */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700">负反馈率</span>
              <span className={`text-xs font-bold ${mounted && diagnosticMetrics.negativeFeedbackRate <= 5 ? 'text-green-600' : 'text-red-600'}`}>
                {mounted ? diagnosticMetrics.negativeFeedbackRate.toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${diagnosticMetrics.negativeFeedbackRate <= 5 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(diagnosticMetrics.negativeFeedbackRate * 10, 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-gray-500 mt-1">用户体验底线: ≤5%</div>
          </div>
        </div>
      </div>
    </div>
  )
}

