'use client'

import { useState, useEffect, useMemo } from 'react'
import { RefreshCw, TrendingUp, Zap, DollarSign } from 'lucide-react'
import TabContainer from './components/TabContainer'
import ExternalAcquisitionTab from './components/ExternalAcquisitionTab'
import InternalDistributionTab from './components/InternalDistributionTab'
import InternalMonetizationTab from './components/InternalMonetizationTab'
import BusinessDiagnosisHeader from './components/BusinessDiagnosisHeader'
import SearchRecommendationFunnel from './components/SearchRecommendationFunnel'
import MetricsPyramid from './components/MetricsPyramid'
import UserJourneyFlow from './components/UserJourneyFlow'
import StrategyAuditCenter from './components/StrategyAuditCenter'
import { WhiteboxTrace, FunnelData } from './types'

export default function Home() {
  const [logs, setLogs] = useState<WhiteboxTrace[]>([])
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [diversity, setDiversity] = useState<number>(0.85)
  const [newAuthorBoostEnabled, setNewAuthorBoostEnabled] = useState(false)
  
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

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/logs')
      const data = await response.json()
      setLogs(data.logs || [])
      setLastUpdate(new Date())
      
      // 数据已通过 API 路由强制填充默认值，确保无 $0.00
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 2000) // 每 2 秒轮询一次
    return () => clearInterval(interval)
  }, [])

  const [mounted, setMounted] = useState(false)
  const [formattedLastUpdate, setFormattedLastUpdate] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && lastUpdate) {
      setFormattedLastUpdate(
        lastUpdate.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      )
    }
  }, [mounted, lastUpdate])

  // 移除失败请求快速访问（简化布局）

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#2563eb]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-3 shadow-subtle">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#2563eb]">
              白盒化广告交易看板
            </h1>
            <p className="text-xs text-[#2563eb]/70 mt-0.5">
              Mirix 风格的可视化排查看板 | 通过 AI Coding 复现整个广告系统的黑盒，并解决 iOS 隐私环境下进行 eCPM 预估补偿的难题
            </p>
          </div>
          <div className="flex items-center gap-4">
            {mounted && (
              <div className="text-sm text-light-text-muted">
                最后更新: {formattedLastUpdate}
              </div>
            )}
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-light-accent hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - 12列 Bento 布局 */}
      <main className="p-2 md:p-4 relative bg-[#f8f9fa] min-h-screen">
        {/* 业务问题定位诊断（标题下方） */}
        <BusinessDiagnosisHeader logs={logs} />
        
        {/* 12列 Bento 布局 - 右侧展开 */}
        <div className="grid grid-cols-12 gap-2 mb-4">
          {/* 右侧：指标金字塔 + 审计中心 */}
          <div className="col-span-12 space-y-2">
            <div className="grid grid-cols-12 gap-2">
              {/* 左侧：北极星指标层 (60%) */}
              <div className="col-span-12 lg:col-span-7">
                <MetricsPyramid logs={logs} onDiversityChange={setDiversity} />
              </div>
              
              {/* 右侧：策略审计中心 (40%) */}
              <div className="col-span-12 lg:col-span-5">
                <StrategyAuditCenter 
                  logs={logs}
                  selectedRequestId={selectedRequestId}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab 切换布局（下游内容） */}
        <div className="min-h-[600px]">
          <TabContainer
          tabs={[
            {
              id: 'upstream',
              label: '上游（外买量）',
              icon: <TrendingUp className="w-4 h-4" />,
              content: <ExternalAcquisitionTab logs={logs} />
            },
            {
              id: 'midstream',
              label: '中游（内分发）',
              icon: <Zap className="w-4 h-4" />,
              content: (
                <InternalDistributionTab 
                  logs={logs}
                  selectedRequestId={selectedRequestId}
                  diversity={diversity}
                  onNewAuthorBoostChange={setNewAuthorBoostEnabled}
                />
              )
            },
            {
              id: 'downstream',
              label: '下游（内变现）',
              icon: <DollarSign className="w-4 h-4" />,
              content: (
                <InternalMonetizationTab
                  logs={logs}
                  selectedRequestId={selectedRequestId}
                  onRequestClick={(requestId) => setSelectedRequestId(requestId)}
                  onRegionClick={(region) => setSelectedRegion(region)}
                  selectedRegion={selectedRegion}
                />
              )
            }
          ]}
          defaultTab="downstream"
          />
        </div>
        
        {/* 右下角水印 */}
        <div className="fixed bottom-4 right-4 bg-[#1e3a5f] text-white px-3 py-1.5 rounded text-[10px] font-medium shadow-lg z-50">
          联系作者：myrawzm0406@163.com | 15301052620
        </div>
      </main>
    </div>
  )
}

