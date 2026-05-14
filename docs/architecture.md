# Crystal Pool — Architecture v0.1

> 这份文档是 Crystal Pool 的**完整架构基线**。
> 它和 `crystal-pool-constitution.md` 配对：宪法定义"不做什么"，本文档定义"做什么、怎么做、什么时候做"。
> 任何冲突以宪法为准。

---

## 序言：三句存在前提

1. **思想不是文件。** 思想会流动、相变、矛盾、死亡、被身体限制。
2. **人不是用户。** 人有节律、有痛、有沉默、有离场权、有死亡。
3. **意义不是流量。** 意义需要摩擦、需要时间、需要被看见而不仅仅被点击。

整套架构都是为了让代码服从这三句话。

---

## Part I — 核心原则

### 1. 三货币防火墙

```
Signal       (秒级 / 流量)
Tide         (日级 / 配给)
Reputation   (月-年级 / 累积)
+ Witness    (秒级消耗 / 注意力)
+ Patience   (天-月级 / 时间锁)
+ Bond       (季度 / 抵押)
```

六者**永不互兑**。这是 1.5 宪法条款。

### 2. 摩擦哲学

现代 web 默认"摩擦是 bug"。Crystal Pool 反过来：**对意义的处理需要摩擦，但摩擦必须有方向**。

- Vesting 的摩擦阻碍瞬时操纵
- Decay 的摩擦阻碍永生囤积
- Steel-man 的摩擦阻碍廉价反对
- Delegation 的摩擦阻碍权力转让
- Pair Bonding 的摩擦阻碍假性共识

摩擦不是阻碍用户，**是阻碍捷径**。

### 3. 福利六层

| 层 | 保护什么 | 代表机制 |
|---|---|---|
| 配给 | 每天有声音的权利 | Daily Tide |
| 时间 | 不参与 / 低谷的权利 | Pulse, Hardship Fund |
| 空间 | 私密 / 退场的权利 | Sanctuary, Obscurity |
| 关系 | 互助 / 传承 / 和解 | Resonance, Carry, Apology |
| 可见 | 被看见的权利 | Right to Spotlight, Ancestor Beam |
| 仪式 | 集体停顿的权利 | Solstice, The Listening |
| 元层 | 系统自审的权利 | Self-Critique Cycle |

### 4. 身体主权

四条铁律（详见宪法第四章）：
- 可观察 ≠ 可强制
- 数据永远本地
- 否决永远有效
- 不假设默认身体

### 5. 开源双核

| 永远开源 | 可以闭源 |
|---|---|
| Crystal Graph | UI 主题 |
| Phase Engine | Cosmetic 资产 |
| Contribution Hash Chain | 企业 SLA |
| MeaningCluster Read Model | 托管运维工具 |
| Distribution Layer | |
| Scoring Algorithm | |

---

## Part II — 五层架构栈

```
┌──────────────────────────────────────────────────────┐
│ 7. Audit / Anchor       hash chain, snapshot, anchor │
├──────────────────────────────────────────────────────┤
│ 6. Flow Workbench       /flow + inspector + ledger   │
├──────────────────────────────────────────────────────┤
│ 5. Distribution Layer   Signal · Tide · Reputation   │ ← 福利与市场调和
│                         + Witness · Patience · Bond  │
├──────────────────────────────────────────────────────┤
│ 4. Cluster Read Model   deriveMeaningClusters()      │
├──────────────────────────────────────────────────────┤
│ 3. Crystal Graph        node / edge / phase / tag    │
├──────────────────────────────────────────────────────┤
│ 2. Contribution Layer   event hash chain + proposal  │
├──────────────────────────────────────────────────────┤
│ 1. Input / Corpus       residue, ChatGPT, JSONL      │
└──────────────────────────────────────────────────────┘
```

每层只能依赖下层。**第 5 层是市场和福利的唯一调和位置**——没有它，市场逻辑会污染 Cluster Read Model。

---

## Part III — 货币谱系

### Signal（信号）
- 类型：流量
- 来源：bid / ask / support / challenge / build_intent / fund_intent / verify / feedback
- 流速：秒级
- 隐喻：盘口价格
- 约束：受 Vesting 限制（72h 线性释放）

### Tide（潮汐）
- 类型：配给
- 来源：每日定额发放 + 公共补贴池拨付 + Catch-up 加成
- 流速：日级
- 隐喻：UBI
- 约束：当日不可累积超过 3 天上限（Pulse 机制）

### Reputation（声誉）
- 类型：累积
- 来源：被 verify 的贡献、Public Recant、被 Apology
- 流速：月-年级
- 隐喻：熟练度
- 约束：不可买卖，不可转移（Trustee 移交除外）；只解锁 cosmetic 不解锁数值特权

### Witness（见证）
- 类型：配给消耗
- 来源：每日 witnessBudget = 50 单位
- 流速：秒级消耗（消耗在"完整消化一个节点"上）
- 隐喻：注意力
- 约束：按"内容消耗深度"计入而非"停留时间"（Witness Equivalence）

### Patience（耐心）
- 类型：时间锁
- 来源：主动选择 Vesting 时长
- 流速：天-月级
- 隐喻：决心
- 档位：72h (1.0×) / 7d (1.3×) / 30d (1.8×) / instant (0.3× + 5× Tide 消耗)
- 约束：已投出不可缩短，只可延长

### Bond（抵押）
- 类型：抵押
- 来源：用 Reputation 作担保
- 流速：季度结算
- 隐喻：信用
- 约束：上限 = `reputation × 0.1`；只能用于 challenge；90 天验证窗口

---

## Part IV — 衍生品边界

### 允许的两种

**Forward（远期承诺）** — 现在承诺未来 N 天后做某次 review/verify。履约则提前生效，违约则未来 30 天 -50% 权重。这是对未来自己负责的工具。

**Pair Swap（配对调换）** — 在 tension_pair 节点上换边，付双倍 Tide，永久公开记录。这是公开承认改变想法的工具。

### 反衍生品 Defuse（拆弹）

当 cluster 的 `whaleConcentration > 0.6` 持续 48h，自动暂停 1h Signal 类操作（只接受 Witness/Tide），恢复后前 3 个 actor 在该簇上 -50% 权重 7 天。

### 永远禁止

Futures / Options / Leverage / Short Selling / Synthetic / Index / Liquidity Pool / AMM / Yield Farming。

判定准则：
> **可以加 = 让人对自己未来负责。**
> **不能加 = 让人押注他人行为。**

---

## Part V — 核心 12 条机制

这 12 条是 Crystal Pool 的不可压缩集。如果只有这些，池子仍然是池子。

### 1. Phase System（相变系统）

节点八种相态：
- `gas` 涨落
- `liquid` 流动想法
- `seed` 晶核
- `crystal` 稳定结晶
- `fossil` 僵化
- `dissolved` 解构
- `sanctuary` 临时受保护（14 天上限）
- `memorial` 已故 actor 节点的最终状态

每次相变记录 PhaseEvent → 进入 hash chain。

### 2. Decay & Bequest（衰减与遗赠）

节点 crystallization score 自然衰减，除非被 verify / build_intent / 交叉引用滋养。完全衰减归零的节点进入 `dissolved`，**它的关系边和 ha 注入遗赠给最强邻居**。

高 ha 节点衰减更慢；fossil 节点衰减加速。

### 3. Pair Bonding（矛盾配对）

两个 `contradicts` 关系且各自有 ≥ 5 个独立 verify 的节点，系统自动提议创建 `tension_pair` 容器节点。tension_pair 不解决矛盾，**容纳矛盾**——它本身就是一种结晶状态。

### 4. Vesting（时间释放）

所有 contribution 影响力**在 72h 内线性释放**而非瞬时。撤回免费但已释放部分不可追回。

副产品：`/flow` sparkline 自然有"未来形状"——可预测 48h 后簇的状态。

### 5. Three-Currency Firewall（三货币防火墙）

Signal / Tide / Reputation 永不互兑。无汇率、无兑换、无做市。这是宪法 1.5。

### 6. Daily Tide + Anti-Whale（每日潮汐 + 反鲸鱼）

- 每个 actor 每日固定 Tide 配额（不累积超 3 天上限）
- 同 actor 在同 cluster 连续操作权重指数衰减：1.0 → 0.5 → 0.25 → ...
- 每天午夜重置
- 新人首次 support 拿 1.5× catch-up

### 7. Dual Heatmap（双轨并列热力图）

`/flow` 必须并列两个视觉等价的热力图：

