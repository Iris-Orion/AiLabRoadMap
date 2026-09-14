const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('frontend/show_result.ts');
let content = fs.readFileSync(targetFile, 'utf8');

const newDomainFunc = `function getDomainPseudocodeAndExplanation(pub: PublicationItem, _isZh?: boolean): {
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
          tree_text: \`google-deepmind/gemma_pytorch/
├── gemma/
│   ├── config.py             # Model hyperparameter dataclasses
│   ├── model.py              # Rotary Embeddings, RMSNorm, GeGLU & MoE Transformer
│   ├── tokenizer.py          # SentencePiece vocabulary & byte fallback
│   └── sampler.py            # KV caching & nucleus sampling
└── scripts/
    └── run.py                # Distributed TPU/GPU generation script\`,
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
              latex: "\\\\mathbf{R}_{\\\\Theta, m}^d = \\\\mathrm{diag}\\\\left(\\\\begin{pmatrix} \\\\cos m\\\\theta_i & -\\\\sin m\\\\theta_i \\\\\\\\ \\\\sin m\\\\theta_i & \\\\cos m\\\\theta_i \\\\end{pmatrix}\\\\right)_{i=1}^{d/2}",
              description: "将查询 (Query) 和键 (Key) 向量按二维子空间旋转，使得内积仅依赖于相对位移 m - n。"
            },
            {
              name: "Autoregressive Cross-Entropy Loss",
              latex: "\\\\mathcal{L}_{\\\\text{LM}}(\\\\theta) = -\\\\frac{1}{T}\\\\sum_{t=1}^T \\\\log P_\\\\theta(w_t \\\\mid w_1, \\\\dots, w_{t-1})",
              description: "标准自回归交叉熵对数似然损失函数，驱动模型学习长序列因果推断。"
            }
          ],
          theory_code_mapping: [
            { symbol: "\\\\mathbf{R}_{\\\\Theta, m}^d", code_variable: "apply_rotary_emb(x, freqs_cis)", math_meaning: "复数旋转位置编码算子" },
            { symbol: "\\\\mathcal{L}_{\\\\text{LM}}", code_variable: "F.cross_entropy(logits, targets)", math_meaning: "自回归因果语言模型损失" },
            { symbol: "w_i", code_variable: "tokens", math_meaning: "离散文本与多模态分词 ID 序列" }
          ]
        },
        pseudocode: \`# DeepMind Multimodal Architecture: \${title}
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
        return h + out\`,
        code_explanation: {
          zh: {
            overview: \`本论文《\${title}》聚焦大语言模型与多模态感知前沿，采用原生交错预训练与稀疏专家混合 (Sparse MoE) 架构。\`,
            key_steps: [
              "多模态统一分词：将文本、图像分块与音频频谱映射至共享连续向量空间。",
              "旋转位置编码 (RoPE)：跨越百万长上下文保持相对空间与时间距离的一致性。",
              "自回归解码与对齐：利用自回归交叉熵与人类偏好强化学习优化策略。"
            ],
            computational_flow: "Multimodal Tokens -> RoPE Self-Attention -> Sparse MoE Router -> Autoregressive Logits.",
            engineering_highlights: "Google DeepMind 原生全模态大模型基础设施技术栈与分布式并行优化实现。"
          },
          en: {
            overview: \`Research "\${title}" focuses on LLM & Multimodal frontiers with native interleaved pre-training and Sparse MoE.\`,
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
          tree_text: \`google-deepmind/acme/
├── acme/
│   ├── agents/jax/           # PPO, D4PG, SAC, R2D2 agent implementations
│   ├── datasets/             # Replay buffers & trajectory sampling
│   ├── environment_loop.py   # Step loop between agent and environment
│   └── wrappers/             # Atari & MuJoCo observation preprocessing
└── examples/                 # Distributed multi-process benchmarks\`,
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
              latex: "Q^*(s, a) = \\\\mathcal{R}(s, a) + \\\\gamma \\\\mathbb{E}_{s' \\\\sim \\\\mathcal{P}}[\\\\max_{a'} Q^*(s', a')]",
              description: "状态-动作价值函数的基础时序差分不动点方程。"
            },
            {
              name: "PPO Clipped Surrogate Objective",
              latex: "L^{\\\\text{CLIP}}(\\\\theta) = \\\\hat{\\\\mathbb{E}}_t \\\\left[ \\\\min(r_t(\\\\theta)\\\\hat{A}_t, \\\\; \\\\text{clip}(r_t(\\\\theta), 1-\\\\epsilon, 1+\\\\epsilon)\\\\hat{A}_t) \\\\right]",
              description: "限制单步更新幅度，防止重要性比率急剧发散导致策略崩溃。"
            }
          ],
          theory_code_mapping: [
            { symbol: "r_t(\\\\theta)", code_variable: "torch.exp(new_log_probs - old_log_probs)", math_meaning: "新旧策略动作概率似然比率" },
            { symbol: "\\\\hat{A}_t", code_variable: "compute_gae(rewards, values)", math_meaning: "广义优势估计 (GAE) 标量" },
            { symbol: "L^{\\\\text{CLIP}}", code_variable: "policy_loss", math_meaning: "截断代理策略损失函数" }
          ]
        },
        pseudocode: \`# DeepMind Reinforcement Learning: \${title}
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
        return policy_loss + 0.5 * value_loss\`,
        code_explanation: {
          zh: {
            overview: \`本论文《\${title}》归属于深度强化学习与多智能体博弈体系，采用策略梯度与博弈论自弈均衡优化。\`,
            key_steps: [
              "状态观测提取：提取高维动态环境观测，结合时序差分评估基线价值。",
              "广义优势估计 (GAE)：动态调节偏差与方差权衡，稳定长周期信用分配。",
              "截断信任域策略更新 (PPO/MCTS)：限制单步策略变动幅度，杜绝策略崩溃。"
            ],
            computational_flow: "Rollout Trajectory -> Compute GAE Advantages -> PPO Clipped Surrogate Loss -> Parameter Sync.",
            engineering_highlights: "传承自 AlphaStar、AlphaZero 与 OpenSpiel 的大规模多智能体博弈分布式训练架构。"
          },
          en: {
            overview: \`Research "\${title}" advances deep reinforcement learning and multi-agent game-theoretic equilibrium.\`,
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
          tree_text: \`google-deepmind/open_x_embodiment/
├── oxe_envlogger/            # High-frequency multi-modal robotic logger
├── models/
│   ├── transformer.py        # Vision-Language-Action backbone
│   ├── tokenizers.py         # 6-DoF continuous action discretization
│   └── cross_embodiment.py   # Multi-embodiment normalization modules
└── evaluation/               # Real-world robotic arm evaluation suites\`,
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
              latex: "\\\\mathcal{L}_{\\\\text{VLA}}(\\\\theta) = -\\\\sum_{t=1}^T \\\\sum_{d=1}^D \\\\log P_\\\\theta(a_{t,d} \\\\mid I_{1:t}, \\\\text{Instruction})",
              description: "在人类演示或自监督专家轨迹上最大化离散动作分词的条件似然。"
            }
          ],
          theory_code_mapping: [
            { symbol: "I_{1:t}", code_variable: "camera_frames", math_meaning: "环境第三视角与机械臂腕部相机多帧序列" },
            { symbol: "a_{t,d}", code_variable: "logits", math_meaning: "6-DoF 关节空间与夹爪离散动作预测" },
            { symbol: "\\\\mathcal{L}_{\\\\text{VLA}}", code_variable: "F.cross_entropy(logits, target_bins)", math_meaning: "离散动作分箱交叉熵损失" }
          ]
        },
        pseudocode: \`# DeepMind Embodied AI & Robotics: \${title}
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
        return logits\`,
        code_explanation: {
          zh: {
            overview: \`本论文《\${title}》聚焦具身智能与物理世界交互，构建视觉-语言-动作 (VLA) 闭环控制系统。\`,
            key_steps: [
              "多相机视觉输入融合：融合机载腕部相机与全景第三视角多帧图像。",
              "离散动作分词：将三维空间末端位移与旋转欧拉角映射为高分辨率控制离散分箱。",
              "实时闭环控制：在物理硬件上以 3Hz~100Hz 高频响应执行亚厘米级精准抓取与操作。"
            ],
            computational_flow: "Camera Stream + Natural Language -> VLA Cross-Attention -> Discretized Action Logits -> Robot Actuator.",
            engineering_highlights: "基于 Open X-Embodiment 跨机体多任务数据集与 RT 机器人变换器工业级落地标准。"
          },
          en: {
            overview: \`Research "\${title}" advances Embodied AI and physical world manipulation via closed-loop VLA control.\`,
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
          tree_text: \`google-deepmind/alphafold/
├── alphafold/
│   ├── common/               # Residue constants, torsion angles & PDB parsing
│   ├── data/                 # MSA search pipelines (JackHMMER / HHblits)
│   ├── model/
│   │   ├── modules.py        # Evoformer triangular self-attention
│   │   ├── geometry.py       # SE(3) Rigid3D Euclidean group operations
│   │   └── structure_module.py# Invariant Point Attention & 3D coordinate updates
│   └── relax/                # OpenMM Amber force-field stereochemical relaxation
└── run_alphafold.py          # Complete end-to-end structure prediction entry\`,
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
              latex: "\\\\mathcal{L}_{\\\\text{FAPE}} = \\\\frac{1}{N_{\\\\text{frames}} N_{\\\\text{atoms}}} \\\\sum_{i,j} \\\\min\\\\left( \\\\| T_i^{-1} \\\\vec{x}_j - (T_i^{\\\\text{true}})^{-1} \\\\vec{x}_j^{\\\\text{true}} \\\\|, \\\\; d_{\\\\text{clamp}} \\\\right)",
              description: "在局部刚体坐标系下对齐三维原子位置误差，天然免疫全局平移与旋转偏差。"
            }
          ],
          theory_code_mapping: [
            { symbol: "T_i = (R_i, \\\\vec{t}_i)", code_variable: "frames_3d", math_meaning: "各残基主干的三维刚体旋转矩阵与平移矢量" },
            { symbol: "z_{ij}", code_variable: "pair_repr", math_meaning: "氨基酸残基对的演化关联与空间距离几何张量" },
            { symbol: "\\\\mathcal{L}_{\\\\text{FAPE}}", code_variable: "fape_loss", math_meaning: "局部刚体坐标系下的原子对齐误差" }
          ]
        },
        pseudocode: \`# DeepMind AI for Science & Structural Biology: \${title}
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
        return updated_frames, atom_embeddings\`,
        code_explanation: {
          zh: {
            overview: \`本论文《\${title}》属于科学智能 (AI for Science) 领域，融合生物分子几何图神经网络与三维结构演化模型。\`,
            key_steps: [
              "分子空间几何图构建：以原子或氨基酸残基为图节点，以三维欧几里得距离与成键关系为图边缘。",
              "SE(3) 刚体欧几里得对称性：保证分子在三维空间任意旋转与平移下物理规律完全不变。",
              "结构预测与亲和力评估：端到端预测生物大分子空间折叠构象及配体对接能量。"
            ],
            computational_flow: "Sequence / Formula -> Geometric Graph -> Pairformer & IPA -> 3D Coordinates & Confidence Score.",
            engineering_highlights: "继承 AlphaFold 2 与 AlphaFold 3 全原子模拟范式，推动计算生物学从经验拟合走向精确预测。"
          },
          en: {
            overview: \`Research "\${title}" advances AI for Science, coupling molecular graph Transformers with 3D structural physics.\`,
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
          tree_text: \`google-deepmind/alphageometry/
├── alphageometry/
│   ├── ddar.py               # Deductive Database & Algebraic Reasoning engine
│   ├── graph.py              # Geometric dependency DAG & constraint checker
│   ├── lm_inference.py       # Neural tactic generator for auxiliary constructions
│   └── beam_search.py        # Hybrid neuro-symbolic proof search loop
└── run.py                    # Certified proof generation for IMO geometry problems\`,
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
              latex: "\\\\mathcal{S}_{k+1} = \\\\mathrm{Closure}_{\\\\text{DD+AR}}\\\\left( \\\\mathcal{S}_k \\\\cup \\\\{ \\\\text{AuxPoint}_k \\\\} \\\\right)",
              description: "基于当前几何图状态，在添加神经直觉生成的辅助构造点后计算符号演绎闭包。"
            }
          ],
          theory_code_mapping: [
            { symbol: "\\\\mathcal{S}_k", code_variable: "ddar.state", math_meaning: "当前已知几何约束、线面平行与共圆定理集合" },
            { symbol: "\\\\text{AuxPoint}", code_variable: "candidate_tactics", math_meaning: "神经网络语言模型直觉生成的辅助线构造点" },
            { symbol: "\\\\mathrm{Closure}", code_variable: "kernel.apply_tactic()", math_meaning: "形式化演绎引擎确定性定理推导" }
          ]
        },
        pseudocode: \`# DeepMind Math & Algorithmic Discovery: \${title}
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
        return None\`,
        code_explanation: {
          zh: {
            overview: \`本论文《\${title}》聚焦数学奥林匹克证明与底层算法发现，结合神经直觉与形式化逻辑验证。\`,
            key_steps: [
              "形式化定理表述：将自然语言命题精确转换为 Lean 4 / Isabelle 等形式化数学系统语言。",
              "树搜索引导推导：利用深度神经网络评估推演状态价值，挑选最有希望的数学战术 (Tactics)。",
              "逻辑内核验证：每一步证明通过确定性编译器内核严格校验，保证结论 100% 严密可信。"
            ],
            computational_flow: "Mathematical Problem -> Lean 4 Formal Code -> Neural MCTS Proof Search -> Kernel Certification.",
            engineering_highlights: "融合 AlphaGeometry 与 AlphaProof 技术架构，在数学与基础算法优化领域消除大模型幻觉。"
          },
          en: {
            overview: \`Research "\${title}" couples neural intuition with formal theorem verification (Lean 4) for mathematics.\`,
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
          tree_text: \`google-deepmind/evals/
├── safety_evals/             # Autonomous replication & cyber capability audits
├── sandbagging/              # Covert scheming & strategic underperformance detection
├── redteaming/               # Automated multi-turn jailbreak and refusal harnesses
└── sae_probes/               # Sparse autoencoder monosemantic feature extractors\`,
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
              latex: "\\\\mathcal{L}_{\\\\text{SAE}} = \\\\| x - W_{\\\\text{dec}} f(x) \\\\|_2^2 + \\\\lambda \\\\| f(x) \\\\|_1, \\\\quad f(x) = \\\\mathrm{ReLU}(W_{\\\\text{enc}} x + b_{\\\\text{enc}})",
              description: "在保持残差流激活高重构保真度的同时，利用 L1 正则迫使特征字典极度稀疏化。"
            }
          ],
          theory_code_mapping: [
            { symbol: "f(x)", code_variable: "feature_activations", math_meaning: "解聚得到的稀疏单语义安全特征向量" },
            { symbol: "\\\\| x - \\\\hat{x} \\\\|_2^2", code_variable: "recon_loss", math_meaning: "残差流重构均方误差损失" },
            { symbol: "\\\\lambda \\\\| f \\\\|_1", code_variable: "sparsity_loss", math_meaning: "单语义性 L1 稀疏约束惩罚" }
          ]
        },
        pseudocode: \`# DeepMind Frontier Safety & Alignment: \${title}
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
        return feature_activations, recon_loss + sparsity_loss\`,
        code_explanation: {
          zh: {
            overview: \`本论文《\${title}》致力于前沿超级对齐、机械可解释性与前沿安全防御，构建可审计的可信大模型体系。\`,
            key_steps: [
              "稀疏自编码器 (SAE) 特征解聚：将神经网络神经元的多义叠加解聚为单语义可解释特征字典。",
              "潜意识欺骗与装蠢探测：针对长链推理中的沙盒逃逸、后门休眠与对齐漂移进行探针审计。",
              "自动化红队对抗评估：构建自动化红蓝对抗仿真环境，全方位测试安全红线鲁棒性。"
            ],
            computational_flow: "Hidden Activations -> Sparse Autoencoder -> Monosemantic Feature Probes -> Safety Guardrail Gating.",
            engineering_highlights: "Google DeepMind 前沿安全与对齐研究基础设施标准，支撑可信人工智能国际规范。"
          },
          en: {
            overview: \`Research "\${title}" addresses frontier safety, mechanistic interpretability, and superalignment defense.\`,
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
}`;

