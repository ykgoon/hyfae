# Implementation report — Hyfae opportunity machine v0

Build log mapping `proposal.md` (v2 design + six missing items) onto swamp
primitives. Everything below was executed and verified in this repo.

## 1. Form factor decision

Proposal: "deterministic shell around probabilistic cores"; hybrid where the
orchestrator encodes cadence/routing and never judgment; typed append-only
store as system of record; run-log spec for replay.

Swamp mapping (per `swamp` skill routing + `design/` concepts):

| v2 requirement            | Primitive used                                        |
| ------------------------- | ----------------------------------------------------- |
| Unit schema               | zod schemas inside `@hyfae/records` extension model   |
| Typed append-only store   | `records` model — one resource per record, versioned  |
| Run-log spec              | swamp audit timeline + versioned data + workflow history (`swamp workflow history search`, `swamp run history`) |
| Cadence                   | workflow `trigger.schedule` (cron via `swamp serve`)  |
| Judgment                  | LLM method steps, prompts inline in git-versioned YAML |
| Deterministic stages      | `fetch_all`, `render`, `promote`, `ingest_text` — pure TS methods |
| Dead-letter               | `deadletter` resource on any schema-validation failure |
| Cost envelope v0          | provider switch (`openrouter`/`local`/`none`), cheap model on Loop 1, `none` for dry runs |

Extension search before build: `@sntxrr/openrouter` and `@keeb/ollama` pulled
from the registry for cognition; `@hyfae/fetcher`/`@hyfae/records` custom models
built only for the parts no extension covers (typed store, raw-excerpt adapter
contract, deterministic promoter/digest).

## 2. The six missing items → what shipped

1. **Unit schema** — six kinds (`observation`, `tension`, `synthesis`, `card`,
   `graveyard`, `feedback`) validated with zod before write; fields follow
   proposal tables verbatim (raw_excerpt original language, gravity evidence,
   enabling_shift ≤24mo, causal attestation, two-gate falsification, panel,
   reason_code taxonomy, assumption_broken).
2. **Source registry + tiering** — `sources` model global args carry
   `name/url/tier/language/market/artifactClasses`; Tier C enters only through
   `fetcher.ingest_paste` (human-mediated, ToS-safe); `process-inbox` workflow
   processes pastes.
3. **Thresholds v0** — encoding: gravity fields mandatory on observations;
   dormant-not-killed for missing shifts; `mirage` → graveyard; cap-3 promotion
   (`maxCardsPerWeek`); overflow archived with reason code. Threshold rows as
   `hypothesis: true` live in README; tuning path = redteam memo, not ad-hoc.
4. **Cost envelope** — v0 shape: provider switch incl. `none`; Loop 1 runs on
   `defaultModel` (cheap); per-source excerpt cap 20k chars; max-records cap 50
   per ingest. Enforced in code, not discipline.
5. **Review ritual contract** — frozen card format rendered into
   `reports/weekly-<week>.md`: hook → evidence → panel disagreement →
   believe → copy-paste feedback command. Feedback = `bin/feedback` two-gesture
   CLI (escalate/dismiss + ≤140 chars + assumption_broken).
6. **Run-log spec** — every stage writes versioned resources with timestamps +
   version constants (`collectorVersion`, `extractorVersion`,
   `createdByVersion`); prompts are in git so A/B = edit + re-run; replay =
   re-run workflow with `provider=none` for deterministic stages or same
   inputs for LLM stages.

## 3. Verification performed

- Extensions: `deno check` clean; `swamp doctor extensions` overall pass.
- Models: `swamp model validate` pass for `sources`, `records`,
  `llm-openrouter`, `llm-local`.
- Workflows: all 5 pass schema + deps + input checks (`swamp workflow validate`)
  and CEL evaluation (`swamp workflow evaluate`).
- Live fetch: 7/7 starter sources HTTP 200 after URL/UA fixes (LHDN needed
  browser UA; iTunes RSS needed `page=1`; Luno pair corrected to ETHMYR).
- Store smoke: 2 observations accepted / 0 rejected; invalid record →
  deadletter; 3 syntheses ingested; promote → cap respected, mirage +
  converged-obvious filtered, digest markdown emitted; feedback gesture
  accepted.
- Workflow smoke: `extract-weekly --input provider=none` (render step,
  findBySpec wiring), `synthesize-weekly --input provider=none` (render →
  promote), `collect-daily --input provider=none` (fetch fan-out) — all
  succeeded; smoke data then purged (`swamp data delete records`).