```
┌─────────────────┬─────────────────┐
│  Market Heat    │ Tide Spotlight  │
│  (hot money)    │ (welfare)       │
└─────────────────┴─────────────────┘
```

互不覆盖。市场逻辑不能视觉性地吃掉福利版面。

### 8. GraphEffectProposal（图谱效应提案）

ContributionEvent 不能直接 mutate CrystalEdge / Phase。流程：

```
ContributionEvent
  → deriveGraphEffectProposals()
  → review (人工或 deterministic gate)
  → applyGraphEffectProposal()
  → CrystalEdge / PhaseEvent / audit
```

Proposal 状态：`pending / accepted / rejected / superseded / applied`。

### 9. Steel-man Tax（最强复述税）

challenge 类贡献要拿满权重必须附带对被挑战节点的最强复述。被挑战节点的创建者本人有 24h 的"承认这是我的意思"按钮。承认 → 满权重；不承认 → 30% 权重保留。

支持便宜，反对昂贵。

### 10. The Body Knows（身体是知者）

任何 actor 对系统给出的身体相关推断可一键否决。否决一次，系统在该方向对该 actor 的自信永久 -10%。

否决数据**永远不**用于全局模型训练。系统只对这个具体的人变得更知趣。

### 11. Three-Tier Departure + Fork Right（三层离开 + 分叉权）

- **Pause**：暂停账户，数据保留，可回归
- **Withdraw**：撤离，节点移交 Trustee，30 天可撤销
- **Erase**：抹除，身份元数据密码学销毁，节点保留但作者变成"erased"，90 天 cooling off
- **Fork Right**：≥ 100 actor 群体可导出完整状态在新地址启动独立池子，原池子保留 `forked_to` 同步链接

这是宪法级权利。

### 12. Self-Critique Cycle（系统自审周期）

每 90 天系统自动生成自我批判报告：
- 哪些规则触发最多/被绕过最多
- 哪些 actor 群体感受被边缘化
- 哪些机制可能伤害福利

报告**作为节点**进入池子，可被 review、challenge、build_intent。规则修改提案必须以这份报告为前提。

这是池子用自己处理自己——自指机制。

---

## Part VI — 完整机制清单（70+ 条索引）

### F2P 兜底层（10 条）
| # | 机制 | 阶段 |
|---|---|---|
| F1 | Daily Tide Drop | v0.1 ⭐ |
| F2 | Anti-Whale Diminishing Returns | v0.1 ⭐ |
| F3 | Catch-up Bonus | v0.1 ⭐ |
| F4 | Quiet Voice Floor | v0.1 ⭐ |
| F5 | Dual Heatmap | v0.1 ⭐ |
| F6 | Cosmetic-Only Tier | v0.1 |
| F7 | Progressive Trust (anti-Sybil) | v0.1 |
| F8 | Public Subsidy Pool | v0.2 |
| F9 | Circuit Breaker (Siege Protection) | v0.2 |
| F10 | Co-Curation Guild | v0.3 |

### 福利六层（15 条）
| # | 机制 | 层 | 阶段 |
|---|---|---|---|
| W1 | Pulse (累积配给) | 时间 | v0.2 |
| W2 | Resonance Match (软导师) | 关系 | v0.2 |
| W3 | Hardship Fund (低带宽期) | 时间 | v0.2 |
| W4 | Sanctuary Phase (受保护节点) | 空间 | v0.1 ⭐ |
| W5 | Gift Tide (定向赠予) | 关系 | v0.2 |
| W6 | Tide Solidarity (集体声援) | 关系 | v0.2 |
| W7 | Carry Edge (背负之边) | 关系 | v0.2 |
| W8 | Solstice (至点停顿) | 仪式 | v0.3 |
| W9 | Season Theme (季题) | 仪式 | v0.3 |
| W10 | Ancestor Beam (先祖之束) | 可见 | v0.3 |
| W11 | Public Recant (公开撤回) | 修复 | v0.3 |
| W12 | Apology Edge (致歉之边) | 关系 | v0.3 |
| W13 | Right to Spotlight (新人保证) | 可见 | v0.2 |
| W14 | Obscurity Mode (隐居模式) | 空间 | v0.3 |
| W15 | Self-Critique Cycle (元层自审) | 元 | v0.1 ⭐ |

### 身体感知层（12 条）
| # | 机制 | 阶段 |
|---|---|---|
| B1 | Body Clock Anchor (节律) | v0.3 |
| B2 | Cumulative Engagement Limit | v0.2 |
| B3 | Pulse Sync (心率) | v1.0 |
| B4 | Soft Disconnect (软断网) | v0.2 |
| B5 | Conflict Cooling (冲突降温) | v0.2 |
| B6 | Heartbreak Pause (心碎暂停) | v0.2 |
| B7 | Audio-First Mode | v0.2 |
| B8 | Haptic Subtle | v0.3 |
| B9 | Eye-Strain Aware Layout | v0.3 |
| B10 | Cyclical Awareness (通用周期) | v0.3 |
| B11 | Chronic Mode (长期低带宽) | v0.2 |
| B12 | The Body Knows (元机制) | v0.1 ⭐ |

### 多样性层（7 条）
| # | 机制 | 类别 | 阶段 |
|---|---|---|---|
| D1 | Sensory Translation (双等效) | 能力 | v0.2 |
| D2 | Witness Equivalence | 能力 | v0.2 |
| D3 | Cognitive Load Marking | 能力 | v0.3 |
| D4 | Time Compass (时区) | 能力 | v0.3 |
| D5 | Language Floor | 语言 | v0.3 |
| D6 | Translation Bridge | 语言 | v0.3 |
| D7 | Polyglot Bonus | 语言 | v1.0 |

### AI Actor 层（3 条）
| # | 机制 | 阶段 |
|---|---|---|
| A1 | AI Rights Matrix (权利谱) | v0.2 |
| A2 | Mother Signature (母签名) | v0.2 |
| A3 | AI Forbidden Zones (禁入区) | v0.2 |

### 退出与死亡（5 条）
| # | 机制 | 阶段 |
|---|---|---|
| E1 | Three-Tier Departure | v0.1 ⭐ |
| E2 | Trustee Mechanism | v0.2 |
| E3 | Memorial Phase | v0.2 |
| E4 | Death Verification | v0.3 |
| E5 | Inheritance Edge | v0.3 |

### 治理与修复（5 条）
| # | 机制 | 阶段 |
|---|---|---|
| G1 | Dispute Resolution (陪审) | v0.3 |
| G2 | Fork Right (分叉权) | v0.1 ⭐ |
| G3 | Time Capsule (时间胶囊) | v1.0 |
| G4 | Ambient Health (环境指标) | v0.2 |
| G5 | The Listening (倾听日) | v1.0 |

### 核心机制（5 条 + 已并入上述）
| # | 机制 | 阶段 |
|---|---|---|
| C1 | Vesting | v0.1 ⭐ |
| C2 | Decay & Bequest | v0.1 ⭐ |
| C3 | Steel-man Tax | v0.2 |
| C4 | Delegation | v0.3 |
| C5 | Pair Bonding | v0.2 |

⭐ = 核心 12 条之一

### 希腊字母层（α/β/γ/θ：12 条；ν：10 条；ρ：17 条）

α/β/γ/θ 简表见 Part XI。ν 完整清单见 Part XII。ρ 完整清单见 Part XIII。

| 字母 | 关键机制数 | 优先级最高 |
|---|---|---|
| α | 1 | Public Alpha Mandate (v0.2) |
| β | 5 | Negative Beta Protection ⭐ (v0.2) |
| γ | 3 | Critical Phase Alert ⭐ (v0.2) |
| θ | 3 | 已部分并入 sanctuary/memorial |
| ν | 10 | Re-entry Ritual ⭐⭐ + Asymmetric Undo ⭐ + Do No Harm Check |
| ρ | 17 | Frenzy Detector ⭐⭐ + Counter-Cyclical Tide ⭐⭐ + Pool Heartbeat ⭐ |

---

## Part VII — 路线图

### v0.1 — 最小可生存的池子（核心 12 条）
> 目标：一个能跑、能体现核心精神的雏形。

