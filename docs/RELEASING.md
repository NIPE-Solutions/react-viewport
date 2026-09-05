# Releasing

This guide is a release checklist for maintainers. It does not publish a package
and does not assert that npm trusted publishing, provenance, or organization
access has been configured.

## Before creating a release

1. Confirm the intended version and changelog entry, including alpha status.
2. Confirm the working tree is clean and review the staged diff.
3. Run the repository checks that exist for this revision:

   ```sh
   npm run format:check
   npm run lint
   npm run typecheck
   npm run test
   npm run build:dist
   npm run test:api
   npm run test:size
   npm run test:package
   npm run test:e2e
   node scripts/verify-docs.mjs
   ```

4. Review [`docs/REAL_DEVICE_QA.md`](REAL_DEVICE_QA.md). Do not represent an
   alpha as physically verified if its required rows remain `MANUAL PENDING`.
5. Perform a package dry run and inspect its output:

   ```sh
   npm pack --dry-run
   ```

## Publishing decision

Publishing requires maintainer authority in the npm organization and an approved
release process. Check the tag/version relationship and the intended npm dist-tag
before publishing. Alpha versions should use the `alpha` dist-tag; do not use a
stable tag for `0.1.0-alpha.0`.

If an OIDC trusted-publishing workflow and provenance are configured by the
organization, use the approved release path. Do not add a long-lived npm token to
ordinary CI or copy credentials into repository configuration.

## After publishing

Record the package version, git tag, publish timestamp, dist-tag, and any
physical-device evidence added for that release. If browser-specific behavior
changed, add or update a record in [`browser-notes.md`](browser-notes.md).
