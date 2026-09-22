# docker-deployment

## Purpose

Docker-local packaging and deployment of the opportunity machine: cadence-free workflow names, local-LLM default provider, one-shot chain runner, image build, tailnet connectivity, and MY-timezone container behavior. Synced from change `docker-local-deployment`.

## Requirements

### Requirement: Workflow names are cadence-free
Workflow identities SHALL NOT encode a run interval. The four scheduled workflows SHALL be named `collect`, `extract`, `synthesize`, and `redteam` (previously `collect-daily`, `extract-weekly`, `synthesize-weekly`, `redteam-monthly`), with workflow UUID ids preserved and step names unchanged. `process-inbox` keeps its name.

#### Scenario: Renamed workflows validate and run
- **WHEN** `swamp workflow validate` runs after the rename
- **THEN** all five workflows validate with their original UUID ids and no step or CEL reference is broken

#### Scenario: Operator wrapper targets renamed workflow
- **WHEN** `bin/collect local` runs
- **THEN** it invokes `swamp workflow run collect --input provider=local` and the workflow starts

### Requirement: Local LLM is the default provider
Each of the five workflows SHALL default to `provider=local` in both `trigger.inputs.provider` (where a trigger block exists) and `inputs.properties.provider.default`. OpenRouter SHALL remain selectable via an explicit `provider=openrouter` input.

#### Scenario: Manual run without provider input uses local
- **WHEN** `swamp workflow run extract` runs without a `provider` input
- **THEN** the guard selects the `extract-local` job and `llm-local` (grex-foxtrot) serves the request, with no OpenRouter call attempted

#### Scenario: OpenRouter remains opt-in
- **WHEN** any workflow runs with `provider=openrouter` and a valid OpenRouter key in the vault
- **THEN** the `*-openrouter` twin job executes against `llm-openrouter`

### Requirement: One-shot chain runner
A `bin/run-all` script SHALL run the full pipeline in sequence — `collect` → `extract` → `synthesize` → `bin/digest` — each LLM stage defaulting to `provider=local`. It SHALL NOT include `process-inbox` (inbox-driven) or `redteam` (manual monthly ritual).

#### Scenario: Full chain produces a digest
- **WHEN** `bin/run-all` completes successfully with the local provider reachable
- **THEN** records exist for the new observations, tensions, and syntheses, and a digest markdown file is written under `reports/`

#### Scenario: Provider override
- **WHEN** `bin/run-all` is invoked with `PROVIDER=openrouter` in the environment
- **THEN** every chained LLM stage runs with `provider=openrouter` instead of the default `local`

### Requirement: Docker image packages the machine
A Docker image SHALL be built FROM the official Swamp image and include the project plus the tools it needs (`bash`, `jq`, `tzdata`). The repo code SHALL be present in the image and `.swamp/` state SHALL be externalized to a persistent volume.

#### Scenario: Image builds and chain runs in container
- **WHEN** the image is built and a container is started from it with the state volume mounted and `bin/run-all` as the entry command
- **THEN** the full chain executes inside the container and exits cleanly, with reports written to the mounted reports path

#### Scenario: State persists across container runs
- **WHEN** the container exits and a new container starts from the same image with the same state volume
- **THEN** previously ingested records, extensions bundles, and the vault remain available (append-only store continuity)

### Requirement: Container reaches grex-foxtrot over the tailnet
The Docker deployment SHALL use host networking so the container resolves `http://grex-foxtrot:8090/v1` through the host's tailnet (MagicDNS), without a Tailscale sidecar or authkey.

#### Scenario: Local LLM reachable from inside container
- **WHEN** the chain runs inside a container with host networking on the tailnet-connected host
- **THEN** `llm-local` requests reach grex-foxtrot and return completions without DNS or connection errors

### Requirement: Container timezone is MY time
The container SHALL run with `TZ=Asia/Kuala_Lumpur` so week labels (`week` input, empty = current ISO week) and digest naming follow the Malaysia calendar.

#### Scenario: Digest week label matches MY calendar
- **WHEN** `synthesize` runs with the `week` input empty inside the container near a week boundary
- **THEN** the digest record uses the ISO week label valid in Asia/Kuala_Lumpur, not a UTC-offset week

### Requirement: serve mode remains optional
Cron schedules SHALL remain in the workflow YAMLs for `swamp serve` deployments, and the image SHALL be usable for that mode (`swamp serve` with `SWAMP_TRUSTED_HOSTS` as needed). The machine SHALL be fully operable without `swamp serve` via manual/one-shot triggers.

#### Scenario: Trigger without serve
- **WHEN** no `swamp serve` process is running and `bin/run-all` is triggered
- **THEN** the chain completes and reports are produced, independent of any scheduler