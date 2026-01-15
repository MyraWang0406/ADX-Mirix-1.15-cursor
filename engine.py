"""
白盒化广告交易引擎
实现 SSP/ADX/DSP 的核心逻辑，并在每个决策点注入白盒日志
"""
import json
import logging
import random
import time
from datetime import datetime
from typing import Dict, Optional, List, Tuple
from dataclasses import asdict
from schemas import WhiteboxTrace
from traffic_source import TrafficSource
from search_recommendation import SearchRecommendationEngine
from distribution_hub import DistributionHub


class WhiteboxLogger:
    """白盒日志记录器"""
    
    def __init__(self, log_file: str = "whitebox.log"):
        self.log_file = log_file
        # 确保日志文件存在并清空（或追加模式）
        with open(self.log_file, 'w', encoding='utf-8') as f:
            f.write("")  # 清空文件
    
    def log(self, trace: WhiteboxTrace):
        """写入一条白盒追踪记录"""
        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(trace.to_log_line() + '\n')
    
    def log_decision(self, request_id: str, node: str, action: str, 
                     decision: str, reason_code: str, 
                     internal_variables: Dict, reasoning: str,
                     pctr: Optional[float] = None,
                     pcvr: Optional[float] = None,
                     ecpm: Optional[float] = None,
                     latency_ms: Optional[float] = None,
                     second_best_bid: Optional[float] = None,
                     actual_paid_price: Optional[float] = None,
                     saved_amount: Optional[float] = None):
        """便捷方法：记录决策点"""
        trace = WhiteboxTrace(
            request_id=request_id,
            timestamp=datetime.now().isoformat(),
            node=node,
            action=action,
            decision=decision,
            reason_code=reason_code,
            internal_variables=internal_variables,
            reasoning=reasoning,
            pCTR=pctr,
            pCVR=pcvr,
            eCPM=ecpm,
            latency_ms=latency_ms,
            second_best_bid=second_best_bid,
            actual_paid_price=actual_paid_price,
            saved_amount=saved_amount
        )
        self.log(trace)


class FilterRule:
    """过滤规则基类 - 可扩展的过滤策略"""
    
    def __init__(self, name: str, logger: WhiteboxLogger):
        self.name = name
        self.logger = logger
    
    def apply(self, request_id: str, ad_request: Dict) -> Tuple[bool, str, Dict]:
        """
        应用过滤规则
        返回: (是否通过, 原因代码, 内部变量快照)
        """
        raise NotImplementedError("子类必须实现 apply 方法")


class FloorPriceFilter(FilterRule):
    """底价过滤规则"""
    
    def __init__(self, floor_price: float, logger: WhiteboxLogger):
        super().__init__("FloorPriceFilter", logger)
        self.floor_price = floor_price
    
    def apply(self, request_id: str, ad_request: Dict) -> Tuple[bool, str, Dict]:
        bid_price = ad_request.get('bid_price', 0)
        internal_vars = {
            'bid_price': bid_price,
            'floor_price': self.floor_price,
            'filter_name': self.name
        }
        
        if bid_price >= self.floor_price:
            self.logger.log_decision(
                request_id=request_id,
                node="ADX",
                action="FLOOR_PRICE_CHECK",
                decision="PASS",
                reason_code="BID_ABOVE_FLOOR",
                internal_variables=internal_vars,
                reasoning=f"出价 {bid_price} 高于底价 {self.floor_price}，通过底价过滤"
            )
            return True, "BID_ABOVE_FLOOR", internal_vars
        else:
            self.logger.log_decision(
                request_id=request_id,
                node="ADX",
                action="FLOOR_PRICE_CHECK",
                decision="REJECT",
                reason_code="BID_BELOW_FLOOR",
                internal_variables=internal_vars,
                reasoning=f"出价 {bid_price} 低于底价 {self.floor_price}，被底价过滤拒绝"
            )
            return False, "BID_BELOW_FLOOR", internal_vars


class BlacklistFilter(FilterRule):
    """黑名单过滤规则"""
    
    def __init__(self, blacklist: List[str], logger: WhiteboxLogger):
        super().__init__("BlacklistFilter", logger)
        self.blacklist = set(blacklist)
    
    def apply(self, request_id: str, ad_request: Dict) -> Tuple[bool, str, Dict]:
        device_id = ad_request.get('device_id', '')
        app_id = ad_request.get('app_id', '')
        internal_vars = {
            'device_id': device_id,
            'app_id': app_id,
            'blacklist': list(self.blacklist),
            'filter_name': self.name
        }
        
        if device_id in self.blacklist or app_id in self.blacklist:
            self.logger.log_decision(
                request_id=request_id,
                node="ADX",
                action="BLACKLIST_CHECK",
                decision="REJECT",
                reason_code="IN_BLACKLIST",
                internal_variables=internal_vars,
                reasoning=f"设备 {device_id} 或应用 {app_id} 在黑名单中，拒绝请求"
            )
            return False, "IN_BLACKLIST", internal_vars
        else:
            self.logger.log_decision(
                request_id=request_id,
                node="ADX",
                action="BLACKLIST_CHECK",
                decision="PASS",
                reason_code="NOT_IN_BLACKLIST",
                internal_variables=internal_vars,
                reasoning=f"设备 {device_id} 和应用 {app_id} 不在黑名单中，通过检查"
            )
            return True, "NOT_IN_BLACKLIST", internal_vars


class SizeMatchFilter(FilterRule):
    """尺寸匹配过滤规则"""
    
    def __init__(self, required_size: tuple, logger: WhiteboxLogger):
        super().__init__("SizeMatchFilter", logger)
        self.required_size = required_size
    
    def apply(self, request_id: str, ad_request: Dict) -> Tuple[bool, str, Dict]:
        ad_size = ad_request.get('ad_size', (0, 0))
        internal_vars = {
            'ad_size': ad_size,
            'required_size': self.required_size,
            'filter_name': self.name
        }
        
        if ad_size == self.required_size:
            self.logger.log_decision(
                request_id=request_id,
                node="ADX",
                action="SIZE_MATCH_CHECK",
                decision="PASS",
                reason_code="SIZE_MATCHED",
                internal_variables=internal_vars,
                reasoning=f"广告尺寸 {ad_size} 匹配要求尺寸 {self.required_size}"
            )
            return True, "SIZE_MATCHED", internal_vars
        else:
            self.logger.log_decision(
                request_id=request_id,
                node="ADX",
                action="SIZE_MATCH_CHECK",
                decision="REJECT",
                reason_code="SIZE_MISMATCH",
                internal_variables=internal_vars,
                reasoning=f"广告尺寸 {ad_size} 不匹配要求尺寸 {self.required_size}"
            )
            return False, "SIZE_MISMATCH", internal_vars


