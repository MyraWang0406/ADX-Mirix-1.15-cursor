'use client'

import { useState } from 'react'
import { ArrowRight, Info, X, CheckCircle, XCircle, Clock, DollarSign, TrendingUp } from 'lucide-react'
import { WhiteboxTrace } from '../types'

interface AuctionFlowVisualizationProps {
  logs: WhiteboxTrace[]
  selectedRequestId?: string | null
}

interface FlowNode {
  id: string
  label: string
  icon: React.ReactNode
  description: string
  detail: string
  color: string
}

export default function AuctionFlowVisualization({ logs, selectedRequestId }: AuctionFlowVisualizationProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [selectedRequestLogs, setSelectedRequestLogs] = useState<WhiteboxTrace[]>([])

  // 如果选择了请求，分析该请求的流程
  const requestLogs = selectedRequestId 
    ? logs.filter(l => l.request_id === selectedRequestId)
    : []

  // 定义流程节点
  const nodes: FlowNode[] = [
    {
      id: 'request',
      label: '广告请求',
      icon: <Clock className="w-5 h-5" />,
      description: '用户打开应用，触发广告请求',
      detail: '当用户打开应用或浏览内容时，SSP（供应方平台）会生成一个广告请求，包含用户信息、设备信息、上下文信息等。这是整个竞价流程的起点。',
      color: 'bg-blue-500'
    },
    {
      id: 'ssp_filter',
      label: 'SSP 过滤',
      icon: <CheckCircle className="w-5 h-5" />,
      description: '检查请求是否合规',
      detail: 'SSP 会对请求进行初步过滤，检查：1) 设备是否在黑名单中；2) 请求参数是否完整；3) 是否符合平台规范。只有通过过滤的请求才会进入竞价环节。',
      color: 'bg-purple-500'
    },
    {
      id: 'dsp_bid',
      label: 'DSP 竞价',
      icon: <DollarSign className="w-5 h-5" />,
      description: '计算 eCPM = Bid × pCTR × pCVR × 1000',
      detail: 'DSP（需求方平台）收到请求后，会基于历史数据预测点击率（pCTR）和转化率（pCVR），然后计算出价 eCPM。公式：eCPM = 出价 × 预估点击率 × 预估转化率 × 1000。这个值决定了广告主的竞争力。',
      color: 'bg-yellow-500'
    },
    {
      id: 'adx_sort',
      label: 'ADX 排序',
      icon: <TrendingUp className="w-5 h-5" />,
      description: '按 eCPM 从高到低排序',
      detail: 'ADX（广告交易平台）收集所有 DSP 的出价后，按照 eCPM 从高到低排序。eCPM 最高的广告将获得展示机会。如果多个广告的 eCPM 相同，则按响应时间排序。',
      color: 'bg-green-500'
    },
    {
      id: 'second_price',
      label: '二价计费',
      icon: <DollarSign className="w-5 h-5" />,
      description: '按第二高出价收费，保护广告主',
      detail: '二价计费（GSP机制）是指：即使你出价最高，也只需要支付第二高出价的价格。例如：你出价 $10，第二名出价 $8，你只需支付 $8。这样可以防止广告主过度出价，保护 ROI，同时让市场更公平。',
      color: 'bg-indigo-500'
    },
    {
      id: 'winner',
      label: '中标展示',
      icon: <CheckCircle className="w-5 h-5" />,
      description: '广告成功展示给用户',
      detail: '最终，eCPM 最高的广告会展示给用户。系统会记录这次展示，并跟踪后续的点击和转化行为，用于优化未来的预测模型。',
      color: 'bg-emerald-500'
    }
  ]

  // 根据选中的请求，判断每个节点的状态
  const getNodeStatus = (nodeId: string): 'pending' | 'success' | 'failed' => {
    if (!selectedRequestId || requestLogs.length === 0) return 'pending'
    
    switch (nodeId) {
      case 'request':
        return requestLogs.some(l => l.node === 'SSP' && l.action === 'REQUEST_GENERATED') ? 'success' : 'pending'
      case 'ssp_filter':
        return requestLogs.some(l => l.node === 'SSP' && l.decision === 'PASS') ? 'success' : 
               requestLogs.some(l => l.node === 'SSP' && l.decision === 'REJECT') ? 'failed' : 'pending'
      case 'dsp_bid':
        return requestLogs.some(l => l.node === 'DSP' && l.action === 'BID_SUBMITTED') ? 'success' : 'pending'
      case 'adx_sort':
        return requestLogs.some(l => l.node === 'ADX' && l.action === 'AUCTION_RESULT') ? 'success' : 'pending'
      case 'second_price':
        return requestLogs.some(l => l.action === 'AUCTION_RESULT' && l.actual_paid_price) ? 'success' : 'pending'
      case 'winner':
        return requestLogs.some(l => l.action === 'AUCTION_RESULT') ? 'success' : 'pending'
      default:
        return 'pending'
    }
  }

  const currentNode = nodes.find(n => n.id === selectedNode)

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-[#2563eb]">博弈全景图</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">点击节点查看详细说明</p>
        </div>
        {selectedRequestId && (
          <div className="text-[9px] text-gray-500 bg-blue-50 px-2 py-1 rounded">
            跟踪请求: {selectedRequestId.slice(-6)}
          </div>
        )}
      </div>

      {/* 流程图 */}
      <div className="relative overflow-x-auto pb-4">
        <div className="flex items-center gap-2 min-w-max px-4">
          {nodes.map((node, index) => {
            const status = getNodeStatus(node.id)
            const isActive = selectedNode === node.id
            
            return (
              <div key={node.id} className="flex items-center">
                {/* 节点 */}
                <div
                  className={`relative cursor-pointer transition-all ${
                    isActive ? 'scale-110 z-10' : 'hover:scale-105'
                  }`}
                  onClick={() => setSelectedNode(isActive ? null : node.id)}
                >
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-md ${
                      status === 'success' ? node.color + ' ring-2 ring-green-400' :
                      status === 'failed' ? 'bg-red-500 ring-2 ring-red-400' :
                      node.color + ' opacity-60'
                    } ${isActive ? 'ring-4 ring-blue-300' : ''}`}
                  >
                    {node.icon}
                  </div>
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <div className={`text-[9px] font-semibold ${
                      isActive ? 'text-[#2563eb]' : 'text-gray-600'
                    }`}>
                      {node.label}
                    </div>
                  </div>
                  {status === 'success' && (
                    <CheckCircle className="absolute -top-1 -right-1 w-4 h-4 text-green-500 bg-white rounded-full" />
                  )}
                  {status === 'failed' && (
                    <XCircle className="absolute -top-1 -right-1 w-4 h-4 text-red-500 bg-white rounded-full" />
                  )}
                </div>

                {/* 箭头 */}
                {index < nodes.length - 1 && (
                  <div className="mx-2 flex items-center">
                    <ArrowRight className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 节点详情卡片 */}
      {currentNode && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-in fade-in">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${currentNode.color}`}>
                {currentNode.icon}
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#2563eb]">{currentNode.label}</h4>
                <p className="text-[10px] text-gray-600">{currentNode.description}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[10px] text-gray-700 leading-relaxed mt-2">
            {currentNode.detail}
          </div>
          
          {/* 如果是二价计费节点，显示额外说明 */}
          {currentNode.id === 'second_price' && (
            <div className="mt-3 p-2 bg-white rounded border border-blue-300">
              <div className="text-[9px] font-semibold text-[#2563eb] mb-1">为什么二价计费能保护广告主？</div>
              <div className="text-[9px] text-gray-700">
                假设你出价 $10，第二名出价 $8。在一价计费下，你需要支付 $10；在二价计费下，你只需支付 $8，节省了 $2。
                这样可以防止广告主因为担心出价过低而过度出价，让市场更公平，同时保护广告主的 ROI。
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

