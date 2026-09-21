## Context

`collect-daily` (Loop 1) runs `sources.fetch_all` over the registry in `models/@hyfae/fetcher/sources.yaml` (7 entries, `maxCharsPerSource: 20000`), bundles raw excerpts, and runs one cheap LLM extraction pass (twin jobs `extract-openrouter` / `extract-local`, kept in sync) producing ≤10 friction observations with mandatory economic gravity. The collector prompt claims scope MY/ID/TH/VN/PH, but all 7 sources are MY-only. The fetcher contract (`extensions/models/fetcher.ts`) emits raw verbatim excerpts, records failures as empty pages (`status: 0`, non-fatal), and Tier C never enters except via `ingest_paste`. Last verified state: 7/7 starter sources HTTP 200 (`docs/IMPLEMENTATION.md` §3). Thresholds v0 are `hypothesis: true` and owned by `redteam-monthly` — untouched here.

## Goals / Non-Goals

**Goals:**
- Publish a per-source keep / fix / drop verdict for all 7 signals, each tied to a friction class and a gravity path (touchpoint + evidence).
- Fix thread-depth for Lowyat, resolve the raw-ticker problem, and close the SEA-scope gap (registry and prompt agree).
- Define a reusable quality bar so future source additions are judged, not improvised.

**Non-Goals:**
- No threshold or gate tuning (gravity fields, cap-3, mirage rules stay `hypothesis: true`).
- No Tier C automation; `ingest_paste` path unchanged.
- No embedding dedup, panel diversity, or cost-budget work (known v0 gaps, separate changes).
- No new workflow; registry + prompt-sync edits only, plus docs.

## Decisions

**D1 — Keep both regulators (`lhdn-einvois`, `bnm-notices`, Tier B).**
Versioned, diffable, low-volume high-conviction. Each guideline revision is a dated policy_shift with a compliance touchpoint and deadline-driven spend — the cleanest gravity path in the registry. Alternative (drop B as slow-moving) rejected: slowness is the point; regulatory shock creates deadline demand competitors cannot time.

**D2 — Keep both app-review RSS feeds (Shopee MY, TNG eWallet, Tier A).**
Public GET, stable RSS, wallets-open users filing free feature requests. Maps to workaround / queue / ritual with transaction-touchpoint gravity (failed payments, COD reconciliation, payout queues). Alternative (Play Store scraping) rejected: ToS grey zone and fragility; iTunes RSS already verified 200.

**D3 — Fix `lowyat-network`: homepage → thread-level surfaces.**
The homepage (`https://www.lowyat.net/`) yields front-page noise, not the BM/EN workaround and grey-market discourse the source is registered for. Replace with forum thread-listing surfaces (section indexes), keeping `language: ms`, `market: MY`, classes `[workaround, grey_market]`. Alternative (drop Lowyat) rejected: it is the only local-language forum surface and the sole grey_market carrier. Exact section URLs resolved at implementation time against the quality bar (Open Questions).

**D4 — Drop both Luno tickers, no replacement.**
A price snapshot has no actor, no workflow, no verbatim friction quote — it cannot satisfy `rawExcerpt` verbatim-quote or gravity-evidence rules. A number alone never shows money in motion. Decision: remove both ticker entries outright; no corridor-price replacement is sought in this change. `price_asymmetry` goes dormant until a future change admits a behavior-bearing carrier through the quality bar.

**D5 — Expand breadth to match the prompt's SEA claim (add ≥2 non-MY sources).**
The prompt promises MY/ID/TH/VN/PH; the registry delivers MY-only. Narrowing the prompt to MY would be honest but surrenders stated intent, so expand instead: add ≥1 ID and ≥1 TH/VN/PH Tier A/B source at implementation time, chosen against the quality bar with live-200 verification. Cap additions at 2–3 to bound bundle size and noise. Alternative (narrow prompt to MY-only) is the documented fallback if no non-MY source passes the bar.

**D6 — No `fetcher.ts` contract change; failure semantics preserved.**
`fetch_all` fan-out, one `page` per source plus `bundle`, empty-page-on-failure, 20k char cap, and twin-job prompt-sync rule all stay. Only if a new source needs a non-html/json strategy does `extract` gain a value — otherwise code untouched. Prompt edits (if scope line changes) applied identically to both `extract-openrouter` and `extract-local` jobs.

**D7 — No gate/threshold changes.**
Gravity fields, dormant-not-killed, mirage→graveyard, cap-3 promotion remain exactly as-is. Any tuning waits for a `redteam-monthly` memo.

## Risks / Trade-offs

- [Risk] Forum thread pages block scraping (anti-bot, JS walls) → Mitigation: verify HTTP 200 + non-empty excerpt at implementation; on failure fall back to forum RSS/search endpoints; fetch failures are non-fatal by contract.
- [Risk] New ID/TH sources in unknown languages dilute extraction → Mitigation: extractor already requires verbatim quotes in original language with `language`/`market` fields; set metadata correctly per source.
- [Risk] Dropping tickers leaves `price_asymmetry` with no carrier → Mitigation: accepted; a dormant class is better than a fabricated one; replacement corridor-behavior source re-admitted only if it passes the bar.
- [Risk] Source-count creep (bundle bloat, LLM noise) → Mitigation: net roster target 7–8 entries; excerpt cap and max-10-observations cap unchanged.
- [Risk] Exact replacement URLs unverified at design time → Mitigation: tasks include live-fetch verification gate (mirrors the 7/7 check in `docs/IMPLEMENTATION.md` §3); nothing merges red.

## Migration Plan

1. Edit `models/@hyfae/fetcher/sources.yaml` only (verdicts applied, additions verified 200).
2. If scope line changes, sync both extraction jobs in `workflow-collect-daily.yaml` identically.
3. `swamp model validate && swamp workflow validate && swamp workflow evaluate`.
4. Smoke: `swamp workflow run collect-daily --input provider=none`, confirm fetch fan-out succeeds and bundle contains thread-level excerpts; then `swamp data delete records` to purge smoke data.
5. Rewrite `docs/IMPLEMENTATION.md` §4 + `README.md` source lines from verdicts.
6. Rollback: `git revert` the registry YAML (single file, no migrations, append-only store untouched).
