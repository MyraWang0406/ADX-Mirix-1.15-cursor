'use client'

import { useState, useEffect } from 'react'
import { Brain, AlertCircle, TrendingDown, Lightbulb } from 'lucide-react'

interface StructuredReport {
  summary?: string
  root_cause?: string
  economic_impact?: string
  action_items?: string[]
}

interface DiagnosticResult {
  status: string
  structured_report?: StructuredReport
  total_potential_loss?: number
  estimated_hourly_loss?: number
}

interface DecisionCenterProps {
  selectedRequestId?: string | null
  logs?: any[]
}

export default function DecisionCenter({ selectedRequestId, logs = [] }: DecisionCenterProps) {
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [requestSpecificDiagnostic, setRequestSpecificDiagnostic] = useState<string | null>(null)

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

  const report = diagnostic?.structured_report

  // 提取金额（用于高亮）
  const extractAmounts = (text: string): string[] => {
    const amounts: string[] = []
    // 匹配 $数字 或 ¥数字
    const regex = /[\$¥]\d+[.,]?\d*/g
    const matches = text.match(regex)
    if (matches) amounts.push(...matches)
    return amounts
  }

  // 高亮金额和策略建议
  const highlightText = (text: string, isStrategy: boolean = false): string => {
    if (!text) return ''
    
    let highlighted = text
    
    // 高亮金额（红色）
    const amounts = extractAmounts(text)
    amounts.forEach(amount => {
      highlighted = highlighted.replace(
        amount,
        `<span class="font-bold text-red-600 bg-red-50 px-1 rounded">${amount}</span>`
      )
    })
    
        // 如果是策略建议，高亮关键词（蓝色）并简化文字
        if (isStrategy) {
          // 简化诊断文字，更具商业指向
          highlighted = highlighted.replace(/【损耗预警】/g, '<span class="font-semibold text-blue-600">[策略预警]</span>')
          highlighted = highlighted.replace(/【策略建议】/g, '<span class="font-semibold text-blue-600">[策略预警]</span>')
          highlighted = highlighted.replace(/【级决策建议】/g, '')
          
          const keywords = ['建议', '优化', '提升', '调整', '引导', 'A/B Test', 'pCTR', '预估点击率', '向下偏差', '质量分']
          keywords.forEach(keyword => {
            const regex = new RegExp(keyword, 'g')
            highlighted = highlighted.replace(
              regex,
              `<span class="font-semibold text-blue-600">${keyword}</span>`
            )
          })
        }
    
    return highlighted
  }

  if (!report && !diagnostic?.total_potential_loss) {
    return (
      <div className="bg-white rounded border border-gray-100 p-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-600 animate-pulse" />
          <span className="text-xs font-semibold text-[#2563eb]">策略洞察中心</span>
          {isLoading && <span className="text-[10px] text-gray-500 ml-auto">分析中...</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-2.5 shadow-subtle">
      <div className="flex items-center gap-1.5 mb-2">
        <Brain className="w-3.5 h-3.5 text-blue-600" />
        <h3 className="text-xs font-bold text-[#2563eb]">策略洞察中心</h3>
        <span className="text-[9px] text-gray-500">Strategy Insights</span>
        {diagnostic?.estimated_hourly_loss && (
          <span className="ml-auto text-[10px] text-gray-500">
            预计损失: <span className="font-bold text-red-600">${diagnostic.estimated_hourly_loss.toFixed(2)}/h</span>
          </span>
        )}
      </div>

      <div className="space-y-2.5 text-xs">
        {/* 现象总结 */}
        {report?.summary && (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-3 h-3 text-blue-600 flex-shrink-0" />
              <span className="text-[10px] font-semibold text-[#1e293b]">现象总结</span>
            </div>
            <div 
              className="text-[10px] text-gray-700 leading-relaxed pl-4"
              dangerouslySetInnerHTML={{ __html: highlightText(report.summary) }}
            />
          </div>
        )}

        {/* 根因分析 */}
        {report?.root_cause && (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3 h-3 text-amber-600 flex-shrink-0" />
              <span className="text-[10px] font-semibold text-[#1e293b]">根因分析</span>
            </div>
            <div className="text-[10px] text-gray-700 leading-relaxed pl-4">
              {report.root_cause}
            </div>
          </div>
        )}

        {/* 经济损失评估 */}
        {report?.economic_impact && (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-3 h-3 text-red-600 flex-shrink-0" />
              <span className="text-[10px] font-semibold text-[#1e293b]">经济损失评估</span>
            </div>
            <div 
              className="text-[10px] text-gray-700 leading-relaxed pl-4"
              dangerouslySetInnerHTML={{ __html: highlightText(report.economic_impact) }}
            />
          </div>
        )}

        {/* 建议操作 */}
        {report?.action_items && report.action_items.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb className="w-3 h-3 text-blue-600 flex-shrink-0" />
              <span className="text-[10px] font-semibold text-[#1e293b]">建议操作</span>
            </div>
            <div className="space-y-1 pl-4">
              {report.action_items.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold text-[10px] mt-0.5">{idx + 1}.</span>
                  <div 
                    className="text-[10px] text-gray-700 leading-relaxed flex-1"
                    dangerouslySetInnerHTML={{ __html: highlightText(item, true) }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

