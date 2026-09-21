## Why

`collect-daily` fetches 7 hard-coded Tier A/B signals, but no record justifies why those 7 earn their slots against the machine's intent (SEA friction with money in motion). Two prompt-scope claims (MY/ID/TH/VN/PH) are served by MY-only sources, tickers carry price without friction context, and the Lowyat homepage scrape likely yields front-page noise instead of workaround threads. Without a justification pass, Loop 1 risks silent misses and noisy observations that poison downstream tensions and cards.

## What Changes

- Audit each of the 7 registered sources against intent criteria (friction density, gravity provability, Tier A/B automatability, ToS safety) with a keep / fix / drop verdict.
- Fix `lowyat-network`: replace homepage scrape with thread-level surfaces (forum section pages or RSS/search) so excerpts show workaround and grey-market behavior, not front-page noise.
- Drop both Luno tickers outright: raw price snapshots carry no actor, workflow, or verbatim friction and cannot satisfy gravity-evidence rules. `price_asymmetry` goes dormant; no replacement sought.
- Add minimal non-MY SEA breadth (at least one ID and one TH or VN/PH Tier A/B source) or narrow the collector prompt scope to MY-only; prompt claim and registry must agree.
- Define a source quality bar for future additions: excerpt cap behavior, failure-as-empty-page semantics preserved, per-source friction class expectation, health check (HTTP 200 over 7-day window).
- No change to Tier C policy: walled platforms stay manual via `bin/inbox` → `ingest_paste`.

## Capabilities

### New Capabilities

- `source-coverage`: registry rules for breadth (market/tier/artifact-class matrix), thread-depth requirement, prompt-scope agreement, and the fixed 7-source roster with verdicts.
- `source-quality-gate`: per-source health and friction-density bar, fetch-failure semantics, and acceptance checks for adding or removing a source.

### Modified Capabilities

- None (no existing specs in `openspec/specs/`).

## Impact

- `models/@hyfae/fetcher/sources.yaml`: source roster edits (URLs, extract strategies, additions/removals).
- `extensions/models/fetcher.ts`: only if new extract strategies needed (e.g. RSS/forum parsing); `fetch_all` failure semantics unchanged.
- `workflows/workflow-collect-daily.yaml`: collector prompt scope line (SEA vs MY) kept in sync with registry.
- `docs/IMPLEMENTATION.md` §4: starter-source rationale rewritten from verdicts.
- Zero LLM-cost change: deterministic fetch edits only; extraction prompt wording sync covered as mechanical follow-through.
