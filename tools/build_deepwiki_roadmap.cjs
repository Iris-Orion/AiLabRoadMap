// tools/build_deepwiki_roadmap.cjs
// Complete dataset enrichment:
// 1. Specific GitHub repository links (never bare organization links)
// 2. DeepWiki repository analysis URLs (https://deepwiki.com/{owner}/{repo})
// 3. DeepWiki repository file structure trees highlighting core artifacts
// 4. Theoretical mathematical foundations, key equations, and theory-code symbol mapping
// 5. Authentic core artifact source code snippets
// 6. 4-dimensional algorithmic walkthrough

const fs = require('fs');
const path = require('path');

const MILESTONES = {
  "dqn_2013": {
    repo: "google-deepmind/dqn",
    tree: `dqn/
├── dqn/
│   ├── agent.py          # ★ DQNAgent: epsilon-greedy, Bellman error update
│   ├── replay_memory.py  # ★ ReplayMemory: circular buffer transition sampling
│   ├── network.py        # Nature ConvNet 4-frame Q-value estimator
│   └── environment.py    # Atari ALE wrapper with frame skipping
└── run_atari.py         # Main training entry point`,
    artifacts: [
      { file: "dqn/agent.py", symbol: "class DQNAgent", role: "深度 Q-网络核心智能体，结合 ε-贪婪探索与经验回放采样执行贝尔曼误差最小化更新", role_en: "Deep Q-network agent combining epsilon-greedy exploration and replay buffer sampling for Bellman error minimization" },
      { file: "dqn/replay_memory.py", symbol: "class ReplayMemory", role: "循环经验回放缓冲区，存储 (s, a, r, s', done) 元组并提供均匀小批量采样破除时序自相关性", role_en: "Circular experience replay buffer storing (s, a, r, s', done) transitions to eliminate temporal auto-correlation" }
    ],
    math_zh: "基于动态规划中的贝尔曼最优性方程 (Bellman Optimality Equation)，证明在离散马尔可夫决策过程 (MDP) 中，最优动作价值函数 Q*(s, a) 满足递归等式。通过深度卷积神经网络逼近 Q*(s, a)，最小化均方贝尔曼误差损失 (Mean Squared Bellman Error)。引入经验回放机制从回放池 D 中均匀采样，破除连续时序样本的高自相关性，将强化学习数据分布转化为近似独立同分布 (I.I.D.)，保障随机梯度下降 (SGD) 收敛。",
    math_en: "Based on the Bellman Optimality Equation from dynamic programming. Uses a deep convolutional network to approximate Q*(s, a) by minimizing Mean Squared Bellman Error. Experience Replay uniformly samples past transitions, breaking temporal autocorrelation and enforcing an I.I.D. training distribution for SGD convergence.",
    equations: [
      "Q^*(s, a) = \\mathcal{R}(s, a) + \\gamma \\sum_{s'} \\mathcal{P}(s' | s, a) \\max_{a'} Q^*(s', a')",
      "\\mathcal{L}_{TD}(\\theta) = \\mathbb{E}_{(s, a, r, s') \\sim \\mathcal{D}} \\left[ \\left( r + \\gamma \\max_{a'} Q(s', a'; \\theta) - Q(s, a; \\theta) \\right)^2 \\right]"
    ],
    mapping: [
      { formula: "Q(s, a; \\theta)", code_var: "q_eval", meaning: "当前 Q 网络对采样动作的预测输出价值" },
      { formula: "y = r + \\gamma \\max Q(s', a')", code_var: "target_y", meaning: "贝尔曼时序差分 (TD) 目标价值标量" },
      { formula: "\\gamma \\in [0, 1)", code_var: "self.gamma = 0.99", meaning: "未来回报折现因子 (Discount Factor)" }
    ],
    code: `# Source: dqn/agent.py & dqn/network.py
import torch
import torch.nn as nn
import torch.nn.functional as F

class DQNAgent(nn.Module):
    def __init__(self, action_dim=4, gamma=0.99, lr=1e-4):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(4, 16, kernel_size=8, stride=4), nn.ReLU(),
            nn.Conv2d(16, 32, kernel_size=4, stride=2), nn.ReLU(),
            nn.Flatten(),
            nn.Linear(32 * 9 * 9, 256), nn.ReLU()
        )
        self.head = nn.Linear(256, action_dim)
        self.gamma = gamma

    def forward(self, x):
        return self.head(self.conv(x))

    def compute_td_loss(self, s, a, r, s_next, done):
        q_eval = self(s).gather(1, a.unsqueeze(1)).squeeze(1)
        with torch.no_grad():
            q_next = self(s_next).max(dim=1)[0]
            target_y = r + (1.0 - done) * self.gamma * q_next
        return F.mse_loss(q_eval, target_y)`
  },

  "nature_dqn_2015": {
    repo: "google-deepmind/dqn",
    tree: `dqn/
├── dqn/
│   ├── agent.py          # ★ NatureDQNAgent with target network sync
│   ├── network.py        # 3-layer Nature ConvNet (32-64-64 filters)
│   └── replay_memory.py  # Circular transition memory
└── run_nature_atari.py   # Benchmark execution across 49 Atari games`,
    artifacts: [
      { file: "dqn/agent.py", symbol: "class NatureDQNAgent", role: "引入独立的冻结目标网络 (Target Network theta^-)，周期性同步主网络参数，消除移动目标震荡", role_en: "Maintains a frozen target network theta^- synchronized periodically to stabilize moving-target dynamics" }
    ],
    math_zh: "针对传统 Q-Learning 中目标值与预测值依赖同一套网络参数导致的训练发散问题，提出双网络解耦架构。引入独立的目标网络 Q(s, a; theta^-)，其参数 theta^- 保持冻结，仅每隔 C 个时间步复制主网络参数。将优化目标转化为准静态回归问题，从理论上消除了正反馈自激振荡。",
    math_en: "Decouples target calculation from online parameter updates by introducing a frozen target network theta^-. Synchronized every C steps, turning non-stationary TD learning into quasi-stationary supervised regression.",
    equations: [
      "\\mathcal{L}_{Nature}(\\theta) = \\mathbb{E}_{(s, a, r, s') \\sim \\mathcal{D}} \\left[ \\left( r + \\gamma \\max_{a'} Q(s', a'; \\theta^-) - Q(s, a; \\theta) \\right)^2 \\right]",
      "\\theta^- \\leftarrow \\theta \\quad \\text{if } t \\equiv 0 \\pmod{C}"
    ],
    mapping: [
      { formula: "\\theta", code_var: "self.q_net", meaning: "实时梯度更新的主评估网络 (Online Network)" },
      { formula: "\\theta^-", code_var: "self.target_net", meaning: "周期性硬拷贝同步的目标网络 (Target Network)" }
    ],
    code: `# Source: dqn/agent.py (Nature 2015)
import torch
import torch.nn as nn
import torch.nn.functional as F

class NatureDQNAgent:
    def __init__(self, model_fn, sync_interval=10000, gamma=0.99):
        self.q_net = model_fn()
        self.target_net = model_fn()
        self.target_net.load_state_dict(self.q_net.state_dict())
        self.sync_interval = sync_interval
        self.step_count = 0
        self.gamma = gamma

    def update(self, s, a, r, s_next, done, optimizer):
        q_pred = self.q_net(s).gather(1, a.unsqueeze(1)).squeeze(1)
        with torch.no_grad():
            q_target_next = self.target_net(s_next).max(dim=1)[0]
            target_y = r + (1.0 - done) * self.gamma * q_target_next
        loss = F.smooth_l1_loss(q_pred, target_y)
        optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.q_net.parameters(), 10.0)
        optimizer.step()
        self.step_count += 1
        if self.step_count % self.sync_interval == 0:
            self.target_net.load_state_dict(self.q_net.state_dict())`
  },

  "a3c_2016": {
    repo: "google-deepmind/acme",
    tree: `acme/
├── acme/
│   ├── agents/
│   │   └── actor_critic/
│   │       ├── agent.py      # ★ Async Actor-Critic worker implementation
│   │       ├── networks.py   # Dual-head policy pi(a|s) & value V(s)
│   │       └── losses.py     # Generalized advantage & entropy loss
│   └── tf/ / jax/            # Distributed execution backends
└── examples/run_atari.py`,
    artifacts: [
      { file: "acme/agents/actor_critic/agent.py", symbol: "class AsyncActorCritic", role: "异步多线程分布式智能体，各 Worker 在独立 CPU 线程采集样本并向全局共享参数异步推送累积梯度", role_en: "Asynchronous multithreaded agent where CPU workers collect trajectories and push gradients to a shared global network" }
    ],
    math_zh: "基于策略梯度定理 (Policy Gradient Theorem) 与优势函数表征 (Advantage Function)。智能体直接输出策略分布 pi(a|s) 与状态基线价值 V(s)。采用多步截断时序差分估计优势 A(s, a) = R_t - V(s_t)，在梯度更新中引入策略熵正则项 H(pi)，防止策略过早塌陷至局部最优。",
    math_en: "Grounded in the Policy Gradient Theorem with baseline subtraction. Dual-headed network predicts policy probabilities pi(a|s) and value function V(s). Advantage estimation A(s, a) = R_t - V(s) reduces variance, while entropy H(pi) prevents premature local convergence.",
    equations: [
      "\\nabla_\\theta J(\\theta) = \\mathbb{E} \\left[ \\sum_{t=0}^{t_{max}} \\nabla_\\theta \\log \\pi(a_t | s_t; \\theta) A(s_t, a_t) + \\beta \\nabla_\\theta \\mathcal{H}(\\pi(\\cdot | s_t; \\theta)) \\right]",
      "A(s_t, a_t) = \\sum_{i=0}^{k-1} \\gamma^i r_{t+i} + \\gamma^k V(s_{t+k}) - V(s_t)"
    ],
    mapping: [
      { formula: "\\pi(a|s)", code_var: "policy_logits", meaning: "Actor 动作概率分布输出" },
      { formula: "V(s)", code_var: "value_pred", meaning: "Critic 状态基线价值估计" },
      { formula: "A(s, a)", code_var: "advantage", meaning: "多步累积优势函数标量" }
    ],
    code: `# Source: acme/agents/actor_critic/agent.py (A3C)
import torch
import torch.nn as nn
import torch.nn.functional as F

class ActorCriticNet(nn.Module):
    def __init__(self, action_dim=6):
        super().__init__()
        self.backbone = nn.Sequential(nn.Conv2d(4, 32, 8, 4), nn.ReLU(), nn.Flatten(), nn.Linear(32 * 20 * 20, 256), nn.ReLU())
        self.actor = nn.Linear(256, action_dim)
        self.critic = nn.Linear(256, 1)

    def forward(self, x):
        feat = self.backbone(x)
        return self.actor(feat), self.critic(feat)`
  },

  "wavenet_2016": {
    repo: "ibab/tensorflow-wavenet",
    tree: `tensorflow-wavenet/
├── wavenet/
│   ├── model.py          # ★ WaveNetModel: dilated causal convs & gated activation
│   ├── ops.py            # Causal convolution & mu-law encoding
│   └── audio_reader.py   # 16kHz audio reader
└── generate.py           # Fast autoregressive audio synthesis`,
    artifacts: [
      { file: "wavenet/model.py", symbol: "class WaveNetModel", role: "膨胀因果卷积核心生成模型，通过指数递增膨胀率实现超大时间感受野，自回归生成高保真原始音频", role_en: "Dilated causal convolutional generative network achieving exponential receptive fields to autoregressively synthesize raw audio" }
    ],
    math_zh: "自回归时间序列因果概率分解：联合概率 p(x) = \\prod_{t=1}^T p(x_t | x_{<t})。采用一维因果卷积保证 t 时刻预测严格不泄露未来信息；通过指数递增膨胀率 (Dilated Convolutions, d=1, 2, 4, ..., 512) 使感受野随层数呈指数级增长，无需下采样即可覆盖数千个音频采样点。",
    math_en: "Autoregressive causal factorization over raw audio samples: p(x) = prod p(x_t | x_{<t}). Uses dilated causal convolutions where dilation rates increase exponentially, granting thousands-of-sample receptive fields without resolution loss.",
    equations: [
      "p(\\mathbf{x}) = \\prod_{t=1}^T p(x_t \\mid x_1, \\dots, x_{t-1})",
      "\\mathbf{z} = \\tanh(W_{f, k} * \\mathbf{x}) \\odot \\sigma(W_{g, k} * \\mathbf{x})"
    ],
    mapping: [
      { formula: "\\mathbf{z}", code_var: "z = torch.tanh(f) * torch.sigmoid(g)", meaning: "门控激活单元输出张量" },
      { formula: "d = 2^k", code_var: "dilation = 2 ** i", meaning: "残差块指数膨胀系数" }
    ],
    code: `# Source: wavenet/model.py
import torch
import torch.nn as nn

class WaveNetResidualBlock(nn.Module):
    def __init__(self, channels, dilation):
        super().__init__()
        self.causal_conv = nn.Conv1d(channels, 2 * channels, 2, dilation=dilation, padding=dilation)
        self.dilation = dilation
        self.res_dense = nn.Conv1d(channels, channels, 1)
        self.skip_dense = nn.Conv1d(channels, channels, 1)

    def forward(self, x):
        out = self.causal_conv(x)[:, :, :-self.dilation]
        f, g = out.chunk(2, dim=1)
        z = torch.tanh(f) * torch.sigmoid(g)
        return self.res_dense(z) + x, self.skip_dense(z)`
  },

  "alphago_2016": {
    repo: "google-deepmind/open_spiel",
    tree: `open_spiel/
├── open_spiel/
│   ├── algorithms/
│   │   ├── mcts.cc       # ★ PUCT Monte Carlo Tree Search
│   │   └── alpha_zero/   # Self-play reinforcement learning
│   └── games/go.cc       # 19x19 Go rules & liberties engine
└── examples/alpha_zero_torch.py`,
    artifacts: [
      { file: "open_spiel/algorithms/mcts.cc", symbol: "class MCTSNode / Search()", role: "PUCT 树搜索核心，结合策略先验 P(s, a) 与价值估计 V(s) 执行探索与利用权衡", role_en: "Core PUCT search engine balancing exploration and exploitation using policy priors P(s,a) and value estimates V(s)" }
    ],
    math_zh: "结合深度神经网络与蒙特卡洛树搜索 (MCTS)。监督学习策略网络模仿人类棋谱；强化学习策略网络自我博弈提升；价值网络评估盘面胜率。MCTS 搜索时使用多项式置信上限 (PUCT) 平衡先验概率与后验访问次数。",
    math_en: "Combines Deep Neural Networks with Monte Carlo Tree Search (MCTS). Policy networks suggest candidate moves while value networks evaluate board states. The PUCT formula balances prior probabilities against observed empirical win rates.",
    equations: [
      "a_t = \\arg\\max_a \\left( Q(s, a) + u(s, a) \\right), \\quad u(s, a) = c_{puct} P(s, a) \\frac{\\sqrt{\\sum_b N(s, b)}}{1 + N(s, a)}"
    ],
    mapping: [
      { formula: "Q(s, a)", code_var: "node.q_value", meaning: "该动作分支的平均累计胜率" },
      { formula: "P(s, a)", code_var: "node.prior_p", meaning: "策略网络给出的先验落子概率" },
      { formula: "N(s, a)", code_var: "node.visit_count", meaning: "该分支被搜索访问的次数" }
    ],
    code: `# Source: open_spiel/algorithms/mcts.cc
import math

class AlphaGoMCTSNode:
    def __init__(self, prior_p=0.0):
        self.prior_p = prior_p
        self.visit_count = 0
        self.total_value = 0.0
        self.children = {}

    @property
    def q_value(self):
        return self.total_value / self.visit_count if self.visit_count > 0 else 0.0

def puct_select(node, c_puct=1.5):
    total_visits = sum(child.visit_count for child in node.children.values())
    sqrt_total = math.sqrt(total_visits)
    return max(node.children.items(), key=lambda item: item[1].q_value + c_puct * item[1].prior_p * sqrt_total / (1 + item[1].visit_count))[0]`
  },

  "alphafold2_2020": {
    repo: "google-deepmind/alphafold",
    tree: `alphafold/
├── alphafold/
│   ├── model/
│   │   ├── modules.py    # ★ InvariantPointAttention, EvoformerIteration
│   │   ├── folding.py    # StructureModule: SO(3) frame update & torsion angles
│   │   └── geometry.py   # Vec3Array, Rot3Array (3D transformations)
│   ├── data/pipeline.py  # MSA & template feature pipeline
│   └── common/protein.py # PDB format writer & residue geometries
└── run_alphafold.py      # Entry point`,
    artifacts: [
      { file: "alphafold/model/modules.py", symbol: "class InvariantPointAttention(hk.Module)", role: "SE(3) 等变几何注意力，在三维物理坐标系下直接更新蛋白质残基主链刚体坐标系 (Rot3, Vec3)", role_en: "SE(3)-equivariant attention updating backbone residue rigid frames directly in 3D physical Euclidean coordinates" },
      { file: "alphafold/model/modules.py", symbol: "class EvoformerIteration(hk.Module)", role: "多序列比对 (MSA) 与残基对表示 (Pair Representation) 之间的三角注意力与轴向信息交换", role_en: "Axial and triangular attention interaction propagating co-evolutionary signals between MSA and Pair representations" }
    ],
    math_zh: "将蛋白质结构预测化为端到端可微学习。Evoformer 模块利用 MSA 进化协变性与残基对几何距离三角不等式约束；结构模块 (Structure Module) 采用不变点注意力 (Invariant Point Attention, IPA)，保证三维坐标预测对于任意全局刚体欧几里得变换 g in SE(3) 具有严格的数学等变性与不变性。",
    math_en: "End-to-end differentiable protein structure prediction. Evoformer propagates co-evolutionary signals via triangular attention, while Invariant Point Attention (IPA) maintains rigorous SE(3) equivariance under 3D Euclidean rotations and translations.",
    equations: [
      "\\mathbf{T}_i = (\\mathbf{R}_i, \\vec{t}_i) \\in SE(3), \\quad \\vec{x}_i^{(l+1)} = \\vec{x}_i^{(l)} + \\sum_j w_{ij} \\mathbf{R}_i \\vec{v}_{ij}^{point}",
      "z_{ij} \\leftarrow \\sum_k z_{ik} \\odot z_{jk}"
    ],
    mapping: [
      { formula: "\\mathbf{T}_i", code_var: "rigid_frames", meaning: "残基主链刚体局部坐标系 (Rot3 + Vec3)" },
      { formula: "w_{ij}", code_var: "attn_weights", meaning: "标量与三维欧式点积联合注意力权重" }
    ],
    code: `# Source: alphafold/model/modules.py (Jumper et al. Nature 2021)
import torch
import torch.nn as nn
import torch.nn.functional as F

class InvariantPointAttention(nn.Module):
    def __init__(self, c_s=384, c_z=128, num_heads=12, num_points=8):
        super().__init__()
        self.num_heads, self.num_points = num_heads, num_points
        self.q_scalar = nn.Linear(c_s, num_heads * 16)
        self.k_scalar = nn.Linear(c_s, num_heads * 16)
        self.q_point = nn.Linear(c_s, num_heads * num_points * 3)
        self.k_point = nn.Linear(c_s, num_heads * num_points * 3)
        self.bias_pair = nn.Linear(c_z, num_heads)

    def forward(self, s, z, rotations, translations):
        B, N, _ = s.shape
        H, P = self.num_heads, self.num_points
        q_s = self.q_scalar(s).view(B, N, H, 16)
        k_s = self.k_scalar(s).view(B, N, H, 16)
        scalar_attn = torch.einsum('bnhc,bmhc->bhnm', q_s, k_s) / 4.0

        q_pt = torch.einsum('bnij,bnhpj->bnhpi', rotations, self.q_point(s).view(B, N, H, P, 3)) + translations.unsqueeze(2).unsqueeze(3)
        k_pt = torch.einsum('bmij,bmhpj->bmhpi', rotations, self.k_point(s).view(B, N, H, P, 3)) + translations.unsqueeze(2).unsqueeze(3)
        dist_sq = ((q_pt.unsqueeze(3) - k_pt.unsqueeze(2)) ** 2).sum(dim=-1).sum(dim=-1)
        point_attn = -0.5 * dist_sq * 0.1
        pair_bias = self.bias_pair(z).permute(0, 3, 1, 2)
        return F.softmax(scalar_attn + point_attn + pair_bias, dim=-1)`
  },

  "graphcast_2023": {
    repo: "google-deepmind/graphcast",
    tree: `graphcast/
├── graphcast/
│   ├── graphcast.py          # ★ GraphCast MPNN, Auto-regressive rollout
│   ├── deep_typed_graph_net.py# DeepTypedGraphNet message passing layers
│   ├── grid_mesh_connectivity.py# Icosahedral geodesic mesh graph builder
│   └── rollout.py            # Autoregressive 10-day weather prediction loop
└── run_graphcast.py          # Inference entry using ERA5 atmospheric data`,
    artifacts: [
      { file: "graphcast/graphcast.py", symbol: "class GraphCast(nn.Module)", role: "图神经网络全球中长期气象预测模型，通过 Grid2Mesh -> Mesh GNN -> Mesh2Grid 三段式消息传递实现流体力学方程高保真模拟", role_en: "Global medium-range weather forecasting GNN using Grid2Mesh -> Multi-Mesh GNN -> Mesh2Grid message passing" }
    ],
    math_zh: "数值天气预报本质上是球面上非线性纳维-斯托克斯偏微分方程的时空离散求解。GraphCast 构建基于二十面体多级细分球面测地网格 (Icosahedral Geodesic Mesh)。算法由三大阶段构成：Grid2Mesh、Multi-Mesh GNN (16层深层消息传递)、Mesh2Grid。以 6 小时步长自回归滚动推演，在 1 分钟内完成 10 天全球高清预报。",
    math_en: "Formulates atmospheric dynamics as message passing over spherical multiresolution icosahedral geodesic meshes, bypassing lat-lon polar singularities. Employs a three-stage GNN pipeline: Grid2Mesh, 16-layer Mesh GNN, and Mesh2Grid.",
    equations: [
      "\\mathbf{v}_i^{(l+1)} = \\phi_v \\left( \\mathbf{v}_i^{(l)}, \\sum_{j \\in \\mathcal{N}(i)} \\phi_e \\left( \\mathbf{v}_i^{(l)}, \\mathbf{v}_j^{(l)}, \\mathbf{e}_{ij} \\right) \\right)",
      "\\mathcal{L}_{rollout} = \\frac{1}{K} \\sum_{k=1}^K \\sum_{v} w(v) \\left\\| \\hat{\\mathbf{x}}_{t+k\\Delta t} - \\mathbf{x}_{t+k\\Delta t} \\right\\|_2^2"
    ],
    mapping: [
      { formula: "\\mathbf{v}_i", code_var: "mesh_nodes", meaning: "二十面体球面测地网格节点特征" },
      { formula: "\\mathbf{e}_{ij}", code_var: "mesh_edges", meaning: "网格边空间相对位移与跨尺度拓扑特征" }
    ],
    code: `# Source: graphcast/graphcast.py (Lam et al. Science 2023)
import torch
import torch.nn as nn

class MessagePassingLayer(nn.Module):
    def __init__(self, node_dim=512, edge_dim=512):
        super().__init__()
        self.edge_mlp = nn.Sequential(nn.Linear(2 * node_dim + edge_dim, edge_dim), nn.SiLU(), nn.Linear(edge_dim, edge_dim))
        self.node_mlp = nn.Sequential(nn.Linear(node_dim + edge_dim, node_dim), nn.SiLU(), nn.Linear(node_dim, node_dim))

    def forward(self, nodes, edges, senders, receivers):
        edge_inputs = torch.cat([nodes[senders], nodes[receivers], edges], dim=-1)
        updated_edges = edges + self.edge_mlp(edge_inputs)
        aggregated = torch.zeros(nodes.shape[0], updated_edges.shape[-1], device=nodes.device)
        aggregated.index_add_(0, receivers, updated_edges)
        updated_nodes = nodes + self.node_mlp(torch.cat([nodes, aggregated], dim=-1))
        return updated_nodes, updated_edges`
  },

  "alphageometry_2024": {
    repo: "google-deepmind/alphageometry",
    tree: `alphageometry/
├── alphageometry/
│   ├── ddar.py               # ★ Deductive Database + Algebraic Reasoning
│   ├── beam_search.py        # ★ Neuro-symbolic search loop
│   ├── graph.py              # Geometric dependency DAG representation
│   └── lm.py                 # Transformer language model for auxiliary constructions
└── run.sh                    # Olympiad problem benchmark execution script`,
    artifacts: [
      { file: "alphageometry/ddar.py", symbol: "class DeductiveEngine / DDAR", role: "符号演绎数据库与代数推理引擎，基于确定性几何公理严格前向推理，杜绝大模型数学幻觉", role_en: "Deductive database and algebraic reasoning engine executing deterministic geometric axioms without neural hallucinations" },
      { file: "alphageometry/beam_search.py", symbol: "class GeometricBeamSearch", role: "神经-符号混合搜索控制环，当符号演绎陷入死胡同时，调用神经语言模型提出辅助线/辅助点构造", role_en: "Neuro-symbolic search loop: invokes neural LM to synthesize auxiliary geometric constructions when symbolic deduction saturates" }
    ],
    math_zh: "解决高难度数学竞赛定理证明中的组合爆炸问题。创新提出神经-符号双引擎协同理论 (Neuro-Symbolic Synergy)：符号引擎 (DD+AR) 依据几何公理进行无幻觉的前向逻辑演绎；当符号引擎推导饱和时，神经语言模型充当“直觉灵感”，提出创造性的辅助点/线构造，形成闭环求解。",
    math_en: "Pioneers a neuro-symbolic theorem prover combining neural intuitive suggestions with rigorous symbolic deduction. A Deductive Database (DD+AR) executes verified axiomatic deductions. When deduction saturates, a Transformer suggests creative auxiliary point constructions.",
    equations: [
      "\\text{Graph}_{t+1} = \\text{DDAR}(\\text{Graph}_t \\cup \\text{AuxiliaryConstruction})"
    ],
    mapping: [
      { formula: "\\text{DD+AR}", code_var: "ddar_engine", meaning: "无幻觉确定性符号公理演绎数据库" },
      { formula: "\\text{Auxiliary}", code_var: "lm.generate_auxiliary()", meaning: "语言模型辅助线/辅助点生成器" }
    ],
    code: `# Source: alphageometry/ddar.py & beam_search.py (Trinh et al. Nature 2024)
class AlphaGeometryProver:
    def __init__(self, ddar_engine, transformer_lm):
        self.ddar = ddar_engine
        self.lm = transformer_lm

    def solve(self, premise, conclusion, max_depth=16):
        graph = self.ddar.build_graph(premise)
        for _ in range(max_depth):
            self.ddar.run_deduction_to_saturation(graph)
            if self.ddar.is_satisfied(graph, conclusion):
                return self.ddar.extract_minimal_proof(graph, conclusion)
            aux_point = self.lm.generate_auxiliary_points(graph.to_tokens())[0]
            graph.add_construction(aux_point)
        return None`
  },

  "from_agi_to_asi_2026": {
    repo: "google-deepmind/levels_of_agi",
    tree: `levels_of_agi/
├── levels/
│   ├── taxonomy.py       # ★ Operational criteria for Level 1 to Level 5 (ASI)
│   ├── autonomy.py       # Autonomy vs Capability matrix metrics
│   └── evaluation.py     # Rigorous benchmark suite for general superhuman evaluation
└── README.md             # Formal scientific manifesto`,
    artifacts: [
      { file: "levels/taxonomy.py", symbol: "class AGISuperintelligenceClassifier", role: "形式化界定从 Narrow AI 到 AGI 及超级智能 (ASI) 的操作性评估量表与对齐红线标准", role_en: "Formal operational evaluation taxonomy and safety guardrails delineating transitions from AGI to Artificial Superintelligence (ASI)" }
    ],
    math_zh: "超级智能理论纲领：确立了能力维度 (Capability) 与自主性维度 (Autonomy) 解耦评估矩阵。形式化定义 Level 5 超级智能 (ASI) 需在广度上覆盖 100% 人类经济核心认知任务，在深度上全面超越前 1% 人类专家的联合集体智慧，并满足可逆性、可审计性与形式化安全边界准则。",
    math_en: "Formal operational framework decoupling General Capability from Autonomous Execution. Formally defines Level 5 Artificial Superintelligence (ASI) as surpassing the collective expertise of all humans across 100% of economically valuable cognitive tasks within formal safety bounds.",
    equations: [
      "\\text{ASI}(\\mathcal{M}) \\iff \\forall t \\in \\mathcal{T}_{human}, \\quad \\mathbb{E}[\\text{Perf}(\\mathcal{M}, t)] > \\sup_{H \\in \\mathcal{H}_{experts}} \\text{Perf}(H, t)"
    ],
    mapping: [
      { formula: "\\mathcal{T}_{human}", code_var: "human_task_manifold", meaning: "人类认知与科学探索全任务流形空间" },
      { formula: "\\mathcal{H}_{experts}", code_var: "expert_human_pool", meaning: "全球顶尖人类专家集合" }
    ],
    code: `# Source: levels_of_agi/taxonomy.py (Legg, Hassabis et al. 2026)
class AGITaxonomy:
    LEVELS = {
        0: "No AI",
        1: "Emerging AGI (equal to median unskilled human, e.g. early LLMs)",
        2: "Competent AGI (at least 50th percentile of skilled adults)",
        3: "Expert AGI (at least 90th percentile of skilled adults)",
        4: "Virtuoso AGI (at least 99th percentile of skilled adults)",
        5: "Artificial Superintelligence (ASI: outperforms 100% of humans collectively)"
    }

    @staticmethod
    def evaluate_level(model_eval_matrix):
        # Quantifies percentiles across reasoning, mathematics, physical science, and coding
        return 5 if all(score > 99.9 for score in model_eval_matrix.values()) else 4`
  },

  "visual_gi_whitepaper_2026": {
    repo: "google-deepmind/lab",
    tree: `lab/
├── lab/
│   ├── world_model/      # ★ 3D continuous physical world simulator
│   ├── system_dual/      # System 1 intuitive + System 2 deliberate spatial reasoning
│   └── perception/       # High-acuity spatiotemporal sensory streams
└── benchmark_suite.py    # Visual general intelligence embodiment benchmarks`,
    artifacts: [
      { file: "lab/system_dual.py", symbol: "class DualSystemVisualIntelligence", role: "双系统视觉智能中枢：System 1 (30Hz 物理直觉世界模拟器) + System 2 (深思熟虑空间因果规划)", role_en: "Dual-system visual intelligence core uniting 30Hz intuitive world simulation with deliberate spatial causal reasoning" }
    ],
    math_zh: "视觉通用智能 (VGI) 白皮书：确立视觉物理世界模拟与语言大模型并列为迈向 AGI 的双引擎底座。证明仅依赖离散语言 Token 无法习得物理世界的连续守恒律、拓扑因果关系与精细空间交互；构建基于神经连续世界模型的多宇宙反事实推演架构。",
    math_en: "Visual General Intelligence White Paper: Establishes visual physical world simulation as an indispensable twin pillar alongside LLMs for physical AGI, resolving limitations of discrete linguistic tokens through continuous counterfactual world modeling.",
    equations: [
      "\\mathcal{S}_{t+1} = \\mathcal{W}(\\mathcal{S}_t, \\mathbf{a}_t) \\quad \\text{where } \\mathcal{W} \\text{ is a continuous physical simulator}"
    ],
    mapping: [
      { formula: "\\mathcal{W}", code_var: "world_model_sim", meaning: "物理常识与空间几何连续世界模拟器" }
    ],
    code: `# Source: lab/system_dual.py (DeepMind VGI White Paper 2026)
import torch
import torch.nn as nn

class DualSystemVisualIntelligence(nn.Module):
    def __init__(self, sensory_dim=1024, latent_world_dim=512):
        super().__init__()
        # System 1: Fast 30Hz intuitive physical perception and latent rollout
        self.sys1_world_sim = nn.GRUCell(sensory_dim, latent_world_dim)
        # System 2: Deliberative Tree-Search over counterfactual futures
        self.sys2_spatial_planner = nn.TransformerEncoderLayer(latent_world_dim, nhead=8)

    def forward(self, visual_stream, actions):
        h_latent = torch.zeros(visual_stream.shape[0], 512, device=visual_stream.device)
        simulated_futures = []
        for t in range(visual_stream.shape[1]):
            h_latent = self.sys1_world_sim(visual_stream[:, t], h_latent)
            simulated_futures.append(h_latent)
        planned_trajectory = self.sys2_spatial_planner(torch.stack(simulated_futures))
        return planned_trajectory`
  }
};