- LLM steps not live-called yet: OpenRouter key is a placeholder until you run
  `swamp vault put llm-secrets OPENROUTER_API_KEY`; local path assumes a
  llama.cpp OpenAI-compatible server on `grex-foxtrot:8090/v1`.

## 4. Starter sources and why (search strategy, not idea strategy)

Verdict roster from the `justify-collect-source-coverage` audit (all verdicts
live-fetch verified HTTP 200 on 2026-09-21; smoke `collect-daily
--input provider=none` re-confirmed 7/7 green):

| Source | Verdict | Friction class | Gravity touchpoint |
| ------ | ------- | -------------- | ------------------ |
| `lhdn-einvois` (Tier B) | keep | policy_shift | compliance — each guideline rev is a dated e-invoicing deadline driving spend |
| `bnm-notices` (Tier B) | keep | policy_shift | compliance — regulatory notices with deadline-driven demand |
| `appstore-reviews-shopee-my` (Tier A) | keep | workaround, ritual | transaction — failed payments, COD reconciliation from wallets-open users |
| `appstore-reviews-tng-my` (Tier A) | keep | workaround, queue | transaction — payout queues, failed top-ups |
| `lowyat-network` → `https://forum.lowyat.net/rss.php` (Tier A, `text`) | fix | workaround, grey_market | transaction — BM/EN workaround and grey-market discourse (thread titles + post text; forum index HTML returned empty through the fetcher runtime, RSS is the fallback) |
| `luno-ticker-ethmyr`, `luno-ticker-xbtmyr` | drop | `price_asymmetry` → dormant, no carrier | none — a price snapshot has no actor, workflow, or verbatim friction quote and cannot satisfy gravity-evidence rules |
| `appstore-reviews-tokopedia-id` (Tier A, ID) | add | workaround, queue | transaction — checkout voucher/payment bugs (verified 50-entry feed) |
| `appstore-reviews-gcash-ph` (Tier A, PH) | add | workaround, queue | transaction — login/verification failures blocking emergency money access |
| `appstore-reviews-truemoney-th` (Tier A, TH) | add | workaround, queue | transaction — double-charge, top-up never arrives, 1000+ support queue, account blocks (verified 200 2026-09-21, 50 entries) |
| `appstore-reviews-momo-vn` (Tier A, VN) | add | workaround, queue | transaction — forced negative-balance payment, unauthorized deductions, wrong-transfer no-support, OTP phone-change blocks (verified 200 2026-09-21, 50 entries) |

Registry now covers 5 markets (MY/ID/TH/VN/PH); the collector prompt scope line
reads MY/ID/TH/VN/PH to agree (synced in BOTH `extract-openrouter` and
`extract-local` jobs). Smoke `collect-daily --input provider=none` re-confirmed
9-source fan-out green (TH/VN pages 200, 20k chars capped, verbatim Thai/Vietnamese
friction). BNM showed one transient Cloudflare challenge
(`Just a moment...`, 403) under rapid re-fetching; direct fetch stayed 200
and the next run was 7/7 green — runtime failures remain non-fatal empty
pages by contract.
Deliberately excluded: English cliché surfaces (r/SaaS, HN) and Tier C walls
(FB/Telegram) — the latter via manual `bin/inbox` only.

## 5. Operating cadence (the part that decides success)

1. Daily: `./bin/collect openrouter` (or cron via `swamp serve`).
2. Weekly Mon: `extract-weekly`; Fri: `synthesize-weekly` → `./bin/digest`.
3. Weekly review ≤15 min: read `reports/weekly-*.md`, gesture via
   `bin/feedback` on each card. Skipping two weeks = machine is noise.
4. Monthly: `redteam-monthly` memo → adjust only what it justifies.
5. Week-one metric: fraction of cards that make you genuinely stop. Trend that
   before spending on anything else. Loops 3-4 stay dark until observation
   mass accumulates (proposal: 2 weeks of Loop 1 first).

## 6. Known gaps (honest)

- No embedding near-dup dedup yet; recurrence counts can double-count.
- Panel is single-backend personas; different-model diversity (proposal Fix 4)
  requires a second provider instance per persona.
- No per-stage token/cost budget enforcement; envelope is model choice + caps.
- Probes are manual; card `probeResult` is operator-filled.
