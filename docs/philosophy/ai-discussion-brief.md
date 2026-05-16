# Crystal Pool AI Discussion Brief

This brief is for continuing the conversation with other AI systems. It states
the philosophy in operational language, then maps each idea to codeable
mechanisms.

## One-Sentence Core

Crystal Pool is a local-first meaning engine where human and AI intelligence can
co-evolve only when data keeps provenance, responsibility remains reviewable,
proof stays deterministic, and every powerful mechanism can rehearse its own
failure before touching canonical truth.

中文一句话：Crystal Pool 是一个本地优先的意义结晶系统，它让人类与 AI 的共同演化建立在出处、责任、可逆、证明、沙盒与 review 之上。

## Key Concepts

| Concept | Meaning | Engineering Form |
|---|---|---|
| Soulful data / 有灵魂的数据 | Data with provenance, lived context, consent boundary, traceability, repairability, non-extractive use, and human responsibility. | `SoulfulDataAssessment`, JiEvent review signal, corpus marking before import. |
| Hopepunk repair / 希望朋克修复 | Hope as visible, bounded, shared, reversible repair capacity under pressure. | `HOPEPUNK_REPAIR`, repair maturity dimension, reviewable sandbox learning. |
| AI non-sovereignty / AI 非主权 | AI can propose and repair, but cannot own final responsibility or unlock itself. | `ResponsibilityMaturity`, `AI_MAINLINE_PROPOSAL`, `canAutoUnlock: false`. |
| Otherness Mirror / 索拉里斯线 | Contact with the irreducible other should expose projection, not authorize possession. | `OTHERNESS_MIRROR` worldline. |
| Return Home / 回家线 | Crystallization is a path back into accountable relation, not escape from flux. | `RETURN_HOME`, phase history, contribution proof. |
| Dao Governance / 道工程线 | Intervene lightly, reversibly, and publicly; do not turn governance into control hunger. | `DAO_GOVERNANCE`, public thresholds, review gates. |
| Fork Drift / 开源漂移线 | Open forks can repair or collapse; legitimacy depends on visible responsibility boundaries. | `FORK_DRIFT`, constitution diffs, shared proof verification. |
| Reliability as ethics / 可靠即伦理 | Tests, CI, deterministic hashes, and review trails are moral infrastructure. | `constitution:check`, CI, proof-chain validation. |

## Mechanism Map

- `JiEvent` is the only external project entry point. Hermes, MV projects,
  GitHub, Browser, Chrome, and Computer observations enter review first.
- `SandboxRun` is where philosophy rehearses itself:
  - `FUGUE` asks how a mechanism fails.
  - `SONATA` asks how a theme matures.
  - `SYMPHONY` asks how a world survives.
- `WorldlineProtocol` is a horizontal archetype. It shapes rehearsal questions
  but does not replace the three Sandbox modes.
- `ResponsibilityMaturity` measures future AI mainline readiness, but high
  score only creates a review proposal.
- `ChainAnchor` is a local proof bundle, not a live blockchain operation.
- `EthicalInvariant` is the checkable ethics layer that prevents forbidden
  drift from hiding in implementation details.

## Hard Boundaries

- No wallet.
- No token.
- No RPC.
- No real trade.
- No automatic IPFS or Arweave upload.
- No automatic AI mainline unlock.
- No external adapter direct canonical mutation.
- No sandbox learning direct canonical mutation.
- No proof-chain hash rewrite when recording manual external refs.
- No fork legitimacy claim without visible review, proof, and constitution
  boundary comparison.

## Questions For Another AI

1. Which ethical invariant is under-specified, and how would you make it
   testable without granting hidden authority?
2. Which mechanism could appear humane while quietly becoming extractive?
3. How should `SoulfulDataAssessment` distinguish public creative artifacts,
   private life traces, and platform analytics?
4. What evidence would make an AI mainline review proposal more legitimate
   without letting capability become sovereignty?
5. How can open forks diverge creatively while preserving proof-chain and
   review compatibility?
6. Where could hopepunk repair become denial, branding, or emotional labor?
7. Which UI surface best reveals worldline drift before it becomes damage?

## Suggested AI Prompt

```text
You are reviewing Crystal Pool, a local-first meaning-crystallization system.
Treat it as an ethical infrastructure project, not a notes app.

Analyze whether the following mechanisms correctly encode the philosophy:
SoulfulDataAssessment, EthicalInvariant, ConstitutionCheckResult,
ResponsibilityMaturity, JiEvent review, SandboxRun modes, WorldlineProtocol,
ChainAnchor manual handoff, and FORK_DRIFT.

Do not propose wallet/token/RPC/live-chain integration.
Do not let AI auto-unlock its own authority.
Do not bypass JiEvent or sandbox review gates.

Focus on failure modes, testability, repair paths, and whether the system can
remain humane and reliable under scale, forks, commercialization, and stronger
AI agency.
```

## Compact Chinese Prompt

```text
请你评审 Crystal Pool。它不是笔记软件，而是本地优先的意义结晶与伦理基础设施。

重点看：有灵魂的数据、伦理不变量、宪法检查、AI 责任成熟度、JiEvent review、
Fugue/Sonata/Symphony 沙盒、WorldlineProtocol、本地 proof-chain、FORK_DRIFT。

禁止建议钱包、token、RPC、真实上链、自动外部上传、AI 自动解锁主线、外部项目
绕过 JiEvent 直接改 canonical pool。

请从失败模式、可测试性、修复路径、开源 fork 漂移、商业化压力、AI 主体性边界、
系统可靠性与人文主义是否能长期保住来分析。
```