class LatencyTimeoutFilter(FilterRule):
    """延迟超时过滤规则"""
    
    def __init__(self, max_latency_ms: int, logger: WhiteboxLogger):
        super().__init__("LatencyTimeoutFilter", logger)
        self.max_latency_ms = max_latency_ms
    
    def apply(self, request_id: str, ad_request: Dict) -> Tuple[bool, str, Dict]:
        # 模拟处理延迟（实际应该从请求开始时间计算）
        latency_ms = random.randint(10, 150)  # 模拟 10-150ms 延迟
        internal_vars = {
            'latency_ms': latency_ms,
            'max_latency_ms': self.max_latency_ms,
            'filter_name': self.name
        }
        
        if latency_ms <= self.max_latency_ms:
            self.logger.log_decision(
                request_id=request_id,
                node="ADX",
                action="LATENCY_CHECK",
                decision="PASS",
                reason_code="LATENCY_OK",
                internal_variables=internal_vars,
                reasoning=f"响应延迟 {latency_ms}ms 在允许范围内（≤{self.max_latency_ms}ms）"
            )
            return True, "LATENCY_OK", internal_vars
        else:
            # 延迟超时：需要计算潜在损失（potential_loss）
            # 注意：此时还没有出价，所以需要从请求中获取预估信息
            potential_loss = 0.0
            potential_ecpm = 0.0
            
            # 尝试从请求中获取预估 eCPM（如果有 DSP 预出价信息）
            if 'estimated_ecpm' in ad_request:
                potential_ecpm = ad_request['estimated_ecpm']
                potential_loss = potential_ecpm
            else:
                # 如果没有预估信息，使用默认值（基于平均 eCPM 估算）
                # 假设平均出价 0.5，pCTR 2%，pCVR 5%，q_factor 1.0
                avg_bid = 0.5
                avg_pctr = 0.02
                avg_pcvr = 0.05
                avg_q_factor = 1.0
                potential_ecpm = avg_bid * avg_pctr * avg_pcvr * avg_q_factor * 1000
                # 如果计算结果为 0，使用最小非零值
                if potential_ecpm == 0.0:
                    potential_ecpm = 0.5  # 最小非零 eCPM 值
                potential_loss = potential_ecpm
            
            # 强制确保 potential_loss 不为 0
            if potential_loss == 0.0:
                potential_loss = 0.5  # 最小非零值
            if potential_ecpm == 0.0:
                potential_ecpm = 0.5  # 最小非零值
            
            internal_vars.update({
                'potential_loss': potential_loss,
                'highest_potential_ecpm_loss': potential_ecpm,
                'max_potential_ecpm': potential_ecpm
            })
            
            self.logger.log_decision(
                request_id=request_id,
                node="ADX",
                action="LATENCY_CHECK",
                decision="REJECT",
                reason_code="LATENCY_TIMEOUT",
                internal_variables=internal_vars,
                reasoning=f"响应延迟 {latency_ms}ms 超过阈值 {self.max_latency_ms}ms，请求超时，潜在 eCPM 损失：{potential_ecpm:.4f}"
            )
            return False, "LATENCY_TIMEOUT", internal_vars


class CreativeMismatchFilter(FilterRule):
    """素材合规性过滤规则"""
    
    def __init__(self, logger: WhiteboxLogger, rejection_rate: float = 0.1):
        super().__init__("CreativeMismatchFilter", logger)
        self.rejection_rate = rejection_rate  # 10% 的素材不合规率
    
    def apply(self, request_id: str, ad_request: Dict) -> Tuple[bool, str, Dict]:
        # 模拟素材合规性检查
        is_compliant = random.random() > self.rejection_rate
        internal_vars = {
            'is_compliant': is_compliant,
            'rejection_rate': self.rejection_rate,
            'filter_name': self.name
        }
        
        if is_compliant:
            self.logger.log_decision(
                request_id=request_id,
                node="ADX",
                action="CREATIVE_COMPLIANCE_CHECK",
                decision="PASS",
                reason_code="CREATIVE_COMPLIANT",
                internal_variables=internal_vars,
                reasoning="素材通过合规性检查"
            )
            return True, "CREATIVE_COMPLIANT", internal_vars
        else:
            # 素材不合规：计算潜在损失
            potential_loss = 0.0
            potential_ecpm = 0.0
            
            # 尝试从请求中获取预估 eCPM
            if 'estimated_ecpm' in ad_request:
                potential_ecpm = ad_request['estimated_ecpm']
                potential_loss = potential_ecpm
            else:
                # 使用默认估算
                avg_bid = 0.5
                avg_pctr = 0.02
                avg_pcvr = 0.05
                avg_q_factor = 1.0
                potential_ecpm = avg_bid * avg_pctr * avg_pcvr * avg_q_factor * 1000
                # 如果计算结果为 0，使用最小非零值
                if potential_ecpm == 0.0:
                    potential_ecpm = 0.5  # 最小非零 eCPM 值
                potential_loss = potential_ecpm
            
            # 强制确保 potential_loss 不为 0
            if potential_loss == 0.0:
                potential_loss = 0.5  # 最小非零值
            if potential_ecpm == 0.0:
                potential_ecpm = 0.5  # 最小非零值
            
            internal_vars.update({
                'potential_loss': potential_loss,
                'highest_potential_ecpm_loss': potential_ecpm,
                'max_potential_ecpm': potential_ecpm
            })
            
            self.logger.log_decision(
                request_id=request_id,
                node="ADX",
                action="CREATIVE_COMPLIANCE_CHECK",
                decision="REJECT",
                reason_code="CREATIVE_MISMATCH",
                internal_variables=internal_vars,
                reasoning=f"素材不合规，被拒绝（可能包含违规内容、尺寸不符等），潜在 eCPM 损失：{potential_ecpm:.4f}"
            )
            return False, "CREATIVE_MISMATCH", internal_vars


class FloorPriceHighFilter(FilterRule):
    """底价过高过滤规则（用于损耗分析）"""
    
    def __init__(self, floor_price: float, logger: WhiteboxLogger):
        super().__init__("FloorPriceHighFilter", logger)
        self.floor_price = floor_price
    
    def apply(self, request_id: str, ad_request: Dict) -> Tuple[bool, str, Dict]:
        bid_price = ad_request.get('bid_price', 0)
        internal_vars = {
            'bid_price': bid_price,
            'floor_price': self.floor_price,
            'price_gap': self.floor_price - bid_price if bid_price < self.floor_price else 0,
            'filter_name': self.name
        }
        
        if bid_price >= self.floor_price:
            return True, "BID_ABOVE_FLOOR", internal_vars
        else:
            # 记录底价过高的损耗
            self.logger.log_decision(
                request_id=request_id,
                node="ADX",
                action="FLOOR_PRICE_HIGH_CHECK",
                decision="REJECT",
                reason_code="FLOOR_PRICE_HIGH",
                internal_variables=internal_vars,
                reasoning=f"出价 {bid_price} 低于底价 {self.floor_price}，底价设置可能过高，导致 {internal_vars['price_gap']:.4f} 的潜在收入损失"
            )
            return False, "FLOOR_PRICE_HIGH", internal_vars


