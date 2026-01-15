'use client'

import { useMemo } from 'react'
import { Search, TrendingUp, MousePointerClick, ShoppingCart } from 'lucide-react'
import { WhiteboxTrace } from '../types'

interface SearchQueryAnalysisProps {
  logs: WhiteboxTrace[]
}

interface QueryData {
  query: string
  page: string
  exposure: number
  click: number
  ctr: number
  conversion: number
  conversionRate: number
}

export default function SearchQueryAnalysis({ logs }: SearchQueryAnalysisProps) {
  // 模拟 Query 数据（包含商品详情页、活动聚合页、店铺页）
  const queryData = useMemo<QueryData[]>(() => {
    const queries = [
      { query: '健身器材', page: '商品列表页', baseExposure: 5000, baseClick: 750, baseConversion: 120 },
      { query: '瑜伽垫', page: '商品详情页', baseExposure: 3200, baseClick: 640, baseConversion: 95 },
      { query: '618大促', page: '活动聚合页（会场）', baseExposure: 8500, baseClick: 1275, baseConversion: 210 },
      { query: '跑步机', page: '商品列表页', baseExposure: 2800, baseClick: 420, baseConversion: 68 },
      { query: 'Nike官方店', page: '店铺页', baseExposure: 4200, baseClick: 840, baseConversion: 135 },
      { query: '哑铃', page: '商品详情页', baseExposure: 2100, baseClick: 378, baseConversion: 52 },
      { query: '运动服', page: '商品列表页', baseExposure: 4500, baseClick: 675, baseConversion: 108 },
      { query: '双11会场', page: '活动聚合页（会场）', baseExposure: 7200, baseClick: 1080, baseConversion: 180 },
      { query: '蛋白粉', page: '商品详情页', baseExposure: 1800, baseClick: 324, baseConversion: 45 },
      { query: 'Adidas旗舰店', page: '店铺页', baseExposure: 3800, baseClick: 760, baseConversion: 120 },
      { query: '运动鞋', page: '商品列表页', baseExposure: 3800, baseClick: 570, baseConversion: 88 },
      { query: '护膝', page: '商品详情页', baseExposure: 1500, baseClick: 270, baseConversion: 38 }
    ]
    
    return queries.map(q => ({
      query: q.query,
      page: q.page,
      exposure: q.baseExposure,
      click: q.baseClick,
      ctr: (q.baseClick / q.baseExposure * 100),
      conversion: q.baseConversion,
      conversionRate: (q.baseConversion / q.baseClick * 100)
    }))
  }, [])
  
  const totalExposure = queryData.reduce((sum, q) => sum + q.exposure, 0)
  const totalClick = queryData.reduce((sum, q) => sum + q.click, 0)
  const totalConversion = queryData.reduce((sum, q) => sum + q.conversion, 0)
  const avgCtr = totalExposure > 0 ? (totalClick / totalExposure * 100) : 0
  const avgConversionRate = totalClick > 0 ? (totalConversion / totalClick * 100) : 0
  
  return (
    <div className="space-y-4">
      {/* 汇总指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-blue-600" />
            <div className="text-xs text-gray-600">总曝光</div>
          </div>
          <div className="text-xl font-bold text-blue-700">{totalExposure.toLocaleString()}</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <MousePointerClick className="w-4 h-4 text-green-600" />
            <div className="text-xs text-gray-600">总点击</div>
          </div>
          <div className="text-xl font-bold text-green-700">{totalClick.toLocaleString()}</div>
          <div className="text-[10px] text-gray-500 mt-1">平均CTR: {avgCtr.toFixed(2)}%</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="w-4 h-4 text-purple-600" />
            <div className="text-xs text-gray-600">总转化</div>
          </div>
          <div className="text-xl font-bold text-purple-700">{totalConversion.toLocaleString()}</div>
          <div className="text-[10px] text-gray-500 mt-1">转化率: {avgConversionRate.toFixed(2)}%</div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <div className="text-xs text-gray-600">Query数</div>
          </div>
          <div className="text-xl font-bold text-orange-700">{queryData.length}</div>
        </div>
      </div>
      
      {/* Query 明细表格 */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <h4 className="text-sm font-bold text-gray-800">Query 分析明细</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Query</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">对应页面</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">曝光</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">点击</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">CTR</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">转化</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">转化率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {queryData.map((q, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{q.query}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{q.page}</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-700">{q.exposure.toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-700">{q.click.toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-right">
                    <span className={`font-semibold ${q.ctr >= avgCtr ? 'text-green-600' : 'text-red-600'}`}>
                      {q.ctr.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-gray-700">{q.conversion.toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-right">
                    <span className={`font-semibold ${q.conversionRate >= avgConversionRate ? 'text-green-600' : 'text-red-600'}`}>
                      {q.conversionRate.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

