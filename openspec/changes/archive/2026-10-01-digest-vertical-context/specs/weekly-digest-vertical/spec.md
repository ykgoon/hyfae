## ADDED Requirements

### Requirement: Buyer-context vertical line

Each promoted digest card SHALL include an explicit plain-language `Vertical:` line immediately after `Who hurts:`.

#### Scenario: Fully joined buyer context

- **WHEN** a promoted synthesis resolves to an observation carrying `actor`, `sourceName`, and `market`
- **THEN** the card renders `Vertical: {Buyer} · {Market} · via {Source}`, using only those stored values and plain buyer casing.

#### Scenario: Partial upstream context

- **WHEN** only some buyer, source, or market evidence resolves
- **THEN** the renderer includes the available parts, omits unavailable qualifiers, and never invents an industry, buyer type, source, or geography.

#### Scenario: Missing buyer context

- **WHEN** no buyer, source, or market evidence resolves
- **THEN** the card renders `Vertical: unknown` and preserves the existing `Trace: partial` behavior.

### Requirement: Canonical digest sample

The repository SHALL maintain one canonical current-format digest sample.

#### Scenario: Canonical sample replacement

- **WHEN** the change is implemented
- **THEN** `docs/digest-sample.md` contains actual current-renderer output with one fully joined card and one partial-join fallback card, and the obsolete legacy sample is deleted rather than archived.

#### Scenario: No duplicate canonical sample

- **WHEN** the change is implemented
- **THEN** `docs/digest-sample-reader.md` does not remain as a competing canonical sample.