class QualityScorer:
    """流量质量评分器 - 反欺诈检测"""
    
    def __init__(self, logger: WhiteboxLogger, fraud_rate: float = 0.15):
        """
        初始化质量评分器
        - fraud_rate: 作弊流量比例，默认 15%
        """
        self.logger = logger
        self.fraud_rate = fraud_rate
        # 模拟 IP 池（用于检测 IP 异常集中）
        self.ip_pool = {}
        # 模拟点击坐标历史（用于检测坐标固定）
        self.click_coordinates = {}
    
    def score(self, request_id: str, ad_request: Dict) -> Tuple[float, Dict]:
        """
        对流量进行质量评分
        返回: (质量系数 q_factor (0.0-1.0), 评分详情)
        """
        device_id = ad_request.get('device_id', '')
        app_id = ad_request.get('app_id', '')
        
        # 模拟 IP 地址（实际应从请求中获取）
        ip_address = f"192.168.{random.randint(1, 10)}.{random.randint(1, 255)}"
        
        # 模拟点击坐标（实际应从点击事件中获取）
        click_x = random.randint(0, 1080)
        click_y = random.randint(0, 1920)
        
        fraud_features = []
        q_factor = 1.0
        
        # 特征 1: IP 异常集中检测
        # 模拟：如果该 IP 在短时间内出现次数过多，标记为异常
        if ip_address not in self.ip_pool:
            self.ip_pool[ip_address] = []
        self.ip_pool[ip_address].append(datetime.now())
        
        # 清理 5 分钟前的记录
        five_min_ago = datetime.now().timestamp() - 300
        self.ip_pool[ip_address] = [
            ts for ts in self.ip_pool[ip_address] 
            if ts.timestamp() > five_min_ago
        ]
        
        # 如果同一 IP 在 5 分钟内出现超过 10 次，标记为异常
        if len(self.ip_pool[ip_address]) > 10:
            fraud_features.append("IP异常集中")
            q_factor *= 0.5  # IP 异常集中，质量系数降低 50%
        
        # 特征 2: 点击坐标固定检测
        # 模拟：如果点击坐标过于固定（方差很小），标记为异常
        coordinate_key = f"{device_id}_{app_id}"
        if coordinate_key not in self.click_coordinates:
            self.click_coordinates[coordinate_key] = []
        
        self.click_coordinates[coordinate_key].append((click_x, click_y))
        
        # 只保留最近 20 次点击记录
        if len(self.click_coordinates[coordinate_key]) > 20:
            self.click_coordinates[coordinate_key] = self.click_coordinates[coordinate_key][-20:]
        
        # 如果坐标方差过小（点击位置过于固定），标记为异常
        if len(self.click_coordinates[coordinate_key]) >= 5:
            coords = self.click_coordinates[coordinate_key]
            x_coords = [c[0] for c in coords]
            y_coords = [c[1] for c in coords]
            
            # 计算坐标方差
            x_mean = sum(x_coords) / len(x_coords)
            y_mean = sum(y_coords) / len(y_coords)
            x_variance = sum((x - x_mean) ** 2 for x in x_coords) / len(x_coords)
            y_variance = sum((y - y_mean) ** 2 for y in y_coords) / len(y_coords)
            
            # 如果 X 或 Y 坐标方差小于 100（点击位置过于集中），标记为异常
            if x_variance < 100 or y_variance < 100:
                fraud_features.append("点击坐标固定")
                q_factor *= 0.6  # 点击坐标固定，质量系数降低 40%
        
        # 随机模拟其他作弊特征（用于演示）
        if random.random() < self.fraud_rate:
            if "IP异常集中" not in fraud_features and "点击坐标固定" not in fraud_features:
                # 随机选择一种作弊特征
                fraud_type = random.choice(["设备指纹异常", "行为模式异常", "时间分布异常"])
                fraud_features.append(fraud_type)
                q_factor *= random.uniform(0.3, 0.7)  # 随机降低质量系数
        
        # 确保 q_factor 在 [0.0, 1.0] 范围内
        q_factor = max(0.0, min(1.0, q_factor))
        
        score_details = {
            'q_factor': q_factor,
            'fraud_features': fraud_features,
            'ip_address': ip_address,
            'click_coordinates': (click_x, click_y),
            'quality_score': q_factor,
            'is_high_risk': q_factor < 0.5
        }
        
        # 记录质量评分结果
        self.logger.log_decision(
            request_id=request_id,
            node="ADX",
            action="QUALITY_SCORE",
            decision="PASS" if q_factor >= 0.5 else "WARNING",
            reason_code="QUALITY_SCORED",
            internal_variables=score_details,
            reasoning=f"流量质量评分：q_factor={q_factor:.2f}，检测到特征：{', '.join(fraud_features) if fraud_features else '无异常'}"
        )
        
        return q_factor, score_details


class BiddingStrategy:
    """出价策略基类 - 可扩展的出价算法"""
    
    def __init__(self, name: str, logger: WhiteboxLogger):
        self.name = name
        self.logger = logger
    
    def calculate_bid(self, request_id: str, ad_request: Dict) -> Tuple[float, Dict, str]:
        """
        计算出价
        返回: (出价金额, 内部变量快照, 推理说明)
        """
        raise NotImplementedError("子类必须实现 calculate_bid 方法")


class CTRBasedBiddingStrategy(BiddingStrategy):
    """基于 CTR 的出价策略：Bid = Base * CTR_Score * Multiplier"""
    
    def __init__(self, base_price: float, logger: WhiteboxLogger):
        super().__init__("CTRBasedBidding", logger)
        self.base_price = base_price
    
    def _get_multiplier(self, ad_request: Dict) -> Tuple[float, str]:
        """计算乘数因子"""
        platform = ad_request.get('platform', '').upper()
        hour = datetime.now().hour
        
        multiplier = 1.0
        reasons = []
        
        # iOS 平台加成
        if platform == 'IOS':
            multiplier *= 1.2
            reasons.append("iOS 平台加成 1.2")
        
        # 黄金时段加成 (9-11, 19-22)
        if (9 <= hour <= 11) or (19 <= hour <= 22):
            multiplier *= 1.15
            reasons.append(f"黄金时段({hour}点)加成 1.15")
        
        reasoning = "；".join(reasons) if reasons else "无特殊加成，使用基础乘数 1.0"
        return multiplier, reasoning
    
    def calculate_bid(self, request_id: str, ad_request: Dict) -> Tuple[float, Dict, str]:
        """计算最终出价"""
        ctr_score = ad_request.get('ctr_score', 0.5)
        multiplier, multiplier_reason = self._get_multiplier(ad_request)
        
        final_bid = self.base_price * ctr_score * multiplier
        
        internal_vars = {
            'base_price': self.base_price,
            'ctr_score': ctr_score,
            'multiplier': multiplier,
            'final_bid': final_bid,
            'platform': ad_request.get('platform', ''),
            'hour': datetime.now().hour,
            'strategy_name': self.name
        }
        
        reasoning = f"基础价 {self.base_price} × CTR得分 {ctr_score} × 乘数 {multiplier} = {final_bid}。{multiplier_reason}"
        
        self.logger.log_decision(
            request_id=request_id,
            node="DSP",
            action="BID_CALCULATION",
            decision="PASS",
            reason_code="BID_CALCULATED",
            internal_variables=internal_vars,
            reasoning=reasoning
        )
        
        return final_bid, internal_vars, reasoning


