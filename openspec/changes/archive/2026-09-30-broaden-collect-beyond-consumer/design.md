## Context

`collect` (Loop 1) runs `sources.fetch_all` over 9 Tier A/B entries in `models/@hyfae/fetcher/sources.yaml` (20k char cap, failure-as-empty-page), then one cheap LLM pass (twin jobs `extract-openrouter` / `extract-local`, kept in sync) emits ≤10 observations with mandatory gravity. Current mix: 6 app-review feeds + 1 forum RSS (consumer-voiced, transaction touchpoint) vs 2 regulator pages (compliance). `hire_ducttape` and `labor` have zero carriers; `price_asymmetry` is dormant since Luno removal (D4, `justify-collect-source-coverage`). The `source-quality-gate` bar (Tier A/B only, HTTP 200, public GET) structurally favors consumer surfaces because B2B pain hides behind logins and PDFs. Thresholds v0 stay `hypothesis: true` under redteam ownership — untouched.

## Goals / Non-Goals

**Goals:**
- Give every advertised artifact class and gravity touchpoint a live carrier, or stop advertising it.
- Add firm-as-actor evidence (actor can sign a cheque) without breaking fetchability, tier policy, or cost envelope.
- Make consumer evidence pull double duty as symptom pointing at a payer.
- Ship a quota so volume never again drowns the minority signal.

**Non-Goals:**
- No Tier C automation; `ingest_paste` path and manual-only policy unchanged (only the inbox guidance text is directed).
- No threshold/gate tuning (gravity fields, cap-3, mirage rules stay `hypothesis: true`).
- No `price_asymmetry` resurrection unless a behavior-bearing carrier passes the bar in this change; dormancy remains an acceptable outcome.
- No embedding dedup, panel diversity, or per-stage cost budgets (known v0 gaps, separate changes).
- No new workflow; registry + prompt-sync edits only, plus docs.

## Decisions

**D1 — Candidate families, ranked by automatability first.**
Order of attempt: (1) regulatory exhaust v2 (customs tariff, SSM, council licensing — same Tier B shape as LHDN/BNM, dated diffs, best gravity/byte); (2) hiring duct-tape (JobStreet/Mudah urgent/repeat-role ads — only automatable `labor` proxy, noisy but public GET); (3) seller-side mirrors (Shopee Seller Centre help, Grab merchant threads — same platforms, payer-side actor); (4) procurement exhaust (ePerolehan listings/awards — versioned, money in motion, terse excerpts need care); (5) build-trail (MY e-invoice lib GitHub issues, SO MY tags — dev duct-tape, pre-product evidence). First 3 families that pass live-200 + non-empty-excerpt verification ship; cap adds at 3–4 to bound bundle bloat (roster 10–12). Alternative (add all 5) rejected: bundle noise + LLM dilution, same creep risk D5 guarded against.

**D2 — Trace-upstream as prompt instruction, not schema migration.**
Add a `counterparty` sentence to the collector system prompt ("for each consumer observation, name the business-side counterparty who loses money and the one-line money path; drop if none plausible") rather than extending the zod observation schema in `@hyfae/records`. Rationale: zero migration on the append-only store, no deadletter risk from a new required field, falsification/extract stages can read it from prose. Alternative (new required schema field) rejected: breaks existing observations render + risks mass deadletter on rollout. If the field proves load-bearing over 2–4 weeks of runs, a follow-up change promotes it to schema.

**D3 — Quota as prompt constraint + deterministic backstop.**
Prompt states the ≥2 non-transaction/firm-as-actor rule; enforcement is a `records.ingest_text`-adjacent check at implementation choice: simplest compliant form is prompt-only for v1 with reviewer verification on the first 2 runs (count touchpoints in stored observations). If runs show quota ignored, follow-up adds a deterministic filter (drop lowest-confidence consumer items post-ingest). Alternative (hard pre-LLM bundle partitioning) rejected: complexity without evidence the LLM disobeys yet.

**D4 — Orphaned-class rule: carrier or cut, decided at implementation.**
If no hiring source passes verification, `hire_ducttape`/`labor` are deleted from both extraction prompts in the same diff — no lingering ghost classes. `price_asymmetry` stays dormant regardless unless a spread-with-complaint-text carrier (e.g. money-changer queue + markup evidence) passes the bar; bare numbers are never re-admitted. Alternative (keep advertising unfilled classes "aspirationally") rejected: it is the hallucination vector this change exists to close.

**D5 — No `fetcher.ts` change unless forced.**
`fetch_all` fan-out, empty-page-on-failure, 20k cap, twin-job prompt-sync all stay. New `extract` strategy value only if a chosen source's page shape defeats html/json/text (unlikely: tender/job/seller surfaces are server-rendered HTML). Prompt edits applied byte-identically to both jobs.

**D6 — Directed Tier C as guidance text, not pipeline.**
`bin/inbox` help/echo text names the wanted B2B probes for the cycle (contractor quotes, COD reconciliations, payroll-in-WhatsApp). No workflow, schema, or automation change. Alternative (Tier C campaign workflow) rejected: policy risk + scope creep.

## Risks / Trade-offs

- [Risk] Job-board/tender excerpts are spam or boilerplate within 20k cap → Mitigation: noise plan per source in spec; verify sample excerpt pre-merge; reject family if signal doesn't survive truncation.
- [Risk] Roster 10–12 dilutes LLM attention, consumer volume still dominates → Mitigation: quota (D3) + max-10 cap unchanged; reviewer counts touchpoints on first 2 runs.
- [Risk] Seller/forum surfaces bot-wall like Lowyat index did → Mitigation: RSS/search fallbacks per D3 precedent; failures non-fatal by contract; replace family if no 200.
- [Risk] `counterparty` prose ignored by cheap Loop 1 model → Mitigation: verify on first runs; promote to schema field in follow-up if needed (D2).
- [Risk] No hiring source passes bar → Mitigation: accepted outcome; cut the class from prompt per D4 rather than shipping a weak source.
- [Trade-off] Breadth vs depth: 3–4 new sources means thinner per-source attention; chosen because minority-signal survival (quota) matters more than per-source depth at this stage.

## Migration Plan

1. Edit `models/@hyfae/fetcher/sources.yaml` (3–4 additions, each with live-200 verification + verdict line).
2. Sync collector prompt in `workflows/workflow-collect.yaml` identically across both jobs (trace-upstream + quota + scope line).
3. `swamp model validate && swamp workflow validate && swamp workflow evaluate`.
4. Smoke: `swamp workflow run collect --input provider=none`, confirm firm-as-actor pages non-empty in bundle; then `swamp data delete records` to purge.
5. First live runs (provider=local): count touchpoints in stored observations to verify quota; rewrite `docs/IMPLEMENTATION.md` §4 + `README.md` source lines.
6. Rollback: `git revert` registry + workflow YAML (no migrations, append-only store untouched).

## Open Questions

- Exact candidate URLs (resolved at implementation against the quality bar — same pattern as D5/D7 previously).
- Whether `counterparty` needs schema promotion after 2–4 weeks of runs (deferred, D2).
- Whether quota needs deterministic enforcement or prompt-only suffices (deferred, D3).
