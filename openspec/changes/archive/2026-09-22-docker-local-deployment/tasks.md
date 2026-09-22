## 1. Workflow renames (cadence out of names)

- [x] 1.1 Rename `workflows/workflow-collect-daily.yaml` → `workflow-collect.yaml` with `name: collect`; same for `extract-weekly`→`extract`, `synthesize-weekly`→`synthesize`, `redteam-monthly`→`redteam`; preserve `id:` UUIDs and all steps/CEL references
- [x] 1.2 Update `bin/collect` to invoke `swamp workflow run collect`
- [x] 1.3 Grep sweep for old names (`collect-daily`, `extract-weekly`, `synthesize-weekly`, `redteam-monthly`) across non-archive files (`bin/`, `AGENTS.md`, `README.md`, `docs/IMPLEMENTATION.md`) and update; leave `openspec/changes/archive/` untouched
- [x] 1.4 Run `swamp workflow validate` and `swamp model validate` — all five workflows validate with original UUIDs

## 2. Provider default flips

- [x] 2.1 In `collect`, `extract`, `synthesize`, `redteam`: set `trigger.inputs.provider: local` and `inputs.properties.provider.default: local`
- [x] 2.2 In `process-inbox` (no trigger block): set `inputs.properties.provider.default: local`
- [x] 2.3 Change `bin/collect` default from `none` to `local` (fetch-only still available via `PROVIDER=none` / arg `none`); update header comment
- [x] 2.4 Re-run `swamp workflow validate`; confirm guards still select local twin jobs for `provider=local` and openrouter twins for `provider=openrouter`

## 3. Chain runner

- [x] 3.1 Create `bin/run-all`: sequential `bin/collect $PROVIDER` → `swamp workflow run extract --input provider=$PROVIDER` → `swamp workflow run synthesize --input provider=$PROVIDER` → `bin/digest`; `PROVIDER` env default `local`; `set -euo pipefail`, per-stage echo headers, `cd "$(dirname "$0")/.."`; no `process-inbox`, no `redteam`
- [x] 3.2 Host-side smoke: `PROVIDER=none bin/run-all` — fetch fan-out green, render steps succeed, digest written; then `swamp data delete records` purge

## 4. Docker packaging

- [x] 4.1 Resolve official Swamp Docker image name/tag from swamp docs; pin explicitly in Dockerfile
- [x] 4.2 Create `Dockerfile`: FROM pinned Swamp image, install `jq` + `tzdata` (+ verify `bash`), COPY repo, `WORKDIR` repo root, `ENV TZ=Asia/Kuala_Lumpur`, volumes for `.swamp/` and `reports/`
- [x] 4.3 Create `compose.yaml`: service `machine` with `network_mode: host`, `.swamp` state volume + `reports` volume mounts, TZ env; document one-shot usage (`docker compose run --rm machine bin/run-all`) and optional serve mode (`swamp serve` + `SWAMP_TRUSTED_HOSTS`)
- [x] 4.4 Build image; container smoke with fresh state volume: `PROVIDER=none bin/run-all` inside container exits cleanly; `llm-local` reachable check (`http://grex-foxtrot:8090/v1` resolves via host tailnet); purge smoke records

## 5. Live verification + docs

- [ ] 5.1 Live run: `docker compose run --rm machine bin/run-all` (provider=local) against grex-foxtrot — all four stages complete, records ingested, `reports/` digest written; verify no OpenRouter calls attempted
- [x] 5.2 Verify state persistence: second container run sees prior records (append-only continuity, no re-ingest errors)
- [x] 5.3 Update `AGENTS.md` verification ladder (`swamp workflow run extract --input provider=none`) and ops notes (rename + local default)
- [x] 5.4 Update `docs/IMPLEMENTATION.md` ops runbook: replace cron narrative with trigger-based cadence (one-shot overnight chain; redteam manual monthly; process-inbox via `bin/inbox`); note full-store reprocessing tradeoff and serve-mode fallback
- [x] 5.5 Update `README.md` deployment section (Docker one-shot usage, host-network/tailnet prerequisite, TZ note)
- [x] 5.6 Final verification ladder: `swamp doctor extensions`, `deno check extensions/models/*.ts`, `swamp model validate`, `swamp workflow validate` — all green
