'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Send, CheckCircle, XCircle, Loader, AlertCircle, TrendingUp } from 'lucide-react'

interface Proposal {
  id: string
  type: string
  region?: string
  value: number
  description: string
  priority: string
  simulation?: {
    revenue_lift?: number
    recovered_revenue?: number
    recommendation?: string
  }
}

interface CopilotDecisionCenterProps {
  proposals?: Proposal[]
  onExecute?: (proposalId: string) => void
}

export default function CopilotDecisionCenter({ proposals = [], onExecute }: CopilotDecisionCenterProps) {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user' as const, content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // 模拟 AI 回复（实际应该调用 API）
    setTimeout(() => {
      const response = generateResponse(input, proposals)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-[#2563eb]" />
        <h3 className="text-sm font-bold text-[#2563eb]">Copilot 决策中心</h3>
      </div>

      {/* 待执行决策流 */}
      {proposals.length > 0 && (
        <div className="mb-3 space-y-2">
          <div className="text-xs font-semibold text-gray-700 mb-2">待执行决策流</div>
          {proposals.map((proposal) => (
            <div key={proposal.id} className="bg-blue-50 border border-blue-200 rounded p-2">
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-800">{proposal.description}</div>
                  {proposal.simulation && (
                    <div className="text-[10px] text-gray-600 mt-0.5">
                      {proposal.simulation.recommendation || 
                       `预期收益提升: $${(proposal.simulation.revenue_lift || proposal.simulation.recovered_revenue || 0).toFixed(2)}`}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onExecute?.(proposal.id)}
                  className="ml-2 px-2 py-1 bg-[#2563eb] text-white text-[10px] rounded hover:bg-blue-700 transition-colors"
                >
                  确认执行
                </button>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                  proposal.priority === 'high' ? 'bg-red-100 text-red-700' :
                  proposal.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {proposal.priority === 'high' ? '高优先级' : 
                   proposal.priority === 'medium' ? '中优先级' : '低优先级'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 聊天窗口 */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto mb-2 space-y-2">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 text-xs py-4">
              可以向 Copilot 提问，例如："为什么建议提价？" 或 "这个策略在 iOS 端的风险是什么？"
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-2 text-xs ${
                  msg.role === 'user'
                    ? 'bg-[#2563eb] text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-2 text-xs text-gray-800">
                <Loader className="w-3 h-3 animate-spin inline mr-1" />
                思考中...
              </div>
            </div>
          )}
        </div>

        {/* 输入框 */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入问题..."
            className="flex-1 text-xs px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-1.5 bg-[#2563eb] text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

function generateResponse(question: string, proposals: Proposal[]): string {
  const lowerQuestion = question.toLowerCase()
  
  if (lowerQuestion.includes('为什么') || lowerQuestion.includes('why')) {
    if (lowerQuestion.includes('提价')) {
      return '建议提价是因为当前出价竞争力不足，导致中标率偏低。通过提价可以提升 eCPM，增加中标概率，从而提升整体收益。'
    }
    return '基于当前数据分析，系统检测到异常情况，建议的策略旨在优化系统性能和收益。'
  }
  
  if (lowerQuestion.includes('风险') || lowerQuestion.includes('risk')) {
    if (lowerQuestion.includes('ios')) {
      return '在 iOS 端，由于 SKAN 隐私环境限制，转化数据存在延迟。提价策略需要结合概率模型补偿，确保不会过度出价。建议监控 SKAN 转化值分布，动态调整出价系数。'
    }
    return '主要风险包括：1) 出价过高可能导致 ROI 下降；2) 延迟阈值调整可能影响响应速度；3) 需要持续监控策略效果。'
  }
  
  if (lowerQuestion.includes('收益') || lowerQuestion.includes('revenue')) {
    const totalLift = proposals.reduce((sum, p) => 
      sum + (p.simulation?.revenue_lift || p.simulation?.recovered_revenue || 0), 0
    )
    return `根据模拟预测，执行所有建议策略后，预期收益提升约 $${totalLift.toFixed(2)}。具体收益取决于实际执行情况和市场变化。`
  }
  
  return '感谢您的提问。基于当前系统状态和数据分析，建议的策略已经过模拟验证，预期能够带来正向收益。如需了解更多细节，请查看具体的策略提案。'
}

