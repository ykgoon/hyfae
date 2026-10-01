## Why

The reader-first digest still does not tell a non-technical reader which buyer population an opportunity belongs to. `Who hurts` can name “small sellers,” but without buyer/source/market context the reader cannot tell whether the card concerns marketplace retail, another business vertical, or a different geography.

## What Changes

- Add an explicit `Vertical:` line to every promoted digest card.
- Compose it only from already-validated, evidence-bound fields:
  - joined observation `actor`
  - joined observation `sourceName`
  - joined observation `market`
  - joined tension `costBearer`
  - synthesis `priceTest.who` or first-buyer context
- Show `unknown`, plus qualifiers where available, when upstream evidence is missing.
- Preserve the reader-first contract: plain language, no machine vocabulary, and no invented industry labels.
- Replace `docs/digest-sample.md` with current-format output.
- Delete the duplicate `docs/digest-sample-reader.md` after merging its useful guidance.
- Use actual renderer output from a fully joined deterministic fixture, including both complete and partial cards.

## Capabilities

### New Capabilities

- `weekly-digest-vertical`: buyer-context vertical line for weekly digest cards — deterministic derivation, fallback behavior, and canonical sample requirements.

### Modified Capabilities

- None — existing collection specs are unchanged. This change only affects digest presentation and documentation.

## Impact

- Affected code: `extensions/models/records.ts` (`promote` renderer and `ReaderView`).
- No schema migration: no new required fields and no prompt changes.
- Affected docs: `docs/digest-sample.md` replaced; `docs/digest-sample-reader.md` removed.
- Verification: deterministic `provider=none` joined fixture, automated reader/ban-list checks, smoke-data purge, model/workflow validation, and OpenSpec validation.
