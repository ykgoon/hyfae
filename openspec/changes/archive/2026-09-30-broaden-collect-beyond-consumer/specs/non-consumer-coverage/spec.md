## ADDED Requirements

### Requirement: Firm-as-actor source roster

The registry SHALL contain at least 3 non-consumer Tier A/B sources spanning at least 2 of these families: procurement exhaust, hiring duct-tape, seller-side mirrors, regulatory exhaust v2, build-trail signals. At least one source SHALL carry `hire_ducttape` or `labor` gravity, and at least one SHALL carry firm-as-actor transaction gravity (actor is a business operator, not an end user).

#### Scenario: Non-consumer carriers present

- **WHEN** a reviewer inspects `models/@hyfae/fetcher/sources.yaml` after the change
- **THEN** at least 3 entries have firm-as-actor provenance (tender board, job board, seller centre, gazette, dev forge), covering ≥2 families, with `hire_ducttape`/`labor` carried by ≥1 source and firm-as-actor transaction carried by ≥1 source

#### Scenario: Bundle shows firms not just users

- **WHEN** `collect` runs with `provider=none` after the change
- **THEN** the bundle contains at least 2 non-empty pages whose excerpts voice a business operator (tender notice, job ad, seller complaint, compliance circular, integration bug report), each within the 20k char cap

### Requirement: Consumer-as-symptom trace-upstream

Every observation extracted from a consumer-voiced excerpt SHALL name the merchant/operator counterparty who would pay for a fix (`counterparty` field: who loses money on the business side and why), in addition to the existing `actor`/`workflow`/`friction` fields. Observations where no plausible paying counterparty exists SHALL be dropped or scored lowest.

#### Scenario: Consumer observation traces to payer

- **WHEN** the collector LLM processes a wallet top-up failure review
- **THEN** the resulting observation names the counterparty (e.g. merchant losing the sale, wallet ops team absorbing support cost) with a one-line money path, or the observation is omitted from the max-10 set

### Requirement: Per-class observation quota

Of the maximum 10 observations per `collect` run, at least 2 SHALL carry a non-`transaction` touchpoint (compliance or labor) or a firm-as-actor voice. When the bundle cannot support the quota, the run SHALL emit fewer consumer observations rather than filling the cap with consumer transaction items.

#### Scenario: Quota protects minority signal

- **WHEN** a `collect` run ingests a bundle dominated by consumer review pages
- **THEN** the stored observations include ≥2 compliance/labor or firm-as-actor items, or the run stores <10 observations total with consumer items deprioritized

### Requirement: Orphaned-class resolution

`hire_ducttape` and the `labor` touchpoint SHALL each have at least one live registry carrier after this change, or SHALL be removed from the collector prompt's advertised scope (both `extract-openrouter` and `extract-local` jobs) so the prompt claims only classes the registry can supply.

#### Scenario: No ghost hunting

- **WHEN** a reviewer compares the collector prompt's artifact-class list against registry `artifactClasses` fields
- **THEN** every class named in the prompt has ≥1 registered Tier A/B carrier, or the class has been deleted from the prompt text