class SKANOptimizer:
    """SKAN (SKAdNetwork) 概率优化器 - 处理隐私受限环境下的延迟归因"""
    
    def __init__(self, logger: WhiteboxLogger):
        self.logger = logger
        # 历史转化值分布（用于概率预估）
        # 格式：{conversion_value: probability}
        self.historical_conversion_distribution = self._initialize_conversion_distribution()
        # 转化值到业务价值的映射（0-63）
        self.conversion_value_mapping = self._initialize_conversion_mapping()
    
    def _initialize_conversion_distribution(self) -> Dict[int, float]:
        """初始化历史转化值分布（模拟数据）"""
        # 模拟：高转化值（40-63）概率较低，低转化值（0-20）概率较高
        distribution = {}
        total_prob = 0.0
        
        # 低转化值（0-20）：60% 概率
        for i in range(21):
            prob = 0.6 / 21 * (1 - i / 21 * 0.5)  # 递减分布
            distribution[i] = prob
            total_prob += prob
        
        # 中转化值（21-40）：30% 概率
        for i in range(21, 41):
            prob = 0.3 / 20 * (1 - (i - 21) / 20 * 0.3)
            distribution[i] = prob
            total_prob += prob
        
        # 高转化值（41-63）：10% 概率
        for i in range(41, 64):
            prob = 0.1 / 23 * (1 - (i - 41) / 23 * 0.2)
            distribution[i] = prob
            total_prob += prob
        
        # 归一化
        for key in distribution:
            distribution[key] /= total_prob
        
        return distribution
    
    def _initialize_conversion_mapping(self) -> Dict[int, float]:
        """初始化转化值到业务价值的映射（0-63）"""
        mapping = {}
        # 线性映射：0 -> $0, 63 -> $10
        for i in range(64):
            mapping[i] = i / 63.0 * 10.0
        return mapping
    
    def estimate_pcvr_from_skan(self, request_id: str, ad_request: Dict) -> Tuple[float, Dict]:
        """
        基于 SKAN 4.0 历史转化值分布概率，预估实时 pCVR
        SKAN 4.0 特性：
        - 延迟归因：postback 延迟 24-48 小时
        - Conversion Value：0-63 离散值
        - 数据模糊：实时转化数据不可见，需基于历史概率模型预估
        返回: (预估 pCVR, 优化详情)
        """
        platform = ad_request.get('platform', '').upper()
        
        # 仅对 iOS 流量应用 SKAN 4.0 优化
        if platform != 'IOS':
            return None, {}
        
        # SKAN 4.0：模拟生成转化值（0-63）
        # 实际场景：转化值在 postback 延迟后才可获得，这里基于历史分布概率模拟
        conversion_value = self._sample_conversion_value()
        business_value = self.conversion_value_mapping.get(conversion_value, 0)
        
        # 基于转化值预估 pCVR（SKAN 4.0 概率模型）
        # 高转化值（40-63）-> 高 pCVR，低转化值（0-20）-> 低 pCVR
        # 基础 pCVR 范围：1% - 10%
        base_pcvr = 0.01 + (conversion_value / 63.0) * 0.09
        
        # 应用历史分布概率调整（核心：数据模糊情况下的概率补偿）
        historical_prob = self.historical_conversion_distribution.get(conversion_value, 0.01)
        # 信心度计算：基于历史出现频率，转换为 0-1 的信心度
        # 高频率转化值 -> 高信心度（85%+），低频率转化值 -> 低信心度（60%-）
        confidence = min(1.0, max(0.6, historical_prob * 15))  # 信心度范围：60%-100%
        
        # SKAN 4.0 概率调整后的 pCVR（考虑数据模糊的不确定性）
        # 公式：adjusted_pcvr = base_pcvr × (0.7 + confidence × 0.3)
        # 当信心度低时，pCVR 向下调整；当信心度高时，pCVR 向上调整
        adjusted_pcvr = base_pcvr * (0.7 + confidence * 0.3)
        
        # SKAN 4.0 延迟归因：模拟 postback 延迟（24h - 48h）
        postback_delay_hours = random.uniform(24, 48)
        postback_delay_seconds = postback_delay_hours * 3600
        
        optimization_details = {
            'conversion_value': conversion_value,
            'business_value': business_value,
            'base_pcvr': base_pcvr,
            'adjusted_pcvr': adjusted_pcvr,
            'confidence': confidence,
            'postback_delay_hours': postback_delay_hours,
            'postback_delay_seconds': postback_delay_seconds,
            'historical_prob': historical_prob,
            'is_skan_optimized': True,
            'skan_version': '4.0',
            'attribution_delayed': True,  # 标记为延迟归因
            'data_blurred': True  # 标记为数据模糊（实时转化数据不可见）
        }
        
        # 记录 SKAN 4.0 优化结果（白盒化归因逻辑）
        self.logger.log_decision(
            request_id=request_id,
            node="ADX",
            action="SKAN_OPTIMIZATION",
            decision="PASS",
            reason_code="SKAN_4.0_PCVR_ESTIMATED",
            internal_variables=optimization_details,
            reasoning=f"SKAN 4.0 概率优化：转化值 {conversion_value}/63，业务价值 ${business_value:.2f}，基础 pCVR {base_pcvr*100:.2f}%，调整后 pCVR {adjusted_pcvr*100:.2f}%，预测信心度 {confidence*100:.1f}%，postback 延迟 {postback_delay_hours:.1f} 小时（数据模糊环境，基于历史概率模型预估）"
        )
        
        return adjusted_pcvr, optimization_details
    
    def _sample_conversion_value(self) -> int:
        """根据历史分布概率采样转化值"""
        rand = random.random()
        cumulative = 0.0
        for value, prob in sorted(self.historical_conversion_distribution.items()):
            cumulative += prob
            if rand <= cumulative:
                return value
        return 31  # 默认返回中值
    
    def update_conversion_distribution(self, conversion_value: int, weight: float = 0.1):
        """更新历史转化值分布（用于在线学习）"""
        if conversion_value not in self.historical_conversion_distribution:
            return
        
        # 指数移动平均更新
        old_prob = self.historical_conversion_distribution[conversion_value]
        new_prob = old_prob * (1 - weight) + weight
        self.historical_conversion_distribution[conversion_value] = new_prob
        
        # 归一化
        total = sum(self.historical_conversion_distribution.values())
        for key in self.historical_conversion_distribution:
            self.historical_conversion_distribution[key] /= total


class InternalOpportunityManager:
    """内部机会管理器 - 模拟搜推和Push权益触达的预期价值"""
    
    def __init__(self, logger: WhiteboxLogger):
        self.logger = logger
        # 用户触达历史存储（模拟）
        self.user_touch_history: Dict[str, List[Dict]] = {}
    
    def get_user_touch_history(self, device_id: str) -> List[Dict]:
        """获取用户触达历史"""
        return self.user_touch_history.get(device_id, [])
    
    def add_touch(self, device_id: str, channel: str, touch_type: str, value: float):
        """记录用户触达"""
        if device_id not in self.user_touch_history:
            self.user_touch_history[device_id] = []
        
        self.user_touch_history[device_id].append({
            'channel': channel,
            'type': touch_type,
            'value': value,
            'timestamp': datetime.now().isoformat()
        })
        
        # 只保留最近10条记录
        if len(self.user_touch_history[device_id]) > 10:
            self.user_touch_history[device_id] = self.user_touch_history[device_id][-10:]
    
    def estimate_search_value(self, device_id: str, ad_request: Dict) -> Tuple[float, Dict]:
        """
        估算搜索推荐引导的预期价值 (EV_search)
        基于用户历史行为、搜索意图强度等
        """
        touch_history = self.get_user_touch_history(device_id)
        
        # 计算搜索意图强度（基于历史触达）
        search_intent = 0.5  # 默认值
        if touch_history:
            search_touches = [t for t in touch_history if t['channel'] == 'search']
            if search_touches:
                # 如果用户有搜索历史，提升意图强度
                search_intent = min(1.0, 0.5 + len(search_touches) * 0.1)
        
        # 模拟搜索推荐价值（$0.5 - $3.0）
        base_value = random.uniform(0.5, 3.0)
        ev_search = base_value * search_intent
        
        # 如果用户从B站等外部渠道来，提升搜索价值
        app_id = ad_request.get('app_id', '').lower()
        if 'bilibili' in app_id or 'b站' in app_id:
            ev_search *= 1.3  # B站用户搜索转化潜力高
        
        details = {
            'search_intent': search_intent,
            'base_value': base_value,
            'ev_search': ev_search,
            'touch_history_count': len(touch_history)
        }
        
        return ev_search, details
    
    def estimate_push_value(self, device_id: str, ad_request: Dict) -> Tuple[float, Dict]:
        """
        估算Push权益触达的预期价值 (EV_push)
        基于用户活跃度、优惠券敏感度等
        """
        touch_history = self.get_user_touch_history(device_id)
        
        # 计算用户活跃度
        recent_touches = [t for t in touch_history 
                         if (datetime.now() - datetime.fromisoformat(t['timestamp'])).total_seconds() < 3600]
        activity_level = min(1.0, len(recent_touches) * 0.2)
        
        # 计算广告疲劳度（如果用户最近看到很多广告，疲劳度高）
        ad_touches = [t for t in touch_history if t['type'] == 'ad_view']
        fatigue_level = min(1.0, len(ad_touches) * 0.15)
        
        # Push价值 = 基础价值 × 活跃度 × (1 - 疲劳度)
        base_value = random.uniform(0.3, 2.5)
        ev_push = base_value * (0.5 + activity_level * 0.5) * (1 - fatigue_level * 0.5)
        
        # 如果用户对广告疲劳，Push价值提升
        if fatigue_level > 0.7:
            ev_push *= 1.5  # 广告疲劳时，Push触达更有效
        
        details = {
            'activity_level': activity_level,
            'fatigue_level': fatigue_level,
            'base_value': base_value,
            'ev_push': ev_push,
            'ad_touches_count': len(ad_touches)
        }
        
        return ev_push, details
    
    def calculate_total_value(self, ecpm_ads: float, ev_search: float, ev_push: float) -> Tuple[float, str]:
        """
        计算全域总价值：V_total = max(eCPM_ads, EV_search, EV_push)
        返回：总价值和选择的路径
        """
        values = {
            'ads': ecpm_ads,
            'search': ev_search,
            'push': ev_push
        }
        
        # 选择价值最高的路径
        selected_path = max(values.items(), key=lambda x: x[1])[0]
        v_total = values[selected_path]
        
        return v_total, selected_path
    
    def get_attribution_channels(self, device_id: str) -> List[str]:
        """获取用户归因渠道列表"""
        touch_history = self.get_user_touch_history(device_id)
        channels = list(set([t['channel'] for t in touch_history]))
        return channels


