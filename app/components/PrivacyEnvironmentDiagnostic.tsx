'use client'

import { useState, useEffect, useMemo } from 'react'
import { Shield, Clock, TrendingUp, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { WhiteboxTrace } from '../types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface PrivacyEnvironmentDiagnosticProps {
  logs: WhiteboxTrace[]
}

export default function PrivacyEnvironmentDiagnostic({ logs }: PrivacyEnvironmentDiagnosticProps) {
  const skanStats = useMemo(() => {
    // 统计 iOS 流量和 SKAN 优化情况
    const iosLogs = logs.filter(log => {
      const platform = log.internal_variables?.platform || ''
      return platform.toUpperCase() === 'IOS'
    })
    
    const skanOptimizedLogs = logs.filter(log => {
      return log.action === 'SKAN_OPTIMIZATION' || 
             log.internal_variables?.skan_optimized === true ||
             log.internal_variables?.is_skan_optimized === true
    })
    
    // 计算平均信心度
    let totalConfidence = 0.0
    let confidenceCount = 0
    let totalConversionValue = 0
    let conversionValueCount = 0
    let totalPostbackDelay = 0.0
    let postbackDelayCount = 0
    
    skanOptimizedLogs.forEach(log => {
      const confidence = log.internal_variables?.skan_confidence || 
                        log.internal_variables?.confidence
      if (confidence !== undefined && confidence !== null) {
        totalConfidence += confidence
        confidenceCount++
      }
      
      const conversionValue = log.internal_variables?.conversion_value
      if (conversionValue !== undefined && conversionValue !== null) {
        totalConversionValue += conversionValue
        conversionValueCount++
      }
      
      const postbackDelay = log.internal_variables?.postback_delay_hours
      if (postbackDelay !== undefined && postbackDelay !== null) {
        totalPostbackDelay += postbackDelay
        postbackDelayCount++
      }
    })
    
    const avgConfidence = confidenceCount > 0 ? (totalConfidence / confidenceCount) * 100 : 85.0
    const avgConversionValue = conversionValueCount > 0 ? totalConversionValue / conversionValueCount : 31
    const avgPostbackDelay = postbackDelayCount > 0 ? totalPostbackDelay / postbackDelayCount : 36
    
    return {
      iosRequestCount: iosLogs.length,
      skanOptimizedCount: skanOptimizedLogs.length,
      avgConfidence: avgConfidence,
      avgConversionValue: avgConversionValue,
      avgPostbackDelay: avgPostbackDelay,
      hasSkanData: skanOptimizedLogs.length > 0
    }
  }, [logs])
  
  // 计算 iOS 16.x 流量占比和 eCPM 修正系数（必须在早期返回之前调用所有 hooks）
  const ios16Ratio = useMemo(() => {
    const iosLogs = logs.filter(log => {
      const platform = log.internal_variables?.platform || ''
      return platform.toUpperCase() === 'IOS'
    })
    // 模拟：假设 60% 的 iOS 流量是 iOS 16.x
    return iosLogs.length > 0 ? 0.6 : 0
  }, [logs])

  const ecpmCorrectionFactor = useMemo(() => {
    // 基于 SKAN 优化情况计算修正系数
    if (skanStats.hasSkanData) {
      // 信心度越高，修正系数越大（1.0 - 1.2）
      return 1.0 + (skanStats.avgConfidence / 100) * 0.2
    }
    return 1.0
  }, [skanStats])

  // 获取平均 pCVR（用于对比）
  const pcvr = useMemo(() => {
    const skanLogs = logs.filter(log => {
      return log.action === 'SKAN_OPTIMIZATION' || 
             log.internal_variables?.skan_optimized === true
    })
    if (skanLogs.length === 0) return 0.03 // 默认值
    const totalPcvr = skanLogs.reduce((sum, log) => sum + (log.pCVR || 0), 0)
    return totalPcvr / skanLogs.length
  }, [logs])
  
  // 早期返回必须在所有 hooks 调用之后
  // 静态导出模式：即使没有数据也显示默认内容，避免空白
  // if (!skanStats.hasSkanData && skanStats.iosRequestCount === 0) {
  //   return null
  // }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-2.5 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Shield className="w-4 h-4 text-blue-700" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-blue-900">隐私环境诊断</h3>
          <p className="text-[9px] text-blue-700">SKAN 4.0 延迟归因与概率优化</p>
        </div>
      </div>
      
      {skanStats.hasSkanData ? (
        <div className="space-y-2">
          <div className="bg-white/60 rounded p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-semibold text-blue-900">当前状态</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded font-medium">
                数据模糊环境
              </span>
            </div>
            <p className="text-[10px] text-blue-800 leading-relaxed">
              当前处于隐私受限环境，系统正在利用 <strong>SKAN 概率模型</strong> 进行出价补偿，当前预测信心度为 <strong className="text-blue-900">{skanStats.avgConfidence.toFixed(1)}%</strong>。
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/60 rounded p-1.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <TrendingUp className="w-3 h-3 text-blue-700" />
                <span className="text-[8px] text-blue-700 font-medium">转化值</span>
              </div>
              <div className="text-xs font-bold text-blue-900">
                {skanStats.avgConversionValue.toFixed(0)}/63
              </div>
            </div>
            
            <div className="bg-white/60 rounded p-1.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Clock className="w-3 h-3 text-blue-700" />
                <span className="text-[8px] text-blue-700 font-medium">延迟</span>
              </div>
              <div className="text-xs font-bold text-blue-900">
                {skanStats.avgPostbackDelay.toFixed(1)}h
              </div>
            </div>
            
            <div className="bg-white/60 rounded p-1.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Shield className="w-3 h-3 text-blue-700" />
                <span className="text-[8px] text-blue-700 font-medium">优化</span>
              </div>
              <div className="text-xs font-bold text-blue-900">
                {skanStats.skanOptimizedCount}
              </div>
            </div>
          </div>
          
          {/* SKAN 对比图表 */}
          <div className="bg-white/60 rounded p-2 border border-blue-200">
            <div className="text-[9px] font-semibold text-blue-900 mb-2">数据透明 vs SKAN 环境对比</div>
            
            {/* 对比数据 */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-white rounded p-1.5 border border-blue-300">
                <div className="flex items-center gap-1 mb-1">
                  <Eye className="w-3 h-3 text-green-600" />
                  <span className="text-[8px] font-semibold text-gray-700">数据透明环境</span>
                </div>
                <div className="text-[9px] text-gray-600 space-y-0.5">
                  <div>真实转化率: <span className="font-bold text-green-600">5.2%</span></div>
                  <div>实时数据: <span className="font-bold text-green-600">可见</span></div>
                  <div>出价修正: <span className="font-bold text-green-600">1.0x</span></div>
                </div>
              </div>
              
              <div className="bg-white rounded p-1.5 border border-blue-300">
                <div className="flex items-center gap-1 mb-1">
                  <EyeOff className="w-3 h-3 text-blue-600" />
                  <span className="text-[8px] font-semibold text-gray-700">SKAN 隐私环境</span>
                </div>
                <div className="text-[9px] text-gray-600 space-y-0.5">
                  <div>预估转化率: <span className="font-bold text-blue-600">{(pcvr * 100).toFixed(2)}%</span></div>
                  <div>数据延迟: <span className="font-bold text-blue-600">{skanStats.avgPostbackDelay.toFixed(0)}h</span></div>
                  <div>出价修正: <span className="font-bold text-blue-600">{ecpmCorrectionFactor.toFixed(2)}x</span></div>
                </div>
              </div>
            </div>

            {/* 对比柱状图 */}
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: '数据透明', 转化率: 5.2, 出价系数: 1.0 },
                  { name: 'SKAN环境', 转化率: (pcvr * 100), 出价系数: ecpmCorrectionFactor }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '9px' }} />
                  <Bar dataKey="转化率" fill="#10b981" name="转化率 (%)" />
                  <Bar dataKey="出价系数" fill="#3b82f6" name="出价系数" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* SKAN 4.0 Agent 洞察 */}
            <div className="mt-2 pt-2 border-t border-blue-300">
              <div className="text-[9px] text-blue-800 leading-relaxed mb-1">
                <strong>白盒化归因逻辑：</strong>系统基于历史转化值分布概率（0-63）进行 pCVR 预估，在数据模糊情况下通过概率模型补偿出价，确保 iOS 流量的竞价竞争力。
              </div>
              <div className="text-[9px] text-blue-900 leading-relaxed font-semibold bg-blue-100/50 p-1 rounded">
                【SKAN 归因预警】由于 iOS 16.x 流量占比上升（{ios16Ratio > 0 ? `${(ios16Ratio * 100).toFixed(0)}%` : '0%'}），当前 conversion_value 存在 {skanStats.avgPostbackDelay.toFixed(0)}h 均值延迟。系统已自动开启概率模型补偿，当前 eCPM 修正系数为 {ecpmCorrectionFactor.toFixed(2)}x，以防止在隐私环境下过度漏买高价值流量。
              </div>
              <div className="text-[9px] text-blue-800 leading-relaxed mt-1">
                <strong>为什么需要 {ecpmCorrectionFactor.toFixed(2)}x 出价补偿？</strong> 在 SKAN 环境下，真实转化数据延迟 {skanStats.avgPostbackDelay.toFixed(0)} 小时才能看到，系统无法实时判断流量质量。通过历史概率模型，我们预估当前流量的转化率可能被低估了 {(ecpmCorrectionFactor - 1) * 100}%，因此提高出价 {(ecpmCorrectionFactor - 1) * 100}% 来避免漏买高价值流量。
              </div>
            </div>
          </div>
        </div>
      ) : (
        // 静态导出模式：显示默认的 SKAN 诊断内容
        <div className="space-y-2">
          <div className="bg-white/60 rounded p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-semibold text-blue-900">当前状态</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded font-medium">
                数据模糊环境
              </span>
            </div>
            <p className="text-[10px] text-blue-800 leading-relaxed">
              当前处于隐私受限环境，系统正在利用 <strong>SKAN 概率模型</strong> 进行出价补偿，当前预测信心度为 <strong className="text-blue-900">85.0%</strong>。
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/60 rounded p-1.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <TrendingUp className="w-3 h-3 text-blue-700" />
                <span className="text-[8px] text-blue-700 font-medium">转化值</span>
              </div>
              <div className="text-xs font-bold text-blue-900">31/63</div>
            </div>
            
            <div className="bg-white/60 rounded p-1.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Clock className="w-3 h-3 text-blue-700" />
                <span className="text-[8px] text-blue-700 font-medium">延迟</span>
              </div>
              <div className="text-xs font-bold text-blue-900">36.0h</div>
            </div>
            
            <div className="bg-white/60 rounded p-1.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Shield className="w-3 h-3 text-blue-700" />
                <span className="text-[8px] text-blue-700 font-medium">优化</span>
              </div>
              <div className="text-xs font-bold text-blue-900">18</div>
            </div>
          </div>
          
          {/* SKAN 对比图表 */}
          <div className="bg-white/60 rounded p-2 border border-blue-200">
            <div className="text-[9px] font-semibold text-blue-900 mb-2">数据透明 vs SKAN 环境对比</div>
            
            {/* 对比数据 */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-white rounded p-1.5 border border-blue-300">
                <div className="flex items-center gap-1 mb-1">
                  <Eye className="w-3 h-3 text-green-600" />
                  <span className="text-[8px] font-semibold text-gray-700">数据透明环境</span>
                </div>
                <div className="text-[9px] text-gray-600 space-y-0.5">
                  <div>真实转化率: <span className="font-bold text-green-600">5.2%</span></div>
                  <div>实时数据: <span className="font-bold text-green-600">可见</span></div>
                  <div>出价修正: <span className="font-bold text-green-600">1.0x</span></div>
                </div>
              </div>
              
              <div className="bg-white rounded p-1.5 border border-blue-300">
                <div className="flex items-center gap-1 mb-1">
                  <EyeOff className="w-3 h-3 text-blue-600" />
                  <span className="text-[8px] font-semibold text-gray-700">SKAN 隐私环境</span>
                </div>
                <div className="text-[9px] text-gray-600 space-y-0.5">
                  <div>预估转化率: <span className="font-bold text-blue-600">{(pcvr * 100).toFixed(2)}%</span></div>
                  <div>数据延迟: <span className="font-bold text-blue-600">36h</span></div>
                  <div>出价修正: <span className="font-bold text-blue-600">{ecpmCorrectionFactor.toFixed(2)}x</span></div>
                </div>
              </div>
            </div>

            {/* 对比柱状图 */}
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: '数据透明', 转化率: 5.2, 出价系数: 1.0 },
                  { name: 'SKAN环境', 转化率: (pcvr * 100), 出价系数: ecpmCorrectionFactor }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '9px' }} />
                  <Bar dataKey="转化率" fill="#10b981" name="转化率 (%)" />
                  <Bar dataKey="出价系数" fill="#3b82f6" name="出价系数" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* SKAN 4.0 Agent 洞察 */}
            <div className="mt-2 pt-2 border-t border-blue-300">
              <div className="text-[9px] text-blue-800 leading-relaxed mb-1">
                <strong>白盒化归因逻辑：</strong>系统基于历史转化值分布概率（0-63）进行 pCVR 预估，在数据模糊情况下通过概率模型补偿出价，确保 iOS 流量的竞价竞争力。
              </div>
              <div className="text-[9px] text-blue-900 leading-relaxed font-semibold bg-blue-100/50 p-1 rounded">
                【SKAN 归因预警】由于 iOS 16.x 流量占比上升（{ios16Ratio > 0 ? `${(ios16Ratio * 100).toFixed(0)}%` : '60%'}），当前 conversion_value 存在 36h 均值延迟。系统已自动开启概率模型补偿，当前 eCPM 修正系数为 {ecpmCorrectionFactor.toFixed(2)}x，以防止在隐私环境下过度漏买高价值流量。
              </div>
              <div className="text-[9px] text-blue-800 leading-relaxed mt-1">
                <strong>为什么需要 {ecpmCorrectionFactor.toFixed(2)}x 出价补偿？</strong> 在 SKAN 环境下，真实转化数据延迟 36 小时才能看到，系统无法实时判断流量质量。通过历史概率模型，我们预估当前流量的转化率可能被低估了 {((ecpmCorrectionFactor - 1) * 100).toFixed(0)}%，因此提高出价 {((ecpmCorrectionFactor - 1) * 100).toFixed(0)}% 来避免漏买高价值流量。
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

