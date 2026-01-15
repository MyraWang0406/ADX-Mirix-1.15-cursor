'use client'

import { ArrowRight, Smartphone, List, Play, Calendar } from 'lucide-react'

export default function UserJourneyFlow() {
  const stages = [
    {
      name: '买量渠道',
      icon: <Smartphone className="w-5 h-5" />,
      color: 'bg-blue-500',
      algorithm: '推送策略优化',
      metrics: '打开率: 35%'
    },
    {
      name: '打开 APP',
      icon: <Smartphone className="w-5 h-5" />,
      color: 'bg-green-500',
      algorithm: '冷启动策略',
      metrics: '启动时长: 1.2s'
    },
    {
      name: '浏览列表',
      icon: <List className="w-5 h-5" />,
      color: 'bg-purple-500',
      algorithm: '排序权重',
      metrics: 'Top10 CTR: 18%'
    },
    {
      name: '内容消费',
      icon: <Play className="w-5 h-5" />,
      color: 'bg-orange-500',
      algorithm: '完播率优化',
      metrics: '完播率: 82%'
    },
    {
      name: '次日留存',
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-red-500',
      algorithm: '全链路优化',
      metrics: '留存率: 65%'
    }
  ]
  
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
      <h3 className="text-sm font-bold text-gray-800 mb-4">用户动线流</h3>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {stages.map((stage, idx) => (
          <div key={idx} className="flex items-center gap-2 flex-shrink-0">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full ${stage.color} flex items-center justify-center text-white shadow-md`}>
                {stage.icon}
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-gray-800">{stage.name}</div>
                <div className="text-[10px] text-gray-600 mt-0.5">{stage.algorithm}</div>
                <div className="text-[10px] text-blue-600 font-semibold mt-0.5">{stage.metrics}</div>
              </div>
            </div>
            {idx < stages.length - 1 && (
              <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