class SSP:
    """SSP (Supply-Side Platform) - 流量发起方"""
    
    def __init__(self, logger: WhiteboxLogger):
        self.logger = logger
    
    def generate_request(self, request_id: str, device_id: str, app_id: str, 
                        app_name: str, platform: str, ad_size: tuple) -> Dict:
        """生成广告请求"""
        # 生成处理延迟 (latency_ms): 50ms - 150ms
        latency_ms = random.uniform(50, 150)
        
        # 为 iOS 流量生成 postback 延迟（24h - 48h）
        postback_delay_hours = None
        postback_delay_seconds = None
        if platform.upper() == 'IOS':
            postback_delay_hours = random.uniform(24, 48)
            postback_delay_seconds = postback_delay_hours * 3600
        
        ad_request = {
            'request_id': request_id,
            'device_id': device_id,
            'app_id': app_id,
            'app_name': app_name,
            'platform': platform,
            'ad_size': ad_size,
            'latency_ms': latency_ms,  # 处理延迟
            'postback_delay_hours': postback_delay_hours,  # SKAN postback 延迟（仅 iOS）
            'postback_delay_seconds': postback_delay_seconds,  # SKAN postback 延迟（秒）
            'timestamp': datetime.now().isoformat()
        }
        
        reasoning = f"SSP 生成广告请求：设备 {device_id}，应用 {app_name} ({app_id})，平台 {platform}，尺寸 {ad_size}，处理延迟 {latency_ms:.1f}ms"
        if postback_delay_hours:
            reasoning += f"，SKAN postback 延迟 {postback_delay_hours:.1f} 小时"
        
        self.logger.log_decision(
            request_id=request_id,
            node="SSP",
            action="REQUEST_GENERATED",
            decision="PASS",
            reason_code="REQUEST_CREATED",
            internal_variables=ad_request.copy(),
            reasoning=reasoning,
            latency_ms=latency_ms
        )
        
        return ad_request


class ADX:
    """ADX (Ad Exchange) - 广告交易平台"""
    
    def __init__(self, logger: WhiteboxLogger, filters: List[FilterRule] = None, quality_scorer: Optional[QualityScorer] = None, skan_optimizer: Optional[SKANOptimizer] = None):
        self.logger = logger
        self.filters = filters or []
        self.quality_scorer = quality_scorer
        self.skan_optimizer = skan_optimizer
    
    def add_filter(self, filter_rule: FilterRule):
        """添加过滤规则"""
        self.filters.append(filter_rule)
    
    def process_request(self, ad_request: Dict) -> Tuple[bool, str]:
        """处理广告请求，应用所有过滤规则"""
        request_id = ad_request.get('request_id', 'unknown')
        
        self.logger.log_decision(
            request_id=request_id,
            node="ADX",
            action="REQUEST_RECEIVED",
            decision="PASS",
            reason_code="REQUEST_ACCEPTED",
            internal_variables=ad_request.copy(),
            reasoning=f"ADX 接收到来自 SSP 的广告请求"
        )
        
        # 依次应用所有过滤规则
        for filter_rule in self.filters:
            passed, reason_code, internal_vars = filter_rule.apply(request_id, ad_request)
            if not passed:
                self.logger.log_decision(
                    request_id=request_id,
                    node="ADX",
                    action="FINAL_DECISION",
                    decision="REJECT",
                    reason_code=reason_code,
                    internal_variables=internal_vars,
                    reasoning=f"请求被 {filter_rule.name} 拒绝，原因：{reason_code}"
                )
                return False, reason_code
        
        # 所有过滤通过
        self.logger.log_decision(
            request_id=request_id,
            node="ADX",
            action="FINAL_DECISION",
            decision="PASS",
            reason_code="ALL_FILTERS_PASSED",
            internal_variables={'filters_count': len(self.filters)},
            reasoning=f"所有 {len(self.filters)} 个过滤规则均通过，请求被接受"
        )
        
        return True, "ALL_FILTERS_PASSED"
    
    def run_auction(self, bids: List[Dict], request_id: str, ad_request: Optional[Dict] = None) -> Optional[Dict]:
        """
        运行竞价，实现 eCPM 排序和二价计费（Second Price Auction）
        调整后的 eCPM = bid_price * pCTR * pCVR * q_factor * 1000
        返回: 获胜者信息，包含实际支付价格（二价计费）
        """
        if not bids or len(bids) == 0:
            return None
        
        # 计算每个出价的调整后 eCPM（引入质量系数 q_factor）
        for bid in bids:
            bid_price = bid.get('bid_price', 0)
            pctr = bid.get('pctr', 0.001)
            pcvr = bid.get('pcvr', 0.01)
            
            # 获取质量系数 q_factor（如果启用了质量评分）
            q_factor = bid.get('q_factor', 1.0)
            if self.quality_scorer and ad_request:
                # 如果出价中没有 q_factor，则进行质量评分
                if 'q_factor' not in bid:
                    q_factor, quality_details = self.quality_scorer.score(request_id, ad_request)
                    bid['q_factor'] = q_factor
                    bid['quality_details'] = quality_details
                else:
                    q_factor = bid['q_factor']
            
            # 调整后的 eCPM 公式：Adjusted_eCPM = Bid × pCTR × pCVR × q_factor × 1000
            adjusted_ecpm = bid_price * pctr * pcvr * q_factor * 1000
            original_ecpm = bid_price * pctr * pcvr * 1000  # 原始 eCPM（用于对比）
            
            bid['ecpm'] = adjusted_ecpm
            bid['original_ecpm'] = original_ecpm  # 保存原始 eCPM
            bid['q_factor'] = q_factor
            bid['pctr'] = pctr
            bid['pcvr'] = pcvr
        
        # 按 eCPM 排序（降序）
        sorted_bids = sorted(bids, key=lambda x: x.get('ecpm', 0), reverse=True)
        
        if len(sorted_bids) == 0:
            return None
        
        winner = sorted_bids[0]
        winner_bid = winner.get('bid_price', 0)
        winner_pctr = winner.get('pctr', 0.001)
        winner_pcvr = winner.get('pcvr', 0.01)
        winner_ecpm = winner.get('ecpm', 0)
        
        # 二价计费（GSP）：计算实际支付价格
        if len(sorted_bids) > 1:
            # 有多个出价者，使用第二高的 eCPM 计算实际支付价格
            second_highest_ecpm = sorted_bids[1].get('ecpm', 0)
            # 公式：Actual_Paid_Price = (Second_Highest_eCPM + 0.01) / (1000 × Winner_pCTR × Winner_pCVR)
            actual_paid_price = (second_highest_ecpm + 0.01) / (1000 * winner_pctr * winner_pcvr)
            second_best_bid = sorted_bids[1].get('bid_price', 0)
        else:
            # 只有一个出价，按底价成交
            floor_price = winner.get('floor_price', 0.1)
            actual_paid_price = floor_price
            second_best_bid = floor_price
            second_highest_ecpm = 0
        
        # 确保实际支付价格不超过出价
        actual_paid_price = min(actual_paid_price, winner_bid)
        
        # 计算节省的金额（二价机制节省）
        # 强制确保 saved_amount 不为 0（当有多个出价时）
        saved_amount = max(0.0, winner_bid - actual_paid_price)
        
        # 如果只有一个出价，saved_amount 可能为 0，但我们需要确保有真实的节省数据
        # 在这种情况下，saved_amount 确实为 0（因为没有竞争）
        # 但如果有多个出价，saved_amount 应该 > 0
        
        return {
            'winner': winner,
            'winner_bid': winner_bid,  # 原始出价
            'winner_ecpm': winner_ecpm,
            'winner_pctr': winner_pctr,
            'winner_pcvr': winner_pcvr,
            'second_best_bid': second_best_bid,  # 第二名出价
            'second_highest_ecpm': second_highest_ecpm if len(sorted_bids) > 1 else 0,  # 第二名 eCPM
            'actual_paid_price': actual_paid_price,  # 实际支付价格（二价计费）
            'saved_amount': saved_amount,  # 节省金额 = Winner_Bid_Price - Actual_Paid_Price（强制 >= 0）
            'all_bids': sorted_bids,  # 包含所有出价信息（用于 AI 诊断）
            'original_ecpm': winner.get('original_ecpm', winner_ecpm),  # 原始 eCPM（未调整质量系数）
            'has_competition': len(sorted_bids) > 1  # 是否有竞争（用于判断 saved_amount 是否应该 > 0）
        }


