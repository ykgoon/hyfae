## Why

The machine's default LLM path points at OpenRouter with a placeholder API key, cron schedules assume a long-running `swamp serve` that is not planned, and workflow names bake in cadence the runtime no longer dictates. Deployment target is a one-shot Docker container on the tailnet-connected host: trigger it, it runs the full chain overnight against the local llama.cpp server on `grex-foxtrot`, and produces digest reports.

## What Changes

- **BREAKING**: Rename workflows to remove cadence from names — `collect-daily` → `collect`, `extract-weekly` → `extract`, `synthesize-weekly` → `synthesize`, `redteam-monthly` → `redteam` (UUID ids preserved; step names and CEL references untouched).
- Flip the default LLM provider from `openrouter` to `local` in all five workflows (both `trigger.inputs.provider` and `inputs.properties.provider.default` where present). OpenRouter stays available as an explicit option.
- New `bin/run-all` operator script chaining `collect` → `extract` → `synthesize` → `bin/digest` with `provider=local` defaults (excludes `process-inbox`, which stays inbox-driven, and `redteam`, which stays a manual monthly ritual).
- New Docker packaging: Dockerfile based on the official Swamp image plus project tools (`jq`, `tzdata`, `bash`), compose file with host networking (resolves `grex-foxtrot` via the host's tailnet MagicDNS), persistent `.swamp/` state volume, `reports/` output volume, `TZ=Asia/Kuala_Lumpur`.
- `swamp serve` remains supported but optional — cron schedules stay in the YAMLs for that mode; without serve, runs are manual/triggered.
- Documented accepted tradeoff: `extract` and `synthesize` reprocess the full record store each run (no windowing/dedup in v1); acceptable with local LLM where cost is time, not spend.

## Capabilities

### New Capabilities
- `docker-deployment`: One-shot Docker packaging and runtime — base image, networking to grex-foxtrot via tailnet, state/report volumes, timezone, chain entrypoint, and the optional serve mode.

### Modified Capabilities
- (none — no existing spec requirements change; `source-coverage`, `source-quality-gate`, `th-vn-coverage` concern collect behavior, untouched here beyond the workflow rename which does not alter their requirements)

## Impact

- `workflows/workflow-{collect-daily,extract-weekly,synthesize-weekly,redteam-monthly}.yaml` — renamed files + `name:` fields; provider defaults flipped
- `bin/collect` — references `collect` workflow
- New: `bin/run-all`, `Dockerfile`, `compose.yaml` (or equivalent)
- Docs: `AGENTS.md` verification ladder, `docs/IMPLEMENTATION.md` ops runbook, `README.md`
- Runtime dependency: tailnet reachability of `http://grex-foxtrot:8090/v1`; Docker + compose on host
- No changes to models, extensions, records schema, thresholds, or store invariants
