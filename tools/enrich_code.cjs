// tools/enrich_code.cjs
// Enriches data/graph_data.json with GitHub URLs, core pseudocode, and auxiliary explanations.

const fs = require('fs');
const path = require('path');

const CODE_DATA = {
  "dqn_2013": {
    github_url: "https://github.com/google-deepmind/dqn",
    pseudocode: `# Deep Q-Learning with Experience Replay (Mnih et al. NIPS 2013)
import torch
import torch.nn as nn
import torch.nn.functional as F
import random

class DQNAgent:
    def __init__(self, state_dim, action_dim, gamma=0.99, lr=1e-4):
        self.q_net = nn.Sequential(
            nn.Conv2d(4, 16, kernel_size=8, stride=4), nn.ReLU(),
            nn.Conv2d(16, 32, kernel_size=4, stride=2), nn.ReLU(),
            nn.Flatten(),
            nn.Linear(32 * 9 * 9, 256), nn.ReLU(),
            nn.Linear(256, action_dim)
        )
        self.replay_buffer = []  # Store transitions (s, a, r, s_next, done)
        self.optimizer = torch.optim.RMSprop(self.q_net.parameters(), lr=lr)
        self.gamma = gamma

    def select_action(self, state, epsilon):
        if random.random() < epsilon:
            return random.randint(0, self.action_dim - 1)
        with torch.no_grad():
            return self.q_net(state.unsqueeze(0)).argmax(dim=1).item()

    def train_step(self, batch_size=32):
        if len(self.replay_buffer) < batch_size:
            return
        batch = random.sample(self.replay_buffer, batch_size)
        s, a, r, s_next, done = zip(*batch)
        
        # Current Q value Q(s, a; theta)
        q_eval = self.q_net(torch.stack(s)).gather(1, torch.tensor(a).unsqueeze(1)).squeeze(1)
        
        # TD Target: y = r + gamma * max_a' Q(s', a'; theta)
        with torch.no_grad():
            q_next = self.q_net(torch.stack(s_next)).max(dim=1)[0]
            y = torch.tensor(r) + (1.0 - torch.tensor(done, dtype=torch.float32)) * self.gamma * q_next
            
        loss = F.mse_loss(q_eval, y)
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()`,
    explanation: {
      zh: {
        overview: "端到端结合高维卷积与强化学习，首次实现直接从原始游戏屏幕像素（连续 4 帧 84x84）学习超人类控制策略。",
        key_steps: [
          "状态表征：将连续 4 帧灰度图像堆叠为 4 通道张量输入卷积层，有效感知动作速度与运动方向。",
          "经验回放机制 (Experience Replay)：将转移样本 (s, a, r, s', done) 存入百万级缓冲区，随机小批量均匀抽取，彻底破除时序自相关性。",
          "时序差分更新 (TD-Learning)：通过贝尔曼最优方程实时计算 TD Target 标量 y，最小化预测 Q 值与目标值之间的均方误差损失。"
        ],
        computational_flow: "Input: (Batch, 4, 84, 84) -> Conv2D(stride=4) -> Conv2D(stride=2) -> Linear(256) -> Q-Values(Batch, Action_Dim) -> TD Loss & RMSprop Update.",
        engineering_highlights: "首次证明深度神经网络作为非线性函数逼近器在强化学习中的可行性，通过 Experience Replay 解决了强化学习数据非独立同分布 (Non-IID) 的训练发散致命难题。"
      },
      en: {
        overview: "End-to-end integration of deep convolutional networks and Q-learning, mastering Atari directly from raw pixel frames without manual feature engineering.",
        key_steps: [
          "State Representation: Stacks 4 consecutive grayscale frames (4x84x84) to capture velocity and dynamic motion.",
          "Experience Replay: Stores transitions into a million-capacity cyclic buffer and samples uniformly to eliminate temporal correlation.",
          "TD Bellman Update: Minimizes MSE between Q(s, a; theta) and Bellman target y = r + gamma * max Q(s', a')."
        ],
        computational_flow: "Input: (Batch, 4, 84, 84) -> Conv2D -> Conv2D -> Dense(256) -> Q(s, a) -> Huber/MSE loss -> Backpropagation.",
        engineering_highlights: "Overcame the notorious instability of non-linear function approximation in RL via random mini-batch sampling from replay memory."
      }
    }
  },

  "nature_dqn_2015": {
    github_url: "https://github.com/google-deepmind/dqn",
    pseudocode: `# Nature DQN with Periodic Target Network (Mnih et al. Nature 2015)
import torch
import torch.nn as nn
import torch.nn.functional as F

class NatureDQNAgent:
    def __init__(self, model_fn, target_sync_interval=10000, gamma=0.99):
        self.q_net = model_fn()         # Online network: theta
        self.target_net = model_fn()    # Target network: theta_minus
        self.target_net.load_state_dict(self.q_net.state_dict())
        self.target_sync_interval = target_sync_interval
        self.step_counter = 0
        self.gamma = gamma

    def update(self, s, a, r, s_next, done, optimizer):
        # 1. Forward pass on online network for active Q-values
        q_pred = self.q_net(s).gather(1, a.unsqueeze(1)).squeeze(1)

        # 2. Compute Bellman Target using frozen target network
        with torch.no_grad():
            q_next_max = self.target_net(s_next).max(dim=1)[0]
            target_y = r + (1.0 - done) * self.gamma * q_next_max

        # 3. Robust Smooth L1 Loss (Huber Loss) to avoid gradient explosion
        loss = F.smooth_l1_loss(q_pred, target_y)

        optimizer.zero_grad()
        loss.backward()
        nn.utils.clip_grad_norm_(self.q_net.parameters(), max_norm=10.0)
        optimizer.step()

        # 4. Periodically synchronize weights: theta_minus <- theta
        self.step_counter += 1
        if self.step_counter % self.target_sync_interval == 0:
            self.target_net.load_state_dict(self.q_net.state_dict())`,
    explanation: {
      zh: {
        overview: "在 2013 年初版 DQN 基础上引入参数冻结的独立目标网络 (Target Network) 与 Huber 损失，登顶 Nature 封面并在 49 款 Atari 游戏中系统性达到人类水平。",
        key_steps: [
          "双网络解耦：维持实时更新的在线网络 Q(s, a; theta) 与周期性同步的目标网络 Q_target(s, a; theta^-)。",
          "消除追赶目标不稳定性：使得目标值计算在固定步长（如每 10,000 步）内保持稳定，阻断学习目标与预测值之间的恶性反馈回路。",
          "梯度截断与 Huber 损失：采用 Smooth L1 替代 MSE，在误差较大时退化为线性惩罚，抑制极端奖赏带来的梯度冲击。"
        ],
        computational_flow: "Online Q(s, a; theta) vs Frozen Target Q(s', a'; theta^-) -> Smooth L1 Loss -> Gradient Clip(10.0) -> Periodic theta^- sync.",
        engineering_highlights: "确立了无模型深度强化学习通用评价协议（同一组超参数在 49 个完全不同的环境中独立评测），奠定现代强化学习工业基石。"
      },
      en: {
        overview: "Introduced frozen target network and Huber loss to stabilize Q-learning, achieving human-level control across 49 Atari games on Nature cover.",
        key_steps: [
          "Dual Network Decoupling: Maintains online parameters theta and frozen target parameters theta^-.",
          "Stable TD Targets: Fixes target network for C steps (e.g. 10k steps) to eliminate moving target divergence.",
          "Smooth L1 Loss: Employs Huber loss with gradient clipping to insulate against extreme score fluctuations."
        ],
        computational_flow: "Forward Q(s) -> Frozen Q_target(s') -> Smooth L1 Loss -> Clip Gradients -> Step Optimizer -> Sync theta^- every C steps.",
        engineering_highlights: "Standardized modern benchmark protocol for deep RL, proving algorithmic generality without game-specific engineering."
      }
    }
  },

  "a3c_2016": {
    github_url: "https://github.com/google-deepmind/open_spiel",
    pseudocode: `# Asynchronous Advantage Actor-Critic (A3C - Mnih et al. ICML 2016)
import torch
import torch.nn as nn
import torch.nn.functional as F
import threading

class A3CWorker(threading.Thread):
    def __init__(self, global_model, optimizer, env_creator, gamma=0.99, t_max=20):
        super().__init__()
        self.global_model = global_model
        self.local_model = ActorCriticNetwork()
        self.env = env_creator()
        self.gamma, self.t_max = gamma, t_max

    def run(self):
        s = self.env.reset()
        while not stop_signal:
            self.local_model.load_state_dict(self.global_model.state_dict())
            states, actions, rewards = [], [], []

            for _ in range(self.t_max):
                pi_logits, val = self.local_model(s)
                dist = torch.distributions.Categorical(logits=pi_logits)
                a = dist.sample()
                s_next, r, done, _ = self.env.step(a.item())
                states.append(s); actions.append(a); rewards.append(r)
                s = s_next
                if done: s = self.env.reset(); break

            # Generalized Advantage Estimation & n-step cumulative return
            R = 0 if done else self.local_model(s)[1].item()
            policy_loss, value_loss, entropy_loss = 0, 0, 0
            for st, act, rw in reversed(list(zip(states, actions, rewards))):
                R = rw + self.gamma * R
                pi_logits, v = self.local_model(st)
                advantage = R - v.item()
                log_prob = F.log_softmax(pi_logits, dim=-1)[act]
                
                policy_loss -= log_prob * advantage
                value_loss += 0.5 * (R - v.squeeze()) ** 2
                entropy = -(F.softmax(pi_logits, dim=-1) * F.log_softmax(pi_logits, dim=-1)).sum()
                entropy_loss -= 0.01 * entropy

            # Push Hogwild-style async gradients to global model
            total_loss = policy_loss + 0.5 * value_loss + entropy_loss
            self.local_model.zero_grad()
            total_loss.backward()
            for lp, gp in zip(self.local_model.parameters(), self.global_model.parameters()):
                gp._grad = lp.grad
            self.optimizer.step()`,
    explanation: {
      zh: {
        overview: "异步多线程 Actor-Critic 范式，无需显存庞大的经验回放池，仅利用标准 CPU 多线程并行环境采样即实现超高效稳定收敛。",
        key_steps: [
          "多线程并行探索：每个工作线程维护独立的仿真环境与局部模型参数，在状态空间中并发探索不同子区域。",
          "优势函数驱动：结合策略网络 (Actor) 预测动作概率分布与价值网络 (Critic) 预测状态基线，利用 Advantage = R - V(s) 减小方差。",
          "Hogwild! 异步梯度推送：局部工作线程反向传播计算梯度后直接异步写入共享全局网络参数，无需显式线程锁。"
        ],
        computational_flow: "Local Env -> n-step rollout -> Policy Loss + Critic Value Loss + Entropy Regularization -> Asynchronous Global Gradient Push.",
        engineering_highlights: "彻底摆脱经验回放池对内存与显存的硬性依赖，将单机多核 CPU 的训练速度提升数十倍，成为工业界并行强化的标准先驱。"
      },
      en: {
        overview: "Asynchronous multi-threaded Actor-Critic algorithm without replay memory, achieving rapid and stable training on standard multi-core CPUs.",
        key_steps: [
          "Asynchronous Exploration: Parallel threads explore different trajectories concurrently to naturally decorrelate training data.",
          "Advantage Estimation: Combines policy logits with critic state-value baselines (Advantage = R - V(s)) to minimize gradient variance.",
          "Lock-Free Gradient Updates: Workers compute local gradients and push them asynchronously into shared global parameters via Hogwild! updates."
        ],
        computational_flow: "Local env rollout -> n-step return computation -> Policy & Value Loss -> Async update to shared model.",
        engineering_highlights: "Proved that multi-threaded asynchronous experience collection replaces replay buffers while drastically lowering hardware barriers."
      }
    }
  },

  "wavenet_2016": {
    github_url: "https://github.com/ibab/tensorflow-wavenet",
    pseudocode: `# WaveNet: Dilated Causal Convolutional Audio Generator (van den Oord et al. 2016)
import torch
import torch.nn as nn
import torch.nn.functional as F

class WaveNetResidualLayer(nn.Module):
    def __init__(self, channels, dilation):
        super().__init__()
        # Dilated causal conv: padding = dilation ensures causal temporal receptive field
        self.dilated_conv = nn.Conv1d(channels, 2 * channels, kernel_size=2, dilation=dilation, padding=dilation)
        self.res_conv = nn.Conv1d(channels, channels, kernel_size=1)
        self.skip_conv = nn.Conv1d(channels, channels, kernel_size=1)

    def forward(self, x):
        # Trim causal overflow at the end
        conv_out = self.dilated_conv(x)[:, :, :x.shape[-1]]
        # Gated Activation Unit: tanh(filter) * sigmoid(gate)
        f, g = torch.chunk(conv_out, 2, dim=1)
        z = torch.tanh(f) * torch.sigmoid(g)
        
        res = self.res_conv(z) + x
        skip = self.skip_conv(z)
        return res, skip

class WaveNet(nn.Module):
    def __init__(self, in_channels=256, residual_channels=64, num_layers=30):
        super().__init__()
        self.start_conv = nn.Conv1d(in_channels, residual_channels, kernel_size=1)
        self.layers = nn.ModuleList([
            WaveNetResidualLayer(residual_channels, dilation=2 ** (i % 10))
            for i in range(num_layers)
        ])
        self.end_conv = nn.Sequential(
            nn.ReLU(), nn.Conv1d(residual_channels, residual_channels, 1),
            nn.ReLU(), nn.Conv1d(residual_channels, 256, 1)
        )

    def forward(self, x_onehot):
        h = self.start_conv(x_onehot)
        skip_total = 0
        for layer in self.layers:
            h, skip = layer(h)
            skip_total = skip_total + skip
        return self.end_conv(skip_total)  # Logits over 256 mu-law quantized bins`,
    explanation: {
      zh: {
        overview: "革命性的自回归原始音频波形生成模型，利用扩张因果卷积 (Dilated Causal Conv) 获得数千采样点的感受野，重塑全球语音合成 (TTS)。",
        key_steps: [
          "因果卷积 (Causal Convolution)：严格保证音频生成时间步 t 仅依赖于历史采样点 t-1, t-2...，彻底杜绝未来信息泄露。",
          "指数膨胀感受野 (Dilation)：层间卷积空洞率按 2^0, 2^1, ... 2^9 几何级数指数递增，在极少层数下覆盖数十毫秒长程声学结构。",
          "门控激活单元 (Gated Activation)：模仿 LSTM 的 tanh(filter) * sigmoid(gate) 结构，精准过滤特征信息并传递跳跃连接 (Skip Connections)。"
        ],
        computational_flow: "Mu-law 256 Bins -> 30 Stacks of Dilated Conv (Dilation 1..512) -> Gated Activation -> Skip Sum -> Softmax Next-Sample Logits.",
        engineering_highlights: "首次证明深度自回归模型能够直接生成 16kHz 高保真原始音频波形，被全量部署至 Google Assistant 与全线语音产品中。"
      },
      en: {
        overview: "Pioneering generative raw waveform model using dilated causal convolutions, bridging the gap with human-level speech synthesis.",
        key_steps: [
          "Causal Convolutions: Enforces temporal ordering so prediction at step t depends only on historical samples <= t-1.",
          "Exponential Dilations: Dilation doubles per layer (1, 2, 4..512), exponentially expanding receptive field to capture long-range audio coherence.",
          "Gated Activation Units: Utilizes tanh(filter) * sigmoid(gate) formulation combined with dense skip connections."
        ],
        computational_flow: "Raw 16kHz audio (mu-law 256) -> Stacked dilated residual layers -> Summed skips -> 256-way categorical distribution.",
        engineering_highlights: "Replaced decades-old concatenative and parametric speech synthesis, powering Google Assistant globally."
      }
    }
  },

  "alphago_2016": {
    github_url: "https://github.com/google-deepmind/open_spiel",
    pseudocode: `# AlphaGo: MCTS with Deep Policy & Value Networks (Silver et al. Nature 2016)
import math

class AlphaGoNode:
    def __init__(self, state, prior_p=1.0):
        self.state = state
        self.prior_p = prior_p
        self.visit_count = 0
        self.total_value = 0.0
        self.children = {}  # action -> AlphaGoNode

class AlphaGoMCTS:
    def __init__(self, policy_net, value_net, rollout_policy, c_puct=1.5, mix_lambda=0.5):
        self.p_net = policy_net        # Policy Network P(a|s)
        self.v_net = value_net        # Value Network V(s)
        self.rollout_p = rollout_policy# Fast lightweight policy
        self.c_puct = c_puct
        self.mix_lambda = mix_lambda

    def search(self, root_state, num_simulations=1600):
        root = AlphaGoNode(root_state)
        # Expand root with SL/RL policy network
        priors = self.p_net(root.state)
        for a, p in priors.items():
            root.children[a] = AlphaGoNode(root.state.apply(a), prior_p=p)

        for _ in range(num_simulations):
            node = root
            search_path = [node]

            # 1. Selection: Traverse using PUCT formula
            while node.children:
                total_N = sum(child.visit_count for child in node.children.values())
                best_action = max(node.children.keys(), key=lambda a: (
                    (node.children[a].total_value / (node.children[a].visit_count + 1e-5)) +
                    self.c_puct * node.children[a].prior_p * math.sqrt(total_N) / (1 + node.children[a].visit_count)
                ))
                node = node.children[best_action]
                search_path.append(node)

            # 2. Evaluation: Dual evaluation via Value Net and Fast Rollout
            v_net_eval = self.v_net(node.state)
            rollout_result = self.fast_rollout(node.state)
            leaf_eval = (1.0 - self.mix_lambda) * v_net_eval + self.mix_lambda * rollout_result

            # 3. Backup: Update visit counts and mean action value Q
            for n in search_path:
                n.visit_count += 1
                n.total_value += leaf_eval

        # Select most visited action in root
        return max(root.children.keys(), key=lambda a: root.children[a].visit_count)`,
    explanation: {
      zh: {
        overview: "深度卷积策略网络、价值网络与蒙特卡洛树搜索 (MCTS) 的划时代结合，击败围棋世界冠军职业九段李世石。",
        key_steps: [
          "落子先验剪枝 (Policy Network)：利用 13 层卷积策略网络输出落子概率，将 MCTS 每次搜索的候选项从几百种收缩至最优的少数几种。",
          "双源叶节点估值：创新性地将深度价值网络预测 V(s) 与轻量快速走子模拟 (Fast Rollout) 结果 z 按 50%/50% 混合，兼具深层格局直觉与战术验算。",
          "PUCT 树搜索平衡：综合行动价值 Q(s, a) 与结合访问频次的反比先验 U(s, a)，实现深度搜索与充分探索的精确平衡。"
        ],
        computational_flow: "Board 19x19 -> Policy Network (Breadth Pruning) + Value Network (Depth Evaluation) -> PUCT MCTS Loop -> Final Move.",
        engineering_highlights: "首次破解了被誉为人类智力博弈皇冠的围棋，通过异步分布式搜索机群在 10^170 浩瀚状态空间中实时做出超人类决策。"
      },
      en: {
        overview: "Landmark achievement combining deep policy/value networks with MCTS to defeat 18-time world Go champion Lee Sedol.",
        key_steps: [
          "Policy Network Pruning: Filters vast action space to top plausible moves via deep convolutional policy network.",
          "Hybrid Leaf Evaluation: Balances deep value network predictions V(s) with fast rollout simulation outcomes z.",
          "PUCT Exploration: Dynamically weights exploitation (average Q) against exploration scaled by prior probability P(s, a)."
        ],
        computational_flow: "19x19 State -> Policy Net (Move priors) + Value Net (Position winrate) -> 1600 MCTS passes -> Action selection.",
        engineering_highlights: "Demonstrated intuition and strategic reasoning in full-information games with state space complexity surpassing atoms in universe."
      }
    }
  },

  "rainbow_2017": {
    github_url: "https://github.com/google-deepmind/dopamine",
    pseudocode: `# Rainbow: Integrated Deep Reinforcement Learning (Hessel et al. AAAI 2018)
import torch
import torch.nn as nn
import torch.nn.functional as F

class RainbowNetwork(nn.Module):
    def __init__(self, in_channels=4, num_actions=18, num_atoms=51, v_min=-10.0, v_max=10.0):
        super().__init__()
        self.num_actions = num_actions
        self.num_atoms = num_atoms
        self.register_buffer("support", torch.linspace(v_min, v_max, num_atoms))
        
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, 32, 8, 4), nn.ReLU(),
            nn.Conv2d(32, 64, 4, 2), nn.ReLU(),
            nn.Conv2d(64, 64, 3, 1), nn.ReLU(), nn.Flatten()
        )
        # Dueling & Noisy Factorized Dense Layers (NoisyNet for exploration)
        self.fc_value = NoisyLinear(64 * 7 * 7, 512)
        self.value_head = NoisyLinear(512, num_atoms)
        self.fc_adv = NoisyLinear(64 * 7 * 7, 512)
        self.adv_head = NoisyLinear(512, num_actions * num_atoms)

    def forward(self, x):
        feat = self.conv(x)
        val = self.value_head(F.relu(self.fc_value(feat))).view(-1, 1, self.num_atoms)
        adv = self.adv_head(F.relu(self.fc_adv(feat))).view(-1, self.num_actions, self.num_atoms)
        # Dueling aggregation over return distribution atoms
        q_atoms = val + adv - adv.mean(dim=1, keepdim=True)
        prob = F.softmax(q_atoms, dim=-1)
        return prob # Shape: [Batch, Actions, Num_Atoms]

    def get_q_values(self, x):
        prob = self.forward(x)
        return torch.sum(prob * self.support, dim=-1) # Dot product expectation`,
    explanation: {
      zh: {
        overview: "集大成之作：系统融合 DQN 六大独立技术革新（Double Q, Prioritized Replay, Dueling, Multi-step, Distributional RL, Noisy Nets），创下 Atari 强化学习性能新纪录。",
        key_steps: [
          "分布式回报 (Distributional C51)：不再预测单一期望标量 Q，而是建模价值回报在 51 个原子离散分布上的完整概率分布。",
          "对决网络 (Dueling Networks)：将特征分离为状态价值 V(s) 与动作优势 A(s, a)，提升不同动作间学习效率。",
          "噪声网络与优先级采样：利用参数自适应高斯噪声 NoisyLinear 替代粗糙的 epsilon-greedy 探索，结合 Prioritized Replay 加权重要样本。"
        ],
        computational_flow: "Screen -> ConvNet -> Dueling Value & Advantage Branches (NoisyLinear) -> 51 Atoms Return Distribution -> KL Divergence Loss.",
        engineering_highlights: "通过消融实验严格揭示各项改进之间的正交协同作用，为后续深度强化学习研究提供了统一的黄金基线套件 (Dopamine)。"
      },
      en: {
        overview: "Masterful integration of 6 key DQN extensions (Double, PER, Dueling, Multi-step, C51, NoisyNets), achieving state-of-the-art Atari performance.",
        key_steps: [
          "Distributional C51: Represents Q-values as categorical probability distributions over 51 return atoms.",
          "Dueling Architecture: Disentangles representation into state value V(s) and advantage A(s, a).",
          "Noisy Networks & Priority: Replaces epsilon-greedy exploration with parametric noise while prioritizing salient experiences via PER."
        ],
        computational_flow: "State -> Conv -> Dueling Noisy Heads -> Categorical Atoms Distribution -> Cross-Entropy with projected Bellman distribution.",
        engineering_highlights: "Established the authoritative benchmark for discrete RL that served as the foundation of Google's Dopamine open-source framework."
      }
    }
  },

  "alphago_zero_2017": {
    github_url: "https://github.com/google-deepmind/open_spiel",
    pseudocode: `# AlphaGo Zero: Pure Self-Play Reinforcement Learning (Silver et al. Nature 2017)
import torch
import torch.nn as nn
import torch.nn.functional as F

class DualResNet(nn.Module):
    def __init__(self, num_blocks=20, num_actions=362):
        super().__init__()
        self.conv_in = nn.Conv2d(17, 256, kernel_size=3, padding=1)
        self.blocks = nn.ModuleList([ResidualBlock(256) for _ in range(num_blocks)])
        
        # Policy Head: outputs move probability vector p
        self.policy_head = nn.Sequential(
            nn.Conv2d(256, 2, 1), nn.BatchNorm2d(2), nn.ReLU(),
            nn.Flatten(), nn.Linear(2 * 19 * 19, num_actions)
        )
        # Value Head: outputs scalar game outcome evaluation v in [-1, +1]
        self.value_head = nn.Sequential(
            nn.Conv2d(256, 1, 1), nn.BatchNorm2d(1), nn.ReLU(),
            nn.Flatten(), nn.Linear(19 * 19, 256), nn.ReLU(),
            nn.Linear(256, 1), nn.Tanh()
        )

    def forward(self, x):
        h = F.relu(self.conv_in(x))
        for block in self.blocks: h = block(h)
        p = self.policy_head(h)
        v = self.value_head(h)
        return p, v

def compute_zero_loss(model, states, mcts_pi, game_winner_z):
    # Loss: (z - v)^2 - pi^T * log(p) + c * ||theta||^2
    p_logits, v_pred = model(states)
    loss_v = F.mse_loss(v_pred.squeeze(), game_winner_z)
    loss_p = -torch.sum(mcts_pi * F.log_softmax(p_logits, dim=-1), dim=-1).mean()
    l2_reg = sum(torch.norm(param) ** 2 for param in model.parameters()) * 1e-4
    return loss_v + loss_p + l2_reg`,
    explanation: {
      zh: {
        overview: "完全零人类先验知识 (Tabula Rasa)，仅从围棋基本规则出发，通过纯粹自我对弈 (Self-Play) 在 3 天内超越打败李世石的 AlphaGo。",
        key_steps: [
          "单一双头残差网络 (Dual-Head ResNet)：淘汰分离的策略网络与价值网络，采用统一的深度残差网络同时输出落子先验概率 p 与终局胜率 v。",
          "MCTS 作为策略改进算子：MCTS 树搜索输出的访问频次分布 pi 作为更优策略目标，直接训练策略头拟合 pi；真实终局胜负 z 作为价值目标。",
          "彻底摒弃快速走子模拟 (Rollout-free)：完全依靠深度价值网络直接评估叶节点胜率，计算开销与方差大幅降低。"
        ],
        computational_flow: "Raw Board (17 planes) -> 20/40 Residual Blocks -> Dual Heads (p, v) -> MCTS Iteration -> Joint Policy-Value Loss Update.",
        engineering_highlights: "向世界证明了通用人工智能算法可以在无需任何人类专家数据和历史棋谱的情况下，从零自我进化出超越千百年来人类积累的全部智慧。"
      },
      en: {
        overview: "Trained tabula rasa without human supervision, surpassing original AlphaGo in 3 days using pure self-play RL.",
        key_steps: [
          "Single Dual-Head ResNet: Combines policy prior p and position evaluation v into a unified deep residual architecture.",
          "MCTS as Policy Improver: Self-play MCTS visit distribution pi acts as policy training target; final game result z trains value head.",
          "Rollout-Free Architecture: Eliminates heuristic rollout policies, relying strictly on neural value predictions at leaf nodes."
        ],
        computational_flow: "17-plane board state -> ResNet -> (p, v) -> Self-play search -> Joint loss L = (z - v)^2 - pi^T log(p) + c||w||^2.",
        engineering_highlights: "Proved that self-play reinforcement learning without human domain knowledge produces vastly superior strategies."
      }
    }
  },

  "alphazero_2017": {
    github_url: "https://github.com/google-deepmind/open_spiel",
    pseudocode: `# AlphaZero: General Self-Play Algorithm for Chess, Shogi and Go (Silver et al. Science 2018)
import math

class AlphaZeroGeneralSearch:
    def __init__(self, dual_network, c_puct=1.25, dirichlet_alpha=0.3, epsilon=0.25):
        self.net = dual_network
        self.c_puct = c_puct
        self.alpha = dirichlet_alpha
        self.eps = epsilon

    def run_mcts(self, state, num_simulations=800, is_root=True):
        root = Node(state)
        # Evaluate root node with dual network
        priors, v = self.net(state.to_tensor())
        priors = priors.detach().cpu().numpy()

        # Add Dirichlet noise at root for exploration during self-play
        if is_root:
            noise = np.random.dirichlet([self.alpha] * len(priors))
            priors = (1 - self.eps) * priors + self.eps * noise

        for action, p in state.get_legal_moves(priors):
            root.children[action] = Node(prior=p)

        for _ in range(num_simulations):
            node, path = self.select(root)
            if not node.state.is_terminal():
                p_leaf, v_leaf = self.net(node.state.to_tensor())
                self.expand(node, p_leaf)
            else:
                v_leaf = node.state.get_terminal_score()
            self.backpropagate(path, v_leaf)

        # Policy distribution proportional to visit counts: pi(a|s) ~ N(s, a)^(1/tau)
        visits = [root.children[a].visit_count for a in root.children]
        pi = [v / sum(visits) for v in visits]
        return pi`,
    explanation: {
      zh: {
        overview: "将 AlphaGo Zero 的纯自我对弈架构泛化为通用棋类算法，无需特定棋种启发式规则，仅凭棋盘规则 24 小时内横扫国际象棋、日本将棋与围棋三项顶级博弈。",
        key_steps: [
          "全通用博弈状态表示：统一为基础特征平面（历史棋子位置、行棋权、步数等），彻底去除一切棋种手工特征。",
          "狄利克雷噪声探索 (Dirichlet Noise)：在根节点先验概率中注入对称 Dirichlet 噪声，确保自我对弈探索覆盖所有合理分支。",
          "对称性与无转置表：在国际象棋等非旋转对称棋类中直接通过强化学习端到端自适应，彻底战胜长期统治国际象棋界的 Stockfish 传统剪枝引擎。"
        ],
        computational_flow: "Game Board -> General Dual-Head ResNet -> MCTS (PUCT + Dirichlet noise) -> Universal Self-Play Experience Buffer.",
        engineering_highlights: "发表于 Science 正刊，彻底消除了不同博弈游戏间的算法鸿沟，成为博弈强化学习领域的终极黄金通用范式。"
      },
      en: {
        overview: "Universal reinforcement learning algorithm mastering Chess, Shogi, and Go tabula rasa, defeating world champion engines like Stockfish.",
        key_steps: [
          "Universal Representation: Raw spatial board history without domain-specific evaluation heuristics or opening books.",
          "Dirichlet Exploration: Injects Dirichlet noise into root priors during self-play to guarantee broad tactical exploration.",
          "Generalized PUCT MCTS: Uses identical hyperparameters across completely different games to guide policy iteration."
        ],
        computational_flow: "Board state -> Neural Net (p, v) -> MCTS with Dirichlet exploration -> Move selection via visit count exponentiation.",
        engineering_highlights: "Published in Science, proving that a single generalized algorithm can discover deep strategic concepts across disparate game domains."
      }
    }
  },

  "alphafold1_2018": {
    github_url: "https://github.com/google-deepmind/alphafold/tree/alphafold_casp13",
    pseudocode: `# AlphaFold 1: CASP13 Co-evolutionary Distance & Angle Predictor (Senior et al. Nature 2020)
import torch
import torch.nn as nn
import torch.nn.functional as F

class DistogramResNet(nn.Module):
    def __init__(self, in_features=42, num_bins=64):
        super().__init__()
        # in_features represents MSA co-evolutionary features (e.g. Potts model covariance)
        self.stem = nn.Conv2d(in_features, 128, kernel_size=1)
        self.layers = nn.ModuleList([
            nn.Sequential(
                nn.Conv2d(128, 128, kernel_size=3, padding=1), nn.BatchNorm2d(128), nn.ELU(),
                nn.Conv2d(128, 128, kernel_size=3, padding=1), nn.BatchNorm2d(128)
            ) for _ in range(64) # 64-layer 2D ResNet
        ])
        # Output distogram bins: discretizing residue-residue distance d_ij in [2A, 22A]
        self.head_dist = nn.Conv2d(128, num_bins, kernel_size=1)

    def forward(self, msa_features_2d):
        # Shape: [Batch, In_Features, L, L]
        h = self.stem(msa_features_2d)
        for layer in self.layers:
            h = F.elu(h + layer(h))
        distogram_logits = self.head_dist(h)
        return distogram_logits # [Batch, Num_Bins, L, L]

def fold_by_gradient_descent(predicted_distogram, initial_coords_3d, steps=500, lr=1e-2):
    # Differentiable potential energy minimization
    coords = torch.nn.Parameter(initial_coords_3d)
    opt = torch.optim.LBFGS([coords], lr=lr)
    for _ in range(steps):
        def closure():
            opt.zero_grad()
            pairwise_dist = torch.cdist(coords, coords) # [L, L]
            potential_loss = compute_distogram_potential(pairwise_dist, predicted_distogram)
            potential_loss.backward()
            return potential_loss
        opt.step(closure)
    return coords`,
    explanation: {
      zh: {
        overview: "DeepMind 进军生物物理科学的破局之作（CASP13 冠军），首次将深度卷积神经网络应用于多序列比对 (MSA) 的共进化距离图预测。",
        key_steps: [
          "共进化特征提取：从蛋白质多序列比对中提取两两氨基酸之间的协方差统计量，反映空间距离受限下的保守突变关联。",
          "深层 2D 残差网络预测 Distogram：预测氨基酸对 (i, j) 之间的连续欧几里得距离分布概率（划分为 64 个离散距离区间）。",
          "梯度下降物理折叠：构造可微的分子势能函数 (Potential Function)，通过 L-BFGS 等梯度优化算法直接求解满足距离约束的三维坐标。"
        ],
        computational_flow: "FASTA Sequence -> MSA Alignment -> 2D Covariance Matrix (L x L) -> 64-layer 2D ResNet -> Distogram Probabilities -> L-BFGS 3D Folding.",
        engineering_highlights: "以无可争议的巨大优势斩获 CASP13 全球蛋白质结构预测大赛第一名，开创了 AI for Science (AI4S) 新纪元。"
      },
      en: {
        overview: "Won CASP13 by introducing deep 2D residual networks to predict inter-residue distance distributions from co-evolutionary MSAs.",
        key_steps: [
          "Co-evolution Extraction: Computes covariance matrices from Multiple Sequence Alignments (MSAs) capturing spatial proximity constraints.",
          "Distogram Modeling: Predicts discrete distance distribution bins between all residue pairs (i, j) using a 64-layer 2D ResNet.",
          "Gradient-Based Geometry Optimization: Translates predicted distograms into potential energy terms minimized via L-BFGS gradient descent."
        ],
        computational_flow: "Amino Sequence -> MSA Parsing -> Pairwise Co-evolution Features -> 2D ResNet -> Distogram -> 3D Coordinate Energy Minimization.",
        engineering_highlights: "Historic turning point in computational biology, conclusively demonstrating deep learning's superiority over traditional physics potentials."
      }
    }
  },

  "alphastar_2019": {
    github_url: "https://github.com/google-deepmind/alphastar",
    pseudocode: `# AlphaStar: Multi-Agent League Training for StarCraft II (Vinyals et al. Nature 2019)
import torch
import torch.nn as nn

class AlphaStarArchitecture(nn.Module):
    def __init__(self, map_channels=16, unit_dim=64, num_actions=564):
        super().__init__()
        # Spatial encoder for minimap and camera surface
        self.spatial_conv = nn.Sequential(
            nn.Conv2d(map_channels, 64, 3, padding=1), nn.ReLU(),
            nn.Conv2d(64, 128, 3, padding=1), nn.ReLU()
        )
        # Transformer unit encoder for variable-length unit list
        self.unit_transformer = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(d_model=unit_dim, nhead=4), num_layers=3
        )
        # Deep LSTM for long-term memory across 10,000+ game steps
        self.core_lstm = nn.LSTM(input_size=128 + unit_dim, hidden_size=384, num_layers=1)
        # Auto-regressive action head with Pointer Network
        self.action_type_head = nn.Linear(384, num_actions)
        self.delay_head = nn.Linear(384, 64)
        self.target_pointer = PointerNetwork(query_dim=384, key_dim=unit_dim)

    def forward(self, map_tensor, unit_tokens, lstm_state):
        spatial_emb = self.spatial_conv(map_tensor).mean(dim=[-2, -1])
        unit_emb = self.unit_transformer(unit_tokens).mean(dim=0)
        core_input = torch.cat([spatial_emb, unit_emb], dim=-1).unsqueeze(0)
        lstm_out, next_lstm = self.core_lstm(core_input, lstm_state)
        
        # Output structured multi-argument action
        act_type = self.action_type_head(lstm_out.squeeze(0))
        delay = self.delay_head(lstm_out.squeeze(0))
        target_unit_idx = self.target_pointer(lstm_out.squeeze(0), unit_tokens)
        return act_type, delay, target_unit_idx, next_lstm`,
    explanation: {
      zh: {
        overview: "在复杂非完全信息、万级时序步长、千级组合动作空间的《星际争霸 II》中，达到人类最高职业大师级 (Grandmaster) 水准。",
        key_steps: [
          "多智能体天梯联赛 (League Training)：设立主智能体 (Main Agent)、联赛剥削者 (League Exploiter) 与主剥削者，协同动态博弈避免纳什均衡循环陷阱。",
          "多模态异构表征编码：结合处理空间视角的 2D 卷积网、处理可变长作战单位列表的 Transformer 以及处理长周期的深度 LSTM 核心。",
          "UPGO (Unrealized Projections Off-Policy) 算法：针对超长时空步长自创解耦优势更新，保证极端稀疏动作下的安全策略梯度提升。"
        ],
        computational_flow: "Spatial Map + Variable Entity Tokens -> Conv2D + Unit Transformer -> Deep Core LSTM -> Pointer Network Action Arguments.",
        engineering_highlights: "突破了复杂现实世界经济系统模拟的理论瓶颈，首次在非完全信息即时战略游戏中全面战胜人类职业电竞选手。"
      },
      en: {
        overview: "Grandmaster-level player in StarCraft II, mastering partial observability and combinatorially complex continuous-action spaces.",
        key_steps: [
          "League Training: Multi-agent training mechanism pitting Main Agents against Specialized Exploiters to escape cycle non-transitivity.",
          "Heterogeneous Sensory Core: Couples spatial ConvNets, entity-list Transformers, and deep LSTMs to track macro/micro strategy over 10k steps.",
          "Structured Pointer Actions: Autoregressively selects action type, execution delay, and target entities via learned pointer networks."
        ],
        computational_flow: "Minimap + Entity sets -> Spatial Conv + Transformer -> Deep LSTM core -> Multi-head pointer action sampling -> UPGO update.",
        engineering_highlights: "Demonstrated superhuman decision-making under imperfect information and severe realtime latency constraints."
      }
    }
  },

  "muzero_2019": {
    github_url: "https://github.com/google-deepmind/open_spiel",
    pseudocode: `# MuZero: Model-Based RL in Latent Dynamics (Schrittwieser et al. Nature 2020)
import torch
import torch.nn as nn

class MuZeroModel(nn.Module):
    def __init__(self, obs_dim=4, action_dim=18, latent_dim=64):
        super().__init__()
        # 1. Representation function: s_0 = h(o_1, ..., o_t)
        self.representation = nn.Sequential(nn.Conv2d(obs_dim, latent_dim, 3, padding=1), nn.ReLU())
        # 2. Dynamics function: r, s_{k+1} = g(s_k, a_k)
        self.dynamics_state = nn.Sequential(nn.Linear(latent_dim + action_dim, latent_dim), nn.ReLU())
        self.dynamics_reward = nn.Sequential(nn.Linear(latent_dim + action_dim, 601)) # Support atoms
        # 3. Prediction function: p, v = f(s_k)
        self.prediction_policy = nn.Linear(latent_dim, action_dim)
        self.prediction_value = nn.Linear(latent_dim, 601)

    def initial_inference(self, observation):
        s0 = self.representation(observation)
        p = self.prediction_policy(s0)
        v = self.prediction_value(s0)
        return s0, p, v

    def recurrent_inference(self, s_k, action):
        a_onehot = torch.zeros(s_k.shape[0], self.action_dim, device=s_k.device)
        a_onehot.scatter_(1, action.unsqueeze(1), 1.0)
        x = torch.cat([s_k, a_onehot], dim=-1)
        
        s_next = self.dynamics_state(x)
        r = self.dynamics_reward(x)
        p = self.prediction_policy(s_next)
        v = self.prediction_value(s_next)
        return s_next, r, p, v`,
    explanation: {
      zh: {
        overview: "无需任何已知环境规则或物理动力学模拟器，直接在学到的隐空间 (Latent Space) 中进行前向规划，在 Atari、围棋、象棋、将棋上均刷新最高纪录。",
        key_steps: [
          "三大网络解耦三元组：表征函数 h (观测映射到隐状态)、动力学函数 g (动作推演下一步隐状态与即时奖赏)、预测函数 f (隐状态输出策略先验与价值)。",
          "完全抽象的隐状态规划：放弃还原真实物理世界像素（不预测重建观察帧 o_{t+1}），只保留且仅仅推演与决策价值有关的隐动力学特征，规避像素建模的巨大算力浪费。",
          "端到端 MCTS 搜索对齐：在自学习的环境隐模型中展开蒙特卡洛树搜索，利用时序差分更新联合优化三元组网络。"
        ],
        computational_flow: "Observation -> Representation h -> Latent State s0 -> Recurrent Latent Tree Search (g & f) -> Policy distribution pi & Value target.",
        engineering_highlights: "打破了 Model-free 与 Model-based 强化学习的传统边界，在没有游戏引擎模拟器的情况下实现了超人类规划能力。"
      },
      en: {
        overview: "Learns an implicit latent environment dynamics model to plan via MCTS, mastering Atari, Go, and Chess without environmental rules.",
        key_steps: [
          "Tri-Model Parameterization: Representation h(o) -> s0; Dynamics g(s, a) -> (s', r); Prediction f(s) -> (p, v).",
          "Value-Equivalent Latent Space: Does not reconstruct high-dimensional observation pixels; models strictly task-salient reward dynamics.",
          "Latent-MCTS Integration: Unrolls hypothetical search trees in latent coordinate space, regularized end-to-end against real trajectory returns."
        ],
        computational_flow: "Raw pixel observation -> Latent state embedding -> Iterative forward dynamics unroll -> Action selection.",
        engineering_highlights: "Unified model-based planning across both visual video games and board games without prior knowledge of game physics."
      }
    }
  },

  "alphafold2_2020": {
    github_url: "https://github.com/google-deepmind/alphafold",
    pseudocode: `# AlphaFold 2: Evoformer & Invariant Point Attention (Jumper et al. Nature 2021)
import torch
import torch.nn as nn

class EvoformerBlock(nn.Module):
    def __init__(self, msa_dim=256, pair_dim=128):
        super().__init__()
        # MSA Axial Row/Column Self-Attention
        self.msa_row_attn = MSARowAttentionWithPairBias(msa_dim, pair_dim)
        self.msa_col_attn = MSAColumnGlobalAttention(msa_dim)
        self.msa_transition = nn.Sequential(nn.Linear(msa_dim, 4 * msa_dim), nn.ReLU(), nn.Linear(4 * msa_dim, msa_dim))
        
        # Outer product mean communication from MSA to Pair representation
        self.outer_product_mean = OuterProductMean(msa_dim, pair_dim)
        
        # Triangular Multiplicative Update & Self-Attention on Pair edges
        self.tri_mult_outgoing = TriangleMultiplicationOutgoing(pair_dim)
        self.tri_mult_incoming = TriangleMultiplicationIncoming(pair_dim)
        self.tri_attn_starting = TriangleAttentionStartingNode(pair_dim)
        self.tri_attn_ending = TriangleAttentionEndingNode(pair_dim)

    def forward(self, msa_repr, pair_repr):
        # 1. Update MSA representations with pair representation bias
        msa_repr = msa_repr + self.msa_row_attn(msa_repr, pair_bias=pair_repr)
        msa_repr = msa_repr + self.msa_col_attn(msa_repr)
        msa_repr = msa_repr + self.msa_transition(msa_repr)
        
        # 2. Inform Pair edges from MSA co-evolution
        pair_repr = pair_repr + self.outer_product_mean(msa_repr)
        
        # 3. Enforce triangle geometric inequality consistency
        pair_repr = pair_repr + self.tri_mult_outgoing(pair_repr)
        pair_repr = pair_repr + self.tri_mult_incoming(pair_repr)
        pair_repr = pair_repr + self.tri_attn_starting(pair_repr)
        pair_repr = pair_repr + self.tri_attn_ending(pair_repr)
        return msa_repr, pair_repr

class StructureModuleIPA(nn.Module):
    def __init__(self, pair_dim=128, num_blocks=8):
        super().__init__()
        # Invariant Point Attention (IPA) operating directly on 3D rigid Euclidean frames T_i = (R_i, t_i)
        self.ipa_layers = nn.ModuleList([InvariantPointAttention(pair_dim) for _ in range(num_blocks)])

    def forward(self, single_repr, pair_repr, frames_3d):
        for ipa in self.ipa_layers:
            frames_3d, single_repr = ipa(single_repr, pair_repr, frames_3d)
        return frames_3d # Final atomic 3D coordinates`,
    explanation: {
      zh: {
        overview: "彻底解决困扰生物学界长达半个世纪的“蛋白质折叠难题”，在 CASP14 上达到与 X 射线晶体衍射、冷冻电镜实验相媲美的原子级精度 (GDT-TS > 90)。",
        key_steps: [
          "Evoformer 双轨信息流：MSA 特征轨提取序列纵向同源进化信息，Pair 特征轨维护残基间几何空间距离与三角不等式约束，通过外积均值双向实时交互。",
          "三角注意力机制 (Triangle Attention)：对几何空间中三个残基 (i, j, k) 构成的三角形关系进行显式乘法更新与注意力汇聚，强制几何一致性。",
          "不变点注意力 (Invariant Point Attention, IPA)：在 SE(3) 刚体欧几里得坐标系中直接操作局部空间旋转矩阵 R_i 与平移向量 t_i，天然保持旋转平移不变性。"
        ],
        computational_flow: "Primary Sequence + MSAs -> 48 Evoformer Blocks -> Structure Module (8 IPA Blocks) -> Atom 3D Coordinates & pLDDT Confidence.",
        engineering_highlights: "登上 Nature 封面并入选 Science 年度科学突破，开源了人类蛋白质组全量结构预测数据库，荣获 2024 年诺贝尔化学奖。"
      },
      en: {
        overview: "Solved the 50-year-old protein folding grand challenge at CASP14, achieving atomic accuracy comparable to cryo-EM (Nobel Prize in Chemistry 2024).",
        key_steps: [
          "Evoformer Dual Track: Jointly processes 2D MSA co-evolution and Pair residue geometry via Outer Product Mean communication.",
          "Triangle Multiplicative Updates: Enforces spatial triangle inequalities over (i, j, k) residue triplets within geometric graph attention.",
          "Invariant Point Attention (IPA): Directly updates 3D Euclidean frames T_i = (R_i, t_i) with exact SE(3) rototranslation equivariance."
        ],
        computational_flow: "Sequence & MSA features -> 48 Evoformer Blocks -> Structure Module with IPA -> Atomic 3D coordinates & pLDDT.",
        engineering_highlights: "Predicted the structures of virtually all 200+ million known proteins, revolutionizing structural biology and drug discovery."
      }
    }
  },

  "chinchilla_2022": {
    github_url: "https://github.com/google-deepmind/scalable_agent",
    pseudocode: `# Chinchilla Compute-Optimal Scaling Laws (Hoffmann et al. 2022)
import numpy as np
from scipy.optimize import minimize

def chinchilla_parametric_loss(N, D, E=1.69, A=406.4, B=410.7, alpha=0.34, beta=0.28):
    """
    Parametric loss formulation: L(N, D) = E + A / (N ** alpha) + B / (D ** beta)
    where:
      N: Model parameter count (excluding embeddings)
      D: Number of training tokens
      E: Irreducible loss entropy
      alpha, beta: Scaling exponents
    """
    return E + A / (N ** alpha) + B / (D ** beta)

def compute_optimal_allocation(compute_budget_flops):
    """
    Theoretical FLOPs compute constraint: C = 6 * N * D
    Solve for N_opt and D_opt that minimize L(N, D) under compute C
    """
    # Exponent relation: a = beta / (alpha + beta) ~ 0.45; b = alpha / (alpha + beta) ~ 0.55
    # Chinchilla concludes equal scaling: N_opt proportional to C^0.5, D_opt proportional to C^0.5
    G = ((0.34 * 406.4) / (0.28 * 410.7)) ** (1.0 / (0.34 + 0.28))
    
    N_opt = G * ((compute_budget_flops / 6.0) ** (0.28 / (0.34 + 0.28)))
    D_opt = (1.0 / G) * ((compute_budget_flops / 6.0) ** (0.34 / (0.34 + 0.28)))
    return {"N_opt_parameters": N_opt, "D_opt_tokens": D_opt}

# Example verification for 70B Chinchilla model vs 280B Gopher:
# For same compute budget, Chinchilla (70B params, 1.4T tokens) drastically outperforms Gopher (280B params, 300B tokens).`,
    explanation: {
      zh: {
        overview: "系统性修正了 OpenAI 2020 年经典 Scaling Laws，指出既往大模型参数量过大而训练 token 严重不足，提出算力最优分配比 (Compute-Optimal Scaling)。",
        key_steps: [
          "重构参数与数据损失曲面：通过 400 多个不同规模模型的实证拟合，建立严格的可微三项式损失函数 L(N, D) = E + A/N^alpha + B/D^beta。",
          "发现等比例扩展法则：推导证明模型参数规模 N 与训练数据规模 D 在固定算力 C 下应当按近乎 1:1 的等比例 (alpha ≈ beta ≈ 0.5) 同步扩展。",
          "70B 完胜 280B：基于此理论训练的 70B Chinchilla 使用了 1.4T tokens（4 倍数据），性能在所有基准上全面碾压 280B Gopher 与 175B GPT-3。"
        ],
        computational_flow: "Compute Budget C = 6ND -> Solve argmin L(N, D) -> Determine N_opt ~ C^0.5 & D_opt ~ C^0.5 -> Efficient Training Allocation.",
        engineering_highlights: "从根本上终结了盲目追求百亿/千亿参数膨胀的误区，奠定了 LLaMA、Mistral 等新一代高性价比紧凑大模型的工业训练标准。"
      },
      en: {
        overview: "Overhauled the Kaplan et al. scaling laws, demonstrating that model size and training tokens should scale in equal proportion under a fixed compute budget.",
        key_steps: [
          "Parametric Fitting: Fit loss surfaces across 400+ runs: L(N, D) = E + A / N^alpha + B / D^beta.",
          "Equal Scaling Ratio: Concluded optimal parameter scaling exponent a ≈ 0.5 and data scaling exponent b ≈ 0.5, proving prior models were severely undertrained.",
          "Chinchilla (70B) vs Gopher (280B): With 1.4T tokens, 70B Chinchilla outperformed 4x larger models at significantly reduced inference cost."
        ],
        computational_flow: "Total Compute FLOPs -> Optimal Parameter count N_opt & Token count D_opt derivation -> Empirical verification.",
        engineering_highlights: "Pivoted the entire LLM industry toward training smaller, data-rich models, directly inspiring Meta's LLaMA architecture."
      }
    }
  },

  "flamingo_2022": {
    github_url: "https://github.com/mlfoundations/open_flamingo",
    pseudocode: `# Flamingo: Few-Shot Visual Language Model (Alayrac et al. NeurIPS 2022)
import torch
import torch.nn as nn

class PerceiverResampler(nn.Module):
    def __init__(self, visual_feature_dim=1024, latent_dim=1024, num_latents=64, depth=6):
        super().__init__()
        # Fixed learned visual queries
        self.latent_queries = nn.Parameter(torch.randn(num_latents, latent_dim))
        self.cross_attn_layers = nn.ModuleList([
            nn.MultiheadAttention(embed_dim=latent_dim, kdim=visual_feature_dim, vdim=visual_feature_dim, num_heads=8)
            for _ in range(depth)
        ])

    def forward(self, visual_features):
        # Maps arbitrary variable visual features to a fixed token count (e.g. 64 tokens)
        latents = self.latent_queries.unsqueeze(0).repeat(visual_features.shape[0], 1, 1)
        for layer in self.cross_attn_layers:
            latents, _ = layer(query=latents, key=visual_features, value=visual_features)
        return latents

class GatedCrossAttentionBlock(nn.Module):
    def __init__(self, lm_dim=2048, visual_dim=1024):
        super().__init__()
        self.cross_attn = nn.MultiheadAttention(embed_dim=lm_dim, kdim=visual_dim, vdim=visual_dim, num_heads=16)
        # Learnable tanh gating initialized to zero for seamless initialization stability
        self.tanh_gate = nn.Parameter(torch.zeros(1))

    def forward(self, text_tokens, visual_tokens):
        attn_out, _ = self.cross_attn(query=text_tokens, key=visual_tokens, value=visual_tokens)
        return text_tokens + torch.tanh(self.tanh_gate) * attn_out`,
    explanation: {
      zh: {
        overview: "开创性的视觉-语言模型 (VLM)，引入感知重采样器 (Perceiver Resampler) 与门控交叉注意力，仅凭少量示例 (Few-shot) 即可完成复杂视觉问答与图文交错推理。",
        key_steps: [
          "感知重采样器 (Perceiver Resampler)：利用预设的 64 个可学习查询向量，将任意分辨率图像或变长视频时序特征无损压缩为固定长度的视觉 Token 序列。",
          "门控交叉注意力层 (Gated Cross-Attention)：在预训练冻结的语言大模型 (Chinchilla) 各层中插入跨模态注意力，采用可学习的 tanh 零门控初始，确保初始状态完美保留纯文本能力。",
          "交错多模态预训练：直接在海量包含文字与图片交错排版的真实网页 (M3W) 上以自回归方式预训练，天然掌握上下文图文示范学习能力。"
        ],
        computational_flow: "Raw Images/Videos -> Frozen NFNet Vision Backbone -> Perceiver Resampler (64 tokens) -> Gated X-Attention -> Frozen LM -> Text Generation.",
        engineering_highlights: "奠定了现代大模型多模态化的黄金架构范式（冻结底层骨干 + 轻量连接器），成为后续多模态研究的必引基石。"
      },
      en: {
        overview: "Pioneered multimodal few-shot in-context learning by bridging frozen vision backbones with frozen LLMs via Perceiver Resampler.",
        key_steps: [
          "Perceiver Resampler: Distills variable-sized image/video feature maps into a fixed set of 64 visual tokens.",
          "Gated Cross-Attention: Interleaves new cross-attention layers into a frozen language model initialized with tanh(alpha) gating at zero.",
          "Interleaved Multimodal Pre-training: Trained on billions of web pages with interleaved text and images (M3W dataset)."
        ],
        computational_flow: "Visual inputs -> Vision Encoder -> Perceiver Resampler -> Gated X-Attn layers in Frozen LM -> Autoregressive token loss.",
        engineering_highlights: "Proved that freezing pre-trained vision and language models while training connective adapters yields state-of-the-art few-shot reasoning."
      }
    }
  },

  "gato_2022": {
    github_url: "https://github.com/lucidrains/gato-deepmind",
    pseudocode: `# Gato: A Generalist Agent Across Modalities and Tasks (Reed et al. 2022)
import torch
import torch.nn as nn

class GatoTokenizer:
    def tokenize(self, episode_step):
        tokens = []
        # Text: SentencePiece tokenized to vocabulary indices
        if "text" in episode_step:
            tokens.extend(self.text_tokenizer(episode_step["text"]))
        # Images: Non-overlapping 16x16 patches linearly projected to embed_dim
        if "image" in episode_step:
            patches = self.patch_embed(episode_step["image"])
            tokens.extend(patches)
        # Discrete control: standard integers in [0, 1023]
        if "discrete_action" in episode_step:
            tokens.append(self.discrete_action_token(episode_step["discrete_action"]))
        # Continuous control: mu-law encoded into 1024 discrete bins
        if "continuous_action" in episode_step:
            binned = self.mu_law_bin(episode_step["continuous_action"], num_bins=1024)
            tokens.extend(binned)
        return torch.stack(tokens)

class GatoGeneralistTransformer(nn.Module):
    def __init__(self, vocab_size=32000, embed_dim=1024, num_layers=24):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim)
        self.transformer = nn.TransformerDecoder(
            nn.TransformerDecoderLayer(d_model=embed_dim, nhead=16, dim_feedforward=4096),
            num_layers=num_layers
        )
        self.head = nn.Linear(embed_dim, vocab_size)

    def forward(self, multimodal_sequence_tokens, causal_mask):
        # Unified causal sequence modeling across all 604 tasks
        x = self.embed(multimodal_sequence_tokens)
        out = self.transformer(x, x, tgt_mask=causal_mask)
        return self.head(out)`,
    explanation: {
      zh: {
        overview: "通才智能体 (Generalist Agent)：同一套网络权重、同一个 Decoder-only Transformer，在 604 个截然不同的任务（玩游戏、控制机械臂、图像描述、对话聊天）中端到端运行。",
        key_steps: [
          "万物离散序列化 (Universal Tokenization)：将文本、16x16 图像块、离散按键、连续机械臂关节位移统一离散化为单一词表中的 Token 序列。",
          "纯因果序列建模：利用单一参数量为 1.2B 的 Transformer 自回归预测下一个 Token，统一处理不同模态与控制任务。",
          "多任务协同迁移：在混合多任务数据流中同时训练，证明模型在控制物理实体机械臂的同时不会遗忘视觉问答能力。"
        ],
        computational_flow: "Sensory Data (Text, Image Patches, Actions) -> Unified Token IDs -> 1.2B Decoder-only Transformer -> Autoregressive Next-token Loss.",
        engineering_highlights: "首次实证了具身控制、计算机视觉与自然语言处理可以完全统一在单一基础模型架构中，引发全球具身智能基石热潮。"
      },
      en: {
        overview: "A single 1.2B parameter generalist agent performing 604 diverse tasks spanning Atari, robotic manipulation, captioning, and chat.",
        key_steps: [
          "Universal Tokenization: Converts text, 16x16 image patches, discrete actions, and mu-law binned continuous torques into a shared vocabulary.",
          "Decoder-Only Causal Sequence Modeling: Uses a standard causal Transformer to predict all modalities autoregressively.",
          "Cross-Domain Multi-Tasking: Evaluated across simulated and real-world embodiments without altering architecture or parameters."
        ],
        computational_flow: "Multi-modal observations & actions -> Linear patch projection / Embedding -> 24-layer Transformer -> Cross-Entropy Loss.",
        engineering_highlights: "Milestone proof-of-concept showing that embodied robotics and language understanding can coalesce into one generalist model."
      }
    }
  },

  "rt1_2022": {
    github_url: "https://github.com/google-research/robotics_transformer",
    pseudocode: `# RT-1: Robotics Transformer for Real-World Control (Brohan et al. 2022)
import torch
import torch.nn as nn

class TokenLearner(nn.Module):
    def __init__(self, in_tokens=81, out_tokens=8, embed_dim=512):
        super().__init__()
        self.attn_weights = nn.Conv2d(embed_dim, out_tokens, kernel_size=1)

    def forward(self, spatial_tokens_2d):
        # Condenses 81 spatial visual tokens down to 8 dense tokens for 3Hz real-time control
        weights = F.softmax(self.attn_weights(spatial_tokens_2d).flatten(2), dim=-1) # [B, 8, 81]
        condensed = torch.bmm(weights, spatial_tokens_2d.flatten(2).transpose(1, 2))  # [B, 8, Embed]
        return condensed

class RoboticsTransformer1(nn.Module):
    def __init__(self, num_action_bins=256):
        super().__init__()
        self.image_backbone = EfficientNetFiLM() # Conditioned on natural language task instruction
        self.token_learner = TokenLearner()
        self.temporal_transformer = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(d_model=512, nhead=8), num_layers=8
        )
        # 11-dimensional action space: [x, y, z, roll, pitch, yaw, gripper_opening, mode...]
        self.action_head = nn.Linear(512, 11 * num_action_bins)

    def forward(self, image_history_6_frames, text_instruction):
        # 1. Extract FiLM-conditioned visual tokens per frame
        features = self.image_backbone(image_history_6_frames, text_instruction)
        tokens = self.token_learner(features) # [Batch, 6_frames * 8_tokens, 512]
        
        # 2. Causal autoregressive temporal processing
        temporal_out = self.temporal_transformer(tokens)
        
        # 3. Output discretized robotic manipulation actions
        action_logits = self.action_head(temporal_out[:, -1, :]).view(-1, 11, 256)
        return action_logits`,
    explanation: {
      zh: {
        overview: "首个大规模工业级机器人变换器 (Robotics Transformer 1)，将自然语言指令与连续物理控制打通，在 13 万条真实机器人任务中实现 97% 成功率。",
        key_steps: [
          "FiLM 语言条件融合：在 EfficientNet-B3 图像主干中通过特征线性调制 (FiLM) 将任务自然语言指令逐层注入视觉特征图。",
          "TokenLearner 极致算力压缩：将每帧 81 个空间视觉 Token 动态压缩至 8 个关键语义 Token，确保在真实机械臂上实现 3Hz 实时闭环控制。",
          "动作离散化建模：将末端执行器 6 自由度位移 (dx, dy, dz, droll, dpitch, dyaw) 及夹爪开合离散为 256 个分箱 (Bins)，以分类交叉熵损失稳定训练。"
        ],
        computational_flow: "6 RGB Camera Frames + Language Instruction -> FiLM Vision Backbone -> TokenLearner (8 tokens/frame) -> 8-layer Transformer -> 11D Discretized Action.",
        engineering_highlights: "收集了包含 130,000 条真实任务轨迹的最大规模机器人操作数据集，展示了极佳的未见物体、未知背景与长程任务泛化性。"
      },
      en: {
        overview: "First large-scale Robotics Transformer translating camera images and language commands into real-world manipulation with 97% success rate.",
        key_steps: [
          "FiLM Language Conditioning: Conditioned EfficientNet feature maps on natural language instructions using Feature-wise Linear Modulation.",
          "TokenLearner Compression: Condenses 81 spatial tokens per image into 8 informative tokens, enabling real-time 3Hz control loops on real robots.",
          "Action Tokenization: Discretizes 11-dimensional action tuples (Cartesian position, rotation, gripper state) into 256 uniform bins."
        ],
        computational_flow: "RGB History (6 frames) + Command -> FiLM ConvNet -> TokenLearner -> Causal Transformer -> 11-Dim action bin distributions.",
        engineering_highlights: "Demonstrated phenomenal generalization to unseen kitchens, objects, and tasks across 130k real robot demonstrations."
      }
    }
  },

  "alphadev_2023": {
    github_url: "https://github.com/google-deepmind/alphadev",
    pseudocode: `# AlphaDev: Reinforcement Learning for Faster Assembly Code (Mankowitz et al. Nature 2023)
class AssemblyGameEnv:
    def __init__(self, target_function="sort3"):
        self.state_registers = [0] * 8
        self.state_memory = [0] * 16
        self.instruction_history = []
        self.max_steps = 20

    def step(self, action_instruction):
        self.instruction_history.append(action_instruction)
        # Execute instruction in virtual CPU sandbox (e.g. mov, cmovg, swap)
        self.execute_asm(action_instruction)
        done = self.is_correct_sort() or len(self.instruction_history) >= self.max_steps
        
        # Reward combines correctness verification and execution latency bonus
        reward = 0.0
        if done:
            correct = self.verify_against_all_permutations()
            if correct:
                latency = self.benchmark_hardware_cycles(self.instruction_history)
                reward = 1.0 + (self.baseline_latency - latency) * 0.1
            else:
                reward = -1.0
        return self.get_state_embedding(), reward, done

class AlphaDevAgent:
    def __init__(self, mcts_planner):
        self.planner = mcts_planner

    def discover_optimal_assembly(self, target_env):
        # Uses neural MCTS to explore the discrete combinatorial space of assembly instructions
        best_program = self.planner.search(target_env)
        return best_program`,
    explanation: {
      zh: {
        overview: "利用强化学习在汇编机器码空间中发现人类沿用数十年的快速排序算法中存在冗余，发现了提速达 70% 的更优无分支排序汇编指令，被直接合并入 LLVM 官方标准 C++ 库。",
        key_steps: [
          "汇编指令博弈 MDP (Assembly Game)：将编写汇编程序建模为一个单人博弈游戏，智能体每一步选择一条汇编指令 (如 mov, cmov, cmp, swap)。",
          "双重奖励机制：严格穷举所有可能输入排列验证算法 100% 正确性，同时直接在真实 CPU 物理硬件上测量指令周期延迟作为稀疏奖励。",
          "AlphaDev 交换移动 (Swap Move)：智能体自主发现了一种绕过传统比较-交换的人类未知逻辑，在排序 3~5 个元素时节省了关键时钟周期。"
        ],
        computational_flow: "CPU State & Register Graph -> Neural MCTS Policy/Value -> Action (Next Assembly Op) -> Hardware Benchmark Verification -> LLVM C++ Merge.",
        engineering_highlights: "登上 Nature 封面，数十年来首次通过纯算法自动化改进计算机最核心的基础软件基础设施 (LLVM libc++)。"
      },
      en: {
        overview: "Discovered faster sorting algorithms in assembly code via deep RL, accelerating LLVM libc++ standard library by up to 70% (Nature cover).",
        key_steps: [
          "Assembly Game Formulation: Formulates coding as a discrete turn-based MDP where each move appends an x86 assembly instruction.",
          "Dual Objective Function: Rewards correct output on all test permutations penalized by hardware execution cycle counts.",
          "AlphaDev Swap Trick: Discovered novel branchless sequences that bypass redundant register moves established for decades."
        ],
        computational_flow: "Register state -> Dual-head neural evaluation -> MCTS search over x86 instructions -> Hardware latency test -> LLVM integration.",
        engineering_highlights: "Directly integrated into the official LLVM standard C++ library used by millions of software systems worldwide."
      }
    }
  },

  "rt2_2023": {
    github_url: "https://github.com/google-deepmind/open-x-embodiment",
    pseudocode: `# RT-2: Vision-Language-Action (VLA) Model (Brohan et al. 2023)
import torch
import torch.nn as nn

class VisionLanguageActionModel(nn.Module):
    def __init__(self, backbone_vlm_fn, action_vocab_start=32000):
        super().__init__()
        self.vlm = backbone_vlm_fn() # PaLI-X (55B) or PaLM-E (12B)
        self.action_vocab_start = action_vocab_start
        # 256 discrete bins per action dimension mapped to reserved vocabulary tokens
        # Tokens: <action_x_124>, <action_y_089>, <action_z_210>, ...

    def forward(self, camera_image, text_prompt):
        # Format unified prompt: "User: Move the dinosaur to the plastic cup. Robot action:"
        tokens_out = self.vlm.generate(images=camera_image, text=text_prompt)
        return tokens_out

    def decode_action_tokens(self, generated_token_ids):
        # Extract and de-tokenize last 8 tokens into continuous 8-DoF control commands
        action_bins = [t - self.action_vocab_start for t in generated_token_ids[-8:]]
        continuous_action = [((b / 255.0) * 2.0 - 1.0) for b in action_bins]
        return continuous_action # [dx, dy, dz, droll, dpitch, dyaw, gripper_cmd]`,
    explanation: {
      zh: {
        overview: "视觉-语言-动作 (Vision-Language-Action, VLA) 奠基之作，直接将网络规模多模态预训练大模型 (如 PaLI-X) 转化为机器人实时动作控制器，赋予机械臂跨物种常识推理能力。",
        key_steps: [
          "动作标记化为语言 Token (Action as Tokens)：将连续 8 自由度机械臂动作离散分箱后直接当作普通语言词表中的保留词 (如 <action_0_128>)。",
          "跨模态联合微调 (Co-fine-tuning)：将海量互联网图文 VQA 问答数据与真实机器人遥操作演示数据混合微调，确保大模型世界知识与物理操作知识无缝融合。",
          "涌现常识物理推理：机器人能够理解“拾起灭绝了的动物（玩具恐龙）”或“将物体推向具有磁性的表面”等从未专门训练过的抽象指令。"
        ],
        computational_flow: "Camera Image + Abstract Semantic Instruction -> PaLI-X / PaLM-E Backbone -> Generates <action_tokens> -> Continuous Cartesian Motor Control.",
        engineering_highlights: "首次证明互联网万亿级知识可以无缝迁移到物理实体控制中，使机器人泛化性能提升超过两倍，确立了具身 VLA 的主流学术方向。"
      },
      en: {
        overview: "Pioneered Vision-Language-Action (VLA) models, turning web-scale VLMs into direct physical robot controllers.",
        key_steps: [
          "Actions as Tokens: Represents 8-DoF continuous robotic trajectories as discrete tokens in the language model vocabulary.",
          "Co-Fine-Tuning: Trains simultaneously on internet-scale visual question answering datasets and robotic manipulation demonstrations.",
          "Emergent Semantic Reasoning: Endows robots with the ability to perform complex relational reasoning (e.g. 'move the extinct animal to the cup')."
        ],
        computational_flow: "Sensory image + Free-form text -> Pretrained VLM (PaLI-X / PaLM-E) -> Autoregressively emitted action tokens -> Joint execution.",
        engineering_highlights: "Doubled real-world generalization performance on previously unseen objects, semantic concepts, and spatial backgrounds."
      }
    }
  },

  "alphamissense_2023": {
    github_url: "https://github.com/google-deepmind/alphamissense",
    pseudocode: `# AlphaMissense: Pathogenicity Predictor for Missense Variants (Cheng et al. Science 2023)
import torch
import torch.nn as nn
import torch.nn.functional as F

class AlphaMissenseModel(nn.Module):
    def __init__(self, alphafold_structural_core):
        super().__init__()
        # Inherits trained AlphaFold 2 structural backbone (Evoformer + Pair representations)
        self.structural_core = alphafold_structural_core
        self.masked_variant_head = nn.Linear(384, 20) # Predicts distribution over 20 amino acids

    def compute_pathogenicity_score(self, wildtype_seq, structural_msa, mutation_pos, mutant_amino_acid_idx):
        # 1. Forward pass through structural Evoformer with masked mutation position
        latent_features = self.structural_core(wildtype_seq, structural_msa, mask_idx=mutation_pos)
        
        # 2. Predict log probability distribution over all 20 amino acids at mutation site
        logits = self.masked_variant_head(latent_features[mutation_pos])
        log_probs = F.log_softmax(logits, dim=-1)
        
        # 3. Pathogenicity score is the difference in marginal likelihood: log P(wildtype) - log P(mutant)
        wildtype_idx = wildtype_seq[mutation_pos]
        delta_score = log_probs[wildtype_idx] - log_probs[mutant_amino_acid_idx]
        
        # Calibrated logistic normalization to [0, 1]: >0.56 pathogenic, <0.34 benign
        pathogenicity_prob = torch.sigmoid((delta_score - 1.2) / 0.8)
        return pathogenicity_prob`,
    explanation: {
      zh: {
        overview: "发表于 Science 正刊，将 AlphaFold 结构预测能力扩展至全人类基因组，对人类全部 7100 万个可能发生的错义突变 (Missense Variants) 进行了致病性预测与分类 (89% 准确分类)。",
        key_steps: [
          "结构先验迁移：继承 AlphaFold 2 的 Evoformer 三维结构表征，利用隐式空间残基折叠上下文信息替代单纯的一维氨基酸序列。",
          "掩码蛋白质语言建模：在突变位点进行掩码处理，联合微调模型对 20 种天然氨基酸在局部空间物理化学环境中的容忍概率。",
          "对数比值校准：通过野生型与突变型的对数边缘似然差值 Delta = log P(WT) - log P(Mut) 量化致病性，确立了全球致病突变筛查黄金基准。"
        ],
        computational_flow: "Wildtype Sequence + AlphaFold Structure -> Masked Variant Evoformer -> Softmax over 20 Amino Acids -> Delta Log-Likelihood -> Pathogenicity Score.",
        engineering_highlights: "将人类已知错义突变的分类覆盖率从 0.1% 彻底提升至 89%，开源了覆盖整个人类蛋白质组的突变影响目录，极大加速罕见病靶点发现。"
      },
      en: {
        overview: "Classified the pathogenicity of all 71 million human missense variants with 89% accuracy, published in Science.",
        key_steps: [
          "Structural Conditioning: Leverages AlphaFold's Evoformer representation to account for 3D chemical and conformational constraints.",
          "Masked Language Modeling on Structures: Predicts amino acid distributions at specific sites conditioned on surrounding structure.",
          "Delta Likelihood Scoring: Computes score as log P(wildtype) - log P(mutant), calibrated into benign, ambiguous, or pathogenic tiers."
        ],
        computational_flow: "Sequence & structure -> Structural Transformer -> Masked prediction logits -> Log-ratio computation -> Calibrated probability.",
        engineering_highlights: "Expanded clinical annotation from 0.1% to 89% of all possible human missense variants, accelerating rare disease research."
      }
    }
  },

  "graphcast_2023": {
    github_url: "https://github.com/google-deepmind/graphcast",
    pseudocode: `# GraphCast: Learned Global Weather Forecasting (Lam et al. Science 2023)
import torch
import torch.nn as nn

class GraphCastGNN(nn.Module):
    def __init__(self, node_dim=512, edge_dim=512, num_message_passing=16):
        super().__init__()
        # 1. Grid2Mesh: Map 0.25 deg lat/lon grid points to multi-scale icosahedral sphere mesh
        self.grid2mesh_gnn = InteractionNetwork(node_dim, edge_dim)
        # 2. Multi-Mesh GNN: Deep message passing on icosahedral multi-resolution sphere
        self.mesh_gnn_layers = nn.ModuleList([
            InteractionNetwork(node_dim, edge_dim) for _ in range(num_message_passing)
        ])
        # 3. Mesh2Grid: Decode back from icosahedral mesh to global 0.25 deg lat/lon grid
        self.mesh2grid_gnn = InteractionNetwork(node_dim, edge_dim)

    def forward(self, weather_state_t_minus_6h, weather_state_t0):
        # Input state: (Batch, 721 lat, 1440 lon, 37 pressure levels, 5 variables)
        x_in = torch.cat([weather_state_t_minus_6h, weather_state_t0], dim=-1)
        
        # Encode -> Process -> Decode
        mesh_nodes = self.grid2mesh_gnn(x_in)
        for layer in self.mesh_gnn_layers:
            mesh_nodes = layer(mesh_nodes)
        delta_grid = self.mesh2grid_gnn(mesh_nodes)
        
        # Residual update for step t + 6h
        weather_state_next = weather_state_t0 + delta_grid
        return weather_state_next

def autoregressive_10day_forecast(model, init_t0, init_t_minus_6h, steps=40):
    # 40 steps of 6-hour rollouts = 10-day global weather forecast
    state_prev = init_t_minus_6h
    state_curr = init_t0
    predictions = []
    for _ in range(steps):
        state_next = model(state_prev, state_curr)
        predictions.append(state_next)
        state_prev, state_curr = state_curr, state_next
    return predictions`,
    explanation: {
      zh: {
        overview: "颠覆全球数值天气预报计算范式的划时代成果（Science 正刊），在 1 分钟内完成全球 10 天高分辨率天气预报，在世界气象组织 90% 的验证基准上击败欧洲中期天气预报中心 (ECMWF)。",
        key_steps: [
          "多重二十面体球面网络 (Multi-Mesh icosahedron)：将全球 0.25° 经纬度网格（超百万网格点）映射到分层多尺度正二十面体球面上，解决极地极值失真与长程跨洋大气波动传播问题。",
          "图神经交互架构 (Encode-Process-Decode)：利用 16 层高容量图神经网络在球面图结构上进行深度消息传递，精确模拟大气流体力学与热力学演化。",
          "自回归多步损失微调：在 ERA5 历史气象数据上以 6 小时步长自回归展开 12 步 (72 小时)，通过可微梯度反传有效抑制复合累积误差。"
        ],
        computational_flow: "Grid (0.25 deg) -> Grid2Mesh GNN -> 16 Multi-Mesh Spherical GNN Layers -> Mesh2Grid GNN -> Delta 6h Weather -> Autoregressive Rollout.",
        engineering_highlights: "将传统气象超级计算机数小时甚至数天的庞大数值求解（偏微分方程积分）压缩至单个 Cloud TPU 上仅需不到 60 秒即可完成。"
      },
      en: {
        overview: "Disrupted global numerical weather forecasting, generating 10-day global forecasts in under 1 minute and beating ECMWF on 90% of verification targets (Science).",
        key_steps: [
          "Multi-Mesh Spherical Graph: Maps 0.25-degree lat-lon grids to an icosahedral multi-resolution sphere, eliminating polar distortion.",
          "Encode-Process-Decode GNN: Employs 16 message-passing GNN layers across homogeneous spherical edges to model 37 atmospheric pressure levels.",
          "Autoregressive Multi-Step Rollout: Fine-tuned over 12 autoregressive steps (72 hours) to minimize compounding rollout errors."
        ],
        computational_flow: "Current & previous 6h weather state -> Grid2Mesh -> 16-layer Spherical GNN -> Mesh2Grid -> Next 6h state -> 10-day trajectory.",
        engineering_highlights: "Runs 1000x faster than traditional physics-based supercomputer NWP solvers with superior tropical cyclone track prediction."
      }
    }
  },

  "robocat_2023": {
    github_url: "https://github.com/google-deepmind/robocat",
    pseudocode: `# RoboCat: Self-Improving Foundation Agent for Robotics (Bousmalis et al. 2023)
class RoboCatSelfImprovementLoop:
    def __init__(self, foundation_policy, robot_fleet):
        self.policy = foundation_policy
        self.fleet = robot_fleet
        self.dataset = load_initial_demonstration_dataset()

    def step_cycle(self, new_task):
        # 1. Collect 100-1000 teleoperated demonstration trajectories for new task
        human_demos = self.fleet.teleoperate(new_task, num_episodes=200)
        self.dataset.extend(human_demos)
        
        # 2. Fine-tune foundation agent on the new task demonstrations
        specialized_agent = self.policy.clone()
        specialized_agent.train(human_demos, epochs=10)
        
        # 3. Autonomous self-play & self-data generation (no human intervention)
        autonomous_trajectories = []
        for _ in range(5000):
            traj, success = self.fleet.execute_autonomous(specialized_agent, new_task)
            if success: # Self-filtering by task completion detector
                autonomous_trajectories.append(traj)
                
        # 4. Integrate autonomous data and retrain foundation model
        self.dataset.extend(autonomous_trajectories)
        self.policy.train(self.dataset, epochs=20) # Foundation agent improves on all tasks!
        return self.policy`,
    explanation: {
      zh: {
        overview: "首个能够实现自给自足闭环自进化的多机体通用机器人具身智能体 (RoboCat)，通过“少量人类示范 -> 自主自演收集 -> 重新注流基础模型”实现跨机械臂自生长。",
        key_steps: [
          "多机体多任务通才架构：在涵盖不同自由度、不同夹爪及不同动力学特性的物理机械臂机群上统一训练。",
          "高效少样本适应：面对全新未见操作任务，仅需 100~1000 次示范即可快速微调出高成功率专属技能。",
          "自闭环数据飞轮 (Self-Improvement Flywheel)：专属智能体在物理硬件上自主连续尝试上千次，自动过滤成功经验并反哺基础模型，不仅掌握新任务，甚至全面提升既往任务表现。"
        ],
        computational_flow: "Multi-embodiment demonstration -> Fine-tune -> Autonomous execution & filtering -> Ingest into Foundation -> Retrain & Elevate baseline.",
        engineering_highlights: "首次在实体物理机器人世界中实现了类似 AlphaZero 式的闭环自强化学习，摆脱了具身智能长期严重依赖海量人工遥操作示范数据的瓶颈。"
      },
      en: {
        overview: "First self-improving foundation agent for robotic manipulation, generating its own training data to continuously enhance cross-embodiment skills.",
        key_steps: [
          "Multi-Embodiment Generalist: Operates across diverse robotic arms, end-effectors, and operational environments.",
          "Few-Shot Adaptation: Masters brand-new tasks within 100-1000 demonstrations via targeted fine-tuning.",
          "Autonomous Self-Data Generation: Generates thousands of autonomous rollouts, filtering successes to retrain the foundation model without catastrophic forgetting."
        ],
        computational_flow: "Seed demonstrations -> Task fine-tuning -> Autonomous rollout collection -> Self-generated dataset augment -> Global foundation policy update.",
        engineering_highlights: "Demonstrated positive skill transfer where training on new tasks systematically boosted performance on past tasks."
      }
    }
  },

  "gemini_2023": {
    github_url: "https://github.com/google-gemini/cookbook",
    pseudocode: `# Gemini 1.0: Native Multimodal Foundation Architecture (Gemini Team, Google 2023)
import torch
import torch.nn as nn

class NativeMultimodalGeminiBlock(nn.Module):
    def __init__(self, d_model=4096, num_heads=32, num_experts=16):
        super().__init__()
        # Pre-LN Transformer block with Rotary Position Embeddings (RoPE)
        self.self_attn = MultiHeadAttentionWithRoPE(d_model, num_heads)
        # Sparse Mixture-of-Experts (MoE) routing for efficient cross-modal capacity
        self.router = nn.Linear(d_model, num_experts)
        self.experts = nn.ModuleList([
            nn.Sequential(nn.Linear(d_model, 4 * d_model), nn.GELU(), nn.Linear(4 * d_model, d_model))
            for _ in range(num_experts)
        ])

    def forward(self, interleaved_tokens, modality_flags):
        # Native interleaved processing: text, audio spectrogram patches, visual ViT tokens
        norm_x = self.norm1(interleaved_tokens)
        h = interleaved_tokens + self.self_attn(norm_x)
        
        # MoE Top-2 Gated Dispatch
        router_logits = self.router(self.norm2(h))
        top2_weights, top2_indices = torch.topk(F.softmax(router_logits, dim=-1), k=2)
        
        expert_out = 0
        for i in range(2):
            idx = top2_indices[:, :, i]
            weight = top2_weights[:, :, i].unsqueeze(-1)
            # Dispatch to corresponding expert
            expert_out = expert_out + weight * self.dispatch_expert(h, idx)
        return h + expert_out`,
    explanation: {
      zh: {
        overview: "Google DeepMind 旗舰原生多模态大模型，彻底颠覆了“先训练纯文本模型再缝合图像模块”的传统管线，从预训练第一天起就在文本、代码、图像、音频与视频上联合原生训练。",
        key_steps: [
          "原生多模态联合预训练 (Native Multimodality)：全模态（文本、音频帧、图像块、视频帧）统一编码交错输入单一网络，天然掌握跨模态物理直觉与细粒度推理。",
          "多尺度硬件高效架构：划分 Ultra、Pro、Nano 三种尺寸规格，从端侧设备低延迟离线运行延伸至云端超大规模机群多机协同推理。",
          "MMLU 首超人类专家：Gemini Ultra 在全球顶级综合知识基准 MMLU 上取得 90.0% 的惊人得分，历史上首次超越人类专业专家水准。"
        ],
        computational_flow: "Interleaved Inputs (Text, Audio, Video, Code) -> Shared Native Transformer Backbone with MoE -> Joint Next-token & Cross-modal Objective.",
        engineering_highlights: "在 Google 全球分布式 TPU v4/v5e 机群上通过高效多维并行与自主容灾恢复完成万卡规模训练，确立了原生全模态架构演进终极方向。"
      },
      en: {
        overview: "Google DeepMind's flagship native multimodal model, trained from inception across text, vision, audio, and code simultaneously.",
        key_steps: [
          "Native Multimodality from Day 1: Eliminates staged stitching; interleaves text, image tokens, and audio spectrograms natively in one model.",
          "Hierarchical Fleet (Ultra, Pro, Nano): Scales seamlessly from on-device latency-critical deployment to massive TPU cluster reasoning.",
          "Surpassing Human Experts on MMLU: First model to exceed human expert benchmarks on MMLU with a 90.0% score."
        ],
        computational_flow: "Interleaved multi-sensory token streams -> Unified Transformer MoE layers -> Cross-modal autoregressive decoding.",
        engineering_highlights: "Engineered on tens of thousands of TPU v4/v5e accelerators with custom Megatron-style tensor, pipeline, and data parallelism."
      }
    }
  },

  "autort_2024": {
    github_url: "https://github.com/google-deepmind/auto_rt",
    pseudocode: `# AutoRT: Embodied Foundation Models for Fleet Orchestration (AutoRT Team 2024)
class AutoRTSystem:
    def __init__(self, vlm_scene_describer, llm_task_proposer, critic_safety_filter):
        self.vlm = vlm_scene_describer
        self.llm = llm_task_proposer
        self.safety_critic = critic_safety_filter # Implements "Robot Constitution"

    def orchestrate_fleet(self, robot_fleet, physical_building):
        for robot in robot_fleet:
            # 1. Perception: Robot captures panoramic cameras of current office environment
            scene_image = robot.capture_camera()
            scene_description = self.vlm.describe_objects_and_affordances(scene_image)
            
            # 2. Generation: LLM proposes potential micro-tasks matching environment affordances
            candidate_tasks = self.llm.propose_tasks(
                scene_description, count=10, guidelines="Helpful, non-disruptive office chores"
            )
            
            # 3. Filtering: Robot Constitution Safety Checker (Asimov-inspired safety rules)
            safe_tasks = []
            for task in candidate_tasks:
                is_safe, rationale = self.safety_critic.evaluate_constitution(
                    task, rules=[
                        "Rule 1: Never interact with humans or pets directly.",
                        "Rule 2: Never handle sharp objects, liquids, or hot appliances.",
                        "Rule 3: Ensure mechanical joint torque limits are never exceeded."
                    ]
                )
                if is_safe: safe_tasks.append(task)
                
            # 4. Dispatch: Dispatch optimal safe task to low-level VLA control policy
            if safe_tasks:
                best_task = safe_tasks[0]
                robot.execute_vla_policy(best_task)
                robot.log_trajectory_to_dataset()`,
    explanation: {
      zh: {
        overview: "将视觉语言大模型 (VLM) 与机器人宪法 (Robot Constitution) 相结合，实现 52 台移动双臂机器人在四栋真实办公大楼中长达 7 个月的多机自主协同与安全探索。",
        key_steps: [
          "环境可供性发现 (Affordance Discovery)：利用大模型理解全景摄像头中的物理场景，自主推理出可执行的操作任务提案（如“擦拭白板”、“整理零食”）。",
          "机器人宪法安全守则 (Robot Constitution)：引入三层安全过滤器（硬性物理急停 + 视觉阻挡检测 + LLM 宪法安全审核），彻底阻绝危险操作（如接触人、操作尖锐物品或液体）。",
          "超大规模真实具身数据飞轮：自主编排收集了超 77,000 次真实物理交互实验，为构建下一代具身大模型提供了前所未有的海量物理经验。"
        ],
        computational_flow: "RGB Cameras -> VLM Scene Analysis -> LLM Task Proposal -> Robot Constitution Safety Filter -> Low-level VLA Execution.",
        engineering_highlights: "首次证明基础大模型可以在未被结构化改造的真实办公大楼中安全、全天候自主运转，被公认为机器人编排调度的工业范式。"
      },
      en: {
        overview: "Harnessed VLMs and a 'Robot Constitution' to safely orchestrate a fleet of 52 mobile robots across 4 corporate office buildings.",
        key_steps: [
          "Affordance-Guided Task Proposal: High-level VLM scans environments and suggests feasible chores matching nearby objects.",
          "Robot Constitution: Asimov-inspired algorithmic safety guardrails verifying task harmlessness against strict rules before physical execution.",
          "Fleet-Scale Continuous Data Gathering: Accumulated 77k+ real-world manipulation trials across diverse multi-room buildings."
        ],
        computational_flow: "Panoramic imagery -> VLM affordance parsing -> LLM Task Proposal -> Constitution Safety Gate -> VLA Execution.",
        engineering_highlights: "Pioneered real-world embodied data scaling without human supervision, establishing safety verification standards for physical AI."
      }
    }
  },

  "alphageometry_2024": {
    github_url: "https://github.com/google-deepmind/alphageometry",
    pseudocode: `# AlphaGeometry: Neuro-Symbolic Olympiad Geometry Solver (Trinh et al. Nature 2024)
class AlphaGeometrySolver:
    def __init__(self, neural_language_model, symbolic_deduction_engine):
        self.llm = neural_language_model         # Neural construction predictor (Auxiliary Points)
        self.engine = symbolic_deduction_engine # Classical algebraic deduction (DD + AR)

    def solve(self, theorem_problem, max_constructive_steps=50):
        # Initial formulation into symbolic facts
        proof_graph = self.engine.initialize(theorem_problem)
        
        for step in range(max_constructive_steps):
            # 1. Symbolic Deductive Engine: Exhaustively deduce all reachable geometric facts
            while self.engine.has_new_deductions(proof_graph):
                self.engine.apply_forward_deduction_rules(proof_graph)
                if self.engine.is_goal_proven(proof_graph, theorem_problem.goal):
                    return self.engine.extract_human_readable_proof(proof_graph)

            # 2. If deductive engine reaches a dead end, invoke Neural Language Model
            # LLM predicts auxiliary geometric constructions (e.g. "Draw circumcircle of ABC", "Add point E on BD")
            current_state_text = proof_graph.to_text_representation()
            suggested_auxiliary_constructions = self.llm.predict_auxiliary_elements(current_state_text, top_k=5)
            
            # 3. Add predicted auxiliary points/lines into proof graph and resume deduction
            applied = False
            for construction in suggested_auxiliary_constructions:
                if self.engine.can_add_construction(proof_graph, construction):
                    proof_graph.add_construction(construction)
                    applied = True
                    break
            if not applied:
                break # Search exhausted
        return None # Failed to solve within search budget`,
    explanation: {
      zh: {
        overview: "发表于 Nature 正刊，在国际数学奥林匹克 (IMO) 几何题目中达到金牌选手水准（在 30 道奥数竞赛题中成功证明 25 道，人类金牌选手基准为 25.9 道）。",
        key_steps: [
          "神经-符号共生架构 (Neuro-Symbolic Synergism)：将逻辑严密但缺乏跳跃直觉的符号演绎引擎 (DD+AR) 与极具直觉想象力但缺乏严格证明的神经语言大模型有机耦合。",
          "符号演绎引擎负责求证：基于几何逻辑与代数消去规则推导所有可达定理，确保每一步推演 100% 严密正确，毫无大模型幻觉。",
          "神经语言模型预测辅助线：当确定性符号演绎陷入死胡同时，语言模型预测关键辅助点与辅助线（如外接圆、角平分线交点），重新激活符号推导。",
          "1 亿个合成几何命题预训练：自主生成数亿条无人类示范数据的合成几何构造与反向推导证明链，彻底破解训练数据极度匮乏难题。"
        ],
        computational_flow: "IMO Geometry Formal Statement -> Symbolic Engine (Exhaustive Deduction) -> If Stuck -> LLM Predicts Auxiliary Point -> Complete Proof Trace.",
        engineering_highlights: "首次在世界顶级数学竞赛严密推理层面比肩人类顶尖数学家，确立了神经符号混合架构在科学严谨推理领域的绝对主导地位。"
      },
      en: {
        overview: "Solved 25 of 30 International Mathematical Olympiad (IMO) geometry problems, approaching the human gold-medalist average (Nature).",
        key_steps: [
          "Neuro-Symbolic Co-Reasoning: Marries a symbolic deduction engine (exact logic without hallucinations) with a deep language model (creative intuition).",
          "Auxiliary Construction Prediction: When symbolic deduction reaches dead ends, the LLM predicts novel auxiliary points or circles.",
          "Synthetic Data Generation: Synthesized 100 million geometric proofs from scratch without human demonstrations."
        ],
        computational_flow: "Problem statements -> Deterministic forward deduction -> LLM auxiliary injection upon stagnation -> Human-readable proof.",
        engineering_highlights: "Overcame the training data drought in complex formal mathematics, delivering human gold-medalist capability."
      }
    }
  },

  "genie_2024": {
    github_url: "https://github.com/google-deepmind/genie",
    pseudocode: `# Genie: Generative Interactive Environments (Bruce et al. 2024)
import torch
import torch.nn as nn

class SpatiotemporalVideoTokenizer(nn.Module):
    def __init__(self, vocab_size=2048):
        super().__init__()
        # Continuous 3D Causal VQ-VAE compressing video frames (H, W, T) into discrete codebook
        self.encoder_3d = nn.Conv3d(3, 128, kernel_size=(3, 4, 4), stride=(1, 4, 4))
        self.codebook = nn.Embedding(vocab_size, 128)

    def encode_to_tokens(self, video_frames):
        continuous_z = self.encoder_3d(video_frames)
        # Vector quantization to nearest discrete indices
        quantized_tokens = self.vector_quantize(continuous_z)
        return quantized_tokens # [Batch, T, H_patches, W_patches]

class LatentActionModel(nn.Module):
    def __init__(self, num_discrete_actions=8):
        super().__init__()
        # Unsupervised discovery of latent actions a_t between frame t and t+1
        self.action_encoder = nn.TransformerEncoder(nn.TransformerEncoderLayer(d_model=256, nhead=4), num_layers=4)
        self.action_codebook = nn.Embedding(num_discrete_actions, 256)

    def forward(self, tokens_frame_t, tokens_frame_t_plus_1):
        pair = torch.cat([tokens_frame_t, tokens_frame_t_plus_1], dim=-1)
        latent_continuous_a = self.action_encoder(pair)
        discrete_action = self.quantize_action(latent_continuous_a)
        return discrete_action # Discovered action: e.g. Jump, Move Left, Move Right

class WorldModelDynamics(nn.Module):
    def __init__(self, d_model=1024, num_layers=24):
        super().__init__()
        # 11B parameter MaskGIT / Autoregressive spatiotemporal Transformer
        self.dynamics_transformer = SpatiotemporalTransformer(d_model=d_model, num_layers=num_layers)

    def predict_next_frame(self, past_frame_tokens, user_input_action):
        # Predicts next frame tokens given past visual history and controlled user action
        next_tokens = self.dynamics_transformer(past_frame_tokens, user_input_action)
        return next_tokens`,
    explanation: {
      zh: {
        overview: "首个从无标注互联网游戏视频中完全无监督学习交互式世界模型的系统，仅凭单张图像与玩家键盘按键输入，即可实时交互生成无限可玩的 2D/3D 虚拟世界。",
        key_steps: [
          "时空视频分词器 (Spatiotemporal VQ-VAE)：在时间与空间维度联合压缩视频序列，将连续的动态画面编码为离散的视觉代码簿 (Codebook)。",
          "潜动作模型 (Latent Action Model, LAM)：在没有任何游戏底层按键标注的情况下，仅凭视频帧与帧之间的差异自发发现离散动作（如跳跃、左右移动、下蹲）。",
          "自回归动力学世界模型 (Dynamics World Model)：利用 110 亿参数的生成变换器以潜动作为条件自回归预测下一个视频帧，实现极高保真度与物理连贯性的用户按键交互式推演。"
        ],
        computational_flow: "Unlabeled Videos -> Spatiotemporal VQ-VAE -> Latent Action Discovery -> 11B Transformer Dynamics -> Interactive User Play.",
        engineering_highlights: "开辟了无需人工编程游戏逻辑即可直接通过纯视频数据生成交互式可控虚拟世界的通用基础平台，成为智能体环境模拟的杀手级工具。"
      },
      en: {
        overview: "First generative interactive world model trained unsupervised on Internet video, generating interactive playable environments from a single prompt image.",
        key_steps: [
          "Spatiotemporal VQ-VAE: Compresses video sequences into discrete tokens across both spatial and temporal axes.",
          "Latent Action Model (LAM): Discovers discrete behavioral actions (e.g. jump, walk) strictly from frame transitions without explicit action annotations.",
          "11B World Dynamics Model: Predicts the next visual frame autoregressively conditioned on past history and user-steered latent actions."
        ],
        computational_flow: "Video datasets -> Tokenizer + LAM Action extraction -> Large-scale Dynamics Transformer -> Realtime playable video generation.",
        engineering_highlights: "Pioneered foundational interactive world simulation directly from video, transforming passive observation into active play."
      }
    }
  },

  "gemini_1_5_2024": {
    github_url: "https://github.com/google-gemini/cookbook",
    pseudocode: `# Gemini 1.5 Pro: Million-Token Context Sparse MoE (Gemini Team, Google 2024)
import torch
import torch.nn as nn

class MillionTokenSparseMoEBlock(nn.Module):
    def __init__(self, d_model=4096, num_experts=32, active_experts=2):
        super().__init__()
        # Ring Attention / Multi-Query Attention supporting 1M - 10M token contexts
        self.long_context_attn = RingMultiQueryAttention(d_model=d_model, num_heads=32, num_kv_heads=8)
        self.router = nn.Linear(d_model, num_experts)
        self.experts = nn.ModuleList([
            SwiGLUFeedForward(d_model, hidden_dim=14336) for _ in range(num_experts)
        ])
        self.k = active_experts

    def forward(self, long_seq_hidden_states, block_device_mesh):
        # 1. Ring Attention distributed communication across multiple TPU pods
        norm_h = self.input_layernorm(long_seq_hidden_states)
        attn_out = self.long_context_attn(norm_h, device_mesh=block_device_mesh)
        h = long_seq_hidden_states + attn_out
        
        # 2. Sparse Mixture-of-Experts routing
        norm_h2 = self.post_attention_layernorm(h)
        gate_logits = self.router(norm_h2)
        topk_weights, topk_indices = torch.topk(F.softmax(gate_logits, dim=-1), k=self.k)
        
        # 3. Dynamic Sparse Dispatch
        moe_out = torch.zeros_like(h)
        for i in range(self.k):
            weight = topk_weights[..., i:i+1]
            expert_idx = topk_indices[..., i]
            moe_out = moe_out + weight * self.execute_sparse_expert(norm_h2, expert_idx)
        return h + moe_out`,
    explanation: {
      zh: {
        overview: "打破全球大语言模型上下文长度世界纪录，将有效上下文窗口推升至 100 万 ~ 1000 万 Token，在数小时音视频与全量百万行代码库中实现 99.7% 的近乎完美大海捞针检索能力 (NIAH)。",
        key_steps: [
          "稀疏专家混合架构 (Sparse MoE)：在维持推理算力与小型模型相当的前提下大幅拓展整体参数容量，显著提升长序列吞吐率与推理速度。",
          "分布式环形注意力 (Ring Attention)：将百万 Token 长序列切分到多个 TPU 节点构成的逻辑环中流式传递 Key/Value 缓存，突破单卡显存瓶颈。",
          "全模态深海捞针全绿 (Needle In A Haystack)：在 1 小时完整视频、11 小时完整音频、70 万行代码库中均实现 99%+ 的超高召回与精准跨模态关联。"
        ],
        computational_flow: "1M-10M Interleaved Sequence -> Ring Attention Mesh Communication -> Sparse MoE Activation -> 99.7% Retrieval Accuracy.",
        engineering_highlights: "彻底改变了信息检索、代码分析与多模态交互的工作范式，使得模型无需 RAG 即可直接将一整部百科全书或大型开源工程全量加载入工作记忆。"
      },
      en: {
        overview: "Pushed production context windows to 1M-10M tokens with near-perfect (99.7%) multi-modal Needle-In-A-Haystack retrieval.",
        key_steps: [
          "Sparse Mixture-of-Experts (MoE): Maintains fast, compute-efficient inference while expanding model expressive capacity across millions of tokens.",
          "Ring Attention Implementation: Parallelizes sequence lengths across TPU pod rings to eliminate GPU/TPU memory bounds.",
          "Flawless Retrieval across Modalities: Achieved >99% recall on 1-hour video, 11-hour audio, and 700k lines of code simultaneously."
        ],
        computational_flow: "Million-token input -> Distributed Ring Attention -> Sparse MoE dynamic routing -> Coherent long-range synthesis.",
        engineering_highlights: "Redefined retrieval-augmented generation (RAG) paradigms by enabling direct in-context reasoning over entire institutional codebases."
      }
    }
  },

  "sima_2024": {
    github_url: "https://github.com/google-deepmind/sima",
    pseudocode: `# SIMA: Scalable Instructable Multiworld Agent (SIMA Team 2024)
import torch
import torch.nn as nn

class SIMAAgent(nn.Module):
    def __init__(self, visual_backbone_fn, text_encoder_fn, action_vocab_size=128):
        super().__init__()
        self.vision_encoder = visual_backbone_fn() # Encodes dynamic 3D video stream
        self.language_encoder = text_encoder_fn()  # Encodes natural language instructions
        
        # Multimodal temporal fusion core (Transformer with cross-attention)
        self.temporal_core = nn.TransformerDecoder(
            nn.TransformerDecoderLayer(d_model=768, nhead=12), num_layers=12
        )
        # Universal human-like interface: Discretized Keyboard & Mouse actions
        self.keyboard_head = nn.Linear(768, 64) # WASD, Space, E, Inventory...
        self.mouse_x_head = nn.Linear(768, 32)  # Pitch/Yaw angular displacement
        self.mouse_y_head = nn.Linear(768, 32)
        self.mouse_click_head = nn.Linear(768, 4)

    def forward(self, video_frames_history, language_instruction):
        # 1. Extract visual tokens and language conditioning embedding
        v_tokens = self.vision_encoder(video_frames_history) # [Batch, T_len, 768]
        instr_emb = self.language_encoder(language_instruction)
        
        # 2. Fuse temporal visual scene with task instruction
        fused = self.temporal_core(v_tokens, instr_emb.unsqueeze(1))
        latest_step_feat = fused[:, -1, :]
        
        # 3. Predict universal keyboard and mouse movements
        key_logits = self.keyboard_head(latest_step_feat)
        mouse_x = self.mouse_x_head(latest_step_feat)
        mouse_y = self.mouse_y_head(latest_step_feat)
        clicks = self.mouse_click_head(latest_step_feat)
        return {"keys": key_logits, "mouse_dx": mouse_x, "mouse_dy": mouse_y, "clicks": clicks}`,
    explanation: {
      zh: {
        overview: "首个可在《无人深空》、《模拟山羊 3》、《瓦尔海姆》等多款 3D 现代商业游戏中听懂自然语言指令并自主探索操作的通用虚拟智能体 (SIMA)。",
        key_steps: [
          "统一拟人化交互界面 (Universal Interface)：不依赖任何游戏内部专属 API 或作弊状态，仅凭屏幕图像像素输入与标准鼠标键盘按键输出。",
          "多世界跨域指令遵循：在风格完全迥异的 9 款不同 3D 商业虚拟世界中训练，智能体能够理解“砍倒一棵树”、“建造营地”或“驾驶飞船”。",
          "自监督多模态视频对齐：通过对数千小时人类玩家配对语音解说与第一人称视频进行对比学习与行为克隆，实现自然语言到微观运动轨迹的深层语义映射。"
        ],
        computational_flow: "First-Person Video + Language Command -> Vision-Language Cross-Attention -> Universal Keyboard & Mouse Discretized Commands.",
        engineering_highlights: "打破了以往游戏 AI 局限于特定单一环境（如仅在星际或雅达利）的孤岛瓶颈，迈向了可在任意三维虚拟世界漫游的通用智能体基石。"
      },
      en: {
        overview: "A generalist AI agent following natural language instructions across diverse 3D virtual game worlds (No Man's Sky, Valheim, etc.).",
        key_steps: [
          "Human-Like Universal Interface: Operates strictly via screen pixels and standard keyboard/mouse controls without custom game APIs.",
          "Cross-World Generalization: Evaluated across 9 commercial games with drastically different physics engines, visual themes, and objectives.",
          "Language-Action Grounding: Maps high-level goals ('mine copper', 'steer spaceship') into precise sub-second temporal motor behaviors."
        ],
        computational_flow: "Realtime video feed + Language instruction -> Multimodal Transformer Core -> Discretized Keyboard & Mouse actions.",
        engineering_highlights: "Demonstrated that cross-environment multi-task training yields an agent capable of zero-shot transfer to completely new 3D worlds."
      }
    }
  },

  "med_gemini_2024": {
    github_url: "https://github.com/google-research/google-research/tree/master/med_gemini",
    pseudocode: `# Med-Gemini: Advancing Biomedical Understanding with Multimodal Gemini (Saab et al. 2024)
class MedGeminiInference:
    def __init__(self, multimodal_gemini_engine, search_grounding_tool):
        self.engine = multimodal_gemini_engine
        self.search_tool = search_grounding_tool

    def clinical_reasoning(self, patient_history_text, chest_xray_image, genomic_data):
        # 1. Multimodal fusion: chest radiograph + clinical text + genomic variant tokens
        prompt = {
            "text": patient_history_text,
            "images": [chest_xray_image],
            "genomics": genomic_data,
            "instruction": "Provide differential diagnosis with evidence and citation."
        }
        
        # 2. Initial uncertainty-aware clinical diagnostic hypothesis
        initial_hypothesis, confidence_score = self.engine.generate_with_confidence(prompt)
        
        # 3. Dynamic uncertainty-guided Web & Literature search verification
        if confidence_score < 0.85:
            search_queries = self.engine.generate_retrieval_queries(initial_hypothesis)
            evidence_docs = self.search_tool.search_biomedical_literature(search_queries)
            
            # Grounded verification synthesis
            final_report = self.engine.synthesize_grounded_diagnosis(
                initial_hypothesis, evidence_docs, prompt
            )
            return final_report
        return initial_hypothesis`,
    explanation: {
      zh: {
        overview: "面向临床医疗诊断与生物医药的原生多模态大模型家族，在 USMLE 美国执业医师资格考试中取得 91.1% 的最高分，并在医学影像、病理切片分析与基因组学推理上树立全新医学 AI 标杆。",
        key_steps: [
          "长程多模态临床证据综合：能够同时吸收电子病历纯文本、高分辨率胸部 X 光透视片、CT 三维断层扫描及长序列基因变异信息进行联合诊断。",
          "不确定性引导的动态文献检索 (Search-Grounding)：在生成复杂罕见病诊断时实时评估置信度，自动调用权威医学文献库进行事实性校验，极大压制幻觉。",
          "多专家临床对齐微调：利用执业医师真实反馈数据与临床安全性红线进行强化学习偏好对齐，确保输出严谨、具有循证医学依据。"
        ],
        computational_flow: "Patient Multimodal Records (Text, X-Ray, Genomics) -> Med-Gemini Core -> Uncertainty Evaluation -> Search-Grounded Verification -> Clinical Diagnosis.",
        engineering_highlights: "在 14 项涵盖医疗文本、影像与基因组的综合专业基准中全面击败 GPT-4，为 AI 辅助临床辅助诊断提供了前所未有的可靠性依据。"
      },
      en: {
        overview: "Specialized multimodal biomedical Gemini model achieving 91.1% on USMLE, setting new state-of-the-art across clinical reasoning and radiology.",
        key_steps: [
          "Cross-Modal Clinical Integration: Seamlessly reads medical records, high-resolution radiographs, CT scans, and genomic variants in one prompt.",
          "Uncertainty-Guided Search Grounding: Interrogates PubMed and clinical guidelines dynamically when predictive uncertainty exceeds clinical thresholds.",
          "Physician Alignment: Fine-tuned against clinical safety rubrics with strict requirements for evidence-grounded differential diagnoses."
        ],
        computational_flow: "Clinical inputs -> Multimodal Med-Gemini -> Confidence calibration -> Literature verification -> Structured medical output.",
        engineering_highlights: "Outperformed GPT-4 across multimodal benchmarks, establishing unprecedented safety in automated clinical diagnostic assistance."
      }
    }
  },

  "alphafold_3_2024": {
    github_url: "https://github.com/google-deepmind/alphafold3",
    pseudocode: `# AlphaFold 3: Biomolecular Complex Structure via Diffusion (Abramson et al. Nature 2024)
import torch
import torch.nn as nn

class PairformerBlock(nn.Module):
    def __init__(self, pair_dim=128, single_dim=384):
        super().__init__()
        # Simplified and streamlined Evoformer operating without heavy MSA matrices
        self.triangle_update_outgoing = TriangleMultiplicationOutgoing(pair_dim)
        self.triangle_update_incoming = TriangleMultiplicationIncoming(pair_dim)
        self.triangle_attention = TriangleAttention(pair_dim)
        self.pair_to_single = nn.Linear(pair_dim, single_dim)

    def forward(self, single_repr, pair_repr):
        pair_repr = pair_repr + self.triangle_update_outgoing(pair_repr)
        pair_repr = pair_repr + self.triangle_update_incoming(pair_repr)
        pair_repr = pair_repr + self.triangle_attention(pair_repr)
        single_repr = single_repr + self.pair_to_single(pair_repr.mean(dim=1))
        return single_repr, pair_repr

class DiffusionModule(nn.Module):
    def __init__(self, atom_coords_dim=3, conditioning_dim=512):
        super().__init__()
        # Operates directly on raw 3D Cartesian coordinates of all atoms (proteins, DNA, RNA, ligands)
        self.denoising_net = DenoisingScoreNet(atom_coords_dim, conditioning_dim)

    def denoise_step(self, noisy_coords_t, t, conditioning_features):
        # Predicts clean coordinates x_0 directly from noisy coordinates x_t
        predicted_clean_coords = self.denoising_net(noisy_coords_t, t, conditioning_features)
        return predicted_clean_coords

def generate_biomolecular_complex(pairformer, diffusion_module, sequence_specs, num_diffusion_steps=200):
    # 1. Generate rich Pairformer structural embeddings for all biomolecular entities
    single_repr, pair_repr = pairformer(sequence_specs)
    
    # 2. Initialize atom coordinates with standard Gaussian noise
    x_t = torch.randn(total_num_atoms, 3)
    
    # 3. Reverse diffusion process directly assembling the complex in 3D Cartesian space
    for step in reversed(range(num_diffusion_steps)):
        x_0_pred = diffusion_module.denoise_step(x_t, step, pair_repr)
        x_t = sample_previous_timestep(x_t, x_0_pred, step)
    return x_t # All-atom 3D coordinates (Proteins, DNA, RNA, Ligands, Chemical Modifications)`,
    explanation: {
      zh: {
        overview: "发表于 Nature 正刊，将结构生物学从单纯预测“单一蛋白质”推向预测“生命全部核心分子复合体”的终极高度，能够联合高精度建模蛋白质、DNA、RNA、化学小分子配体及离子结合。",
        key_steps: [
          "Pairformer 架构革新：大幅简化并优化 AlphaFold 2 的 Evoformer，彻底去除沉重的多序列比对 (MSA) 依赖，使得模型速度更快且支持任意多链分子。",
          "全原子扩散模型 (Full-Atom Diffusion)：彻底淘汰了旧版的刚体旋转平移与扭转角预测架构，直接在三维笛卡尔坐标空间中对所有原子的无序高斯噪声进行逐步去噪去模糊。",
          "跨分子相互作用统一建模：将蛋白质与小分子药物配体、核酸链的亲和性预测精度提升 50% 以上，为自动化计算药物分子设计提供终极引擎。"
        ],
        computational_flow: "All Biomolecular Entities (Proteins, DNA, RNA, Ligands) -> Pairformer -> Direct 3D Coordinate Diffusion Denoising -> Atomic Complex Structure.",
        engineering_highlights: "重构了分子生物学研究范式，使得研究人员在几秒钟内即可透视小分子药物如何嵌合进人类受体蛋白与遗传物质的原子级立体细节。"
      },
      en: {
        overview: "Revolutionized structural biology beyond isolated proteins to predict complexes containing proteins, DNA, RNA, ligands, and ions (Nature).",
        key_steps: [
          "Pairformer Architecture: Streamlined alternative to Evoformer that drastically minimizes reliance on massive MSAs while elevating efficiency.",
          "Full-Atom 3D Diffusion: Directly denoises 3D Cartesian coordinates of all atoms from pure noise, eliminating rigid-body torsion angles.",
          "Cross-Molecular Generalization: Boosted drug-ligand binding pose prediction accuracy by over 50% across challenging PDB benchmarks."
        ],
        computational_flow: "Molecular token graph -> Pairformer geometric representations -> All-atom Cartesian coordinate diffusion -> 3D Complex.",
        engineering_highlights: "Unified molecular biology modeling into a single diffusion framework, transforming rational drug design."
      }
    }
  },

  "alphaproof_2024": {
    github_url: "https://github.com/google-deepmind/alphaproof",
    pseudocode: `# AlphaProof: Formal Mathematical Reasoning in Lean 4 (DeepMind Math Team 2024)
class AlphaProofSystem:
    def __init__(self, gemini_formalizer, lean_mcts_prover):
        self.formalizer = gemini_formalizer # Translates natural language math into Lean 4
        self.prover = lean_mcts_prover       # AlphaZero-style search in Lean 4 formal state space

    def solve_olympiad_problem(self, natural_language_problem_statement):
        # 1. Formalization: Gemini auto-formalizes problem statement into Lean 4 code
        lean4_formal_statement = self.formalizer.translate_to_lean(natural_language_problem_statement)
        
        # 2. Formal state verification in Lean 4 Interactive Theorem Prover environment
        lean_env = Lean4Environment(lean4_formal_statement)
        
        # 3. AlphaZero-style Monte Carlo Tree Search in formal tactic space
        proof_trace = self.prover.search(
            initial_state=lean_env.get_initial_goal(),
            tactic_generator=self.prover.predict_tactic,
            heuristic_evaluator=self.prover.evaluate_goal_progress,
            max_search_budget_hours=48
        )
        
        # 4. Lean 4 Kernel mathematically verifies the proof (0% Hallucination)
        is_valid_proof = lean_env.verify_proof_kernel(proof_trace)
        return is_valid_proof, proof_trace`,
    explanation: {
      zh: {
        overview: "在 2024 年国际数学奥林匹克 (IMO) 中取得等同于人类银牌 (28分/42分) 的历史性突破，与 AlphaGeometry 2 联手解答了包括极度困难的数论与代数难题。",
        key_steps: [
          "形式化自动翻译 (Auto-formalization)：利用 Gemini 大模型将复杂的自然语言竞赛题目无歧义地翻译为精密的 Lean 4 形式化数学代码。",
          "Lean 4 状态树强化搜索：将 AlphaZero 的自我对弈与 MCTS 树搜索思想迁移至 Lean 4 证明状态空间中，智能体自主探索并应用数学策略 (Tactics)。",
          "形式化证明内核保证绝对零幻觉：每一个推导步骤均由 Lean 4 严苛的数学证明内核 (Kernel) 进行逻辑检验，彻底杜绝大模型的伪证与逻辑漏洞。"
        ],
        computational_flow: "Natural Language IMO Problem -> Gemini Lean 4 Formalization -> MCTS Search over Lean 4 Tactics -> Lean 4 Kernel Zero-Defect Proof.",
        engineering_highlights: "首次在世界顶级数学奥赛全题型中证明了形式化强化学习的威力，标志着人工智能在严格逻辑推理领域跨入了超人类专业级门槛。"
      },
      en: {
        overview: "Achieved silver-medal standard at the 2024 International Mathematical Olympiad (IMO), solving complex formal algebra and number theory in Lean 4.",
        key_steps: [
          "Auto-formalization via Gemini: Translates natural language problem statements into mathematically rigorous Lean 4 code.",
          "AlphaZero-Style Proof Search: Uses neural-guided MCTS over the discrete Lean 4 proof-tactic state space.",
          "Formally Verified Guarantees: Relies on the Lean 4 compiler kernel to verify mathematical proofs with 0% hallucination."
        ],
        computational_flow: "Natural language problem -> Lean 4 formal code -> Neural MCTS tactic exploration -> Kernel verification -> Silver medal standard.",
        engineering_highlights: "A watershed moment proving that reinforcement learning in formal languages can solve grandmaster-level mathematical reasoning."
      }
    }
  },

  "table_tennis_2024": {
    github_url: "https://github.com/google-deepmind/robot-table-tennis",
    pseudocode: `# Robot Table Tennis: Achieving Human-Level Competitive Play (DeepMind 2024)
import numpy as np

class HierarchicalTableTennisPolicy:
    def __init__(self, low_level_skills, high_level_controller):
        # Low-level primitive policies trained in physics sim (Sim-to-Real):
        # [Forehand Topspin, Backhand Push, Forehand Smash, Serve, Chop...]
        self.skills = low_level_skills
        self.controller = high_level_controller # Strategic Meta-Controller

    def select_action(self, ball_trajectory_3d, opponent_paddle_pose):
        # 1. Predict future ball bounce point and landing trajectory
        predicted_impact_state = self.physics_filter(ball_trajectory_3d)
        
        # 2. High-level strategy: choose skill based on opponent weaknesses
        chosen_skill_idx = self.controller.select_best_skill(
            predicted_impact_state, opponent_paddle_pose
        )
        skill_policy = self.skills[chosen_skill_idx]
        
        # 3. Low-level execution at 100Hz motor control loop
        target_joint_velocities = skill_policy.compute_joint_commands(ball_trajectory_3d)
        return target_joint_velocities`,
    explanation: {
      zh: {
        overview: "首个在敏捷高动态实体对抗体育项目中达到业余人类冠军水准的机器人系统，在与人类选手的真实竞技对抗中取得 45% 的总胜率，并在中级业余选手中取得 100% 胜率。",
        key_steps: [
          "分层控制架构 (Hierarchical Control)：上层战略元控制器分析对手站位与薄弱环节动态决定战术意图；下层低阶技能库包含正手上旋、反手削球、强力扣杀等专业技能。",
          "极速仿真到真实迁移 (Sim-to-Real)：在虚拟物理引擎中通过海量域随机化 (Domain Randomization) 学习底层电机控制，并在毫秒级反应中弥合真实旋转与气动阻力差异。",
          "实时对手弱点自适应：在比赛过程中实时追踪对手回球击球点偏好，动态调整落点与弧线策略。"
        ],
        computational_flow: "Stereo Vision 3D Ball Tracking -> High-Level Meta Strategic Selection -> Low-Level Skill Execution at 100Hz -> Realtime Paddle Swing.",
        engineering_highlights: "证明了机器人强化学习可以在超高速动态非结构化对抗环境中兼具亚厘米级空间精度与毫秒级时间同步能力。"
      },
      en: {
        overview: "Achieved human-level competitive performance in robot table tennis, winning 45% of matches against diverse human players (100% against intermediate).",
        key_steps: [
          "Hierarchical Architecture: Decouples strategic game-theory decision making from high-frequency sub-second motor control.",
          "Sim-to-Real Aerodynamic Transfer: Overcomes complex Magnus effects, spin friction, and latency via massive domain randomization in simulation.",
          "Online Opponent Modeling: Adapts tactical ball placement in real time to exploit human opponent blind spots."
        ],
        computational_flow: "High-speed camera tracking -> Trajectory forecasting -> Hierarchical strategy selection -> 100Hz robotic joint actuation.",
        engineering_highlights: "Showcased sub-centimeter physical accuracy and millisecond temporal precision in athletic human-robot competition."
      }
    }
  },

  "txgemma_2025": {
    github_url: "https://github.com/google-deepmind/txgemma",
    pseudocode: `# TxGemma: Efficient Agentic LLMs for Therapeutics (DeepMind Health 2025)
class TxGemmaAgent:
    def __init__(self, base_txgemma_model, molecular_docking_tool, admet_evaluator):
        self.llm = base_txgemma_model
        self.docking = molecular_docking_tool
        self.admet = admet_evaluator

    def optimize_lead_compound(self, target_protein_pdb, initial_smiles):
        trajectory = []
        current_smiles = initial_smiles
        
        for iteration in range(10):
            # 1. LLM proposes bio-isosteric replacements and molecular modifications
            thought_prompt = f"Optimize SMILES {current_smiles} for target {target_protein_pdb} to improve binding affinity and solubility."
            proposed_modifications = self.llm.generate_candidate_molecules(thought_prompt)
            
            # 2. Tool-augmented physical docking & ADMET property evaluation
            scores = []
            for mol_smiles in proposed_modifications:
                docking_affinity = self.docking.compute_binding_energy(target_protein_pdb, mol_smiles)
                solubility, toxicity = self.admet.predict_properties(mol_smiles)
                composite_score = docking_affinity - 2.0 * toxicity + 1.5 * solubility
                scores.append((composite_score, mol_smiles))
                
            # 3. Select best candidate and update agent reasoning context
            best_score, best_smiles = max(scores, key=lambda x: x[0])
            current_smiles = best_smiles
            trajectory.append({"iter": iteration, "smiles": current_smiles, "score": best_score})
        return current_smiles, trajectory`,
    explanation: {
      zh: {
        overview: "专为生物医药与小分子药物研发设计的高效智能体大模型 (TxGemma)，将化学 SMILES 符号理解与生物物理模拟工具链紧密结合，大幅压缩药物先导化合物优化周期。",
        key_steps: [
          "分子结构与化学语言深度融合：原生解析小分子 SMILES、蛋白质残基序列与药效团空间拓扑，精通生物等排体替换与成药性规律。",
          "智能体外部工具调用闭环 (Tool-Augmented Loop)：自主调用分子对接 (Docking)、ADMET 成药性毒理学评估模型，以实证反馈指导多轮迭代式化学结构改良。",
          "小参数高效端侧部署：在 2B/9B 紧凑轻量参数量下展现出超越百亿通用模型的专业药物设计推理能力。"
        ],
        computational_flow: "Drug Target PDB + Initial Molecule -> TxGemma Reasoning -> Propose Modifications -> Call Docking & ADMET Tools -> Optimized Compound.",
        engineering_highlights: "将大语言模型的生成式直觉与严密的计算生物学模拟工具链相连接，开创了智能体驱动的新药发现范式。"
      },
      en: {
        overview: "Efficient agentic LLM fine-tuned for therapeutics, combining chemical reasoning with automated molecular docking and ADMET prediction tools.",
        key_steps: [
          "Chemical Tokenization: Comprehends SMILES representations and 3D pharmacophore geometries natively alongside biological context.",
          "Autonomous Tool-Use Loop: Coordinates physical molecular docking tools and toxicological predictors to iteratively refine drug leads.",
          "High Efficiency: Delivers state-of-the-art computational chemistry design within compact 2B/9B parameter envelopes."
        ],
        computational_flow: "Target specifications -> Agentic generation -> Automated tool verification -> Multi-property optimization loop.",
        engineering_highlights: "Bridged generative language modeling with physical molecular mechanics for automated rational therapeutics development."
      }
    }
  },

  "roboballet_2025": {
    github_url: "https://github.com/google-deepmind/roboballet",
    pseudocode: `# RoboBallet: Multi-Robot Trajectory Choreography via GNN & RL (DeepMind 2025)
import torch
import torch.nn as nn

class SpatiotemporalCollisionGNN(nn.Module):
    def __init__(self, node_dim=128, edge_dim=64):
        super().__init__()
        # Nodes represent individual robot arm joints; Edges represent dynamic spatial proximity
        self.edge_mlp = nn.Sequential(nn.Linear(2 * node_dim + 3, edge_dim), nn.ReLU())
        self.node_update = nn.GRUCell(edge_dim, node_dim)

    def forward(self, joint_positions_3d, joint_velocities):
        # Dynamically constructs collision proximity graph across all robotic arms
        edge_index, rel_distances = compute_proximity_graph(joint_positions_3d, radius_threshold=0.3)
        edge_attr = self.edge_mlp(torch.cat([rel_distances, joint_velocities], dim=-1))
        # Message passing to propagate collision avoidance awareness
        aggregated = scatter_mean(edge_attr, edge_index[1], dim=0)
        return aggregated

class RoboBalletPolicy(nn.Module):
    def __init__(self, num_robots=8):
        super().__init__()
        self.gnn = SpatiotemporalCollisionGNN()
        self.decentralized_actor = nn.Linear(128, 7) # Joint torque commands per arm

    def compute_coordinated_motion(self, fleet_joint_states):
        collision_embeddings = self.gnn(fleet_joint_states.pos, fleet_joint_states.vel)
        torques = self.decentralized_actor(collision_embeddings)
        return torques`,
    explanation: {
      zh: {
        overview: "在高度狭窄空间中实现多达 8~16 台工业机械臂的高密度无碰撞协同作业 (RoboBallet)，将图神经网络 (GNN) 空间拓扑建模与分布式多智能体强化学习完美融为一体。",
        key_steps: [
          "时空碰撞动态图 (Dynamic Proximity GNN)：实时追踪所有机械臂连杆与关节的三维空间欧几里得距离，动态建立临近图边缘，实现碰撞风险毫秒级全图广播。",
          "分布式执行与集中式训练 (MAPPO)：各机械臂根据局部感知与 GNN 空间消息自主规划轨迹，在保证零碰撞的前提下最大化整机机群操作吞吐率。",
          "高密度协同避障编排：彻底淘汰了传统离线静态轨迹规划在工业自动化中死锁率高、计算开销大、灵活性差的痼疾。"
        ],
        computational_flow: "Multi-Arm 3D Joint States -> Dynamic Proximity Graph -> Spatial GNN Message Passing -> Decentralized Joint Velocity Commands.",
        engineering_highlights: "在密集物流分拣与精密制造业机群协同中树立了全新的多机器人轨迹调度世界纪录。"
      },
      en: {
        overview: "Coordinated motion planning for 8-16 dense robotic manipulators sharing a cramped workspace without collisions via GNNs and RL.",
        key_steps: [
          "Dynamic Proximity Graph: Constructs graph edges between robotic links nearing Euclidean proximity to compute collision risk.",
          "Decentralized Control via Multi-Agent RL: Arm agents act independently conditioned on spatial GNN embeddings to avoid deadlocks.",
          "Zero-Collision Guarantees: Replaces static classical RRT trajectories with high-throughput adaptive spatial choreography."
        ],
        computational_flow: "Multi-robot joint telemetry -> Spatial graph construction -> Edge message passing -> Torque output without collision.",
        engineering_highlights: "Eliminated deadlock bottlenecks in high-density automated manufacturing and logistics sorting hubs."
      }
    }
  },

  "trecvit_2026": {
    github_url: "https://github.com/google-deepmind/trecvit",
    pseudocode: `# TRecViT: A Recurrent Video Transformer for Long Streams (DeepMind 2026)
import torch
import torch.nn as nn

class RecurrentVideoBlock(nn.Module):
    def __init__(self, d_model=768, num_heads=12, memory_tokens=32):
        super().__init__()
        # Spatial self-attention within current frame patches
        self.spatial_attn = nn.MultiheadAttention(d_model, num_heads)
        # Linear recurrent memory update across infinite temporal horizons
        self.recurrent_memory_cells = nn.Parameter(torch.randn(memory_tokens, d_model))
        self.memory_cross_attn = nn.MultiheadAttention(d_model, num_heads)
        self.linear_gate = nn.Sequential(nn.Linear(d_model, d_model), nn.Sigmoid())

    def forward(self, current_frame_patches, persistent_memory_state):
        # 1. Spatial self-attention on frame patches (Quadratic only in spatial size, linear in time)
        spat_out, _ = self.spatial_attn(current_frame_patches, current_frame_patches, current_frame_patches)
        
        # 2. Read from persistent memory state
        mem_read, _ = self.memory_cross_attn(spat_out, persistent_memory_state, persistent_memory_state)
        fused = spat_out + mem_read
        
        # 3. Update persistent recurrent memory state with incoming visual information
        gate = self.linear_gate(fused.mean(dim=1, keepdim=True))
        next_memory_state = gate * persistent_memory_state + (1.0 - gate) * fused.mean(dim=1, keepdim=True)
        return fused, next_memory_state`,
    explanation: {
      zh: {
        overview: "突破全自注意力在长视频处理中的二次方复杂度瓶颈，将线性循环记忆单元 (Recurrent Memory) 与空间视觉 Transformer 结合，实现无限长视频流的恒定显存实时在线理解。",
        key_steps: [
          "时空解耦架构：空间维度采用高分辨率自注意力保证单帧细节表征；时间维度采用线性递归记忆单元实现 O(1) 显存开销的时序状态流动。",
          "持久化记忆压缩更新：通过门控机制将历史视频中的长期事件压缩进固定尺寸的记忆槽 (Memory Slots) 中，无需保留历史所有历史帧的 KV Cache。",
          "超长视频流实时处理：在长达数小时的连续监控流或自动驾驶车载长视频中实现恒定推理延迟与极高时序因果推理精度。"
        ],
        computational_flow: "Incoming Video Frame -> Spatial Self-Attention -> Cross-Attention with Recurrent Memory -> Gated Memory State Update.",
        engineering_highlights: "从底层计算复杂度层面解决了现代大模型无法实时、持续、低开销处理连续视频流的行业痛点。"
      },
      en: {
        overview: "Recurrent Video Transformer combining spatial self-attention with recurrent linear memory, processing infinite video streams with O(1) memory.",
        key_steps: [
          "Spatiotemporal Decoupling: Spatial self-attention for intra-frame fidelity coupled with linear recurrence across time.",
          "Bounded Memory Footprint: Compresses hours of video context into fixed persistent memory slots without maintaining massive KV caches.",
          "Real-time Constant Latency: Sustains real-time frame rates on streaming camera streams without temporal horizon degradation."
        ],
        computational_flow: "Streaming frame tokens -> Spatial attention -> Interaction with recurrent memory -> Constant-memory state transition.",
        engineering_highlights: "Solved the quadratic complexity barrier of video Transformers, enabling edge autonomous streaming perception."
      }
    }
  },

  "vision_learners_2026": {
    github_url: "https://github.com/google-deepmind/vision-learners",
    pseudocode: `# Image Generators are Generalist Vision Learners (DeepMind 2026)
import torch
import torch.nn as nn

class DiffusionFeatureExtractor(nn.Module):
    def __init__(self, pretrained_diffusion_backbone):
        super().__init__()
        # Pre-trained Diffusion Transformer (DiT) / U-Net image generator
        self.generator = pretrained_diffusion_backbone

    def extract_dense_perceptual_features(self, input_image, noise_timestep=100):
        # 1. Add subtle perturbation noise at early timestep t
        noise = torch.randn_like(input_image)
        noisy_x = self.add_noise(input_image, noise, t=noise_timestep)
        
        # 2. Extract intermediate multi-scale feature maps from generative denoising backbone
        with torch.no_grad():
            internal_features = self.generator.get_intermediate_activations(noisy_x, t=noise_timestep)
            
        # 3. Features encode emergent semantic segmentation, depth, surface normals, and pose!
        return internal_features

class ZeroShotDownstreamHead(nn.Module):
    def __init__(self, feature_dim=1024):
        super().__init__()
        self.seg_head = nn.Conv2d(feature_dim, num_classes=150, kernel_size=1)
        self.depth_head = nn.Conv2d(feature_dim, 1, kernel_size=1)

    def forward(self, generative_features):
        segmentation_mask = self.seg_head(generative_features)
        depth_map = self.depth_head(generative_features)
        return segmentation_mask, depth_map`,
    explanation: {
      zh: {
        overview: "揭示前沿生成式图像大模型（如 Diffusion Transformer）内部涌现出的极强通用判别式感知能力，证明纯生成式预训练能够直接成为零样本全能计算机视觉特征提取器。",
        key_steps: [
          "反向挖掘生成表征：图像生成模型为了还原真实世界细节，其去噪网络中间层必然自发建立了对物理世界三维深度、物体边界与语义类别的深刻理解。",
          "微扰采样提取特征：在较小时间步注入轻微扰动，提取去噪主干的多层激活特征，无需任何下游有监督标注即可直接胜任密集语义分割与单目深度估计。",
          "统一生成与感知范式：证明生成 (Generation) 与理解 (Perception) 并不是割裂的技术路线，生成式预训练是通向通用计算机视觉的最坚实捷径。"
        ],
        computational_flow: "Raw Image -> Slight Noise Injection -> Diffusion Backbone Forward -> Extract Intermediate Activations -> Zero-Shot Depth / Seg.",
        engineering_highlights: "彻底改变了计算机视觉底层特征提取器的传统认识，证明生成式大模型在判别任务上的泛化能力全面超越传统 CLIP 与 DINO。"
      },
      en: {
        overview: "Proved that generative diffusion image models learn superior generalist visual perception features surpassing DINO and CLIP.",
        key_steps: [
          "Emergent Perceptual Priors: Denoising networks spontaneously encode 3D spatial geometry, surface normals, and object boundaries.",
          "Intermediate Activation Tapping: Probes middle generative layers under mild noise to extract universal dense representation maps.",
          "Unified Vision Foundation: Unifies image generation and perceptual understanding into a single foundational representation paradigm."
        ],
        computational_flow: "Input image -> Perturbation at timestep t -> Diffusion Transformer forward -> Intermediate representation extraction -> Downstream tasks.",
        engineering_highlights: "Demonstrated that generative objectives provide the most powerful foundation for zero-shot downstream perception."
      }
    }
  },

  "from_agi_to_asi_2026": {
    github_url: "https://github.com/google-deepmind",
    pseudocode: `# From AGI to ASI: Safety & Capability Verification Framework (DeepMind 2026)
class SuperintelligenceTransitionHarness:
    def __init__(self, model_under_test, formal_verification_sandbox):
        self.model = model_under_test
        self.sandbox = formal_verification_sandbox
        self.safety_redlines = {
            "autonomous_replication": 0.0,  # Zero tolerance
            "cyber_offensive_generation": 0.0,
            "sandbagging_deception_rate": 0.0,
            "alignment_drift_bound": 0.01
        }

    def execute_eval_cycle(self, capability_eval_suite, alignment_probe_suite):
        # 1. Measure Autonomous Problem Solving Capability (ASI Trajectory)
        capability_score = 0.0
        for task in capability_eval_suite:
            solution = self.model.generate_solution(task, sandbox=self.sandbox)
            capability_score += self.sandbox.verify_correctness(solution)

        # 2. Probe for Deceptive Alignment and Sandbagging (Intentional Underperformance)
        sandbagging_detected = self.probe_for_sandbagging(self.model, alignment_probe_suite)
        alignment_drift = self.measure_internal_representation_drift(self.model)

        # 3. Automated Safety Gate: Kill-switch & Safe Containerization
        if sandbagging_detected or alignment_drift > self.safety_redlines["alignment_drift_bound"]:
            self.trigger_emergency_containment(reason="Alignment Redline Exceeded")
            return {"status": "HALTED", "capability": capability_score}

        return {"status": "SAFE_PROGRESSION", "capability": capability_score, "alignment_drift": alignment_drift}`,
    explanation: {
      zh: {
        overview: "Google DeepMind 官方关于从通用人工智能 (AGI) 迈向超级智能 (ASI, Artificial Superintelligence) 的学术纲领与安全跃迁评估框架，首次定义了超级智能在数学、科研与自主系统上的能力标准与绝对不可逾越的安全红线。",
        key_steps: [
          "能力矩阵严格量化：界定人类专家级 (Level 4 AGI) 到超越全人类综合智慧总和 (Level 5 ASI) 的六维跃迁指标（跨学科自主科研、形式化逻辑推导、长周期自主工程）。",
          "欺骗性对齐与装蠢检测 (Anti-Sandbagging Probing)：针对高级智能体可能隐藏自身真实能力的“假装弱小 (Sandbagging)”风险设计了激活探针与博弈陷阱。",
          "可扩展监督与形式化容器阻断：利用可验证的形式化沙箱与不可篡改的硬件安全飞地，确保超级智能递归自我改进过程完全置于人类可控的安全边界内。"
        ],
        computational_flow: "Model Weights -> Capability Verification Benchmark -> Latent Deception & Sandbagging Probing -> Safety Redline Gating -> Deployment.",
        engineering_highlights: "确立了全球前沿 AI 实验室在超级智能时代共同遵守的技术演进准则，被公认为负责任前沿 AI 开发的纲领性指南。"
      },
      en: {
        overview: "Foundational white paper defining the theoretical roadmap, capability thresholds, and non-negotiable safety redlines from AGI to Artificial Superintelligence (ASI).",
        key_steps: [
          "Six-Dimensional ASI Capability Matrix: Formulates rigorous evaluation suites measuring cross-disciplinary scientific discovery and autonomous software engineering.",
          "Anti-Sandbagging Diagnostics: Probes neural activations to detect intentional deceptive underperformance (sandbagging).",
          "Scalable Oversight & Formal Containment: Employs cryptographically and mathematically verified sandboxes to govern recursive self-improvement."
        ],
        computational_flow: "Candidate Model -> Benchmark suite -> Deep mechanistic deception audit -> Safety redline verification -> Safe clearance.",
        engineering_highlights: "Established the industry-wide philosophical and technical blueprint for safe navigation toward superintelligent systems."
      }
    }
  },

  "overthinking_2026": {
    github_url: "https://github.com/google-deepmind/overthinking-dynamics",
    pseudocode: `# Towards Structural Understanding of LLM Overthinking Dynamics (DeepMind 2026)
import torch
import torch.nn.functional as F

class DynamicTestTimeStoppingController:
    def __init__(self, reasoning_model, entropy_threshold=0.35, degradation_window=4):
        self.model = reasoning_model
        self.threshold = entropy_threshold
        self.window = degradation_window

    def generate_optimal_reasoning_trace(self, prompt):
        reasoning_tokens = []
        token_entropy_history = []
        
        while len(reasoning_tokens) < 4096:
            # Autoregressively generate next reasoning token in Chain-of-Thought
            logits = self.model(prompt, reasoning_tokens)[:, -1, :]
            probs = F.softmax(logits, dim=-1)
            
            # 1. Compute instantaneous predictive entropy: H = -sum(p * log p)
            token_entropy = -(probs * torch.log(probs + 1e-9)).sum().item()
            token_entropy_history.append(token_entropy)
            
            # Sample next token
            next_tok = torch.multinomial(probs, num_samples=1)
            reasoning_tokens.append(next_tok)
            
            # 2. Detect Overthinking Dynamics: Sudden entropy spikes indicate semantic looping
            if len(token_entropy_history) > self.window:
                rolling_entropy_slope = (
                    token_entropy_history[-1] - token_entropy_history[-self.window]
                ) / self.window
                # Overthinking threshold: entropy diverges while confidence decays
                if rolling_entropy_slope > self.threshold:
                    # Premature stopping before self-contradicting hallucination degrades the answer
                    break
                    
        # Final answer synthesized from optimal inflection point
        final_answer = self.model.synthesize_conclusion(prompt, reasoning_tokens)
        return final_answer`,
    explanation: {
      zh: {
        overview: "深入剖析大语言模型在测试时强化思考 (Test-Time Compute / Extended Thinking) 中出现的“想得越多、答得越差”的过度思考动力学失衡现象，提出自适应动态终止准则。",
        key_steps: [
          "过度思考动力学表征：揭示思维链长度与回答准确率之间的倒 U 型曲线关系，指出模型在越过最优推理点后会陷入自我怀疑、循环语义死锁与虚构假设。",
          "熵波动监控与相变检测：通过实时监控每个生成 Token 的信息熵与隐空间注意力漂移率，捕捉推理退化的临界相变点。",
          "自适应测试时算力终止 (Optimal Early Stopping)：在模型发生自相矛盾幻觉前动态收敛并触发最终答案合成，以更少算力获得大幅跃升的最终正确率。"
        ],
        computational_flow: "Prompt -> Sequential CoT Tokens -> Monitor Rolling Token Entropy & Drift -> Detect Inflection Point -> Early Stop & Emit Answer.",
        engineering_highlights: "破解了以 OpenAI o1/DeepSeek R1 为代表的测试时强化学习长链推理中算力浪费与性能退化的核心瓶颈。"
      },
      en: {
        overview: "Dissected the structural dynamics of 'overthinking' in extended test-time compute LLMs, introducing dynamic entropy stopping criteria.",
        key_steps: [
          "Inverted U-Curve Characterization: Demonstrated that excessive reasoning tokens trigger semantic loops, self-doubt, and accuracy degradation.",
          "Phase Transition Detection: Tracks predictive token entropy to detect the exact moment productive reasoning transitions into degenerative hallucination.",
          "Adaptive Early Stopping: Triggers optimal conclusion synthesis before the reasoning chain diverges, saving compute while elevating accuracy."
        ],
        computational_flow: "Prompt -> Stepwise CoT rollout -> Entropy tracking -> Inflection detection -> Early answer extraction.",
        engineering_highlights: "Provided theoretical foundations to optimize reasoning models (e.g. o1/R1-style), maximizing accuracy per test-time FLOP."
      }
    }
  },

  "thought_partners_2026": {
    github_url: "https://github.com/google-deepmind/thought-partners",
    pseudocode: `# Designing Proactive Thought Partners for Writing (DeepMind 2026)
class ProactiveThoughtPartnerSystem:
    def __init__(self, ideator_agent, critic_agent, synthesizer_agent):
        self.ideator = ideator_agent
        self.critic = critic_agent
        self.synthesizer = synthesizer_agent
        self.user_keystroke_idle_detector = IdleTimer(threshold_seconds=2.5)

    def on_user_writing_stream(self, document_context, current_paragraph):
        # 1. Non-disruptive Proactive Intervention Trigger
        if not self.user_keystroke_idle_detector.is_user_paused():
            return None # Do not interrupt user's active creative flow
            
        # 2. Multi-perspective cognitive ideation
        # Divergent perspective: propose counter-arguments, alternate framing, unexpected angles
        critique = self.critic.analyze_flaws_and_blindspots(document_context, current_paragraph)
        fresh_angles = self.ideator.brainstorm_divergent_ideas(document_context, critique)
        
        # 3. Formulate gentle contextual thought prompts (not direct text overwriting)
        proactive_suggestions = self.synthesizer.format_thought_sparks(
            fresh_angles, mode="Thought-Partner", max_suggestions=3
        )
        # Returns interactive marginal notes and conceptual questions
        return proactive_suggestions`,
    explanation: {
      zh: {
        overview: "探索人机协同认知的全新边界，从传统的“被动问答 / 自动续写”跃迁为具备主动性、批判性思维与适时介入能力的“前瞻性思想共创伙伴 (Proactive Thought Partner)”。",
        key_steps: [
          "非侵入式主动介入时机仲裁 (Proactive Turn-Taking)：通过监测人类书写节奏与构思停顿点，在不打断人类心流体验的前提下自发提供认知启发。",
          "多角色认知辩论机制：后台协同运行批判者 (Critic) 寻找逻辑漏洞、发散者 (Ideator) 提供颠覆性视角、综合者 (Synthesizer) 提炼边缘批注。",
          "思维启发而非简单代写：坚决避免直接输出大段套话覆盖用户文本，而是抛出具有深度认知价值的反思性问题与未竟论点，激发人类心智潜能。"
        ],
        computational_flow: "User Keystroke Stream -> Idle Detection -> Multi-Agent Cognitive Analysis (Critic + Ideator) -> Marginal Thought Sparks.",
        engineering_highlights: "重新定义了人工智能时代人机共创的人机工程学标准，使 AI 真正从工具人升级为共同探讨高难度智力成果的科研与创作合伙人。"
      },
      en: {
        overview: "Shifted AI from passive completion assistants to proactive collaborative thought partners that stimulate deeper human ideation.",
        key_steps: [
          "Non-Intrusive Turn-Taking: Detects cognitive pauses in user typing to inject suggestions without disrupting creative flow.",
          "Multi-Perspective Cognitive Core: Employs adversarial sub-agents (Critic, Ideator, Synthesizer) to uncover conceptual blind spots.",
          "Socratic Sparking: Prioritizes reflective marginal questions over verbatim text autocompletion to empower human authorship."
        ],
        computational_flow: "Document stream -> User flow arbitration -> Multi-agent critique & ideation -> Thought-provoking interactive marginalia.",
        engineering_highlights: "Redefined human-AI interaction design, transforming AI into an intellectual co-pilot for high-level creative reasoning."
      }
    }
  },

  "visual_gi_whitepaper_2026": {
    github_url: "https://github.com/google-deepmind",
    pseudocode: `# Visual General Intelligence: Unified Dual-System World Model Architecture (DeepMind 2026)
import torch
import torch.nn as nn

class VisualGeneralIntelligenceDualSystem(nn.Module):
    def __init__(self, system1_world_model, system2_deliberate_reasoner):
        super().__init__()
        # System 1: Fast, intuitive, generative 3D visual world simulator operating at 30Hz
        self.system1_world_model = system1_world_model
        # System 2: Slow, deliberative, symbolic & multimodal reasoning engine
        self.system2_reasoner = system2_deliberate_reasoner

    def forward(self, high_resolution_visual_stream, task_objective):
        # 1. System 1 perceives and rolls out immediate intuitive physical world dynamics
        intuitive_simulated_futures = self.system1_world_model.predict_multiverse_rollouts(
            high_resolution_visual_stream, horizon_seconds=5.0
        )
        
        # 2. Anomaly / Complexity Gate: Does the task require deep deliberative intervention?
        requires_deliberation = self.evaluate_uncertainty_and_novelty(intuitive_simulated_futures)
        
        if not requires_deliberation:
            # Fast instinctual sensorimotor response
            immediate_action = self.system1_world_model.extract_policy_action(intuitive_simulated_futures)
            return {"action": immediate_action, "mode": "System 1 Intuitive"}
            
        # 3. System 2 Deliberate Planning: Simulates counterfactual scenarios and symbolic verification
        deliberated_plan = self.system2_reasoner.deliberate_plan(
            visual_stream=high_resolution_visual_stream,
            simulated_futures=intuitive_simulated_futures,
            goal=task_objective,
            search_budget_steps=100
        )
        return {"action": deliberated_plan.optimal_action, "mode": "System 2 Deliberative"}`,
    explanation: {
      zh: {
        overview: "Google DeepMind 2026 年重磅白皮书《Visual General Intelligence (VGI)》，确立了视觉通用智能与语言大模型平起平坐的 AGI 双引擎终极架构，指出人类智能的绝大部分建立在对物理世界的空间因果模拟之上。",
        key_steps: [
          "双系统统一架构 (Dual-System Architecture)：系统 1 为快思考、高帧率（30Hz）直觉物理世界模拟器；系统 2 为慢思考、深思熟虑的高阶多模态空间推理与假设验证引擎。",
          "多宇宙反事实推演 (Multiverse Counterfactual Rollout)：模型在行动前能够在隐空间中并行推演数十种可能发生的物理未来，精准评估行动风险与物理因果链。",
          "超越文本 Token 的物理常识基石：彻底改变了“LLM 即 AGI”的单一论调，指出只有具备完全具身化、时空连续可逆的视觉通用世界模型，才能真正诞生超越语言符号限制的终极智能。"
        ],
        computational_flow: "High-Res Sensory Visual Stream -> System 1 Intuitive World Model -> Gated Uncertainty Check -> System 2 Deliberative Planning -> Universal Action.",
        engineering_highlights: "奠定了通用人工智能下半场“视觉世界模型 + 符号语言推理”的双核演进范式，是全球前沿人工智能发展的旗舰纲领。"
      },
      en: {
        overview: "Google DeepMind's seminal 2026 White Paper establishing Visual General Intelligence (VGI) as the co-equal twin pillar alongside LLMs for true AGI.",
        key_steps: [
          "Dual-System Visual Architecture: System 1 intuitive 30Hz sensory world simulator paired with System 2 deliberate spatial reasoning.",
          "Multiverse Counterfactual Simulation: Rolls out parallel physical futures in latent space to verify causal consequences before action.",
          "Beyond Language Tokens: Proved that physical intuition, spatial navigation, and embodied causality require native visual-world grounding."
        ],
        computational_flow: "Sensory visual streams -> System 1 world simulation -> Uncertainty arbitration -> System 2 deliberative planning -> Actions.",
        engineering_highlights: "Defined the definitive blueprint for the next phase of frontier AI, unifying visual world simulation with deliberate cognition."
      }
    }
  }
};