class DSP:
    """DSP (Demand-Side Platform) - 需求方平台"""
    
    def __init__(self, logger: WhiteboxLogger, bidding_strategy: BiddingStrategy):
        self.logger = logger
        self.bidding_strategy = bidding_strategy
    
    def bid(self, ad_request: Dict, skan_optimizer: Optional[SKANOptimizer] = None) -> Optional[Dict]:
        """对广告请求进行出价"""
        request_id = ad_request.get('request_id', 'unknown')
        platform = ad_request.get('platform', '').upper()
        
        # 为每个 DSP 出价生成 pCTR (0.1% - 5%)
        pctr = random.uniform(0.001, 0.05)  # 0.1% - 5%
        
        # pCVR 生成：如果是 iOS 流量且启用了 SKAN 优化，使用 SKAN 概率模型
        pcvr = None
        skan_details = {}
        if platform == 'IOS' and skan_optimizer:
            pcvr, skan_details = skan_optimizer.estimate_pcvr_from_skan(request_id, ad_request)
            if pcvr is None:
                # 如果 SKAN 优化失败，回退到默认值
                pcvr = random.uniform(0.01, 0.10)
        else:
            # 非 iOS 流量或未启用 SKAN，使用默认随机值
            pcvr = random.uniform(0.01, 0.10)   # 1% - 10%
        
        ad_request['pctr'] = pctr
        ad_request['pcvr'] = pcvr
        
        # 将 pCTR 转换为 CTR 得分（归一化到 0-1）
        # pCTR 范围是 0.1%-5%，转换为 0.02-1.0 的得分
        ctr_score = min(pctr / 0.05, 1.0)  # 5% 对应 1.0
        
        # 根据平台和时段进行微调
        platform = ad_request.get('platform', '').upper()
        hour = datetime.now().hour
        
        if platform == 'IOS':
            ctr_score *= 1.1
        elif platform == 'ANDROID':
            ctr_score *= 1.0
        else:
            ctr_score *= 0.9
        
        # 时段调整
        if (9 <= hour <= 11) or (19 <= hour <= 22):
            ctr_score *= 1.05
        
        ad_request['ctr_score'] = ctr_score
        
        # 构建内部变量（包含 SKAN 信息）
        internal_vars = {
            'ctr_score': ctr_score,
            'pctr': pctr,
            'pcvr': pcvr,
            'platform': platform,
            'hour': hour
        }
        
        # 如果使用了 SKAN 优化，添加 SKAN 详情
        if skan_details:
            internal_vars.update({
                'skan_optimized': True,
                'conversion_value': skan_details.get('conversion_value'),
                'skan_confidence': skan_details.get('confidence'),
                'postback_delay_hours': skan_details.get('postback_delay_hours')
            })
            reasoning = f"DSP 估算：pCTR {pctr*100:.2f}%，pCVR {pcvr*100:.2f}%（SKAN 概率优化，信心度 {skan_details.get('confidence', 0)*100:.1f}%），CTR得分 {ctr_score:.4f}（平台：{platform}，时段：{hour}点）"
        else:
            reasoning = f"DSP 估算：pCTR {pctr*100:.2f}%，pCVR {pcvr*100:.2f}%，CTR得分 {ctr_score:.4f}（平台：{platform}，时段：{hour}点）"
        
        self.logger.log_decision(
            request_id=request_id,
            node="DSP",
            action="CTR_ESTIMATION",
            decision="PASS",
            reason_code="CTR_CALCULATED",
            internal_variables=internal_vars,
            reasoning=reasoning,
            pctr=pctr,
            pcvr=pcvr
        )
        
        # 使用出价策略计算出价
        bid_price, internal_vars, reasoning = self.bidding_strategy.calculate_bid(request_id, ad_request)
        ad_request['bid_price'] = bid_price
        
        self.logger.log_decision(
            request_id=request_id,
            node="DSP",
            action="BID_SUBMITTED",
            decision="PASS",
            reason_code="BID_SUBMITTED",
            internal_variables=internal_vars,
            reasoning=f"DSP 提交出价：{bid_price}。{reasoning}"
        )
        
        return ad_request