// Replace getDomainPseudocodeAndExplanation
const startMarker = 'function getDomainPseudocodeAndExplanation(pub: PublicationItem, _isZh?: boolean): {';
const endMarker = 'function renderLibraryCards() {';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find start or end marker for getDomainPseudocodeAndExplanation');
  process.exit(1);
}

content = content.substring(0, startIndex) + newDomainFunc + '\n\n' + content.substring(endIndex);

// Update openDrawerForPublication synthesizedNode
const oldSyn = `    github_url: domainCode.github_url,
    pseudocode: domainCode.pseudocode,
    code_explanation: domainCode.code_explanation,`;

const newSyn = `    github_url: domainCode.github_url,
    deepwiki_url: domainCode.deepwiki_url,
    repo_structure: domainCode.repo_structure,
    theory_explanation: domainCode.theory_explanation,
    pseudocode: domainCode.pseudocode,
    code_explanation: domainCode.code_explanation,`;

content = content.replace(oldSyn, newSyn);

// Add fullscreen & anchor navigation bindings
const oldCloseBinding = `  // Close Drawer Button & Backdrop
  dom.btnCloseDrawer.onclick = () => clearSelection();
  dom.drawerBackdrop.onclick = () => clearSelection();`;

const newCloseBinding = `  // Close Drawer Button & Backdrop
  dom.btnCloseDrawer.onclick = () => clearSelection();
  dom.drawerBackdrop.onclick = () => clearSelection();

  // Fullscreen Workbench Toggle Button
  if (dom.btnToggleFullscreen) {
    dom.btnToggleFullscreen.onclick = () => {
      const isNowFullscreen = dom.drawer.classList.toggle('is-fullscreen');
      const dict = I18N[state.lang];
      if (dom.labelToggleFullscreen) {
        dom.labelToggleFullscreen.textContent = isNowFullscreen ? dict.toggle_windowed : dict.toggle_fullscreen;
      }
    };
  }

  // Workbench Anchor Navigation Buttons
  if (dom.workbenchAnchorNav) {
    dom.workbenchAnchorNav.querySelectorAll('.anchor-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        if (!targetId) return;
        const targetElem = document.getElementById(targetId);
        if (targetElem && dom.workbenchScrollBody) {
          const elemTop = targetElem.offsetTop - 15;
          dom.workbenchScrollBody.scrollTo({ top: elemTop, behavior: 'smooth' });

          dom.workbenchAnchorNav.querySelectorAll('.anchor-nav-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    });
  }`;

content = content.replace(oldCloseBinding, newCloseBinding);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully updated frontend/show_result.ts');
