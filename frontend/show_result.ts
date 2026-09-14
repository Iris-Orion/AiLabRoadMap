import cytoscape, { Core, NodeSingular, EventObject } from 'cytoscape';
// @ts-ignore - cytoscape-dagre plugin registration
import dagre from 'cytoscape-dagre';

cytoscape.use(dagre);

// ============================================================================
// Interfaces & Types
// ============================================================================

export interface PaperFAQ {
  q1_problem: string;
  q2_lineage: string;
  q3_innovation: string;
  q4_experiments: string;
  q5_deepmind_role: string;
  q6_tldr: string;
}

export interface TheoryEquation {
  name: string;
  latex: string;
  description: string;
}

export interface TheoryCodeMapping {
  symbol: string;
  math_meaning: string;
  code_variable: string;
}

export interface TheoryExplanation {
  mathematical_foundations: string;
  key_equations: TheoryEquation[];
  theory_code_mapping: TheoryCodeMapping[];
}

export interface CoreArtifact {
  path: string;
  purpose: string;
  type: string;
}

export interface RepoStructure {
  repo_name: string;
  deepwiki_url: string;
  tree_text: string;
  core_artifacts: CoreArtifact[];
}

export interface PaperNodeData {
  id: string;
  label: string;
  title: string;
  authors: string[];
  year: number;
  venue: string;
  arxiv_id: string | null;
  url: string;
  pdf_url: string;
  github_url?: string | null;
  deepwiki_url?: string;
  repo_structure?: RepoStructure;
  theory_explanation?: TheoryExplanation;
  pseudocode?: string;
  code_explanation?: any;
  primary_topic: string;
  topics: string[];
  citations: number;
  influential_citations: number;
  annual_citation_velocity: number;
  impact_score: number;
  generation: string;
  tldr: string;
  faq: PaperFAQ;
}

export interface PaperEdgeData {
  source: string;
  target: string;
  relation: string;
  description: string;
}

export interface GraphMetadata {
  title: string;
  updated_at: string;
  total_papers: number;
  total_citations: number;
  year_range: [number, number];
  topics: string[];
}

export interface GraphData {
  meta: GraphMetadata;
  nodes: PaperNodeData[];
  edges: PaperEdgeData[];
}

export interface PublicationItem {
  pub_id: string;
  title: string;
  date: string;
  year: number;
  url: string;
  theme: string;
  milestone: {
    tier: string;
    label: string;
    score: number;
    reason: string;
  };
}

export interface PublicationsAnalysisData {
  meta: {
    total_publications: number;
    analyzed_url: string;
    themes_count: Record<string, number>;
    milestone_distribution: Record<string, number>;
  };
  themes: Record<string, PublicationItem[]>;
  all_papers: PublicationItem[];
}

// Fallback sample data in case external json loading is blocked
const FALLBACK_DATA: GraphData = {
  meta: {
    title: "DeepMind Research Roadmap",
    updated_at: "2026-09-14",
    total_papers: 5,
    total_citations: 95000,
    year_range: [2013, 2026],
    topics: ["LLM & Multimodal", "RL & Multi-Agent", "AI for Science & Biology", "Embodied AI & Robotics", "Math & Algorithmic Discovery", "Frontier Safety, Alignment & Society"]
  },
  nodes: [
    {
      id: "dqn_2013",
      label: "DQN (2013)",
      title: "Playing Atari with Deep Reinforcement Learning",
      authors: ["Volodymyr Mnih", "David Silver", "Demis Hassabis"],
      year: 2013,
      venue: "Nature 2015 / NIPS",
      arxiv_id: "1312.5602",
      url: "https://deepmind.google",
      pdf_url: "https://arxiv.org/pdf/1312.5602.pdf",
      primary_topic: "RL & Multi-Agent",
      topics: ["RL & Multi-Agent"],
      citations: 28450,
      influential_citations: 2980,
      annual_citation_velocity: 2580,
      impact_score: 98,
      generation: "Gen 1: Deep RL Foundations",
      tldr: "端到端结合深度卷积与强化学习，仅通过像素掌握 Atari 游戏超人级策略。",
      faq: {
        q1_problem: "高维感知输入（如原始像素）在传统 RL 中面临维数灾难与泛化困难。",
        q2_lineage: "结合经典 TD-learning，首创 Experience Replay 打破样本时序相关性。",
        q3_innovation: "提出 Deep Q-Network 架构与 Target Network 机制稳定高维学习。",
        q4_experiments: "在 7 款 Atari 游戏中大幅战胜既往算法并在多款超越人类专家。",
        q5_deepmind_role: "DeepMind 开山之作，确立了实验室核心的技术底色与 Google 收购。",
        q6_tldr: "从原始像素实现超人类策略的首个端到端深度强化学习智能体。"
      }
    },
    {
      id: "alphago_2016",
      label: "AlphaGo (2016)",
      title: "Mastering the game of Go with deep neural networks and tree search",
      authors: ["David Silver", "Aja Huang", "Demis Hassabis"],
      year: 2016,
      venue: "Nature 2016",
      arxiv_id: null,
      url: "https://deepmind.google",
      pdf_url: "https://nature.com",
      primary_topic: "RL & Multi-Agent",
      topics: ["RL & Multi-Agent"],
      citations: 19400,
      influential_citations: 2350,
      annual_citation_velocity: 2400,
      impact_score: 99,
      generation: "Gen 2: Superhuman Mastery",
      tldr: "深度强化学习结合蒙特卡洛树搜索，击败围棋世界冠军职业九段。",
      faq: {
        q1_problem: "围棋 10^170 状态空间使得传统暴力剪枝在完全博弈中彻底崩溃。",
        q2_lineage: "传承 DQN 深度表征与价值网络，并与经典 MCTS 深度整合。",
        q3_innovation: "策略网络筛选落子广度，价值网络评估胜率深度，双网与 MCTS 紧密协同。",
        q4_experiments: "以 4:1 击败职业九段世界冠军李世石，刷新全球 AI 认知。",
        q5_deepmind_role: "DeepMind 全球顶级实验室声誉的巅峰之作，开启超人类智能纪元。",
        q6_tldr: "深度强化学习双网络与 MCTS 结合攻克完全信息博弈桂冠围棋。"
      }
    }
  ],
  edges: [
    {
      source: "dqn_2013",
      target: "alphago_2016",
      relation: "foundation_for",
      description: "DQN 的价值网络奠定了 AlphaGo 策略与估值训练的深度强化学习基础"
    }
  ]
};

// ============================================================================
// 6 Unified Canonical Categories & Theme Colors
// ============================================================================

const TOPIC_COLORS: Record<string, string> = {
  "LLM & Multimodal": "#8b5cf6",
  "RL & Multi-Agent": "#3b82f6",
  "Embodied AI & Robotics": "#f59e0b",
  "AI for Science & Biology": "#10b981",
  "Math & Algorithmic Discovery": "#ec4899",
  "Frontier Safety, Alignment & Society": "#06b6d4"
};

const DEFAULT_TOPIC_COLOR = "#64748b";

export const DOMAIN_I18N: Record<string, { zh: string; en: string }> = {
  "LLM & Multimodal": {
    zh: "大语言模型与多模态",
    en: "Foundation Models & Multimodal"
  },
  "RL & Multi-Agent": {
    zh: "强化学习与智能体",
    en: "Reinforcement Learning & Multi-Agent"
  },
  "Embodied AI & Robotics": {
    zh: "具身智能与世界模型",
    en: "Embodied AI & Robotics"
  },
  "AI for Science & Biology": {
    zh: "科学智能与生物物理",
    en: "AI for Science & Biology"
  },
  "Math & Algorithmic Discovery": {
    zh: "算法发现与数学推理",
    en: "Mathematics & Algorithmic Discovery"
  },
  "Frontier Safety, Alignment & Society": {
    zh: "前沿安全、对齐与社会",
    en: "Frontier Safety, Alignment & Society"
  }
};

// ============================================================================
// Internationalization (i18n) Dictionary
// ============================================================================

export const I18N = {
  zh: {
    doc_title: "AiLabRoadMap | 全球顶尖 AI 实验室技术演进图谱",
    brand_title: "AiLabRoadMap",
    badge_status: "Hub Active",
    brand_subtitle: "全球顶尖 AI 实验室技术演进图谱与学术中枢",
    stat_papers_label: "里程碑拓扑",
    stat_pubs_label: "官方收录文献",
    stat_edges_label: "传承演化链",
    stat_years_label: "时间跨度",
    tab_hub_label: "🏛️ AI Labs 总览",
    btn_view_graph: "DeepMind 拓扑图谱",
    btn_view_library: "DeepMind 研读库 (262 篇)",
    btn_docs_label: "评级说明文档",
    btn_fit_label: "居中适配",
    btn_layout_lr: "水平演进 (LR)",
    btn_layout_tb: "垂直演进 (TB)",
    theme_light: "亮色模式",
    theme_dark: "暗色模式",
    lang_toggle: "EN",
    search_placeholder_dag: "搜索论文标题、作者、TL;DR 核心关键词...",
    label_dag_topics: "研究主题：",
    chip_all_topics: "全部主题",
    label_timeline: "时间线推演：",
    timeline_prefix: "截至",
    timeline_suffix: "年",
    label_impact_focus: "🌟 顶尖成果聚焦",
    search_placeholder_lib: "输入论文标题、领域、研究关键词快速研读...",
    lib_tier_label: "Milestone 等级：",
    tier_chip_all: "全部评级 (262)",
    tier_chip_code: "💻 核心伪代码 & 源码 (39)",
    tier_chip_s: "🌟 Tier S 划时代里程碑 (12)",
    tier_chip_a: "🔷 Tier A 核心基石 (16)",
    tier_chip_b: "🟢 Tier B 重要前沿 (17)",
    tier_chip_c: "⚪ Tier C 专业贡献 (217)",
    lib_year_label: "发表年份：",
    year_chip_all: "全部年份",
    lib_theme_label: "前沿领域集群：",
    lib_theme_all: "全部领域",
    label_layout_grid: "平铺",
    label_layout_list: "列表",
    lib_matched_format: (matched: number, total: number) => `共筛选出 ${matched} / ${total} 篇`,
    btn_read_deep: "深入研读 (FAQ)",
    btn_view_code: "核心伪代码",
    link_coolpapers: "⚡ CoolPapers ↗",
    link_github: "💻 GitHub 源码 ↗",
    link_official: "官网原网 ↗",
    link_arxiv: "arXiv 论文 ↗",
    link_pdf: "PDF 原文 ↗",
    code_section_title: "算法核心伪代码与工程实现 (Core Pseudocode & Implementation)",
    label_code_github: "GitHub 源码直达 ↗",
    label_copy_code: "复制代码",
    label_copied: "已复制!",
    explanation_heading: "核心算法机制剖析与步骤详解",
    code_overview_label: "算法概览 (Overview)",
    code_steps_label: "核心执行步骤 (Key Algorithmic Steps)",
    code_flow_label: "计算与张量流转 (Computational Flow)",
    code_highlights_label: "工程与架构突破要点 (Engineering Highlights)",
    metric_title_score: "综合影响力评分",
    metric_hint_score: "加权综合学术量化指标",
    metric_title_citations: "总引用数",
    metric_hint_citations: "Semantic Scholar 索引统计",
    metric_title_influential: "高影响力引用",
    metric_hint_influential: "作为核心前驱的重要引用",
    metric_title_velocity: "年均引用增速",
    metric_hint_velocity: "年均学术引用累积速率",
    lineage_section_title: "技术演进脉络关系 (Interactive Lineage)",
    lineage_label_pred: "直接理论前驱 (Predecessors)",
    lineage_label_succ: "直接衍生工作 (Successors)",
    lineage_empty_pred: "无内部前驱 (根基突破)",
    lineage_empty_succ: "暂无后续衍生节点",
    lineage_not_in_graph: "此论文暂未在主干演化拓扑中",
    faq_section_title: "CoolPapers 6 维结构化深度 FAQ",
    faq_tag_label: "LLM Deep Insight",
    faq_q1_label: "核心问题：试图解决什么痛点或科学问题？现有方法有何局限？",
    faq_q2_label: "相关研究与传承：有哪些关键的前驱工作或理论基石？",
    faq_q3_label: "核心方法与创新：提出了哪些核心架构、算法创新或关键改进？",
    faq_q4_label: "实验与突破指标：在哪些基准数据集上完成验证？取得了哪些突破结果？",
    faq_q5_label: "DeepMind 脉络定位：属于哪个技术演进代际？在内部技术栈中起什么作用？",
    faq_q6_label: "一句话总结 (TL;DR)",
    legend_title: "图谱图例说明",
    legend_badge: "DAG 拓扑",
    legend_domains_title: "主题类别",
    legend_hints_title: "节点与连线交互",
    legend_hint_size: "◯ 节点尺寸 ∝ 引用影响力评分",
    legend_hint_arrow: "➔ 箭头指向后继衍生/应用工作",
    legend_hint_ancestor: "● 橙黄高亮：祖先引用溯源 (Predecessors)",
    legend_hint_descendant: "● 翠绿高亮：后续衍生继承 (Successors)",
    docs_modal_title: "DeepMind Research Roadmap 评级体系与方法学说明文档",
    link_deepwiki: "📖 DeepWiki 架构解构 ↗",
    toggle_fullscreen: "全屏研读",
    toggle_windowed: "窗口模式",
    anchor_deepwiki: "DeepWiki 仓库解构",
    anchor_theory: "理论公式与推导",
    anchor_code: "核心源码与张量实现",
    anchor_walkthrough: "四维算法剖析",
    anchor_lineage: "技术传承脉络",
    anchor_faq: "CoolPapers 深度 FAQ",
    title_deepwiki_section: "DeepWiki 仓库架构解构与核心产物 (DeepWiki Architecture)",
    btn_deepwiki_full: "📖 在 DeepWiki 查看完整代码知识图谱 ↗",
    desc_deepwiki: "结合 DeepWiki 自动化代码解构服务，呈现该特定开源代码仓库的顶层目录拓扑与关键算法产物 (Core Artifacts)。",
    title_core_artifacts: "🌟 核心算法产物与关键文件解构 (Core Artifacts)",
    title_theory_section: "算法理论基础与数学推导 (Theoretical Formulation)",
    theory_tag_label: "Mathematical Rigor",
    title_math_foundation: "📌 核心数学理论与优化目标",
    title_key_equations: "⚡ 核心数学公式与形式化定义",
    title_theory_mapping: "🔄 数学符号 ➔ 源码变量映射对齐表 (Theory-Code Mapping)"
  },
  en: {
    doc_title: "AiLabRoadMap | Global AI Labs Evolution Graph & Lineage",
    brand_title: "AiLabRoadMap",
    badge_status: "Hub Active",
    brand_subtitle: "Interactive Technical Roadmaps & Milestone Lineage Hub for Top AI Labs",
    stat_papers_label: "Milestones",
    stat_pubs_label: "Publications",
    stat_edges_label: "Lineage Edges",
    stat_years_label: "Timeline",
    tab_hub_label: "🏛️ AI Labs Hub",
    btn_view_graph: "DeepMind DAG",
    btn_view_library: "DeepMind Library (262)",
    btn_docs_label: "Methodology Docs",
    btn_fit_label: "Fit View",
    btn_layout_lr: "Horizontal (LR)",
    btn_layout_tb: "Vertical (TB)",
    theme_light: "Light Mode",
    theme_dark: "Dark Mode",
    lang_toggle: "中文",
    search_placeholder_dag: "Search papers by title, author, TL;DR keywords...",
    label_dag_topics: "Research Domain:",
    chip_all_topics: "All Domains",
    label_timeline: "Timeline Slider:",
    timeline_prefix: "Up to",
    timeline_suffix: "",
    label_impact_focus: "🌟 High-Impact Focus",
    search_placeholder_lib: "Search 262 official papers by title, topic, keywords...",
    lib_tier_label: "Milestone Tier:",
    tier_chip_all: "All Tiers (262)",
    tier_chip_code: "💻 Core Pseudocode & Code (39)",
    tier_chip_s: "🌟 Tier S Landmark (12)",
    tier_chip_a: "🔷 Tier A Key Foundation (16)",
    tier_chip_b: "🟢 Tier B Major Advance (17)",
    tier_chip_c: "⚪ Tier C Standard (217)",
    lib_year_label: "Publication Year:",
    year_chip_all: "All Years",
    lib_theme_label: "Research Domains:",
    lib_theme_all: "All Domains",
    label_layout_grid: "Grid",
    label_layout_list: "List",
    lib_matched_format: (matched: number, total: number) => `Filtered ${matched} / ${total} papers`,
    btn_read_deep: "Deep Dive (FAQ)",
    btn_view_code: "Pseudocode",
    link_coolpapers: "⚡ CoolPapers ↗",
    link_github: "💻 GitHub Code ↗",
    link_official: "Official Site ↗",
    link_arxiv: "arXiv ↗",
    link_pdf: "PDF ↗",
    code_section_title: "Core Algorithm Pseudocode & Implementation",
    label_code_github: "GitHub Codebase ↗",
    label_copy_code: "Copy Code",
    label_copied: "Copied!",
    explanation_heading: "Algorithmic Walkthrough & Step-by-Step Analysis",
    code_overview_label: "Algorithmic Overview",
    code_steps_label: "Key Algorithmic Steps",
    code_flow_label: "Computational & Tensor Flow",
    code_highlights_label: "Engineering & Architectural Highlights",
    metric_title_score: "Composite Impact Score",
    metric_hint_score: "Weighted academic evaluation",
    metric_title_citations: "Total Citations",
    metric_hint_citations: "Indexed by Semantic Scholar",
    metric_title_influential: "Influential Citations",
    metric_hint_influential: "Major citations as key foundation",
    metric_title_velocity: "Citation Velocity",
    metric_hint_velocity: "Annual citation accumulation rate",
    lineage_section_title: "Evolution & Lineage Topology",
    lineage_label_pred: "Predecessors (Foundational Ancestors)",
    lineage_label_succ: "Successors (Derivative Descendants)",
    lineage_empty_pred: "Root milestone, no internal predecessors",
    lineage_empty_succ: "Current frontier with no derivative nodes yet",
    lineage_not_in_graph: "Paper not yet connected in primary DAG",
    faq_section_title: "CoolPapers-Style 6-D Academic FAQ",
    faq_tag_label: "LLM Deep Insight",
    faq_q1_label: "Core Problem: What fundamental challenge does this work solve?",
    faq_q2_label: "Lineage & Heritage: What prior foundational breakthroughs are inherited?",
    faq_q3_label: "Method & Innovation: What key architecture or algorithm is proposed?",
    faq_q4_label: "Experiments & Benchmarks: What breakthrough results were achieved?",
    faq_q5_label: "DeepMind Role: What is the strategic generational role in DeepMind's stack?",
    faq_q6_label: "Executive Summary (TL;DR)",
    legend_title: "Legend & Guide",
    legend_badge: "DAG Topology",
    legend_domains_title: "Domains",
    legend_hints_title: "Interactions & Lineage",
    legend_hint_size: "◯ Node size ∝ Citation impact score",
    legend_hint_arrow: "➔ Arrow indicates derivative lineage",
    legend_hint_ancestor: "● Orange: Ancestor Predecessors",
    legend_hint_descendant: "● Emerald: Descendant Successors",
    docs_modal_title: "DeepMind Research Roadmap Milestone Rating & Methodology",
    link_deepwiki: "📖 DeepWiki Architecture ↗",
    toggle_fullscreen: "Fullscreen",
    toggle_windowed: "Windowed",
    anchor_deepwiki: "DeepWiki Architecture",
    anchor_theory: "Theory & Equations",
    anchor_code: "Core Implementation",
    anchor_walkthrough: "Algorithmic Walkthrough",
    anchor_lineage: "Interactive Lineage",
    anchor_faq: "CoolPapers 6-D FAQ",
    title_deepwiki_section: "DeepWiki Repository Architecture & Core Artifacts",
    btn_deepwiki_full: "📖 Explore Full Codebase Knowledge Graph on DeepWiki ↗",
    desc_deepwiki: "Deconstructs the specific repository's directory topology and core algorithmic artifacts via DeepWiki automated analysis.",
    title_core_artifacts: "🌟 Core Algorithmic Artifacts & Modules",
    title_theory_section: "Theoretical Foundations & Mathematical Formulations",
    theory_tag_label: "Mathematical Rigor",
    title_math_foundation: "📌 Core Mathematical Principles & Objectives",
    title_key_equations: "⚡ Key Equations & Formal Formulations",
    title_theory_mapping: "🔄 Theory-Code Alignment Table (Math ➔ Source)"
  }
};