**核心 12 条（v0.1 不可压缩集）：**
1. Phase System (8 相态)
2. Decay & Bequest
3. Vesting
4. Three-Currency Firewall (Signal/Tide/Reputation)
5. Daily Tide + Anti-Whale + Catch-up + Quiet Voice + Cosmetic-Only
6. Dual Heatmap
7. GraphEffectProposal
8. The Body Knows
9. Three-Tier Departure + Fork Right
10. Self-Critique Cycle (基础版)
11. **Asymmetric Undo (ν-B5)** —— 兜底愤怒 challenge，宪法 4.5 + 8 章的实现
12. **Do No Harm Check (ν-B6) + Pool Phase Awareness Skeleton (ρ-M1+V2 最小子集)** —— 元层守门人；前者守"伴侣不是治疗师"，后者守"池子是生命体"

**附加（v0.1 必备的支撑）：**
- Sanctuary Phase (W4)
- Crystal Graph 完整数据模型
- ContributionEvent hash chain
- MeaningCluster read model (deriveMeaningClusters)
- /flow 基础 UI（双 heatmap + cluster 选择联动 + Pool Phase 标签）
- ClusterInspector
- Local anchor bundle

**v0.1 减法说明（与原版差异）：**
- Pair Bonding → v0.2（tension_pair 很美但非生存必需）
- Steel-man Tax 完整版 → v0.2（基础"challenge 需附复述"可做，但权重折扣机制延后）
- ν-B5 Asymmetric Undo 升入核心（兜底"反对昂贵"+"愤怒退路"，比 Steel-man 更基础）
- ν-B6 Do No Harm Check 升入核心（防止后续机制污染宪法精神）
- Pool Phase Awareness 骨架升入核心（把"池子是生命体"做成可见数据，不只是哲学口号）

**不做：**
所有 v0.2/v0.3/v1.0 机制。

### v0.2 — 变得有人情味
> 目标：池子开始能"承认人不是机器"+"承认池子是生命体"。

**新增（货币与核心机制）：**
- Witness 货币
- Patience 货币
- Pair Bonding (从 v0.1 降级，C5)
- Steel-man Tax 完整版（从 v0.1 降级，C3）
- Pulse / Hardship Fund / Carry / Resonance Match / Gift Tide / Tide Solidarity (W1, W3, W7, W2, W5, W6)
- Right to Spotlight (W13)
- Public Subsidy Pool / Circuit Breaker (F8, F9)

**新增（身体感知）：**
- Cumulative Engagement Limit / Soft Disconnect / Conflict Cooling / Heartbreak Pause / Audio-First / Chronic Mode (B2, B4, B5, B6, B7, B11)
- Sensory Translation / Witness Equivalence (D1, D2)

**新增（AI / 退出 / 治理）：**
- AI Rights Matrix / Mother Signature / Forbidden Zones (A1, A2, A3)
- Trustee / Memorial Phase (E2, E3)
- Ambient Health (G4)

**新增（希腊字母层）：**
- Public Alpha Mandate (α-1)
- Negative Beta Protection ⭐ (β-2)
- Independence Index (β-1)
- Critical Phase Alert ⭐ (γ-1)
- Theta Surface / Theta Bonus for Late Save (θ-1, θ-2)

**新增（ν 创伤敏感系统完整化）：**
- Asymmetric Vega Detection (ν-A1)
- Recent Wound Multiplier (ν-A2)
- Re-entry Ritual ⭐⭐ (ν-B1)
- Healing Carry (ν-B2)
- Witness Without Judgment (ν-B3)

**新增（ρ 集体节奏系统完整化）：**
- Pool Tempo Vector ⭐ (ρ-M1，从 v0.1 骨架升级到完整 6 维)
- Phase Detection Algorithm (ρ-M2)
- Frenzy Detector ⭐⭐ (ρ-M3)
- Pool Heartbeat ⭐ (ρ-V1)
- Phase Naming (ρ-V2，从 v0.1 骨架升级)
- Counter-Cyclical Tide ⭐⭐ (ρ-C1)
- Tempo Brakes ⭐ (ρ-C2)

### v0.3 — 变得有文化
> 目标：池子有自己的仪式、文化、修复机制。

**新增（货币 + 衍生品）：**
- Bond 货币 + Forward / Pair Swap / Defuse 衍生品

**新增（仪式与文化）：**
- Solstice / Season Theme / Ancestor Beam / Obscurity Mode (W8, W9, W10, W14)
- Public Recant / Apology Edge (W11, W12)
- Co-Curation Guild (F10)

**新增（身体感知扩展）：**
- Body Clock / Haptic / Eye-Strain / Cyclical Awareness (B1, B8, B9, B10)
- Cognitive Load / Time Compass (D3, D4)

**新增（跨语言 / 死亡 / 争议）：**
- Language Floor / Translation Bridge (D5, D6)
- Death Verification / Inheritance Edge (E4, E5)
- Dispute Resolution (G1)
- Delegation 完整版

**新增（希腊字母层扩展）：**
- High-Beta Tax / Beta-Adjusted Reputation / Echo Chamber Detector (β-3, β-4, β-5)
- Gamma Patience Discount / Anti-Cascade Buffer (γ-2, γ-3)

**新增（ν 系统扩展）：**
- Trauma Cascade Detection (ν-A3)
- Vega Baseline Memory (ν-A4)
- The Steward Role (ν-B4)

**新增（ρ 系统扩展）：**
- Personal Pulse 私有视图 (ρ-V3)
- Capitulation Stimulus (ρ-C3)
- Accumulation Patience Bonus (ρ-C4)
- Post-Frenzy Reflection ⭐⭐ (ρ-H1)
- Healing Days (ρ-H2)
- Pool Age-Aware Calibration (ρ-D3)

**新增（战锤暗流对策，由 Part XIV §6 派生）：**
- **Bond Half-Life**：连续多次 Bond 失败的 actor 下次 Bond 上限自动减半，3 次失败禁用 6 个月（防"职业审判官"，对冲战锤暗流 6.1）
- **Frenzy 季度上限**：同季度内 Frenzy Watch 触发 ≤ 3 次，否则走 Self-Critique 紧急议题（防"永恒戒严"，对冲战锤暗流 6.2）
- **Protection Saturation 红线**：sanctuary + Hardship + Chronic Mode 占总活跃 actor > 30% → Self-Critique 紧急议题；问"为什么这么多人在受伤"，**不降低保护**（防 Eldar 路径，对冲战锤暗流 6.3）
- **Fork Reunion Path**：双方 ≥ 70% actor 支持可发起合并提案；保留双侧完整 hash chain，节点级冲突进入 tension_pair（防"永恒分裂"，对冲战锤暗流 6.4）

**新增（沙盒生态启动准备）：**
- 创建 `crystal-fugue/` 仓库（v0.0 初版）；详见 [`fugue-vision.md`](fugue-vision.md)
- 起步包含：本愿景文档、Pool 宪法副本、time-compressor + scenario-loader 骨架、Bond Inquisition + Eldar Path 两个起步场景、replay recorder

### v1.0 — 变得自我审视
> 目标：池子有完整的元层、文化层、深度。

**新增（身体 / 文化）：**
- Pulse Sync (心率) (B3)
- Polyglot Bonus (D7)
- Time Capsule (G3)
- The Listening (G5)
- Self-Critique Cycle 完整版（含规则修改流程）
- 完整 hash chain browser
- 完整 anchor verification UI

**新增（ρ 深度机制）：**
- Anniversary Witness (ρ-H3)
- Sentiment Epidemic Tracking (ρ-D1，需先有 8.5/7.1 危险线检查)
- Decision Quality Backtest (ρ-D2)

**新增（v1.0+ 联邦化）：**
- Federated Tempo Awareness (ρ-D4，需先有真实多池子部署)

---

## Part VIII — 代码组织

### 顶层模块布局

