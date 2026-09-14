"""
src/impact_evaluator.py
学术影响力与重要度综合评估引擎。
结合 Semantic Scholar 引用量、高影响引用、年均增长速率及内部拓扑中心度，
输出 0~100 综合分值、分级阶梯（Tier）及可视化节点权重。
"""

import math
from typing import Dict, Any, List


class ImpactEvaluator:
    """多维影响力综合打分引擎"""

    CURRENT_YEAR = 2026

    def evaluate_paper(self, paper: Dict[str, Any], network_centrality: float = 0.0) -> Dict[str, Any]:
        """
        评估单篇论文的影响力
        :param paper: 包含 citationCount, influentialCitationCount, year 等元数据的字典
        :param network_centrality: 来自引用图谱的中心度指标（0.0 ~ 1.0）
        """
        citations = int(paper.get("citationCount", 0) or 0)
        influential = int(paper.get("influentialCitationCount", 0) or 0)
        year = int(paper.get("year", self.CURRENT_YEAR) or self.CURRENT_YEAR)

        # 1. 计算年均引用增长率 (Annual Citation Velocity)
        age = max(1, self.CURRENT_YEAR - year + 1)
        annual_velocity = citations / age

        # 2. 高影响力引用占比 (Influential Ratio)
        influential_ratio = (influential / max(1, citations)) if citations > 0 else 0.0

        # 3. 对数平滑评分 (Log Scale) 避免极端大值失真
        log_citations = math.log10(citations + 1)  # 0 ~ 5+
        log_velocity = math.log10(annual_velocity + 1)  # 0 ~ 4+

        # 综合打分公式：
        # - 总引用规模 (40%)
        # - 年均爆发力 (30%)
        # - 权威高影响引用比率 (15%)
        # - 内部研究网络中心度 (15%)
        raw_score = (
            (min(log_citations, 5.0) / 5.0) * 40.0 +
            (min(log_velocity, 4.0) / 4.0) * 30.0 +
            (min(influential_ratio, 0.25) / 0.25) * 15.0 +
            (min(network_centrality, 1.0)) * 15.0
        )

        score = round(min(100.0, max(10.0, raw_score)), 1)

        # 划分级别 Tier
        if score >= 80.0 or citations >= 5000:
            tier = "Tier S: Landmark"
            tier_label = "划时代里程碑"
            tier_badge = "S"
        elif score >= 65.0 or citations >= 1500:
            tier = "Tier A: Key Foundation"
            tier_label = "核心基石"
            tier_badge = "A"
        elif score >= 45.0 or citations >= 300:
            tier = "Tier B: Major Advance"
            tier_label = "重大突破"
            tier_badge = "B"
        else:
            tier = "Tier C: Standard Contribution"
            tier_label = "重要贡献"
            tier_badge = "C"

        # 前端渲染节点大小建议 (30px ~ 75px)
        node_size = round(30.0 + (score / 100.0) * 45.0)

        return {
            "impact_score": score,
            "tier": tier,
            "tier_label": tier_label,
            "tier_badge": tier_badge,
            "node_size": node_size,
            "citations": citations,
            "influential_citations": influential,
            "annual_velocity": round(annual_velocity, 1),
            "influential_ratio": round(influential_ratio, 3)
        }

    def batch_evaluate(self, papers: List[Dict[str, Any]], centrality_map: Dict[str, float] = None) -> List[Dict[str, Any]]:
        """批量对论文列表进行影响力评估"""
        centrality_map = centrality_map or {}
        enriched_papers = []
        for paper in papers:
            paper_id = paper.get("arxiv_id") or paper.get("id") or paper.get("title")
            centrality = centrality_map.get(paper_id, 0.0)
            impact = self.evaluate_paper(paper, network_centrality=centrality)
            merged = {**paper, "impact": impact}
            enriched_papers.append(merged)
        return enriched_papers
