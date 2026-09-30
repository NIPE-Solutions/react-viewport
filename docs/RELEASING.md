# Releasing

Stable `1.0.0` is prepared through the manually dispatched
[`release.yml`](../.github/workflows/release.yml) workflow on current `main`.
The workflow stages an exact retained tarball for npm approval with public access,
provenance, and the `latest` dist-tag. Maintainers approve publication in npm after
reviewing the staged version and retained artifact.

## Before dispatching

1. Confirm package and lockfile version `1.0.0`, the matching changelog heading,
   and `publishConfig` values `access: public`, `provenance: true`, `tag: latest`.
2. Confirm a clean checkout of current `main`; review the release diff and checks.
3. Use Node.js `>=24 <25` and npm `11.19.0`, and run the quality gates:

   ```sh
   NPM_CONFIG_USERCONFIG=/dev/null npm ci
   npm run check
   npx playwright install --with-deps chromium firefox webkit
   npm run test:e2e
   npm run test:website:e2e
   ```

4. Review [`docs/REAL_DEVICE_QA.md`](REAL_DEVICE_QA.md). Do not represent an
   release as physically verified if required rows remain `MANUAL PENDING`.
5. Inspect the release policy and package without publishing:

   ```sh
   NPM_CONFIG_USERCONFIG=/dev/null npm run release:check -- --dry-run --tag v1.0.0 --dist-tag latest
   ```

The dry run may inspect a dirty working tree. The staging workflow requires a
clean checkout, checks that `1.0.0` is absent from the public npm registry, and
requires its exact checkout SHA to match both the dispatch SHA and a fresh remote
`main` lookup. Authentication errors, timeouts, malformed registry responses, and
stale commits stop staging.

## Stage the retained artifact

Configure npm trusted publishing for this repository and the unchanged workflow
filename `release.yml`, with the GitHub environment `npm`. Restrict that
environment to `main` and configure the organization's required approval controls.
The workflow uses OIDC; it does not need a long-lived npm token.

Dispatch the workflow from `main`. It repeats `npm run check` and both Playwright
suites across Chromium, Firefox, and WebKit before preparing `artifacts/` once.
Preparation runs `npm pack --ignore-scripts` and validates the resulting archive.
The artifact contains exactly:

- `nipe-solutions-react-viewport-1.0.0.tgz`;
- its `.sha512` checksum;
- `release-artifact.json`, recording the source SHA, SHA-512 integrity, package
  identity, and publication policy.

The archive must contain exactly the 38 public package files. Existing bundle and
tarball limits remain enforced, including the 3,960-byte gzip and 16,779-byte
tarball budgets. All five installed consumers (ESM, CommonJS, React 18 SSR,
hydration and strict types, React 19 Vite, and React 19 Next.js) run on those same
retained bytes. To repeat that consumer check locally:

```sh
REACT_VIEWPORT_PACKAGE_TARBALL=./artifacts/nipe-solutions-react-viewport-1.0.0.tgz npm run test:package
```

This mode neither repacks nor rebuilds the supplied archive and leaves it in place.
The workflow verifies the retained files before and after uploading them as
`npm-react-viewport-1.0.0-<source SHA>` with seven-day retention, then repeats the
registry and current-main guards immediately before:

```sh
npm stage publish ./artifacts/nipe-solutions-react-viewport-1.0.0.tgz --ignore-scripts --provenance --access public --tag latest
```

This stages the verified tarball for npm approval. Review its source SHA,
checksum, package identity, dist-tag, access, and provenance before approving the
staged publication in npm. If `main` advances during the run, dispatch again from
the new commit. Release tags do not trigger publication.

## After publishing

Confirm the public registry reports version `1.0.0`, the `latest` dist-tag,
the expected tarball integrity, and provenance. Record the source SHA, workflow
run, artifact checksum, approval and publish timestamps, and any physical-device
evidence. If browser-specific behavior changed, add or update a record in
[`browser-notes.md`](browser-notes.md).