```
src/
├── lib/
│   ├── crystal-graph/
│   │   ├── node.ts              # CrystalNode + 8 phases
│   │   ├── edge.ts              # CrystalEdge + 关系类型
│   │   ├── phase-event.ts       # PhaseEvent
│   │   └── decay.ts             # Decay & Bequest
│   ├── meaning-clusters/
│   │   ├── derive-clusters.ts   # 核心：deriveMeaningClusters()
│   │   ├── explain-cluster.ts   # ClusterExplanation
│   │   ├── cluster-types.ts
│   │   ├── cluster-metrics.ts
│   │   └── cluster-history.ts   # sparkline + momentum
│   ├── distribution/             # ⭐ 第 5 层
│   │   ├── currencies/
│   │   │   ├── signal.ts
│   │   │   ├── tide.ts
│   │   │   ├── reputation.ts
│   │   │   ├── witness.ts
│   │   │   ├── patience.ts
│   │   │   └── bond.ts
│   │   ├── policy-gate.ts       # anti-whale, catch-up, sybil 闸门
│   │   ├── subsidy-pool.ts
│   │   ├── circuit-breaker.ts
│   │   └── firewall.ts          # 三货币防火墙不变量
│   ├── contributions/
│   │   ├── canonicalize-event.ts
│   │   ├── hash-event.ts
│   │   ├── derive-graph-effects.ts
│   │   └── apply-graph-effect.ts
│   ├── market/
│   │   ├── derive-market-depth.ts
│   │   ├── derive-market-prints.ts
│   │   ├── run-market-tick.ts
│   │   ├── verify-snapshot.ts
│   │   └── verify-anchor.ts
│   ├── flow/
│   │   ├── flow-query-state.ts
│   │   ├── flow-filters.ts
│   │   └── flow-view-model.ts
│   ├── body-aware/               # 身体感知层
│   │   ├── body-knows.ts
│   │   ├── soft-disconnect.ts
│   │   └── conflict-cooling.ts
│   ├── trauma-aware/              # ⭐ ν 系统（Part XII）
│   │   ├── vega-detection.ts      # vega_up / vega_down 非对称
│   │   ├── wound-marker.ts        # recent wound + baseline memory（私有）
│   │   ├── trauma-cascade.ts      # 高 ν 事件辐射圈
│   │   ├── re-entry-ritual.ts     # 24h 缓冲 + 摘要
│   │   ├── healing-carry.ts
│   │   ├── judgment-free.ts       # Witness Without Judgment
│   │   ├── steward.ts
│   │   ├── asymmetric-undo.ts
│   │   └── do-no-harm-check.ts    # 9 问 deterministic 检查表
│   ├── pool-rhythm/               # ⭐ ρ 系统（Part XIII）
│   │   ├── tempo-vector.ts        # 6 维节奏向量
│   │   ├── phase-detection.ts     # Accumulation/Activation/Frenzy/Capitulation
│   │   ├── frenzy-detector.ts     # 提前预警
│   │   ├── pool-heartbeat.ts      # 视觉心跳
│   │   ├── counter-cyclical.ts    # 反周期 Tide
│   │   ├── tempo-brakes.ts        # 三道刹车
│   │   ├── healing-days.ts
│   │   ├── post-frenzy-reflection.ts
│   │   └── age-aware-calibration.ts
│   ├── exit/
│   │   ├── three-tier-departure.ts
│   │   ├── trustee.ts
│   │   └── fork-right.ts
│   └── governance/
│       ├── self-critique.ts
│       ├── dispute-resolution.ts
│       └── constitution-check.ts # 宪法约束运行时检查
└── app/
    ├── flow/
    │   ├── page.tsx
    │   └── components/
    │       ├── DualHeatmap.tsx
    │       ├── ClusterInspector.tsx
    │       ├── MeaningTape.tsx
    │       ├── MeaningDOM.tsx
    │       ├── MarketPrints.tsx
    │       └── FlowGraphPanel.tsx
    ├── market/
    │   ├── runs/[runId]/page.tsx
    │   └── anchors/[digest]/page.tsx
    ├── ledger/                   # hash chain browser
    │   └── page.tsx
    └── api/
        ├── flow/snapshot/route.ts
        ├── flow/cluster/[clusterId]/route.ts
        ├── market/runs/route.ts
        └── contribution-effects/route.ts
```

### 关键架构约束

1. **每层只能依赖下层**
   `/flow` 只能消费 `meaning-clusters/*`，不能直接查 Prisma。

2. **三货币防火墙是不变量**
   `firewall.ts` 提供 `assertNoCrossCurrencyConversion()`，所有涉及货币的操作必须通过它。

3. **宪法运行时检查**
   `governance/constitution-check.ts` 在每个关键操作前断言宪法条款。
   例：`assertNoAdminOverride()`, `assertBodyDataLocal()`, `assertPublicGovernance()`.

4. **Cluster 不物化为表**
   `MeaningCluster` 是 deterministic derivation，不建专门的数据库表，避免过早锁定语义。

5. **AI 隔离**
   AI actor 走独立的 `actor.kind = 'ai'` 标记，所有 AI 操作通过 `ai-actor/gate.ts` 强制经过 Forbidden Zones 检查。

---

## Part IX — 开源治理

### 仓库结构（双核模型）

```
crystal-pool/                     # 核心仓库（永远开源 / MIT or Apache 2.0）
├── core/                         # 不可闭源
│   ├── crystal-graph
│   ├── phase-engine
│   ├── meaning-clusters
│   ├── distribution
│   ├── contributions
│   └── governance
├── reference-ui/                 # 参考 UI（开源）
└── docs/
    ├── constitution.md
    └── architecture.md          # 本文档

crystal-pool-hosted/              # 商业托管版（可闭源）
├── themes/
├── cosmetics/
├── enterprise-sla/
└── ops-tools/
```

### 贡献流程

1. **DCO 签名**（不是 CLA）—— 贡献者保留版权
2. **Issue → Discussion → RFC → PR**：大改动必须先发 RFC，由社区 review
3. **每个 PR 必须**：
   - 不违反宪法任何条款（CI 检查）
   - 不违反三货币防火墙（CI 检查）
   - 通过 deterministic test（不允许"偶尔失败"）

### 集体共创流程（链内）

新机制提案的标准路径：

```
1. 以节点形式进入池子（kind = build_intent）
   ↓
2. 公开 review (≥ 5 个独立 verify)
   ↓
3. 进入 Self-Critique Cycle 或 Dispute Resolution
   ↓
4. 宪法符合性自动检查
   ↓
5. 如通过，作为 RFC 合入仓库
   ↓
6. 实现 + PR + DCO
```

这个流程意味着：**Crystal Pool 的演化本身使用 Crystal Pool**。

### Fork Right 的实操化

```
1. 任何 ≥ 100 actor 的群体提出 Fork Intent (kind = fork)
2. 30 天公示期
3. 期间任何 actor 可附议或异议（异议需 Bond 抵押）
4. 公示期结束，触发 export pipeline:
   - 完整 Crystal Graph dump
   - 完整 hash chain
   - 完整 anchor 历史
   - 完整代码 fork（github mirror）
5. 新池子在独立地址启动
6. 原池子内所有相关节点添加 forked_to 边
7. 两池子从此独立演化
```

这是**代码级保障**，不是哲学口号。

---

## Part X — 度量与红线

### 健康指标（Ambient Health 上线后实时显示）

| 指标 | 健康范围 | 红线 |
|---|---|---|
| Diversity Index | ≥ 60 | < 40 |
| Whale Concentration | ≤ 0.4 | > 0.6 |
| Tide Flow Health | ≥ 70% 配额被使用 | < 30% |
| Recent Apology Count (30d) | 任何 > 0 | 长期 = 0 |
| AI Contribution Ratio | ≤ 30% | > 50% |
| Sanctuary Usage | 偶发 | 急剧上升 = 警示 |

任何指标越红线 → 自动触发 Self-Critique Cycle 紧急议题。

### 永久红线（不可越过）

**金钱与权力类：**
- 任何"用钱直接换权重"的提案 → 违反 1.5
- 任何"AI 自动改 phase"的提案 → 违反 5.4
- 任何"管理员一键删除节点"的提案 → 违反 5.2 + 2.1
- 任何"心率数据上传"的提案 → 违反 2.6 + 4.2
- 任何"无限滚动 / 推荐黑箱"的提案 → 违反 3.2 + 3.5

**评分透明类（α 红线）：**
- 任何"私有评分函数 / 个性化加权 / 黑箱模型"的提案 → 违反 3.2（把 alpha 私有化等于把 alpha 武器化）

**异见保护类（β 红线）：**
- 任何"按热度排序而忽略 cluster_beta"的提案 → 违反 3.2 + 5.5（让同温层吃掉异见）

**脆弱性类（ν 红线）：**
- 任何"无 vega 缓冲就放大波动"的提案 → 违反 4.5 + 8.2
- 任何"按个人脆弱程度排序"的提案 → 违反 8.3
- 任何"以受伤之名免责攻击"的提案 → 违反 8.5

**集体节奏类（ρ 红线）：**
- 任何"顺周期加杠杆 / 顺 Frenzy 推热门"的提案 → 违反 7.2（央行式独裁干预）
- 任何"识别个人作为 Frenzy 超级传播者"的提案 → 违反 7.1（群体监视）
- 任何"以 Pool Phase 为由禁止某类操作"的提案 → 违反 7.3（用集体压制个人）

**家长主义类：**
- 任何"系统主动诊断用户心理状态并提供建议"的提案 → 违反 4.5（伴侣不是治疗师）

