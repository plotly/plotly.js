# Releasing plotly.js

This document is for maintainers who publish plotly.js. For contributor workflows, read [CONTRIBUTING.md](CONTRIBUTING.md) and [BUILDING.md](BUILDING.md).

plotly.js follows [semver](https://semver.org). A release that adds functionality bumps the minor version. A minor version can go past 9, so `v1.22.0` is valid.

Two GitHub Actions workflows do the release:

1. [`prepare-release`](.github/workflows/prepare-release.yml) builds the release files and opens a release pull request. A maintainer starts it by hand.
2. [`publish-release`](.github/workflows/publish-release.yml) starts when the release pull request merges. It builds and packs the release files, waits for approval, and then tags the merge commit and publishes the release to npm, the Plotly CDN, and GitHub.

The workflows tag and publish nothing before the approval. Until then, you can stop a release at no cost. Close the pull request, delete the branch, and start again.

## Make a release

1. Open the [`prepare-release`](https://github.com/plotly/plotly.js/actions/workflows/prepare-release.yml) workflow and click "Run workflow"
2. Enter the version:
   - `patch`, `minor`, or `major` to bump the current version
   - an exact version, such as `4.2.0`
   - a release candidate, such as `4.2.0-rc.0`
3. Click "Run workflow"
4. Wait for the workflow to open the pull request `chore: Release vX.Y.Z`. The workflow does these steps:
   - It stops if `npm audit` reports a vulnerability of any severity. To continue, fix the vulnerability on `main`, then run the workflow again. See [If a vulnerability has no fix](#if-a-vulnerability-has-no-fix).
   - It bumps the version in `package.json` and `package-lock.json`. It stops if the new version is not higher than the current version.
   - It writes the draftlogs into [CHANGELOG.md](CHANGELOG.md)
   - It empties `draftlogs/` and updates the version in [README.md](README.md) and [CITATION.cff](CITATION.cff)
   - It runs `npm run build` and commits `dist/`
5. Review the pull request:
   - Read the new section in `CHANGELOG.md` in the pull request diff. Follow [keepachangelog](https://keepachangelog.com/) style. To fix an entry, commit the change to `CHANGELOG.md` on the release branch.
   - Make sure that each community contribution has a credit line
6. Wait for CI to pass, and get an approval
7. Merge the pull request

   > [!CAUTION]
   > If `main` changes before you merge, the release includes those changes, but the new `CHANGELOG.md` section does not list them. Their draftlogs stay for the next release. To list them in this release, close the pull request, delete the branch, and run `prepare-release` again.

8. Open the [`publish-release`](https://github.com/plotly/plotly.js/actions/workflows/publish-release.yml) run for the merge commit. Its `build` job runs `npm run build` on the merge commit and packs every release file. The published files come from this build, not from the committed `dist/`.
9. Click "Review deployments", select `release`, and approve. The `publish` job then does these steps:
   - It tags the merge commit `vX.Y.Z`
   - It publishes `plotly.js` and the 19 bundle and locale packages to npm, with the dist-tag `latest`, or `rc` for a release candidate
   - It uploads the bundles to the Plotly CDN. Then it makes sure that the CDN serves `plotly-X.Y.Z.js` and `plotly-X.Y.Z.min.js`.
   - It creates the GitHub release from the CHANGELOG section
10. Post a link to the release, `https://github.com/plotly/plotly.js/releases/tag/vX.Y.Z`, in the team announcement channels

> [!WARNING]
> The approval in step 9 is the last point at which you can stop the release. npm does not let you change or reuse a published version. To correct a bad release, publish a new patch release. If necessary, run `npm deprecate plotly.js@X.Y.Z "<reason>"` for the bad version.

## If a vulnerability has no fix

Fix every `npm audit` finding before a release when a fix exists. If a finding has no fix yet and the release cannot wait, skip the audit:

1. Run `prepare-release` with `skip-audit` selected
2. In `skip-audit-reason`, explain why the release cannot wait. For example, name the advisory and say why it does not affect plotly.js.
3. Review the "Security audit" section in the release pull request. It shows the reason and the `npm audit` output.

The workflow stops if you select `skip-audit` without a reason.

## Make a release candidate

Follow the steps in [Make a release](#make-a-release), with a version such as `4.2.0-rc.0`. A release candidate differs from a full release in these ways:

- The draftlogs stay in `draftlogs/`, so that the full release includes them
- README.md and CITATION.cff keep the previous version
- npm gets the dist-tag `rc`, and the GitHub release is a pre-release

## Make a maintenance release

A maintenance release patches an older major version, for example for a security fix. The workflows release only from `main`, so a maintainer makes a maintenance release by hand, with the tooling of the older version. This example patches `v3.7.0` and publishes `3.7.1`.

1. Run `git show v3.7.0:package.json` and read the `preversion` script for the toolchain. A v3 tag needs Node.js 18.
2. Run `git switch -c maintenance-v3.7.1 v3.7.0`
3. Run `npm ci`
4. Find the commits on `main` that fix the bugs. This example uses `a34ad3`.
5. Run `git cherry-pick a34ad3`, fix the merge conflicts, and test the behavior. To apply several patches at once, use the GitHub `.patch` URLs with `git am`.
6. Run `npm version patch`. The command bumps the version to `3.7.1`, runs `npm run build`, commits, and adds the tag `v3.7.1`.
7. Run `git show HEAD` to review the version commit
8. Run `git push origin maintenance-v3.7.1 v3.7.1`
9. Run `npm login`, and confirm your access with `npm access list packages | grep plotly`
10. Run `DRYRUN=1 npm publish --tag maintenance`. The `DRYRUN` variable stops the `postpublish` script from publishing the bundle packages, so only `plotly.js` gets the patch.
11. Run `npm view plotly.js versions` and confirm that the list holds `3.7.1`
12. Run `npm dist-tag ls plotly.js` and confirm that `latest` still points at the current release

> [!WARNING]
> If you run `npm publish` without `--tag maintenance`, the maintenance release takes the `latest` dist-tag. A clean `npm install plotly.js` then installs `3.7.1` instead of the current release. To correct this, run `npm dist-tag add plotly.js@<current version> latest`.

Do not upload a maintenance release to the CDN. This policy encourages every user to run the current plotly.js release.

## If a publish step fails

Every step in the `publish` job skips the work that is already done. The job reuses the files from the `build` job of the same run. The npm and GitHub steps make sure that the version is not already published before they publish. The CDN step uploads the files again and overwrites them.

1. Read the failed step in the `publish-release` run, and fix the cause. For example, renew a credential or wait for an npm outage to end.
2. Click "Re-run failed jobs"
3. Approve the `release` environment again

If a fix needs a code change, run the publish workflow from `main` with "Run workflow" after the fix merges. The workflow resumes when the tag `vX.Y.Z` points at the commit, and stops when the tag points at an older commit. In that case, publish a new patch release instead.

## Publish by hand

Use these steps only if GitHub Actions is not available. Merge the release pull request first.

1. Run `git switch main && git pull`, then `npm ci` and `npm run build`
2. Run `git tag -a vX.Y.Z -m vX.Y.Z && git push origin vX.Y.Z`
3. Run `npm login`, and confirm your access with `npm access list packages | grep plotly`
4. Run `npm publish --tag <dist-tag>`, where `<dist-tag>` is `latest`, or `rc` for a release candidate
5. Run `npm run sync-packages -- --tag <dist-tag>` to publish the bundle and locale packages

   > [!NOTE]
   > `DRYRUN=1 npm run sync-packages` packs each package with `npm publish --dry-run` and publishes nothing.

6. Run `./tasks/cdn_publish.sh` with AWS credentials for the CDN bucket
7. Run `gh release create vX.Y.Z --verify-tag --title vX.Y.Z --notes "$(node tasks/release_notes.mjs)"`
