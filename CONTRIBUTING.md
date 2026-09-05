# Contributing

Thanks for helping improve `@nipe-solutions/react-viewport`. Please read the
[Code of Conduct](CODE_OF_CONDUCT.md) and keep changes focused and reviewable.

## Development setup

Use Node.js `>=24 <25` and npm 11.

```sh
npm ci
npm run build:dist
npm run test
```

Useful focused checks are:

```sh
npm run format:check
npm run lint
npm run typecheck
npm run test:api
npm run test:size
npm run test:package
npm run test:e2e
node scripts/verify-docs.mjs
```

Browser tests use deterministic fixtures and do not substitute for physical
mobile verification. Record new cross-browser behavior in
[`docs/browser-notes.md`](docs/browser-notes.md), add a focused regression test,
and do not change the keyboard heuristic without browser evidence.

## Contribution expectations

- Explain the user-visible behavior and relevant browser conditions in the pull
  request.
- Add or update tests for a change in behavior. Use the same focused browser or
  unit check that demonstrates the issue when possible.
- Preserve SSR safety: module import and server render must not touch browser
  globals.
- Do not add device tables, user-agent checks, or claims of manual verification
  without reproducible evidence.
- Run the applicable checks before requesting review and report checks that were
  not run.

## Documentation and browser notes

Documentation describes observed behavior and known limits. A browser-note entry
must state the browser/engine and version, the observed behavior, evidence, the
affected API or fallback, the decision, and a regression-test reference. Do not
mark a real-device result verified until a person has performed and recorded it.

## Pull requests

Use the pull-request template. Keep unrelated formatting or refactors out of a
behavior change, and update the changelog when a release-note-worthy public
change is introduced.
