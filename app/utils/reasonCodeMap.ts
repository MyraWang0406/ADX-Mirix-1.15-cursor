// REJECT 原因代码到通俗易懂的中文映射（新手友好）
export const reasonCodeMap: Record<string, string> = {
  'LATENCY_TIMEOUT': '服务器响应太慢',
  'SIZE_MISMATCH': '图片尺寸对不上',
  'IN_BLACKLIST': '设备被拉黑',
  'BID_BELOW_FLOOR': '出价太低被挡',
  'CREATIVE_MISMATCH': '素材不合规',
  'FLOOR_PRICE_HIGH': '出价太低被挡',
  'ALL_FILTERS_PASSED': '通过',
  'REQUEST_ACCEPTED': '请求已接受',
  'REJECTED': '已拒绝',
  'AUCTION_FAILED': '竞价失败',
  'AUCTION_WON': '竞价成功',
  'BID_ABOVE_FLOOR': '出价高于底价',
  'CREATIVE_COMPLIANT': '素材合规',
  'LATENCY_OK': '延迟正常',
  'SKAN_4.0_PCVR_ESTIMATED': 'SKAN 4.0 转化率预估',
  'SKAN_PCVR_ESTIMATED': 'SKAN 转化率预估'
}

export function translateReasonCode(code: string): string {
  return reasonCodeMap[code] || code
}
