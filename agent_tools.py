"""
Agent 工具集 (MCP-like Tools)
解耦的工具链，Agent 通过 call_tool 执行操作
"""
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
from schemas import WhiteboxTrace
import json
import os


class AgentTools:
    """Agent 工具集类"""
    
    def __init__(self, log_file: str = "whitebox.log"):
        self.log_file = log_file
    
    def get_traffic_stats(self, region: Optional[str] = None) -> Dict:
        """
        获取特定区域流量画像
        Args:
            region: 区域名称，如果为 None 则返回全局统计
        Returns:
            流量统计信息
        """
        if not os.path.exists(self.log_file):
            return {'error': '日志文件不存在'}
        
        with open(self.log_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        logs = []
        for line in reversed(lines[-1000:]):  # 最近1000条
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                trace = WhiteboxTrace(
                    request_id=data.get('request_id', ''),
                    timestamp=data.get('timestamp', ''),
                    node=data.get('node', ''),
                    action=data.get('action', ''),
                    decision=data.get('decision', ''),
                    reason_code=data.get('reason_code', ''),
                    internal_variables=data.get('internal_variables', {}),
                    reasoning=data.get('reasoning', ''),
                    pCTR=data.get('pCTR'),
                    pCVR=data.get('pCVR'),
                    eCPM=data.get('eCPM'),
                    latency_ms=data.get('latency_ms')
                )
                logs.append(trace)
            except:
                continue
        
        # 提取区域信息
        def extract_region(log: WhiteboxTrace) -> str:
            app_id = log.internal_variables.get('app_id', '').lower()
            if 'brazil' in app_id:
                return 'Brazil'
            elif 'china' in app_id:
                return 'China'
            elif 'us' in app_id or 'usa' in app_id:
                return 'US'
            return 'Unknown'
        
        # 过滤区域
        if region:
            logs = [log for log in logs if extract_region(log) == region]
        
        # 统计
        total_requests = len(set(log.request_id for log in logs))
        win_count = len(set(log.request_id for log in logs 
                          if log.action == 'AUCTION_RESULT'))
        timeout_count = len([log for log in logs 
                            if log.reason_code == 'LATENCY_TIMEOUT'])
        
        avg_latency = sum(log.latency_ms for log in logs if log.latency_ms) / \
                     len([log for log in logs if log.latency_ms]) if \
                     [log for log in logs if log.latency_ms] else 0
        
        avg_ecpm = sum(log.eCPM for log in logs if log.eCPM) / \
                  len([log for log in logs if log.eCPM]) if \
                  [log for log in logs if log.eCPM] else 0
        
        return {
            'region': region or 'Global',
            'total_requests': total_requests,
            'win_count': win_count,
            'win_rate': (win_count / total_requests * 100) if total_requests > 0 else 0,
            'timeout_count': timeout_count,
            'timeout_rate': (timeout_count / total_requests * 100) if total_requests > 0 else 0,
            'avg_latency_ms': avg_latency,
            'avg_ecpm': avg_ecpm
        }
    
    def simulate_bid_shading(self, bid_price: float, 
                            second_best_bid: Optional[float] = None) -> Dict:
        """
        模拟二价环境下的最优出价
        Args:
            bid_price: 当前出价
            second_best_bid: 第二高出价（如果已知）
        Returns:
            模拟结果和建议
        """
        # 如果没有提供第二高出价，使用历史数据估算
        if second_best_bid is None:
            # 从日志中获取历史第二高出价
            if os.path.exists(self.log_file):
                with open(self.log_file, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                
                second_bids = []
                for line in reversed(lines[-500:]):
                    try:
                        data = json.loads(line.strip())
                        sb = data.get('second_best_bid')
                        if sb and sb > 0:
                            second_bids.append(sb)
                    except:
                        continue
                
                if second_bids:
                    second_best_bid = sum(second_bids) / len(second_bids)
                else:
                    second_best_bid = bid_price * 0.8  # 默认假设
        
        # 计算最优出价（第二高出价 + 0.01）
        optimal_bid = second_best_bid + 0.01 if second_best_bid else bid_price
        
        # 计算节省金额
        current_paid = min(bid_price, second_best_bid) if second_best_bid else bid_price
        optimal_paid = second_best_bid if second_best_bid else bid_price
        savings = current_paid - optimal_paid
        
        return {
            'current_bid': bid_price,
            'second_best_bid': second_best_bid,
            'optimal_bid': optimal_bid,
            'current_paid': current_paid,
            'optimal_paid': optimal_paid,
            'potential_savings': max(0, savings),
            'recommendation': f'建议出价 ${optimal_bid:.4f}，可节省 ${savings:.4f}' if savings > 0 else '当前出价已接近最优'
        }
    
    def analyze_skan_conversion(self, conversion_value: int) -> Dict:
        """
        模拟 iOS 隐私环境下的概率还原
        Args:
            conversion_value: SKAN conversion value (0-63)
        Returns:
            概率还原结果
        """
        # 转换值到业务价值的映射（线性映射）
        business_value = (conversion_value / 63.0) * 10.0  # 映射到 $0-$10
        
        # 基于历史分布的概率还原
        # 这里使用简化的概率模型
        if conversion_value >= 50:
            confidence = 0.9
            estimated_pcvr = 0.05
        elif conversion_value >= 30:
            confidence = 0.75
            estimated_pcvr = 0.03
        elif conversion_value >= 15:
            confidence = 0.6
            estimated_pcvr = 0.02
        else:
            confidence = 0.5
            estimated_pcvr = 0.01
        
        return {
            'conversion_value': conversion_value,
            'business_value': business_value,
            'estimated_pcvr': estimated_pcvr,
            'confidence': confidence,
            'recommendation': f'基于 conversion_value={conversion_value}，预估 pCVR={estimated_pcvr:.3f}，信心度={confidence:.1%}'
        }
    
    def compare_with_benchmark(self, metric: str, value: float) -> Dict:
        """
        对比指标与行业基准水位
        Args:
            metric: 指标名称（如 'pCTR', 'latency', 'win_rate'）
            value: 当前值
        Returns:
            对比结果
        """
        # 行业基准值（简化版）
        benchmarks = {
            'pCTR': 0.012,  # 1.2%
            'pCVR': 0.03,   # 3%
            'latency': 100,  # 100ms
            'win_rate': 30,  # 30%
            'ecpm': 2.5     # $2.5
        }
        
        benchmark = benchmarks.get(metric, 0)
        if benchmark == 0:
            return {'error': f'未知指标: {metric}'}
        
        diff = value - benchmark
        diff_pct = (diff / benchmark * 100) if benchmark > 0 else 0
        
        status = 'above' if diff > 0 else 'below'
        if abs(diff_pct) < 10:
            status = 'normal'
        
        return {
            'metric': metric,
            'current_value': value,
            'benchmark': benchmark,
            'difference': diff,
            'difference_percentage': diff_pct,
            'status': status,
            'recommendation': f'当前值 {value:.4f} {"高于" if diff > 0 else "低于"} 行业基准 {benchmark:.4f} ({abs(diff_pct):.1f}%)'
        }
    
    def simulate_strategy(self, strategy: Dict) -> Dict:
        """
        模拟策略执行后的预期收益
        Args:
            strategy: 策略配置，如 {'type': 'bid_increase', 'region': 'Brazil', 'value': 0.1}
        Returns:
            模拟结果
        """
        strategy_type = strategy.get('type')
        
        if strategy_type == 'bid_increase':
            # 模拟提价策略
            increase_pct = strategy.get('value', 0.1)  # 默认10%
            region = strategy.get('region')
            
            stats = self.get_traffic_stats(region)
            current_win_rate = stats.get('win_rate', 0)
            current_ecpm = stats.get('avg_ecpm', 0)
            
            # 假设提价后胜率提升（简化模型）
            new_win_rate = min(100, current_win_rate * (1 + increase_pct * 0.5))
            new_ecpm = current_ecpm * (1 + increase_pct)
            
            # 计算预期收益提升
            revenue_lift = (new_win_rate - current_win_rate) / 100 * new_ecpm * stats.get('total_requests', 0)
            
            return {
                'strategy_type': strategy_type,
                'current_win_rate': current_win_rate,
                'new_win_rate': new_win_rate,
                'current_ecpm': current_ecpm,
                'new_ecpm': new_ecpm,
                'revenue_lift': revenue_lift,
                'recommendation': f'提价 {increase_pct*100:.1f}% 后，预期胜率提升至 {new_win_rate:.1f}%，收益提升 ${revenue_lift:.2f}'
            }
        
        elif strategy_type == 'latency_threshold':
            # 模拟延迟阈值调整
            new_threshold = strategy.get('value', 150)  # 默认150ms
            region = strategy.get('region')
            
            stats = self.get_traffic_stats(region)
            current_timeout_rate = stats.get('timeout_rate', 0)
            
            # 假设提高阈值后超时率降低（简化模型）
            reduction_factor = 0.7 if new_threshold > 100 else 0.9
            new_timeout_rate = current_timeout_rate * reduction_factor
            
            # 计算挽回的请求数
            recovered_requests = stats.get('total_requests', 0) * (current_timeout_rate - new_timeout_rate) / 100
            recovered_revenue = recovered_requests * stats.get('avg_ecpm', 0)
            
            return {
                'strategy_type': strategy_type,
                'current_timeout_rate': current_timeout_rate,
                'new_timeout_rate': new_timeout_rate,
                'recovered_requests': recovered_requests,
                'recovered_revenue': recovered_revenue,
                'recommendation': f'延迟阈值调整至 {new_threshold}ms 后，预期超时率降至 {new_timeout_rate:.1f}%，挽回收益 ${recovered_revenue:.2f}'
            }
        
        else:
            return {'error': f'未知策略类型: {strategy_type}'}


