"""
src/topic_classifier.py
论文主题与领域多标签分类器。
结合论文元数据、arXiv 分类及 FAQ 语义特征，
输出主领域（Primary Topic）、细分标签（Tags）及对应的可视化配色方案。
"""

import re
from typing import Dict, Any, List

TOPIC_METADATA = {
    "Reinforcement Learning": {
        "color": "#3B82F6",  # 科技蓝
        "badge": "RL",
        "description": "强化学习理论、探索策略与策略优化算法"
    },
    "Game AI & Planning": {
        "color": "#8B5CF6",  # 紫色
        "badge": "Game AI",
        "description": "围棋、国际象棋、星际等复杂博弈与自我对弈规划"
    },
    "AI for Science & Biology": {
        "color": "#10B981",  # 翠绿
        "badge": "Sci-AI",
        "description": "蛋白质结构预测、生物大分子、核聚变与气象预测"
    },
    "Foundation Models & Multimodal": {
        "color": "#F59E0B",  # 琥珀橙
        "badge": "LLM/Multi",
        "description": "多模态大模型、Transformer 变体、缩放定律与智能体"
    },
    "Robotics & Embodied AI": {
        "color": "#EC4899",  # 粉红
        "badge": "Robotics",
        "description": "具身智能、机械臂操控与多任务通用智能体"
    },
    "Mathematical & Formal Reasoning": {
        "color": "#6366F1",  # 靛蓝
        "badge": "Reasoning",
        "description": "形式化数学证明、几何解题与代码搜索推理"
    },
    "Foundational Deep Learning & Theory": {
        "color": "#6B7280",  # 灰色
        "badge": "Theory",
        "description": "表征学习、优化理论与通用深度学习架构"
    }
}


class TopicClassifier:
    """基于语义规则与特征增强的主题分类器"""

    def classify(self, paper: Dict[str, Any], faq: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        对单篇论文进行领域分类与打标
        返回格式：
        {
            "primary_topic": "AI for Science & Biology",
            "color": "#10B981",
            "badge": "Sci-AI",
            "tags": ["AlphaFold", "Protein Folding", "Structural Biology"]
        }
        """
        title = paper.get("title", "").lower()
        abstract = paper.get("abstract", "").lower()
        categories = paper.get("categories", [])
        if isinstance(categories, str):
            categories = [c.strip() for c in categories.split(",")]
        faq_text = ""
        if faq:
            faq_text = f"{faq.get('q1_problem', '')} {faq.get('q3_method', '')}".lower()

        combined_text = f"{title} {abstract} {faq_text}"

        scores = {topic: 0 for topic in TOPIC_METADATA.keys()}
        tags = set()

        # 规则打分矩阵
        # 1. Science & Biology
        if any(w in combined_text for w in ["protein", "alphafold", "biology", "molecule", "amino acid", "crystal", "weather", "graphcast", "dna"]):
            scores["AI for Science & Biology"] += 10
            tags.add("Science AI")
            if "protein" in combined_text or "alphafold" in combined_text:
                tags.add("Structural Biology")
            if "weather" in combined_text or "graphcast" in combined_text:
                tags.add("Climate & Weather")

        # 2. Game AI & Planning
        if any(w in combined_text for w in ["alphago", "alphazero", "muzero", "chess", "shogi", "go ", "starcraft", "game", "mcts", "tree search"]):
            scores["Game AI & Planning"] += 8
            tags.add("Game AI")
            if "mcts" in combined_text or "search" in combined_text:
                tags.add("Planning & Search")

        # 3. Reinforcement Learning
        if any(w in combined_text for w in ["reinforcement learning", "q-learning", "policy gradient", "dqn", "actor-critic", "atari", "reward"]):
            scores["Reinforcement Learning"] += 7
            tags.add("Reinforcement Learning")
            if "dqn" in combined_text or "deep q" in combined_text:
                tags.add("Deep Q-Networks")

        # 4. Foundation Models & Multimodal
        if any(w in combined_text for w in ["gemini", "language model", "chinchilla", "scaling law", "transformer", "multimodal", "gato", "flamingo", "llm"]):
            scores["Foundation Models & Multimodal"] += 8
            tags.add("Foundation Models")
            if "multimodal" in combined_text or "vision-language" in combined_text:
                tags.add("Multimodal")
            if "scaling" in combined_text:
                tags.add("Scaling Laws")

        # 5. Robotics & Embodied AI
        if any(w in combined_text for w in ["robot", "manipulation", "locomotion", "embodied", "rt-1", "rt-2"]):
            scores["Robotics & Embodied AI"] += 8
            tags.add("Robotics")
            tags.add("Embodied AI")

        # 6. Reasoning & Math
        if any(w in combined_text for w in ["alphageometry", "alphaproof", "geometry", "theorem", "imo", "formal proof", "olympiad"]):
            scores["Mathematical & Formal Reasoning"] += 9
            tags.add("Mathematical Reasoning")
            tags.add("Formal Verification")

        # 选取最高分领域
        best_topic = max(scores, key=scores.get)
        if scores[best_topic] == 0:
            best_topic = "Foundational Deep Learning & Theory"
            tags.add("Deep Learning")

        meta = TOPIC_METADATA.get(best_topic, TOPIC_METADATA["Foundational Deep Learning & Theory"])

        return {
            "primary_topic": best_topic,
            "color": meta["color"],
            "badge": meta["badge"],
            "description": meta["description"],
            "tags": sorted(list(tags))
        }