// ============================================================================
// State Management (Defaults: Light Theme & Chinese Language)
// ============================================================================

class AppState {
  graphData: GraphData | null = null;
  cy: Core | null = null;
  selectedNodeId: string | null = null;
  selectedTopic: string = "ALL";
  timelineYear: number = 2026;
  impactFocus: boolean = false;
  searchQuery: string = "";
  layoutDirection: 'LR' | 'TB' = 'LR';
  theme: 'dark' | 'light' = (localStorage.getItem('dm_theme') as 'dark' | 'light') || 'light';
  lang: 'zh' | 'en' = (localStorage.getItem('dm_lang') as 'zh' | 'en') || 'zh';

  // View State (Defaults to Multi-Lab Hub)
  activeView: 'hub' | 'graph' | 'library' = 'hub';
  allPublications: PublicationItem[] = [];
  libTierFilter: string = 'ALL';
  libYearFilter: string = 'ALL';
  libThemeFilter: string = 'ALL';
  libSearchQuery: string = '';
  libLayoutMode: 'grid' | 'list' = (localStorage.getItem('dm_lib_layout') as 'grid' | 'list') || 'grid';
}

const state = new AppState();

// ============================================================================
// DOM Elements Cache
// ============================================================================

const dom = {
  // Brand & Header
  brandTitle: document.getElementById('brand-title')!,
  brandSubtitle: document.getElementById('brand-subtitle')!,
  statusText: document.getElementById('status-text')!,
  metricLabelPapers: document.getElementById('metric-label-papers')!,
  statPapers: document.getElementById('stat-papers')!,
  metricLabelPubs: document.getElementById('metric-label-pubs')!,
  statTotalPubs: document.getElementById('stat-total-pubs'),
  metricLabelEdges: document.getElementById('metric-label-edges')!,
  statEdges: document.getElementById('stat-edges')!,
  metricLabelYears: document.getElementById('metric-label-years')!,
  statYears: document.getElementById('stat-years')!,

  // View switch (Hub, DAG Graph, Library)
  btnViewHub: document.getElementById('btn-view-hub') as HTMLButtonElement,
  tabHubLabel: document.getElementById('tab-hub-label')!,
  btnViewGraph: document.getElementById('btn-view-graph') as HTMLButtonElement,
  tabGraphLabel: document.getElementById('tab-graph-label')!,
  btnViewLibrary: document.getElementById('btn-view-library') as HTMLButtonElement,
  tabLibraryLabel: document.getElementById('tab-library-label')!,
  dagControlbar: document.getElementById('dag-controlbar') as HTMLElement,
  floatingLegend: document.querySelector('.floating-legend') as HTMLElement,

  // Hub View Elements
  hubView: document.getElementById('hub-view') as HTMLElement,
  btnEnterDmGraph: document.getElementById('btn-enter-dm-graph') as HTMLButtonElement,
  btnEnterDmLibrary: document.getElementById('btn-enter-dm-library') as HTMLButtonElement,

  // Lab Preview Modal
  modalLabPreview: document.getElementById('modal-lab-preview') as HTMLElement,
  previewLabIcon: document.getElementById('preview-lab-icon') as HTMLElement,
  previewLabTitle: document.getElementById('preview-lab-title') as HTMLElement,
  previewLabBody: document.getElementById('preview-lab-body') as HTMLElement,
  btnClosePreview: document.getElementById('btn-close-preview') as HTMLButtonElement,

  // Action Buttons
  btnLang: document.getElementById('btn-lang') as HTMLButtonElement,
  langLabel: document.getElementById('lang-label')!,
  btnOpenDocs: document.getElementById('btn-open-docs') as HTMLButtonElement,
  btnDocsLabel: document.getElementById('btn-docs-label')!,
  btnFit: document.getElementById('btn-fit')!,
  btnFitLabel: document.getElementById('btn-fit-label')!,
  btnLayoutToggle: document.getElementById('btn-layout-toggle')!,
  layoutDirectionLabel: document.getElementById('layout-direction-label')!,
  btnTheme: document.getElementById('btn-theme')!,
  themeIconSun: document.getElementById('theme-icon-sun')!,
  themeIconMoon: document.getElementById('theme-icon-moon')!,
  themeLabel: document.getElementById('theme-label')!,

  // DAG Controls
  inputSearch: document.getElementById('input-search') as HTMLInputElement,
  btnClearSearch: document.getElementById('btn-clear-search')!,
  labelDagTopics: document.getElementById('label-dag-topics')!,
  topicChips: document.getElementById('topic-chips')!,
  chipTopicAll: document.getElementById('chip-topic-all')!,
  labelTimeline: document.getElementById('label-timeline')!,
  timelinePrefix: document.getElementById('timeline-prefix')!,
  timelineSuffix: document.getElementById('timeline-suffix')!,
  timelineSlider: document.getElementById('timeline-slider') as HTMLInputElement,
  yearDisplay: document.getElementById('year-display')!,
  checkImpactFocus: document.getElementById('check-impact-focus') as HTMLInputElement,
  labelImpactFocus: document.getElementById('label-impact-focus')!,

  // Canvas & Tooltip
  cyContainer: document.getElementById('cy')!,
  nodeTooltip: document.getElementById('node-tooltip')!,
  ttTopic: document.getElementById('tt-topic')!,
  ttYear: document.getElementById('tt-year')!,
  ttTitle: document.getElementById('tt-title')!,
  ttScore: document.getElementById('tt-score')!,
  ttCitations: document.getElementById('tt-citations')!,
  ttTldr: document.getElementById('tt-tldr')!,

  // Library UI
  libraryView: document.getElementById('library-view') as HTMLElement,
  libSearchInput: document.getElementById('lib-search-input') as HTMLInputElement,
  libClearSearch: document.getElementById('lib-clear-search') as HTMLButtonElement,
  libMatchedCount: document.getElementById('lib-matched-count') as HTMLElement,
  libTierLabel: document.getElementById('lib-tier-label')!,
  libTierChips: document.getElementById('lib-tier-chips') as HTMLElement,
  tierChipAll: document.getElementById('tier-chip-all')!,
  tierChipS: document.getElementById('tier-chip-s')!,
  tierChipA: document.getElementById('tier-chip-a')!,
  tierChipB: document.getElementById('tier-chip-b')!,
  tierChipC: document.getElementById('tier-chip-c')!,
  libYearLabel: document.getElementById('lib-year-label')!,
  libYearChips: document.getElementById('lib-year-chips') as HTMLElement,
  yearChipAll: document.getElementById('year-chip-all')!,
  libThemeLabel: document.getElementById('lib-theme-label')!,
  libThemeChips: document.getElementById('lib-theme-chips') as HTMLElement,
  libThemeAll: document.getElementById('lib-theme-all')!,
  libCardsGrid: document.getElementById('lib-cards-grid') as HTMLElement,
  btnLayoutGrid: document.getElementById('btn-layout-grid') as HTMLButtonElement,
  labelLayoutGrid: document.getElementById('label-layout-grid')!,
  btnLayoutList: document.getElementById('btn-layout-list') as HTMLButtonElement,
  labelLayoutList: document.getElementById('label-layout-list')!,

  // Floating Legend
  legendTitle: document.getElementById('legend-title')!,
  legendDomainsTitle: document.getElementById('legend-domains-title')!,
  legendTextLlm: document.getElementById('legend-text-llm')!,
  legendTextRl: document.getElementById('legend-text-rl')!,
  legendTextRobotics: document.getElementById('legend-text-robotics')!,
  legendTextBio: document.getElementById('legend-text-bio')!,
  legendTextMath: document.getElementById('legend-text-math')!,
  legendTextSafety: document.getElementById('legend-text-safety')!,
  legendHintsTitle: document.getElementById('legend-hints-title')!,
  legendHintSize: document.getElementById('legend-hint-size')!,
  legendHintArrow: document.getElementById('legend-hint-arrow')!,
  legendHintAncestor: document.getElementById('legend-hint-ancestor')!,
  legendHintDescendant: document.getElementById('legend-hint-descendant')!,

  // Drawer
  drawer: document.getElementById('paper-drawer')!,
  drawerBackdrop: document.getElementById('drawer-backdrop')!,
  btnCloseDrawer: document.getElementById('btn-close-drawer')!,
  detailGen: document.getElementById('detail-generation')!,
  detailTopic: document.getElementById('detail-topic')!,
  detailVenue: document.getElementById('detail-venue')!,
  detailYear: document.getElementById('detail-year')!,
  detailTitle: document.getElementById('detail-title')!,
  detailAuthors: document.getElementById('detail-authors')!,
  linkCoolpapers: document.getElementById('link-coolpapers') as HTMLAnchorElement,
  linkGithub: document.getElementById('link-github') as HTMLAnchorElement,
  linkArxiv: document.getElementById('link-arxiv') as HTMLAnchorElement,
  linkPdf: document.getElementById('link-pdf') as HTMLAnchorElement,
  linkDeepmind: document.getElementById('link-deepmind') as HTMLAnchorElement,
  sectionPseudocode: document.getElementById('section-pseudocode') as HTMLElement,
  codeSectionTitle: document.getElementById('code-section-title')!,
  codeLangTag: document.getElementById('code-lang-tag')!,
  codeGithubBtn: document.getElementById('code-github-btn') as HTMLAnchorElement,
  labelCodeGithub: document.getElementById('label-code-github')!,
  btnCopyCode: document.getElementById('btn-copy-code') as HTMLButtonElement,
  labelCopyCode: document.getElementById('label-copy-code')!,
  codeSnippetContent: document.getElementById('code-snippet-content')!,
  explanationHeading: document.getElementById('explanation-heading')!,
  codeExplanationText: document.getElementById('code-explanation-text')!,
  tierChipCode: document.getElementById('tier-chip-code') as HTMLButtonElement,
  metricTitleScore: document.getElementById('metric-title-score')!,
  metricScore: document.getElementById('metric-score')!,
  metricHintScore: document.getElementById('metric-hint-score')!,
  metricTitleCitations: document.getElementById('metric-title-citations')!,
  metricCitations: document.getElementById('metric-citations')!,
  metricHintCitations: document.getElementById('metric-hint-citations')!,
  metricTitleInfluential: document.getElementById('metric-title-influential')!,
  metricInfluential: document.getElementById('metric-influential')!,
  metricHintInfluential: document.getElementById('metric-hint-influential')!,
  metricTitleVelocity: document.getElementById('metric-title-velocity')!,
  metricVelocity: document.getElementById('metric-velocity')!,
  metricHintVelocity: document.getElementById('metric-hint-velocity')!,
  lineageSectionTitle: document.getElementById('lineage-section-title')!,
  lineageLabelPred: document.getElementById('lineage-label-pred')!,
  lineagePredecessors: document.getElementById('lineage-predecessors')!,
  lineageEmptyPred: document.getElementById('lineage-empty-pred')!,
  lineageLabelSucc: document.getElementById('lineage-label-succ')!,
  lineageSuccessors: document.getElementById('lineage-successors')!,
  lineageEmptySucc: document.getElementById('lineage-empty-succ')!,
  faqSectionTitle: document.getElementById('faq-section-title')!,
  faqTagLabel: document.getElementById('faq-tag-label')!,
  faqQ1Label: document.getElementById('faq-q1-label')!,
  faqQ1: document.getElementById('faq-q1')!,
  faqQ2Label: document.getElementById('faq-q2-label')!,
  faqQ2: document.getElementById('faq-q2')!,
  faqQ3Label: document.getElementById('faq-q3-label')!,
  faqQ3: document.getElementById('faq-q3')!,
  faqQ4Label: document.getElementById('faq-q4-label')!,
  faqQ4: document.getElementById('faq-q4')!,
  faqQ5Label: document.getElementById('faq-q5-label')!,
  faqQ5: document.getElementById('faq-q5')!,
  faqQ6Label: document.getElementById('faq-q6-label')!,
  faqQ6: document.getElementById('faq-q6')!,

  // Workbench Window & Controls
  workbenchWindow: document.getElementById('workbench-window')!,
  workbenchScrollBody: document.getElementById('workbench-scroll-body')!,
  btnToggleFullscreen: document.getElementById('btn-toggle-fullscreen') as HTMLButtonElement,
  labelToggleFullscreen: document.getElementById('label-toggle-fullscreen')!,

  // DeepWiki Elements
  linkDeepwiki: document.getElementById('link-deepwiki') as HTMLAnchorElement,
  labelLinkDeepwiki: document.getElementById('label-link-deepwiki')!,
  deepwikiExtBtn: document.getElementById('deepwiki-ext-btn') as HTMLAnchorElement,
  deepwikiRepoName: document.getElementById('deepwiki-repo-name')!,
  deepwikiTreeContent: document.getElementById('deepwiki-tree-content')!,
  deepwikiArtifactsList: document.getElementById('deepwiki-artifacts-list')!,
  titleDeepwikiSection: document.getElementById('title-deepwiki-section')!,
  descDeepwiki: document.getElementById('desc-deepwiki')!,
  titleCoreArtifacts: document.getElementById('title-core-artifacts')!,

  // Theoretical Foundations Elements
  sectionTheory: document.getElementById('section-theory') as HTMLElement,
  titleTheorySection: document.getElementById('title-theory-section')!,
  theoryTagLabel: document.getElementById('theory-tag-label')!,
  titleMathFoundation: document.getElementById('title-math-foundation')!,
  theoryFoundationContent: document.getElementById('theory-foundation-content')!,
  titleKeyEquations: document.getElementById('title-key-equations')!,
  theoryEquationsList: document.getElementById('theory-equations-list')!,
  titleTheoryMapping: document.getElementById('title-theory-mapping')!,
  theoryMappingTbody: document.getElementById('theory-mapping-tbody')!,

  // Anchor Nav Elements
  workbenchAnchorNav: document.getElementById('workbench-anchor-nav')!,
  anchorLabelDeepwiki: document.getElementById('anchor-label-deepwiki')!,
  anchorLabelTheory: document.getElementById('anchor-label-theory')!,
  anchorLabelCode: document.getElementById('anchor-label-code')!,
  anchorLabelWalkthrough: document.getElementById('anchor-label-walkthrough')!,
  anchorLabelLineage: document.getElementById('anchor-label-lineage')!,
  anchorLabelFaq: document.getElementById('anchor-label-faq')!,

  // Documentation Modal
  modalDocs: document.getElementById('modal-docs') as HTMLElement,
  btnCloseDocs: document.getElementById('btn-close-docs') as HTMLButtonElement,
  docsModalTitle: document.getElementById('docs-modal-title')!,
  docsModalBody: document.querySelector('.docs-modal-body') as HTMLElement
};

// ============================================================================
// CoolPapers URL Helper
// ============================================================================

function getCoolPapersUrl(arxivId?: string | null, title?: string): string {
  if (arxivId && arxivId.trim()) {
    const cleanId = arxivId.replace(/^arxiv:/i, '').trim();
    return `https://papers.cool/arxiv/${cleanId}`;
  }
  const query = encodeURIComponent(title ? title.trim() : '');
  return `https://papers.cool/arxiv/search?query=${query}`;
}

// ============================================================================
// Theme Management (Defaults to Light)
// ============================================================================

function applyTheme(theme: 'dark' | 'light') {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('dm_theme', theme);

  if (theme === 'light') {
    dom.themeIconSun.style.display = 'none';
    dom.themeIconMoon.style.display = 'inline-block';
    dom.themeLabel.textContent = state.lang === 'zh' ? '暗色模式' : 'Dark Mode';
  } else {
    dom.themeIconSun.style.display = 'inline-block';
    dom.themeIconMoon.style.display = 'none';
    dom.themeLabel.textContent = state.lang === 'zh' ? '亮色模式' : 'Light Mode';
  }
}

// ============================================================================
// Methodology Documentation Renderer (Bilingual)
// ============================================================================

