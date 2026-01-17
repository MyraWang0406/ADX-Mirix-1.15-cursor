'use client'

import { useMemo } from 'react'
import { ArrowDown, Search, Filter, Zap, Shuffle } from 'lucide-react'
import { WhiteboxTrace } from '../types'

interface FourLayerFunnelProps {
  logs: WhiteboxTrace[]
  selectedRequestId?: string | null
}

export default function FourLayerFunnel({ logs, selectedRequestId }: FourLayerFunnelProps) {
  const funnelData = useMemo(() => {
    // 获取选中请求的漏斗数据
    const requestLogs = selectedRequestId 
      ? logs.filter(l => l.request_id === selectedRequestId)
      : logs
    
    const funnelLog = requestLogs.find(l => l.action === 'FUNNEL_PROCESSING')
    
    if (!funnelLog) {
      // 如果没有漏斗日志，使用默认值
      return {
        recalled: 100,
        ranked: 80,
        reRanked: 60,
        organicLtv: 2.5,
        recallPassRate: 100,
        rankPassRate: 80,
        reRankPassRate: 75
      }
    }
    
    const internalVars = funnelLog.internal_variables || {}
    const recalled = internalVars.recalled_count || 100
    const ranked = internalVars.ranked_count || 80
    const reRanked = internalVars.re_ranked_count || 60
    const organicLtv = internalVars.organic_ltv_adjusted || 2.5
    
    // 计算过滤率
    const recallPassRate = recalled > 0 ? 100 : 0
    const rankPassRate = recalled > 0 ? (ranked / recalled * 100) : 0
    const reRankPassRate = ranked > 0 ? (reRanked / ranked * 100) : 0
    
    return {
      recalled,
      ranked,
      reRanked,
      organicLtv,
      recallPassRate,
      rankPassRate,
      reRankPassRate
    }
  }, [logs, selectedRequestId])
  
  const layers = [
    {
      id: 'recall',
      name: '召回层',
      icon: <Search className="w-5 h-5" />,
      color: 'bg-blue-500',
      input: funnelData.recalled,
      output: funnelData.recalled,
      passRate: funnelData.recallPassRate,
      description: '多路召回：标签、协同、热门、冷启',
      formula: 'Recall = Interest + Collaborative + Popular + ColdStart'
    },
    {
      id: 'rank',
      name: '精排层',
      icon: <Filter className="w-5 h-5" />,
      color: 'bg-purple-500',
      input: funnelData.recalled,
      output: funnelData.ranked,
      passRate: funnelData.rankPassRate,
      description: '多目标融合：Score = w·CTR + x·Like + y·Finish',
      formula: 'Score = 0.4·CTR + 0.25·Like + 0.25·Finish + 0.1·Comment'
    },
    {
      id: 'rerank',
      name: '重排层',
      icon: <Shuffle className="w-5 h-5" />,
      color: 'bg-green-500',
      input: funnelData.ranked,
      output: funnelData.reRanked,
      passRate: funnelData.reRankPassRate,
      description: '业务干预：打散、提权、广告插入',
      formula: 'ReRank = Diversify + Boost + AdInsert'
    }
  ]
  
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-[#2563eb]" />
        <h3 className="text-sm font-bold text-[#2563eb]">四层漏斗（召回 → 精排 → 重排）</h3>
      </div>
      
      <div className="flex-1 flex flex-col justify-between gap-3">
        {layers.map((layer, idx) => (
          <div key={layer.id} className="flex items-center gap-3">
            {/* 左侧：图标和名称 */}
            <div className="flex flex-col items-center min-w-[80px]">
              <div className={`w-12 h-12 rounded-full ${layer.color} flex items-center justify-center text-white mb-1 shadow-md`}>
                {layer.icon}
              </div>
              <div className="text-xs font-semibold text-gray-700 text-center">{layer.name}</div>
            </div>
            
            {/* 中间：漏斗数据 */}
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-600">入参量</div>
                  <div className="text-xs font-bold text-gray-800">{layer.input} 条</div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-600">出参量</div>
                  <div className="text-xs font-bold text-gray-800">{layer.output} 条</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600">过滤率</div>
                  <div className={`text-xs font-bold ${layer.passRate >= 70 ? 'text-green-600' : layer.passRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {layer.passRate.toFixed(1)}%
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-gray-500 italic">
                  {layer.description}
                </div>
                <div className="mt-1 text-[9px] text-gray-400 font-mono">
                  {layer.formula}
                </div>
              </div>
            </div>
            
            {/* 箭头 */}
            {idx < layers.length - 1 && (
              <ArrowDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
      
      {/* 底部：Organic LTV */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-600">Organic LTV（自然流量预期价值）</div>
          <div className="text-lg font-bold text-green-600">${funnelData.organicLtv.toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}