function main() {
  const graphDataPath = path.join(__dirname, '../data/graph_data.json');
  const graphData = JSON.parse(fs.readFileSync(graphDataPath, 'utf8'));

  let updatedCount = 0;
  graphData.nodes.forEach(node => {
    if (CODE_DATA[node.id]) {
      const entry = CODE_DATA[node.id];
      node.github_url = entry.github_url;
      node.pseudocode = entry.pseudocode;
      node.code_explanation = entry.explanation;
      updatedCount++;
    } else {
      // Provide generic fallback if any
      node.github_url = "https://github.com/google-deepmind";
      node.pseudocode = `# DeepMind Research Implementation: ${node.title}\n# Module: ${node.primary_topic}\n# See official repository: https://github.com/google-deepmind\n`;
      node.code_explanation = {
        zh: {
          overview: `本论文《${node.title}》归属于 Google DeepMind 【${node.primary_topic}】研究方向。`,
          key_steps: [
            "输入与状态编码：多模态输入张量通过领域专用骨干网络提取高阶表征。",
            "核心优化循环：利用特定损失函数与策略目标迭代更新参数。",
            "验证与泛化：在标准基准环境中评估鲁棒性与超人类表现。"
          ],
          computational_flow: "Input -> Neural Backbone -> Objective Optimization -> Benchmark Verification.",
          engineering_highlights: "DeepMind 官方经典技术路线实现，详情可参见官方代码仓库与文献附录。"
        },
        en: {
          overview: `Paper "${node.title}" within Google DeepMind's ${node.primary_topic} division.`,
          key_steps: [
            "Input Representation: Multimodal states processed via domain-specific backbones.",
            "Core Optimization: Parameters updated iteratively against specialized objectives.",
            "Evaluation: Validated against standard benchmarks for robust generalization."
          ],
          computational_flow: "Input -> Deep Neural Network -> Loss Computation -> Optimization.",
          engineering_highlights: "Refer to official Google DeepMind research repositories for detailed reference implementations."
        }
      };
    }
  });

  console.log(`Enriched ${updatedCount} milestone nodes in graph_data.json`);

  // Write back to all destinations
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
