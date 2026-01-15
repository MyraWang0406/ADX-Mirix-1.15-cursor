'use client'

import { useMemo, useState, useEffect } from 'react'
import { Search, Filter, Zap, Shuffle, ArrowRight, ToggleLeft, ToggleRight } from 'lucide-react'
import { WhiteboxTrace } from '../types'

interface SearchRecommendationFunnelProps {
  logs: WhiteboxTrace[]
  selectedRequestId?: string | null
  diversity?: number
  onNewAuthorBoostChange?: (enabled: boolean) => void
}

export default function SearchRecommendationFunnel({ logs, selectedRequestId, diversity, onNewAuthorBoostChange }: SearchRecommendationFunnelProps) {
  const [newAuthorBoostEnabled, setNewAuthorBoostEnabled] = useState(false)
  const [hoveredFormula, setHoveredFormula] = useState(false)
  
  const funnelData = useMemo(() => {
    const requestLogs = selectedRequestId 
      ? logs.filter(l => l.request_id === selectedRequestId)
      : logs
    
    const funnelLog = requestLogs.find(l => l.action === 'FUNNEL_PROCESSING')
    
    if (!funnelLog) {
      // 生成模拟数据
      return {
        recall: {
          interest: { count: 25, matchRate: 85 },
          collaborative: { count: 25, matchRate: 72 },
          popular: { count: 25, matchRate: 90 },
          follow: { count: 15, matchRate: 78 },
          realtime: { count: 10, matchRate: 82 },
          total: 100,
          passRate: 100,
          collaborativeRatio: 25, // 协同召回比例
          popularRatio: 25 // 热门召回比例
        },
        coarseRank: {
          input: 100,
          output: 80,
          passRate: 80,
          avgScore: 0.65
        },
        fineRank: {
          input: 80,
          output: 60,
          passRate: 75,
          ctr: 0.15,
          like: 0.08,
          finish: 0.45,
          comment: 0.02,
          finalScore: 0.234
        },
        reRank: {
          input: 60,
          output: 50,
          passRate: 83,
          diversity: diversity || 0.85, // 使用传入的多样性值
          newAuthorBoost: 1.2,
          adInsertCount: 10,
          newAuthorExposure: 12 // 新作者曝光率
        }
      }
    }
    
    const internalVars = funnelLog.internal_variables || {}
    const recalled = internalVars.recalled_count || 100
    const ranked = internalVars.ranked_count || 80
    const reRanked = internalVars.re_ranked_count || 60
    
    // 模拟各层详细数据
    return {
      recall: {
        interest: { count: Math.floor(recalled * 0.25), matchRate: 85 },
        collaborative: { count: Math.floor(recalled * 0.25), matchRate: 72 },
        popular: { count: Math.floor(recalled * 0.25), matchRate: 90 },
        follow: { count: Math.floor(recalled * 0.15), matchRate: 78 },
        realtime: { count: Math.floor(recalled * 0.10), matchRate: 82 },
        total: recalled,
        passRate: 100,
        collaborativeRatio: 25,
        popularRatio: 25
      },
      coarseRank: {
        input: recalled,
        output: ranked,
        passRate: ranked > 0 ? (ranked / recalled * 100) : 80,
        avgScore: 0.65
      },
      fineRank: {
        input: ranked,
        output: reRanked,
        passRate: reRanked > 0 ? (reRanked / ranked * 100) : 75,
        ctr: 0.15,
        like: 0.08,
        finish: 0.45,
        comment: 0.02,
        finalScore: 0.234
      },
      reRank: {
        input: reRanked,
        output: Math.floor(reRanked * 0.83),
        passRate: 83,
        diversity: diversity || 0.85,
        newAuthorBoost: 1.2,
        adInsertCount: Math.floor(reRanked / 5),
        newAuthorExposure: 12
      }
    }
  }, [logs, selectedRequestId, diversity])
  
  const layers = [
    {
      id: 'recall',
      name: '召回层',
      icon: <Search className="w-5 h-5" />,
      color: 'bg-blue-500',
      description: '多路召回：兴趣/协同/热门/关注/实时',
      coreLogic: '向量检索（Embedding相似度）、倒排索引（标签匹配）、协同过滤（UserCF/ItemCF）',
      strategies: [
        { name: '兴趣召回', count: funnelData.recall.interest.count, matchRate: funnelData.recall.interest.matchRate },
        { name: '协同召回', count: funnelData.recall.collaborative.count, matchRate: funnelData.recall.collaborative.matchRate },
        { name: '热门召回', count: funnelData.recall.popular.count, matchRate: funnelData.recall.popular.matchRate },
        { name: '关注召回', count: funnelData.recall.follow.count, matchRate: funnelData.recall.follow.matchRate },
        { name: '实时召回', count: funnelData.recall.realtime.count, matchRate: funnelData.recall.realtime.matchRate }
      ],
      totalInput: 0,
      totalOutput: funnelData.recall.total,
      passRate: funnelData.recall.passRate,
      metrics: [
        { label: '召回覆盖度', value: '95%' },
        { label: '召回多样性', value: '0.78' },
        { label: '协同召回比例', value: `${funnelData.recall.collaborativeRatio || 25}%` },
        { label: '热门召回比例', value: `${funnelData.recall.popularRatio || 25}%` }
      ]
    },
    {
      id: 'coarseRank',
      name: '粗排层',
      icon: <Filter className="w-5 h-5" />,
      color: 'bg-purple-500',
      description: '轻量模型：LR/GBDT浅层/双塔轻量版',
      coreLogic: '线性模型（LR）、简单树模型（GBDT浅层）、双塔模型（轻量版）',
      strategies: [
        { name: 'LR模型', count: Math.floor(funnelData.coarseRank.output * 0.4), matchRate: 75 },
        { name: 'GBDT浅层', count: Math.floor(funnelData.coarseRank.output * 0.35), matchRate: 78 },
        { name: '双塔轻量', count: Math.floor(funnelData.coarseRank.output * 0.25), matchRate: 82 }
      ],
      totalInput: funnelData.coarseRank.input,
      totalOutput: funnelData.coarseRank.output,
      passRate: funnelData.coarseRank.passRate,
      metrics: [
        { label: '平均得分', value: funnelData.coarseRank.avgScore.toFixed(3) },
        { label: '处理耗时', value: '<10ms' }
      ]
    },
    {
      id: 'fineRank',
      name: '精排层',
      icon: <Zap className="w-5 h-5" />,
      color: 'bg-green-500',
      description: '深度学习：DNN/Wide&Deep/DeepFM',
      strategies: [
        { name: 'CTR预估', value: `${(funnelData.fineRank.ctr * 100).toFixed(1)}%` },
        { name: '点赞率', value: `${(funnelData.fineRank.like * 100).toFixed(1)}%` },
        { name: '完播率', value: `${(funnelData.fineRank.finish * 100).toFixed(1)}%` },
        { name: '评论率', value: `${(funnelData.fineRank.comment * 100).toFixed(1)}%` }
      ],
      totalInput: funnelData.fineRank.input,
      totalOutput: funnelData.fineRank.output,
      passRate: funnelData.fineRank.passRate,
      metrics: [
        { label: '融合得分', value: funnelData.fineRank.finalScore.toFixed(3) },
        { label: '特征维度', value: '856维' }
      ],
      formula: `Score = 0.4×CTR + 0.25×Like + 0.25×Finish + 0.1×Comment = ${funnelData.fineRank.finalScore.toFixed(3)}`,
      coreLogic: '深度学习：DNN/Wide&Deep/DeepFM，多目标融合'
    },
    {
      id: 'reRank',
      name: '重排层',
      icon: <Shuffle className="w-5 h-5" />,
      color: 'bg-orange-500',
      description: '业务规则：打散/提权/插入/去重',
      coreLogic: '同作者打散、同类目打散、新作者提权、广告插入、内容去重',
      strategies: [
        { name: '同作者打散', value: '间隔≥3条' },
        { name: '新作者提权', value: `×${funnelData.reRank.newAuthorBoost}` },
        { name: '广告插入', value: `${funnelData.reRank.adInsertCount}条` },
        { name: '内容去重', value: '相似度<0.8' }
      ],
      totalInput: funnelData.reRank.input,
      totalOutput: funnelData.reRank.output,
      passRate: funnelData.reRank.passRate,
      metrics: [
        { label: '多样性', value: funnelData.reRank.diversity.toFixed(2) },
        { label: '新作者曝光', value: `${(newAuthorBoostEnabled ? (funnelData.reRank.newAuthorExposure || 12) + 5 : (funnelData.reRank.newAuthorExposure || 12))}%` }
      ]
    }
  ]
  
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-[#2563eb]" />
        <h3 className="text-sm font-bold text-[#2563eb]">搜推引擎四层漏斗（召回→粗排→精排→重排）</h3>
      </div>
      
      <div className="flex-1 space-y-4 overflow-y-auto">
        {layers.map((layer, idx) => (
          <div key={layer.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full ${layer.color} flex items-center justify-center text-white flex-shrink-0`}>
                {layer.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-gray-800">{layer.name}</h4>
                  <span className="text-xs text-gray-500">{layer.description}</span>
                </div>
                {layer.coreLogic && (
                  <div className="text-[10px] text-blue-600 bg-blue-50 rounded px-2 py-1 mb-2 inline-block">
                    核心逻辑：{layer.coreLogic}
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                  <span>入参: {layer.totalInput} 条</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>出参: {layer.totalOutput} 条</span>
                  <span className={`font-semibold ${layer.passRate >= 70 ? 'text-green-600' : layer.passRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    过滤率: {layer.passRate.toFixed(1)}%
                  </span>
                </div>
                
                {/* 策略详情 */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
                  {layer.strategies.map((strategy, sIdx) => (
                    <div key={sIdx} className="bg-white rounded p-2 border border-gray-200">
                      <div className="text-[10px] text-gray-600 mb-0.5">{strategy.name}</div>
                      <div className="text-xs font-bold text-gray-800">
                        {strategy.count !== undefined ? `${strategy.count}条` : strategy.value}
                        {strategy.matchRate !== undefined && (
                          <span className="text-[10px] text-gray-500 ml-1">({strategy.matchRate}%)</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* 指标 */}
                <div className="flex items-center gap-3 text-xs">
                  {layer.metrics.map((metric, mIdx) => (
                    <div key={mIdx} className="flex items-center gap-1">
                      <span className="text-gray-600">{metric.label}:</span>
                      <span className="font-semibold text-blue-700">{metric.value}</span>
                    </div>
                  ))}
                </div>
                
                {/* 公式（仅精排层显示，支持悬停） */}
                {layer.formula && (
                  <div 
                    className="mt-2 bg-blue-50 rounded p-2 border border-blue-200 cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredFormula(true)}
                    onMouseLeave={() => setHoveredFormula(false)}
                  >
                    <div className="text-[10px] text-gray-600 mb-0.5">融合公式（悬停查看）：</div>
                    <div className={`text-[10px] font-mono text-blue-800 transition-all ${hoveredFormula ? 'text-[12px] font-bold' : ''}`}>
                      {layer.formula}
                    </div>
                    {hoveredFormula && (
                      <div className="mt-1 text-[9px] text-gray-600">
                        公式说明：w=0.4(CTR权重), x=0.25(点赞权重), y=0.25(完播权重), z=0.1(评论权重)
                      </div>
                    )}
                  </div>
                )}
                
                {/* 新作者扶持开关（仅重排层显示） */}
                {layer.id === 'reRank' && (
                  <div className="mt-2 bg-orange-50 rounded p-2 border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-gray-600">新作者扶持开关：</div>
                      <button
                        onClick={() => {
                          const newValue = !newAuthorBoostEnabled
                          setNewAuthorBoostEnabled(newValue)
                          if (onNewAuthorBoostChange) {
                            onNewAuthorBoostChange(newValue)
                          }
                        }}
                        className="flex items-center gap-1"
                      >
                        {newAuthorBoostEnabled ? (
                          <ToggleRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="text-[10px] font-semibold text-gray-700">
                          {newAuthorBoostEnabled ? '已开启' : '已关闭'}
                        </span>
                      </button>
                    </div>
                    {newAuthorBoostEnabled && (
                      <div className="mt-1 text-[9px] text-green-600">
                        新作者曝光率已提升至: {funnelData.reRank.newAuthorExposure + 5}%
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

