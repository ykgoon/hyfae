## Context

`records.promote` already joins synthesis → tension → observation and renders a plain-language reader block. It does not name the buyer population’s business context explicitly. The available deterministic signals are:

- Observation `actor`, `sourceName`, and `market`
- Tension `costBearer`
- Synthesis `priceTest.who` and `firstBuyers`
- Synthesis `mechanismSourceDomain`, which identifies the borrowed mechanism’s provenance rather than the target customer’s vertical

`market` is geographic rather than sectoral, so the renderer must not present it as an industry classification. The goal is a truthful buyer-context line, not an inferred taxonomy.

Stakeholder: a non-technical digest reader who needs to identify the relevant buyer population, source signal, and geography in one line.

## Goals / Non-Goals

**Goals:**

- Add one explicit `Vertical:` line to every promoted card.
- Compose the line only from validated store fields.
- Preserve plain language and the existing jargon boundary.
- Preserve graceful degradation with `unknown` when evidence is missing.
- Replace the obsolete canonical sample with actual current renderer output.

**Non-Goals:**

- No normalized industry taxonomy.
- No new required schema fields.
- No collector/extractor/synthesizer prompt changes.
- No ranking, cap, append-only, deadletter, header-count, or export-path changes.
- No rewrite of historical `reports/` digests.

## Decisions

**1. Renderer-composed buyer context instead of a new sector field.**
Add a deterministic `Vertical:` line derived from existing evidence. Rationale: the user selected the sufficient, schema-light option. Alternative—a new optional `sector` field plus prompt changes—was rejected as disproportionate for this follow-up.

**2. Buyer first, then source and geography qualifiers.**
Format:

```text
Vertical: {Buyer}[ · {Market}][ · via {Source}]
```

Use the already-resolved buyer when available; otherwise use the first concrete synthesis buyer fact when present; otherwise use `unknown`. Append observation `market` and `sourceName` only when those stored strings are present. Rationale: this keeps the target population primary while distinguishing source signal from geography. Alternative—calling `mechanismSourceDomain` the vertical—was rejected because it describes the borrowed mechanism, not the customer.

**3. No invention in the vertical line.**
The renderer must not map source names to industries, expand market codes into sectors, or infer missing buyer types. Missing parts are omitted or rendered as `unknown`. Rationale: preserves the repository’s zero-invention evidence discipline.

**4. Place `Vertical:` immediately after `Who hurts:`.**
Readers identify the population first, then read the friction. Rationale: minimal disruption to the existing reader order. Alternative—putting context in the operator appendix—was rejected because the missing context was specifically a reader problem.

**5. Replace `docs/digest-sample.md` and delete the duplicate reader sample.**
The obsolete sample will be overwritten outright; `docs/digest-sample-reader.md` will be removed after its useful behavior is represented by actual renderer output. The canonical sample will include one completely joined card and one partial-join fallback card. Historical `reports/` files remain untouched. Rationale: avoids maintaining two competing canonical samples and avoids rewriting historical generated output.

## Risks / Trade-offs

- [Buyer/source/market context is less precise than a taxonomy] → Mitigation: explicit scope decision; do not overclaim sector membership.
- [Line partly repeats `Who hurts`] → Mitigation: qualifiers add source and geography; buyer-only output is acceptable when upstream context is thin.
- [`sourceName` may be technical] → Mitigation: use the stored plain source label without adding machine vocabulary; do not expose ids, schemas, or workflow names.
- [Canonical sample depends on fixture records] → Mitigation: generate it from a deterministic `provider=none` fixture, copy actual renderer output, then purge fixture rows.