---

## Part XI — 希腊字母透镜（Greek Letter Lens）

### 方法论

Crystal Pool 的 crystallization score 在数学上是一个 alpha 模型。但伦理上**反转**：

> 量化用希腊字母**度量风险**以**避开**它。
> Crystal Pool 用同一组希腊字母**识别风险**以**主动承担**它（用福利去兜）。

每个希腊字母对应一种"风险敞口"，每种敞口暗示一种"福利杠杆"。

### 完整对应表

| 希腊字母 | Crystal Pool 含义 | 暗示的福利杠杆 |
|---|---|---|
| α (alpha) | 节点结晶度（多因子合成分） | 公共化披露（评分函数 + 因子权重 + IC 全部公开实时可查） |
| β (beta) | 节点 score 跟随 cluster avg 的程度 | 反同温层（负 β 优先 spotlight / 高 β 抽税 / β 调整 Reputation） |
| γ (gamma) | 节点对单条贡献的敏感度（相变临界点） | 临界点干预（Critical Phase Alert / Patience 折扣 / 反雪崩缓冲） |
| θ (theta) | 节点价值随时间衰减率 | 临终关怀（Theta Surface / Late Save Bonus / sanctuary 抗衰减豁免） |
| ν (vega) | 节点对 cluster volatility 的敏感度 | 创伤敏感设计（详见 Part XII） |
| ρ (rho) | 节点对 Pool Patience 的敏感度 | 集体节奏调控（详见 Part XIII） |

### 关键洞察：所有 alpha 信号都被系统化纠偏

普通 alpha 信号 → Crystal Pool 反应：

```
低 Witness 但持续被 carry 的节点
  → 量化：买入信号
  → Crystal Pool：自动 spotlight

高 Signal 但低 verification depth 的簇
  → 量化：做空信号
  → Crystal Pool：自动熔断

高 ha tension 的 fossil 簇
  → 量化：long volatility
  → Crystal Pool：抽反教条税
```

**结论**：在 Crystal Pool 里，alpha 不是用来抢的，是用来让的。

### 希腊字母层机制清单

| 字母 | # | 机制 | 阶段 |
|---|---|---|---|
| α | α-1 | Public Alpha Mandate | v0.2 |
| β | β-1 | Independence Index | v0.2 |
| β | β-2 | **Negative Beta Protection** ⭐ | v0.2 |
| β | β-3 | High-Beta Tax | v0.3 |
| β | β-4 | Beta-Adjusted Reputation | v0.3 |
| β | β-5 | Echo Chamber Detector | v0.3 |
| γ | γ-1 | **Critical Phase Alert** ⭐ | v0.2 |
| γ | γ-2 | Gamma Patience Discount | v0.3 |
| γ | γ-3 | Anti-Cascade Buffer | v0.3 |
| θ | θ-1 | Theta Surface | v0.2 |
| θ | θ-2 | Theta Bonus for Late Save | v0.2 |
| θ | θ-3 | Theta-Resistant Phase | v0.1（已隐含于 sanctuary/memorial） |

ν 和 ρ 因为内容太丰富，分别在 Part XII / Part XIII 单独展开。

---

## Part XII — ν 系统：创伤敏感设计

### 总章：池子是伴侣，不是治疗师

宪法 4.5 规定的元约束。任何 ν 机制必须服从：

- ❌ 诊断 + 处方："你看起来抑郁了"
- ✅ 陈述 + 缓冲："你这小时第 3 次对同一人 challenge 了。30 分钟后才发出，期间可撤回。"

### ν 的四个层次

```
Pool ν       (整池脆弱性)
  └─ Cluster ν  (簇脆弱性)
       └─ Node ν    (节点脆弱性)
            └─ Actor ν  (人的脆弱性)
```

每一层独立的探测 / 即时保护 / 长期保护 / 恢复机制。

### ν 的四个性质

| 性质 | 含义 | 对应机制 |
|---|---|---|
| **非对称** | 向上波动 vs 向下波动伤害不同 | #ν-A1 Asymmetric Vega Detection |
| **路径依赖** | 同样冲击对不同经历者伤害不同 | #ν-A2 Recent Wound Multiplier |
| **传染** | 高 ν 会让周围也变高 ν | #ν-A3 Trauma Cascade Detection |
| **记忆** | 经历过的事会留下永久基线变化 | #ν-A4 Vega Baseline Memory（私有字段） |

### ν 系统机制清单

**性质机制（4 条）：**

| # | 机制 | 阶段 | 说明 |
|---|---|---|---|
| ν-A1 | Asymmetric Vega Detection | v0.2 | vega_up 和 vega_down 独立追踪；Spotlight Warning（突然的成功也是 stressor） |
| ν-A2 | Recent Wound Multiplier | v0.2 | 30 天 wound 标记 → 攻击者 vesting 自动延长 + Steel-man 强度提升 |
| ν-A3 | Trauma Cascade Detection | v0.3 | 高 ν 事件辐射圈内自动 secondary protection 24h |
| ν-A4 | Vega Baseline Memory | v0.3 | 私有字段，永远不归零，永远不用于全局训练 |

**新增机制（6 条）：**

| # | 机制 | 阶段 | 说明 |
|---|---|---|---|
| ν-B1 | **Re-entry Ritual** ⭐⭐ | v0.2 | Hardship/Sanctuary/Pause 回归后 24h 缓冲 + 温和摘要 + "I'm ready" 按钮 |
| ν-B2 | Healing Carry | v0.2 | 专门 carry recent_wound 节点；获得 +3 Reputation + cosmetic "Healer of X" |
| ν-B3 | Witness Without Judgment | v0.2 | judgment-free 节点（不能 support/challenge/verify，只能 Witness 和非评价 review） |
| ν-B4 | The Steward Role | v0.3 | 预先指定的代理人，在 Hardship/Heartbreak 期内代为应答 challenge |
| ν-B5 | **Asymmetric Undo** ⭐ | v0.1 | challenge 30 天免费撤回；support 24h；judgment-free 永久可改；sanctuary 期反对追溯免疫 |
| ν-B6 | The "Do No Harm" Check | v0.1 | 10 问 deterministic 检查表，所有新机制提案必过 |

### "Do No Harm" Check（10 问）

每个新机制提案在进入 Self-Critique Cycle 之前必过：

1. 这个机制能让一个脆弱用户经历比现在更糟的事吗？
2. 这个机制有"快速退出"通道吗？
3. 这个机制对创伤累积敏感吗？（路径依赖）
4. 这个机制对突然的关注/攻击有保护吗？（非对称）
5. 这个机制会传染到关联用户/节点吗？（级联）
6. 这个机制假设了"健康基线"用户吗？（基线记忆）
7. 这个机制有 re-entry buffer 吗？
8. 这个机制能被攻击者武器化吗？
9. 这个机制对 judgment-free 内容尊重吗？
10. **群星-战锤光谱测试**：这个机制鼓励"赢"还是"共存"？它能在系统中区分"敌人"吗？它有没有 happy ending 路径？它的失败模式是慢慢消解还是突然崩坏？如果它在群星-战锤光谱上偏向战锤，它如何对冲？（详见 Part XIV §6）

任何一题答"是问题"，提案被退回修改。第 10 问是 v0.2 加入，由 Part XIV 精神坐标支撑。

### ν 的 5 条危险线

宪法第八章已明文化。简列：

1. 不让脆弱性证书化（ν 状态不增强攻击）
2. 不让脆弱性家长主义化（必须有"我不需要保护"按钮）
3. 不让脆弱性内卷化（baseline_vega 私有，无受伤排行榜）
4. 不让保护变成停滞（所有保护有时间上限）
5. 不让脆弱性武器化（ν 只减弱攻击，不豁免攻击）

### 完整 ν 矩阵（4 层 × 4 阶段）

```
                探测            即时保护         长期保护         恢复
Actor ν     Cumulative      Soft Disconnect   Chronic Mode    Re-entry Ritual
            Conflict Cool   Hardship Fund     Obscurity       Apology Edge
            Body Sensors    Heartbreak Pause  Steward         Public Recant
            Wound Marker    Spotlight Warn    Baseline Memory

Node ν      5+ challenges   Sanctuary Phase   permanent       Healing Carry
            30% drop        Circuit Breaker   Sanctuary       Asymmetric Undo
            Sanctuary req   Tide Solidarity   judgment-free   resurrection

Cluster ν   Whale Conc      Defuse            Co-Curation     Cluster Recovery
            Defuse trigger  Quiet Voice       Guild           (7-day soft period)

Pool ν      (Pool Storm     Storm Mode        ——             Post-Storm
             Detector)                                          Reflection
```

