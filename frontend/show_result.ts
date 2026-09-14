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
    link_coolpapers: "⚡ CoolPapers ↗",
    link_official: "官网原网 ↗",
    link_arxiv: "arXiv 论文 ↗",
    link_pdf: "PDF 原文 ↗",
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
    docs_modal_title: "DeepMind Research Roadmap 评级体系与方法学说明文档"
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
    link_coolpapers: "⚡ CoolPapers ↗",
    link_official: "Official Site ↗",
    link_arxiv: "arXiv ↗",
    link_pdf: "PDF ↗",
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
    docs_modal_title: "DeepMind Research Roadmap Milestone Rating & Methodology"
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
  linkArxiv: document.getElementById('link-arxiv') as HTMLAnchorElement,
  linkPdf: document.getElementById('link-pdf') as HTMLAnchorElement,
  linkDeepmind: document.getElementById('link-deepmind') as HTMLAnchorElement,
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

  // CoolPapers 6-Dimensional FAQ
  dom.faqQ1.textContent = raw.faq.q1_problem;
  dom.faqQ2.textContent = raw.faq.q2_lineage;
  dom.faqQ3.textContent = raw.faq.q3_innovation;
  dom.faqQ4.textContent = raw.faq.q4_experiments;
  dom.faqQ5.textContent = raw.faq.q5_deepmind_role;
  dom.faqQ6.textContent = raw.faq.q6_tldr;

  // Open drawer UI
  dom.drawer.classList.add('open');
  dom.drawer.setAttribute('aria-hidden', 'false');
  dom.drawerBackdrop.classList.add('visible');
}

function closeDrawer() {
  dom.drawer.classList.remove('open');
  dom.drawer.setAttribute('aria-hidden', 'true');
  dom.drawerBackdrop.classList.remove('visible');
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

function renderLibraryCards() {
  if (!dom.libCardsGrid) return;

  dom.libCardsGrid.classList.toggle('mode-list', state.libLayoutMode === 'list');

  const query = state.libSearchQuery.trim().toLowerCase();
  const tierFilter = state.libTierFilter;
  const yearFilter = state.libYearFilter;
  const themeFilter = state.libThemeFilter;

  const filtered = state.allPublications.filter(p => {
    // Tier
    if (tierFilter !== 'ALL' && !p.milestone.tier.includes(tierFilter)) {
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
        <span class="card-date-badge">${pub.date}</span>
      </div>
      <div class="lib-card-main">
        <h4 class="lib-card-title" title="${state.lang === 'zh' ? '点击研读此论文详情与 FAQ' : 'Click to explore paper & FAQ'}">${pub.title}</h4>
        <div class="lib-card-theme">${domainName}</div>
      </div>
      <div class="lib-card-actions">
        <div class="lib-card-links-left">
          <button class="btn-read-deep" data-pub-id="${pub.pub_id}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            ${dict.btn_read_deep}
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
    card.querySelector('.lib-card-title')!.addEventListener('click', openHandler);
    card.querySelector('.btn-read-deep')!.addEventListener('click', openHandler);

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
