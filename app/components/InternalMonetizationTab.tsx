'use client'

import { useState, useMemo } from 'react'
import { ShoppingCart, DollarSign } from 'lucide-react'
import RealtimeStream from './RealtimeStream'
import FunnelChart from './FunnelChart'
import LatencyWinRateChart from './LatencyWinRateChart'
import RevenueLossAnalyzer from './RevenueLossAnalyzer'
import TopMetricsBar from './TopMetricsBar'
import SmartStrategyCenter from './SmartStrategyCenter'
import RegionHeatmap from './RegionHeatmap'
import PrivacyEnvironmentDiagnostic from './PrivacyEnvironmentDiagnostic'
import { WhiteboxTrace, FunnelData } from '../types'

interface InternalMonetizationTabProps {
  logs: WhiteboxTrace[]
  selectedRequestId: string | null
  onRequestClick: (requestId: string) => void
  onRegionClick: (region: string | null) => void
  selectedRegion: string | null
}

export default function InternalMonetizationTab({
  logs,
  selectedRequestId,
  onRequestClick,
  onRegionClick,
  selectedRegion
}: InternalMonetizationTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'goods' | 'ads'>('ads')
  
  // 计算漏斗数据
  const funnelData: FunnelData = useMemo(() => {
    const requestIds = new Set<string>()
    const validIds = new Set<string>()
    const bidIds = new Set<string>()
    const winIds = new Set<string>()

    logs.forEach((log: WhiteboxTrace) => {
      requestIds.add(log.request_id)

      if (log.node === 'SSP' && log.action === 'REQUEST_GENERATED') {
        validIds.add(log.request_id)
      }

      if (log.node === 'DSP' && (log.action === 'BID_CALCULATION' || log.action === 'BID_SUBMITTED')) {
        bidIds.add(log.request_id)
      }

      if (log.action === 'AUCTION_RESULT' || 
          (log.node === 'ADX' && log.action === 'FINAL_DECISION' && log.decision === 'PASS')) {
        winIds.add(log.request_id)
      }
    })

    return {
      request: requestIds.size,
      valid: validIds.size,
      bid: bidIds.size,
      win: winIds.size
    }
  }, [logs])
  
  return (
    <div className="h-full flex flex-col">
      {/* 子 Tab 切换 */}
      <div className="flex border-b border-gray-200 bg-white mb-3 md:mb-4 rounded-t-lg overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('goods')}
          className={`flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
            activeSubTab === 'goods'
              ? 'text-[#2563eb] border-b-2 border-[#2563eb] bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span className="hidden sm:inline">卖货（用户旅程漏斗）</span>
          <span className="sm:hidden">卖货</span>
        </button>
        <button
          onClick={() => setActiveSubTab('ads')}
          className={`flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
            activeSubTab === 'ads'
              ? 'text-[#2563eb] border-b-2 border-[#2563eb] bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span className="hidden sm:inline">卖广告（竞价系统）</span>
          <span className="sm:hidden">卖广告</span>
        </button>
      </div>
      
      {/* 子 Tab 内容 */}
      <div className="flex-1 overflow-auto">
        {activeSubTab === 'goods' ? (
          // 卖货：用户旅程漏斗及卡点
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-4">用户旅程漏斗</h3>
              <div className="space-y-3">
                {[
                  { stage: '曝光', count: 1000, rate: 100 },
                  { stage: '点击', count: 50, rate: 5 },
                  { stage: '登录', count: 30, rate: 3 },
                  { stage: '浏览', count: 25, rate: 2.5 },
                  { stage: '加购', count: 10, rate: 1 },
                  { stage: '下单', count: 5, rate: 0.5 },
                  { stage: '支付', count: 4, rate: 0.4 }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-20 text-sm font-medium text-gray-700">{item.stage}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full flex items-center justify-end pr-2 text-white text-xs font-semibold transition-all"
                        style={{ width: `${item.rate}%` }}
                      >
                        {item.count > 0 && item.rate > 2 && item.count}
                      </div>
                      {item.count > 0 && item.rate <= 2 && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-700">
                          {item.count}
                        </div>
                      )}
                    </div>
                    <div className="w-16 text-sm font-bold text-blue-700">{item.rate}%</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-4">关键卡点分析</h3>
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-sm font-semibold text-red-800 mb-1">点击率偏低</div>
                  <div className="text-xs text-red-700">当前点击率 5%，低于行业均值 8%，建议优化素材创意</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="text-sm font-semibold text-amber-800 mb-1">登录转化率下降</div>
                  <div className="text-xs text-amber-700">登录转化率从 3.5% 下降至 3%，建议检查登录流程</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm font-semibold text-blue-800 mb-1">支付成功率良好</div>
                  <div className="text-xs text-blue-700">支付成功率 80%，高于行业均值 75%</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // 卖广告：原先截图中的内容
          <div className="space-y-3 md:space-y-4">
            {/* 顶部指标栏 */}
            <TopMetricsBar logs={logs} />
            
            {/* 主布局：左侧实时流，中间漏斗+延迟，右侧策略 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
              {/* 左侧：实时交易流 */}
              <div className="lg:col-span-3 bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm h-[400px] md:h-auto">
                <RealtimeStream 
                  logs={logs} 
                  onRequestClick={onRequestClick}
                />
              </div>
              
              {/* 中间：损耗漏斗 + 延迟分布（加宽5%，从4列改为5列） */}
              <div className="lg:col-span-5 space-y-3 md:space-y-4">
                <FunnelChart data={funnelData} />
                <div className="hidden md:block">
                  <LatencyWinRateChart logs={logs} />
                </div>
              </div>
              
              {/* 右侧：策略建议（铺满剩余空间） */}
              <div className="lg:col-span-4 flex flex-col gap-3 md:gap-4">
                {/* 隐私环境诊断 - 向上吸顶 */}
                <div className="flex-shrink-0">
                  <PrivacyEnvironmentDiagnostic logs={logs} />
                </div>
                {/* 策略洞察中心 - 填充剩余空间 */}
                <div className="flex-1 min-h-0">
                  <SmartStrategyCenter 
                    selectedRegion={selectedRegion}
                    selectedRequestId={selectedRequestId}
                    logs={logs}
                  />
                </div>
              </div>
            </div>
            
            {/* 第二行：收入损耗分析 + 区域热力图 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
              <RevenueLossAnalyzer logs={logs} />
              <RegionHeatmap 
                logs={logs} 
                selectedRegion={selectedRegion}
                onRegionClick={(region) => onRegionClick(region)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
