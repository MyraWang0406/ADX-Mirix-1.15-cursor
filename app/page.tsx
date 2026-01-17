'use client'

import { useState, useEffect, useMemo } from 'react'
import { RefreshCw, TrendingUp, Zap, DollarSign } from 'lucide-react'
import TabContainer from './components/TabContainer'
import ExternalAcquisitionTab from './components/ExternalAcquisitionTab'
import InternalDistributionTab from './components/InternalDistributionTab'
import InternalMonetizationTab from './components/InternalMonetizationTab'
import BusinessDiagnosisHeader from './components/BusinessDiagnosisHeader'
import MetricsPyramid from './components/MetricsPyramid'
import StrategyAuditCenter from './components/StrategyAuditCenter'
import { WhiteboxTrace, FunnelData } from './types'

export default function Home() {
  const [logs, setLogs] = useState<WhiteboxTrace[]>([])
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // ⚠️ 关键：mounted 前不渲染主 UI，避免 Cloudflare Pages 静态导出时 hydration mismatch
  const [mounted, setMounted] = useState(false)

  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [formattedLastUpdate, setFormattedLastUpdate] = useState('')
  const [diversity, setDiversity] = useState<number>(0.85)
  const [newAuthorBoostEnabled, setNewAuthorBoostEnabled] = useState(false)

  // 计算漏斗数据（目前没直接用到，但保留）
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

      if (
        log.action === 'AUCTION_RESULT' ||
        (log.node === 'ADX' && log.action === 'FINAL_DECISION' && log.decision === 'PASS')
      ) {
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

  // 稳定的伪随机数生成器（基于种子，确保“同一 seed”输出稳定）
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      // 静态导出模式：使用模拟数据
      const baseSeed = 12345 // 固定种子
      const timeOffset = mounted ? Date.now() : 0 // 只在客户端使用时间

      const mockLogs: WhiteboxTrace[] = Array.from({ length: 50 }, (_, i) => {
        const seed = baseSeed + i
        const requestId = `req_${baseSeed}_${i}`
        const bidPrice = 0.5 + seededRandom(seed) * 0.5
        const pctr = 0.01 + seededRandom(seed + 100) * 0.02
        const pcvr = 0.03 + seededRandom(seed + 200) * 0.04
        const qFactor = 0.7 + seededRandom(seed + 300) * 0.3
        const ecpm = bidPrice * pctr * pcvr * qFactor * 1000
        const actualPaid = bidPrice * 0.8
        const savedAmount = Math.max(0.1, bidPrice - actualPaid)

        const baseTime = timeOffset > 0 ? timeOffset : 1700000000000
        const timestamp = new Date(baseTime - i * 1000).toISOString()

        // 生成多条日志来模拟完整的请求流程
        const tracesForRequest: WhiteboxTrace[] = []
        
        // 1. SSP 请求生成日志（包含 latency_ms）
        const sspLatency = 50 + seededRandom(seed + 800) * 150
        tracesForRequest.push({
          request_id: requestId,
          timestamp: new Date(baseTime - i * 1000 - 300).toISOString(),
          node: 'SSP',
          action: 'REQUEST_GENERATED',
          decision: 'PASS',
          reason_code: 'NONE',
          internal_variables: { latency_ms: sspLatency },
          reasoning: '模拟SSP请求',
          pCTR: pctr,
          pCVR: pcvr,
          eCPM: ecpm,
          actual_paid_price: actualPaid,
          saved_amount: savedAmount,
          latency_ms: sspLatency
        })

        // 2. 延迟检查（约30%的请求会超时）
        if (seededRandom(seed + 900) > 0.3) {
          const latency = 100 + seededRandom(seed + 1000) * 100
          tracesForRequest.push({
            request_id: requestId,
            timestamp: new Date(baseTime - i * 1000 - 200).toISOString(),
            node: 'ADX',
            action: 'LATENCY_CHECK',
            decision: 'REJECT',
            reason_code: 'LATENCY_TIMEOUT',
            internal_variables: {
              latency_ms: latency,
              highest_potential_ecpm_loss: ecpm * (1 + seededRandom(seed + 1100) * 0.5)
            },
            reasoning: `模拟响应延迟 ${latency.toFixed(1)}ms 超过阈值 100ms`,
            pCTR: pctr,
            pCVR: pcvr,
            eCPM: ecpm,
            actual_paid_price: actualPaid,
            saved_amount: savedAmount,
            latency_ms: latency
          })
        } else {
          // 3. DSP 出价日志
          tracesForRequest.push({
            request_id: requestId,
            timestamp: new Date(baseTime - i * 1000 - 200).toISOString(),
            node: 'DSP',
            action: 'BID_SUBMITTED',
            decision: 'PASS',
            reason_code: 'NONE',
            internal_variables: {
              bid_price: bidPrice,
              pctr: pctr,
              pcvr: pcvr,
              q_factor: qFactor
            },
            reasoning: '模拟DSP出价',
            pCTR: pctr,
            pCVR: pcvr,
            eCPM: ecpm,
            actual_paid_price: actualPaid,
            saved_amount: savedAmount,
            latency_ms: 50 + seededRandom(seed + 1200) * 50
          })
          
          // 4. 最终决策（约40%的请求会中标）
          if (seededRandom(seed + 1300) > 0.6) {
            tracesForRequest.push({
              request_id: requestId,
              timestamp: new Date(baseTime - i * 1000 - 100).toISOString(),
              node: 'ADX',
              action: 'AUCTION_RESULT',
              decision: 'PASS',
              reason_code: 'ACCEPTED',
              internal_variables: {
                winner_bid: bidPrice,
                winner_ecpm: ecpm
              },
              reasoning: '模拟竞价成功',
              pCTR: pctr,
              pCVR: pcvr,
              eCPM: ecpm,
              actual_paid_price: actualPaid,
              saved_amount: savedAmount,
              latency_ms: 50 + seededRandom(seed + 1400) * 50
            })
          } else {
            tracesForRequest.push({
              request_id: requestId,
              timestamp: new Date(baseTime - i * 1000 - 100).toISOString(),
              node: 'ADX',
              action: 'FINAL_DECISION',
              decision: 'REJECT',
              reason_code: 'BID_BELOW_FLOOR',
              internal_variables: {},
              reasoning: '模拟出价低于底价',
              pCTR: pctr,
              pCVR: pcvr,
              eCPM: ecpm,
              actual_paid_price: actualPaid,
              saved_amount: savedAmount,
              latency_ms: 50 + seededRandom(seed + 1500) * 50
            })
          }
        }
        
        return tracesForRequest
      }).flat()
      setLogs(mockLogs)
      if (mounted) {
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // 只在客户端挂载后才获取数据，避免 hydration mismatch
    if (mounted) {
      fetchLogs()
      const interval = setInterval(fetchLogs, 2000) // 每 2 秒轮询一次
      return () => clearInterval(interval)
    }
  }, [mounted])

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

  // ✅ 核心修复：mounted 前只渲染一个固定的 loading
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] text-[#2563eb]">
        <header className="bg-white border-b border-gray-100 px-6 py-3 shadow-subtle">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#2563eb]">白盒化广告交易看板</h1>
              <p className="text-xs text-[#2563eb]/70 mt-0.5">
                Mirix 风格的可视化排查看板 | 通过 AI Coding 复现整个广告系统的黑盒，并解决 iOS 隐私环境下进行 eCPM 预估补偿的难题
              </p>
            </div>
          </div>
        </header>
        <main className="p-4 text-sm text-gray-500">加载中…</main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#2563eb]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-3 shadow-subtle">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#2563eb]">白盒化广告交易看板</h1>
            <p className="text-xs text-[#2563eb]/70 mt-0.5">
              Mirix 风格的可视化排查看板 | 通过 AI Coding 复现整个广告系统的黑盒，并解决 iOS 隐私环境下进行 eCPM 预估补偿的难题
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-light-text-muted">最后更新: {formattedLastUpdate}</div>
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

      {/* Main Content */}
      <main className="p-2 md:p-4 relative bg-[#f8f9fa] min-h-screen">
        {/* 业务问题定位诊断 */}
        <BusinessDiagnosisHeader logs={logs} />

        <div className="grid grid-cols-12 gap-2 mb-4">
          <div className="col-span-12 space-y-2">
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-12 lg:col-span-7">
                <MetricsPyramid logs={logs} onDiversityChange={setDiversity} />
              </div>

              <div className="col-span-12 lg:col-span-5">
                <StrategyAuditCenter logs={logs} selectedRequestId={selectedRequestId} />
              </div>
            </div>
          </div>
        </div>

        {/* Tab 切换 */}
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

        {/* 水印 */}
        <div className="fixed bottom-4 right-4 bg-[#1e3a5f] text-white px-3 py-1.5 rounded text-[10px] font-medium shadow-lg z-50">
          联系作者：myrawzm0406@163.com | 15301052620
        </div>
      </main>
    </div>
  )
}



