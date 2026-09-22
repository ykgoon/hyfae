## Context

The hyfae machine is five swamp workflows over four models (`sources`, `records`, `llm-openrouter`, `llm-local`). Current state:

- Four workflows carry cron schedules (`collect-daily` 06:00 daily, `extract-weekly` Mon 07:00, `synthesize-weekly` Sat 08:00, `redteam-monthly` 1st 09:00) that only fire under `swamp serve` — which is not planned for the primary deployment. `process-inbox` has no schedule and is intentionally manual.
- `trigger.inputs.provider` and `inputs.properties.provider.default` are `openrouter` in the four scheduled workflows; `OPENROUTER_API_KEY` in vault `llm-secrets` is a placeholder, so every unqualified run would fail at the LLM step.
- `llm-local` (type `@sntxrr/openrouter`, same wire format) targets `http://grex-foxtrot:8090/v1` (llama.cpp, gemma-4-E4B-it-Q6_K) with a dummy apiKey — no vault dependency.
- grex-foxtrot is a Tailscale machine; the Docker host is already on the tailnet.
- No Dockerfile exists in the repo. Swamp version `20260903.004401.0`; `SWAMP_TRUSTED_HOSTS` env exists for serve-in-docker patterns.
- Store state lives in `.swamp/` (store, bundles, pulled extensions, vault).
- `bin/collect` already defaults to `provider=none` (fetch-only); `bin/inbox` (`PROCESS=1`), `bin/feedback`, `bin/digest` are provider-agnostic or data-level.

Verified rename blast radius (non-archive): `bin/collect:6`, `AGENTS.md:65,103`, `docs/IMPLEMENTATION.md:71-73,82,100,112,115`. Archived OpenSpec changes reference old names historically and are untouched.

## Goals / Non-Goals

**Goals:**
- One-shot Docker deployment: trigger → container runs `collect → extract → synthesize → digest` overnight against the local LLM → reports. No `swamp serve` required.
- Local provider (`grex-foxtrot`) becomes the default everywhere; OpenRouter stays opt-in.
- Workflow names decoupled from cadence — the runner owns frequency.
- State (`.swamp/`) persists across container runs via volume.

**Non-Goals:**
- No windowing/dedup of extract/synthesize inputs (accepted for v1; any change goes through a redteam-memo-justified future change).
- No changes to models, extensions, records schema, thresholds (`hypothesis: true`), prompts, or store invariants.
- No Tier C automation (`process-inbox` stays inbox-driven; `bin/inbox` unchanged).
- No removal of cron schedules (serve mode stays supported; removing them risks breaking the `trigger.inputs` default source).

## Decisions

### D1: Rename workflows, keep UUID ids, keep steps intact
`collect-daily`→`collect`, `extract-weekly`→`extract`, `synthesize-weekly`→`synthesize`, `redteam-monthly`→`redteam`. Rename the YAML `name:` field and file; keep the `id:` UUID (swamp tracks identity by id, preserving run history). Step names and `data.latest(...)` CEL references are untouched — the repo gotcha about renames applies to *steps*, not workflows. Update references: `bin/collect`, `AGENTS.md` verification ladder, `docs/IMPLEMENTATION.md`, `README.md`.

*Alternative considered*: keep names, document that cadence is not implied — rejected; user rule is names must not dictate interval, and stale names mislead future operators.

### D2: Flip provider defaults in both spots
For each of the four scheduled workflows: `trigger.inputs.provider: local` and `inputs.properties.provider.default: local`. For `process-inbox` (no trigger block): `inputs.properties.provider.default: local`. Manual runs without `--input provider` then hit `llm-local`, never the placeholder-keyed OpenRouter. `bin/collect` also switches its own default from `none` to `local` (its `none` default predates the local-first decision; `PROVIDER=none` remains available for fetch-only smoke).

*Alternative considered*: keep `openrouter` defaults and require explicit flags — rejected; a forgotten flag produces a confusing failure at the `llm` step of the openrouter twin job.

### D3: Host networking for tailnet reach
`network_mode: host` (compose) — the container shares the host's network namespace, so `grex-foxtrot` resolves via the host's tailnet MagicDNS and reaches `:8090`. No Tailscale sidecar, no authkey, no state volume for tailscaled. Tradeoff: no port isolation for this container — acceptable for a batch-job container on a single-operator machine.

