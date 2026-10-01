## 1. Renderer

- [x] 1.1 Add deterministic buyer-context derivation to `records.promote` in `extensions/models/records.ts`, using joined observation `actor`/`sourceName`/`market`, tension `costBearer`, and synthesis buyer facts, with `unknown` fallback.
- [x] 1.2 Render `Vertical: {Buyer}[ · {Market}][ · via {Source}]` immediately after `Who hurts:`, preserving plain language and the existing reader/jargon boundary.
- [x] 1.3 Run `swamp model validate`; run `swamp workflow validate` for the affected workflows.

## 2. Canonical sample

- [x] 2.1 Generate a deterministic joined fixture with `provider=none`, including one fully joined synthesis and one partial-join synthesis.
- [x] 2.2 Replace `docs/digest-sample.md` with actual current-renderer output containing both fixture cards.
- [x] 2.3 Delete `docs/digest-sample-reader.md`; leave historical `reports/` digests untouched.
- [x] 2.4 Purge all fixture/smoke records from the store.

## 3. Verification

- [x] 3.1 Verify every fixture card contains all reader lines including `Vertical:`, has no banned reader vocabulary, and uses `unknown` plus `Trace: partial` for missing evidence.
- [x] 3.2 Run `openspec validate digest-vertical-context` and confirm the change is valid.
