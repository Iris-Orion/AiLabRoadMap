"""
src/pipeline.py
端到端主处理管线。
串联采集 -> 补全 -> 深度 FAQ 生成 -> 主题分类 -> 影响力评估 -> DAG 拓扑提取 -> 导出 graph_data.json
"""

import os
import sys
import json
import argparse
from pathlib import Path

# 保证能导入上级 tools 和本地 src
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.faq_generator import FAQGenerator
from src.topic_classifier import TopicClassifier
from src.impact_evaluator import ImpactEvaluator
from src.lineage_builder import LineageBuilder


class DeepMindRoadmapPipeline:
    """DeepMind 研究演化路线图总管线"""

    def __init__(self, use_offline_data: bool = False, max_papers: int = 50):
        self.use_offline_data = use_offline_data
        self.max_papers = max_papers
        self.faq_gen = FAQGenerator()
        self.classifier = TopicClassifier()
        self.evaluator = ImpactEvaluator()
        self.lineage_builder = LineageBuilder()

    def run(self, output_path: str = "data/graph_data.json") -> str:
        print("=" * 65)
        print(">>> 启动 DeepMind Research Roadmap 自动化数据生成管线 <<<")
        print("=" * 65)

        # 1. 获取论文数据
        papers = self._load_initial_papers()
        if self.max_papers and len(papers) > self.max_papers:
            papers = papers[:self.max_papers]
        print(f"[*] 阶段 1: 成功载入 {len(papers)} 篇待处理核心论文。")

        # 2. 尝试调用 S2 与 arXiv 补充数据（若工具就绪）
        papers = self._enrich_papers(papers)
        print(f"[*] 阶段 2: 完成学术元数据与引用数据补全。")

        # 3. 生成参考 CoolPapers 的 6 维结构化 FAQ
        print("[*] 阶段 3: 开始提炼 6 维深度 FAQ (CoolPapers Style)...")
        for i, p in enumerate(papers, 1):
            faq = self.faq_gen.generate_faq(p)
            p["faq"] = faq
            print(f"    [{i}/{len(papers)}] FAQ 就绪: {p.get('title', '')[:40]}...")

        # 4. 智能领域分类与多标签打标
        print("[*] 阶段 4: 进行语义多标签主题分类...")
        for p in papers:
            topic_info = self.classifier.classify(p, faq=p.get("faq"))
            p["topic"] = topic_info

        # 5. 初步构建 DAG 以获取网络中心度
        print("[*] 阶段 5: 抽取内部引用拓扑网络与计算中心度...")
        initial_graph = self.lineage_builder.build_lineage_graph(papers)
        centrality_map = initial_graph.get("centrality_map", {})

        # 6. 多维影响力加权综合评估
        print("[*] 阶段 6: 计算多维学术影响力综合得分 (0~100)...")
        papers = self.evaluator.batch_evaluate(papers, centrality_map=centrality_map)

        # 7. 最终生成完整 DAG 与前端适配格式
        final_graph = self.lineage_builder.build_lineage_graph(papers)
        nodes = final_graph.get("nodes", [])
        edges = final_graph.get("edges", [])
        meta = final_graph.get("meta", {})

        result_payload = {
            "meta": meta,
            "nodes": nodes,
            "edges": edges
        }

        # 导出文件到 data/graph_data.json
        out_file = Path(output_path)
        out_file.parent.mkdir(parents=True, exist_ok=True)
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(result_payload, f, ensure_ascii=False, indent=2)

        # 同时同步一份到 frontend/public/data/graph_data.json 供前端静态或热加载
        frontend_data = Path("frontend/public/data/graph_data.json")
        frontend_data.parent.mkdir(parents=True, exist_ok=True)
        with open(frontend_data, "w", encoding="utf-8") as f:
            json.dump(result_payload, f, ensure_ascii=False, indent=2)

        print(f"\n[+] 成果成功导出至: {output_path} 以及 {frontend_data}")
        print(f"    - 包含论文节点: {len(nodes)} 个")
        print(f"    - 内部引用演化边: {len(edges)} 条")
        print("=" * 65)
        return str(out_file)


    def _load_initial_papers(self):
        """优先从 tools.deepmind_scraper 导入种子或抓取数据，或加载内置种子"""
        try:
            from tools.deepmind_scraper import DeepMindScraper
            scraper = DeepMindScraper()
            return scraper.get_papers(limit=self.max_papers, use_cache=True)
        except Exception as e:
            print(f"[Pipeline] 未能从 deepmind_scraper 读取，使用内置里程碑种子集: {e}")
            return self._get_fallback_seed_papers()

    def _enrich_papers(self, papers):
        """使用 S2 和 arXiv 客户端补充引用及摘要"""
        try:
            from tools.semantic_scholar_client import SemanticScholarClient
            from tools.arxiv_client import ArxivClient
            s2 = SemanticScholarClient()
            arxiv = ArxivClient()

            for p in papers:
                aid = p.get("arxiv_id")
                # 补全 arXiv
                if aid and not p.get("abstract"):
                    meta = arxiv.get_paper_metadata(aid)
                    if meta:
                        p["abstract"] = p.get("abstract") or meta.get("abstract")
                        p["categories"] = meta.get("categories", [])
                        p["pdf_url"] = meta.get("pdf_url")
                # 补全 S2 引用
                if aid and not p.get("citationCount"):
                    s2_data = s2.get_paper_details(f"ARXIV:{aid}")
                    if s2_data:
                        p["citationCount"] = s2_data.get("citationCount", p.get("citationCount", 0))
                        p["influentialCitationCount"] = s2_data.get("influentialCitationCount", p.get("influentialCitationCount", 0))
                        p["references"] = s2_data.get("references", [])
        except Exception as e:
            print(f"[Pipeline] 外部 API 补全跳过或完成: {e}")
        return papers

    def _get_fallback_seed_papers(self):
        """高质量的 DeepMind 历史里程碑种子数据集（跨越 2013-2024 代表作）"""
        return [
            {
                "id": "1312.5602",
                "arxiv_id": "1312.5602",
                "title": "Playing Atari with Deep Reinforcement Learning (DQN)",
                "authors": ["Volodymyr Mnih", "Koray Kavukcuoglu", "David Silver", "Alex Graves", "Ioannis Antonoglou", "Daan Wierstra", "Martin Riedmiller"],
                "year": 2013,
                "citationCount": 18500,
                "influentialCitationCount": 2400,
                "abstract": "We present the first deep learning model to successfully learn control policies directly from high-dimensional sensory input using reinforcement learning.",
                "lineage_predecessors": []
            },
            {
                "id": "1509.06461",
                "arxiv_id": "1509.06461",
                "title": "Deep Reinforcement Learning with Double Q-learning",
                "authors": ["Hado van Hasselt", "Arthur Guez", "David Silver"],
                "year": 2015,
                "citationCount": 6200,
                "influentialCitationCount": 850,
                "abstract": "The popular Q-learning algorithm is known to overestimate action values. In this paper we show that Double Q-learning can be adapted to scale to large-scale deep neural networks.",
                "lineage_predecessors": ["1312.5602"]
            },
            {
                "id": "1511.05952",
                "arxiv_id": "1511.05952",
                "title": "Prioritized Experience Replay",
                "authors": ["Tom Schaul", "John Quan", "Ioannis Antonoglou", "David Silver"],
                "year": 2015,
                "citationCount": 5400,
                "influentialCitationCount": 780,
                "abstract": "Experience replay lets online reinforcement learning agents remember and reuse experiences from the past. In this work we develop a framework for prioritizing experience replay.",
                "lineage_predecessors": ["1312.5602"]
            },
            {
                "id": "alphago-2016",
                "arxiv_id": "alphago-nature",
                "title": "Mastering the Game of Go with Deep Neural Networks and Tree Search (AlphaGo)",
                "authors": ["David Silver", "Aja Huang", "Chris J. Maddison", "Arthur Guez", "Laurent Sifre", "George van den Driessche", "Julian Schrittwieser", "Ioannis Antonoglou", "Demis Hassabis"],
                "year": 2016,
                "citationCount": 16000,
                "influentialCitationCount": 2100,
                "abstract": "We introduce a new approach to computer Go that uses 'value networks' to evaluate board positions and 'policy networks' to select moves trained by reinforcement learning and MCTS.",
                "lineage_predecessors": ["1312.5602"]
            },
            {
                "id": "1609.03499",
                "arxiv_id": "1609.03499",
                "title": "WaveNet: A Generative Model for Raw Audio",
                "authors": ["Aaron van den Oord", "Sander Dieleman", "Heiga Zen", "Karen Simonyan", "Oriol Vinyals", "Alex Graves", "Nal Kalchbrenner", "Andrew Senior", "Koray Kavukcuoglu"],
                "year": 2016,
                "citationCount": 8900,
                "influentialCitationCount": 1250,
                "abstract": "This paper presents WaveNet, a deep neural network for generating raw audio waveforms based on dilated causal convolutions.",
                "lineage_predecessors": []
            },
            {
                "id": "1712.01815",
                "arxiv_id": "1712.01815",
                "title": "Mastering Chess and Shogi by Self-Play with a General Reinforcement Learning Algorithm (AlphaZero)",
                "authors": ["David Silver", "Thomas Hubert", "Julian Schrittwieser", "Ioannis Antonoglou", "Matthew Lai", "Arthur Guez", "Marc Lanctot", "Laurent Sifre", "Demis Hassabis"],
                "year": 2017,
                "citationCount": 5100,
                "influentialCitationCount": 820,
                "abstract": "The game of chess is the most widely studied domain in the history of AI. AlphaZero achieves superhuman performance starting from tabula rasa with a single unified algorithm.",
                "lineage_predecessors": ["alphago-nature"]
            },
            {
                "id": "1911.08265",
                "arxiv_id": "1911.08265",
                "title": "Mastering Atari, Go, Chess and Shogi by Planning with a Learned Model (MuZero)",
                "authors": ["Julian Schrittwieser", "Ioannis Antonoglou", "Thomas Hubert", "Karen Simonyan", "Laurent Sifre", "Simon Schmitt", "Arthur Guez", "David Silver"],
                "year": 2019,
                "citationCount": 2400,
                "influentialCitationCount": 420,
                "abstract": "We present the MuZero algorithm which, by combining a tree-based search with a learned model, achieves superhuman performance in visual and board games without any knowledge of the rules.",
                "lineage_predecessors": ["1712.01815", "1312.5602"]
            },
            {
                "id": "alphafold2-nature",
                "arxiv_id": "alphafold2-nature",
                "title": "Highly accurate protein structure prediction with AlphaFold (AlphaFold 2)",
                "authors": ["John Jumper", "Richard Evans", "Alexander Pritzel", "Tim Green", "Michael Figurnov", "Olaf Ronneberger", "Kathryn Tunyasuvunakool", "Demis Hassabis"],
                "year": 2021,
                "citationCount": 28500,
                "influentialCitationCount": 4500,
                "abstract": "We demonstrate that AlphaFold predicts 3D structures of proteins with atomic accuracy even when no similar structure is known, solving a 50-year-old challenge in biology.",
                "lineage_predecessors": []
            },
            {
                "id": "2203.15556",
                "arxiv_id": "2203.15556",
                "title": "Training Compute-Optimal Large Language Models (Chinchilla)",
                "authors": ["Jordan Hoffmann", "Sebastian Borgeaud", "Arthur Mensch", "Elena Buchatskaya", "Trevor Cai", "Eliza Rutherford", "Diego de Las Casas", "Lisa Anne Hendricks", "Johannes Welbl", "Aidan Clark"],
                "year": 2022,
                "citationCount": 3800,
                "influentialCitationCount": 920,
                "abstract": "We investigate the optimal model size and number of tokens for training a transformer language model under a given compute budget, establishing compute-optimal scaling laws.",
                "lineage_predecessors": []
            },
            {
                "id": "2205.06175",
                "arxiv_id": "2205.06175",
                "title": "A Generalist Agent (Gato)",
                "authors": ["Scott Reed", "Konrad Zolna", "Emilio Parisotto", "Sergio Gomez Colmenarejo", "Alexander Novikov", "Gabriel Barth-Maron", "Mai Gimenez", "Marko Sulsky", "Jackie Kay", "Jost Tobias Springenberg"],
                "year": 2022,
                "citationCount": 1600,
                "influentialCitationCount": 310,
                "abstract": "Inspired by progress in large-scale language modelling, we apply a similar approach towards building a single generalist agent beyond the realm of text outputs.",
                "lineage_predecessors": ["2203.15556", "1911.08265"]
            },
            {
                "id": "2212.14704",
                "arxiv_id": "2212.14704",
                "title": "GraphCast: Learning skillful medium-range global weather forecasting",
                "authors": ["Remi Lam", "Alvaro Sanchez-Gonzalez", "Matthew Willson", "Peter Wirnsberger", "Meire Fortunato", "Ferran Alet", "Suman Ravuri", "Alexander Pritzel", "Peter Battaglia"],
                "year": 2022,
                "citationCount": 1100,
                "influentialCitationCount": 260,
                "abstract": "GraphCast is a machine learning-based weather forecasting system that makes 10-day global forecasts in under a minute with higher accuracy than ECMWF gold-standard numerical models.",
                "lineage_predecessors": []
            },
            {
                "id": "2312.11805",
                "arxiv_id": "2312.11805",
                "title": "Gemini: A Family of Highly Capable Multimodal Models",
                "authors": ["Gemini Team", "Google DeepMind"],
                "year": 2023,
                "citationCount": 4200,
                "influentialCitationCount": 890,
                "abstract": "We present Gemini, a family of highly capable multimodal models trained jointly across image, audio, video, and text data. Gemini Ultra exceeds human experts on MMLU benchmark.",
                "lineage_predecessors": ["2203.15556", "2205.06175"]
            },
            {
                "id": "2401.09640",
                "arxiv_id": "2401.09640",
                "title": "Solving olympiad geometry without human demonstrations (AlphaGeometry)",
                "authors": ["Trieu H. Trinh", "Yuhuai Wu", "Quoc V. Le", "He He", "Thang Luong"],
                "year": 2024,
                "citationCount": 650,
                "influentialCitationCount": 180,
                "abstract": "AlphaGeometry is a neuro-symbolic system that solves complex olympiad geometry problems without human demonstrations, approaching the performance of an International Mathematical Olympiad gold medalist.",
                "lineage_predecessors": ["2312.11805"]
            },
            {
                "id": "alphafold3-nature",
                "arxiv_id": "alphafold3-nature",
                "title": "Accurate structure prediction of biomolecular interactions with AlphaFold 3",
                "authors": ["Josh Abramson", "Jonas Adler", "Jack Dunger", "Richard Evans", "Tim Green", "Alexander Pritzel", "Olaf Ronneberger", "John Jumper", "Demis Hassabis"],
                "year": 2024,
                "citationCount": 1400,
                "influentialCitationCount": 320,
                "abstract": "AlphaFold 3 predicts the 3D structures and interactions of all life's molecules: proteins, DNA, RNA, ligands, and ions, powered by a Diffusion-based architecture.",
                "lineage_predecessors": ["alphafold2-nature"]
            }
        ]


def main():
    parser = argparse.ArgumentParser(description="DeepMind Research Roadmap Pipeline")
    parser.add_argument("--output", default="data/graph_data.json", help="输出图谱 JSON 文件路径")
    parser.add_argument("--limit", type=int, default=50, help="处理论文数量上限")
    parser.add_argument("--offline", action="store_true", help="强制使用本地/内置离线种子数据")
    args = parser.parse_args()

    pipeline = DeepMindRoadmapPipeline(use_offline_data=args.offline, max_papers=args.limit)
    pipeline.run(output_path=args.output)


if __name__ == "__main__":
    main()
