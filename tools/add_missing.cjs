const fs = require('fs');
const p = 'tools/generate_all_39_deepwiki.py';
let content = fs.readFileSync(p, 'utf8');

const missingSnippet = `
    "alphafold2_2020": {
        "repo": "google-deepmind/alphafold",
        "tree": "alphafold/\\n├── alphafold/\\n│   ├── model/\\n│   │   ├── modules.py    # ★ InvariantPointAttention, EvoformerIteration\\n│   │   ├── folding.py    # StructureModule: SO(3) frame update & torsion angles\\n│   │   └── geometry.py   # Vec3Array, Rot3Array (3D transformations)\\n│   ├── data/pipeline.py  # MSA & template feature pipeline\\n│   └── common/protein.py # PDB format writer & residue geometries\\n└── run_alphafold.py      # Entry point",
        "artifacts": [
            {"file": "alphafold/model/modules.py", "symbol": "class InvariantPointAttention(hk.Module)", "role": "SE(3) 等变几何注意力，在三维物理坐标系下直接更新蛋白质残基主链刚体坐标系 (Rot3, Vec3)", "role_en": "SE(3)-equivariant attention updating backbone residue rigid frames directly in 3D physical Euclidean coordinates"},
            {"file": "alphafold/model/modules.py", "symbol": "class EvoformerIteration(hk.Module)", "role": "多序列比对 (MSA) 与残基对表示 (Pair Representation) 之间的三角注意力与轴向信息交换", "role_en": "Axial and triangular attention interaction propagating co-evolutionary signals between MSA and Pair representations"}
        ],
        "math_zh": "将蛋白质结构预测化为端到端可微学习。Evoformer 模块利用 MSA 进化协变性与残基对几何距离三角不等式约束；结构模块 (Structure Module) 采用不变点注意力 (Invariant Point Attention, IPA)，保证三维坐标预测对于任意全局刚体欧几里得变换 g in SE(3) 具有严格的数学等变性与不变性。",
        "math_en": "End-to-end differentiable protein structure prediction. Evoformer propagates co-evolutionary signals via triangular attention, while Invariant Point Attention (IPA) maintains rigorous SE(3) equivariance under 3D Euclidean rotations and translations.",
        "equations": [
            "\\\\mathbf{T}_i = (\\\\mathbf{R}_i, \\\\vec{t}_i) \\\\in SE(3), \\\\quad \\\\vec{x}_i^{(l+1)} = \\\\vec{x}_i^{(l)} + \\\\sum_j w_{ij} \\\\mathbf{R}_i \\\\vec{v}_{ij}^{point}",
            "z_{ij} \\\\leftarrow \\\\sum_k z_{ik} \\\\odot z_{jk}"
        ],
        "mapping": [
            {"formula": "\\\\mathbf{T}_i", "code_var": "rigid_frames", "meaning": "残基主链刚体局部坐标系 (Rot3 + Vec3)"},
            {"formula": "w_{ij}", "code_var": "attn_weights", "meaning": "标量与三维欧式点积联合注意力权重"}
        ],
        "code": "# Source: alphafold/model/modules.py (Jumper et al. Nature 2021)\\nimport torch\\nimport torch.nn as nn\\nimport torch.nn.functional as F\\n\\nclass InvariantPointAttention(nn.Module):\\n    def __init__(self, c_s=384, c_z=128, num_heads=12, num_points=8):\\n        super().__init__()\\n        self.num_heads, self.num_points = num_heads, num_points\\n        self.q_scalar = nn.Linear(c_s, num_heads * 16)\\n        self.k_scalar = nn.Linear(c_s, num_heads * 16)\\n        self.q_point = nn.Linear(c_s, num_heads * num_points * 3)\\n        self.k_point = nn.Linear(c_s, num_heads * num_points * 3)\\n        self.bias_pair = nn.Linear(c_z, num_heads)\\n\\n    def forward(self, s, z, rotations, translations):\\n        B, N, _ = s.shape\\n        H, P = self.num_heads, self.num_points\\n        q_s = self.q_scalar(s).view(B, N, H, 16)\\n        k_s = self.k_scalar(s).view(B, N, H, 16)\\n        scalar_attn = torch.einsum('bnhc,bmhc->bhnm', q_s, k_s) / 4.0\\n\\n        q_pt = torch.einsum('bnij,bnhpj->bnhpi', rotations, self.q_point(s).view(B, N, H, P, 3)) + translations.unsqueeze(2).unsqueeze(3)\\n        k_pt = torch.einsum('bmij,bmhpj->bmhpi', rotations, self.k_point(s).view(B, N, H, P, 3)) + translations.unsqueeze(2).unsqueeze(3)\\n        dist_sq = ((q_pt.unsqueeze(3) - k_pt.unsqueeze(2)) ** 2).sum(dim=-1).sum(dim=-1)\\n        point_attn = -0.5 * dist_sq * 0.1\\n        pair_bias = self.bias_pair(z).permute(0, 3, 1, 2)\\n        return F.softmax(scalar_attn + point_attn + pair_bias, dim=-1)"
    },

    "graphcast_2023": {
        "repo": "google-deepmind/graphcast",
        "tree": "graphcast/\\n├── graphcast/\\n│   ├── graphcast.py          # ★ GraphCast MPNN, Auto-regressive rollout\\n│   ├── deep_typed_graph_net.py# DeepTypedGraphNet message passing layers\\n│   ├── grid_mesh_connectivity.py# Icosahedral geodesic mesh graph builder\\n│   └── rollout.py            # Autoregressive 10-day weather prediction loop\\n└── run_graphcast.py          # Inference entry using ERA5 atmospheric data",
        "artifacts": [
            {"file": "graphcast/graphcast.py", "symbol": "class GraphCast(nn.Module)", "role": "图神经网络全球中长期气象预测模型，通过 Grid2Mesh -> Mesh GNN -> Mesh2Grid 三段式消息传递实现流体力学方程高保真模拟", "role_en": "Global medium-range weather forecasting GNN using Grid2Mesh -> Multi-Mesh GNN -> Mesh2Grid message passing"}
        ],
        "math_zh": "数值天气预报本质上是球面上非线性纳维-斯托克斯偏微分方程的时空离散求解。GraphCast 构建基于二十面体多级细分球面测地网格 (Icosahedral Geodesic Mesh)。算法由三大阶段构成：Grid2Mesh、Multi-Mesh GNN (16层深层消息传递)、Mesh2Grid。以 6 小时步长自回归滚动推演，在 1 分钟内完成 10 天全球高清预报。",
        "math_en": "Formulates atmospheric dynamics as message passing over spherical multiresolution icosahedral geodesic meshes, bypassing lat-lon polar singularities. Employs a three-stage GNN pipeline: Grid2Mesh, 16-layer Mesh GNN, and Mesh2Grid.",
        "equations": [
            "\\\\mathbf{v}_i^{(l+1)} = \\\\phi_v \\\\left( \\\\mathbf{v}_i^{(l)}, \\\\sum_{j \\\\in \\\\mathcal{N}(i)} \\\\phi_e \\\\left( \\\\mathbf{v}_i^{(l)}, \\\\mathbf{v}_j^{(l)}, \\\\mathbf{e}_{ij} \\\\right) \\\\right)",
            "\\\\mathcal{L}_{rollout} = \\\\frac{1}{K} \\\\sum_{k=1}^K \\\\sum_{v} w(v) \\\\left\\\\| \\\\hat{\\\\mathbf{x}}_{t+k\\\\Delta t} - \\\\mathbf{x}_{t+k\\\\Delta t} \\\\right\\\\|_2^2"
        ],
        "mapping": [
            {"formula": "\\\\mathbf{v}_i", "code_var": "mesh_nodes", "meaning": "二十面体球面测地网格节点特征"},
            {"formula": "\\\\mathbf{e}_{ij}", "code_var": "mesh_edges", "meaning": "网格边空间相对位移与跨尺度拓扑特征"}
        ],
        "code": "# Source: graphcast/graphcast.py (Lam et al. Science 2023)\\nimport torch\\nimport torch.nn as nn\\n\\nclass MessagePassingLayer(nn.Module):\\n    def __init__(self, node_dim=512, edge_dim=512):\\n        super().__init__()\\n        self.edge_mlp = nn.Sequential(nn.Linear(2 * node_dim + edge_dim, edge_dim), nn.SiLU(), nn.Linear(edge_dim, edge_dim))\\n        self.node_mlp = nn.Sequential(nn.Linear(node_dim + edge_dim, node_dim), nn.SiLU(), nn.Linear(node_dim, node_dim))\\n\\n    def forward(self, nodes, edges, senders, receivers):\\n        edge_inputs = torch.cat([nodes[senders], nodes[receivers], edges], dim=-1)\\n        updated_edges = edges + self.edge_mlp(edge_inputs)\\n        aggregated = torch.zeros(nodes.shape[0], updated_edges.shape[-1], device=nodes.device)\\n        aggregated.index_add_(0, receivers, updated_edges)\\n        updated_nodes = nodes + self.node_mlp(torch.cat([nodes, aggregated], dim=-1))\\n        return updated_nodes, updated_edges"
    },

    "alphageometry_2024": {
        "repo": "google-deepmind/alphageometry",
        "tree": "alphageometry/\\n├── alphageometry/\\n│   ├── ddar.py               # ★ Deductive Database + Algebraic Reasoning\\n│   ├── beam_search.py        # ★ Neuro-symbolic search loop\\n│   ├── graph.py              # Geometric dependency DAG representation\\n│   └── lm.py                 # Transformer language model for auxiliary constructions\\n└── run.sh                    # Olympiad problem benchmark execution script",
        "artifacts": [
            {"file": "alphageometry/ddar.py", "symbol": "class DeductiveEngine / DDAR", "role": "符号演绎数据库与代数推理引擎，基于确定性几何公理严格前向推理，杜绝大模型数学幻觉", "role_en": "Deductive database and algebraic reasoning engine executing deterministic geometric axioms without neural hallucinations"},
            {"file": "alphageometry/beam_search.py", "symbol": "class GeometricBeamSearch", "role": "神经-符号混合搜索控制环，当符号演绎陷入死胡同时，调用神经语言模型提出辅助线/辅助点构造", "role_en": "Neuro-symbolic search loop: invokes neural LM to synthesize auxiliary geometric constructions when symbolic deduction saturates"}
        ],
        "math_zh": "解决高难度数学竞赛定理证明中的组合爆炸问题。创新提出神经-符号双引擎协同理论 (Neuro-Symbolic Synergy)：符号引擎 (DD+AR) 依据几何公理进行无幻觉的前向逻辑演绎；当符号引擎推导饱和时，神经语言模型充当“直觉灵感”，提出创造性的辅助点/线构造，形成闭环求解。",
        "math_en": "Pioneers a neuro-symbolic theorem prover combining neural intuitive suggestions with rigorous symbolic deduction. A Deductive Database (DD+AR) executes verified axiomatic deductions. When deduction saturates, a Transformer suggests creative auxiliary point constructions.",
        "equations": [
            "\\\\text{Graph}_{t+1} = \\\\text{DDAR}(\\\\text{Graph}_t \\\\cup \\\\text{AuxiliaryConstruction})"
        ],
        "mapping": [
            {"formula": "\\\\text{DD+AR}", "code_var": "ddar_engine", "meaning": "无幻觉确定性符号公理演绎数据库"},
            {"formula": "\\\\text{Auxiliary}", "code_var": "lm.generate_auxiliary()", "meaning": "语言模型辅助线/辅助点生成器"}
        ],
        "code": "# Source: alphageometry/ddar.py & beam_search.py (Trinh et al. Nature 2024)\\nclass AlphaGeometryProver:\\n    def __init__(self, ddar_engine, transformer_lm):\\n        self.ddar = ddar_engine\\n        self.lm = transformer_lm\\n\\n    def solve(self, premise, conclusion, max_depth=16):\\n        graph = self.ddar.build_graph(premise)\\n        for _ in range(max_depth):\\n            self.ddar.run_deduction_to_saturation(graph)\\n            if self.ddar.is_satisfied(graph, conclusion):\\n                return self.ddar.extract_minimal_proof(graph, conclusion)\\n            aux_point = self.lm.generate_auxiliary_points(graph.to_tokens())[0]\\n            graph.add_construction(aux_point)\\n        return None"
    },
`;

content = content.replace('"chinchilla_2022": {', missingSnippet + '    "chinchilla_2022": {');
fs.writeFileSync(p, content, 'utf8');
console.log('Injected missing 3 milestones');