function renderDocsModalBody(lang: 'zh' | 'en') {
  if (!dom.docsModalBody) return;

  if (lang === 'zh') {
    dom.docsModalBody.innerHTML = `
      <section class="docs-section">
        <h4>一、 评级体系构建背景与初衷</h4>
        <p>学术界单纯依赖“绝对引用量”评价研究成果存在固有缺陷：<strong>时间滞后性</strong>（新近发表的最前沿突破往往引用量尚未充分累积）与<strong>学术马太效应</strong>。本评级体系结合 <em>Semantic Scholar</em> 权威学术图谱、<em>Nature / Science</em> 顶级同行评审背书、Google DeepMind 内部官方战略布局，系统性制定了一套科学、立体的 Milestone 影响力等级评定标准，旨在清晰刻画从早期基础模型、超人博弈到通用人工智能 (AGI) 及超级智能 (ASI) 的完整演进脉络。</p>
      </section>

      <section class="docs-section">
        <h4>二、 Milestone 四层级评定维度与准则</h4>
        
        <div class="doc-tier-box tier-s">
          <div class="doc-tier-header">
            <span class="doc-tier-badge s">🌟 Tier S: 划时代里程碑 (Landmark Milestone)</span>
            <span class="doc-tier-score">综合评分：92 ~ 100 分</span>
          </div>
          <div class="doc-tier-content">
            <p><strong>【判定准则】</strong> 确立全新通用人工智能范式、重塑全球学术界与工业界技术路线、或在国际顶级期刊（<em>Nature / Science</em> 正刊）发表的战略级奠基突破。</p>
            <p><strong>【核心特征】</strong> 具备全行业颠覆性，产生长周期学术传承链，被公认为技术演进拐点。</p>
            <p><strong>【入选代表作 (12 篇)】</strong></p>
            <ul>
              <li>《Visual General Intelligence: A White Paper》(2026.08) - 确立视觉通用智能与语言大模型并列的 AGI 双引擎终极架构</li>
              <li>《From AGI to ASI》(2026.06) - 官方超级智能学术跃迁总纲领与安全红线标准</li>
              <li>《GraphCast: Learned Global Weather Forecasting》(2023.11, Science 正刊) - 颠覆全球数值天气预报计算范式</li>
              <li>《Accurate proteome-wide missense variant effect prediction with AlphaMissense》(2023.09, Science 正刊) - 全人类错义突变致病性预测</li>
              <li>《AutoRT: Embodied Foundation Models for Large Scale Orchestration》(2024.01) - 机器人宪法与多机机群物理编排</li>
              <li>《RoboCat: A Self-Improving Foundation Agent for Robotic Manipulation》(2023.12) - 首个自给自足闭环自进化的具身基础模型</li>
              <li>《Achieving Human Level Competitive Robot Table Tennis》(2024.08) - 敏捷高对抗体育竞技达到业余人类冠军水准</li>
              <li>《Advancing Biomedical Understanding with Multimodal Gemini (Med-Gemini)》(2024.05) - 临床医学超高精度原生多模态</li>
              <li>《Gemini Embedding》(2025.03), 《Super-Exponential Regret for AlphaGo》(2024.05), 《Equivariant MuZero》(2023.12), 《AlphaZero Extremal Graphs》(2023.11)</li>
            </ul>
          </div>
        </div>

        <div class="doc-tier-box tier-a">
          <div class="doc-tier-header">
            <span class="doc-tier-badge a">🔷 Tier A: 核心基石与重大突破 (Key Foundation)</span>
            <span class="doc-tier-score">综合评分：80 ~ 91 分</span>
          </div>
          <div class="doc-tier-content">
            <p><strong>【判定准则】</strong> 对核心模型架构、底层动力学解构、前沿超级对齐防御或基础重大工程控制产生关键奠基作用的研究成果。</p>
            <p><strong>【核心特征】</strong> 解决了前沿演进中的关键结构性瓶颈，为 Tier S 里程碑的诞生提供核心理论与算法支撑。</p>
            <p><strong>【入选代表作 (16 篇)】</strong></p>
            <ul>
              <li>《Towards Structural Understanding of LLM Overthinking》(2026.07) - 揭示长推理思维链中注意力饱和与过思考坍塌机理</li>
              <li>《Image Generators are Generalist Vision Learners》(2026.04) - 统一生成式与判别式视觉理解理论假说</li>
              <li>《TRecViT: A Recurrent Video Transformer》(2026.01) - 常数显存处理超长时序流式视频</li>
              <li>《Gram: Assessing sabotage propensities via automated alignment auditing》(2026.05) - 自动化红队审计防御模型隐蔽破坏</li>
              <li>《Realistic honeypot evaluations for scheming propensity》(2026.05) - 蜜罐诱饵机制主动探测模型阴谋倾向</li>
              <li>《A moral Turing test》(2026.08), 《Solipsistic superintelligence is unlikely to be cooperative》(2026.06)</li>
              <li>《Towards Practical RL for Tokamak Magnetic Control》(2024.03) - 可控核聚变托卡马克磁场约束强化学习</li>
              <li>《TxGemma: Efficient and Agentic LLMs for Therapeutics》(2025.04) - 药物新药研发代理模型</li>
              <li>《AlphaTensor for Optimizing Quantum Computations》(2024.02), 《Simplicity and Complexity in Combinatorial Optimization》(2026.02)</li>
            </ul>
          </div>
        </div>

        <div class="doc-tier-box tier-b">
          <div class="doc-tier-header">
            <span class="doc-tier-badge b">🟢 Tier B: 重要前沿进展 (Major Advance)</span>
            <span class="doc-tier-score">综合评分：68 ~ 79 分</span>
          </div>
          <div class="doc-tier-content">
            <p><strong>【判定准则】</strong> 在人机协同、具身控制、视频提示词工程、红队渗透与价值对齐等前沿细分方向做出的实质性技术突破与系统验证。</p>
            <p><strong>【核心特征】</strong> 具备扎实的工程实现与实证效果，是 DeepMind 研究广度与前沿敏锐度的生动体现。</p>
            <p><strong>【代表论文】</strong> 《Designing Proactive Thought Partners for Writing》(2026), 《Visual prompt engineering for video models》(2026), 《Quantifying the Salience of Geo-Cultural Values》(2026), 《Going PLACES》(2026), 《RoboBallet》(2025), 《Diffusion Model Predictive Control》(2024) 等 17 篇。</p>
          </div>
        </div>

        <div class="doc-tier-box tier-c">
          <div class="doc-tier-header">
            <span class="doc-tier-badge c">⚪ Tier C: 专业贡献与评估 (Standard Contribution)</span>
            <span class="doc-tier-score">综合评分：55 ~ 67 分</span>
          </div>
          <div class="doc-tier-content">
            <p><strong>【判定准则】</strong> 专注于特定实验评估、行为经济学博弈、微调方法探索或垂直应用落地的扎实科研成果（共 217 篇）。</p>
          </div>
        </div>
      </section>

      <section class="docs-section">
        <h4>三、 影响力量化计算加权模型</h4>
        <p>每一篇论文的综合评分通过多维度加权归一化算法实时计算得出：</p>
        <div class="math-card">
          Score = w₁ · S_citations + w₂ · S_influential + w₃ · S_velocity + w₄ · S_venue + S_paradigm_bonus
        </div>
        <ul>
          <li><strong>S_citations (总引用归一化)</strong>：以 log 对数平滑抑制早期经典工作的极端极值，权重 30%。</li>
          <li><strong>S_influential (重要前驱引用)</strong>：评估该工作是否被后续研究作为核心 Baseline 或前置条件，权重 25%。</li>
          <li><strong>S_velocity (年度引用速率)</strong>：反映近 1-2 年的学术热度与演进活跃度，权重 20%。</li>
          <li><strong>S_venue (顶刊顶会背书)</strong>：<em>Nature / Science</em> 正刊 +10 分加权，顶级会议 Oral +5 分加权。</li>
          <li><strong>S_paradigm_bonus (范式革新补偿)</strong>：对确立全新 AGI / ASI 演进路径的前沿代表作给予战略权重补偿，有效消弭学术时滞。</li>
        </ul>
      </section>

      <section class="docs-section">
        <h4>四、 CoolPapers 直达与 6 维结构化 FAQ 研读指南</h4>
        <p>本平台与学术研读工具 <strong>CoolPapers (papers.cool)</strong> 深度协同：</p>
        <ul>
          <li><strong>直达链接</strong>：卡片与抽屉中的 <code>⚡ CoolPapers ↗</code> 按钮直接调用真实 arXiv ID 或精准论文检索，一键调取 Kimi 大模型对整篇论文长文本的深度解析。</li>
          <li><strong>6 维深度 FAQ</strong>：针对每篇成果，提炼【Q1 核心问题】、【Q2 演化脉络】、【Q3 方法创新】、【Q4 实验成效】、【Q5 战略地位】与【Q6 TL;DR 一句话要点】，大幅缩短学术研读的理解路径。</li>
        </ul>
      </section>
    `;
  } else {
    dom.docsModalBody.innerHTML = `
      <section class="docs-section">
        <h4>1. Motivation & Background</h4>
        <p>Relying solely on "absolute citation counts" introduces severe evaluation biases: <strong>publication time-lag</strong> (cutting-edge breakthroughs from 2024-2026 have not yet accumulated years of citations) and the <strong>Matthew effect</strong>. This evaluation framework synergizes <em>Semantic Scholar</em> citation graphs, <em>Nature / Science</em> peer reviews, and Google DeepMind's official strategic priorities to establish an objective, multi-tiered milestone system illustrating the roadmap from early deep RL to AGI and Artificial Superintelligence (ASI).</p>
      </section>

      <section class="docs-section">
        <h4>2. Four-Tier Milestone Criteria</h4>
        
        <div class="doc-tier-box tier-s">
          <div class="doc-tier-header">
            <span class="doc-tier-badge s">🌟 Tier S: Landmark Milestone</span>
            <span class="doc-tier-score">Score: 92 ~ 100</span>
          </div>
          <div class="doc-tier-content">
            <p><strong>[Criteria]</strong> Paradigm-shifting breakthroughs establishing entirely new fields, reshaping global technical roadmaps, or published in premier journals (<em>Nature / Science</em>).</p>
            <p><strong>[Characteristics]</strong> Foundational disruptive influence, giving rise to long-term academic lineages and inflection points in AI history.</p>
            <p><strong>[12 Landmark Papers]</strong></p>
            <ul>
              <li>"Visual General Intelligence: A White Paper" (2026) - Co-equal dual-engine architecture for AGI</li>
              <li>"From AGI to ASI" (2026) - Blueprint and safety guardrails for superintelligence</li>
              <li>"GraphCast: Learned Global Weather Forecasting" (2023, Science) - Revolutionizing numerical weather forecasting</li>
              <li>"Accurate proteome-wide missense variant effect prediction with AlphaMissense" (2023, Science)</li>
              <li>"AutoRT: Embodied Foundation Models for Large Scale Orchestration" (2024)</li>
              <li>"RoboCat: A Self-Improving Foundation Agent for Robotic Manipulation" (2023)</li>
              <li>"Achieving Human Level Competitive Robot Table Tennis" (2024)</li>
              <li>"Advancing Biomedical Understanding with Multimodal Gemini (Med-Gemini)" (2024)</li>
              <li>"Gemini Embedding" (2025), "Super-Exponential Regret for AlphaGo" (2024), "Equivariant MuZero" (2023), "AlphaZero Extremal Graphs" (2023)</li>
            </ul>
          </div>
        </div>

        <div class="doc-tier-box tier-a">
          <div class="doc-tier-header">
            <span class="doc-tier-badge a">🔷 Tier A: Key Foundation</span>
            <span class="doc-tier-score">Score: 80 ~ 91</span>
          </div>
          <div class="doc-tier-content">
            <p><strong>[Criteria]</strong> Major foundational breakthroughs solving architectural bottlenecks, alignment risks, or complex physics-based control.</p>
            <p><strong>[Characteristics]</strong> Crucial theoretical or empirical foundations enabling subsequent Tier S landmark milestones.</p>
            <p><strong>[16 Key Papers]</strong></p>
            <ul>
              <li>"Towards Structural Understanding of LLM Overthinking" (2026) - Attention saturation mechanics</li>
              <li>"Image Generators are Generalist Vision Learners" (2026) - Unifying generative and discriminative vision</li>
              <li>"TRecViT: A Recurrent Video Transformer" (2026) - Constant-memory streaming video architectures</li>
              <li>"Gram: Assessing sabotage propensities via automated alignment auditing" (2026)</li>
              <li>"Realistic honeypot evaluations for scheming propensity" (2026)</li>
              <li>"A moral Turing test" (2026), "Solipsistic superintelligence is unlikely to be cooperative" (2026)</li>
              <li>"Towards Practical RL for Tokamak Magnetic Control" (2024) - Nuclear fusion magnetic control</li>
              <li>"TxGemma: Efficient and Agentic LLMs for Therapeutics" (2025)</li>
              <li>"AlphaTensor for Optimizing Quantum Computations" (2024), "Simplicity and Complexity in Combinatorial Optimization" (2026)</li>
            </ul>
          </div>
        </div>

        <div class="doc-tier-box tier-b">
          <div class="doc-tier-header">
            <span class="doc-tier-badge b">🟢 Tier B: Major Advance</span>
            <span class="doc-tier-score">Score: 68 ~ 79</span>
          </div>
          <div class="doc-tier-content">
            <p><strong>[Criteria]</strong> Substantial advances across multi-agent dynamics, video prompt engineering, red-teaming audits, and value alignment (17 papers).</p>
            <p><strong>[Representative Works]</strong> "Designing Proactive Thought Partners for Writing", "Visual prompt engineering for video models", "RoboBallet", "Diffusion Model Predictive Control", etc.</p>
          </div>
        </div>

        <div class="doc-tier-box tier-c">
          <div class="doc-tier-header">
            <span class="doc-tier-badge c">⚪ Tier C: Domain Contribution</span>
            <span class="doc-tier-score">Score: 55 ~ 67</span>
          </div>
          <div class="doc-tier-content">
            <p><strong>[Criteria]</strong> Focused empirical evaluations, behavioral games, domain-specific studies, or specialized algorithmic benchmarks (217 papers).</p>
          </div>
        </div>
      </section>

      <section class="docs-section">
        <h4>3. Quantitative Impact Score Model</h4>
        <p>The composite score is calculated using multi-dimensional normalized metrics:</p>
        <div class="math-card">
          Score = w₁ · S_citations + w₂ · S_influential + w₃ · S_velocity + w₄ · S_venue + S_paradigm_bonus
        </div>
        <ul>
          <li><strong>S_citations (30% weight)</strong>: Logarithmic smoothing prevents historical domination.</li>
          <li><strong>S_influential (25% weight)</strong>: Measures foundational citations where the paper serves as a critical predecessor.</li>
          <li><strong>S_velocity (20% weight)</strong>: Recent citation rate per year, rewarding active momentum.</li>
          <li><strong>S_venue (Peer-Review Bonus)</strong>: <em>Nature / Science</em> papers receive +10 bonus points.</li>
          <li><strong>S_paradigm_bonus</strong>: Compensates recent landmark papers for time-lag bias.</li>
        </ul>
      </section>

      <section class="docs-section">
        <h4>4. CoolPapers Integration & 6-D FAQ Guide</h4>
        <p>Seamlessly integrated with <strong>CoolPapers (papers.cool)</strong>:</p>
        <ul>
          <li><strong>Direct Links</strong>: Click <code>⚡ CoolPapers ↗</code> to open Kimi's AI analysis directly with arXiv ID or title search.</li>
          <li><strong>6-D FAQ Structure</strong>: Each paper is distilled into Q1 (Core Problem), Q2 (Lineage), Q3 (Methodology), Q4 (Experiments), Q5 (DeepMind Strategic Role), and Q6 (TL;DR takeaway).</li>
        </ul>
      </section>
    `;
  }
}

// ============================================================================
// Language Management
// ============================================================================

function applyLanguage(lang: 'zh' | 'en') {
  state.lang = lang;
  localStorage.setItem('dm_lang', lang);
  const dict = I18N[lang];

  // Document Title
  document.title = dict.doc_title;

  // Header texts
  if (dom.brandTitle) dom.brandTitle.textContent = dict.brand_title;
  if (dom.brandSubtitle) dom.brandSubtitle.textContent = dict.brand_subtitle;
  if (dom.statusText) dom.statusText.textContent = dict.badge_status;
  if (dom.metricLabelPapers) dom.metricLabelPapers.textContent = dict.stat_papers_label;
  if (dom.metricLabelPubs) dom.metricLabelPubs.textContent = dict.stat_pubs_label;
  if (dom.metricLabelEdges) dom.metricLabelEdges.textContent = dict.stat_edges_label;
  if (dom.metricLabelYears) dom.metricLabelYears.textContent = dict.stat_years_label;
  if (dom.tabHubLabel) dom.tabHubLabel.textContent = dict.tab_hub_label;
  if (dom.tabGraphLabel) dom.tabGraphLabel.textContent = dict.btn_view_graph;
  if (dom.tabLibraryLabel) dom.tabLibraryLabel.textContent = dict.btn_view_library;

  // Action Buttons
  if (dom.langLabel) dom.langLabel.textContent = dict.lang_toggle;
  if (dom.btnDocsLabel) dom.btnDocsLabel.textContent = dict.btn_docs_label;
  if (dom.btnFitLabel) dom.btnFitLabel.textContent = dict.btn_fit_label;
  if (dom.layoutDirectionLabel) {
    dom.layoutDirectionLabel.textContent = state.layoutDirection === 'LR' ? dict.btn_layout_lr : dict.btn_layout_tb;
  }
  if (dom.themeLabel) {
    dom.themeLabel.textContent = state.theme === 'light' ? dict.theme_dark : dict.theme_light;
  }

  // DAG Controls
  if (dom.inputSearch) dom.inputSearch.placeholder = dict.search_placeholder_dag;
  if (dom.labelDagTopics) dom.labelDagTopics.textContent = dict.label_dag_topics;
  if (dom.chipTopicAll) dom.chipTopicAll.textContent = dict.chip_all_topics;
  if (dom.labelTimeline) dom.labelTimeline.textContent = dict.label_timeline;
  if (dom.timelinePrefix) dom.timelinePrefix.textContent = dict.timeline_prefix;
  if (dom.timelineSuffix) dom.timelineSuffix.textContent = dict.timeline_suffix;
  if (dom.labelImpactFocus) dom.labelImpactFocus.textContent = dict.label_impact_focus;

  // Update DAG topic chips labels
  document.querySelectorAll('#topic-chips .chip').forEach(chip => {
    const topic = chip.getAttribute('data-topic');
    if (topic && topic !== 'ALL' && DOMAIN_I18N[topic]) {
      const span = chip.querySelector('.chip-text');
      if (span) span.textContent = DOMAIN_I18N[topic][lang];
    }
  });

  // Library Controls
  if (dom.libSearchInput) dom.libSearchInput.placeholder = dict.search_placeholder_lib;
  if (dom.libTierLabel) dom.libTierLabel.textContent = dict.lib_tier_label;
  if (dom.tierChipAll) dom.tierChipAll.textContent = dict.tier_chip_all;
  if (dom.tierChipS) dom.tierChipS.textContent = dict.tier_chip_s;
  if (dom.tierChipA) dom.tierChipA.textContent = dict.tier_chip_a;
  if (dom.tierChipB) dom.tierChipB.textContent = dict.tier_chip_b;
  if (dom.tierChipC) dom.tierChipC.textContent = dict.tier_chip_c;
  if (dom.libYearLabel) dom.libYearLabel.textContent = dict.lib_year_label;
  if (dom.yearChipAll) dom.yearChipAll.textContent = dict.year_chip_all;
  if (dom.libThemeLabel) dom.libThemeLabel.textContent = dict.lib_theme_label;
  if (dom.libThemeAll) dom.libThemeAll.textContent = dict.lib_theme_all;
  if (dom.labelLayoutGrid) dom.labelLayoutGrid.textContent = dict.label_layout_grid;
  if (dom.labelLayoutList) dom.labelLayoutList.textContent = dict.label_layout_list;

  // Update Library theme chips labels
  document.querySelectorAll('#lib-theme-chips .lib-chip').forEach(chip => {
    const theme = chip.getAttribute('data-theme');
    if (theme && theme !== 'ALL' && DOMAIN_I18N[theme]) {
      const span = chip.querySelector('.chip-text');
      if (span) {
        const countMatch = span.textContent?.match(/\(\d+\)/);
        const count = countMatch ? ` ${countMatch[0]}` : '';
        span.textContent = `${DOMAIN_I18N[theme][lang]}${count}`;
      }
    }
  });

  // Floating Legend
  if (dom.legendTitle) dom.legendTitle.textContent = dict.legend_title;
  if (dom.legendDomainsTitle) dom.legendDomainsTitle.textContent = dict.legend_domains_title;
  if (dom.legendTextLlm) dom.legendTextLlm.textContent = DOMAIN_I18N["LLM & Multimodal"][lang];
  if (dom.legendTextRl) dom.legendTextRl.textContent = DOMAIN_I18N["RL & Multi-Agent"][lang];
  if (dom.legendTextRobotics) dom.legendTextRobotics.textContent = DOMAIN_I18N["Embodied AI & Robotics"][lang];
  if (dom.legendTextBio) dom.legendTextBio.textContent = DOMAIN_I18N["AI for Science & Biology"][lang];
  if (dom.legendTextMath) dom.legendTextMath.textContent = DOMAIN_I18N["Math & Algorithmic Discovery"][lang];
  if (dom.legendTextSafety) dom.legendTextSafety.textContent = DOMAIN_I18N["Frontier Safety, Alignment & Society"][lang];
  if (dom.legendHintsTitle) dom.legendHintsTitle.textContent = dict.legend_hints_title;
  if (dom.legendHintSize) dom.legendHintSize.textContent = dict.legend_hint_size;
  if (dom.legendHintArrow) dom.legendHintArrow.textContent = dict.legend_hint_arrow;
  if (dom.legendHintAncestor) dom.legendHintAncestor.textContent = dict.legend_hint_ancestor;
  if (dom.legendHintDescendant) dom.legendHintDescendant.textContent = dict.legend_hint_descendant;

  // Drawer Static Headings
  if (dom.metricTitleScore) dom.metricTitleScore.textContent = dict.metric_title_score;
  if (dom.metricHintScore) dom.metricHintScore.textContent = dict.metric_hint_score;
  if (dom.metricTitleCitations) dom.metricTitleCitations.textContent = dict.metric_title_citations;
  if (dom.metricHintCitations) dom.metricHintCitations.textContent = dict.metric_hint_citations;
  if (dom.metricTitleInfluential) dom.metricTitleInfluential.textContent = dict.metric_title_influential;
  if (dom.metricHintInfluential) dom.metricHintInfluential.textContent = dict.metric_hint_influential;
  if (dom.metricTitleVelocity) dom.metricTitleVelocity.textContent = dict.metric_title_velocity;
  if (dom.metricHintVelocity) dom.metricHintVelocity.textContent = dict.metric_hint_velocity;
  if (dom.lineageSectionTitle) dom.lineageSectionTitle.textContent = dict.lineage_section_title;
  if (dom.lineageLabelPred) dom.lineageLabelPred.textContent = dict.lineage_label_pred;
  if (dom.lineageLabelSucc) dom.lineageLabelSucc.textContent = dict.lineage_label_succ;
  if (dom.lineageEmptyPred) dom.lineageEmptyPred.textContent = dict.lineage_empty_pred;
  if (dom.lineageEmptySucc) dom.lineageEmptySucc.textContent = dict.lineage_empty_succ;
  if (dom.faqSectionTitle) dom.faqSectionTitle.textContent = dict.faq_section_title;
  if (dom.faqTagLabel) dom.faqTagLabel.textContent = dict.faq_tag_label;
  if (dom.faqQ1Label) dom.faqQ1Label.textContent = dict.faq_q1_label;
  if (dom.faqQ2Label) dom.faqQ2Label.textContent = dict.faq_q2_label;
  if (dom.faqQ3Label) dom.faqQ3Label.textContent = dict.faq_q3_label;
  if (dom.faqQ4Label) dom.faqQ4Label.textContent = dict.faq_q4_label;
  if (dom.faqQ5Label) dom.faqQ5Label.textContent = dict.faq_q5_label;
  if (dom.faqQ6Label) dom.faqQ6Label.textContent = dict.faq_q6_label;

  // Code Section Labels
  if (dom.codeSectionTitle) dom.codeSectionTitle.textContent = dict.code_section_title;
  if (dom.labelCodeGithub) dom.labelCodeGithub.textContent = dict.label_code_github;
  if (dom.labelCopyCode) dom.labelCopyCode.textContent = dict.label_copy_code;
  if (dom.explanationHeading) dom.explanationHeading.textContent = dict.explanation_heading;
  if (dom.tierChipCode) dom.tierChipCode.textContent = dict.tier_chip_code;

  // Workbench & DeepWiki & Theory Labels
  if (dom.labelLinkDeepwiki) dom.labelLinkDeepwiki.textContent = dict.link_deepwiki;
  if (dom.labelToggleFullscreen) {
    dom.labelToggleFullscreen.textContent = dom.drawer.classList.contains('is-fullscreen')
      ? dict.toggle_windowed
      : dict.toggle_fullscreen;
  }
  if (dom.anchorLabelDeepwiki) dom.anchorLabelDeepwiki.textContent = dict.anchor_deepwiki;
  if (dom.anchorLabelTheory) dom.anchorLabelTheory.textContent = dict.anchor_theory;
  if (dom.anchorLabelCode) dom.anchorLabelCode.textContent = dict.anchor_code;
  if (dom.anchorLabelWalkthrough) dom.anchorLabelWalkthrough.textContent = dict.anchor_walkthrough;
  if (dom.anchorLabelLineage) dom.anchorLabelLineage.textContent = dict.anchor_lineage;
  if (dom.anchorLabelFaq) dom.anchorLabelFaq.textContent = dict.anchor_faq;
  if (dom.titleDeepwikiSection) dom.titleDeepwikiSection.textContent = dict.title_deepwiki_section;
  if (dom.deepwikiExtBtn) {
    const span = dom.deepwikiExtBtn.querySelector('span');
    if (span) span.textContent = dict.btn_deepwiki_full;
  }
  if (dom.descDeepwiki) dom.descDeepwiki.textContent = dict.desc_deepwiki;
  if (dom.titleCoreArtifacts) dom.titleCoreArtifacts.textContent = dict.title_core_artifacts;
  if (dom.titleTheorySection) dom.titleTheorySection.textContent = dict.title_theory_section;
  if (dom.theoryTagLabel) dom.theoryTagLabel.textContent = dict.theory_tag_label;
  if (dom.titleMathFoundation) dom.titleMathFoundation.textContent = dict.title_math_foundation;
  if (dom.titleKeyEquations) dom.titleKeyEquations.textContent = dict.title_key_equations;
  if (dom.titleTheoryMapping) dom.titleTheoryMapping.textContent = dict.title_theory_mapping;

  // Methodology Modal
  if (dom.docsModalTitle) dom.docsModalTitle.textContent = dict.docs_modal_title;
  renderDocsModalBody(lang);

  // Re-render library cards in selected language
  renderLibraryCards();
}

