'use client'

import { useState } from 'react'
import { Info, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { WhiteboxTrace } from '../types'

interface FormulaBreakdownProps {
  logs: WhiteboxTrace[]
  selectedRequestId: string | null
  highlightedProposal?: {
    type: string
    variable: string
    change: number
  } | null
}

export default function FormulaBreakdown({ logs, selectedRequestId, highlightedProposal }: FormulaBreakdownProps) {
  const [hoveredVariable, setHoveredVariable] = useState<string | null>(null)

  if (!selectedRequestId) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
        <div className="text-center py-8">
          <Info className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">点击左侧任意请求，查看 eCPM 公式拆解</p>
        </div>
      </div>
    )
  }

  // 获取选中请求的日志
  const requestLogs = logs.filter(l => l.request_id === selectedRequestId)
  const bidLog = requestLogs.find(l => 
    l.action === 'BID_CALCULATION' || l.action === 'BID_SUBMITTED'
  )
  const auctionLog = requestLogs.find(l => l.action === 'AUCTION_RESULT')

  // 提取数据
  const bidPrice = auctionLog?.internal_variables?.winner_bid ||
                   bidLog?.internal_variables?.final_bid || 
                   bidLog?.internal_variables?.bid_price || 0
  const pctr = auctionLog?.pCTR || 
               bidLog?.pCTR || 
               bidLog?.internal_variables?.pctr || 0
  const pcvr = auctionLog?.pCVR || 
               bidLog?.pCVR || 
               bidLog?.internal_variables?.pcvr || 0
  const qFactor = (auctionLog?.internal_variables?.q_factor ?? 
                 bidLog?.internal_variables?.q_factor ?? 1.0) as number
  const ecpm = auctionLog?.eCPM || 
               (bidPrice && pctr && pcvr ? bidPrice * pctr * pcvr * qFactor * 1000 : 0)

  // 变量定义和评价
  const variables = [
    {
      id: 'bid',
      label: 'Bid',
      value: bidPrice,
      unit: '$',
      description: '基础出价',
      detail: `这是广告主愿意为一次转化支付的基础价格。当前值为 $${bidPrice.toFixed(4)}。`,
      evaluation: bidPrice > 0.1 ? '出价合理，具备竞争力' : '出价较低，可能影响竞争力',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300'
    },
    {
      id: 'pctr',
      label: 'pCTR',
      value: pctr,
      unit: '',
      description: '预估点击率',
      detail: `pCTR（Predicted Click-Through Rate）是系统基于历史数据预测用户点击广告的概率。当前值为 ${(pctr * 100).toFixed(2)}%。`,
      evaluation: pctr > 0.02 ? '点击率预估极高，是胜出的核心原因' : 
                  pctr > 0.01 ? '点击率预估良好' : '点击率预估偏低，建议优化素材',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-300'
    },
    {
      id: 'pcvr',
      label: 'pCVR',
      value: pcvr,
      unit: '',
      description: '预估转化率',
      detail: `pCVR（Predicted Conversion Rate）是系统预测用户点击后完成转化的概率。当前值为 ${(pcvr * 100).toFixed(2)}%。`,
      evaluation: pcvr > 0.05 ? '转化率预估极高，用户质量优秀' : 
                  pcvr > 0.02 ? '转化率预估良好' : '转化率预估偏低，建议优化定向',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300'
    },
    {
      id: 'q_factor',
      label: 'q_factor',
      value: qFactor,
      unit: '',
      description: '流量质量系数',
      detail: `q_factor 是流量质量评分系数（0.0-1.0），用于惩罚低质量流量。当前值为 ${qFactor.toFixed(2)}。`,
      evaluation: qFactor >= 0.9 ? '流量质量优秀' : 
                  qFactor >= 0.7 ? '流量质量良好' : 
                  qFactor >= 0.5 ? '流量质量一般，存在风险' : '流量质量较差，已触发出价折损',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-300'
    }
  ]

  const hoveredVar = variables.find(v => v.id === hoveredVariable)

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-[#2563eb] mb-1">eCPM 公式拆解</h3>
        <p className="text-[10px] text-gray-500">鼠标悬停变量查看详细数据</p>
      </div>

      {/* 公式显示 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4 border border-gray-200">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800 mb-2">eCPM 计算公式</div>
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-[#2563eb] flex-wrap">
            <span>eCPM</span>
            <span>=</span>
            <span
              className={`px-3 py-1 rounded cursor-pointer transition-all ${
                hoveredVariable === 'bid' || (highlightedProposal?.variable === 'bid' && isFlashing)
                  ? 'bg-blue-200 scale-110 shadow-md animate-pulse' 
                  : hoveredVariable === 'bid' 
                    ? 'bg-blue-200 scale-110 shadow-md' 
                    : 'bg-white hover:bg-blue-100'
              }`}
              onMouseEnter={() => setHoveredVariable('bid')}
              onMouseLeave={() => setHoveredVariable(null)}
            >
              Bid
              {highlightedProposal?.variable === 'bid' && isFlashing && (
                <span className="ml-1 text-[10px] text-blue-600">
                  ({highlightedProposal.change > 0 ? '+' : ''}{highlightedProposal.change * 100}%)
                </span>
              )}
            </span>
            <span>×</span>
            <span
              className={`px-3 py-1 rounded cursor-pointer transition-all ${
                hoveredVariable === 'pctr' ? 'bg-purple-200 scale-110 shadow-md' : 'bg-white hover:bg-purple-100'
              }`}
              onMouseEnter={() => setHoveredVariable('pctr')}
              onMouseLeave={() => setHoveredVariable(null)}
            >
              pCTR
            </span>
            <span>×</span>
            <span
              className={`px-3 py-1 rounded cursor-pointer transition-all ${
                hoveredVariable === 'pcvr' ? 'bg-green-200 scale-110 shadow-md' : 'bg-white hover:bg-green-100'
              }`}
              onMouseEnter={() => setHoveredVariable('pcvr')}
              onMouseLeave={() => setHoveredVariable(null)}
            >
              pCVR
            </span>
            {qFactor < 1.0 && (
              <>
                <span>×</span>
                <span
                  className={`px-3 py-1 rounded cursor-pointer transition-all ${
                    hoveredVariable === 'q_factor' ? 'bg-orange-200 scale-110 shadow-md' : 'bg-white hover:bg-orange-100'
                  }`}
                  onMouseEnter={() => setHoveredVariable('q_factor')}
                  onMouseLeave={() => setHoveredVariable(null)}
                >
                  q_factor
                </span>
              </>
            )}
            <span>×</span>
            <span className="px-3 py-1 rounded bg-gray-100">1000</span>
          </div>
        </div>
      </div>

      {/* 变量详情卡片 */}
      {hoveredVar && (
        <div className={`mb-4 p-3 rounded-lg border-2 ${hoveredVar.borderColor} ${hoveredVar.bgColor} animate-in fade-in`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${hoveredVar.color}`}>{hoveredVar.label}</span>
              <span className="text-xs text-gray-600">({hoveredVar.description})</span>
            </div>
            <span className={`text-sm font-bold ${hoveredVar.color}`}>
              {hoveredVar.unit}{hoveredVar.value.toFixed(4)}
            </span>
          </div>
          <div className="text-[10px] text-gray-700 mb-2">{hoveredVar.detail}</div>
          <div className={`text-[10px] font-semibold ${hoveredVar.color} flex items-center gap-1`}>
            {hoveredVar.evaluation.includes('极高') || hoveredVar.evaluation.includes('优秀') ? (
              <TrendingUp className="w-3 h-3" />
            ) : hoveredVar.evaluation.includes('偏低') || hoveredVar.evaluation.includes('较差') ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {hoveredVar.evaluation}
          </div>
        </div>
      )}

      {/* 计算结果 */}
      <div className="bg-gradient-to-r from-[#2563eb] to-blue-600 rounded-lg p-4 text-white">
        <div className="text-center">
          <div className="text-[10px] text-blue-100 mb-1">最终 eCPM</div>
          <div className="text-2xl font-bold">${ecpm.toFixed(2)}</div>
          <div className="text-[9px] text-blue-100 mt-1">
            = ${bidPrice.toFixed(4)} × {(pctr * 100).toFixed(2)}% × {(pcvr * 100).toFixed(2)}%
            {qFactor < 1.0 && ` × ${qFactor.toFixed(2)}`} × 1000
          </div>
        </div>
      </div>
    </div>
  )
}

