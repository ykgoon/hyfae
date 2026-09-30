# source-coverage

## Purpose

Registry rules for breadth (market/tier/artifact-class matrix), thread-depth requirement, prompt-scope agreement, and justified starter-source roster. Synced from change `justify-collect-source-coverage`; extended with non-consumer both-sides breadth by `broaden-collect-beyond-consumer`.

## Requirements

### Requirement: Per-source verdict roster

The registry change SHALL record a keep / fix / drop verdict for each of the 7 starter sources, each verdict naming the friction class carried and the gravity path (touchpoint + evidence shape). Every newly added non-consumer source SHALL likewise record a verdict-style entry naming its family, friction class, gravity touchpoint, and verification result (HTTP status observed).

#### Scenario: Verdicts complete

- **WHEN** a reviewer reads the roster diff plus `docs/IMPLEMENTATION.md` §4
- **THEN** every starter source (`lhdn-einvois`, `bnm-notices`, `appstore-reviews-shopee-my`, `appstore-reviews-tng-my`, `lowyat-network`, `luno-ticker-ethmyr`, `luno-ticker-xbtmyr`) has a verdict of keep, fix, or drop with a one-line rationale, and every kept or fixed source maps to at least one artifact class and one gravity touchpoint (transaction | compliance | labor)

#### Scenario: New sources justified

- **WHEN** a reviewer reads the new-source entries
- **THEN** each added source states its non-consumer family, artifact classes, gravity touchpoint (including firm-as-actor where applicable), tier justification, and passing live-fetch check, or the entry is rejected

### Requirement: Lowyat thread depth

The `lowyat-network` registry entry SHALL point at forum thread-level surfaces (section indexes or thread listings), NOT the `lowyat.net` homepage.

#### Scenario: Bundle shows threads not front page

- **WHEN** `collect-daily` runs with `provider=none` after the fix
- **THEN** the `lowyat-network` page excerpt contains forum thread discourse (thread titles with reply activity or post text), and the registry URL no longer equals the site homepage

### Requirement: Luno tickers removed

Both Luno ticker entries (`luno-ticker-ethmyr`, `luno-ticker-xbtmyr`) SHALL be removed from the registry, and `price_asymmetry` SHALL be documented as dormant with no carrier.

#### Scenario: No bare numbers in bundle

- **WHEN** `collect-daily` runs with `provider=none` after the change
- **THEN** the bundle contains no ticker pages, and `price_asymmetry` is recorded as dormant with no carrier

### Requirement: SEA breadth matches prompt scope

The registry SHALL cover at least 3 markets including MY, with at least one ID source and at least one TH/VN/PH source; the collector prompt's market-scope claim SHALL agree with the registry's actual markets. Additionally the registry SHALL cover both sides of the market: at least 3 non-consumer (firm-as-actor) Tier A/B sources spanning ≥2 non-consumer families, and the net roster target moves from 7–8 entries to 10–12 entries to hold both breadths without drowning the minority signal.

#### Scenario: Scope agreement

- **WHEN** a reviewer compares the collector prompt scope line against registry `market` fields
- **THEN** every market claimed in the prompt has at least one registered Tier A/B source, or the prompt scope line has been narrowed to the markets actually registered

#### Scenario: Both market sides covered

- **WHEN** a reviewer counts registry entries by voice (consumer end-user vs firm operator)
- **THEN** at least 3 entries are firm-as-actor sources across ≥2 families with live-200 verification, and total roster size is 10–12 entries
