## 1. Source scouting & verification

- [x] 1.1 Probe regulatory-exhaust-v2 candidates (customs tariff, SSM, council licensing) with curl: record HTTP status + excerpt sample per candidate
- [x] 1.2 Probe hiring duct-tape candidates (JobStreet/Mudah repeat/urgent-role pages) with curl: confirm firm-as-actor signal survives within 20k chars
- [x] 1.3 Probe seller-side mirrors (Shopee Seller Centre help, Grab merchant threads) with curl, falling back to RSS/search endpoints on bot-wall
- [x] 1.4 Probe procurement exhaust (ePerolehan listings/awards) and build-trail (MY billing-lib issues, SO MY tags) as backup families
- [x] 1.5 Select 3–4 winners across ≥2 families (≥1 hire_ducttape/labor, ≥1 firm-as-actor transaction), each with verdict line (family, class, touchpoint, 200 proof)

## 2. Registry edit

- [x] 2.1 Add winning sources to `models/@hyfae/fetcher/sources.yaml` with full metadata (tier, language, market, artifactClasses, extract)
- [x] 2.2 Run `swamp model validate` and `deno check extensions/models/*.ts`; add `extract` strategy to `fetcher.ts` only if a page shape defeats html/json/text

## 3. Prompt resync (both jobs identically)

- [x] 3.1 Add trace-upstream instruction (`counterparty` + money path, drop if none plausible) to `extract-openrouter` and `extract-local` collector prompts
- [x] 3.2 Add per-class quota (≥2 non-transaction/firm-as-actor of max 10, else emit fewer) to both prompts
- [x] 3.3 Resolve orphaned classes: confirm `hire_ducttape`/`labor` carriers live, else delete them from both prompts; keep `price_asymmetry` dormant unless a behavior-bearing carrier passed 1.5
- [x] 3.4 Run `swamp workflow validate && swamp workflow evaluate` (5/5 green)

## 4. Verification & docs

- [x] 4.1 Smoke: `swamp workflow run collect --input provider=none`; confirm ≥2 firm-as-actor pages non-empty in bundle, then `swamp data delete records` to purge
- [x] 4.2 Live check (provider=local): count touchpoints in stored observations to verify quota holds; purge smoke data after
- [x] 4.3 Rewrite `docs/IMPLEMENTATION.md` §4 roster + `README.md` source lines from new verdicts
- [x] 4.4 Direct Tier C: update `bin/inbox` help text with wanted B2B probes for the cycle (contractor quotes, COD reconciliations, payroll-in-WhatsApp)