class AdExchangeEngine:
    """全域流量价值决策引擎 - 协调上游流量、中游价值博弈、下游分发"""
    
    def __init__(self, log_file: str = "whitebox.log", enable_quality_scoring: bool = True, enable_skan_optimization: bool = True):
        self.logger = WhiteboxLogger(log_file)
        self.ssp = SSP(self.logger)
        # 初始化流量来源管理器
        self.traffic_source = TrafficSource()
        # 初始化全域分发中枢
        self.distribution_hub = DistributionHub(self.logger)
        # 初始化机会成本管理器（用于搜推和Push价值估算）
        self.opportunity_manager = InternalOpportunityManager(self.logger)
        # 初始化质量评分器（如果启用）
        quality_scorer = QualityScorer(self.logger) if enable_quality_scoring else None
        # 初始化 SKAN 优化器（如果启用）
        skan_optimizer = SKANOptimizer(self.logger) if enable_skan_optimization else None
        self.adx = ADX(self.logger, quality_scorer=quality_scorer, skan_optimizer=skan_optimizer)
        self.skan_optimizer = skan_optimizer  # 保存引用，供 DSP 使用
        self.dsp = None  # 将在运行时设置
    
    def setup_adx_filters(self, floor_price: float = 0.1, 
                          blacklist: List[str] = None,
                          required_size: tuple = (320, 50),
                          max_latency_ms: int = 100):
        """配置 ADX 过滤规则"""
        if blacklist is None:
            blacklist = []
        
        self.adx.add_filter(BlacklistFilter(blacklist, self.logger))
        self.adx.add_filter(SizeMatchFilter(required_size, self.logger))
        self.adx.add_filter(LatencyTimeoutFilter(max_latency_ms, self.logger))
        self.adx.add_filter(CreativeMismatchFilter(self.logger))
        # 注意：底价过滤需要在收到出价后才能应用，所以稍后处理
    
    def setup_dsp(self, base_price: float = 0.5):
        """配置 DSP 出价策略"""
        self.dsp = DSP(self.logger, CTRBasedBiddingStrategy(base_price, self.logger))
    
    def run_auction(self, request_id: str, device_id: str, app_id: str,
                   app_name: str, platform: str, ad_size: tuple, 
                   num_dsps: int = 3) -> Dict:
        """
        运行完整的广告竞价流程（支持多个 DSP）
        返回：处理结果字典
        """
        TIMEOUT_THRESHOLD = 100  # ms
        
        # 0. 上游：生成流量来源信息
        traffic_info = self.traffic_source.generate_traffic(device_id, num_requests=1)[0]
        user_tags = traffic_info.get('user_tags', {})
        
        # 1. SSP 生成请求（包含 latency_ms）
        ad_request = self.ssp.generate_request(
            request_id, device_id, app_id, app_name, platform, ad_size
        )
        
        # 将流量来源信息添加到请求中
        ad_request['traffic_channel'] = traffic_info.get('channel')
        ad_request['attribution_cost'] = traffic_info.get('attribution_cost', 0)
        ad_request['attribution_confidence'] = traffic_info.get('attribution_confidence', 0)
        ad_request['user_tags'] = user_tags
        ad_request['user_ltv'] = user_tags.get('ltv', 0)
        ad_request['lifecycle_stage'] = user_tags.get('lifecycle_stage', '新用户')
        
        latency_ms = ad_request.get('latency_ms', 0)
        
        # 2. 多个 DSP 出价（每个 DSP 生成独立的 pCTR 和 pCVR）
        all_bids = []
        floor_price = 0.1
        
        for i in range(num_dsps):
            # 为每个 DSP 创建独立的请求副本
            dsp_request = ad_request.copy()
            dsp_request['dsp_id'] = f'DSP_{i+1}'
            
            if self.dsp:
                # 传递 SKAN 优化器给 DSP（用于 iOS 流量的 pCVR 预估）
                dsp_request = self.dsp.bid(dsp_request, self.skan_optimizer)
                bid_price = dsp_request.get('bid_price', 0)
                pctr = dsp_request.get('pctr', 0.001)
                pcvr = dsp_request.get('pcvr', 0.01)
                
                # 应用底价过滤
                if bid_price >= floor_price:
                    all_bids.append({
                        'dsp_id': f'DSP_{i+1}',
                        'bid_price': bid_price,
                        'pctr': pctr,
                        'pcvr': pcvr,
                        'floor_price': floor_price,
                        'request_id': request_id,
                        'internal_vars': dsp_request.get('internal_variables', {})
                    })
        
        # 1.5. 四层漏斗逻辑：召回 -> 精排 -> 重排 -> 计算 Organic_LTV
        # 召回层：多路召回（标签、协同、热门、冷启）
        recalled_content = self.distribution_hub.search_engine.recall(user_tags, recall_size=100)
        
        # 精排层：多目标融合 Score = w·CTR + x·Like + y·Finish
        ranked_content = self.distribution_hub.search_engine.fine_rank(recalled_content, user_tags)
        
        # 重排层：业务干预（打散、提权、广告插入）
        # 注意：此时还没有广告内容，所以只进行打散和提权
        re_ranked_content = self.distribution_hub.search_engine.re_rank(ranked_content, ads_content=None)
        
        # 计算 Organic_LTV（自然流量的预期价值）
        # 取 Top 5 内容计算 LTV 贡献
        top_content = re_ranked_content[:5] if len(re_ranked_content) >= 5 else re_ranked_content
        organic_ltv = sum(self.distribution_hub.search_engine.calculate_content_ltv(c) for c in top_content)
        
        # 生命周期调整因子
        lifecycle_stage = user_tags.get('lifecycle_stage', '新用户')
        lifecycle_multiplier = {
            '新用户': 0.5,
            '成长期': 1.0,
            '成熟期': 1.5,
            '流失风险': 0.8
        }.get(lifecycle_stage, 1.0)
        
        organic_ltv_adjusted = organic_ltv * lifecycle_multiplier
        
        # 计算全域价值（搜推和Push预期价值）
        ev_search, search_details = self.opportunity_manager.estimate_search_value(device_id, ad_request)
        ev_push, push_details = self.opportunity_manager.estimate_push_value(device_id, ad_request)
        
        # 获取用户触达历史
        touch_history = self.opportunity_manager.get_user_touch_history(device_id)
        attribution_channels = self.opportunity_manager.get_attribution_channels(device_id)
        
        # 记录触达历史到请求中
        ad_request['ev_search'] = ev_search
        ad_request['ev_push'] = ev_push
        ad_request['user_touch_history'] = touch_history
        ad_request['attribution_channels'] = attribution_channels
        ad_request['organic_ltv'] = organic_ltv_adjusted
        ad_request['recalled_content_count'] = len(recalled_content)
        ad_request['ranked_content_count'] = len(ranked_content)
        ad_request['re_ranked_content_count'] = len(re_ranked_content)
        
        # 记录四层漏斗结果
        self.logger.log_decision(
            request_id=request_id,
            node="SEARCH_RECOMMENDATION",
            action="FUNNEL_PROCESSING",
            decision="PASS",
            reason_code="FUNNEL_COMPLETED",
            internal_variables={
                'recalled_count': len(recalled_content),
                'ranked_count': len(ranked_content),
                're_ranked_count': len(re_ranked_content),
                'top_content_count': len(top_content),
                'organic_ltv': organic_ltv,
                'organic_ltv_adjusted': organic_ltv_adjusted,
                'lifecycle_stage': lifecycle_stage,
                'lifecycle_multiplier': lifecycle_multiplier
            },
            reasoning=f"四层漏斗处理完成：召回 {len(recalled_content)} 条，精排 {len(ranked_content)} 条，重排 {len(re_ranked_content)} 条，Organic_LTV = {organic_ltv:.4f}，调整后 = {organic_ltv_adjusted:.4f}"
        )
        
        # 3. 延迟过滤检查（在收集出价后进行，以便计算潜在损失）
        if latency_ms > TIMEOUT_THRESHOLD:
            # 计算潜在最高 eCPM 收入损失（强制确保产生真实的损耗数据）
            max_potential_ecpm = 0.0
            potential_loss = 0.0
            
            if all_bids:
                for bid in all_bids:
                    # 计算每个出价的 eCPM（考虑质量系数）
                    q_factor = bid.get('q_factor', 1.0)
                    ecpm = bid['bid_price'] * bid['pctr'] * bid['pcvr'] * q_factor * 1000
                    max_potential_ecpm = max(max_potential_ecpm, ecpm)
            
            # 如果没有出价或计算出的损失为 0，使用默认估算（确保损耗数据不为 0）
            if max_potential_ecpm == 0.0:
                # 基于平均出价估算潜在损失（使用更保守的估算，确保不为 0）
                avg_bid = 0.5
                avg_pctr = 0.02
                avg_pcvr = 0.05
                avg_q_factor = 1.0
                max_potential_ecpm = avg_bid * avg_pctr * avg_pcvr * avg_q_factor * 1000
                # 如果计算结果仍然为 0，使用最小非零值
                if max_potential_ecpm == 0.0:
                    max_potential_ecpm = 0.5  # 最小非零 eCPM 值
            
            potential_loss = max_potential_ecpm  # 潜在损失 = 潜在最高 eCPM
            # 强制确保 potential_loss 不为 0
            if potential_loss == 0.0:
                potential_loss = 0.5  # 最小非零值
            
            self.logger.log_decision(
                request_id=request_id,
                node="ADX",
                action="LATENCY_CHECK",
                decision="REJECT",
                reason_code="LATENCY_TIMEOUT",
                internal_variables={
                    'latency_ms': latency_ms,
                    'timeout_threshold': TIMEOUT_THRESHOLD,
                    'max_potential_ecpm': max_potential_ecpm,
                    'potential_loss': potential_loss,  # 强制添加 potential_loss
                    'highest_potential_ecpm_loss': max_potential_ecpm,
                    'total_bids': len(all_bids)
                },
                reasoning=f"响应延迟 {latency_ms:.1f}ms 超过阈值 {TIMEOUT_THRESHOLD}ms，请求超时，潜在最高 eCPM 收入损失：{max_potential_ecpm:.4f}",
                latency_ms=latency_ms,
                ecpm=max_potential_ecpm  # 记录 eCPM 损失
            )
            
            return {
                'request_id': request_id,
                'status': 'REJECTED',
                'reason': 'LATENCY_TIMEOUT',
                'bid_price': 0,
                'latency_ms': latency_ms,
                'max_potential_ecpm': max_potential_ecpm,
                'potential_loss': potential_loss  # 返回潜在损失
            }
        
        # 4. 如果没有有效出价，直接拒绝
        if not all_bids:
            return {
                'request_id': request_id,
                'status': 'REJECTED',
                'reason': 'NO_VALID_BIDS',
                'bid_price': 0
            }
        
        # 5. ADX 应用其他过滤规则（使用最高出价进行过滤检查）
        highest_bid = max(all_bids, key=lambda x: x['bid_price'])
        test_request = ad_request.copy()
        test_request['bid_price'] = highest_bid['bid_price']
        
        passed, reason_code = self.adx.process_request(test_request)
        
        if not passed:
            return {
                'request_id': request_id,
                'status': 'REJECTED',
                'reason': reason_code,
                'bid_price': highest_bid['bid_price']
            }
        
        # 6. 全域博弈逻辑：机会成本计算 (Opportunity Cost)
        # 计算最高广告 eCPM（转换为美元，用于比较）
        max_ad_ecpm = 0.0
        if all_bids:
            for bid in all_bids:
                # 预估该出价的 eCPM（考虑质量系数）
                q_factor = bid.get('q_factor', 1.0)
                ecpm = bid['bid_price'] * bid['pctr'] * bid['pcvr'] * q_factor * 1000
                max_ad_ecpm = max(max_ad_ecpm, ecpm)
        
        # 将 eCPM 转换为美元（eCPM / 1000）
        max_ad_value = max_ad_ecpm / 1000.0
        
        # 机会成本决策：只有当 Organic_LTV < Ad_eCPM 时才触发广告填充
        # 如果 Organic_LTV >= Ad_eCPM，则拒绝广告，返回搜推结果
        if organic_ltv_adjusted >= max_ad_value and max_ad_value > 0:
            # 搜推价值更高，拒绝广告填充
            self.logger.log_decision(
                request_id=request_id,
                node="DISTRIBUTION_HUB",
                action="OPPORTUNITY_COST_CHECK",
                decision="REJECT",
                reason_code="ORGANIC_LTV_HIGHER",
                internal_variables={
                    'organic_ltv': organic_ltv_adjusted,
                    'max_ad_ecpm': max_ad_ecpm,
                    'max_ad_value': max_ad_value,
                    'opportunity_cost': organic_ltv_adjusted - max_ad_value,
                    'selected_path': 'search'
                },
                reasoning=f"机会成本检查：Organic_LTV ({organic_ltv_adjusted:.4f}) >= Ad_eCPM ({max_ad_value:.4f})，搜推价值更高，拒绝广告填充，选择搜推路径"
            )
            
            # 分发到搜推路径
            distribution_result = self.distribution_hub.distribute(
                device_id=device_id,
                user_tags=user_tags,
                selected_path='search',
                ad_request=ad_request,
                ad_result=None
            )
            
            return {
                'request_id': request_id,
                'status': 'REJECTED',
                'reason': 'ORGANIC_LTV_HIGHER',
                'bid_price': 0,
                'organic_ltv': organic_ltv_adjusted,
                'max_ad_value': max_ad_value,
                'selected_path': 'search',
                'distribution_result': distribution_result,
                'opportunity_cost': organic_ltv_adjusted - max_ad_value
            }
        
        # 7. 运行竞价（调整后的 eCPM 排序 + 二价计费）
        auction_result = self.adx.run_auction(all_bids, request_id, ad_request)
        
        if auction_result:
            winner = auction_result['winner']
            actual_paid_price = auction_result['actual_paid_price']
            saved_amount = auction_result['saved_amount']
            winner_ecpm = auction_result['winner_ecpm']
            second_best_bid = auction_result['second_best_bid']
            
            # 记录机会成本检查结果（广告价值更高，触发广告填充）
            ad_value = winner_ecpm / 1000.0
            opportunity_cost = ad_value - organic_ltv_adjusted
            
            self.logger.log_decision(
                request_id=request_id,
                node="DISTRIBUTION_HUB",
                action="OPPORTUNITY_COST_CHECK",
                decision="PASS",
                reason_code="AD_ECPM_HIGHER",
                internal_variables={
                    'organic_ltv': organic_ltv_adjusted,
                    'ad_ecpm': winner_ecpm,
                    'ad_value': ad_value,
                    'opportunity_cost': opportunity_cost,
                    'selected_path': 'ads'
                },
                reasoning=f"机会成本检查：Ad_eCPM ({ad_value:.4f}) > Organic_LTV ({organic_ltv_adjusted:.4f})，广告价值更高，触发广告填充，机会成本 = {opportunity_cost:.4f}"
            )
            
            # 记录竞价结果（包含所有新字段）
            self.logger.log_decision(
                request_id=request_id,
                node="ADX",
                action="AUCTION_RESULT",
                decision="PASS",
                reason_code="AUCTION_WON",
                internal_variables={
                    'winner_bid': auction_result['winner_bid'],
                    'winner_ecpm': winner_ecpm,
                    'winner_pctr': auction_result['winner_pctr'],
                    'winner_pcvr': auction_result['winner_pcvr'],
                    'second_best_bid': second_best_bid,
                    'second_highest_ecpm': auction_result['second_highest_ecpm'],
                    'actual_paid_price': actual_paid_price,
                    'saved_amount': saved_amount,
                    'total_bids': len(all_bids),
                    'latency_ms': latency_ms,
                    'original_ecpm': auction_result.get('original_ecpm', winner_ecpm),  # 原始 eCPM
                    'winner_q_factor': winner.get('q_factor', 1.0),  # 获胜者的质量系数
                    'all_bids': auction_result.get('all_bids', []),  # 所有出价信息（用于 AI 诊断）
                    'organic_ltv': organic_ltv_adjusted,  # 搜推 LTV
                    'opportunity_cost': opportunity_cost  # 机会成本
                },
                reasoning=f"竞价完成：{winner['dsp_id']} 获胜，eCPM {winner_ecpm:.4f}，原始出价 {auction_result['winner_bid']:.4f}，第二名 eCPM {auction_result['second_highest_ecpm']:.4f}，实际支付 {actual_paid_price:.4f}（GSP 二价计费），节省 {saved_amount:.4f}，机会成本 {opportunity_cost:.4f}",
                pctr=auction_result['winner_pctr'],
                pcvr=auction_result['winner_pcvr'],
                ecpm=winner_ecpm,
                latency_ms=latency_ms,
                second_best_bid=second_best_bid,
                actual_paid_price=actual_paid_price,
                saved_amount=saved_amount
            )
            
            # 分发到广告路径
            ad_result = {
                'winner': winner['dsp_id'],
                'bid_price': auction_result['winner_bid'],
                'ecpm': winner_ecpm,
                'actual_paid_price': actual_paid_price
            }
            distribution_result = self.distribution_hub.distribute(
                device_id=device_id,
                user_tags=user_tags,
                selected_path='ads',
                ad_request=ad_request,
                ad_result=ad_result
            )
            
            return {
                'request_id': request_id,
                'status': 'ACCEPTED',
                'reason': 'AUCTION_WON',
                'bid_price': auction_result['winner_bid'],
                'actual_paid_price': actual_paid_price,
                'saved_amount': saved_amount,
                'winner': winner['dsp_id'],
                'ecpm': winner_ecpm,
                'pctr': auction_result['winner_pctr'],
                'pcvr': auction_result['winner_pcvr'],
                'latency_ms': latency_ms,
                'all_bids': all_bids,
                'organic_ltv': organic_ltv_adjusted,
                'opportunity_cost': opportunity_cost,
                'selected_path': 'ads',
                'distribution_result': distribution_result
            }
        else:
            return {
                'request_id': request_id,
                'status': 'REJECTED',
                'reason': 'AUCTION_FAILED',
                'bid_price': 0
            }