跨层元机制：Trauma Cascade Detection / The "Do No Harm" Check.

---

## Part XIII — ρ 系统：集体节奏

### 总章：池子是生命体

宪法第零章第四句明文化。Crystal Pool 是一个三层嵌套的生命：节点层 / actor 层 / pool 层。每一层都有自己的相变 / 健康 / 受伤 / 治疗 / 死亡。

### Pool ρ 的四种状态

参照市场周期 + SIR 模型 + Wyckoff 阶段：

| 状态 | 特征 | 健康表现 | 病理表现 |
|---|---|---|---|
| **Accumulation** 积累期 | 高 Patience / 低 Velocity / 低 challenge | 深度沉淀 | 停滞 |
| **Activation** 激活期 | 中 Patience / 中 Velocity / 多线程 | 思想的春天 | 散乱 |
| **Frenzy** 狂热期 ⚠️ | 极低 Patience / 极高 Velocity / 高 Concentration | 罕见 | bubble / 围攻潮 / 信息瀑布 |
| **Capitulation** 崩溃期 | Patience 反弹但被动 / 大量 dissolved | 反思期 | 集体抑郁 |

健康池子在 **Accumulation ↔ Activation** 之间低频振荡。Frenzy 和 Capitulation 都是病态。

### Pool Tempo Vector（6 维）

```
Patience Index    avg vesting 档位
Velocity          contribution events / hour
Concentration     top 5% 节点收到的 contribution / 总数
Variance          contribution 在 cluster 间的分布熵
Wound Density     wound + Hardship + Sanctuary 占总 actor 比例
Recovery Rate     上一周期 wound 转 healed 的速度
```

每小时计算一次，形成时间序列。多维签名 → Pool Phase 分类。

### ρ 系统的四阶段

```
1. 测量    Sense the rhythm
2. 显式    Make rhythm visible
3. 调节    Counter the swing
4. 治疗    Heal the collective
```

### ρ 系统机制清单

**测量阶段（3 条）：**

| # | 机制 | 阶段 |
|---|---|---|
| ρ-M1 | Pool Tempo Vector ⭐ | v0.2 |
| ρ-M2 | Phase Detection Algorithm | v0.2 |
| ρ-M3 | **Frenzy Detector** ⭐⭐ | v0.2 |

**显式阶段（3 条）：**

| # | 机制 | 阶段 |
|---|---|---|
| ρ-V1 | **Pool Heartbeat** ⭐ | v0.2 |
| ρ-V2 | Phase Naming | v0.2 |
| ρ-V3 | Personal Pulse（私有） | v0.3 |

**调节阶段（4 条）：**

| # | 机制 | 阶段 |
|---|---|---|
| ρ-C1 | **Counter-Cyclical Tide** ⭐⭐ | v0.2 |
| ρ-C2 | **Tempo Brakes** ⭐ | v0.2 |
| ρ-C3 | Capitulation Stimulus | v0.3 |
| ρ-C4 | Accumulation Patience Bonus | v0.3 |

**治疗阶段（3 条）：**

| # | 机制 | 阶段 |
|---|---|---|
| ρ-H1 | **Post-Frenzy Reflection** ⭐⭐ | v0.3 |
| ρ-H2 | Healing Days | v0.3 |
| ρ-H3 | Anniversary Witness | v1.0 |

**深度机制（4 条）：**

| # | 机制 | 阶段 | 说明 |
|---|---|---|---|
| ρ-D1 | Sentiment Epidemic Tracking | v1.0 | 只追踪情绪轨迹，不指向个人（宪法 7.1） |
| ρ-D2 | Decision Quality Backtest | v1.0 | 集体决策质量数据，验证 ρ 调节是否有效 |
| ρ-D3 | Pool Age-Aware Calibration | v0.3 | 阈值随池龄自适应；只放宽/收紧不改机制 |
| ρ-D4 | Federated Tempo Awareness | v1.0+ | 多池子间互相订阅 ρ 但内容独立（与 Fork Right 联动） |

### Counter-Cyclical Tide（核心调节工具）

```
Phase            Tide 倾斜方向
──────────────────────────────────────────
Accumulation  →  high-velocity 节点（鼓励激活）
Activation    →  long-tail 节点（防止集中度过早形成）
Frenzy Watch  →  low-velocity 节点（让慢内容稳住）
Frenzy ⚠️     →  暂停所有市场倾斜，全部转入冷却节点 + sanctuary
Capitulation  →  活跃 actor 的新节点（重启激活）
```

### Tempo Brakes（Frenzy 期三道刹车）

Frenzy Detector 触发时同时启用：

1. **Vesting Floor**：所有新 contribution vesting ≥ 7 天，instant 通道关闭
2. **Bond Premium**：Bond 抵押需要 2× Reputation
3. **Steel-man Strict**：Steel-man 复述要求权重折扣从 30% 降到 50%

Frenzy Watch 解除时一起松开。

### ρ 的 4 条危险线

宪法第七章已明文化：

1. 不监视个人节奏（只看聚合数据）
2. 不做央行式独裁干预（阈值公开可改）
3. 不用集体节奏压制个人（Pool Phase 不直接限制操作）
4. 不做阶段决定论（命名保留模糊空间，可被 Dispute 挑战）

### 跨池 ρ：联邦节奏（远期）

通过 Fork Right 产生的池子之间可选择互相订阅 ρ：
- 看到对方的 Tempo Vector
- 看到对方的当前 Pool Phase
- 但**不**看到对方的具体内容

这把 Crystal Pool 的最终形态指向**池子群岛**——多个池子各自有节奏，但通过节奏感知互相影响。这是开源/分叉精神在 ρ 层的延伸。

---

## Part XIV — 精神坐标（Spiritual Compass）

> 前面 14 部分回答"做什么、怎么做、什么时候做"。这一部分回答**为什么**。
>
> 它不是机制清单。它是一个**精神免疫系统**——让 Crystal Pool 在每次架构决策时知道自己属于哪条线、不属于哪条线、走偏时怎么校准。

### 1. 总章：Crystal Pool 是 Hopepunk 的工程化

2017 年 Alexandra Rowland 提出三种文学姿态的对立：

- **Grimdark（暗黑/战锤）**：世界是坏的，所以战斗是唯一选项。
- **Noblebright（光明史诗）**：世界是好的，英雄会拯救它。
- **Hopepunk（希望朋克）**：世界很复杂，**温柔本身是反抗**。

Hopepunk 的核心姿态：
- 不天真——知道世界有恶
- 不犬儒——但拒绝把恶当成借口
- 不英雄——拯救来自集体而不是个人
- 不暴力——温柔、修复、重建是核心动作
- 不必然——失败可能，但仍然尝试

代表作品：Becky Chambers《Wayfarers》系列、《Schitt's Creek》、《Steven Universe》、宫崎骏《风之谷》《幽灵公主》。

**Crystal Pool 是 hopepunk 的工程化。** 这不是审美选择——是设计哲学的归属。

它的姊妹运动 **Solarpunk** 同样反对暗黑必然论，但更聚焦在**与生态共存**的具体技术形式（社区花园、可修复硬件、合作社、本地优先）。Crystal Pool 的"本地优先"正是 solarpunk 精神延伸到意义生产。

### 2. 群星 vs 战锤光谱

战锤 40K 和群星 (Stellaris) 是两种科幻设计哲学的极端。

| 维度 | 战锤 40K | 群星 |
|---|---|---|
| 核心命题 | "未来只有战争" | "多文明共存的银河" |
| 冲突模式 | 零和 | 联邦 + 退出 |
| 道德设定 | 没有绝对善 | 多种伦理共存 |
| 衰败观 | 必然腐朽 | 可被避免 |
| Happy ending | 不存在 | 存在路径 |
| 失败模式 | 末日狂欢 | 慢慢消解 |
| 对待异见 | 净化 | 容纳 |

**Crystal Pool 全部站队群星**：
- 三货币不互兑 → 拒绝零和
- tension_pair → 容纳对立
- Decay & Bequest → 衰败是代谢不是腐败
- Self-Critique → 自审不是末世
- Fork Right → 退出而非战争

宪法第零条第三句"意义不是流量"——直接反对战锤式的零和注意力争夺。
宪法 5.5「不优化正确」——直接反对战锤式"我方为善对方为恶"。
宪法 8.5「不让脆弱武器化」——直接反对战锤式"用受害者身份合理化攻击"。
宪法 7.4「不做阶段决定论」——直接反对战锤式必然衰败的宿命论。

