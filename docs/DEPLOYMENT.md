# Website deployment and provenance

## 2026-09-06 audit before website changes

The reported stale deployment was **not reproducible** at the start of this pass.
Both public aliases already returned identical HTML (ETag
`ff7da171723fde4ae82f57f9ae35a3f8`, 27,884 bytes) containing the improved hero
“Know what part of the screen is actually usable.” Live browser inspection also
confirmed the current product story. Vercel's production metadata identified
`86b3fa7c0ed7c13477f801a23864710108d1288a`, exactly the current remote `main`.

- Project: `nipe-solutions/react-viewport`, ID `prj_zb5yB9v0J0G2yM3vi4EQifECTc5g`.
- Deployment: `dpl_WE5HJaTXhvApGScpeKJnjRWGrUqT`, created 2026-09-06 08:23:39 UTC.
- Immutable URL: `react-viewport-khw6hahwn-nipe-solutions.vercel.app`.
- Aliases: `react-viewport.nipesolutions.com` and `react-viewport.vercel.app`, both
  assigned to that production deployment; no alias error or rollback target.
- Git source: `NIPE-Solutions/react-viewport`; production branch `main`;
  Git-triggered deployments and automatic custom-domain assignment enabled.
- Root: repository root (`rootDirectory: null`, displayed as `.`).
- Node: 24.x. Install: `npm ci`. Prior build: `npm run build:website`.
- Output: `website/out`, Next static export; `cleanUrls: true`; no catch-all rewrite.
- HTTP: `cache-control: public, max-age=0, must-revalidate`, Vercel cache HIT,
  matching ETags on both aliases. No evidence of a wrong-root build or CDN split.
- Local primary checkout was behind remote main; this task used an isolated
  worktree created from freshly fetched `origin/main`.

No historical root cause can be inferred from the current healthy deployment.
A stale search-engine response was observed while direct HTTP and browser reads
showed the current site; that is not evidence of a stale Vercel origin. Working
Git/domain assignments were preserved rather than reconfigured speculatively.

## Pipeline hardening

Vercel continues deploying automatically from `main`. `vercel.json` now runs
`npm run check`: formatting, lint, type checks, unit/types tests, package/API/size
checks, docs tests, website build, generated-route smoke checks and workflow tests.
The output published is the same `website/out` artifact that passed that gate.
The build script records full Git SHA, timestamp and package version
in `/build.json`; every HTML page has a `build-sha` meta tag. Hosted snapshots use the deployment SHA without requiring a `.git` directory. The marker response
has `Cache-Control: no-store`. The project stays a static site, without analytics
or diagnostic endpoints that receive data.

`.vercelignore` retains source/tests/docs required by the gate, while excluding
local dependencies, generated artifacts and worktrees. GitHub PR/push Quality and
Browser jobs remain enabled. Browser CI covers Chromium, Firefox and WebKit.
The separate Production verification workflow polls both public aliases after a
main push, can run manually, and checks daily for later drift. It fails on stale
SHA, mixed marker/HTML, wrong root, missing JS assets, or a missing
real 404. Failure appears as a GitHub Actions failure, not a fabricated successful
deployment. A failed new deployment leaves the prior good production version live;
the verifier then fails because the intended SHA did not arrive.

```sh
npm run check
npm run test:e2e
npm run test:website:e2e
npm run verify:production -- FULL_PRODUCTION_COMMIT_SHA
```

Inspect configuration with `vercel project inspect react-viewport` and deployment
assignments with `vercel inspect https://react-viewport.nipesolutions.com`.
Compare `/build.json` against `git ls-remote origin refs/heads/main` when debugging.
Do not manually copy pages or alias an unrelated deployment to hide a mismatch.


## Hosted gate compatibility

The first new preview was rejected before publishing: Vercel's working
`vercel.json` failed formatting while the committed file passed locally and in
GitHub CI. The formatter now checks that file in CI/local runs and excludes only
its hosted working copy when `VERCEL=1`; semantic configuration checks still run
in both environments. All other formatting, lint, types and tests stay enabled.
Linux compression also produced a slightly larger npm archive than macOS; the
README was shortened to retain the existing archive budget rather than raise it.


The first production marker exposed why Git worktree cleanliness is not a useful
hosted acceptance condition: Vercel's build workspace reported dirty after its
own configuration processing. Production verification therefore relies on the
Git-deployment SHA, matching HTML markers, asset availability, route content and
matching aliases. The marker deliberately makes no clean-worktree claim. This
removes an unsupported extra condition, not the commit or artifact checks.


The updated verifier successfully checked both public aliases at
`816b6ea2c1ce02d7372236edb1f60a7793671789` (build timestamp
`2026-09-06T09:13:47.321Z`), including /lab, /examples, referenced scripts and
unknown-route 404s. The latest production commit is always available from
/build.json; the follow-up removes worktree-state assertions from future builds.
