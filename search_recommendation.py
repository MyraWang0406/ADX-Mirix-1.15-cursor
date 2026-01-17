"""
搜推漏斗逻辑 (4-Layer Funnel)
召回 -> 精排 -> 重排 -> 分发
"""
import random
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from enum import Enum


class RecallStrategy(Enum):
    """召回策略"""
    INTEREST = "兴趣召回"  # 基于用户兴趣
    COLLABORATIVE = "协同召回"  # 协同过滤
    POPULAR = "热门召回"  # 热门内容
    COLD_START = "冷启动召回"  # 新用户/新内容


class ContentType(Enum):
    """内容类型"""
    ARTICLE = "文章"
    VIDEO = "视频"
    PRODUCT = "商品"
    AD = "广告"


class SearchRecommendationEngine:
    """搜推引擎"""
    
    def __init__(self):
        # 精排权重配置
        self.ranking_weights = {
            'ctr': 0.4,      # w
            'like': 0.25,    # x
            'finish': 0.25,  # y
            'comment': 0.1   # z
        }
        
        # 内容池（模拟）
        self.content_pool = self._initialize_content_pool()
    
    def _initialize_content_pool(self) -> List[Dict]:
        """初始化内容池"""
        content_types = [ContentType.ARTICLE, ContentType.VIDEO, ContentType.PRODUCT]
        pool = []
        
        for i in range(100):
            content_type = random.choice(content_types)
            pool.append({
                'content_id': f'content_{i}',
                'type': content_type.value,
                'author_id': f'author_{i % 20}',
                'publish_time': datetime.now().isoformat(),
                'base_ctr': random.uniform(0.01, 0.10),
                'base_like_rate': random.uniform(0.05, 0.20),
                'base_finish_rate': random.uniform(0.30, 0.80),
                'base_comment_rate': random.uniform(0.01, 0.10),
                'ltv_contribution': random.uniform(0.5, 5.0)  # 长效LTV贡献
            })
        
        return pool
    
    def recall(self, user_tags: Dict, recall_size: int = 100) -> List[Dict]:
        """
        召回层：多路召回
        返回：召回的内容列表
        """
        recalled_content = []
        
        # 兴趣召回（基于用户兴趣标签）
        interest_content = self._interest_recall(user_tags, recall_size // 4)
        recalled_content.extend(interest_content)
        
        # 协同召回（基于相似用户）
        collaborative_content = self._collaborative_recall(user_tags, recall_size // 4)
        recalled_content.extend(collaborative_content)
        
        # 热门召回
        popular_content = self._popular_recall(recall_size // 4)
        recalled_content.extend(popular_content)
        
        # 冷启动召回（新内容/新用户）
        cold_start_content = self._cold_start_recall(user_tags, recall_size // 4)
        recalled_content.extend(cold_start_content)
        
        # 去重
        seen_ids = set()
        unique_content = []
        for content in recalled_content:
            if content['content_id'] not in seen_ids:
                seen_ids.add(content['content_id'])
                unique_content.append(content)
        
        return unique_content[:recall_size]
    
    def _interest_recall(self, user_tags: Dict, size: int) -> List[Dict]:
        """兴趣召回"""
        interest_tags = user_tags.get('interest_tags', [])
        matched = [c for c in self.content_pool if any(tag in str(c) for tag in interest_tags)]
        return random.sample(matched, min(size, len(matched))) if matched else []
    
    def _collaborative_recall(self, user_tags: Dict, size: int) -> List[Dict]:
        """协同召回（简化版：随机选择）"""
        return random.sample(self.content_pool, min(size, len(self.content_pool)))
    
    def _popular_recall(self, size: int) -> List[Dict]:
        """热门召回（按基础CTR排序）"""
        sorted_pool = sorted(self.content_pool, key=lambda x: x['base_ctr'], reverse=True)
        return sorted_pool[:size]
    
    def _cold_start_recall(self, user_tags: Dict, size: int) -> List[Dict]:
        """冷启动召回"""
        # 新用户或新内容
        lifecycle_stage = user_tags.get('lifecycle_stage', '')
        if lifecycle_stage == '新用户':
            # 新用户：返回高质量内容
            sorted_pool = sorted(self.content_pool, key=lambda x: x['ltv_contribution'], reverse=True)
            return sorted_pool[:size]
        else:
            # 新内容：返回最近发布的内容
            return self.content_pool[-size:] if len(self.content_pool) >= size else self.content_pool
    
    def fine_rank(self, recalled_content: List[Dict], user_tags: Dict) -> List[Dict]:
        """
        精排层：多目标预估
        Score = w·CTR + x·Like + y·Finish + z·Comment
        """
        ranked_content = []
        
        for content in recalled_content:
            # 预估各项指标
            ctr = self._estimate_ctr(content, user_tags)
            like_rate = self._estimate_like_rate(content, user_tags)
            finish_rate = self._estimate_finish_rate(content, user_tags)
            comment_rate = self._estimate_comment_rate(content, user_tags)
            
            # 计算精排分数
            score = (
                self.ranking_weights['ctr'] * ctr +
                self.ranking_weights['like'] * like_rate +
                self.ranking_weights['finish'] * finish_rate +
                self.ranking_weights['comment'] * comment_rate
            )
            
            ranked_content.append({
                **content,
                'estimated_ctr': ctr,
                'estimated_like_rate': like_rate,
                'estimated_finish_rate': finish_rate,
                'estimated_comment_rate': comment_rate,
                'ranking_score': score
            })
        
        # 按分数排序
        ranked_content.sort(key=lambda x: x['ranking_score'], reverse=True)
        
        return ranked_content
    
    def _estimate_ctr(self, content: Dict, user_tags: Dict) -> float:
        """预估CTR"""
        base_ctr = content.get('base_ctr', 0.05)
        # 用户兴趣匹配度调整
        interest_match = 1.0
        if user_tags.get('interest_tags'):
            interest_match = 1.2  # 兴趣匹配提升20%
        return base_ctr * interest_match
    
    def _estimate_like_rate(self, content: Dict, user_tags: Dict) -> float:
        """预估点赞率"""
        return content.get('base_like_rate', 0.10)
    
    def _estimate_finish_rate(self, content: Dict, user_tags: Dict) -> float:
        """预估完播率"""
        return content.get('base_finish_rate', 0.50)
    
    def _estimate_comment_rate(self, content: Dict, user_tags: Dict) -> float:
        """预估评论率"""
        return content.get('base_comment_rate', 0.05)
    
    def re_rank(self, ranked_content: List[Dict], ads_content: List[Dict] = None) -> List[Dict]:
        """
        重排层：业务规则干预
        - 同作者打散
        - 新作者提权
        - 广告插入
        """
        re_ranked = []
        seen_authors = set()
        ads_inserted = 0
        
        if ads_content is None:
            ads_content = []
        
        for i, content in enumerate(ranked_content):
            author_id = content.get('author_id', '')
            
            # 同作者打散：如果连续3个内容来自同一作者，跳过
            if author_id in seen_authors and len([c for c in re_ranked[-3:] if c.get('author_id') == author_id]) >= 2:
                continue
            
            # 新作者提权：新作者内容提升10%分数
            if author_id not in seen_authors:
                content['ranking_score'] *= 1.1
            
            seen_authors.add(author_id)
            re_ranked.append(content)
            
            # 广告插入：每5个内容插入1个广告
            if ads_content and (i + 1) % 5 == 0 and ads_inserted < len(ads_content):
                ad = ads_content[ads_inserted].copy()
                ad['type'] = ContentType.AD.value
                ad['is_ad'] = True
                re_ranked.append(ad)
                ads_inserted += 1
        
        return re_ranked
    
    def calculate_content_ltv(self, content: Dict) -> float:
        """计算内容的长效LTV贡献"""
        return content.get('ltv_contribution', 0.0)


