## Context

`records.promote` (`extensions/models/records.ts:566-689`) is deterministic: filter `verdict==alive` + empty `invariantViolations`, rank panel-disagreement first, cap 3, render markdown into `digest-*`, exported by `bin/digest` to `reports/`. Upstream store already holds monetizable facts — observation `actor/workflow/friction/gravity{monthlyCostEst,touchpoint,evidence}/rawExcerpt/sourceRef`, tension `costBearer/expectation/reality/enablingShift{whatChanged,date}/unaddressedReason`, synthesis `mechanism/mechanismSourceDomain` — but the renderer only emits `mechanism` (truncated), `unawarenessAffirmative`, `durability`, `priorArt` JSON, panel lines, `structuralBarriers`, and a raw `swamp model ... ingest` command. Result (W40): sociology essay, no buyer, no price, no product. Stakeholder: operator doing ≤15-min weekly review; secondary: anyone the operator forwards the markdown to.

## Goals / Non-Goals

**Goals:**
- Reader answers in <2 min per card: who hurts, what breaks, money size, what to sell, why now, why gap persists, what to do next.
- Zero jargon in reader view; machine vocabulary (`alive/mirage`, `convergedObvious`, verdicts, raw JSON, swamp CLI) confined to operator appendix.
- Money + traceability joined deterministically from existing records — no new LLM dependency for the base win.
- Backward compatible: old cards/syntheses without new buyer fields still render.

**Non-Goals:**
- No scoring/ranking change (cap-3 + panel-convergence order untouched).
- No store mutation semantics change (append-only, deadletter contract untouched).
- No per-stage cost budgets, no embedding dedup, no probe automation (tracked gaps elsewhere).
- No second-model panel diversity (proposal Fix 4 stays future).

## Decisions

**1. Two-section digest: reader view first, operator appendix second (over single-section rewrite).**
Renderer emits per card: plain-language reader block, then one `<details>`-style fenced appendix (or `## Operator notes` section at file end when markdown host lacks HTML). Rationale: operator still needs falsification/panel/feedback command for calibration; hiding it entirely would break the review ritual. Alternative (two separate files) rejected — doubles export paths in `bin/digest` and splits the shareable artifact.

**2. Deterministic upstream join in `promote` (over asking LLM to restate money).**
`promote` already receives `candidates` (syntheses via `data.findBySpec`). Extend CEL wiring in `workflow-synthesize.yaml` promote step to also pass `tensions: data.findBySpec("records","tension")` and `observations: data.findBySpec("records","observation")`; build lookup maps by id in TS and resolve `synthesis.tensionIds → tension.observationIds → observation`. Fall back to `"unknown"` per field, never throw. Rationale: money facts are already validated in the store; re-asking the LLM duplicates source of truth and burns tokens. Alternative (LLM-written money line) kept only as fallback prose when join misses.

**3. Small backward-compatible schema additions (over breaking CardSchema).**
Add optional fields to `SynthesisSchema.falsification`: `priceTest {seats:number, priceRM:number, who:string}` (all optional/defaulted), `firstBuyers: string[]` (default `[]`), `wedge: string` (default `""`). Add optional display helpers to `CardSchema`: `whoPays`, `painRM`, `whyNow`, `offering` (all optional, renderer-computed, not LLM-required). Rationale: `ingest_text` with zod defaults keeps old prompts valid; missing = "unknown" in render, no deadletter spike. Breaking alternative (required money fields) rejected — would deadletter every existing synthesis on re-ingest.

**4. Prompt nudge in both `falsify` jobs, byte-synced (over single-provider edit).**
Extend both `synthesize-openrouter/falsify` and `synthesize-local/falsify` system prompts with: emit `priceTest` (20×RM100 plausibility as numbers), `firstBuyers` (3 concrete buyer types), `wedge` (one-sentence smallest sellable thing). Keep temperature/tokens unchanged. Rationale: repo invariant — twin jobs must stay in sync or one provider goes stale. This is the documented gotcha in AGENTS.md.

**5. Plain-language rules enforced in renderer, not prompt (over prompt-only tone).**
Renderer applies: sentence-case buyer names, one number per money line (`~RM X/mo`, source: excerpt), ban list for reader view (`alive`, `mirage`, `convergedObvious`, `falsification`, `invariantViolations`, raw JSON arrays). Prior art rendered as `N similar tries: <plain names>` with names shortened (drop `e.g.` clauses). Rationale: prompts drift; renderer is deterministic and testable via `PROVIDER=none` smoke.

## Risks / Trade-offs

- [Stale twin prompt] → Mitigation: edit both `falsify` blocks in one change; verify with `diff` of the two system contents minus backend names.
- [Join misses on thin store] → Mitigation: per-field `"unknown"` fallback + `Trace: partial` flag; renderer never crashes on missing tension/observation.
- [LLM ignores new optional fields] → Mitigation: acceptable — renderer falls back to observation gravity + mechanism text; no deadletter since fields optional.
- [Digest grows longer] → Mitigation: reader block capped (~12 lines/card: 6 answers + quote + next step); appendix holds the rest. Cap-3 bounds total length.
- [Threshold tuning temptation] → Mitigation: thresholds stay `hypothesis:true`; this change alters presentation + join plumbing only, not gates (verdicts, cap, dormancy rules untouched).
