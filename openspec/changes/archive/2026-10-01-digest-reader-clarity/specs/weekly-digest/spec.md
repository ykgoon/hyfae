## ADDED Requirements

### Requirement: Reader-first card layout

Each promoted card in the weekly digest SHALL present a plain-language reader block answering who hurts, what breaks, money size, what to sell, why now, and why the gap persists, followed by one verbatim proof quote and one next action — with no internal machine vocabulary in the reader block.

#### Scenario: Reader block renders without jargon

- **WHEN** a synthesis with joined tension and observation data is promoted
- **THEN** its digest section contains `Who hurts`, `What breaks`, `Money`, `What to sell`, `Why now`, `Why nobody did it`, `Proof`, and `Next step` lines, and contains none of the strings `alive`, `mirage`, `convergedObvious`, `falsification`, `invariantViolations`, or a raw JSON array.

#### Scenario: Missing upstream data degrades gracefully

- **WHEN** a promoted synthesis has no resolvable tension or observation (thin store, renamed ids)
- **THEN** each unresolvable reader line shows `unknown` and the card still renders alongside a `Trace: partial` flag instead of failing promotion.

### Requirement: Money and traceability join

The promoter SHALL join each promoted synthesis to its tensions and observations by id and surface buyer, cost, touchpoint, enabling shift, and provenance in the digest.

#### Scenario: Money line from observation gravity

- **WHEN** a joined observation carries `gravity.monthlyCostEst`, `gravity.touchpoint`, and `gravity.evidence`
- **THEN** the card's `Money` line shows the buyer (`actor`/`costBearer`), the `~RM X/mo` figure, the touchpoint, and a short evidence cue — e.g. `Money: small Shopee sellers — ~RM2,400/mo lost to failed payouts (transaction; from payout-queue complaints)`.

#### Scenario: Why-now line from enabling shift

- **WHEN** a joined tension carries `enablingShift.whatChanged` and `enablingShift.date`
- **THEN** the card's `Why now` line names the shift and its date in plain words.

#### Scenario: Trace links preserved

- **WHEN** a card is promoted
- **THEN** the operator appendix lists its `synthesis → tension → observation` ids plus each observation's `sourceRef`, and the reader block quotes one `rawExcerpt` (truncated to 200 chars) as `Proof`.

### Requirement: Operator appendix boundary

The digest SHALL keep all machine-facing content (falsification detail, panel lines, prior-art raw list, verdicts, feedback command) in a per-card operator appendix separate from the reader block.

#### Scenario: Appendix holds calibration tools

- **WHEN** the digest renders
- **THEN** each card's appendix contains the full prior-art list, the four panel lines, the `bin/feedback` command for that card id, and the header counts (`N promoted (cap 3). M archived`) remain at the top of the file unchanged.

### Requirement: Structured buyer facts from falsifier

The synthesis falsification step SHALL request structured buyer facts (price plausibility as numbers, first buyers, smallest sellable wedge) in both provider prompts, kept in sync.

#### Scenario: Twin prompts stay in sync

- **WHEN** the change lands
- **THEN** `synthesize-openrouter/falsify` and `synthesize-local/falsify` system prompts both request `priceTest {seats, priceRM, who}`, `firstBuyers`, and `wedge`, and `swamp workflow validate` plus `swamp workflow evaluate` pass for the `synthesize` workflow.

#### Scenario: Old syntheses still ingest

- **WHEN** LLM output omits the new optional falsification fields
- **THEN** `records.ingest_text` with `kind=synthesis` still accepts the record (zod defaults apply) and the digest renders buyer lines from observation gravity instead.
