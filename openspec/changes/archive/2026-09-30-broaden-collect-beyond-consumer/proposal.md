## Why

The `collect` workflow's automated registry is ~7/9 consumer-voiced (6 app-review feeds + 1 forum RSS vs 2 regulator pages). Two taxonomy classes the collector prompt advertises (`hire_ducttape`, `labor` touchpoint) have zero carriers, and the consumer-heavy evidence is structurally mismatched to the synthesizer's own durability bar (20 customers × RM100/mo — near-impossible for consumer wallet complaints, trivial for SME compliance/ops pain). Without rebalancing, Hyfae mines where scraping is easy, not where willingness-to-pay lives, and downstream tensions/cards inherit the bias.

## What Changes

- Add ≥3 non-consumer Tier A/B sources to `models/@hyfae/fetcher/sources.yaml`, at least one carrying `hire_ducttape`/`labor` gravity and at least one seller-side or procurement source carrying firm-as-actor transaction gravity. Net roster target 10–12 entries; each addition verified HTTP 200 with non-empty excerpt.
- Reframe consumer evidence as symptom: collector prompt gains a trace-upstream instruction (each consumer complaint must name the merchant/operator counterparty who would pay), applied identically to both `extract-openrouter` and `extract-local` jobs.
- Protect minority signal with a per-class observation quota: of the max-10 observations, ≥2 must carry a non-`transaction` touchpoint (compliance or labor) or a non-consumer actor, else the run emits fewer consumer observations rather than filling the cap.
- Resolve orphaned taxonomy: either `hire_ducttape`/`labor` gain a live carrier in this change or they are removed from the collector prompt's advertised scope so the LLM stops hunting ghosts.
- Direct Tier C intake for one cycle: inbox guidance names the B2B probes wanted (contractor quotes, seller-group COD reconciliations, payroll-in-WhatsApp pastes) without changing the human-mediated `ingest_paste` policy.

## Capabilities

### New Capabilities

- `non-consumer-coverage`: registry rules for firm-as-actor sources (procurement, hiring-duct-tape, seller-side, regulatory-exhaust-v2, build-trail), per-class observation quota, consumer-as-symptom trace-upstream instruction, and orphaned-class resolution.

### Modified Capabilities

- `source-coverage`: breadth matrix gains a non-consumer dimension (hire_ducttape/labor must have a carrier; firm-as-actor transaction distinct from consumer transaction); roster target moves from 7–8 to 10–12; prompt-scope agreement extends to artifact-class claims.
- `source-quality-gate`: addition bar extends to non-consumer extract strategies (tender/job-board HTML shapes) and noise handling for spammy surfaces; failure-as-empty-page and excerpt-cap semantics unchanged.

## Impact

- `models/@hyfae/fetcher/sources.yaml`: 3–5 registry entries added (URLs, extract strategies, language/market/artifactClasses metadata).
- `extensions/models/fetcher.ts`: only if a new source needs a non-html/json/text strategy; `fetch_all` failure semantics unchanged.
- `workflows/workflow-collect.yaml`: collector system prompt edits (trace-upstream + quota + scope sync), applied identically to both extraction jobs.
- `docs/IMPLEMENTATION.md` §4 + `README.md`: roster rationale rewritten from new verdicts.
- Zero change to Tier C automation policy, thresholds v0, cap-3 promotion, or falsification gates.