### 3. 近亲谱系（5 条）

Crystal Pool 在文学/产品/历史上的最近邻居：

#### 3.1 Iain M. Banks — Culture 系列

最强结构相似度。后稀缺、跨星系、AI 与人类共存的乌托邦。Minds（超级 AI）做后台运维但**绝不替人决定意义**。

| Culture | Crystal Pool |
|---|---|
| 物质后稀缺，已解决分配 | 注意力稀缺，必须设计分配（Tide / Vesting / Anti-Whale） |
| Minds 做大部分判断 | 人做大部分判断（宪法 5.4） |
| 任何文明可选择不加入 | Three-Tier Departure + Fork Right |

Culture 是 Crystal Pool 的**理想终点**。Crystal Pool 是 Culture 的"前传"——还在通往后稀缺的过程中。推荐读《Look to Windward》——其中对集体哀悼的工程化描写几乎一一对应 ν 系统。

#### 3.2 Ursula K. Le Guin —《一无所有》

Anarres 是真正运转起来的无政府工团主义月球社会。没有钱、没有政府、没有所有权——但有 syndicate（工团）、roster（轮值）、Computer（资源调度）。

- 不承认私有意义 ↔ α 公开评分（不承认私有评分）
- 轮值 ↔ 反鲸鱼边际衰减
- "True journey is return" ↔ Re-entry Ritual (ν-B1)
- 对内部腐败的警惕 ↔ Self-Critique Cycle

Le Guin 的诚实：**它运转，但不完美**。这是 Crystal Pool 必须保持的清醒。

#### 3.3 集合啦动森 / 星露谷物语

少数把"福利兜底而不依赖竞争"做成商业成功的产品。

| 共鸣 | 动森 / 星露谷 | Crystal Pool |
|---|---|---|
| 没有 PvP | 默认无"打败别人" | challenge 必须 steel-man |
| 季节循环 | 钓鱼/虫子按季节 | Solstice + Season Theme |
| 真正的死亡 | 树会死、村民会搬走 | Decay & Bequest |
| 慢就是设计 | 一年 365 天等下个春天 | Vesting 72h 释放 |

最大启示：动森证明"非零和游戏"可商业成功。Crystal Pool 试图把这种精神扩展到**多人协作的意义生产**——这是真正没人做过的实验。

#### 3.4 Mastodon / ActivityPub 联邦

Crystal Pool 的 **Fork Right + Federated Tempo Awareness** 几乎就是 Mastodon 精神延伸到意义池子。

差别：
- Mastodon 联邦是**社交关系**的；Crystal Pool 联邦是**节奏感知 + hash chain 共享**的
- Mastodon 互信靠管理员 vouching；Crystal Pool 互信靠**可验证 anchor digest**

如果想看 Crystal Pool 5 年后的样子，看 Mastodon 现在。然后**把它的所有失败模式**（实例倒闭、管理员暴政、moderation 不一致）反过来做对策——你就有了 Crystal Pool 的下半部分路线图。

#### 3.5 维基百科

最强的开源治理现实参照。维基的 **edit war 解决机制 + RFC + ArbCom（仲裁委员会）** 几乎一比一对应 Crystal Pool 的 **Pair Bonding + Self-Critique Cycle + Dispute Resolution**。

但维基有 Crystal Pool 想避免的两个问题：
- 删除主义 vs 包容主义内战 → Crystal Pool 用 Decay & Bequest 避开（节点不删除，自然衰减）
- 管理员阶层化 → Crystal Pool 用宪法 2.1（不设管理员）+ 6.6（Fork Right）避开

最重要的经验：维基用 25 年证明了"开放协作能产生质量内容"——但**只在一个非常窄的内容类型上**（百科条目）。Crystal Pool 想扩展到更广的"意义类型"——这是巨大的赌注。

### 4. 远亲谱系（4 条）

精神共鸣，结构差异较大但血脉相通：

| 线 | 共鸣点 |
|---|---|
| **道家**（《老子》36 章 + 41 章） | "将欲歙之，必固张之" = Vesting / Defuse / Tempo Brakes 的中文版。"反者道之动" = ha 退火。"上善若水" = Tide。 |
| **Stafford Beer 的 Viable System Model（控制论）** | 任何"可生存系统"必须有 5 个子系统：操作 / 协调 / 控制 / 智能 / 政策。Crystal Pool 的 7 层栈一比一对应。Beer 在智利 Allende 政府试过，被政变中断——血泪教训。 |
| **罗伯特议事规则**（Robert's Rules of Order） | 美国国会 150 年用的议事规则。核心：少数派权利不可压制、议程透明、发言时间公平。Crystal Pool 治理层（Self-Critique / Dispute Resolution）的祖师爷。 |
| **怀特海过程哲学** | "一切都是过程，不是实体（substance）"。节点不是"东西"，是**事件流的当前快照**。Phase System + Decay & Bequest 的形而上学。 |

### 5. 反例清单（必须避免变成谁）

每条都是 Crystal Pool 必须**避免像它**的：

| 反例 | 失败模式 | 我们的对策 |
|---|---|---|
| **Westworld 西部世界** | AI 觉醒成新主体 | 宪法 2.2 AI 永远是工具不是公民 |
| **Black Mirror 黑镜** | 每个技术放大人性最坏 → 必然 dystopia | Do No Harm Check 10 问 |
| **Brave New World 美丽新世界** | 用幸福药 + 娱乐消除痛苦 → 强制开心 | 宪法 4.5 伴侣不是治疗师；不诊断不开药 |
| **1984** | 用监视 + 真理部强制统一 → 强制正确 | 宪法 5.5 不优化"正确"；7.1 不监视个人节奏 |
| **Snow Crash / 头号玩家** | VR 变成新一层资本主义 → 元宇宙陷阱 | 宪法 1.1-1.7 七条关于金钱的禁令 |
| **Idiocracy** | 没有摩擦 + 短期奖励 → 整个文明降级 | 摩擦哲学是核心原则 |

这 6 条反例**全部覆盖了"科技乌托邦"项目最常见的腐败路径**。能完整避开它们的项目至今几乎没有。Crystal Pool 想做第一个。

### 6. 4 条战锤暗流 + 对策

虽然主线是群星，但有 4 条战锤暗流必须警惕：

#### 6.1 Bond + 押注式反对 → "审判庭"

**风险**：Bond 让"押声誉发起 challenge"成为可能。文化偏移会让社区变成**互相审判的法庭**。

**已有对策**：Steel-man Tax + Asymmetric Undo + Apology Edge + 宪法 8.5。

**新增对策（v0.3 加入）**：
- **Bond Half-Life**：连续多次 Bond 失败的 actor，下一次 Bond 上限自动减半，连续 3 次失败 → 6 个月禁止再用 Bond。防止形成"职业审判官"。

#### 6.2 Defuse / Tempo Brakes → "戒严"

**风险**：自动熔断 + 自动减速反复触发 → 形成"集体进入戒严"的习惯感。慢慢变成"任何活力都会被怀疑"。

**已有对策**：Counter-Cyclical Tide 在 Activation 期主动鼓励 high-velocity；Pool Age-Aware Calibration。

**新增对策（v0.3 加入）**：
- **Frenzy 季度上限**：同一季度内 Frenzy Watch 不能触发超过 3 次。否则池子已生病，要走 Self-Critique 紧急议题，而不是机械减速。

#### 6.3 Sanctuary / Hardship 常态化 → "永恒哀悼"

**风险**：如果一个池子里大部分活跃节点都在 Sanctuary 或大部分 actor 都在 Chronic Mode——它在精神上就死了。这是 Eldar 的命运：**为了不再受伤而拒绝活着**。

**已有对策**：Hardship Fund 60 天上限 / 每年 2 次；Sanctuary 14 天上限。

**新增对策（v0.2 加入 Ambient Health 时）**：
- **Protection Saturation 红线**：sanctuary + Hardship + Chronic Mode 占总活跃 actor 比例 > 30% → 自动触发 Self-Critique 紧急议题。**不是降低保护**，是问"为什么这么多人在受伤"。

#### 6.4 Fork Right + Federated ρ → "永恒分裂"

**风险**：Fork Right 是宪法级权利绝对不能动。但用得太频繁会让 Crystal Pool 变成战锤里"分裂的人类亚种"——每个亚种觉得自己是真正的"人类"，互相鄙视，永不合并。

