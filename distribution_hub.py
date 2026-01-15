"""
全域分发中枢 (Distribution Hub)
整合上游流量、中游价值博弈、下游分发
"""
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from traffic_source import TrafficSource, TrafficChannel
from search_recommendation import SearchRecommendationEngine
from schemas import WhiteboxTrace


class DistributionHub:
    """全域分发中枢"""
    
    def __init__(self, logger):
        self.logger = logger
        self.traffic_source = TrafficSource()
        self.search_engine = SearchRecommendationEngine()
    
    def calculate_total_value(self, device_id: str, user_tags: Dict, 
                            ad_ecpm: float, ad_request: Dict) -> Tuple[float, str, Dict]:
        """
        计算全域价值并选择最优路径
        Value = Max(自然搜推 LTV, 广告 eCPM, 权益触达价值)
        
        返回: (总价值, 选择的路径, 详细信息)
        """
        # 1. 计算搜推内容的长效LTV
        search_ltv = self._calculate_search_ltv(device_id, user_tags)
        
        # 2. 广告 eCPM（已计算）
        ad_value = ad_ecpm / 1000.0  # 转换为美元
        
        # 3. 权益触达价值（Push）
        push_value = self._calculate_push_value(device_id, user_tags)
        
        # 4. 选择最优路径
        values = {
            'search': search_ltv,
            'ads': ad_value,
            'push': push_value
        }
        
        selected_path = max(values.items(), key=lambda x: x[1])[0]
        total_value = values[selected_path]
        
        details = {
            'search_ltv': search_ltv,
            'ad_value': ad_value,
            'push_value': push_value,
            'selected_path': selected_path,
            'total_value': total_value,
            'value_comparison': values
        }
        
        return total_value, selected_path, details
    
    def _calculate_search_ltv(self, device_id: str, user_tags: Dict) -> float:
        """计算搜推内容的长效LTV"""
        # 召回内容
        recalled = self.search_engine.recall(user_tags, recall_size=20)
        
        if not recalled:
            return 0.0
        
        # 精排
        ranked = self.search_engine.fine_rank(recalled, user_tags)
        
        # 取Top 5计算LTV贡献
        top_content = ranked[:5]
        total_ltv = sum(self.search_engine.calculate_content_ltv(c) for c in top_content)
        
        # 用户生命周期调整
        lifecycle_stage = user_tags.get('lifecycle_stage', '新用户')
        lifecycle_multiplier = {
            '新用户': 0.5,
            '成长期': 1.0,
            '成熟期': 1.5,
            '流失风险': 0.8
        }.get(lifecycle_stage, 1.0)
        
        return total_ltv * lifecycle_multiplier
    
    def _calculate_push_value(self, device_id: str, user_tags: Dict) -> float:
        """计算权益触达价值"""
        # 基于用户活跃度和生命周期
        lifecycle_stage = user_tags.get('lifecycle_stage', '新用户')
        registration_days = user_tags.get('registration_days', 0)
        
        # 基础Push价值
        base_value = {
            '新用户': 2.0,
            '成长期': 1.5,
            '成熟期': 1.0,
            '流失风险': 2.5  # 流失风险用户Push价值高
        }.get(lifecycle_stage, 1.5)
        
        # 活跃度调整（注册天数越少，活跃度越高）
        activity_factor = max(0.5, 1.0 - registration_days / 365.0)
        
        return base_value * activity_factor
    
    def distribute(self, device_id: str, user_tags: Dict, selected_path: str,
                  ad_request: Dict, ad_result: Optional[Dict] = None) -> Dict:
        """
        下游分发：根据选择的路径分发到对应出口
        """
        distribution_result = {
            'device_id': device_id,
            'selected_path': selected_path,
            'distribution_outlet': None,
            'content': None,
            'timestamp': datetime.now().isoformat()
        }
        
        if selected_path == 'search':
            # 分发到搜索推荐流
            recalled = self.search_engine.recall(user_tags, recall_size=10)
            ranked = self.search_engine.fine_rank(recalled, user_tags)
            re_ranked = self.search_engine.re_rank(ranked)
            
            distribution_result['distribution_outlet'] = '搜索推荐流'
            distribution_result['content'] = re_ranked[:5]  # Top 5内容
        
        elif selected_path == 'push':
            # 分发到Push权益触达
            distribution_result['distribution_outlet'] = 'Push权益触达'
            distribution_result['content'] = {
                'type': '优惠券',
                'value': self._calculate_push_value(device_id, user_tags),
                'message': '限时优惠券，立即领取'
            }
        
        elif selected_path == 'ads':
            # 分发到首页资源位（广告）
            distribution_result['distribution_outlet'] = '首页资源位'
            distribution_result['content'] = ad_result
        
        return distribution_result

