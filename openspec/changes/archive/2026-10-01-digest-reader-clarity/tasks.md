## 1. Schema + renderer (deterministic, zero LLM spend)

- [x] 1.1 Add optional falsification fields to `SynthesisSchema` (`priceTest`, `firstBuyers`, `wedge` with defaults) in `extensions/models/records.ts`; `deno check extensions/models/records.ts` clean.
- [x] 1.2 Add optional display helpers to `CardSchema` (`whoPays`, `painRM`, `whyNow`, `offering`) with defaults; old cards still validate.
- [x] 1.3 Rewrite `promote` digest lines: reader block (Who hurts / What breaks / Money / What to sell / Why now / Why nobody did it / Proof / Next step) + operator appendix (prior art, panel, feedback cmd); jargon ban-list enforced; missing fields render `unknown` + `Trace: partial`.
- [x] 1.4 Wire upstream join: extend `workflows/workflow-synthesize.yaml` promote step inputs with `tensions` + `observations` via `data.findBySpec`; build id maps in `promote`; `swamp workflow validate && swamp workflow evaluate` green.

## 2. Prompts (twin-job sync)

- [x] 2.1 Extend `synthesize-openrouter/falsify` system prompt to request `priceTest {seats, priceRM, who}`, `firstBuyers`, `wedge`.
- [x] 2.2 Mirror identical request into `synthesize-local/falsify`; diff twin blocks to confirm sync (modulo backend names).
- [x] 2.3 `swamp model validate` passes for `records`; `swamp workflow validate` 5/5.

## 3. Verification + sample

- [x] 3.1 Deterministic smoke: `swamp workflow run extract --input provider=none`, then `synthesize --input provider=none`; purge smoke data (`swamp data delete records <name> --yes`).
- [x] 3.2 Rewrite W40 card (`syn-efficiency-pressure-sales`) in new reader format as manual sample; confirm six reader questions answerable in <2 min by a non-technical reader.
- [x] 3.3 Confirm header counts (`N promoted (cap 3). M archived`) and `bin/digest` export path unchanged; `reports/` output spot-checked.
- [x] 3.4 `openspec validate --change digest-reader-clarity` (or `openspec status`) shows tasks complete and change apply-ready.
