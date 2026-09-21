## Why

The `collect-daily` extractor prompt claims scope MY/ID/TH/VN/PH, but the registry (`models/@hyfae/fetcher/sources.yaml`) covers only MY (5), ID (1), and PH (1). TH and VN are blind spots: friction in two large SEA markets never enters the bundle, so Loop 1 silently misses Thai/Vietnamese workarounds, queues, and policy shifts the prompt promises to catch.

## What Changes

- Add at least one TH and at least one VN Tier A (public GET) or Tier B (versioned/diffable) source to the registry, each with correct `language`, `market`, `artifactClasses`, and `extract` metadata.
- Verify each addition live (HTTP 200 + friction-bearing non-empty excerpt) before merge; reject any candidate that fails the existing source quality bar.
- Bound bundle growth: cap additions at 2–3 entries (net roster 9–10 max); `maxCharsPerSource: 20000` and max-10-observations caps unchanged.
- Keep the collector prompt scope line in sync in BOTH `extract-openrouter` and `extract-local` jobs of `workflow-collect-daily.yaml` (no scope narrowing; the claim stays MY/ID/TH/VN/PH once the registry earns it).
- No Tier C automation: walled platforms stay manual via `bin/inbox` → `ingest_paste`.

## Capabilities

### New Capabilities

- `th-vn-coverage`: TH + VN Tier A/B roster entries with per-source friction class, gravity touchpoint, and live-fetch verification.

### Modified Capabilities

- None (no specs in `openspec/specs/` yet; prior `justify-collect-source-coverage` specs are unarchived. This change extends that change's SEA-breadth requirement from "TH/VN/PH (one of)" to "TH and VN explicitly").

## Impact

- `models/@hyfae/fetcher/sources.yaml`: 2–3 registry additions (URLs, metadata); no removals.
- `extensions/models/fetcher.ts`: only if a TH/VN source needs a non-html/json extract strategy; `fetch_all` failure semantics unchanged.
- `workflows/workflow-collect-daily.yaml`: mechanical prompt-sync only if scope wording changes; twin-job sync rule applies.
- `docs/IMPLEMENTATION.md` §4 + `README.md` source lines: roster documentation update.
- Zero LLM-cost change: deterministic fetch edits only.