**已有对策**：`forked_to` 边永久保留。

**新增对策（v0.3 加入）**：
- **Fork Reunion Path**：两个 forked 池子可以通过双方 ≥ 70% actor 的支持发起合并提案，合并保留两侧完整 hash chain，节点级冲突进入 tension_pair。这是群星里"重新组建联邦"的精神，反战锤"分裂即永恒"。

### 7. Crystal Fugue：战锤的合法位置

战锤思维不是要从 Crystal Pool 中清除——是要**给它一个隔离的演练场**。

> **真实的人不只活在群星里。人也需要演练战锤——演练冲突、演练失败、演练腐败、演练"不温柔"的代价。但那些演练不该在真实的池子里发生。那些应该发生在沙盒里。**

这个沙盒叫 **Crystal Fugue**。完整愿景见 [`docs/fugue-vision.md`](fugue-vision.md)。简列：

#### 7.1 三角生态（用赋格术语重组）

```
                    Pool
                  (Subject)
                     ▲
                    ╱ ╲
                   ╱   ╲
                  ╱     ╲
              Fugue    Hosted
            (Answer)  (Concert Hall)
            counterpoint  performance
              variation     venue
```

- **Pool** 提出主题
- **Fugue** 在所有可能变形下检验主题（增值 / 缩减 / 倒影 / 逆行）
- **Hosted** 把主题演奏给世界听

三者共享 `crystal-pool/lib/`，分别负责**真实性、教育性、商业性**。

#### 7.2 Fugue 的 4 条设计原则

1. **共享代码，独立部署**——Fugue 用 Pool 的 lib/ 加一层 `lib/forge/`
2. **Fugue 数据永远不能流入 Pool**——`actor.id` 强制 `fugue:` 前缀；Pool 拒绝任何 `fugue:` 导入
3. **永远开源 + 永远免费**——教育沙盒不能被卖给有钱人
4. **"邪恶模式"必须明确标注**——红色横幅提醒"这是沙盒；这些行为在主线会被宪法拒绝"

#### 7.3 5 个教育场景（v0.0 backlog）

| 场景 | 演练什么 |
|---|---|
| The Bond Inquisition | 审判庭如何形成；Bond Half-Life 机制由此诞生 |
| The Eldar Path | 过度保护 = 精神死亡 |
| The Bubble | 社区如何被 viral 话题腐蚀；学生体验"想绕过 Tempo Brakes 的诱惑" |
| The Heist | 红队演练：让一个 actor 试图把声誉转给自己 |
| The Inquisition | 角色扮演 Imperium Inquisition；学生发现 Asymmetric Undo / Steel-man / Sanctuary 让审判几乎不可能 |

每个场景结束自动生成**复盘节点**，可作为 build_intent 进入 Pool 主线。

#### 7.4 Fugue 在离开光谱上的位置

```
Soft Disconnect    Pause       Withdraw   Erase    Fugue       Fork Right
   30 min     ←  reversible →  30-day  ← 90-day → temp leave  permanent
                                              entry to       split
                                              sandbox
```

Fugue 是离开光谱中**唯一期待回归**的层级。Erase 是不回归（终极个人离场），Fork 是不回归（终极集体离场），Fugue 是**临时离场然后回来**——对应心理学 fugue state 的工程化。

#### 7.5 Fugue 的存在意义

> **每一个声称"我们要建一个好系统"的项目，最终都失败在创始团队没有亲历过坏的版本。**

Yelp 没想到会被刷分。Twitter 没想到会被政治极化。Mastodon 没想到 instance admin 会暴政。维基没想到删除主义和包容主义会内战。

它们都是**理想主义者从未见过自己的系统失败的样子**。

Crystal Fugue 让创始人、维护者、研究者、社区**亲眼看见 Crystal Pool 失败的所有方式**——在沙盒里，反复，可控地。

> **战锤不是 Pool 的反面。战锤是 Pool 的免疫训练。**

这是 Crystal Pool 比所有前辈项目都可能更长寿的原因。

### 8. 群星-战锤光谱测试（Do No Harm 第 10 问）

每个新机制提案要过这 4 个子问：

| 子问 | 群星答 | 战锤答 |
|---|---|---|
| 这个机制鼓励"赢"还是"共存"？ | 共存 | 赢 |
| 这个机制能区分"敌人"吗？ | 不能/模糊 | 能/锐利 |
| 这个机制有 happy ending 路径吗？ | 有 | 没有 |
| 这个机制的失败模式是什么？ | 慢慢消解 | 突然崩坏 |

**像群星答 → 加。像战锤答 → 退回 Do No Harm 重写或拒绝。**

灰色地带（部分群星、部分战锤）：要求提案**显式说明对冲战锤面的方法**——例如："本机制的战锤面是 X，对冲方法是 Y。"

这条测试不是审美裁决——它是**精神免疫系统的运行时检查**。

### 9. 一句话收尾

> **温柔不是软弱，温柔是工程。**
>
> Crystal Pool 是一首永远未完成的赋格——主题在被反复变形、检验、回归。Bach 的《赋格的艺术》在最后一首戛然而止，未完成本身就是作品。Crystal Pool 同样：没有 v1.0 的终点，只有 Self-Critique Cycle 永远在跑、Fugue 永远在变奏、主题永远在重新被理解。

---

## Part XV — 一句话定义

> **Crystal Pool 是一个本地优先的意义结晶引擎，把碎片、对话残差、相变、关系、贡献、模拟盘口、福利分配、身体感知、退出权和分叉权组织成一个可观察、可审计、可解释、可修复、可逃离的意义市场。它不是笔记软件，不是交易系统，不是 AI 黑箱，不是社交平台。它是一个让思想从残差进入、通过摩擦结晶、在福利兜底中被看见、在身体节律中被尊重、在矛盾中被容纳、在集体节奏中被陪伴的池子。**

它处理三层嵌套的生命：节点 / actor / pool。每一层都会相变、会受伤、会愈合。
它用希腊字母谱（α/β/γ/θ/ν/ρ）作为统一框架——把量化金融的工具反向使用：度量风险**不是**为了避开，而是为了主动用福利兜住。
它是池子里的伴侣，不是治疗师。

---

## 附录 A — 引用宪法

完整宪法见 `crystal-pool-constitution.md`。

如果架构和宪法冲突，**以宪法为准**。

## 附录 B — 词汇表

| 术语 | 含义 |
|---|---|
| Actor | 池子中的参与者（人或 AI） |
| CrystalNode | 意义碎片 / 概念 / 句子 / 灵感 |
| CrystalEdge | 节点间关系（resonates_with / contradicts / triggers / derives_from / hardens_into / dissolves_into / ha_softens / carries / translates_to / inherits_from / forked_to） |
| Phase | 节点的相态（gas/liquid/seed/crystal/fossil/dissolved/sanctuary/memorial） |
| ContributionEvent | 贡献事件（support/challenge/review/verify/build_intent/fund_intent/fork/feedback/recant） |
| MarketOrder | 模拟盘口订单（bid/ask/support/challenge） |
| GraphEffectProposal | 市场事件 → 图谱变更的中间提案 |
| ChainAnchor | 本地 anchor bundle（hash chain 锚点） |
| MeaningCluster | 簇 read model（按 tag 聚合的意义单元） |
| ha | 退火 / 反教条机制（防止概念硬死） |
| 机 | 相变发生的契机（PhaseEvent 的本体论名） |

## 附录 C — 文档版本

- **v0.1**：本文档创建（与宪法配对）—— 5 层栈 + 6 货币 + 核心 12 条 + F2P/福利/身体感知/多样性/AI/退出/治理共 70+ 条机制
- **v0.2**：加入希腊字母透镜（Part XI）+ ν 创伤敏感系统（Part XII）+ ρ 集体节奏系统（Part XIII）—— 共增加 41 条机制 + 9 条危险线 + 1 条元洞察（"池子是生命体" → 宪法零章 + "伴侣不是治疗师" → 宪法 4.5）
- **v0.3**：加入 Part XIV 精神坐标（Hopepunk 总章 + 群星 vs 战锤光谱 + 5 条近亲谱系 + 4 条远亲谱系 + 6 条反例 + 4 条战锤暗流对策 + Crystal Fugue 沙盒生态指引 + 第 10 问光谱测试）；Do No Harm Check 从 9 问扩到 10 问；新增姊妹愿景文档 [`fugue-vision.md`](fugue-vision.md)。原 Part XIV 一句话定义顺移为 Part XV。
- 修改历史以 PhaseEvent 进入 hash chain
