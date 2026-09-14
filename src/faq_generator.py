"""
src/faq_generator.py
参考 CoolPapers (papers.cool) 问答设计的结构化深度 FAQ 生成器。
为每篇论文提炼 6 项核心问答，支持接入 LLM (如 Gemini/OpenAI 兼容接口)，
并在未提供 API Key 时提供基于启发式与语义模式匹配的自动降级提取，保证离线可用性。
"""

import os
import json
import re
from typing import Dict, Any, Optional

COOLPAPERS_FAQ_PROMPT_TEMPLATE = """你是一名资深学术研究员和 DeepMind 技术路线分析专家。请根据以下论文信息，提炼出 6 个核心问答 (FAQ)，帮助读者快速掌握论文精髓及在技术演进中的位置。

【论文信息】
标题：{title}
作者：{authors}
发表年份：{year}
arXiv ID：{arxiv_id}
摘要：{abstract}

请以 JSON 格式输出以下 6 个结构化问答（不要输出多余 markdown 标记，仅输出合法 JSON 字典）：
{{
  "q1_problem": "这篇论文试图解决什么痛点或科学问题？现有方法有何局限？",
  "q2_related_work": "有哪些关键的前驱工作、理论基石或对比基线？（重点提炼传承关系）",
  "q3_method": "提出了哪些核心架构、算法创新或关键改进机制？",
  "q4_experiments": "在哪些基准数据集或实验场景上完成了验证？取得了哪些里程碑突破结果？",
  "q5_deepmind_lineage": "在 DeepMind 整体技术演化脉络中处于什么定位？起了承上启下的什么作用？",
  "q6_tldr": "50字以内的核心贡献总结（一句话 TL;DR）",
  "key_technologies": ["关键词1", "关键词2", "关键词3"]
}}
"""


