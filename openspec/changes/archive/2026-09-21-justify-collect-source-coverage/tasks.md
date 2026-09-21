## 1. Source audit and replacements

- [x] 1.1 Record keep verdicts for `lhdn-einvois`, `bnm-notices`, both app-review RSS feeds with friction class + gravity touchpoint each
- [x] 1.2 Resolve Lowyat thread-level URL(s) and verify HTTP 200 + thread discourse in excerpt
- [x] 1.3 Remove both Luno ticker entries from the registry and record `price_asymmetry` as dormant
- [x] 1.4 Select ≥1 ID and ≥1 TH/VN/PH Tier A/B candidate and verify HTTP 200 + friction-bearing excerpts

## 2. Registry edit

- [x] 2.1 Apply roster edits in `models/@hyfae/fetcher/sources.yaml` (URL swaps, ticker removal/replacement, 2–3 additions, metadata on every entry)
- [x] 2.2 Sync collector prompt scope line in BOTH `extract-openrouter` and `extract-local` jobs of `workflow-collect-daily.yaml` (or narrow scope if expansion failed the bar)
- [x] 2.3 Run `swamp model validate && swamp workflow validate && swamp workflow evaluate`

## 3. Verification and docs

- [x] 3.1 Smoke run `swamp workflow run collect-daily --input provider=none`, confirm fan-out green, thread excerpts present, no bare-ticker pages, per-source excerpt ≤20k chars
- [x] 3.2 Purge smoke data with `swamp data delete records`
- [x] 3.3 Rewrite `docs/IMPLEMENTATION.md` §4 and `README.md` source lines from the verdict roster
- [x] 3.4 Run `openspec validate justify-collect-source-coverage` and confirm apply-ready