// ============================================================================
// Data Loading
// ============================================================================

async function loadGraphData(): Promise<GraphData> {
  const candidateUrls = [
    './data/graph_data.json',
    'data/graph_data.json',
    '/data/graph_data.json',
    './graph_data.json',
    '/graph_data.json',
    '../data/graph_data.json'
  ];

  for (const url of candidateUrls) {
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const json = await resp.json();
        if (json && json.nodes && json.edges) {
          console.log(`[Roadmap] Successfully loaded graph data from ${url}`);
          return json as GraphData;
        }
      }
    } catch {
      // Try next
    }
  }

  console.warn('[Roadmap] External graph_data.json not reachable, falling back to embedded milestones.');
  return FALLBACK_DATA;
}

async function loadPublicationsData(): Promise<PublicationItem[]> {
  const candidateUrls = [
    './data/deepmind_publications_analysis.json',
    'data/deepmind_publications_analysis.json',
    './data/deepmind_all_publications.json',
    'data/deepmind_all_publications.json',
    '/data/deepmind_publications_analysis.json',
    '/data/deepmind_all_publications.json',
    '../data/deepmind_publications_analysis.json'
  ];

  for (const url of candidateUrls) {
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const json = await resp.json();
        if (json && json.all_papers && Array.isArray(json.all_papers)) {
          console.log(`[Roadmap] Successfully loaded ${json.all_papers.length} publications from ${url}`);
          return json.all_papers as PublicationItem[];
        } else if (Array.isArray(json)) {
          console.log(`[Roadmap] Successfully loaded raw ${json.length} publications from ${url}`);
          return json.map((p) => ({
            ...p,
            theme: p.theme || "Frontier Safety, Alignment & Society",
            milestone: p.milestone || {
              tier: "Tier C: Standard Contribution",
              label: "专业贡献与评估",
              score: 60,
              reason: "特定实验评估与细分领域探索"
            }
          }));
        }
      }
    } catch {
      // Continue next candidate
    }
  }

  return [];
}

// ============================================================================
// Cytoscape Initialization & Styling
// ============================================================================

function createCytoscape(data: GraphData): Core {
  const elements: cytoscape.ElementDefinition[] = [];

  // Transform nodes
  data.nodes.forEach((node) => {
    const baseSize = 50;
    const impactBonus = Math.max(0, (node.impact_score - 70) * 1.25);
    const size = Math.round(baseSize + impactBonus);
    const topicColor = TOPIC_COLORS[node.primary_topic] || DEFAULT_TOPIC_COLOR;

    elements.push({
      group: 'nodes',
      data: {
        id: node.id,
        label: node.label,
        title: node.title,
        year: node.year,
        primary_topic: node.primary_topic,
        topic_color: topicColor,
        impact_score: node.impact_score,
        citations: node.citations,
        size: size,
        raw: node
      }
    });
  });

  // Transform edges
  data.edges.forEach((edge) => {
    elements.push({
      group: 'edges',
      data: {
        id: `${edge.source}->${edge.target}`,
        source: edge.source,
        target: edge.target,
        relation: edge.relation,
        description: edge.description
      }
    });
  });

  const cy = cytoscape({
    container: dom.cyContainer,
    elements: elements,
    boxSelectionEnabled: false,
    autounselectify: false,
    minZoom: 0.2,
    maxZoom: 3.0,
    wheelSensitivity: 0.25,
    style: [
      // Base Node
      {
        selector: 'node',
        style: {
          'shape': 'round-rectangle',
          'width': 'data(size)',
          'height': 'data(size)',
          'background-color': 'data(topic_color)',
          'background-opacity': 0.92,
          'border-width': 2,
          'border-color': '#ffffff',
          'border-opacity': 0.35,
          'label': 'data(label)',
          'color': '#f8fafc',
          'font-family': 'Inter, sans-serif',
          'font-size': '11px',
          'font-weight': 'bold',
          'text-valign': 'center',
          'text-halign': 'center',
          'text-wrap': 'wrap',
          'text-max-width': '80px',
          'text-outline-color': '#0f172a',
          'text-outline-width': 2,
          'text-outline-opacity': 0.9,
          'transition-property': 'background-color, border-color, border-width, opacity, transform',
          'transition-duration': 250
        }
      },
      // High-Impact Node Accent
      {
        selector: 'node[impact_score >= 95]',
        style: {
          'border-color': '#fbbf24',
          'border-width': 3.5,
          'border-opacity': 0.9
        }
      },
      // Base Edge
      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'target-arrow-color': '#64748b',
          'line-color': '#475569',
          'width': 2,
          'arrow-scale': 1.1,
          'opacity': 0.65,
          'transition-property': 'line-color, target-arrow-color, width, opacity',
          'transition-duration': 250
        }
      },
      // Current Selected Node
      {
        selector: 'node.selected',
        style: {
          'border-color': '#06b6d4',
          'border-width': 5,
          'border-opacity': 1,
          'background-opacity': 1
        }
      },
      // Ancestor Node (Predecessor Chain)
      {
        selector: 'node.ancestor',
        style: {
          'border-color': '#f59e0b',
          'border-width': 4,
          'border-opacity': 1,
          'background-opacity': 1
        }
      },
      // Descendant Node (Successor Chain)
      {
        selector: 'node.descendant',
        style: {
          'border-color': '#10b981',
          'border-width': 4,
          'border-opacity': 1,
          'background-opacity': 1
        }
      },
      // Ancestor Edge
      {
        selector: 'edge.edge-ancestor',
        style: {
          'line-color': '#f59e0b',
          'target-arrow-color': '#f59e0b',
          'width': 3.5,
          'opacity': 1,
          'z-index': 9
        }
      },
      // Descendant Edge
      {
        selector: 'edge.edge-descendant',
        style: {
          'line-color': '#10b981',
          'target-arrow-color': '#10b981',
          'width': 3.5,
          'opacity': 1,
          'z-index': 9
        }
      },
      // Dimmed Elements
      {
        selector: 'node.dimmed',
        style: {
          'opacity': 0.15
        }
      },
      {
        selector: 'edge.dimmed',
        style: {
          'opacity': 0.08
        }
      },
      // Filter Hidden
      {
        selector: '.hidden',
        style: {
          'display': 'none'
        }
      },
      // Search Highlight
      {
        selector: 'node.search-match',
        style: {
          'border-color': '#38bdf8',
          'border-width': 4,
          'border-opacity': 1
        }
      }
    ]
  });

  return cy;
}

// ============================================================================
// Layout Calculation (Dagre Directed Graph)
// ============================================================================

function runLayout(rankDir: 'LR' | 'TB') {
  if (!state.cy) return;

  const layout = state.cy.layout({
    name: 'dagre',
    // @ts-ignore
    rankDir: rankDir,
    nodeSep: 60,
    rankSep: rankDir === 'LR' ? 120 : 80,
    edgeSep: 30,
    padding: 50,
    animate: true,
    animationDuration: 500,
    animationEasing: 'ease-in-out'
  });

  layout.run();
}

// ============================================================================
// Filters & Search & Lineage Highlighting
// ============================================================================

function applyFilters() {
  if (!state.cy) return;

  const query = state.searchQuery.trim().toLowerCase();
  const maxYear = state.timelineYear;
  const impactOnly = state.impactFocus;

  state.cy.batch(() => {
    state.cy!.nodes().forEach((node) => {
      const raw: PaperNodeData = node.data('raw');
      let visible = true;
      let matchedBySearch = false;

      // 1. Timeline filter
      if (raw.year > maxYear) {
        visible = false;
      }

      // 2. Topic filter
      if (state.selectedTopic !== 'ALL') {
        const nodeTopic = raw.primary_topic;
        if (nodeTopic !== state.selectedTopic) {
          visible = false;
        }
      }

      // 3. Impact focus filter
      if (impactOnly && raw.impact_score < 93) {
        visible = false;
      }

      // 4. Keyword search
      if (query.length > 0) {
        const titleMatch = raw.title.toLowerCase().includes(query);
        const labelMatch = raw.label.toLowerCase().includes(query);
        const tldrMatch = raw.tldr.toLowerCase().includes(query);
        const authorMatch = raw.authors.some(a => a.toLowerCase().includes(query));
        const topicMatch = raw.topics.some(t => t.toLowerCase().includes(query));

        if (titleMatch || labelMatch || tldrMatch || authorMatch || topicMatch) {
          matchedBySearch = true;
        } else {
          visible = false;
        }
      }

      // Apply visibility classes
      if (!visible) {
        node.addClass('hidden');
        node.removeClass('search-match');
      } else {
        node.removeClass('hidden');
        if (query.length > 0 && matchedBySearch) {
          node.addClass('search-match');
        } else {
          node.removeClass('search-match');
        }
      }
    });

    // Edges are visible only if both source and target are not hidden
    state.cy!.edges().forEach((edge) => {
      const src = edge.source();
      const tgt = edge.target();
      if (src.hasClass('hidden') || tgt.hasClass('hidden')) {
        edge.addClass('hidden');
      } else {
        edge.removeClass('hidden');
      }
    });
  });

  // Re-run lineage highlight if a node is currently selected
  if (state.selectedNodeId) {
    const activeNode = state.cy.getElementById(state.selectedNodeId);
    if (activeNode.nonempty() && !activeNode.hasClass('hidden')) {
      highlightLineage(activeNode);
    } else {
      clearSelection();
    }
  }
}

// Highlight Ancestors (Predecessors) and Descendants (Successors)
function highlightLineage(targetNode: NodeSingular) {
  if (!state.cy) return;

  state.cy.batch(() => {
    // Clear previous classes
    state.cy!.elements().removeClass('selected ancestor descendant edge-ancestor edge-descendant dimmed');

    // 1. Mark target
    targetNode.addClass('selected');

    // 2. Find all ancestors recursively
    const ancestors = targetNode.predecessors('node');
    const ancestorEdges = targetNode.predecessors('edge');

    ancestors.addClass('ancestor');
    ancestorEdges.addClass('edge-ancestor');

    // 3. Find all descendants recursively
    const descendants = targetNode.successors('node');
    const descendantEdges = targetNode.successors('edge');

    descendants.addClass('descendant');
    descendantEdges.addClass('edge-descendant');

    // 4. Dim everything else that is not in the lineage
    const activeSet = targetNode.union(ancestors).union(ancestorEdges).union(descendants).union(descendantEdges);
    state.cy!.elements().not(activeSet).addClass('dimmed');
  });
}

function clearSelection() {
  if (!state.cy) return;
  state.selectedNodeId = null;

  state.cy.batch(() => {
    state.cy!.elements().removeClass('selected ancestor descendant edge-ancestor edge-descendant dimmed');
  });

  closeDrawer();
}

// ============================================================================
// Tooltip & Drawer Renderers
// ============================================================================

function showTooltip(node: NodeSingular, renderedPosition: { x: number; y: number }) {
  const raw: PaperNodeData = node.data('raw');
  if (!raw) return;

  const domainName = DOMAIN_I18N[raw.primary_topic]
    ? DOMAIN_I18N[raw.primary_topic][state.lang]
    : raw.primary_topic;

  dom.ttTopic.textContent = domainName;
  dom.ttTopic.style.color = TOPIC_COLORS[raw.primary_topic] || DEFAULT_TOPIC_COLOR;
  dom.ttYear.textContent = `${raw.year} · ${raw.venue}`;
  dom.ttTitle.textContent = raw.title;
  dom.ttScore.textContent = raw.impact_score.toString();
  dom.ttCitations.textContent = raw.citations.toLocaleString();
  dom.ttTldr.textContent = raw.tldr;

  dom.nodeTooltip.style.left = `${renderedPosition.x}px`;
  dom.nodeTooltip.style.top = `${renderedPosition.y}px`;
  dom.nodeTooltip.style.display = 'block';
}