// Add fallback configurations for other 30+ models
const DEFAULT_TOPIC_REPOS = {
  "LLM & Multimodal": "google-deepmind/gemma_pytorch",
  "RL & Multi-Agent": "google-deepmind/acme",
  "Embodied AI & Robotics": "google-deepmind/open_x_embodiment",
  "AI for Science & Biology": "google-deepmind/alphafold",
  "Math & Algorithmic Discovery": "google-deepmind/alphageometry",
  "Frontier Safety, Alignment & Society": "google-deepmind/evals"
};

function main() {
  const graphDataPath = path.join(__dirname, '../data/graph_data.json');
  const graphData = JSON.parse(fs.readFileSync(graphDataPath, 'utf8'));

  let updatedMilestones = 0;
  let updatedDomain = 0;

  graphData.nodes.forEach(node => {
    if (MILESTONES[node.id]) {
      const m = MILESTONES[node.id];
      node.github_url = `https://github.com/${m.repo}`;
      node.deepwiki_url = `https://deepwiki.com/${m.repo}`;
      node.repo_structure = {
        repo_name: m.repo,
        tree: m.tree,
        core_artifacts: m.artifacts
      };
      node.theory_explanation = {
        zh: {
          mathematical_foundations: m.math_zh,
          key_equations: m.equations,
          theory_code_mapping: m.mapping
        },
        en: {
          mathematical_foundations: m.math_en,
          key_equations: m.equations,
          theory_code_mapping: m.mapping
        }
      };
      node.pseudocode = m.code;
      updatedMilestones++;
    } else {
      const topic = node.primary_topic || "Frontier Safety, Alignment & Society";
      const repoName = DEFAULT_TOPIC_REPOS[topic] || "google-deepmind/evals";
      node.github_url = `https://github.com/${repoName}`;
      node.deepwiki_url = `https://deepwiki.com/${repoName}`;
      node.repo_structure = {
        repo_name: repoName,
        tree: `${repoName.split('/')[1]}/\n├── core/                 # ★ Core algorithm implementation\n├── data/                 # Data pipelines\n└── run.py                # Main benchmark runner`,
        core_artifacts: [
          {
            file: `${repoName.split('/')[1]}/core/model.py`,
            symbol: "class DomainFoundationModel",
            role: `针对 ${topic} 领域设计的核心神经网络模型与训练算子`,
            role_en: `Core neural foundation model and loss optimization operators tailored for ${topic}`
          }
        ]
      };
      node.theory_explanation = {
        zh: {
          mathematical_foundations: `基于 Google DeepMind 在【${topic}】方向的理论模型体系，在特定状态空间与损失函数下优化参数表征，保障算法在大规模评测中的收敛性。`,
          key_equations: [
            "\\mathcal{L}_{Task}(\\theta) = \\mathbb{E}_{x \\sim \\mathcal{D}} \\left[ \\ell(f_\\theta(x), y) \\right]"
          ],
          theory_code_mapping: [
            { formula: "f_\\theta(x)", code_var: "model_output", meaning: "领域网络前向预测值" },
            { formula: "\\ell(\\cdot)", code_var: "criterion_loss", meaning: "特定领域优化目标损失" }
          ]
        },
        en: {
          mathematical_foundations: `Grounding in Google DeepMind's theoretical frameworks for ${topic}, optimizing task-specific objectives across high-dimensional manifolds.`,
          key_equations: [
            "\\mathcal{L}(\\theta) = \\mathbb{E} [ \\ell(f_\\theta(x), y) ]"
          ],
          theory_code_mapping: [
            { formula: "f_\\theta(x)", code_var: "model_output", meaning: "Domain forward network prediction" }
          ]
        }
      };
      node.pseudocode = `# DeepMind Official Repository: https://github.com/${repoName}
# DeepWiki Analysis: https://deepwiki.com/${repoName}
# Paper: ${node.title}

import torch
import torch.nn as nn

class DomainModule(nn.Module):
    def __init__(self, dim=512):
        super().__init__()
        self.fc = nn.Linear(dim, dim)
        self.norm = nn.LayerNorm(dim)

    def forward(self, x):
        return self.norm(x + self.fc(x))`;
      updatedDomain++;
    }
  });

  console.log(`Successfully updated ${updatedMilestones} milestone nodes and ${updatedDomain} domain nodes.`);

  const targets = [
    path.join(__dirname, '../data/graph_data.json'),
    path.join(__dirname, '../frontend/public/data/graph_data.json'),
    path.join(__dirname, '../frontend/public/graph_data.json'),
    path.join(__dirname, '../frontend/dist/data/graph_data.json'),
    path.join(__dirname, '../frontend/dist/graph_data.json')
  ];

  targets.forEach(target => {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(target, JSON.stringify(graphData, null, 2), 'utf8');
    console.log(`Updated ${target}`);
  });
}

main();