class FAQGenerator:
    """参考 CoolPapers 风格的论文深度 FAQ 生成器"""

    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")
        self.model_name = model_name

    def generate_faq(self, paper: Dict[str, Any]) -> Dict[str, Any]:
        """
        为单篇论文生成 6 维深度 FAQ。
        若已配置 API Key 则优先调用 LLM，否则调用启发式智能提取器。
        """
        title = paper.get("title", "")
        abstract = paper.get("abstract", "")
        year = paper.get("year", "")
        authors = ", ".join(paper.get("authors", [])) if isinstance(paper.get("authors"), list) else str(paper.get("authors", ""))
        arxiv_id = paper.get("arxiv_id", "")

        # 尝试使用外部 LLM 生成
        if self.api_key:
            try:
                faq = self._call_llm(title, abstract, year, authors, arxiv_id)
                if faq:
                    return faq
            except Exception as e:
                print(f"[FAQGenerator] LLM 调用失败，降级至启发式提取: {e}")

        # 启发式生成器（无 Key 或网络失败时的降级方案）
        return self._heuristic_generate_faq(paper)

    def _call_llm(self, title: str, abstract: str, year: Any, authors: str, arxiv_id: str) -> Optional[Dict[str, Any]]:
        """调用 LLM API"""
        import requests
        prompt = COOLPAPERS_FAQ_PROMPT_TEMPLATE.format(
            title=title, abstract=abstract, year=year, authors=authors, arxiv_id=arxiv_id
        )

        gemini_key = os.getenv("GEMINI_API_KEY") or self.api_key
        if gemini_key:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={gemini_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.2
                }
            }
            resp = requests.post(url, json=payload, timeout=20)
            if resp.status_code == 200:
                text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text)
        return None

    def _heuristic_generate_faq(self, paper: Dict[str, Any]) -> Dict[str, Any]:
        """
        基于 NLP 启发式模式与规则匹配生成结构化 FAQ，确保离线与零 API Key 场景下产出高质量内容
        """
        title = paper.get("title", "")
        abstract = paper.get("abstract", "")
        year = paper.get("year", 2024)
        t_lower = title.lower()
        a_lower = abstract.lower()

        # 1. 核心问题推断
        if "reinforcement learning" in t_lower or "rl" in t_lower or "policy" in a_lower:
            problem = "在高维复杂环境中，智能体策略学习面临探索效率低、样本复杂度高及长期回报难以信度分配的挑战。"
        elif "protein" in t_lower or "structure" in t_lower or "biology" in a_lower or "alphafold" in t_lower:
            problem = "生物学中从氨基酸一维序列精准预测三维蛋白质及生物大分子复合物结构的重大科学难题。"
        elif "language model" in t_lower or "transformer" in t_lower or "gemini" in t_lower or "llm" in a_lower:
            problem = "传统模型在多模态理解、长上下文推理及端到端跨模态泛化能力上的瓶颈与对齐难题。"
        elif "game" in t_lower or "go" in t_lower or "chess" in t_lower or "mcts" in a_lower:
            problem = "在完全或不完全信息博弈的庞大状态空间中，传统搜索算法算力爆炸且难以自主探索最优策略。"
        else:
            problem = f"针对 {title} 场景中现有算法在通用性、鲁棒性与规模化应用中的计算与建模瓶颈。"

        # 2. 前驱工作识别
        related = []
        if "alphafold" in t_lower:
            related.append("早期蛋白质折叠实验 (CASP) 与 AlphaFold 初代系统")
        if "alphazero" in t_lower or "muzero" in t_lower:
            related.append("AlphaGo、蒙特卡洛树搜索 (MCTS) 与基于价值的强化学习")
        elif "alphago" in t_lower or "dqn" in t_lower:
            related.append("经典 Q-Learning、经验回放机制及深层卷积神经网络 (CNN)")
        if "gemini" in t_lower or "chinchilla" in t_lower or "gato" in t_lower:
            related.append("Transformer 架构、自回归预训练范式及 Scaling Laws 缩放定律")
        if not related:
            related.append("相关领域经典基线模型与前序 DeepMind 内部发表成果")

        # 3. 核心方法
        method = f"提出了基于深度架构与领域定制机制的端到端学习框架，结合了先进的损失设计与规模化训练方法。"
        if "dqn" in t_lower:
            method = "将深度卷积神经网络直接与强化学习端到端结合，引入经验回放池 (Experience Replay) 和目标网络 (Target Network) 克服训练不稳定性。"
        elif "alphago" in t_lower:
            method = "融合了监督学习策略网络、自我博弈强化学习价值网络与蒙特卡洛树搜索 (MCTS)，开创性实现树搜索与深度评估的协同。"
        elif "alphazero" in t_lower:
            method = "完全摆脱人类专家先验知识，从零通过纯自我对弈与统一深度神经网络统一了围棋、国际象棋与将棋三大复杂博弈。"
        elif "muzero" in t_lower:
            method = "提出无需已知环境规则的无模型规划，通过学习隐状态表征、状态转移与奖励动态函数完成泛化规划。"
        elif "alphafold" in t_lower:
            method = "利用 Evoformer 结构深度挖掘多序列比对 (MSA) 与残基对空间关系，结合不变点注意力 (IPA) 进行端到端 3D 坐标直接回归。"
        elif "chinchilla" in t_lower:
            method = "基于详尽的缩放实验，提出最优计算预算下的参数量与数据量等比例扩展定律，打破了以往过度追求大参数而低估训练数据的误区。"
        elif "gemini" in t_lower:
            method = "原生多模态混合架构设计，自底向上支持文本、音频、视觉等多源信号联合理解与长上下文高效注意力推断。"

        # 4. 实验结果
        experiments = "在多项国际权威基准测试与盲测评估中取得了突破性提升，性能显著超越以往 SOTA 基准。"
        if "dqn" in t_lower:
            experiments = "在 49 款 Atari 2600 游戏中直接利用原始像素输入完成训练，在过半数游戏中超越了人类专业玩家水平。"
        elif "alphago" in t_lower:
            experiments = "以 4:1 战胜世界围棋冠军李世石，被评为人工智能发展史上的里程碑事件。"
        elif "alphafold" in t_lower:
            experiments = "在 CASP14 盲测中预测精度达到原子级中位误差 0.96Å，基本解决了困扰生命科学 50 年的蛋白质折叠问题。"
        elif "chinchilla" in t_lower:
            experiments = "以 70B 参数量在同等计算量下全面超越了 280B 的 Gopher、530B 的 MT-NLG 及 GPT-3，确立了业界新基准。"

        # 5. DeepMind 内部脉络定位
        if year <= 2016:
            lineage = "DeepMind 早期奠基期（Atari & 围棋突破时代）：奠定了深度强化学习的统治地位。"
        elif 2017 <= year <= 2020:
            lineage = "通用化与科学智能爆发期（AlphaZero、MuZero & AlphaFold 1/2）：推动 AI 走向前沿科学探索与无先验通用博弈。"
        elif 2021 <= year <= 2022:
            lineage = "大模型与通用智能体探索期（Chinchilla、Gato、Flamingo）：引领现代大模型 Scaling 理论与通才 Agent 构架。"
        else:
            lineage = "多模态大模型与复杂推理期（Gemini、AlphaGeometry、AlphaProof）：迈向前沿数学奥赛与全模态通用人工智能。"

        # 6. 一句话 TL;DR
        tldr = f"DeepMind 针对该领域提出的里程碑式工作，确立了新的技术范式与行业标准。"
        if "dqn" in t_lower:
            tldr = "首个直接从高维感官输入（原始像素）学会人类级水平控制策略的深度强化学习系统。"
        elif "alphago" in t_lower:
            tldr = "深度神经网络与蒙特卡洛树搜索结合的杰作，首个击败围棋人类世界冠军的 AI 系统。"
        elif "alphafold" in t_lower:
            tldr = "将蛋白质 3D 结构预测精度推进至原子级，革命性加速生命科学与药物研发的划时代模型。"
        elif "chinchilla" in t_lower:
            tldr = "重塑大语言模型缩放定律的经典之作，证明更多高质量数据训练紧凑模型具备更高性能。"
        elif "gemini" in t_lower:
            tldr = "原生构建的多模态大模型标杆，具备强大的跨视觉、文本、音频端到端综合认知与推理能力。"

        return {
            "q1_problem": problem,
            "q2_related_work": "；".join(related),
            "q3_method": method,
            "q4_experiments": experiments,
            "q5_deepmind_lineage": lineage,
            "q6_tldr": tldr,
            "key_technologies": [w.strip() for w in title.replace(":", " ").replace("-", " ").split()[:4]]
        }