*Alternative considered*: `tailscale/tailscale` sidecar with shared netns — more isolation-correct, but adds authkey management and a state volume for a machine the host already reaches. Documented as the fallback if the machine later moves off a tailnet-connected host.

### D4: Base image = official prebuilt Swamp image + project tools
Dockerfile `FROM`s the official prebuilt image `swampclub/swamp`, pinned to a date-sha release tag (`20260922.011324.0-sha.2e949db5` at authoring) for reproducible builds. The base (Debian trixie) ships the swamp binary + Deno runtime; only `jq` is added (bash + tzdata already present). Base `ENTRYPOINT ["swamp"]` is cleared so compose commands run as scripts; the image runs as the base's `swamp` user (uid 1000, matching the host user for the `./reports` bind mount), with `.swamp/` and `reports/` created and chowned before switching back. Repo COPYed in; `.swamp/` excluded via `.dockerignore` (state must never bake into the image) and provided by the `hyfae-state` volume.

*Alternative considered*: `debian:bookworm-slim` + install-script pattern (the pre-image-era official worker pattern) — superseded when the prebuilt image shipped; install layer removed.

### D5: `bin/run-all` owns the sequence
New script: `bin/collect local` (fetch + observation extract) → `swamp workflow run extract --input provider=$PROVIDER` → `swamp workflow run synthesize --input provider=$PROVIDER` → `bin/digest`. `PROVIDER` env override (default `local`). Excludes `process-inbox` (needs a paste first) and `redteam` (monthly governance ritual, run manually). Order matters: each stage reads records produced by the previous one; single sequential script keeps the overnight window predictable.

*Alternative considered*: compose service per stage with `depends_on` — rejected; swamp already sequences jobs inside a workflow, and shell sequencing keeps provider plumbing in one place.

### D6: TZ=Asia/Kuala_Lumpur in image/compose
`synthesize` takes `week` (empty = current ISO week) and promote-caps 3 cards per week label. Container TZ must match the operator's calendar so week labels and digest naming are correct near boundaries.

### D7: serve mode stays, untouched
Cron schedules remain in YAML (they double as documentation of intended staggering and as the default source for `trigger.inputs`). The same image runs `swamp serve` with `SWAMP_TRUSTED_HOSTS` if that mode is ever chosen. Nothing in this change depends on serve.

## Risks / Trade-offs

- [Full-store reprocessing: `extract` and `synthesize` re-LLM every stored observation/tension each run; tension/synthesis records accumulate each run and synthesize input grows linearly] → Accepted for v1: local LLM means cost is time, not spend; cap-3 promotion and digest stay week-correct via the `week` label. Mitigation path: windowing/dedup via a future redteam-memo-justified change. Monitor `swamp data list records` growth.
- [Rename might break unknown references outside the verified blast radius] → `swamp workflow validate` + grep sweep for old names before smoke; archived OpenSpec changes intentionally untouched.
- [Host networking removes container network isolation] → Accepted for batch container; no published ports needed; sidecar pattern documented as fallback.
- [Local llama.cpp latency may make a full chain exceed the overnight window as the store grows] → Chain is sequential with per-stage logs; stages are independently re-runnable (`bin/collect local` … `bin/digest`), so a failed late stage resumes without re-fetching.
- [Workflow cron TZ under serve mode is unverified] → Irrelevant to the primary one-shot mode; if serve is adopted later, verify cron TZ then (noted in IMPLEMENTATION.md).
- [Smoke runs pollute the append-only store] → Follow the existing verification ladder: `provider=none` chain, then `swamp data delete records` purge before any live run.

## Migration Plan

1. Rename workflows + update refs → `swamp workflow validate` + `swamp model validate`.
2. Flip provider defaults → re-validate.
3. Add `bin/run-all`; host-side smoke: `bin/run-all` with `PROVIDER=none` → `bin/digest` → `swamp data delete records`.
4. Add Dockerfile + compose; build image; smoke inside container with `PROVIDER=none` and empty state volume → purge.
5. Live overnight run with `provider=local` against grex-foxtrot → inspect `reports/` and record growth.
6. Update AGENTS.md verification ladder and IMPLEMENTATION.md ops runbook (trigger-based cadence replaces cron narrative).

Rollback: git revert restores old names/defaults; `.swamp/` volume is untouched by code rollback (append-only store tolerates name changes — workflow identity is by UUID).

## Open Questions

- Live `provider=local` chain (task 5.1) — grex-foxtrot was offline during implementation; everything else verified. First overnight run completes the verification.