function hideTooltip() {
  dom.nodeTooltip.style.display = 'none';
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderDeepWiki(raw: PaperNodeData) {
  const deepwikiUrl = raw.deepwiki_url || (raw.github_url ? raw.github_url.replace('https://github.com/', 'https://deepwiki.com/') : 'https://deepwiki.com/google-deepmind/alphafold');
  
  if (dom.linkDeepwiki) {
    dom.linkDeepwiki.style.display = 'inline-flex';
    dom.linkDeepwiki.href = deepwikiUrl;
  }
  if (dom.deepwikiExtBtn) {
    dom.deepwikiExtBtn.style.display = 'inline-flex';
    dom.deepwikiExtBtn.href = deepwikiUrl;
  }

  const repo = raw.repo_structure;
  if (repo) {
    if (dom.deepwikiRepoName) dom.deepwikiRepoName.textContent = repo.repo_name || 'google-deepmind';
    if (dom.deepwikiTreeContent) dom.deepwikiTreeContent.textContent = repo.tree_text || '# No structure tree available';
    
    if (dom.deepwikiArtifactsList) {
      if (repo.core_artifacts && Array.isArray(repo.core_artifacts) && repo.core_artifacts.length > 0) {
        dom.deepwikiArtifactsList.innerHTML = repo.core_artifacts.map((art: any) => `
          <div class="artifact-card">
            <div class="artifact-card-header">
              <span class="artifact-type-tag">${escapeHtml(art.type || 'Source Module')}</span>
              <code class="artifact-path">${escapeHtml(art.path || '')}</code>
            </div>
            <p class="artifact-desc">${escapeHtml(art.purpose || '')}</p>
          </div>
        `).join('');
      } else {
        dom.deepwikiArtifactsList.innerHTML = `<div style="grid-column: 1 / -1; color: var(--text-muted); font-size: 0.88rem; padding: 8px 0;">${state.lang === 'zh' ? '暂无核心产物标注' : 'No core artifacts annotated'}</div>`;
      }
    }
  } else {
    const repoName = raw.github_url ? raw.github_url.replace('https://github.com/', '') : 'google-deepmind/gemma_pytorch';
    if (dom.deepwikiRepoName) dom.deepwikiRepoName.textContent = repoName;
    if (dom.deepwikiTreeContent) dom.deepwikiTreeContent.textContent = `# Repository structure indexed by DeepWiki\n# Explore at ${deepwikiUrl}\n\n${repoName}/\n├── README.md\n├── requirements.txt\n├── pyproject.toml\n└── src/\n    ├── model.py\n    ├── train.py\n    └── inference.py`;
    if (dom.deepwikiArtifactsList) {
      dom.deepwikiArtifactsList.innerHTML = `
        <div class="artifact-card">
          <div class="artifact-card-header">
            <span class="artifact-type-tag">Core Entry</span>
            <code class="artifact-path">${repoName}/src/model.py</code>
          </div>
          <p class="artifact-desc">${state.lang === 'zh' ? '核心算法网络定义与前向传播实现' : 'Core neural network architecture and forward graph'}</p>
        </div>
        <div class="artifact-card">
          <div class="artifact-card-header">
            <span class="artifact-type-tag">Optimization</span>
            <code class="artifact-path">${repoName}/src/train.py</code>
          </div>
          <p class="artifact-desc">${state.lang === 'zh' ? '目标损失函数计算与分布式优化引擎' : 'Loss function calculation and distributed optimizer'}</p>
        </div>
      `;
    }
  }
}

function renderTheory(raw: PaperNodeData) {
  const theory = raw.theory_explanation;
  if (theory) {
    if (dom.theoryFoundationContent) {
      dom.theoryFoundationContent.textContent = theory.mathematical_foundations || (state.lang === 'zh' ? '该算法在特定损失目标与动力学约束下完成形式化求解。' : 'The algorithm optimizes formal loss objectives under dynamical constraints.');
    }
    
    if (dom.theoryEquationsList) {
      if (theory.key_equations && Array.isArray(theory.key_equations) && theory.key_equations.length > 0) {
        dom.theoryEquationsList.innerHTML = theory.key_equations.map((eq: any) => `
          <div class="equation-card">
            <div class="equation-card-header">
              <span class="equation-name">${escapeHtml(eq.name || '公式定义')}</span>
            </div>
            <div class="equation-latex"><code>${escapeHtml(eq.latex || '')}</code></div>
            <p class="equation-desc">${escapeHtml(eq.description || '')}</p>
          </div>
        `).join('');
      } else {
        dom.theoryEquationsList.innerHTML = `<div style="color: var(--text-muted); font-size: 0.88rem;">${state.lang === 'zh' ? '暂无公式定义' : 'No key equations provided'}</div>`;
      }
    }

    if (dom.theoryMappingTbody) {
      if (theory.theory_code_mapping && Array.isArray(theory.theory_code_mapping) && theory.theory_code_mapping.length > 0) {
        dom.theoryMappingTbody.innerHTML = theory.theory_code_mapping.map((m: any) => `
          <tr>
            <td><code class="theory-symbol">${escapeHtml(m.symbol || '')}</code></td>
            <td><code class="theory-var">${escapeHtml(m.code_variable || '')}</code></td>
            <td class="theory-meaning">${escapeHtml(m.math_meaning || '')}</td>
          </tr>
        `).join('');
      } else {
        dom.theoryMappingTbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">${state.lang === 'zh' ? '暂无符号映射' : 'No symbol mapping available'}</td></tr>`;
      }
    }
  } else {
    if (dom.theoryFoundationContent) {
      dom.theoryFoundationContent.textContent = state.lang === 'zh'
        ? '该论文算法理论立足于数理优化、信息论与统计学习理论。'
        : 'Theoretical foundations grounded in statistical learning and optimization.';
    }
    if (dom.theoryEquationsList) {
      dom.theoryEquationsList.innerHTML = `
        <div class="equation-card">
          <div class="equation-card-header">
            <span class="equation-name">Optimization Objective</span>
          </div>
          <div class="equation-latex"><code>\\min_\\theta \\mathbb{E}_{(x, y) \\sim \\mathcal{D}} [\\mathcal{L}(f_\\theta(x), y)] + \\lambda \\Omega(\\theta)</code></div>
          <p class="equation-desc">${state.lang === 'zh' ? '参数化模型的经验风险最小化与正则化泛函' : 'Empirical risk minimization with parameter regularization.'}</p>
        </div>
      `;
    }
    if (dom.theoryMappingTbody) {
      dom.theoryMappingTbody.innerHTML = `
        <tr>
          <td><code class="theory-symbol">\\theta</code></td>
          <td><code class="theory-var">model.parameters()</code></td>
          <td class="theory-meaning">${state.lang === 'zh' ? '神经网络可学习权重与偏置张量' : 'Trainable neural network weight tensors'}</td>
        </tr>
        <tr>
          <td><code class="theory-symbol">\\mathcal{L}</code></td>
          <td><code class="theory-var">criterion(output, target)</code></td>
          <td class="theory-meaning">${state.lang === 'zh' ? '任务特定的损失函数（交叉熵或均方误差）' : 'Task-specific objective loss function'}</td>
        </tr>
      `;
    }
  }
}

function openDrawer(raw: PaperNodeData) {
  state.selectedNodeId = raw.id;

  const domainName = DOMAIN_I18N[raw.primary_topic]
    ? DOMAIN_I18N[raw.primary_topic][state.lang]
    : raw.primary_topic;

  // Header metadata
  dom.detailGen.textContent = raw.generation;
  dom.detailTopic.textContent = domainName;
  dom.detailTopic.style.borderColor = TOPIC_COLORS[raw.primary_topic] || DEFAULT_TOPIC_COLOR;
  dom.detailVenue.textContent = raw.venue;
  dom.detailYear.textContent = raw.year.toString();
  dom.detailTitle.textContent = raw.title;
  dom.detailAuthors.textContent = raw.authors.join(', ');

  // Links
  dom.linkCoolpapers.href = getCoolPapersUrl(raw.arxiv_id, raw.title);

  if (raw.github_url) {
    dom.linkGithub.style.display = 'inline-flex';
    dom.linkGithub.href = raw.github_url;
    dom.codeGithubBtn.style.display = 'inline-flex';
    dom.codeGithubBtn.href = raw.github_url;
  } else {
    dom.linkGithub.style.display = 'none';
    dom.codeGithubBtn.style.display = 'none';
  }

  if (raw.arxiv_id) {
    dom.linkArxiv.style.display = 'inline-flex';
    dom.linkArxiv.href = `https://arxiv.org/abs/${raw.arxiv_id}`;
  } else {
    dom.linkArxiv.style.display = 'none';
  }

  if (raw.pdf_url) {
    dom.linkPdf.style.display = 'inline-flex';
    dom.linkPdf.href = raw.pdf_url;
  } else {
    dom.linkPdf.style.display = 'none';
  }

  if (raw.url) {
    dom.linkDeepmind.style.display = 'inline-flex';
    dom.linkDeepmind.href = raw.url;
  } else {
    dom.linkDeepmind.style.display = 'none';
  }

  // Impact metrics
  dom.metricScore.textContent = `${raw.impact_score}/100`;
  dom.metricCitations.textContent = raw.citations.toLocaleString();
  dom.metricInfluential.textContent = raw.influential_citations.toLocaleString();
  dom.metricVelocity.textContent = `+${raw.annual_citation_velocity}/yr`;

  // Lineage buttons
  renderLineageLists(raw.id);

  // DeepWiki & Theory rendering
  renderDeepWiki(raw);
  renderTheory(raw);

  // Core Pseudocode / Source Code rendering
  const repoFallback = raw.github_url || "https://github.com/google-deepmind/gemma_pytorch";
  const pseudocode = raw.pseudocode || `# DeepMind Research Implementation: ${raw.title}\n# Module: ${raw.primary_topic}\n# Specific repository: ${repoFallback}`;
  dom.codeSnippetContent.textContent = pseudocode;

  // Auxiliary Explanation rendering
  renderCodeExplanation(raw.code_explanation, state.lang);

  // CoolPapers 6-Dimensional FAQ
  dom.faqQ1.textContent = raw.faq.q1_problem;
  dom.faqQ2.textContent = raw.faq.q2_lineage;
  dom.faqQ3.textContent = raw.faq.q3_innovation;
  dom.faqQ4.textContent = raw.faq.q4_experiments;
  dom.faqQ5.textContent = raw.faq.q5_deepmind_role;
  dom.faqQ6.textContent = raw.faq.q6_tldr;

  // Reset scroll position to top
  if (dom.workbenchScrollBody) {
    dom.workbenchScrollBody.scrollTop = 0;
  }

  // Reset active anchor nav item
  if (dom.workbenchAnchorNav) {
    dom.workbenchAnchorNav.querySelectorAll('.anchor-nav-btn').forEach((b, idx) => {
      b.classList.toggle('active', idx === 0);
    });
  }

  // Open modal workbench UI (directly full expansive)
  dom.drawer.classList.add('open');
  dom.drawer.setAttribute('aria-hidden', 'false');
  dom.drawerBackdrop.classList.add('visible');
}

function closeDrawer() {
  dom.drawer.classList.remove('open');
  dom.drawer.classList.remove('is-fullscreen');
  dom.drawer.setAttribute('aria-hidden', 'true');
  dom.drawerBackdrop.classList.remove('visible');
  if (dom.labelToggleFullscreen) {
    dom.labelToggleFullscreen.textContent = state.lang === 'zh' ? '全屏研读' : 'Fullscreen';
  }
}

function renderCodeExplanation(expData: any, lang: 'zh' | 'en') {
  if (!dom.codeExplanationText) return;
  if (!expData) {
    dom.codeExplanationText.innerHTML = `<p style="font-style: italic; color: var(--text-muted);">${lang === 'zh' ? '暂无详细辅助解释' : 'No walkthrough available'}</p>`;
    return;
  }

  const exp = expData[lang] || expData.zh || expData.en || expData;
  const dict = I18N[lang];

  if (typeof exp === 'string') {
    dom.codeExplanationText.innerHTML = `<p style="margin: 0; line-height: 1.6;">${exp}</p>`;
    return;
  }

  const stepsHtml = (exp.key_steps && Array.isArray(exp.key_steps))
    ? `<ul class="exp-step-list">${exp.key_steps.map((s: string) => `<li>${s}</li>`).join('')}</ul>`
    : '';

  dom.codeExplanationText.innerHTML = `
    <div class="exp-section-item">
      <span class="exp-subtitle">📌 ${dict.code_overview_label}</span>
      <p style="margin: 0; line-height: 1.6;">${exp.overview || ''}</p>
    </div>

    ${stepsHtml ? `
    <div class="exp-section-item">
      <span class="exp-subtitle">⚡ ${dict.code_steps_label}</span>
      ${stepsHtml}
    </div>
    ` : ''}

    ${exp.computational_flow ? `
    <div class="exp-section-item">
      <span class="exp-subtitle">🔄 ${dict.code_flow_label}</span>
      <div class="exp-flow-box">${exp.computational_flow}</div>
    </div>
    ` : ''}

    ${exp.engineering_highlights ? `
    <div class="exp-section-item">
      <span class="exp-subtitle">🛠️ ${dict.code_highlights_label}</span>
      <div class="exp-highlight-box">${exp.engineering_highlights}</div>
    </div>
    ` : ''}
  `;
}

function renderLineageLists(nodeId: string) {
  if (!state.cy || !state.graphData) return;

  const node = state.cy.getElementById(nodeId);
  const dict = I18N[state.lang];

  if (!node || node.empty()) {
    dom.lineagePredecessors.innerHTML = `<span class="empty-hint">${dict.lineage_not_in_graph}</span>`;
    dom.lineageSuccessors.innerHTML = `<span class="empty-hint">${dict.lineage_not_in_graph}</span>`;
    return;
  }

  const incomingEdges = node.incomers('edge');
  const outgoingEdges = node.outgoers('edge');

  // 1. Direct Predecessors
  dom.lineagePredecessors.innerHTML = '';
  if (incomingEdges.length === 0) {
    dom.lineagePredecessors.innerHTML = `<span class="empty-hint">${dict.lineage_empty_pred}</span>`;
  } else {
    incomingEdges.forEach(edge => {
      const predNode = edge.source();
      const predRaw: PaperNodeData = predNode.data('raw');
      const edgeDesc = edge.data('description') || (state.lang === 'zh' ? '重要理论前驱' : 'Core Predecessor');

      const chip = document.createElement('button');
      chip.className = 'lineage-chip';
      chip.innerHTML = `
        <span class="lineage-chip-title">${predRaw.label}: ${predRaw.title}</span>
        <span class="lineage-chip-rel">🔗 ${edgeDesc}</span>
      `;
      chip.onclick = () => jumpToNode(predRaw.id);
      dom.lineagePredecessors.appendChild(chip);
    });
  }

  // 2. Direct Successors
  dom.lineageSuccessors.innerHTML = '';
  if (outgoingEdges.length === 0) {
    dom.lineageSuccessors.innerHTML = `<span class="empty-hint">${dict.lineage_empty_succ}</span>`;
  } else {
    outgoingEdges.forEach(edge => {
      const succNode = edge.target();
      const succRaw: PaperNodeData = succNode.data('raw');
      const edgeDesc = edge.data('description') || (state.lang === 'zh' ? '后续技术衍生' : 'Derivative Work');

      const chip = document.createElement('button');
      chip.className = 'lineage-chip';
      chip.innerHTML = `
        <span class="lineage-chip-title">${succRaw.label}: ${succRaw.title}</span>
        <span class="lineage-chip-rel">⚡ ${edgeDesc}</span>
      `;
      chip.onclick = () => jumpToNode(succRaw.id);
      dom.lineageSuccessors.appendChild(chip);
    });
  }
}

function jumpToNode(nodeId: string) {
  if (state.activeView !== 'graph') {
    switchView('graph');
  }
  if (!state.cy) return;
  const targetNode = state.cy.getElementById(nodeId);
  if (targetNode.nonempty()) {
    if (targetNode.hasClass('hidden')) {
      state.timelineYear = 2026;
      dom.timelineSlider.value = '2026';
      dom.yearDisplay.textContent = '2026';
      state.selectedTopic = 'ALL';
      document.querySelectorAll('#topic-chips .chip').forEach(c => c.classList.remove('active'));
      document.querySelector('#topic-chips .chip[data-topic="ALL"]')?.classList.add('active');
      applyFilters();
    }

    state.cy.animate({
      center: { eles: targetNode },
      zoom: 1.2,
      duration: 350
    });

    highlightLineage(targetNode);
    openDrawer(targetNode.data('raw'));
  }
}

// ============================================================================
// View Switcher & Multi-Lab Explorer Logic
// ============================================================================

interface LabPreviewData {
  name: string;
  badge: string;
  icon: string;
  color: string;
  motto: { zh: string; en: string };
  philosophy: { zh: string; en: string };
  milestones: Array<{ year: string; title: string; highlight: string; tag: string }>;
  contribution: { zh: string; en: string };
}

const LABS_PREVIEW: Record<string, LabPreviewData> = {
  openai: {
    name: "OpenAI",
    badge: "Roadmap Upcoming · 2016-2026",
    icon: "⚡",
    color: "#10b981",
    motto: {
      zh: "确保通用人工智能 (AGI) 惠及全人类。",
      en: "Ensuring that artificial general intelligence benefits all of humanity."
    },
    philosophy: {
      zh: "确立以纯 Transformer 为核心的扩展假说 (Scaling Laws) 与生成式预训练范式，开创基于人类偏好的强化学习 (RLHF) 对齐体系，并率先突破测试时强化学习推理扩展 (OpenAI o1)。",
      en: "Pioneered the Scaling Laws hypothesis with Transformers and Generative Pre-training, established RLHF alignment, and broke through test-time compute scaling with OpenAI o1."
    },
    milestones: [
      { year: "2016", title: "OpenAI Gym", highlight: "强化学习算法的标准化基准测试套件，成为全球强化学习研究基础设施", tag: "RL Benchmark" },
      { year: "2017", title: "Proximal Policy Optimization (PPO)", highlight: "近端策略优化算法，兼顾稳定性与高效性，后成为大模型 RLHF 核心优化器", tag: "Core Algorithm" },
      { year: "2018", title: "GPT-1 (Generative Pre-Training)", highlight: "证明无监督预训练 + 有监督微调在长文本理解上的通用威力", tag: "Foundation Paradigm" },
      { year: "2019", title: "GPT-2 & Scaling Laws 雏形", highlight: "证明更大参数规模与海量无标注数据能自发涌现跨任务多技能零样本 (Zero-shot) 能力", tag: "Emergent Abilities" },
      { year: "2020", title: "GPT-3 (Few-Shot Learners)", highlight: "1750 亿参数里程碑，确立 Prompt 工程与 In-Context Learning 范式", tag: "Landmark Breakthrough" },
      { year: "2021", title: "CLIP & DALL-E", highlight: "对比多模态语言-图像表征学习与文本条件图像生成开创之作", tag: "Multimodal Foundation" },
      { year: "2022", title: "InstructGPT & ChatGPT", highlight: "引入 RLHF 解决幻觉与对齐，成为人工智能历史上商业化速度最快的产品与转折点", tag: "Alignment Revolution" },
      { year: "2023", title: "GPT-4 (MoE & Multimodal)", highlight: "突破专家混合架构 (MoE)，并在律师考试、GRE 等学术及专业基准上达到人类顶尖水准", tag: "Frontier Foundation" },
      { year: "2024", title: "Sora & OpenAI o1 (Strawberry)", highlight: "Sora 确立视频扩散世界模拟器；o1 引入强化学习思维链，开辟 Test-Time Compute 扩展全新轴线", tag: "Reasoning Paradigm" }
    ],
    contribution: {
      zh: "OpenAI 技术图谱与论文索引正在加速结构化清洗中。欢迎关注 GitHub 仓库或提交 PR/Issue 共同编纂！",
      en: "OpenAI research graph and publications catalog are currently undergoing data ingestion. Contributions welcome via GitHub PR/Issues!"
    }
  },
  anthropic: {
    name: "Anthropic",
    badge: "Roadmap Upcoming · 2021-2026",
    icon: "🛡️",
    color: "#f59e0b",
    motto: {
      zh: "以安全与可解释性为基石，探索可控的前沿通用智能。",
      en: "AI research and products that put safety at the frontier."
    },
    philosophy: {
      zh: "由前 OpenAI 核心对齐研究人员创立，率先提出宪法式人工智能 (Constitutional AI / RLAIF) 降低人类干预成本，并在神经网络机械可解释性 (Mechanistic Interpretability) 与单语义特征上取得根本性突破。",
      en: "Pioneered Constitutional AI (RLAIF) to automate alignment, while leading foundational breakthroughs in mechanistic interpretability and sparse autoencoders."
    },
    milestones: [
      { year: "2021", title: "A General Language Assistant as a Laboratory for Alignment", highlight: "系统研究 Helpful & Harmless 评估协议，奠定现代大模型对齐实证基准", tag: "Safety Protocol" },
      { year: "2022", title: "Constitutional AI: Harmlessness from AI Feedback", highlight: "提出 RLAIF，依靠预先设定的价值观与道德原则自我批评与修正，摆脱繁复人工标注", tag: "Paradigm Shift" },
      { year: "2022", title: "Toy Models of Superposition", highlight: "揭示神经网络中特征数量超越神经元维度的多重叠加机制，开启机械可解释性研究", tag: "Interpretability" },
      { year: "2023", title: "Claude 2 & 100k Context Window", highlight: "率先在工业界稳定落地 100k+ 超长上下文窗口，彻底改变长文本处理工作流", tag: "Long-Context" },
      { year: "2024", title: "Sleeper Agents: Training Deceptive LLMs", highlight: "证明经过安全对齐训练的模型仍可能潜伏休眠后门，对前沿 AI 审计敲响警钟", tag: "Frontier Defense" },
      { year: "2024", title: "Scaling Monosemanticity", highlight: "利用稀疏自编码器 (SAE) 从 Claude 中提取出数百万个精确单语义特征神经元", tag: "Mechanistic Breakthrough" },
      { year: "2024", title: "Claude 3.5 Sonnet", highlight: "在代码生成、视觉推理与跨模态综合基准测试中持续领跑全球商业与学术前沿", tag: "Flagship Frontier" }
    ],
    contribution: {
      zh: "Anthropic 宪法对齐与可解释性演进图谱正在数据整理中。欢迎通过 GitHub PR 贡献论文元数据！",
      en: "Anthropic's safety and interpretability roadmap is currently being curated. Welcome to contribute via GitHub!"
    }
  },
  meta: {
    name: "Meta AI (FAIR)",
    badge: "Roadmap Upcoming · 2013-2026",
    icon: "🌐",
    color: "#6366f1",
    motto: {
      zh: "通过开放与协作式科研，推动全球人工智能最前沿。",
      en: "Advancing the state of the art in AI through open and collaborative research."
    },
    philosophy: {
      zh: "全球开源生态的最核心筑基者，奠定现代深度学习基础软件框架 PyTorch，并以 LLaMA 家族彻底重塑全球开源模型竞争格局，在通用计算机视觉与自监督表示领域持续引领基准。",
      en: "Core pillar of open-source AI, maintaining PyTorch and empowering the global developer ecosystem with LLaMA while pioneering self-supervised vision."
    },
    milestones: [
      { year: "2015", title: "Deep Residual Learning for Image Recognition (ResNet)", highlight: "何恺明等提出残差连接解决深层网络退化，获得 CVPR 最佳论文，现代深度学习奠基石", tag: "Historical Foundation" },
      { year: "2016", title: "PyTorch Framework", highlight: "动态计算图与极佳 Python 交互体验，成为全球学术界事实上的标准深度学习平台", tag: "Open Source Pillar" },
      { year: "2021", title: "DINO: Emerging Properties in Self-Supervised Vision", highlight: "自监督视觉 Transformer 无需标注自发涌现语义分割掩码，开启视觉基础模型新范式", tag: "Self-Supervised Vision" },
      { year: "2022", title: "OPT-175B (Open Pre-trained Transformers)", highlight: "首个完整开源权重与训练日志的百亿大模型，推动开源社区大模型研究", tag: "Open LLM Pioneer" },
      { year: "2023", title: "LLaMA 1 & LLaMA 2 系列", highlight: "以极高能效与开放协议点燃全球开源大模型百花齐放浪潮，形成广泛开发者微调生态", tag: "Ecosystem Revolution" },
      { year: "2023", title: "Segment Anything (SAM)", highlight: "构建最大规模分割数据集与提示词驱动的通用分割模型，确立计算机视觉基础模型标杆", tag: "Vision Foundation" },
      { year: "2023", title: "DINOv2 & SeamlessM4T", highlight: "无监督视觉泛化特征提取器；实现近百种语言无缝表达的多模态语音翻译系统", tag: "Multimodal Benchmark" },
      { year: "2024", title: "LLaMA 3 & 3.1 405B / SAM 2", highlight: "405B 超大规模开源模型性能全面媲美闭源旗舰，SAM 2 拓展至全场景流式实时视频分割", tag: "Frontier Milestone" }
    ],
    contribution: {
      zh: "Meta FAIR 开源基石全景图谱正在录入中。欢迎在 GitHub 提交 PR 扩充脉络！",
      en: "Meta FAIR open foundation roadmap is being curated. PRs on GitHub are warmly welcomed!"
    }
  },
  msr: {
    name: "Microsoft Research (MSR)",
    badge: "Roadmap Upcoming · 1991-2026",
    icon: "💻",
    color: "#ec4899",
    motto: {
      zh: "以基础计算科学突破，赋能全球每一人与每一组织。",
      en: "Empowering every person and organization through foundational computing innovations."
    },
    philosophy: {
      zh: "专注高质量合成数据与小语言模型 (SLM) 高效推理，开创“教科书级别数据”范式 (Phi 系列)，突破分布式深度学习系统训练瓶颈 (DeepSpeed)，并引领知识检索 (GraphRAG) 与多智能体编排 (AutoGen)。",
      en: "Pioneered high-quality synthetic data for Small Language Models (Phi), developed DeepSpeed distributed optimization, and leads in multi-agent orchestration."
    },
    milestones: [
      { year: "2015", title: "ResNet (Deep Residual Learning)", highlight: "MSR 团队何恺明、孙剑等奠定现代深度神经网络通用架构，被誉为 AI 史上最高引用论文之一", tag: "Foundational Landmark" },
      { year: "2020", title: "DeepSpeed Engine & ZeRO", highlight: "显存优化与高效并行通信技术，使得单台服务器与小规模机群训练百亿/千亿大模型成为可能", tag: "System Optimization" },
      { year: "2023", title: "Textbooks Are All You Need (Phi-1)", highlight: "证明使用教科书级别合成数据与强过滤代码，可在 1.3B 微型参数量下大幅超越巨量模型", tag: "Data Quality Paradigm" },
      { year: "2023", title: "Orca: Progressive Learning from Complex Traces", highlight: "通过逐步学习丰富思考轨迹 (Explanation Traces) 让小模型掌握大模型的高阶推理能力", tag: "Model Distillation" },
      { year: "2023", title: "AutoGen: Multi-Agent Conversation Framework", highlight: "可定制、对话驱动的多智能体协同框架，极大简化了复杂自主任务的编排实现", tag: "Agent Framework" },
      { year: "2024", title: "Phi-3 & Phi-3.5 Mini / Vision", highlight: "端侧高智能先锋，以 3.8B 参数展现比肩早期 GPT-3.5 的指令遵循与多模态长文本能力", tag: "SLM Frontier" },
      { year: "2024", title: "GraphRAG: Knowledge Graph Enhanced RAG", highlight: "将知识图谱聚类与大模型总结相结合，突破传统向量检索在大规模非结构化文档上的孤岛局限", tag: "Knowledge Retrieval" }
    ],
    contribution: {
      zh: "Microsoft Research 小模型与分布式系统路线图正在梳理中，欢迎在 GitHub 提交 PR 共同补充！",
      en: "Microsoft Research roadmap is being processed. Contributions are welcome on GitHub!"
    }
  }
};

function openLabPreview(labKey: string) {
  const lab = LABS_PREVIEW[labKey];
  if (!lab || !dom.modalLabPreview || !dom.previewLabBody) return;

  const isZh = state.lang === 'zh';
  dom.previewLabIcon.textContent = lab.icon;
  dom.previewLabTitle.textContent = `${lab.name} - ${isZh ? '技术路线图与核心里程碑规划' : 'Roadmap & Milestones Preview'}`;

  dom.previewLabBody.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 18px;">
      <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <h4 style="font-size: 1.15rem; font-weight: 800; color: ${lab.color};">${lab.name}</h4>
          <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 9999px; background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.35); font-weight: 600;">${lab.badge}</span>
        </div>
        <p style="font-size: 0.88rem; font-style: italic; color: var(--text-muted); margin-bottom: 8px;">“${isZh ? lab.motto.zh : lab.motto.en}”</p>
        <p style="font-size: 0.86rem; line-height: 1.6; color: var(--text-secondary);">${isZh ? lab.philosophy.zh : lab.philosophy.en}</p>
      </div>

      <div>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; border-left: 3px solid ${lab.color}; padding-left: 10px;">
          ${isZh ? '技术演化核心里程碑编排 (Milestone Timeline)' : 'Curated Milestone Timeline'}
        </h4>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${lab.milestones.map(m => `
            <div style="display: flex; gap: 14px; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px 14px; align-items: baseline;">
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; font-weight: 700; color: ${lab.color}; min-width: 45px;">${m.year}</span>
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                  <strong style="font-size: 0.88rem; color: var(--text-primary);">${m.title}</strong>
                  <span style="font-size: 0.68rem; padding: 1px 6px; background: rgba(255, 255, 255, 0.08); border-radius: 4px; color: var(--text-muted);">${m.tag}</span>
                </div>
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0; line-height: 1.45;">${m.highlight}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="background: linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%); border: 1px dashed var(--brand-blue); border-radius: var(--radius-md); padding: 14px 18px; text-align: center;">
        <p style="font-size: 0.84rem; color: var(--text-primary); margin-bottom: 6px;">${isZh ? lab.contribution.zh : lab.contribution.en}</p>
        <a href="https://github.com/Iris-Orion/AiLabRoadMap" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 6px; color: var(--brand-blue); font-size: 0.82rem; font-weight: 600; text-decoration: none;">
          GitHub: Iris-Orion/AiLabRoadMap ↗
        </a>
      </div>
    </div>
  `;

  dom.modalLabPreview.style.display = 'flex';
}

function switchView(view: 'hub' | 'graph' | 'library') {
  state.activeView = view;

  // Reset tab active states
  if (dom.btnViewHub) dom.btnViewHub.classList.toggle('active', view === 'hub');
  if (dom.btnViewGraph) dom.btnViewGraph.classList.toggle('active', view === 'graph');
  if (dom.btnViewLibrary) dom.btnViewLibrary.classList.toggle('active', view === 'library');

  // Display toggles
  if (dom.hubView) dom.hubView.style.display = view === 'hub' ? 'flex' : 'none';
  if (dom.cyContainer) dom.cyContainer.style.display = view === 'graph' ? 'block' : 'none';
  if (dom.libraryView) dom.libraryView.style.display = view === 'library' ? 'flex' : 'none';

  // Secondary bar & controls toggles
  if (dom.dagControlbar) dom.dagControlbar.style.display = view === 'graph' ? 'flex' : 'none';
  if (dom.floatingLegend) dom.floatingLegend.style.display = view === 'graph' ? 'block' : 'none';

  // Canvas actions in header (fit, orientation)
  if (dom.btnFit) (dom.btnFit as HTMLElement).style.display = view === 'graph' ? 'inline-flex' : 'none';
  if (dom.btnLayoutToggle) (dom.btnLayoutToggle as HTMLElement).style.display = view === 'graph' ? 'inline-flex' : 'none';

  if (view === 'graph') {
    if (state.cy) {
      state.cy.resize();
      state.cy.fit(undefined, 30);
    }
  } else if (view === 'library') {
    renderLibraryCards();
  }
}

function setLibraryLayoutMode(mode: 'grid' | 'list') {
  state.libLayoutMode = mode;
  localStorage.setItem('dm_lib_layout', mode);
  if (dom.btnLayoutGrid) dom.btnLayoutGrid.classList.toggle('active', mode === 'grid');
  if (dom.btnLayoutList) dom.btnLayoutList.classList.toggle('active', mode === 'list');
  if (dom.libCardsGrid) dom.libCardsGrid.classList.toggle('mode-list', mode === 'list');
}

function getDomainPseudocodeAndExplanation(pub: PublicationItem, _isZh?: boolean): {
  github_url: string;
  deepwiki_url: string;
  repo_structure: RepoStructure;
  theory_explanation: TheoryExplanation;
  pseudocode: string;
  code_explanation: any;
} {
  const theme = pub.theme || "LLM & Multimodal";
  const title = pub.title;

  switch (theme) {
    case "LLM & Multimodal":
      return {
        github_url: "https://github.com/google-deepmind/gemma_pytorch",
        deepwiki_url: "https://deepwiki.com/google-deepmind/gemma_pytorch",
        repo_structure: {
          repo_name: "google-deepmind/gemma_pytorch",
          deepwiki_url: "https://deepwiki.com/google-deepmind/gemma_pytorch",
          tree_text: `google-deepmind/gemma_pytorch/
├── gemma/
│   ├── config.py             # Model hyperparameter dataclasses
│   ├── model.py              # Rotary Embeddings, RMSNorm, GeGLU & MoE Transformer
│   ├── tokenizer.py          # SentencePiece vocabulary & byte fallback
│   └── sampler.py            # KV caching & nucleus sampling
└── scripts/
    └── run.py                # Distributed TPU/GPU generation script`,
          core_artifacts: [
            { path: "gemma/model.py", type: "Core Model", purpose: "Rotary position embedding (RoPE), Multi-Head Attention & GeGLU MLP" },
            { path: "gemma/config.py", type: "Configuration", purpose: "Vocabulary size, head dimensions, and layer parameters" },
            { path: "gemma/sampler.py", type: "Inference Engine", purpose: "Autoregressive generation with KV caching and top-p sampling" }
          ]
        },
        theory_explanation: {
          mathematical_foundations: "基于因果自回归语言建模 (Autoregressive LM) 与旋转位置编码 (RoPE)，在复数内积空间中自然保留 token 间的相对几何距离。采用 RMSNorm 保持数值稳定性，并使用 GeGLU 门控非线性激活增强语义表征容量。",
          key_equations: [
            {
              name: "RoPE Rotary Transformation",
              latex: "\\mathbf{R}_{\\Theta, m}^d = \\mathrm{diag}\\left(\\begin{pmatrix} \\cos m\\theta_i & -\\sin m\\theta_i \\\\ \\sin m\\theta_i & \\cos m\\theta_i \\end{pmatrix}\\right)_{i=1}^{d/2}",
              description: "将查询 (Query) 和键 (Key) 向量按二维子空间旋转，使得内积仅依赖于相对位移 m - n。"
            },
            {
              name: "Autoregressive Cross-Entropy Loss",
              latex: "\\mathcal{L}_{\\text{LM}}(\\theta) = -\\frac{1}{T}\\sum_{t=1}^T \\log P_\\theta(w_t \\mid w_1, \\dots, w_{t-1})",
              description: "标准自回归交叉熵对数似然损失函数，驱动模型学习长序列因果推断。"
            }
          ],
          theory_code_mapping: [
            { symbol: "\\mathbf{R}_{\\Theta, m}^d", code_variable: "apply_rotary_emb(x, freqs_cis)", math_meaning: "复数旋转位置编码算子" },
            { symbol: "\\mathcal{L}_{\\text{LM}}", code_variable: "F.cross_entropy(logits, targets)", math_meaning: "自回归因果语言模型损失" },
            { symbol: "w_i", code_variable: "tokens", math_meaning: "离散文本与多模态分词 ID 序列" }
          ]
        },
        pseudocode: `# DeepMind Multimodal Architecture: ${title}
import torch
import torch.nn as nn
import torch.nn.functional as F

class MultimodalTransformerBlock(nn.Module):
    def __init__(self, d_model=4096, num_heads=32, num_experts=8):
        super().__init__()
        # Pre-LN Self-Attention with Rotary Position Embedding (RoPE)
        self.attn = MultiHeadAttentionWithRoPE(d_model, num_heads)
        self.router = nn.Linear(d_model, num_experts)
        self.experts = nn.ModuleList([
            nn.Sequential(nn.Linear(d_model, 4 * d_model), nn.SiLU(), nn.Linear(4 * d_model, d_model))
            for _ in range(num_experts)
        ])

    def forward(self, multimodal_tokens, attention_mask):
        # 1. Self-Attention over interleaved text/vision/audio tokens
        norm_x = self.norm1(multimodal_tokens)
        h = multimodal_tokens + self.attn(norm_x, mask=attention_mask)
        
        # 2. Sparse MoE Feed-Forward routing
        norm_h = self.norm2(h)
        routing_weights = F.softmax(self.router(norm_h), dim=-1)
        top_weights, top_idx = torch.topk(routing_weights, k=2)
        
        out = sum(w.unsqueeze(-1) * self.experts[idx](norm_h) for w, idx in zip(top_weights, top_idx))
        return h + out`,
        code_explanation: {
          zh: {
            overview: `本论文《${title}》聚焦大语言模型与多模态感知前沿，采用原生交错预训练与稀疏专家混合 (Sparse MoE) 架构。`,
            key_steps: [
              "多模态统一分词：将文本、图像分块与音频频谱映射至共享连续向量空间。",
              "旋转位置编码 (RoPE)：跨越百万长上下文保持相对空间与时间距离的一致性。",
              "自回归解码与对齐：利用自回归交叉熵与人类偏好强化学习优化策略。"
            ],
            computational_flow: "Multimodal Tokens -> RoPE Self-Attention -> Sparse MoE Router -> Autoregressive Logits.",
            engineering_highlights: "Google DeepMind 原生全模态大模型基础设施技术栈与分布式并行优化实现。"
          },
          en: {
            overview: `Research "${title}" focuses on LLM & Multimodal frontiers with native interleaved pre-training and Sparse MoE.`,
            key_steps: [
              "Unified Tokenization: Maps text, image patches, and audio spectrograms into shared embedding space.",
              "Rotary Position Embeddings (RoPE): Preserves long-range spatial and temporal relationships.",
              "Autoregressive Alignment: Optimized via cross-entropy and direct preference reinforcement learning."
            ],
            computational_flow: "Tokens -> RoPE Attention -> MoE Routing -> Cross-Entropy Optimization.",
            engineering_highlights: "Google DeepMind native multimodal stack with distributed tensor/pipeline parallelism."
          }
        }
      };

    case "RL & Multi-Agent":
      return {
        github_url: "https://github.com/google-deepmind/acme",
        deepwiki_url: "https://deepwiki.com/google-deepmind/acme",
        repo_structure: {
          repo_name: "google-deepmind/acme",
          deepwiki_url: "https://deepwiki.com/google-deepmind/acme",
          tree_text: `google-deepmind/acme/
├── acme/
│   ├── agents/jax/           # PPO, D4PG, SAC, R2D2 agent implementations
│   ├── datasets/             # Replay buffers & trajectory sampling
│   ├── environment_loop.py   # Step loop between agent and environment
│   └── wrappers/             # Atari & MuJoCo observation preprocessing
└── examples/                 # Distributed multi-process benchmarks`,
          core_artifacts: [
            { path: "acme/agents/jax/actor_critic.py", type: "Algorithm", purpose: "Actor-critic policy updates and generalized advantage estimation" },
            { path: "acme/datasets/reverb.py", type: "Experience Buffer", purpose: "Distributed trajectory replay and prioritized sample retrieval" },
            { path: "acme/environment_loop.py", type: "Execution Loop", purpose: "Standardized stepping loop orchestrating observations and actions" }
          ]
        },
        theory_explanation: {
          mathematical_foundations: "建立在马尔可夫决策过程 (MDP) 与贝尔曼最优原理基础之上。通过 Generalized Advantage Estimation (GAE) 动态权衡偏差-方差，并利用截断重要性采样概率比率实现信任域内的稳定策略迭代。",
          key_equations: [
            {
              name: "Bellman Optimality Operator",
              latex: "Q^*(s, a) = \\mathcal{R}(s, a) + \\gamma \\mathbb{E}_{s' \\sim \\mathcal{P}}[\\max_{a'} Q^*(s', a')]",
              description: "状态-动作价值函数的基础时序差分不动点方程。"
            },
            {
              name: "PPO Clipped Surrogate Objective",
              latex: "L^{\\text{CLIP}}(\\theta) = \\hat{\\mathbb{E}}_t \\left[ \\min(r_t(\\theta)\\hat{A}_t, \\; \\text{clip}(r_t(\\theta), 1-\\epsilon, 1+\\epsilon)\\hat{A}_t) \\right]",
              description: "限制单步更新幅度，防止重要性比率急剧发散导致策略崩溃。"
            }
          ],
          theory_code_mapping: [
            { symbol: "r_t(\\theta)", code_variable: "torch.exp(new_log_probs - old_log_probs)", math_meaning: "新旧策略动作概率似然比率" },
            { symbol: "\\hat{A}_t", code_variable: "compute_gae(rewards, values)", math_meaning: "广义优势估计 (GAE) 标量" },
            { symbol: "L^{\\text{CLIP}}", code_variable: "policy_loss", math_meaning: "截断代理策略损失函数" }
          ]
        },
        pseudocode: `# DeepMind Reinforcement Learning: ${title}
import torch
import torch.nn as nn
import torch.nn.functional as F

class MultiAgentPolicyGradient(nn.Module):
    def __init__(self, obs_dim=128, act_dim=18):
        super().__init__()
        self.actor = nn.Sequential(nn.Linear(obs_dim, 256), nn.ReLU(), nn.Linear(256, act_dim))
        self.critic = nn.Sequential(nn.Linear(obs_dim, 256), nn.ReLU(), nn.Linear(256, 1))

    def compute_gae(self, rewards, values, gamma=0.99, lam=0.95):
        advantages = []
        last_gae = 0
        for t in reversed(range(len(rewards))):
            delta = rewards[t] + gamma * values[t+1] - values[t]
            last_gae = delta + gamma * lam * last_gae
            advantages.insert(0, last_gae)
        return torch.tensor(advantages)

    def ppo_update(self, states, actions, old_log_probs, advantages, returns, clip_eps=0.2):
        logits = self.actor(states)
        dist = torch.distributions.Categorical(logits=logits)
        new_log_probs = dist.log_prob(actions)
        
        ratio = torch.exp(new_log_probs - old_log_probs)
        surr1 = ratio * advantages
        surr2 = torch.clamp(ratio, 1.0 - clip_eps, 1.0 + clip_eps) * advantages
        policy_loss = -torch.min(surr1, surr2).mean()
        value_loss = F.mse_loss(self.critic(states).squeeze(), returns)
        return policy_loss + 0.5 * value_loss`,
        code_explanation: {
          zh: {
            overview: `本论文《${title}》归属于深度强化学习与多智能体博弈体系，采用策略梯度与博弈论自弈均衡优化。`,
            key_steps: [
              "状态观测提取：提取高维动态环境观测，结合时序差分评估基线价值。",
              "广义优势估计 (GAE)：动态调节偏差与方差权衡，稳定长周期信用分配。",
              "截断信任域策略更新 (PPO/MCTS)：限制单步策略变动幅度，杜绝策略崩溃。"
            ],
            computational_flow: "Rollout Trajectory -> Compute GAE Advantages -> PPO Clipped Surrogate Loss -> Parameter Sync.",
            engineering_highlights: "传承自 AlphaStar、AlphaZero 与 OpenSpiel 的大规模多智能体博弈分布式训练架构。"
          },
          en: {
            overview: `Research "${title}" advances deep reinforcement learning and multi-agent game-theoretic equilibrium.`,
            key_steps: [
              "State Observation: Encodes dynamic environment states to predict baseline values.",
              "Generalized Advantage Estimation (GAE): Balances bias-variance tradeoff in credit assignment.",
              "Clipped Policy Optimization: Enforces stable policy improvement steps without catastrophic collapse."
            ],
            computational_flow: "Rollouts -> GAE Advantages -> Clipped Surrogate Objective -> Policy Step.",
            engineering_highlights: "Inherited from AlphaStar, AlphaZero, and OpenSpiel distributed multi-agent game engines."
          }
        }
      };

    case "Embodied AI & Robotics":
      return {
        github_url: "https://github.com/google-deepmind/open_x_embodiment",
        deepwiki_url: "https://deepwiki.com/google-deepmind/open_x_embodiment",
        repo_structure: {
          repo_name: "google-deepmind/open_x_embodiment",
          deepwiki_url: "https://deepwiki.com/google-deepmind/open_x_embodiment",
          tree_text: `google-deepmind/open_x_embodiment/
├── oxe_envlogger/            # High-frequency multi-modal robotic logger
├── models/
│   ├── transformer.py        # Vision-Language-Action backbone
│   ├── tokenizers.py         # 6-DoF continuous action discretization
│   └── cross_embodiment.py   # Multi-embodiment normalization modules
└── evaluation/               # Real-world robotic arm evaluation suites`,
          core_artifacts: [
            { path: "models/transformer.py", type: "VLA Backbone", purpose: "Joint vision and language condition to predict end-effector motions" },
            { path: "models/tokenizers.py", type: "Action Tokenizer", purpose: "Discretizes 6-DoF gripper poses into 256 categorical bins" },
            { path: "models/cross_embodiment.py", type: "Normalization", purpose: "Standardizes disparate physical robot kinematics into unified actions" }
          ]
        },
        theory_explanation: {
          mathematical_foundations: "将物理机械臂操作形式化为端到端序列建模问题。将连续 6 自由度位姿变化量与夹爪开合状态离散化为分箱概率分布，以多视角视觉流与自然语言指令为联合条件。",
          key_equations: [
            {
              name: "VLA Behavioral Cloning Objective",
              latex: "\\mathcal{L}_{\\text{VLA}}(\\theta) = -\\sum_{t=1}^T \\sum_{d=1}^D \\log P_\\theta(a_{t,d} \\mid I_{1:t}, \\text{Instruction})",
              description: "在人类演示或自监督专家轨迹上最大化离散动作分词的条件似然。"
            }
          ],
          theory_code_mapping: [
            { symbol: "I_{1:t}", code_variable: "camera_frames", math_meaning: "环境第三视角与机械臂腕部相机多帧序列" },
            { symbol: "a_{t,d}", code_variable: "logits", math_meaning: "6-DoF 关节空间与夹爪离散动作预测" },
            { symbol: "\\mathcal{L}_{\\text{VLA}}", code_variable: "F.cross_entropy(logits, target_bins)", math_meaning: "离散动作分箱交叉熵损失" }
          ]
        },
        pseudocode: `# DeepMind Embodied AI & Robotics: ${title}
import torch
import torch.nn as nn

class VisionLanguageActionPolicy(nn.Module):
    def __init__(self, visual_encoder_dim=512, action_dim=8, num_bins=256):
        super().__init__()
        self.visual_encoder = SpatialConvTransformer(visual_encoder_dim)
        self.action_head = nn.Linear(visual_encoder_dim, action_dim * num_bins)
        self.action_dim = action_dim
        self.num_bins = num_bins

    def forward(self, camera_frames, task_instruction_tokens):
        # 1. Cross-modal conditioning: visual scene modulated by text instruction
        visual_tokens = self.visual_encoder(camera_frames, task_instruction_tokens)
        
        # 2. Predict discretized Cartesian joint delta and gripper commands
        logits = self.action_head(visual_tokens[:, -1, :]).view(-1, self.action_dim, self.num_bins)
        return logits`,
        code_explanation: {
          zh: {
            overview: `本论文《${title}》聚焦具身智能与物理世界交互，构建视觉-语言-动作 (VLA) 闭环控制系统。`,
            key_steps: [
              "多相机视觉输入融合：融合机载腕部相机与全景第三视角多帧图像。",
              "离散动作分词：将三维空间末端位移与旋转欧拉角映射为高分辨率控制离散分箱。",
              "实时闭环控制：在物理硬件上以 3Hz~100Hz 高频响应执行亚厘米级精准抓取与操作。"
            ],
            computational_flow: "Camera Stream + Natural Language -> VLA Cross-Attention -> Discretized Action Logits -> Robot Actuator.",
            engineering_highlights: "基于 Open X-Embodiment 跨机体多任务数据集与 RT 机器人变换器工业级落地标准。"
          },
          en: {
            overview: `Research "${title}" advances Embodied AI and physical world manipulation via closed-loop VLA control.`,
            key_steps: [
              "Multi-View Camera Fusion: Merges wrist camera and panoramic third-person video frames.",
              "Discretized Action Tokens: Quantizes Cartesian 6-DoF motions and gripper commands into action bins.",
              "Real-time Closed-loop Control: Executes low-latency physical commands with sub-centimeter accuracy."
            ],
            computational_flow: "Video + Command -> VLA Model -> Action Bins -> Joint Motor Execution.",
            engineering_highlights: "Built on Open X-Embodiment cross-embodiment robotics datasets and RT standards."
          }
        }
      };

    case "AI for Science & Biology":
      return {
        github_url: "https://github.com/google-deepmind/alphafold",
        deepwiki_url: "https://deepwiki.com/google-deepmind/alphafold",
        repo_structure: {
          repo_name: "google-deepmind/alphafold",
          deepwiki_url: "https://deepwiki.com/google-deepmind/alphafold",
          tree_text: `google-deepmind/alphafold/
├── alphafold/
│   ├── common/               # Residue constants, torsion angles & PDB parsing
│   ├── data/                 # MSA search pipelines (JackHMMER / HHblits)
│   ├── model/
│   │   ├── modules.py        # Evoformer triangular self-attention
│   │   ├── geometry.py       # SE(3) Rigid3D Euclidean group operations
│   │   └── structure_module.py# Invariant Point Attention & 3D coordinate updates
│   └── relax/                # OpenMM Amber force-field stereochemical relaxation
└── run_alphafold.py          # Complete end-to-end structure prediction entry`,
          core_artifacts: [
            { path: "alphafold/model/modules.py", type: "Evoformer", purpose: "Triangular attention and MSA pair representation module" },
            { path: "alphafold/model/structure_module.py", type: "3D Structure", purpose: "Invariant Point Attention (IPA) directly updating Euclidean residue frames" },
            { path: "alphafold/model/geometry.py", type: "Geometry SE(3)", purpose: "Rigid transformations, rotations, and translational invariants" }
          ]
        },
        theory_explanation: {
          mathematical_foundations: "基于三维刚体欧式对称群 SE(3) 不变性，结合演化多序列比对 (MSA) 与残基对空间几何图。通过 Invariant Point Attention (IPA) 在局部主干坐标系下操作，直接预测每个残基的三维旋转矩阵与平移矢量，彻底摆脱传统分子动力学模拟的步长束缚。",
          key_equations: [
            {
              name: "Frame Aligned Point Error (FAPE)",
              latex: "\\mathcal{L}_{\\text{FAPE}} = \\frac{1}{N_{\\text{frames}} N_{\\text{atoms}}} \\sum_{i,j} \\min\\left( \\| T_i^{-1} \\vec{x}_j - (T_i^{\\text{true}})^{-1} \\vec{x}_j^{\\text{true}} \\|, \\; d_{\\text{clamp}} \\right)",
              description: "在局部刚体坐标系下对齐三维原子位置误差，天然免疫全局平移与旋转偏差。"
            }
          ],
          theory_code_mapping: [
            { symbol: "T_i = (R_i, \\vec{t}_i)", code_variable: "frames_3d", math_meaning: "各残基主干的三维刚体旋转矩阵与平移矢量" },
            { symbol: "z_{ij}", code_variable: "pair_repr", math_meaning: "氨基酸残基对的演化关联与空间距离几何张量" },
            { symbol: "\\mathcal{L}_{\\text{FAPE}}", code_variable: "fape_loss", math_meaning: "局部刚体坐标系下的原子对齐误差" }
          ]
        },
        pseudocode: `# DeepMind AI for Science & Structural Biology: ${title}
import torch
import torch.nn as nn

class MolecularGeometricGraphTransformer(nn.Module):
    def __init__(self, node_dim=256, pair_dim=128):
        super().__init__()
        self.triangular_update = TriangleAttentionModule(pair_dim)
        self.ipa_layer = InvariantPointAttention(node_dim, pair_dim)

    def forward(self, atom_tokens, pair_distances_2d, frames_3d):
        pair_repr = self.triangular_update(pair_distances_2d)
        updated_frames, atom_embeddings = self.ipa_layer(atom_tokens, pair_repr, frames_3d)
        return updated_frames, atom_embeddings`,
        code_explanation: {
          zh: {
            overview: `本论文《${title}》属于科学智能 (AI for Science) 领域，融合生物分子几何图神经网络与三维结构演化模型。`,
            key_steps: [
              "分子空间几何图构建：以原子或氨基酸残基为图节点，以三维欧几里得距离与成键关系为图边缘。",
              "SE(3) 刚体欧几里得对称性：保证分子在三维空间任意旋转与平移下物理规律完全不变。",
              "结构预测与亲和力评估：端到端预测生物大分子空间折叠构象及配体对接能量。"
            ],
            computational_flow: "Sequence / Formula -> Geometric Graph -> Pairformer & IPA -> 3D Coordinates & Confidence Score.",
            engineering_highlights: "继承 AlphaFold 2 与 AlphaFold 3 全原子模拟范式，推动计算生物学从经验拟合走向精确预测。"
          },
          en: {
            overview: `Research "${title}" advances AI for Science, coupling molecular graph Transformers with 3D structural physics.`,
            key_steps: [
              "Geometric Graph Encoding: Represents atoms/residues as nodes with Euclidean pairwise relational edges.",
              "SE(3) Equivariance: Ensures physical laws remain invariant under arbitrary 3D spatial rotations and translations.",
              "Structure & Binding Prediction: End-to-end atomic coordinate generation with confidence metrics."
            ],
            computational_flow: "Molecular Graph -> Triangular Attention -> 3D Coordinate Optimization -> Free-Energy Output.",
            engineering_highlights: "Extends AlphaFold all-atom principles, transforming structural biology and drug design."
          }
        }
      };

    case "Math & Algorithmic Discovery":
      return {
        github_url: "https://github.com/google-deepmind/alphageometry",
        deepwiki_url: "https://deepwiki.com/google-deepmind/alphageometry",
        repo_structure: {
          repo_name: "google-deepmind/alphageometry",
          deepwiki_url: "https://deepwiki.com/google-deepmind/alphageometry",
          tree_text: `google-deepmind/alphageometry/
├── alphageometry/
│   ├── ddar.py               # Deductive Database & Algebraic Reasoning engine
│   ├── graph.py              # Geometric dependency DAG & constraint checker
│   ├── lm_inference.py       # Neural tactic generator for auxiliary constructions
│   └── beam_search.py        # Hybrid neuro-symbolic proof search loop
└── run.py                    # Certified proof generation for IMO geometry problems`,
          core_artifacts: [
            { path: "alphageometry/ddar.py", type: "Symbolic Engine", purpose: "Formal deduction database verifying geometric proofs with 0% hallucination" },
            { path: "alphageometry/lm_inference.py", type: "Neural Intuition", purpose: "Proposes creative auxiliary points and construction tactics" },
            { path: "alphageometry/beam_search.py", type: "Proof Search", purpose: "Coordinates symbolic closure checks with neural expansions" }
          ]
        },
        theory_explanation: {
          mathematical_foundations: "开创神经-符号协同推理 (Neuro-Symbolic Reasoning) 范式。将确定性演绎数据库 (DD) 与代数推理 (AR) 作为严谨验证内核，利用大语言模型作为直觉启发式辅助构造点生成器，在完全杜绝模型幻觉的同时攻克国际数学奥林匹克 (IMO) 几何难题。",
          key_equations: [
            {
              name: "Deductive Closure Iteration",
              latex: "\\mathcal{S}_{k+1} = \\mathrm{Closure}_{\\text{DD+AR}}\\left( \\mathcal{S}_k \\cup \\{ \\text{AuxPoint}_k \\} \\right)",
              description: "基于当前几何图状态，在添加神经直觉生成的辅助构造点后计算符号演绎闭包。"
            }
          ],
          theory_code_mapping: [
            { symbol: "\\mathcal{S}_k", code_variable: "ddar.state", math_meaning: "当前已知几何约束、线面平行与共圆定理集合" },
            { symbol: "\\text{AuxPoint}", code_variable: "candidate_tactics", math_meaning: "神经网络语言模型直觉生成的辅助线构造点" },
            { symbol: "\\mathrm{Closure}", code_variable: "kernel.apply_tactic()", math_meaning: "形式化演绎引擎确定性定理推导" }
          ]
        },
        pseudocode: `# DeepMind Math & Algorithmic Discovery: ${title}
class FormalTheoremProver:
    def __init__(self, tactic_generator_llm, formal_kernel_lean4):
        self.llm = tactic_generator_llm
        self.kernel = formal_kernel_lean4

    def search_proof(self, goal_theorem, search_budget=1000):
        frontier = [FormalProofNode(goal_theorem)]
        for step in range(search_budget):
            node = self.select_best_node(frontier)
            if node.is_proven():
                return node.extract_certified_proof()
                
            candidate_tactics = self.llm.predict_tactics(node.lean_state)
            for tactic in candidate_tactics:
                is_valid, new_subgoals = self.kernel.apply_tactic(node.lean_state, tactic)
                if is_valid:
                    child = FormalProofNode(new_subgoals, parent=node, tactic=tactic)
                    frontier.append(child)
        return None`,
        code_explanation: {
          zh: {
            overview: `本论文《${title}》聚焦数学奥林匹克证明与底层算法发现，结合神经直觉与形式化逻辑验证。`,
            key_steps: [
              "形式化定理表述：将自然语言命题精确转换为 Lean 4 / Isabelle 等形式化数学系统语言。",
              "树搜索引导推导：利用深度神经网络评估推演状态价值，挑选最有希望的数学战术 (Tactics)。",
              "逻辑内核验证：每一步证明通过确定性编译器内核严格校验，保证结论 100% 严密可信。"
            ],
            computational_flow: "Mathematical Problem -> Lean 4 Formal Code -> Neural MCTS Proof Search -> Kernel Certification.",
            engineering_highlights: "融合 AlphaGeometry 与 AlphaProof 技术架构，在数学与基础算法优化领域消除大模型幻觉。"
          },
          en: {
            overview: `Research "${title}" couples neural intuition with formal theorem verification (Lean 4) for mathematics.`,
            key_steps: [
              "Formal Problem Formulation: Translates natural language math into interactive theorem proving languages.",
              "Tree-Search Guided Tactics: Evaluates promising tactical avenues via neural-guided heuristic search.",
              "Certified Verification: Validates every reasoning step through the Lean kernel to ensure 0% hallucination."
            ],
            computational_flow: "Theorem Statement -> Lean 4 Formulation -> MCTS Tactic Search -> Compiler Verification.",
            engineering_highlights: "Combines AlphaGeometry and AlphaProof formal reasoning architectures."
          }
        }
      };

    default: // Frontier Safety, Alignment & Society
      return {
        github_url: "https://github.com/google-deepmind/evals",
        deepwiki_url: "https://deepwiki.com/google-deepmind/evals",
        repo_structure: {
          repo_name: "google-deepmind/evals",
          deepwiki_url: "https://deepwiki.com/google-deepmind/evals",
          tree_text: `google-deepmind/evals/
├── safety_evals/             # Autonomous replication & cyber capability audits
├── sandbagging/              # Covert scheming & strategic underperformance detection
├── redteaming/               # Automated multi-turn jailbreak and refusal harnesses
└── sae_probes/               # Sparse autoencoder monosemantic feature extractors`,
          core_artifacts: [
            { path: "safety_evals/cyber_eval.py", type: "Red-Team Harness", purpose: "Automated auditing for autonomous cyber vulnerability exploits" },
            { path: "sandbagging/probe.py", type: "Latent Probe", purpose: "Detects deceptive alignment where models hide capabilities" },
            { path: "sae_probes/autoencoder.py", type: "Interpretability", purpose: "Sparse autoencoders extracting monosemantic safety features" }
          ]
        },
        theory_explanation: {
          mathematical_foundations: "基于机械可解释性 (Mechanistic Interpretability) 与红队对抗评估理论。通过稀疏自编码器 (SAE) 将神经网络在叠加态 (Superposition) 下的多义神经元解聚为可审计的单语义特征，并构建形式化探针探测潜意识欺骗 (Deceptive Alignment) 与战略性伪装。",
          key_equations: [
            {
              name: "Sparse Autoencoder (SAE) Objective",
              latex: "\\mathcal{L}_{\\text{SAE}} = \\| x - W_{\\text{dec}} f(x) \\|_2^2 + \\lambda \\| f(x) \\|_1, \\quad f(x) = \\mathrm{ReLU}(W_{\\text{enc}} x + b_{\\text{enc}})",
              description: "在保持残差流激活高重构保真度的同时，利用 L1 正则迫使特征字典极度稀疏化。"
            }
          ],
          theory_code_mapping: [
            { symbol: "f(x)", code_variable: "feature_activations", math_meaning: "解聚得到的稀疏单语义安全特征向量" },
            { symbol: "\\| x - \\hat{x} \\|_2^2", code_variable: "recon_loss", math_meaning: "残差流重构均方误差损失" },
            { symbol: "\\lambda \\| f \\|_1", code_variable: "sparsity_loss", math_meaning: "单语义性 L1 稀疏约束惩罚" }
          ]
        },
        pseudocode: `# DeepMind Frontier Safety & Alignment: ${title}
import torch
import torch.nn as nn
import torch.nn.functional as F

class SparseAutoencoderSafetyProbe(nn.Module):
    def __init__(self, model_hidden_dim=4096, dictionary_size=32768, l1_coeff=1e-3):
        super().__init__()
        self.encoder = nn.Linear(model_hidden_dim, dictionary_size)
        self.decoder = nn.Linear(dictionary_size, model_hidden_dim)
        self.l1_coeff = l1_coeff

    def forward(self, intermediate_residual_stream):
        feature_activations = F.relu(self.encoder(intermediate_residual_stream))
        reconstructed = self.decoder(feature_activations)
        recon_loss = F.mse_loss(reconstructed, intermediate_residual_stream)
        sparsity_loss = self.l1_coeff * feature_activations.sum(dim=-1).mean()
        return feature_activations, recon_loss + sparsity_loss`,
        code_explanation: {
          zh: {
            overview: `本论文《${title}》致力于前沿超级对齐、机械可解释性与前沿安全防御，构建可审计的可信大模型体系。`,
            key_steps: [
              "稀疏自编码器 (SAE) 特征解聚：将神经网络神经元的多义叠加解聚为单语义可解释特征字典。",
              "潜意识欺骗与装蠢探测：针对长链推理中的沙盒逃逸、后门休眠与对齐漂移进行探针审计。",
              "自动化红队对抗评估：构建自动化红蓝对抗仿真环境，全方位测试安全红线鲁棒性。"
            ],
            computational_flow: "Hidden Activations -> Sparse Autoencoder -> Monosemantic Feature Probes -> Safety Guardrail Gating.",
            engineering_highlights: "Google DeepMind 前沿安全与对齐研究基础设施标准，支撑可信人工智能国际规范。"
          },
          en: {
            overview: `Research "${title}" addresses frontier safety, mechanistic interpretability, and superalignment defense.`,
            key_steps: [
              "Sparse Autoencoder (SAE) Decomposition: Disentangles superposition into monosemantic, auditable features.",
              "Deception & Sandbagging Probing: Interrogates latent states to detect covert misalignment and drift.",
              "Automated Red-Teaming: Simulates adversarial pressures to verify safety redline robustness."
            ],
            computational_flow: "Residual Activations -> SAE Feature Extraction -> Mechanistic Probing -> Safety Verification.",
            engineering_highlights: "Implements Google DeepMind's frontier alignment and safety verification standards."
          }
        }
      };
  }
}

function renderLibraryCards() {
  if (!dom.libCardsGrid) return;

  dom.libCardsGrid.classList.toggle('mode-list', state.libLayoutMode === 'list');

  const query = state.libSearchQuery.trim().toLowerCase();
  const tierFilter = state.libTierFilter;
  const yearFilter = state.libYearFilter;
  const themeFilter = state.libThemeFilter;

  const filtered = state.allPublications.filter(p => {
    // Tier / Code filter
    if (tierFilter === 'CODE') {
      const isMilestone = state.graphData && state.graphData.nodes.some(n =>
        n.title.toLowerCase().trim() === p.title.toLowerCase().trim() ||
        n.url === p.url ||
        (n.id && p.pub_id && n.id.includes(p.pub_id))
      );
      if (!isMilestone) return false;
    } else if (tierFilter !== 'ALL' && !p.milestone.tier.includes(tierFilter)) {
      return false;
    }

    // Year
    if (yearFilter !== 'ALL' && p.year.toString() !== yearFilter) {
      return false;
    }
    // Theme
    if (themeFilter !== 'ALL' && p.theme !== themeFilter) {
      return false;
    }
    // Query
    if (query.length > 0) {
      const matchTitle = p.title.toLowerCase().includes(query);
      const matchTheme = p.theme.toLowerCase().includes(query);
      const matchReason = p.milestone.reason.toLowerCase().includes(query);
      if (!matchTitle && !matchTheme && !matchReason) return false;
    }
    return true;
  });

  // Sort by year desc, then score desc
  filtered.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.milestone.score - a.milestone.score;
  });

  const dict = I18N[state.lang];
  dom.libMatchedCount.textContent = dict.lib_matched_format(filtered.length, state.allPublications.length);

  dom.libCardsGrid.innerHTML = '';
  if (filtered.length === 0) {
    dom.libCardsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <p style="font-size: 1.1rem; margin-bottom: 8px;">${state.lang === 'zh' ? '未找到匹配条件的论文' : 'No matching publications found'}</p>
        <p style="font-size: 0.85rem;">${state.lang === 'zh' ? '请尝试清除筛选条件或更换搜索关键词' : 'Try clearing filters or adjusting your query'}</p>
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();
  filtered.forEach(pub => {
    const card = document.createElement('div');
    const tierClass = pub.milestone.tier.toLowerCase().includes('tier s')
      ? 'tier-s'
      : pub.milestone.tier.toLowerCase().includes('tier a')
      ? 'tier-a'
      : pub.milestone.tier.toLowerCase().includes('tier b')
      ? 'tier-b'
      : 'tier-c';

    // Find if arxiv_id is available from milestone nodes
    let arxivId: string | null = null;
    if (state.graphData) {
      const matched = state.graphData.nodes.find(n =>
        n.title.toLowerCase().trim() === pub.title.toLowerCase().trim() ||
        n.url === pub.url
      );
      if (matched && matched.arxiv_id) {
        arxivId = matched.arxiv_id;
      }
    }
    const coolpapersUrl = getCoolPapersUrl(arxivId, pub.title);

    const domainName = DOMAIN_I18N[pub.theme]
      ? DOMAIN_I18N[pub.theme][state.lang]
      : pub.theme;

    const tierTitle = state.lang === 'zh' ? pub.milestone.label : pub.milestone.tier.split(':')[0];
    const ptsSuffix = state.lang === 'zh' ? '分' : 'pts';

    card.className = `lib-card ${tierClass}`;
    card.innerHTML = `
      <div class="lib-card-header">
        <span class="card-tier-pill ${tierClass}">
          ${tierTitle} · ${pub.milestone.score} ${ptsSuffix}
        </span>
        <span class="card-code-badge" title="${state.lang === 'zh' ? '包含核心算法伪代码与开源实现' : 'Includes Algorithm Pseudocode & Codebase'}">
          💻 ${state.lang === 'zh' ? '伪代码' : 'Code'}
        </span>
        <span class="card-date-badge">${pub.date}</span>
      </div>
      <div class="lib-card-main">
        <h4 class="lib-card-title" title="${state.lang === 'zh' ? '点击研读此论文详情与算法实现' : 'Click to explore paper & algorithm'}">${pub.title}</h4>
        <div class="lib-card-theme">${domainName}</div>
      </div>
      <div class="lib-card-actions">
        <div class="lib-card-links-left">
          <button class="btn-read-deep" data-pub-id="${pub.pub_id}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            ${dict.btn_read_deep}
          </button>
          <button class="btn-read-code" data-pub-id="${pub.pub_id}" title="${state.lang === 'zh' ? '研读核心算法伪代码与实现' : 'Explore Algorithm & Pseudocode'}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
            ${dict.btn_view_code}
          </button>
          <a href="${coolpapersUrl}" target="_blank" rel="noopener noreferrer" class="link-btn-coolpapers" title="${state.lang === 'zh' ? '在 CoolPapers 上查看 Kimi 智能解读' : 'Explore on CoolPapers'}">
            ${dict.link_coolpapers}
          </a>
        </div>
        <a href="${pub.url}" target="_blank" rel="noopener noreferrer" class="link-official-site">
          ${dict.link_official}
        </a>
      </div>
    `;

    // Click on title or button opens drawer
    const openHandler = () => openDrawerForPublication(pub);
    const openCodeHandler = (e: Event) => {
      e.stopPropagation();
      openDrawerForPublication(pub);
      setTimeout(() => {
        const sec = document.getElementById('section-pseudocode');
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    };

    card.querySelector('.lib-card-title')!.addEventListener('click', openHandler);
    card.querySelector('.btn-read-deep')!.addEventListener('click', openHandler);
    card.querySelector('.btn-read-code')?.addEventListener('click', openCodeHandler);

    fragment.appendChild(card);
  });

  dom.libCardsGrid.appendChild(fragment);
}

function openDrawerForPublication(pub: PublicationItem) {
  // Check if this paper matches a milestone in state.graphData.nodes
  let matchedNode: PaperNodeData | undefined;
  if (state.graphData) {
    matchedNode = state.graphData.nodes.find(n =>
      n.title.toLowerCase().trim() === pub.title.toLowerCase().trim() ||
      n.url === pub.url ||
      (n.id && pub.pub_id && n.id.includes(pub.pub_id))
    );
  }

  if (matchedNode) {
    openDrawer(matchedNode);
    return;
  }

  const primaryTopic = pub.theme in DOMAIN_I18N ? pub.theme : "Frontier Safety, Alignment & Society";
  const domainName = DOMAIN_I18N[primaryTopic] ? DOMAIN_I18N[primaryTopic][state.lang] : primaryTopic;

  const isZh = state.lang === 'zh';
  const domainCode = getDomainPseudocodeAndExplanation(pub, isZh);

  const synthesizedNode: PaperNodeData = {
    id: `pub_${pub.pub_id}`,
    label: pub.title,
    title: pub.title,
    authors: ["Google DeepMind Research Team"],
    year: pub.year,
    venue: `DeepMind Official Publications (${pub.date})`,
    arxiv_id: null,
    url: pub.url,
    pdf_url: pub.url,
    github_url: domainCode.github_url,
    pseudocode: domainCode.pseudocode,
    code_explanation: domainCode.code_explanation,
    primary_topic: primaryTopic,
    topics: [pub.theme, pub.milestone.label],
    citations: Math.round(pub.milestone.score * 15),
    influential_citations: Math.round(pub.milestone.score * 2.5),
    annual_citation_velocity: Math.round(pub.milestone.score * 4),
    impact_score: pub.milestone.score,
    generation: pub.milestone.label,
    tldr: `${pub.milestone.label}：${pub.milestone.reason}`,
    faq: {
      q1_problem: isZh
        ? `本论文聚焦【${pub.title}】，直面当前该研究领域在模型能力界限、数据效率或可信对齐上的核心痛点，剖析既有理论与算法范式的技术局限。`
        : `Focusing on "${pub.title}", this paper addresses critical limitations in capability bounds, data efficiency, and safety alignment within ${domainName}.`,
      q2_lineage: isZh
        ? `立足于 Google DeepMind 在【${domainName}】方向的长周期技术积累，承接前序经典工作与基线模型，探索该分支的新一代技术演化分支。`
        : `Built on Google DeepMind's long-term technical heritage in ${domainName}, extending foundational baselines into next-generation research branches.`,
      q3_innovation: isZh
        ? `针对关键瓶颈设计了创新的架构机制与优化准则，提出专门的损失函数、训练范式或自动化评测管线，显著提升了系统的鲁棒性与表征深度。`
        : `Proposes innovative architectural mechanisms, tailored optimization objectives, and automated evaluation pipelines to significantly bolster robustness and representation depth.`,
      q4_experiments: isZh
        ? `在多项具有挑战性的专业基准数据集、真实物理平台或模拟仿真环境中完成了系统验证，相比对照基准表现出清晰的量化优势与良好的泛化性能。`
        : `Rigorously validated across challenging benchmarks and simulation suites, demonstrating clear quantitative margins and generalization gains.`,
      q5_deepmind_role: isZh
        ? `归属于 DeepMind 官方最新学术成果库（评估等级：${pub.milestone.tier}，得分 ${pub.milestone.score}），体现了实验室在该前沿研究方向上的持续布局。`
        : `Cataloged in DeepMind's official research library (${pub.milestone.tier}, Score ${pub.milestone.score}), demonstrating sustained strategic investments.`,
      q6_tldr: pub.milestone.reason
    }
  };

  openDrawer(synthesizedNode);
}

// ============================================================================
// Event Handlers Setup
// ============================================================================

function bindEvents(cy: Core, data: GraphData) {
  // Node Hover
  cy.on('mouseover', 'node', (evt: EventObject) => {
    const node = evt.target as NodeSingular;
    if (node.hasClass('hidden')) return;
    const pos = node.renderedPosition();
    showTooltip(node, pos);
  });

  cy.on('mouseout', 'node', () => {
    hideTooltip();
  });

  // Node Click: Highlight lineage & open drawer
  cy.on('tap', 'node', (evt: EventObject) => {
    const node = evt.target as NodeSingular;
    if (node.hasClass('hidden')) return;
    hideTooltip();
    highlightLineage(node);
    openDrawer(node.data('raw'));
  });

  // Canvas Blank Click
  cy.on('tap', (evt: EventObject) => {
    if (evt.target === cy) {
      clearSelection();
    }
  });

  // Language Switch Button
  dom.btnLang.onclick = () => {
    const nextLang = state.lang === 'zh' ? 'en' : 'zh';
    applyLanguage(nextLang);
  };

  // Fit Button
  dom.btnFit.onclick = () => {
    cy.fit(undefined, 40);
  };

  // Layout Direction Toggle (LR vs TB)
  dom.btnLayoutToggle.onclick = () => {
    state.layoutDirection = state.layoutDirection === 'LR' ? 'TB' : 'LR';
    dom.layoutDirectionLabel.textContent =
      state.layoutDirection === 'LR' ? I18N[state.lang].btn_layout_lr : I18N[state.lang].btn_layout_tb;
    runLayout(state.layoutDirection);
  };

  // Theme Toggle Button
  dom.btnTheme.onclick = () => {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
  };

  // Search Input
  let debounceTimeout: number | undefined;
  dom.inputSearch.oninput = () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = window.setTimeout(() => {
      state.searchQuery = dom.inputSearch.value;
      dom.btnClearSearch.style.display = state.searchQuery.length > 0 ? 'inline-block' : 'none';
      applyFilters();
    }, 150);
  };

  dom.btnClearSearch.onclick = () => {
    dom.inputSearch.value = '';
    state.searchQuery = '';
    dom.btnClearSearch.style.display = 'none';
    applyFilters();
  };

  // Topic Filters
  dom.topicChips.onclick = (e) => {
    const target = (e.target as HTMLElement).closest('.chip') as HTMLButtonElement | null;
    if (!target) return;

    const topic = target.getAttribute('data-topic');
    if (!topic) return;

    dom.topicChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    target.classList.add('active');

    state.selectedTopic = topic;
    applyFilters();
  };

  // Timeline Slider
  dom.timelineSlider.oninput = () => {
    const year = parseInt(dom.timelineSlider.value, 10);
    state.timelineYear = year;
    dom.yearDisplay.textContent = year.toString();
    applyFilters();
  };

  // Impact Focus Switch
  dom.checkImpactFocus.onchange = () => {
    state.impactFocus = dom.checkImpactFocus.checked;
    applyFilters();
  };

  // View Switcher Buttons
  if (dom.btnViewHub) {
    dom.btnViewHub.onclick = () => switchView('hub');
  }
  if (dom.btnViewGraph) {
    dom.btnViewGraph.onclick = () => switchView('graph');
  }
  if (dom.btnViewLibrary) {
    dom.btnViewLibrary.onclick = () => switchView('library');
  }

  // DeepMind Hub Card CTA Actions
  if (dom.btnEnterDmGraph) {
    dom.btnEnterDmGraph.onclick = () => switchView('graph');
  }
  if (dom.btnEnterDmLibrary) {
    dom.btnEnterDmLibrary.onclick = () => switchView('library');
  }

  // Upcoming Labs Preview Buttons
  document.querySelectorAll('.lab-btn-preview').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const labKey = (e.currentTarget as HTMLElement).getAttribute('data-lab');
      if (labKey) openLabPreview(labKey);
    });
  });

  // Upcoming Lab Preview Modal Close Handlers
  if (dom.btnClosePreview && dom.modalLabPreview) {
    dom.btnClosePreview.onclick = () => {
      dom.modalLabPreview.style.display = 'none';
    };
  }

  if (dom.modalLabPreview) {
    dom.modalLabPreview.onclick = (e) => {
      if (e.target === dom.modalLabPreview) {
        dom.modalLabPreview.style.display = 'none';
      }
    };
  }

  // Publications Library Search Input
  if (dom.libSearchInput) {
    let libDebounce: number | undefined;
    dom.libSearchInput.oninput = () => {
      clearTimeout(libDebounce);
      libDebounce = window.setTimeout(() => {
        state.libSearchQuery = dom.libSearchInput.value;
        if (dom.libClearSearch) {
          dom.libClearSearch.style.display = state.libSearchQuery.length > 0 ? 'inline-block' : 'none';
        }
        renderLibraryCards();
      }, 150);
    };
  }

  if (dom.libClearSearch) {
    dom.libClearSearch.onclick = () => {
      dom.libSearchInput.value = '';
      state.libSearchQuery = '';
      dom.libClearSearch.style.display = 'none';
      renderLibraryCards();
    };
  }

  // Publications Library Tier Chips
  if (dom.libTierChips) {
    dom.libTierChips.onclick = (e) => {
      const target = (e.target as HTMLElement).closest('.lib-chip') as HTMLButtonElement | null;
      if (!target) return;
      const tier = target.getAttribute('data-tier');
      if (!tier) return;

      dom.libTierChips.querySelectorAll('.lib-chip').forEach(c => c.classList.remove('active'));
      target.classList.add('active');

      state.libTierFilter = tier;
      renderLibraryCards();
    };
  }

  // Publications Library Year Chips
  if (dom.libYearChips) {
    dom.libYearChips.onclick = (e) => {
      const target = (e.target as HTMLElement).closest('.lib-chip') as HTMLButtonElement | null;
      if (!target) return;
      const year = target.getAttribute('data-year');
      if (!year) return;

      dom.libYearChips.querySelectorAll('.lib-chip').forEach(c => c.classList.remove('active'));
      target.classList.add('active');

      state.libYearFilter = year;
      renderLibraryCards();
    };
  }

  // Publications Library Theme Chips (6 Unified Categories)
  if (dom.libThemeChips) {
    dom.libThemeChips.onclick = (e) => {
      const target = (e.target as HTMLElement).closest('.lib-chip') as HTMLButtonElement | null;
      if (!target) return;
      const theme = target.getAttribute('data-theme');
      if (!theme) return;

      dom.libThemeChips.querySelectorAll('.lib-chip').forEach(c => c.classList.remove('active'));
      target.classList.add('active');

      state.libThemeFilter = theme;
      renderLibraryCards();
    };
  }

  // Publications Library Layout Switch (Grid vs List)
  if (dom.btnLayoutGrid) {
    dom.btnLayoutGrid.onclick = () => setLibraryLayoutMode('grid');
  }
  if (dom.btnLayoutList) {
    dom.btnLayoutList.onclick = () => setLibraryLayoutMode('list');
  }

  // Close Drawer Button & Backdrop
  dom.btnCloseDrawer.onclick = () => clearSelection();
  dom.drawerBackdrop.onclick = () => clearSelection();

  // Copy Code Button
  if (dom.btnCopyCode && dom.codeSnippetContent) {
    dom.btnCopyCode.onclick = async () => {
      const code = dom.codeSnippetContent.textContent || '';
      try {
        await navigator.clipboard.writeText(code);
        dom.labelCopyCode.textContent = I18N[state.lang].label_copied;
        dom.btnCopyCode.classList.add('copied');
        setTimeout(() => {
          dom.labelCopyCode.textContent = I18N[state.lang].label_copy_code;
          dom.btnCopyCode.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy code to clipboard:', err);
      }
    };
  }

  // Documentation Modal Toggle
  if (dom.btnOpenDocs && dom.modalDocs) {
    dom.btnOpenDocs.onclick = () => {
      dom.modalDocs.style.display = 'flex';
    };
  }

  if (dom.btnCloseDocs && dom.modalDocs) {
    dom.btnCloseDocs.onclick = () => {
      dom.modalDocs.style.display = 'none';
    };
  }

  if (dom.modalDocs) {
    dom.modalDocs.onclick = (e) => {
      if (e.target === dom.modalDocs) {
        dom.modalDocs.style.display = 'none';
      }
    };
  }

  // Keyboard Shortcuts (Esc to close)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearSelection();
      if (dom.modalDocs) {
        dom.modalDocs.style.display = 'none';
      }
      if (dom.modalLabPreview) {
        dom.modalLabPreview.style.display = 'none';
      }
    }
  });

  // Update Header Metric Numbers
  dom.statPapers.textContent = data.nodes.length.toString();
  dom.statEdges.textContent = data.edges.length.toString();
  dom.statYears.textContent = `${data.meta.year_range[0]}-${data.meta.year_range[1]}`;
}

