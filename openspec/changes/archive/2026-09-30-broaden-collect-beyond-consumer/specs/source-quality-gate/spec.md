## MODIFIED Requirements

### Requirement: Addition and removal bar

Any source added or removed after this change SHALL state the friction class it carries (or the class left dormant), the gravity touchpoint it supports, and the verification result (HTTP status observed). For non-consumer surfaces (tender boards, job boards, seller centres, gazettes, dev forges) the entry SHALL additionally state the excerpt noise plan (what spam/boilerplate the surface carries and why the signal survives truncation to the 20k char cap) and confirm the `extract` strategy (html/json/text) already covers the page shape or name the new strategy required.

#### Scenario: Future addition judged

- **WHEN** a future change proposes a new registry entry
- **THEN** the proposal names the entry's artifact classes, gravity touchpoint, tier justification, and a passing live-fetch check, or the entry is rejected

#### Scenario: Noisy surface admitted deliberately

- **WHEN** a job-board or tender source is proposed despite listing spam or boilerplate
- **THEN** the proposal shows a sample excerpt where the firm-as-actor signal (hiring churn language, award delta, seller complaint) survives within budget, or the source is rejected
