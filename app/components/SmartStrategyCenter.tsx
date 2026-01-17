'use client'

import { useState, useEffect } from 'react'
import { Brain } from 'lucide-react'

interface DiagnosticResult {
  status: string
  timestamp: string
  ai_suggestions?: {
    summary?: string
    root_cause?: string
    economic_impact?: string
    suggestions?: string[]
    priority?: string
  }
  structured_report?: {
    summary?: string
    root_cause?: string
    economic_impact?: string
    action_items?: string[]
  }
  total_potential_loss?: number
  estimated_hourly_loss?: number
}

interface SmartStrategyCenterProps {
  selectedRegion?: string | null
  selectedRequestId?: string | null
  logs?: any[]
}

export default function SmartStrategyCenter({ selectedRegion, selectedRequestId, logs = [] }: SmartStrategyCenterProps) {
  // 提供默认数据，确保静态导出时也有内容显示
  const defaultDiagnostic: DiagnosticResult = {
    status: 'success',
    timestamp: '2024-01-15T00:00:00.000Z',
    ai_suggestions: {
      summary: '系统运行正常，建议持续监控关键指标',
      root_cause: '出价策略和流量质量需要优化',
      economic_impact: '预计优化后可提升 15% 的收益',
      suggestions: [
        '优化出价策略以提升中标率',
        '检查流量质量评分机制',
        '监控延迟和超时情况'
      ],
      priority: 'medium'
    },
    structured_report: {
      summary: '系统整体运行稳定，中标率有提升空间',
      root_cause: '出价策略和流量质量需要优化',
      economic_impact: '预计优化后可提升 15% 的收益',
      action_items: [
        '调整出价系数',
        '优化流量筛选',
        '监控关键指标'
      ]
    },
    total_potential_loss: 125.5,
    estimated_hourly_loss: 5.2
  }

  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(defaultDiagnostic)
  const [isLoading, setIsLoading] = useState(false)
  const [regionSpecificDiagnostic, setRegionSpecificDiagnostic] = useState<string | null>(null)

  const fetchDiagnostic = async () => {
    setIsLoading(true)
    try {
      // 静态导出模式：使用模拟数据
      // 使用固定的时间戳避免 hydration mismatch
      const mockDiagnostic = {
        status: 'success',
        timestamp: typeof window !== 'undefined' ? new Date().toISOString() : '2024-01-15T00:00:00.000Z',
        statistics: {
          win_rate: 0.35,
          win_stats: {
            total_requests: 1000,
            win_count: 350,
            win_rate: 0.35
          },
          reject_analysis: {
            total_rejects: 650,
            distribution: {
              'BID_BELOW_FLOOR': { count: 300, percentage: 46.2 },
              'SIZE_MISMATCH': { count: 200, percentage: 30.8 },
              'LATENCY_TIMEOUT': { count: 150, percentage: 23.1 }
            }
          }
        },
        anomalies: [
          {
            type: 'low_win_rate',
            severity: 'medium',
            title: '中标率偏低',
            description: '当前中标率为 35%，低于行业平均水平',
            details: { win_rate: 0.35 },
            suggestion: '建议优化出价策略或提升流量质量'
          }
        ],
        ai_suggestions: {
          summary: '系统运行正常，建议持续监控关键指标',
          suggestions: [
            '优化出价策略以提升中标率',
            '检查流量质量评分机制',
            '监控延迟和超时情况'
          ],
          priority: 'medium'
        },
        structured_report: {
          summary: '系统整体运行稳定，中标率有提升空间',
          root_cause: '出价策略和流量质量需要优化',
          economic_impact: '预计优化后可提升 15% 的收益',
          action_items: [
            '调整出价系数',
            '优化流量筛选',
            '监控关键指标'
          ]
        },
        total_potential_loss: 125.5,
        estimated_hourly_loss: 5.2,
        total_logs_analyzed: 1000
      }
      setDiagnostic(mockDiagnostic)
    } catch (err) {
      console.error('Error fetching diagnostic:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDiagnostic()
    const interval = setInterval(fetchDiagnostic, 30000) // 每30秒刷新
    return () => clearInterval(interval)
  }, [])

  const aiSuggestions = diagnostic?.ai_suggestions || diagnostic?.structured_report

  // 提取关键数据（金额、百分比）
  const extractHighlights = (text: string): string[] => {
    const highlights: string[] = []
    // 匹配金额（$、¥、数字）
    const moneyRegex = /[\$¥]\d+[.,]?\d*/g
    const moneyMatches = text.match(moneyRegex)
    if (moneyMatches) highlights.push(...moneyMatches)
    
    // 匹配百分比
    const percentRegex = /\d+[.,]?\d*%/g
    const percentMatches = text.match(percentRegex)
    if (percentMatches) highlights.push(...percentMatches)
    
    return highlights
  }

  const highlightText = (text: string) => {
    if (!text) return ''
    const highlights = extractHighlights(text)
    let highlighted = text
    
    // 避免重复替换
    const processed = new Set<string>()
    highlights.forEach(highlight => {
      if (!processed.has(highlight)) {
        processed.add(highlight)
        const regex = new RegExp(highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
        highlighted = highlighted.replace(
          regex,
          `<span class="font-bold text-blue-700 bg-blue-100 px-1 rounded">${highlight}</span>`
        )
      }
    })
    
    return highlighted
  }

  // 移除条件判断，始终显示内容（使用默认数据确保静态导出时有内容）
  // if (!aiSuggestions && !diagnostic?.total_potential_loss) {
  //   return (
  //     <div className="bg-white rounded border border-gray-100 p-2 h-full">
  //       <div className="flex items-center gap-2">
  //         <Brain className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
  //         <span className="text-xs font-semibold text-[#2563eb]">策略洞察中心</span>
  //         {isLoading && <span className="text-[10px] text-gray-500 ml-auto">分析中...</span>}
  //       </div>
  //     </div>
  //   )
  // }

  const suggestions = diagnostic?.ai_suggestions?.suggestions || diagnostic?.structured_report?.action_items || []

  return (
    <div className="bg-white rounded border border-gray-100 p-2.5 h-full flex flex-col">
      <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
        <div className="relative">
          <Brain className="w-3.5 h-3.5 text-blue-600" />
          <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
        </div>
        <h3 className="text-xs font-bold text-[#2563eb]">策略洞察中心</h3>
        <span className="text-[9px] text-gray-500">Strategy Insights</span>
        {diagnostic?.estimated_hourly_loss && (
          <span className="ml-auto text-[10px] text-gray-500">
            预计损失: <span className="font-bold text-red-600">¥{diagnostic.estimated_hourly_loss.toFixed(2)}/h</span>
          </span>
        )}
      </div>

      <div className="space-y-1.5 text-[10px] flex-1 overflow-y-auto max-h-[400px]">
        {/* 隐私环境诊断 */}
        {suggestions.some((s: string) => s.includes('隐私受限环境') || s.includes('SKAN')) && (
          <div className="mb-2 p-1.5 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[9px] font-bold text-blue-700">🔒 隐私环境诊断</span>
            </div>
            {suggestions
              .filter((s: string) => s.includes('隐私受限环境') || s.includes('SKAN'))
              .map((suggestion: string, idx: number) => (
                <div key={idx} className="text-[9px] text-blue-700 leading-relaxed">
                  {suggestion.replace(/【策略预警】/g, '').replace(/【策略建议】/g, '').replace(/【隐私环境诊断】/g, '')}
                </div>
              ))}
          </div>
        )}

        {/* 现象总结 */}
        {aiSuggestions?.summary && (
          <div>
            <div className="text-[9px] font-semibold text-[#1e293b] mb-0.5">【现象总结】</div>
            <div 
              className="text-[10px] text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightText(aiSuggestions.summary) }}
            />
          </div>
        )}

        {/* 根因推测 */}
        {aiSuggestions?.root_cause && (
          <div>
            <div className="text-[9px] font-semibold text-[#1e293b] mb-0.5">【根因推测】</div>
            <div className="text-[10px] text-gray-700 leading-relaxed">
              {aiSuggestions.root_cause
                .replace(/【损耗预警】/g, '[策略预警]')
                .replace(/【策略建议】/g, '[策略预警]')
                .replace(/【级决策建议】/g, '')
                .replace(/pCTR 模型预估偏低/g, 'pCTR 预估存在向下偏差')
                .replace(/建议引导广告主优化素材关键词或进行 A\/B Test 以提升质量分/g, '建议立即触发素材 A/B 测试以修正模型质量分')}
            </div>
          </div>
        )}

        {/* 经济损失评估 */}
        {aiSuggestions?.economic_impact && (
          <div>
            <div className="text-[9px] font-semibold text-[#1e293b] mb-0.5">【经济损失评估】</div>
            <div 
              className="text-[10px] text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightText(aiSuggestions.economic_impact.replace(/\$/g, '¥')) }}
            />
          </div>
        )}

        {/* 建议操作 - 只显示前3条 */}
        {suggestions.length > 0 && (
          <div>
            <div className="text-[9px] font-semibold text-[#1e293b] mb-0.5">【建议操作】</div>
            <div className="space-y-0.5">
              {suggestions.slice(0, 3).map((suggestion: string, idx: number) => (
                <div key={idx} className="text-[10px] text-gray-700 flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">{idx + 1}.</span>
                  <span>{suggestion
                    .replace(/【损耗预警】/g, '[策略预警]')
                    .replace(/【策略建议】/g, '[策略预警]')
                    .replace(/【级决策建议】/g, '')
                    .replace(/pCTR 模型预估偏低/g, 'pCTR 预估存在向下偏差')
                    .replace(/建议引导广告主优化素材关键词或进行 A\/B Test 以提升质量分/g, '建议立即触发素材 A/B 测试以修正模型质量分')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
