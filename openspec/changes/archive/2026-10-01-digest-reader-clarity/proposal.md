## Why

The weekly digest (`reports/digest-*.md`, rendered by `records.promote`) is the only human surface of the Hyfae machine, but the W40 report proves it fails a non-technical reader: no visible buyer, no pain size in RM, no product shape, and internal jargon (`Durability: alive`, raw prior-art JSON, empty `Panel disagreement: —`, copy-paste `swamp model ... ingest` command) leaks into the reader view. Entrepreneurial opportunity stays cryptic.

## What Changes

- Split digest rendering into a plain-language reader view (default, top of file) plus a collapsed operator appendix (machine guts stay available, out of the way).
- Reader view per card answers six questions in plain words: who hurts, what breaks, money size, what to sell, why now, why nobody did it — plus one verbatim proof quote and a next action.
- Deterministic join at `promote` time: synthesis → tension → observation, so money fields already in the store (`gravity.monthlyCostEst`, `touchpoint`, `actor`, `workflow`, `costBearer`, `enablingShift`, `mechanismSourceDomain`, `mechanism`) reach the page instead of being dropped.
- Falsifier prompt asks for structured buyer/wedge facts (`priceTest`, first-20-buyers sketch) so the renderer has numbers to show, not prose to parse.
- No store breakage: append-only semantics kept; old cards still render (missing fields show as "unknown", never crash); overflow/graveyard counts unchanged.

## Capabilities

### New Capabilities

- `weekly-digest`: reader-first contract for the weekly markdown — sections per card, plain-language rules, money/trace requirements, operator-appendix boundary.

### Modified Capabilities

- None — existing specs (`source-coverage`, `source-quality-gate`, etc.) describe collection, not the digest surface. No requirement changes to them.

## Impact

- Affected code: `extensions/models/records.ts` (`promote` renderer + `CardSchema` display path), `workflows/workflow-synthesize.yaml` (both `falsify` prompts: `synthesize-openrouter` + `synthesize-local` kept in sync), `bin/digest` (no change expected, export path unchanged).
- Affected data: `digest-*` resources gain reader sections; `synthesis` records gain optional structured buyer fields (backward-compatible, zod `.default()` / optional).
- Dependencies: none new. Verification via existing ladder (`deno check`, `swamp model validate`, `swamp workflow validate && evaluate`, `PROVIDER=none` smoke + W40 rewrite sample).
