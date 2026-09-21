# source-quality-gate

## Purpose

Per-source health and friction-density bar, fetch-failure semantics, and acceptance checks for adding or removing a source. Synced from change `justify-collect-source-coverage`.

## Requirements

### Requirement: Automatable tiers only

The `sources` registry SHALL contain only Tier A (public GET) and Tier B (versioned/diffable) entries; Tier C SHALL enter only via human-mediated `ingest_paste`, never via registry automation.

#### Scenario: No walled platforms in registry

- **WHEN** `swamp model validate` runs on the `sources` model
- **THEN** every registry entry has `tier` of `A` or `B`, and no entry points at a login-walled or ToS-prohibited platform

### Requirement: Fetch health gate

Every registered source SHALL return HTTP 200 with a non-empty excerpt in the implementation verification run; at runtime, fetch failures SHALL be recorded as empty pages with `status: 0` and SHALL NOT fail the run.

#### Scenario: Verification run green

- **WHEN** the implementer runs the live-fetch verification over the final roster
- **THEN** all sources return HTTP 200 with non-empty excerpts (mirroring the 7/7 bar in `docs/IMPLEMENTATION.md` §3), and any source that cannot pass is removed or replaced before merge

#### Scenario: Runtime failure tolerated

- **WHEN** a source is unreachable during a scheduled `collect-daily` run
- **THEN** `fetch_all` still writes the remaining pages plus the bundle, and the failed source appears as an empty page with `status: 0`

### Requirement: Excerpt budget preserved

The registry SHALL keep `maxCharsPerSource: 20000`, one `page` resource per source plus one combined `bundle`, and complete registry metadata (`language`, `market`, `artifactClasses`, `extract`) on every entry.

#### Scenario: Budget enforced

- **WHEN** `collect-daily` runs with `provider=none`
- **THEN** no single source contributes more than 20000 characters to the bundle, and every page carries its source name, tier, language, market, and artifact classes

### Requirement: Addition and removal bar

Any source added or removed after this change SHALL state the friction class it carries (or the class left dormant), the gravity touchpoint it supports, and the verification result (HTTP status observed).

#### Scenario: Future addition judged

- **WHEN** a future change proposes a new registry entry
- **THEN** the proposal names the entry's artifact classes, gravity touchpoint, tier justification, and a passing live-fetch check, or the entry is rejected
