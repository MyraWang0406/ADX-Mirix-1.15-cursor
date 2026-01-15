'use client'

import { useState } from 'react'
import { Bell, Mail, MessageSquare, ChevronUp, ChevronDown, CheckCircle, Eye, MousePointerClick } from 'lucide-react'

interface ChannelDetail {
  name: string
  icon: React.ReactNode
  color: string
  metrics: Record<string, number>
}

export default function InternalReachbackTab() {
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null)
  
  // 模拟内回流数据
  const channelData: Record<string, ChannelDetail> = {
    push: {
      name: 'Push',
      icon: <Bell className="w-5 h-5" />,
      color: 'bg-purple-500',
      metrics: {
        sendSuccess: 12500,
        receiveSuccess: 11800,
        vendorExposure: 11200,
        clickUv: 850
      }
    },
    edm: {
      name: 'EDM',
      icon: <Mail className="w-5 h-5" />,
      color: 'bg-blue-500',
      metrics: {
        selectedCount: 15000,
        sendCount: 14800,
        sendSuccess: 14500,
        openCount: 3200,
        clickCount: 850
      }
    },
    sms: {
      name: '短信',
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'bg-green-500',
      metrics: {
        selectedCount: 20000,
        sendCount: 19500,
        clickBackCount: 1200
      }
    }
  }
  
  const channels = Object.entries(channelData).map(([key, data]) => ({
    key,
    ...data
  }))
  
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-800 mb-3">内回流</h3>
      
      {/* 渠道列表 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {channels.map((channel) => (
          <div key={channel.key} className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
            <div
              onClick={() => setExpandedChannel(expandedChannel === channel.key ? null : channel.key)}
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${channel.color} flex items-center justify-center text-white`}>
                  {channel.icon}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">{channel.name}</div>
                  <div className="text-xs text-gray-500">触达流量</div>
                </div>
                {expandedChannel === channel.key ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
              
              {/* 关键指标预览 */}
              <div className="space-y-2 mt-3">
                {channel.key === 'push' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">点击UV</span>
                      <span className="text-sm font-bold text-gray-800">{channel.metrics.clickUv.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">厂商曝光</span>
                      <span className="text-sm font-bold text-blue-700">{channel.metrics.vendorExposure.toLocaleString()}</span>
                    </div>
                  </>
                )}
                {channel.key === 'edm' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">邮件打开</span>
                      <span className="text-sm font-bold text-gray-800">{channel.metrics.openCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">点击人数</span>
                      <span className="text-sm font-bold text-blue-700">{channel.metrics.clickCount.toLocaleString()}</span>
                    </div>
                  </>
                )}
                {channel.key === 'sms' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">点击回流</span>
                      <span className="text-sm font-bold text-gray-800">{channel.metrics.clickBackCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">发送人数</span>
                      <span className="text-sm font-bold text-blue-700">{channel.metrics.sendCount.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* 展开的详情 */}
            {expandedChannel === channel.key && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                {channel.key === 'push' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          <div className="text-xs text-gray-600">发送成功</div>
                        </div>
                        <div className="text-xl font-bold text-blue-700">{channel.metrics.sendSuccess.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500 mt-1">成功率: 100%</div>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <div className="text-xs text-gray-600">接收成功</div>
                        </div>
                        <div className="text-xl font-bold text-green-700">{channel.metrics.receiveSuccess.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500 mt-1">接收率: {((channel.metrics.receiveSuccess || 0) / (channel.metrics.sendSuccess || 1) * 100).toFixed(1)}%</div>
                      </div>
                      
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="w-4 h-4 text-purple-600" />
                          <div className="text-xs text-gray-600">厂商曝光</div>
                        </div>
                        <div className="text-xl font-bold text-purple-700">{channel.metrics.vendorExposure.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500 mt-1">曝光率: {((channel.metrics.vendorExposure || 0) / (channel.metrics.receiveSuccess || 1) * 100).toFixed(1)}%</div>
                      </div>
                      
                      <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <MousePointerClick className="w-4 h-4 text-orange-600" />
                          <div className="text-xs text-gray-600">点击UV</div>
                        </div>
                        <div className="text-xl font-bold text-orange-700">{channel.metrics.clickUv.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500 mt-1">点击率: {((channel.metrics.clickUv || 0) / (channel.metrics.vendorExposure || 1) * 100).toFixed(2)}%</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {channel.key === 'edm' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="text-xs text-gray-600 mb-2">圈选人数</div>
                        <div className="text-xl font-bold text-blue-700">{channel.metrics.selectedCount.toLocaleString()}</div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-xs text-gray-600 mb-2">发送人数</div>
                        <div className="text-xl font-bold text-gray-700">{channel.metrics.sendCount.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500 mt-1">发送率: {((channel.metrics.sendCount || 0) / (channel.metrics.selectedCount || 1) * 100).toFixed(1)}%</div>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="text-xs text-gray-600 mb-2">发送成功</div>
                        <div className="text-xl font-bold text-green-700">{channel.metrics.sendSuccess.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500 mt-1">成功率: {((channel.metrics.sendSuccess || 0) / (channel.metrics.sendCount || 1) * 100).toFixed(1)}%</div>
                      </div>
                      
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <div className="text-xs text-gray-600 mb-2">邮件打开</div>
                        <div className="text-xl font-bold text-purple-700">{channel.metrics.openCount.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500 mt-1">打开率: {((channel.metrics.openCount || 0) / (channel.metrics.sendSuccess || 1) * 100).toFixed(1)}%</div>
                      </div>
                      
                      <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                        <div className="text-xs text-gray-600 mb-2">点击人数</div>
                        <div className="text-xl font-bold text-orange-700">{channel.metrics.clickCount.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500 mt-1">点击率: {((channel.metrics.clickCount || 0) / (channel.metrics.openCount || 1) * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {channel.key === 'sms' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="text-xs text-gray-600 mb-2">圈选人数</div>
                        <div className="text-xl font-bold text-blue-700">{channel.metrics.selectedCount.toLocaleString()}</div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-xs text-gray-600 mb-2">发送人数</div>
                        <div className="text-xl font-bold text-gray-700">{channel.metrics.sendCount.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500 mt-1">发送率: {((channel.metrics.sendCount || 0) / (channel.metrics.selectedCount || 1) * 100).toFixed(1)}%</div>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="text-xs text-gray-600 mb-2">点击回流人数</div>
                        <div className="text-xl font-bold text-green-700">{channel.metrics.clickBackCount.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500 mt-1">回流率: {((channel.metrics.clickBackCount || 0) / (channel.metrics.sendCount || 1) * 100).toFixed(2)}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