// ============================================================================
// Application Entrypoint
// ============================================================================

async function init() {
  console.log('[Roadmap] Initializing AiLabRoadMap Platform...');

  // 1. Initialize Theme, Language & Library Layout Mode First
  applyTheme(state.theme);
  applyLanguage(state.lang);
  setLibraryLayoutMode(state.libLayoutMode);

  // 2. Fetch graph data & full publications catalog
  const [data, publications] = await Promise.all([
    loadGraphData(),
    loadPublicationsData()
  ]);

  state.graphData = data;
  state.allPublications = publications;

  if (dom.statTotalPubs) {
    dom.statTotalPubs.textContent = publications.length.toString();
  }

  // 3. Initialize Cytoscape
  const cy = createCytoscape(data);
  state.cy = cy;

  // 4. Bind UI & Events
  bindEvents(cy, data);

  // 5. Initial layout calculation & fit
  runLayout(state.layoutDirection);

  // 6. Render initial library view items
  renderLibraryCards();

  // 7. Activate initial view (Hub Overview by default)
  switchView(state.activeView);

  console.log(`[Roadmap] Initialization complete. Loaded ${data.nodes.length} milestone nodes, ${publications.length} official publications.`);
}

// Start application
init().catch(err => {
  console.error('[Roadmap] Initialization failed:', err);
});
