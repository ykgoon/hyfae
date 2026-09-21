## ADDED Requirements

### Requirement: TH carrier present

The registry SHALL contain at least one TH-market Tier A or Tier B source with full metadata (`language`, `market: TH`, `artifactClasses`, `extract`) that passed live-fetch verification (HTTP 200 + non-empty friction-bearing excerpt).

#### Scenario: TH excerpts in bundle

- **WHEN** `collect-daily` runs with `provider=none` after the change
- **THEN** the bundle contains at least one non-empty page with `market: TH` and tier `A` or `B`, carrying verbatim friction excerpts (not a bare price or empty page)

### Requirement: VN carrier present

The registry SHALL contain at least one VN-market Tier A or Tier B source with full metadata (`language`, `market: VN`, `artifactClasses`, `extract`) that passed live-fetch verification (HTTP 200 + non-empty friction-bearing excerpt).

#### Scenario: VN excerpts in bundle

- **WHEN** `collect-daily` runs with `provider=none` after the change
- **THEN** the bundle contains at least one non-empty page with `market: VN` and tier `A` or `B`, carrying verbatim friction excerpts (not a bare price or empty page)

### Requirement: Five-market prompt agreement

The collector prompt's market-scope claim (MY/ID/TH/VN/PH) SHALL agree with the registry: every claimed market has at least one registered Tier A/B source, and both extraction jobs (`extract-openrouter`, `extract-local`) carry the same scope line.

#### Scenario: Scope agreement across five markets

- **WHEN** a reviewer compares the collector prompt scope line in both extraction jobs against registry `market` fields
- **THEN** each of MY, ID, TH, VN, PH has at least one Tier A/B entry, and the two jobs' scope lines are identical

### Requirement: Roster bound and quality bar preserved

Additions SHALL be capped at 3 (net roster ≤10), `maxCharsPerSource: 20000` SHALL be unchanged, every entry SHALL carry complete metadata, and any candidate failing live-fetch verification SHALL be rejected before merge; Tier C SHALL NOT enter via the registry.

#### Scenario: Bounded green run

- **WHEN** `collect-daily` runs with `provider=none` after the change
- **THEN** the registry holds 9–10 entries, no single source contributes more than 20000 characters, every page carries source name, tier, language, market, and artifact classes, and no entry points at a login-walled or ToS-prohibited platform
