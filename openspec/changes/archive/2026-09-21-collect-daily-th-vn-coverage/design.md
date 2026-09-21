## Context

`collect-daily` (Loop 1) runs `sources.fetch_all` over `models/@hyfae/fetcher/sources.yaml` (7 entries, `maxCharsPerSource: 20000`), bundles raw excerpts, and runs one cheap LLM extraction pass (twin jobs `extract-openrouter` / `extract-local`, kept in sync) producing ≤10 friction observations with mandatory economic gravity. The collector prompt claims scope MY/ID/TH/VN/PH; the registry after `justify-collect-source-coverage` covers MY (lhdn-einvois, bnm-notices, 2 app-review feeds, lowyat RSS), ID (Tokopedia reviews), and PH (GCash reviews). TH and VN have zero carriers, so their friction never reaches the extractor. The fetcher contract emits verbatim excerpts, records failures as empty pages (`status: 0`, non-fatal), and Tier C never enters except via `ingest_paste`. Thresholds v0 are `hypothesis: true` and owned by `redteam-monthly` — untouched here.

## Goals / Non-Goals

**Goals:**
- Give TH and VN at least one Tier A/B carrier each, chosen against the existing source quality bar with live-200 verification.
- Keep prompt claim and registry in full agreement across all five markets (MY/ID/TH/VN/PH).
- Bound bundle growth so extraction noise stays flat.

**Non-Goals:**
- No threshold or gate tuning (gravity fields, cap-3, mirage rules stay `hypothesis: true`).
- No Tier C automation; `ingest_paste` path unchanged.
- No embedding dedup, panel diversity, or cost-budget work (separate changes).
- No new workflow; registry + prompt-sync edits only, plus docs.

## Decisions

**D1 — Mirror the proven app-review RSS pattern for TH/VN first.**
Four of seven current entries are iTunes RSS feeds with identical shape (`https://itunes.apple.com/<CC>/rss/customerreviews/.../json`, `extract: json`), all verified 200 with friction-bearing quotes (payment bugs, voucher loss, login blocking emergency money). Preferred candidates: a TH wallet/commerce app (e.g. TrueMoney, Shopee TH storefront) and a VN wallet/commerce app (e.g. MoMo, ZaloPay, Shopee VN storefront) — wallets-open users filing free feature requests, transaction-touchpoint gravity. Alternative (TH/VN forum scraping — Pantip, Vozforums) rejected as first choice: higher friction density in theory but bot-wall/JS risk and unknown RSS; acceptable as fallback if no app feed passes the bar. Alternative (TH/VN regulator Tier B) accepted as optional third entry only: low-volume high-conviction but language-verification cost.

**D2 — Cap additions at 2–3, net roster 9–10 max.**
Two entries (1 TH + 1 VN) is the target; a third is allowed only if a Tier B regulator passes cleanly. `maxCharsPerSource: 20000` and max-10-observations caps unchanged, so worst-case bundle growth is bounded and extraction stays cheap. Alternative (one combined "SEA" source) rejected: `market` is per-entry and prompt agreement is checked per market.

**D3 — No `fetcher.ts` contract change; failure semantics preserved.**
`fetch_all` fan-out, one `page` per source plus `bundle`, empty-page-on-failure, 20k char cap, and twin-job prompt-sync rule all stay. Only if a TH/VN source needs a non-html/json strategy does `extract` gain a value — otherwise code untouched. Exact candidate URLs resolved at implementation time against the quality bar (Open Questions).

**D4 — No gate/threshold changes.**
Gravity fields, dormant-not-killed, mirage→graveyard, cap-3 promotion remain exactly as-is. Any tuning waits for a `redteam-monthly` memo.

## Risks / Trade-offs

- [Risk] Thai/Vietnamese excerpts dilute extraction or get mistranslated → Mitigation: extractor already requires verbatim quotes in original language with `language`/`market` fields; set `language: th` / `language: vi` correctly per entry so gravity evidence stays sourced.
- [Risk] Candidate pages block scraping or return empty through fetcher runtime → Mitigation: prefer iTunes RSS (proven 200 pattern); verify HTTP 200 + non-empty friction excerpt at implementation; failures are non-fatal by contract but the entry is rejected before merge.
- [Risk] Source-count creep (bundle bloat, LLM noise) → Mitigation: hard cap 2–3 additions, net roster ≤10; excerpt cap and max-10-observations cap unchanged.
- [Risk] Exact TH/VN URLs unverified at design time → Mitigation: tasks include live-fetch verification gate (mirrors the 7/7 check in `docs/IMPLEMENTATION.md` §3); nothing merges red.
- [Risk] Prior `source-coverage` spec demanded only "TH/VN/PH (one of)" and PH satisfied it → Mitigation: accepted; this change explicitly tightens the bar to TH and VN each, documented as an extension not a contradiction.

## Migration Plan

1. Select 1 TH + 1 VN candidate (optional Tier B third), verify live HTTP 200 + friction excerpts.
2. Edit `models/@hyfae/fetcher/sources.yaml` only (additions with full metadata).
3. If scope line changes, sync both extraction jobs in `workflow-collect-daily.yaml` identically.
4. `swamp model validate && swamp workflow validate && swamp workflow evaluate`.
5. Smoke: `swamp workflow run collect-daily --input provider=none`, confirm fetch fan-out succeeds, TH/VN pages non-empty, per-source excerpt ≤20k chars; then `swamp data delete records` to purge smoke data.
6. Update `docs/IMPLEMENTATION.md` §4 + `README.md` source lines from new roster.
7. Rollback: `git revert` the registry YAML (single file, no migrations, append-only store untouched).

## Open Questions

- Exact TH candidate: which app ID / storefront (TrueMoney vs Shopee TH) passes live-fetch with the strongest payment-friction quotes?
- Exact VN candidate: which app ID / storefront (MoMo vs ZaloPay vs Shopee VN) passes live-fetch?
- Is there a TH/VN Tier B regulator page worth the third slot, or do two Tier A feeds suffice?
