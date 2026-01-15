'use client'

import { useState, useMemo } from 'react'
import { Home, Maximize2, Users, TrendingDown, Filter } from 'lucide-react'
import { WhiteboxTrace } from '../types'

interface HomepageResourceSankeyProps {
  logs: WhiteboxTrace[]
  showResourceOnly?: boolean
}

export default function HomepageResourceSankey({ logs, showResourceOnly = false }: HomepageResourceSankeyProps) {
  const [selectedResource, setSelectedResource] = useState<string | null>(null)
  
  // 模拟用户渠道来源数据
  const channelSources = useMemo(() => {
    return [
      { name: 'Meta', count: 8500, color: '#3b82f6' },
      { name: 'Google', count: 6200, color: '#10b981' },
      { name: 'TikTok', count: 4800, color: '#f59e0b' },
      { name: '自然流量', count: 12000, color: '#8b5cf6' },
      { name: 'Push回流', count: 3200, color: '#ec4899' }
    ]
  }, [])
  
  // 模拟频道数据
  const channels = useMemo(() => {
    return [
      { name: '首页', count: 15000, color: '#3b82f6' },
      { name: '搜索', count: 8500, color: '#10b981' },
      { name: '推荐', count: 12000, color: '#f59e0b' },
      { name: '频道A', count: 3200, color: '#8b5cf6' },
      { name: '频道B', count: 2800, color: '#ec4899' }
    ]
  }, [])
  
  // 模拟资源位数据（改为曝光和点击）
  const resources = useMemo(() => {
    return [
      { name: '弹窗', exposure: 8500, click: 1062, color: '#3b82f6', ctr: 12.5 },
      { name: 'Banner', exposure: 12000, click: 996, color: '#10b981', ctr: 8.3 },
      { name: '浮层', exposure: 3200, click: 486, color: '#f59e0b', ctr: 15.2 },
      { name: '信息流', exposure: 15000, click: 1020, color: '#8b5cf6', ctr: 6.8 }
    ]
  }, [])
  
  // 模拟用户标签数据
  const userTags = useMemo(() => {
    return [
      { tag: '30天活跃未购买', count: 8500, color: '#ef4444', conversionRate: 2.5 },
      { tag: '5天内购买', count: 3200, color: '#10b981', conversionRate: 18.5 },
      { tag: '7-30天未活跃', count: 6200, color: '#f59e0b', conversionRate: 1.2 },
      { tag: '新用户', count: 4800, color: '#3b82f6', conversionRate: 5.8 },
      { tag: '高价值用户', count: 2800, color: '#8b5cf6', conversionRate: 25.3 }
    ]
  }, [])
  
  // 模拟卡点数据
  const bottlenecks = useMemo(() => {
    return [
      { stage: '曝光', count: 15000, loss: 0, rate: 100 },
      { stage: '点击', count: 3200, loss: 11800, rate: 21.3 },
      { stage: '浏览', count: 2800, loss: 400, rate: 18.7 },
      { stage: '加购', count: 850, loss: 1950, rate: 5.7 },
      { stage: '下单', count: 420, loss: 430, rate: 2.8 },
      { stage: '支付', count: 380, loss: 40, rate: 2.5 }
    ]
  }, [])
  
  // 生成桑基图数据
  const sankeyData = useMemo(() => {
    const nodes: Array<{ name: string }> = []
    const links: Array<{ source: number, target: number, value: number }> = []
    
    // 添加节点
    channelSources.forEach(c => nodes.push({ name: c.name }))
    channels.forEach(c => nodes.push({ name: c.name }))
    if (!showResourceOnly) {
      resources.forEach(r => nodes.push({ name: r.name }))
    }
    
    // 添加链接（简化版，实际应该根据真实数据计算）
    let nodeIndex = 0
    channelSources.forEach((source, sIdx) => {
      channels.forEach((channel, cIdx) => {
        const value = Math.floor(source.count * (0.15 + Math.random() * 0.1))
        links.push({
          source: sIdx,
          target: channelSources.length + cIdx,
          value
        })
      })
    })
    
    if (!showResourceOnly) {
      channels.forEach((channel, cIdx) => {
        resources.forEach((resource, rIdx) => {
          const value = Math.floor(channel.count * (0.2 + Math.random() * 0.15))
          links.push({
            source: channelSources.length + cIdx,
            target: channelSources.length + channels.length + rIdx,
            value
          })
        })
      })
    }
    
    return { nodes, links }
  }, [channelSources, channels, resources, showResourceOnly])
  
  return (
    <div className="space-y-4">
      {showResourceOnly ? (
        <>
          <h4 className="text-sm font-bold text-gray-800 mb-3">资源位分析</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {resources.map((resource, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedResource(resource.name)}
                className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full ${resource.color} flex items-center justify-center text-white`}>
                    <Maximize2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{resource.name}</div>
                    <div className="text-xs text-gray-500">资源位</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">曝光</span>
                    <span className="text-sm font-bold text-gray-800">{resource.exposure.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">点击</span>
                    <span className="text-sm font-bold text-blue-700">{resource.click.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">CTR</span>
                    <span className="text-sm font-bold text-green-700">{resource.ctr.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <h4 className="text-sm font-bold text-gray-800 mb-3">首页资源位动线分析</h4>
          
          {/* 用户渠道来源 */}
          <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-blue-600" />
              <h5 className="text-sm font-bold text-gray-800">用户渠道来源</h5>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {channelSources.map((source, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">{source.name}</div>
                  <div className="text-lg font-bold text-gray-800">{source.count.toLocaleString()}</div>
                  <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(source.count / Math.max(...channelSources.map(s => s.count)) * 100)}%`, backgroundColor: source.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 频道分布 */}
          <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Home className="w-4 h-4 text-green-600" />
              <h5 className="text-sm font-bold text-gray-800">去什么频道</h5>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {channels.map((channel, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">{channel.name}</div>
                  <div className="text-lg font-bold text-gray-800">{channel.count.toLocaleString()}</div>
                  <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(channel.count / Math.max(...channels.map(c => c.count)) * 100)}%`, backgroundColor: channel.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 卡点分析 */}
          <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm mb-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <h5 className="text-sm font-bold text-gray-800">卡到哪个环节</h5>
            </div>
            <div className="space-y-2">
              {bottlenecks.map((bottleneck, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-20 text-xs font-medium text-gray-700">{bottleneck.stage}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-blue-500 h-full flex items-center justify-end pr-2 text-white text-xs font-semibold transition-all"
                      style={{ width: `${bottleneck.rate}%` }}
                    >
                      {bottleneck.count > 0 && bottleneck.rate > 3 && bottleneck.count}
                    </div>
                    {bottleneck.count > 0 && bottleneck.rate <= 3 && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-700">
                        {bottleneck.count}
                      </div>
                    )}
                  </div>
                  <div className="w-24 text-xs text-right">
                    <div className="font-bold text-blue-700">{bottleneck.rate.toFixed(1)}%</div>
                    {bottleneck.loss > 0 && (
                      <div className="text-red-600">-{bottleneck.loss}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 用户标签 */}
          <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-purple-600" />
              <h5 className="text-sm font-bold text-gray-800">用户标签分布</h5>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {userTags.map((tag, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">{tag.tag}</div>
                  <div className="text-lg font-bold text-gray-800">{tag.count.toLocaleString()}</div>
                  <div className="text-xs text-green-700 mt-1">转化率: {tag.conversionRate.toFixed(1)}%</div>
                  <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${tag.conversionRate}%`, backgroundColor: tag.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

