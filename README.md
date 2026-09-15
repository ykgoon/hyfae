# Opportunists — revenue opportunity mining machine

Look for hidden profit opportunities. Built with Swamp.

## Layout

```
extensions/models/
  fetcher.ts     @oppo/fetcher  — Tier A/B collection + Tier C paste intake
  records.ts     @oppo/records  — six record schemas, dead-letter, promoter, digest
models/
  sources/       source registry (7 starter SEA sources, Tier A/B)
  records/       the typed store instance
  llm-openrouter OpenRouter backend (key from vault llm-secrets)
  llm-local      OpenAI-compatible llama.cpp backend (grex-foxtrot:8090)
workflows/
  collect-daily      Loop 1 — fetch all sources → LLM extraction → observations
  extract-weekly     Loop 2 — observations → tensions (enabling-shift, invariants)
  synthesize-weekly  Loops 3+4 — cross-domain synthesis → two-gate falsification →
                     cap-3 promotion → weekly digest markdown
  redteam-monthly    meta — attacks the machine's own scoring; memo per run
  process-inbox      Tier C path — pasted excerpts → observations
bin/
  collect            daily fetch/extract wrapper
  inbox              paste a walled-platform excerpt, optionally process it
  digest             export latest weekly digest to reports/
  feedback           escalate/dismiss a card (feeds the calibration loop)
inbox/                 drop Tier C text files here
reports/               weekly-*.md digests land here
```

## The five-minute version

```bash
swamp vault put llm-secrets OPENROUTER_API_KEY        # once; stdin gets the key
./bin/collect openrouter                               # daily: fetch + extract
./bin/collect local                                    # same, via llama.cpp on grex-foxtrot
./bin/collect                                          # fetch only (no LLM spend)
swamp workflow run extract-weekly --input provider=openrouter
swamp workflow run synthesize-weekly --input provider=openrouter
./bin/digest 2026-W37                                  # markdown to reports/
./bin/feedback <syn-id> dismiss "reason" false         # 2-tap calibration
printf 'pasted thread text' | ./bin/inbox telegram-seller-group   # Tier C
PROCESS=1 ./bin/inbox telegram-seller-group            # then extract pastes
swamp serve                                            # enables cron triggers
```

## LLM provider switch

Every cognition workflow takes `provider`:

| provider     | backend                                                                                                              | cost                       |
|--------------|----------------------------------------------------------------------------------------------------------------------|----------------------------|
| `openrouter` | `models/@sntxrr/openrouter/llm-openrouter.yaml` — edit `defaultModel` (cheap for Loop 1; set flagship for Loops 3-4) | token spend                |
| `local`      | `models/@sntxrr/openrouter/llm-local.yaml` — `baseUrl`, `defaultModel`                                                                 | free, needs llama.cpp on grex-foxtrot:8090 |
| `none`       | deterministic steps only (fetch, render, promote)                                                                    | zero                       |

Provider key lives in vault: `swamp vault read-secret llm-secrets OPENROUTER_API_KEY`.
Switch globally by editing `trigger.inputs.provider` in each workflow YAML.

## Store semantics

- Append-only: `observation → tension → synthesis → card → graveyard/feedback`.
  Corrections are new records; nothing mutates upstream.
- Schema-validated on write; failures land in `deadletter`, never dropped.
- Every artifact is a versioned swamp data record — `swamp data query`, replay,
  and red-team queries all work against one store.
- Query examples:
  - `swamp data query 'modelName == "records" && name.startsWith("graveyard-")'`
  - `swamp data get records render-observation --json | jq '.content.count'`

## Thresholds v0 (all `hypothesis: true`)

- Gravity gate fields on every observation: touchpoint + monthlyCostEst + independentSources.
- Tension without enabling shift ≤24mo → `status: dormant`, not killed.
- Falsification verdict `mirage` → graveyard; `alive` → promotable.
- Max 3 cards/week (`records.maxCardsPerWeek`); overflow → graveyard `panel_converged_obvious`… capacity kill.
- Tuning only via monthly kill-reason distribution (redteam-monthly memo), never ad-hoc.

## Known v0 gaps (deliberate)

1. Observation dedup is per-record id hash only; embedding near-dup not yet wired.
2. Promoter ranks by panel-convergence only; no numeric panel scoring yet.
3. Reality probes (manual audits, seeded questions) are operator-driven; probe
   results attach via card field but no workflow enforces them.
4. Cost logging is implicit in swamp audit timeline; no per-stage budget enforcement.
