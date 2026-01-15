"""
流量来源模块 (TrafficSource)
模拟上游增长买量渠道，关联用户标签和归因
"""
import random
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from enum import Enum


class TrafficChannel(Enum):
    """流量渠道枚举"""
    ZHI_DE_MAI = "值得买"  # 值得买
    BILIBILI = "B站"  # B站
    DOUYIN = "抖音"
    XIAOHONGSHU = "小红书"
    NATURAL = "自然流量"  # 自然流量


class UserLifecycleStage(Enum):
    """用户生命周期阶段"""
    NEW = "新用户"  # 0-7天
    GROWING = "成长期"  # 8-30天
    MATURE = "成熟期"  # 31-90天
    CHURN_RISK = "流失风险"  # 90+天未活跃


class TrafficSource:
    """流量来源管理器"""
    
    def __init__(self):
        # 渠道归因成本（CPC）
        self.channel_cpc = {
            TrafficChannel.ZHI_DE_MAI: 0.8,
            TrafficChannel.BILIBILI: 1.2,
            TrafficChannel.DOUYIN: 1.5,
            TrafficChannel.XIAOHONGSHU: 1.0,
            TrafficChannel.NATURAL: 0.0
        }
        
        # 渠道用户质量分（0-1）
        self.channel_quality = {
            TrafficChannel.ZHI_DE_MAI: 0.75,
            TrafficChannel.BILIBILI: 0.85,
            TrafficChannel.DOUYIN: 0.70,
            TrafficChannel.XIAOHONGSHU: 0.80,
            TrafficChannel.NATURAL: 0.60
        }
    
    def generate_traffic(self, device_id: str, num_requests: int = 1) -> List[Dict]:
        """
        生成流量请求
        返回：流量请求列表，包含渠道、用户标签等信息
        """
        requests = []
        
        for _ in range(num_requests):
            # 随机选择渠道
            channel = random.choice(list(TrafficChannel))
            
            # 生成用户标签
            user_tags = self._generate_user_tags(device_id, channel)
            
            # 计算归因成本
            attribution_cost = self.channel_cpc[channel]
            
            # 计算归因置信度（基于渠道质量）
            attribution_confidence = self.channel_quality[channel]
            
            request = {
                'device_id': device_id,
                'channel': channel.value,
                'channel_enum': channel.name,
                'attribution_cost': attribution_cost,
                'attribution_confidence': attribution_confidence,
                'user_tags': user_tags,
                'lifecycle_stage': user_tags['lifecycle_stage'],
                'user_ltv': user_tags.get('ltv', 0.0),
                'registration_days': user_tags.get('registration_days', 0),
                'timestamp': datetime.now().isoformat()
            }
            
            requests.append(request)
        
        return requests
    
    def _generate_user_tags(self, device_id: str, channel: TrafficChannel) -> Dict:
        """
        生成用户标签
        基于设备ID和渠道生成用户画像
        """
        # 基于设备ID生成稳定的用户特征（伪随机）
        import hashlib
        hash_obj = hashlib.md5(device_id.encode())
        hash_int = int(hash_obj.hexdigest()[:8], 16)
        
        # 注册天数（0-365天）
        registration_days = hash_int % 365
        
        # 生命周期阶段
        if registration_days <= 7:
            lifecycle_stage = UserLifecycleStage.NEW
        elif registration_days <= 30:
            lifecycle_stage = UserLifecycleStage.GROWING
        elif registration_days <= 90:
            lifecycle_stage = UserLifecycleStage.MATURE
        else:
            lifecycle_stage = UserLifecycleStage.CHURN_RISK
        
        # 用户LTV（基于生命周期和渠道质量）
        base_ltv = {
            UserLifecycleStage.NEW: 5.0,
            UserLifecycleStage.GROWING: 25.0,
            UserLifecycleStage.MATURE: 50.0,
            UserLifecycleStage.CHURN_RISK: 10.0
        }[lifecycle_stage]
        
        # 渠道质量调整
        channel_quality_factor = self.channel_quality[channel]
        user_ltv = base_ltv * channel_quality_factor
        
        # 兴趣标签（基于渠道）
        interest_tags = self._get_channel_interests(channel)
        
        return {
            'lifecycle_stage': lifecycle_stage.value,
            'registration_days': registration_days,
            'ltv': user_ltv,
            'interest_tags': interest_tags,
            'channel': channel.value
        }
    
    def _get_channel_interests(self, channel: TrafficChannel) -> List[str]:
        """获取渠道对应的兴趣标签"""
        channel_interests = {
            TrafficChannel.ZHI_DE_MAI: ['购物', '优惠', '比价'],
            TrafficChannel.BILIBILI: ['二次元', '游戏', '科技'],
            TrafficChannel.DOUYIN: ['娱乐', '短视频', '时尚'],
            TrafficChannel.XIAOHONGSHU: ['美妆', '穿搭', '生活方式'],
            TrafficChannel.NATURAL: ['通用', '搜索']
        }
        return channel_interests.get(channel, ['通用'])

