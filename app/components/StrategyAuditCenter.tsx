'use client'

import { useState } from 'react'
import { AlertTriangle, MessageSquare, Users, FileText, CheckCircle, XCircle, Clock, Zap } from 'lucide-react'
import { WhiteboxTrace } from '../types'

interface StrategyAuditCenterProps {
  logs: WhiteboxTrace[]
  selectedRequestId?: string | null
}

interface CaseEntry {
  id: string
  source: 'self' | 'business' | 'social' | 'support'
  description: string
  timestamp: Date
  priority: 'P0' | 'P1' | 'P2'
  status: 'pending' | 'validating' | 'verified' | 'resolved'
}

export default function StrategyAuditCenter({ logs, selectedRequestId }: StrategyAuditCenterProps) {
  const [activeTab, setActiveTab] = useState<'cases' | 'validation'>('cases')
  const [cases, setCases] = useState<CaseEntry[]>([
    {
      id: 'case-001',
      source: 'self',
      description: '产品走查：推荐流连续3条都是同一作者，多样性不足',
      timestamp: new Date(),
      priority: 'P1',
      status: 'validating'
    },
    {
      id: 'case-002',
      source: 'business',
      description: '业务方反馈：新创作者曝光率低于10%，需要提权',
      timestamp: new Date(Date.now() - 3600000),
      priority: 'P0',
      status: 'pending'
    },
    {
      id: 'case-003',
      source: 'social',
      description: '社交媒体舆情：用户抱怨推荐内容重复率高',
      timestamp: new Date(Date.now() - 7200000),
      priority: 'P1',
      status: 'verified'
    }
  ])
  
  const sourceConfig = {
    self: { name: '产品走查', icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-blue-500' },
    business: { name: '业务方反馈', icon: <MessageSquare className="w-4 h-4" />, color: 'bg-green-500' },
    social: { name: '社交媒体舆情', icon: <Users className="w-4 h-4" />, color: 'bg-orange-500' },
    support: { name: '客服/工单投诉', icon: <FileText className="w-4 h-4" />, color: 'bg-red-500' }
  }
  
  const priorityConfig = {
    P0: { label: 'P0', color: 'bg-red-500', textColor: 'text-red-700' },
    P1: { label: 'P1', color: 'bg-orange-500', textColor: 'text-orange-700' },
    P2: { label: 'P2', color: 'bg-yellow-500', textColor: 'text-yellow-700' }
  }
  
  const statusConfig = {
    pending: { label: '待处理', icon: <Clock className="w-4 h-4" />, color: 'text-gray-600' },
    validating: { label: '验证中', icon: <Zap className="w-4 h-4" />, color: 'text-blue-600' },
    verified: { label: '已验证', icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-600' },
    resolved: { label: '已解决', icon: <CheckCircle className="w-4 h-4" />, color: 'text-purple-600' }
  }
  
  // 生成诊断报告（自动化流程）
  const generateDiagnosisReport = (caseEntry: CaseEntry) => {
    let report = {
      problemPerception: '',
      initialValidation: '',
      dataValidation: '',
      priorityJudgment: '',
      recommendation: ''
    }
    
    // 根据问题来源自动生成诊断报告
    if (caseEntry.source === 'self' || caseEntry.description.includes('多样性')) {
      report = {
        problemPerception: '问题感知：通过自我体验识别到推荐流连续3条都是同一作者，多样性不足',
        initialValidation: '初步验证：检查打散规则配置，发现同作者间隔设置为2条，低于阈值3条',
        dataValidation: '数据验证：分析最近7天数据，发现同作者连续出现占比18%，超过阈值10%',
        priorityJudgment: `优先级判断：${caseEntry.priority} - 影响范围：中等，严重程度：${caseEntry.priority === 'P0' ? '高' : '中'}`,
        recommendation: 'P0级修复建议：检测到同类目重复率高，建议在重排层开启类目打散策略，将同作者间隔调整为≥3条'
      }
    } else if (caseEntry.source === 'business' || caseEntry.description.includes('新创作者')) {
      report = {
        problemPerception: '问题感知：业务方反馈新创作者曝光率低于10%，需要提权',
        initialValidation: '初步验证：检查重排层配置，发现新作者提权系数为1.0，未启用扶持策略',
        dataValidation: '数据验证：分析最近7天数据，发现新创作者曝光率仅为8.5%，低于阈值10%',
        priorityJudgment: `优先级判断：${caseEntry.priority} - 影响范围：高（影响新创作者生态），严重程度：高`,
        recommendation: 'P0级修复建议：立即在重排层开启新作者扶持开关，将新作者提权系数调整为1.2，预期新创作者曝光率可提升至15%'
      }
    } else if (caseEntry.source === 'social' || caseEntry.description.includes('重复')) {
      report = {
        problemPerception: '问题感知：社交媒体舆情显示用户抱怨推荐内容重复率高',
        initialValidation: '初步验证：检查内容多样性指标，发现打散度为0.75，低于阈值0.8',
        dataValidation: '数据验证：分析用户负反馈数据，发现"不感兴趣"点击率上升至6.2%，超过阈值5%',
        priorityJudgment: `优先级判断：${caseEntry.priority} - 影响范围：高（影响用户体验），严重程度：中`,
        recommendation: 'P1级修复建议：检测到内容多样性不足，建议在重排层加强打散策略，同类目间隔≥2条，同作者间隔≥3条'
      }
    } else {
      report = {
        problemPerception: '问题感知：通过客服工单识别到用户投诉',
        initialValidation: '初步验证：检查相关配置和日志',
        dataValidation: '数据验证：分析相关数据指标',
        priorityJudgment: `优先级判断：${caseEntry.priority} - 影响范围：待评估，严重程度：待评估`,
        recommendation: '建议：进一步分析具体问题，制定针对性修复方案'
      }
    }
    
    return report
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-red-600" />
        <h3 className="text-sm font-bold text-gray-800">策略审计中心</h3>
      </div>
      
      {/* Tab 切换 */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('cases')}
          className={`px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === 'cases'
              ? 'text-[#2563eb] border-b-2 border-[#2563eb]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          问题录入
        </button>
        <button
          onClick={() => setActiveTab('validation')}
          className={`px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === 'validation'
              ? 'text-[#2563eb] border-b-2 border-[#2563eb]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          验证流程
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'cases' ? (
          <div className="space-y-3">
            {/* 四渠道录入 */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {Object.entries(sourceConfig).map(([key, config]) => (
                <button
                  key={key}
                  className={`${config.color} text-white rounded-lg p-2 text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-2 justify-center`}
                  onClick={() => {
                    const newCase: CaseEntry = {
                      id: `case-${Date.now()}`,
                      source: key as CaseEntry['source'],
                      description: `${config.name}：新问题反馈`,
                      timestamp: new Date(),
                      priority: 'P1',
                      status: 'pending'
                    }
                    setCases([newCase, ...cases])
                  }}
                >
                  {config.icon}
                  <span>{config.name}</span>
                </button>
              ))}
            </div>
            
            {/* Case 列表 */}
            {cases.map((caseEntry) => {
              const source = sourceConfig[caseEntry.source]
              const priority = priorityConfig[caseEntry.priority]
              const status = statusConfig[caseEntry.status]
              
              return (
                <div
                  key={caseEntry.id}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setActiveTab('validation')}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full ${source.color} flex items-center justify-center text-white`}>
                        {source.icon}
                      </div>
                      <span className="text-xs font-semibold text-gray-800">{source.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${priority.textColor} bg-${priority.color.replace('bg-', 'bg-')} bg-opacity-20`}>
                        {priority.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-700 mb-2">{caseEntry.description}</div>
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-1 text-xs ${status.color}`}>
                      {status.icon}
                      <span>{status.label}</span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {caseEntry.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {cases.filter(c => c.status === 'validating' || c.status === 'pending').map((caseEntry) => {
              const report = generateDiagnosisReport(caseEntry)
              const source = sourceConfig[caseEntry.source]
              
              return (
                <div key={caseEntry.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-6 h-6 rounded-full ${source.color} flex items-center justify-center text-white`}>
                      {source.icon}
                    </div>
                    <h4 className="text-xs font-bold text-gray-800">{caseEntry.description}</h4>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="bg-blue-50 rounded p-2 border border-blue-200">
                      <div className="font-semibold text-blue-800 mb-1">1. 问题感知</div>
                      <div className="text-blue-700">{report.problemPerception}</div>
                    </div>
                    
                    <div className="bg-green-50 rounded p-2 border border-green-200">
                      <div className="font-semibold text-green-800 mb-1">2. 初步验证</div>
                      <div className="text-green-700">{report.initialValidation}</div>
                    </div>
                    
                    <div className="bg-purple-50 rounded p-2 border border-purple-200">
                      <div className="font-semibold text-purple-800 mb-1">3. 数据验证</div>
                      <div className="text-purple-700">{report.dataValidation}</div>
                    </div>
                    
                    <div className="bg-orange-50 rounded p-2 border border-orange-200">
                      <div className="font-semibold text-orange-800 mb-1">4. 优先级判断</div>
                      <div className="text-orange-700">{report.priorityJudgment}</div>
                    </div>
                    
                    {report.recommendation && (
                      <div className="bg-green-50 rounded p-2 border border-green-200 mt-2">
                        <div className="font-semibold text-green-800 mb-1">5. 自动修复建议</div>
                        <div className="text-green-700 text-xs">{report.recommendation}</div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

