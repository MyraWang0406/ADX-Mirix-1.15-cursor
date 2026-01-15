"""
数据模型定义 - WhiteboxTrace 数据类
"""
from dataclasses import dataclass, field
from typing import Dict, Optional, List
import json


@dataclass
class WhiteboxTrace:
    """白盒追踪记录数据类"""
    request_id: str
    timestamp: str
    node: str
    action: str
    decision: str
    reason_code: str
    internal_variables: Dict
    reasoning: str
    pCTR: Optional[float] = None
    pCVR: Optional[float] = None
    eCPM: Optional[float] = None
    latency_ms: Optional[float] = None
    second_best_bid: Optional[float] = None
    actual_paid_price: Optional[float] = None
    saved_amount: Optional[float] = None
    # SKAN 相关字段
    q_factor: Optional[float] = None
    quality_details: Optional[Dict] = None
    original_ecpm: Optional[float] = None
    # 全域流量分配相关字段
    ev_search: Optional[float] = None  # 搜索推荐预期价值
    ev_push: Optional[float] = None  # Push权益预期价值
    v_total: Optional[float] = None  # 全域总价值
    selected_path: Optional[str] = None  # 选择的路径：ads/search/push
    user_touch_history: Optional[List[Dict]] = None  # 用户触达历史
    attribution_channels: Optional[List[str]] = None  # 归因渠道列表
    # 全域流量价值决策相关字段
    traffic_channel: Optional[str] = None  # 流量渠道
    attribution_cost: Optional[float] = None  # 归因成本
    attribution_confidence: Optional[float] = None  # 归因置信度
    user_ltv: Optional[float] = None  # 用户生命周期价值
    lifecycle_stage: Optional[str] = None  # 生命周期阶段
    distribution_outlet: Optional[str] = None  # 分发出口
    
    def to_log_line(self) -> str:
        """转换为 JSON 日志行"""
        data = {
            'request_id': self.request_id,
            'timestamp': self.timestamp,
            'node': self.node,
            'action': self.action,
            'decision': self.decision,
            'reason_code': self.reason_code,
            'internal_variables': self.internal_variables,
            'reasoning': self.reasoning,
        }
        
        # 只添加非 None 的字段
        if self.pCTR is not None:
            data['pCTR'] = self.pCTR
        if self.pCVR is not None:
            data['pCVR'] = self.pCVR
        if self.eCPM is not None:
            data['eCPM'] = self.eCPM
        if self.latency_ms is not None:
            data['latency_ms'] = self.latency_ms
        if self.second_best_bid is not None:
            data['second_best_bid'] = self.second_best_bid
        if self.actual_paid_price is not None:
            data['actual_paid_price'] = self.actual_paid_price
        if self.saved_amount is not None:
            data['saved_amount'] = self.saved_amount
        if self.q_factor is not None:
            data['q_factor'] = self.q_factor
        if self.quality_details is not None:
            data['quality_details'] = self.quality_details
        if self.original_ecpm is not None:
            data['original_ecpm'] = self.original_ecpm
        if self.ev_search is not None:
            data['ev_search'] = self.ev_search
        if self.ev_push is not None:
            data['ev_push'] = self.ev_push
        if self.v_total is not None:
            data['v_total'] = self.v_total
        if self.selected_path is not None:
            data['selected_path'] = self.selected_path
        if self.user_touch_history is not None:
            data['user_touch_history'] = self.user_touch_history
        if self.attribution_channels is not None:
            data['attribution_channels'] = self.attribution_channels
        if self.traffic_channel is not None:
            data['traffic_channel'] = self.traffic_channel
        if self.attribution_cost is not None:
            data['attribution_cost'] = self.attribution_cost
        if self.attribution_confidence is not None:
            data['attribution_confidence'] = self.attribution_confidence
        if self.user_ltv is not None:
            data['user_ltv'] = self.user_ltv
        if self.lifecycle_stage is not None:
            data['lifecycle_stage'] = self.lifecycle_stage
        if self.distribution_outlet is not None:
            data['distribution_outlet'] = self.distribution_outlet
        
        return json.dumps(data, ensure_ascii=False)
