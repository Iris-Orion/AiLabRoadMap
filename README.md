# AiLabRoadMap

> **Interactive Technical Roadmaps & Milestone Lineage Hub for Top Global AI Research Labs**  
> **全球顶尖 AI 实验室技术演进图谱与学术研读中枢**

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success?logo=github)](https://iris-orion.github.io/AiLabRoadMap/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Frontend-Vite%20%2B%20TypeScript-646CFF.svg)](https://vitejs.dev/)
[![Cytoscape](https://img.shields.io/badge/Graph-Cytoscape.js-0074D9.svg)](https://js.cytoscape.org/)
[![CoolPapers](https://img.shields.io/badge/Powered%20By-CoolPapers-10B981.svg)](https://papers.cool/)
[![i18n](https://img.shields.io/badge/Language-English%20%7C%20%E4%B8%AD%E6%96%87-8B5CF6.svg)](#)

> 🔗 **在线访问入口 (Live Demo)**: **[https://iris-orion.github.io/AiLabRoadMap/](https://iris-orion.github.io/AiLabRoadMap/)**

---

## 📖 项目愿景 (Vision)

**AiLabRoadMap** 是一个面向全球人工智能研究者、算法工程师与学术爱好者的开源知识平台。旨在系统性梳理世界顶尖 AI 研发机构的学术脉络、演化分支与技术跃迁路径，打通从底层理论突破到产品级基础模型的完整传承演进。

当代人工智能技术爆炸式演进，传统文献库往往局限于零散列表展示，存在**学术时滞性**、**演化关系模糊**及**研读理解成本高**等痛点。AiLabRoadMap 结合有向无环拓扑图谱（DAG）、多维综合影响力评级以及 [CoolPapers (papers.cool)](https://papers.cool) 深度研读体验，为每一篇核心文献提供全方位的技术全景定位。

---

## 🏛️ 实验室矩阵规划 (AI Labs Directory)

AiLabRoadMap 采用模块化多实验室架构设计，目前正持续编纂全球顶尖实验室的技术脉络：

| 实验室 | 状态 | 核心研究范式 / 战略定位 | 代表性成果脉络 |
| :--- | :---: | :--- | :--- |
| **Google DeepMind** | **🟢 已上线 (Live)** | 深度强化学习超人博弈、科学智能 (AI for Science) 与超级智能 (AGI/ASI) 理论架构 | DQN, AlphaGo, AlphaFold 1/2/3, Gemini 1.5, GraphCast, RoboCat, From AGI to ASI, Visual General Intelligence (VGI) |
| **OpenAI** | ⏳ 规划建设中 | 生成式预训练 (GPT)、扩展假说 (Scaling Laws)、RLHF 人类偏好对齐与测试时强化学习推理 | GPT-1~4o, ChatGPT, OpenAI o1 (Strawberry), Sora, CLIP, DALL-E 3, InstructGPT, Gym |
| **Anthropic** | ⏳ 规划建设中 | 宪法式人工智能 (Constitutional AI / RLAIF)、神经网络机械可解释性与前沿安全防御审计 | Claude 3.5 Sonnet, Constitutional AI, Monosemanticity, Sleeper Agents, Toy Models of Superposition |
| **Meta AI (FAIR)** | ⏳ 规划建设中 | 全球开源基座大模型生态、通用计算机视觉表征与工业级深度学习软件基石 | LLaMA 1~3.1 405B, Segment Anything (SAM 2), DINOv2, PyTorch, SeamlessM4T, OPT |
| **Microsoft Research** | ⏳ 规划建设中 | 高质量合成数据小语言模型 (SLM)、分布式系统训练优化与多智能体编排生态 | Phi-1~3.5, Orca 1/2, DeepSpeed Engine, AutoGen, GraphRAG, ResNet Heritage |

> *注：当前工程已完整集成 **Google DeepMind** 作为首个核心子集（涵盖 2013-2026 年共 262 篇官方文献与 39 篇主干里程碑有向图谱）。其他实验室的数据正在加速录入中，欢迎社区共同共建！*

---

## ✨ 核心特性 (Key Features)

### 1. 🏛️ AI Labs 总览门户 (Labs Hub)
- 集中展示各研究机构的定位、核心范式与代表作，支持一键深入特定实验室的专属拓扑或研读库。
- 提供规划中实验室（OpenAI、Anthropic、Meta、MSR）的交互式路线图预告弹窗。

### 2. 🕸️ 交互式有向无环图谱 (Cytoscape DAG)
- 采用 `Cytoscape.js` + `dagre` 算法层级排布技术节点，箭头清晰表征学术衍生方向。
- **祖先溯源 (Predecessors)**：点击任意节点即刻以**橙黄高亮**追溯其理论根基与前驱工作。
- **后继衍生 (Successors)**：以**翠绿高亮**展现受其启发的后继研究与应用突破。
- 支持水平演进 (LR) 与垂直演进 (TB) 自由切换，支持时间线（2013-2026）滑动推演与顶尖成果聚焦。

### 3. 📚 262 篇全量论文研读库 (Publications Library)
- 完整收录 DeepMind 官方最新 262 篇成果，涵盖大语言模型与多模态、强化学习与智能体、具身智能与世界模型、科学智能、算法发现、前沿安全对齐等 6 大统一定义的研究领域。
- **双布局模式切换**：支持学者在**平铺卡片（Grid）**与**紧凑列表（List）**之间秒级切换，单屏高效检阅数十篇论文。
- 多条件联动筛选：按 Milestone 等级（Tier S/A/B/C）、发表年份与关键词全文检索。

### 4. ⚡ CoolPapers 6 维结构化深度 FAQ
- 每篇论文均深度联动 [CoolPapers](https://papers.cool/)，一键直达 Kimi 智能长文解读。
- 提炼 6 维标准化 FAQ，30 秒提炼学术精髓：
  - **Q1 [核心问题]**：试图攻克的科学痛点与既有算法局限；
  - **Q2 [演化脉络]**：直接传承的技术前驱与理论基石；
  - **Q3 [创新方法]**：提出的核心架构、损失函数或关键改进；
  - **Q4 [实验验证]**：测试基准与刷新 SOTA 的实验成效；
  - **Q5 [代际定位]**：在实验室技术演进代际中的战略地位；
  - **Q6 [TL;DR]**：一句话极简学术判词。

### 5. 🌟 科学多维度里程碑评级 (Milestone Tiers)
打破传统评价单纯依赖引用总量的“时间积累时滞性”，融合权威同行评议背书与范式革新补偿，科学划分为：
- **🌟 Tier S (划时代里程碑 · 92~100 分)**：颠覆全球学术范式或登上 *Nature/Science* 正刊（12 篇）；
- **🔷 Tier A (核心基石与重大突破 · 80~91 分)**：解决架构瓶颈、思维链机理或前沿对齐防御（16 篇）；
- **🟢 Tier B (重要前沿进展 · 68~79 分)**：垂直领域扎实突破（17 篇）；
- **⚪ Tier C (专业领域贡献 · 55~67 分)**：针对特定基准与消融验证的学术成果（217 篇）。

### 6. 🌐 全站中英文双语与双主题适配 (i18n & Themes)
- 全站文案、图例、说明文档与筛选标签 100% 支持中英文双语无缝切换。
- 提供典雅高对比度的**浅色学术主题**与沉浸式**暗色主题**，自动记忆用户偏好。

---

## 📂 项目工程架构 (Repository Structure)

```text
AiLabRoadMap/
├── data/                                 # 核心学术数据资产
│   ├── deepmind_all_publications.json    # DeepMind 262 篇官方文献元数据全集
│   ├── deepmind_publications_analysis.json# 分类聚类、演化脉络与 Milestone 评级分析结果
│   └── graph_data.json                   # Cytoscape 有向图谱节点与边定义
├── frontend/                             # 前端交互工程 (Vite + TypeScript)
│   ├── index.html                        # 主页面（AI Labs 总览、DAG 画布、文献库与抽屉）
│   ├── style.css                         # 全局学术风格样式（响应式、双主题、Grid/List 布局）
│   ├── show_result.ts                    # 核心调度逻辑（Cytoscape 拓扑、i18n、双视图与模态）
│   ├── package.json                      # 前端依赖配置
│   └── vite.config.ts                    # Vite 打包配置
├── src/                                  # 后端分析与数据流水线
│   ├── analyze_publications.py           # 官方文献分类、技术传承构建与影响力加权评估
│   ├── pipeline.py                       # 端到端学术数据提取、FAQ 提炼与图谱导出管线
│   ├── topic_classifier.py               # 6 大统一研究领域智能分类器
│   ├── impact_evaluator.py               # 多因子影响力计算模型
│   └── lineage_builder.py                # 传承关系构建引擎
├── tools/                                # 数据采集与权威学术接口工具层
│   ├── scrape_all_publications.py        # 官网全量成果自动化采集脚本
│   ├── semantic_scholar_client.py        # Semantic Scholar 官方接口客户端（带频控与磁盘缓存）
│   └── arxiv_client.py                   # arXiv 元数据与长文本检索客户端
├── requirements.txt                      # Python 依赖清单
├── .gitignore                            # 生产级敏感与构建忽略规范
└── README.md                             # 项目主说明文档
```

---

## 🚀 快速启动指南 (Quick Start)

### 1. 克隆仓库与准备环境
```bash
git clone https://github.com/Iris-Orion/AiLabRoadMap.git
cd AiLabRoadMap
```

### 2. 启动前端可视化服务
```bash
cd frontend
npm install
npm run dev
# 或进行生产环境构建与预览：
# npm run build
# npm run preview
```
打开浏览器访问控制台提示的地址（如 `http://localhost:5173`），即可进入 **AiLabRoadMap** 全景总览与 DeepMind 深度拓扑！

### 3. (可选) 重新运行数据采集与分析流水线
```bash
# 安装 Python 依赖
python -m venv .venv
source .venv/bin/activate  # Windows: .\.venv\Scripts\activate
pip install -r requirements.txt

# 运行数据分析与图谱构建
python src/analyze_publications.py
```

---

## 🤝 参与共建 (Contributing)

我们热忱欢迎全球研究者与开发者共同丰富 **AiLabRoadMap**！你可以通过以下方式参与：
1. **贡献新实验室数据**：提交 OpenAI、Anthropic、Meta FAIR 或 Microsoft Research 的关键论文清单与传承关系。
2. **完善技术拓扑连线**：针对现有节点补充更精确的理论前驱或后驱引用关系。
3. **优化评级与 FAQ**：对入选论文的 6 维 FAQ 解读与影响力评分提出修正建议。

欢迎提交 [Pull Requests](https://github.com/Iris-Orion/AiLabRoadMap/pulls) 或开启 [Issue](https://github.com/Iris-Orion/AiLabRoadMap/issues) 讨论！

---

## 📄 版权与免责声明 (License & Disclaimer)

- 本项目代码遵循 [MIT License](LICENSE) 开源许可协议。
- 所收录论文版权归属原作者及出版机构所有，本站所提供链接均直达官方出版页面、arXiv 原文与 CoolPapers 研读页面。
- 影响力评级与分析解读仅代表学术研究与可视化参考。
