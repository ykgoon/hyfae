## 1. Candidate selection and verification

- [x] 1.1 Select 1 TH Tier A/B candidate (preferred: wallet/commerce app-review RSS) and verify HTTP 200 + friction-bearing non-empty excerpt
- [x] 1.2 Select 1 VN Tier A/B candidate (preferred: wallet/commerce app-review RSS) and verify HTTP 200 + friction-bearing non-empty excerpt
- [x] 1.3 Record friction class + gravity touchpoint + tier justification per candidate; reject any that fails the bar (fallback: forum RSS or Tier B regulator)

## 2. Registry edit

- [x] 2.1 Apply 2–3 additions in `models/@hyfae/fetcher/sources.yaml` with full metadata (`language`, `market`, `artifactClasses`, `extract`); net roster ≤10
- [x] 2.2 Sync collector prompt scope line in BOTH `extract-openrouter` and `extract-local` jobs of `workflow-collect-daily.yaml` if wording changes
- [x] 2.3 Run `swamp model validate && swamp workflow validate && swamp workflow evaluate`

## 3. Verification and docs

- [x] 3.1 Smoke run `swamp workflow run collect-daily --input provider=none`, confirm fan-out green, TH/VN pages non-empty with verbatim friction, per-source excerpt ≤20k chars
- [x] 3.2 Purge smoke data with `swamp data delete records`
- [x] 3.3 Update `docs/IMPLEMENTATION.md` §4 and `README.md` source lines from the new roster
- [x] 3.4 Run `openspec validate collect-daily-th-vn-coverage` and confirm apply-ready
