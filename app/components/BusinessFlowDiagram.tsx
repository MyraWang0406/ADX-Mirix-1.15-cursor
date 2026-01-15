'use client'

import { useState } from 'react'
import { ArrowRight, Users, Zap, Target, Smartphone, Search, Bell, MousePointerClick } from 'lucide-react'
import { WhiteboxTrace } from '../types'

interface BusinessFlowDiagramProps {
  logs: WhiteboxTrace[]
  selectedRequestId?: string | null
}

export default function BusinessFlowDiagram({ logs, selectedRequestId }: BusinessFlowDiagramProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  
  // 获取选中请求的信息
  const requestLogs = selectedRequestId 
    ? logs.filter(l => l.request_id === selectedRequestId)
    : []
  
  const requestLog = requestLogs.find(l => l.action === 'AUCTION_RESULT' || l.action === 'OPPORTUNITY_COST_CHECK')
  const funnelLog = requestLogs.find(l => l.action === 'FUNNEL_PROCESSING')
  
  const trafficChannel = requestLog?.internal_variables?.traffic_channel || '自然流量'
  const selectedPath = requestLog?.internal_variables?.selected_path || 'ads'
  const distributionOutlet = requestLog?.internal_variables?.distribution_outlet || '首页资源位'
  const totalValue = requestLog?.internal_variables?.total_value || 0
  const valueDetails = requestLog?.internal_variables?.value_details || {}
  
  // 获取四层漏斗信息
  const recalledCount = funnelLog?.internal_variables?.recalled_count || 0
  const rankedCount = funnelLog?.internal_variables?.ranked_count || 0
  const reRankedCount = funnelLog?.internal_variables?.re_ranked_count || 0
  const organicLtv = funnelLog?.internal_variables?.organic_ltv_adjusted || 0
  
  const nodes = [
    {
      id: 'upstream',
      label: '上游增长买量',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-blue-500',
      description: '流量来源：值得买、B站、抖音等',
      details: `渠道：${trafficChannel}`
    },
    {
      id: 'midstream',
      label: '决策中枢',
      icon: <Zap className="w-5 h-5" />,
      color: 'bg-purple-500',
      description: '召回/排序：召回→精排→重排',
      details: `召回${recalledCount}条 → 精排${rankedCount}条 → 重排${reRankedCount}条，Organic_LTV: $${organicLtv.toFixed(2)}`
    },
    {
      id: 'downstream',
      label: '下游分发出口',
      icon: <Target className="w-5 h-5" />,
      color: 'bg-green-500',
      description: '分发到：首页资源位、搜索推荐流、Push权益触达',
      details: `分发出口：${distributionOutlet}，选择路径：${selectedPath === 'ads' ? '广告位' : selectedPath === 'search' ? '搜索推荐' : 'Push权益'}`
    }
  ]
  
  const outlets = [
    { id: 'home', label: '首页资源位', icon: <MousePointerClick className="w-4 h-4" />, color: 'bg-green-500' },
    { id: 'search', label: '搜索推荐流', icon: <Search className="w-4 h-4" />, color: 'bg-blue-500' },
    { id: 'push', label: 'Push权益触达', icon: <Bell className="w-4 h-4" />, color: 'bg-purple-500' }
  ]
  
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-[#2563eb]" />
        <h3 className="text-sm font-bold text-[#2563eb]">全域分发 Flow 图</h3>
      </div>
      
      {/* 主流程 */}
      <div className="flex items-center justify-between mb-4">
        {nodes.map((node, idx) => (
          <div key={node.id} className="flex items-center flex-1">
            <div
              className={`flex flex-col items-center cursor-pointer transition-all ${
                selectedNode === node.id ? 'scale-110' : ''
              }`}
              onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
            >
              <div className={`w-16 h-16 rounded-full ${node.color} flex items-center justify-center text-white mb-2 shadow-md`}>
                {node.icon}
              </div>
              <div className="text-xs font-semibold text-gray-700 text-center">{node.label}</div>
            </div>
            {idx < nodes.length - 1 && (
              <ArrowRight className="w-6 h-6 text-gray-400 mx-2 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
      
      {/* 节点详情 */}
      {selectedNode && (
        <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-3">
          <div className="text-xs font-semibold text-blue-900 mb-1">
            {nodes.find(n => n.id === selectedNode)?.label}
          </div>
          <div className="text-[10px] text-blue-700 mb-1">
            {nodes.find(n => n.id === selectedNode)?.description}
          </div>
          <div className="text-[9px] text-blue-600">
            {nodes.find(n => n.id === selectedNode)?.details}
          </div>
        </div>
      )}
      
      {/* 下游分发出口详情 */}
      <div className="border-t border-gray-200 pt-3">
        <div className="text-xs font-semibold text-gray-700 mb-2">下游分发出口</div>
        <div className="grid grid-cols-3 gap-2">
          {outlets.map(outlet => (
            <div
              key={outlet.id}
              className={`p-2 rounded text-center ${
                distributionOutlet.includes(outlet.label) ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className={`w-8 h-8 rounded-full ${outlet.color} flex items-center justify-center text-white mx-auto mb-1`}>
                {outlet.icon}
              </div>
              <div className="text-[9px] font-medium text-gray-700">{outlet.label}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 价值对比 */}
      {valueDetails && Object.keys(valueDetails).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-700 mb-2">价值对比</div>
          <div className="grid grid-cols-3 gap-2 text-[9px]">
            <div className="bg-blue-50 p-1.5 rounded">
              <div className="text-gray-600">搜推LTV</div>
              <div className="font-bold text-blue-700">${(valueDetails.search_ltv || 0).toFixed(2)}</div>
            </div>
            <div className="bg-green-50 p-1.5 rounded">
              <div className="text-gray-600">广告价值</div>
              <div className="font-bold text-green-700">${(valueDetails.ad_value || 0).toFixed(2)}</div>
            </div>
            <div className="bg-purple-50 p-1.5 rounded">
              <div className="text-gray-600">Push价值</div>
              <div className="font-bold text-purple-700">${(valueDetails.push_value || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

