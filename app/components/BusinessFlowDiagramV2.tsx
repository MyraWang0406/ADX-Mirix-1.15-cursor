'use client'

import { useState, useMemo } from 'react'
import { ArrowRight, Users, Zap, Target, X } from 'lucide-react'
import { WhiteboxTrace } from '../types'

interface BusinessFlowDiagramV2Props {
  logs: WhiteboxTrace[]
  selectedRequestId?: string | null
  onNodeClick?: (nodeId: string, formula: string) => void
}

export default function BusinessFlowDiagramV2({ 
  logs, 
  selectedRequestId,
  onNodeClick 
}: BusinessFlowDiagramV2Props) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  
  const flowData = useMemo(() => {
    const requestLogs = selectedRequestId 
      ? logs.filter(l => l.request_id === selectedRequestId)
      : logs
    
    const requestLog = requestLogs.find(l => l.action === 'AUCTION_RESULT' || l.action === 'OPPORTUNITY_COST_CHECK')
    const funnelLog = requestLogs.find(l => l.action === 'FUNNEL_PROCESSING')
    
    const trafficChannel = requestLog?.internal_variables?.traffic_channel || '自然流量'
    const selectedPath = requestLog?.internal_variables?.selected_path || 'ads'
    const distributionOutlet = requestLog?.internal_variables?.distribution_outlet || '首页资源位'
    const organicLtv = funnelLog?.internal_variables?.organic_ltv_adjusted || 0
    const adEcpm = requestLog?.eCPM || requestLog?.internal_variables?.winner_ecpm || 0
    
    return {
      trafficChannel,
      selectedPath,
      distributionOutlet,
      organicLtv,
      adEcpm
    }
  }, [logs, selectedRequestId])
  
  const nodes = [
    {
      id: 'traffic',
      label: '买量渠道',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-500',
      description: '流量来源：值得买、B站、抖音等',
      details: `渠道：${flowData.trafficChannel}`,
      formula: 'CAC = Attribution_Cost / Conversion_Rate'
    },
    {
      id: 'adx',
      label: 'ADX 决策中枢',
      icon: <Zap className="w-6 h-6" />,
      color: 'bg-purple-500',
      description: '搜推/广告博弈：Max(Organic_LTV, Ad_eCPM)',
      details: `选择路径：${flowData.selectedPath === 'ads' ? '广告位' : flowData.selectedPath === 'search' ? '搜索推荐' : 'Push权益'}`,
      formula: 'Decision = Max(Organic_LTV, Ad_eCPM, Push_Value)',
      subFormula: flowData.selectedPath === 'ads' 
        ? `Ad_eCPM = Bid × pCTR × pCVR × q_factor × 1000`
        : `Organic_LTV = Σ(Top5_Content_LTV) × Lifecycle_Multiplier`
    },
    {
      id: 'distribution',
      label: '分发出口',
      icon: <Target className="w-6 h-6" />,
      color: 'bg-green-500',
      description: '最终分发：首页资源位、搜索推荐流、Push权益触达',
      details: `分发出口：${flowData.distributionOutlet}`,
      formula: 'Distribution = Selected_Path → Distribution_Outlet'
    }
  ]
  
  const handleNodeClick = (node: typeof nodes[0]) => {
    if (selectedNode === node.id) {
      setSelectedNode(null)
      onNodeClick?.(node.id, '')
    } else {
      setSelectedNode(node.id)
      onNodeClick?.(node.id, node.formula)
    }
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-[#2563eb]" />
        <h3 className="text-sm font-bold text-[#2563eb]">业务 Flow 图（增长 → 决策 → 变现）</h3>
      </div>
      
      {/* 主流程 */}
      <div className="flex-1 flex items-center justify-between mb-4">
        {nodes.map((node, idx) => (
          <div key={node.id} className="flex items-center flex-1">
            <div
              className={`flex flex-col items-center cursor-pointer transition-all ${
                selectedNode === node.id ? 'scale-110' : ''
              }`}
              onClick={() => handleNodeClick(node)}
            >
              <div className={`w-16 h-16 rounded-full ${node.color} flex items-center justify-center text-white mb-2 shadow-md hover:shadow-lg`}>
                {node.icon}
              </div>
              <div className="text-xs font-semibold text-gray-700 text-center">{node.label}</div>
            </div>
            {idx < nodes.length - 1 && (
              <ArrowRight className="w-8 h-8 text-gray-400 mx-2 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
      
      {/* 节点详情和公式 */}
      {selectedNode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="text-xs font-semibold text-blue-900 mb-1">
                {nodes.find(n => n.id === selectedNode)?.label}
              </div>
              <div className="text-[10px] text-blue-700 mb-1">
                {nodes.find(n => n.id === selectedNode)?.description}
              </div>
              <div className="text-[9px] text-blue-600 mb-2">
                {nodes.find(n => n.id === selectedNode)?.details}
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* 白盒计算公式 */}
          <div className="bg-white rounded p-2 border border-blue-300">
            <div className="text-[9px] font-semibold text-gray-700 mb-1">白盒计算公式：</div>
            <div className="text-[10px] font-mono text-blue-800 mb-1">
              {nodes.find(n => n.id === selectedNode)?.formula}
            </div>
            {nodes.find(n => n.id === selectedNode)?.subFormula && (
              <div className="text-[9px] font-mono text-blue-600 mt-1">
                {nodes.find(n => n.id === selectedNode)?.subFormula}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 价值对比 */}
      <div className="border-t border-gray-200 pt-3">
        <div className="text-xs font-semibold text-gray-700 mb-2">价值对比</div>
        <div className="grid grid-cols-3 gap-2 text-[9px]">
          <div className="bg-blue-50 p-2 rounded">
            <div className="text-gray-600">搜推 LTV</div>
            <div className="font-bold text-blue-700">${flowData.organicLtv.toFixed(2)}</div>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <div className="text-gray-600">广告价值</div>
            <div className="font-bold text-green-700">${(flowData.adEcpm / 1000).toFixed(2)}</div>
          </div>
          <div className={`p-2 rounded ${flowData.selectedPath === 'ads' ? 'bg-green-100' : 'bg-blue-100'}`}>
            <div className="text-gray-600">选择路径</div>
            <div className="font-bold text-gray-700">
              {flowData.selectedPath === 'ads' ? '广告位' : flowData.selectedPath === 'search' ? '搜索推荐' : 'Push权益'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


