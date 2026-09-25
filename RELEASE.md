# Releasing plotly.js

This document is for maintainers who publish plotly.js. For contributor workflows, read [CONTRIBUTING.md](CONTRIBUTING.md) and [BUILDING.md](BUILDING.md).

plotly.js follows [semver](https://semver.org). A release that adds functionality bumps the minor version. A minor version can go past 9, so `v1.22.0` is valid.

Do every step below for each release, unless indicated otherwise.

## Update README, CHANGELOG, and CITATION

- Open [GitHub Actions](https://github.com/plotly/plotly.js/actions?query=branch%3Amain) and confirm that the `main` branch passes the tests
- Run `git switch main && git pull`
- Run `git status` and confirm that the working tree is clean
- Run `git switch -c release-vX.Y.Z`, where `X.Y.Z` is the new version number
- Run `npx check-node-version --node 22 --npm 10`
- Run `npm ci`
- Run `npm run preversion`
- Update the version number and the release date in [README.md](README.md) and [CITATION.cff](CITATION.cff). Skip this step for a release candidate.
  - Use find-and-replace in the README. The version number appears in three `https://cdn.plot.ly/plotly-X.Y.Z...` script URLs.
  - Update the `version` field and the `date-released` field in [CITATION.cff](CITATION.cff)
- Run `npm run use-draftlogs` to copy the `draftlogs/` folder into [CHANGELOG.md](CHANGELOG.md)

  > [!NOTE]
  > `npm run use-draftlogs` accepts a filename that ends in `_add.md`, `_remove.md`, `_deprecate.md`, `_change.md`, or `_fix.md`. This will raise an error for any other name; rename files if necessary.

- Review [CHANGELOG.md](CHANGELOG.md). Replace the placeholder heading `## [X.Y.Z] -- UNRELEASED` with the real version number and release date.
  - Follow [keepachangelog](https://keepachangelog.com/) style
  - Correct typos and add missing entries and extra details
  - Open `https://github.com/plotly/plotly.js/compare/vX.Y.Q...main` to view every commit since the previous release `vX.Y.Q`
  - Confirm that every draftlog entry uses the link template `[[#1234](https://github.com/plotly/plotly.js/pull/1234)]`
  - Credit a community contributor at the end of that entry: **', with thanks to @plotly-user for the contribution!'**
- Run `npm run empty-draftlogs` to empty the `draftlogs/` folder. Skip this step for a release candidate.
- Run `git add -u . && git commit -m "chore: Updates for release vX.Y.Z"`

## Update package.json and generate the release build

- Run `npm version vX.Y.Z` from the repository root (for a release candidate, include the prerelease part, as in `npm version v4.2.0-rc.0`). The command runs these steps in order:
  - Run the `preversion` script, which tests the Node.js and `npm` versions, tests for `npm link`ed packages, and walks the dependency tree
  - Bump the version in `package.json`
  - Run the `version` script, which runs `npm run build` and then `git add -A lib dist build src/version.js`
  - `git commit`, with the message `'X.Y.Z'`
  - `git tag -a`, with the tag `'vX.Y.Z'`
  - The `postversion` script, which prints _Version bumped and committed. If ok, run: git push && git push --tags_

  The build writes the `dist/` files: main bundles, partial bundles, locales, plot-schema, and geo assets. The build also writes the generated build files under [`build/`](build/README.md) and the package version file in `src/`.

  > [!NOTE]
  > The `npm ls` step inside `preversion` fails if the dependencies under `node_modules/` don't meet the requirements listed in `package.json`. Run `npm ci` to fix this issue.

- Run `git show HEAD` to review the commit
  - The output shows the new CDN bundle links and the new bundle sizes in `dist/README.md`, plus the new code in the dist bundles
  - Carefully review the new bundle sizes in `dist/README.md`. If a bundle size has changed unexpectedly, or the diff contains any other unexpected change, run `git reset --hard HEAD^` and `git tag -d vX.Y.Z` to undo the last commit and tag. Investigate the issue before proceeding.
- If everything looks good, run `git push && git push --tags` to push the release branch and the release tag
- Open a pull request against `main`, and assign the `no-draftlog` label
- Wait for CI to pass, and get an approval
- Merge the pull request with a merge commit

  > [!CAUTION]
  > Do not squash merge, since that will result in the tagged commit `vX.Y.Z` not being part of `main`

## Publish the release

- Run `git switch main && git pull` after the pull request merges
- Run `git describe --tags` and confirm that the output reads `vX.Y.Z`

### Publish to npm

- Run `npm access list packages | grep plotly` to confirm your permission to publish the plotly.js packages
  - The output lists the Plotly packages that you can update
- If that command returns no result, authenticate with npm:
  - Confirm your membership in the `plotly` npm organization. If you're not a member, contact the Libraries team for next steps.
  - Run `npm login`
  - Complete the authentication flow with the credentials for your account
  - Confirm in the terminal that the command finished
  - Run `npm access list packages | grep plotly` again, and read the list of Plotly packages
- Run `npm pack --dry-run`. This shows what will be included in the published package without actually publishing.
  - Compare the package size against the previous release. An unexpected large change can be an indicator that something was added/removed that shouldn't have been.
  - Look for any files that don't belong in the release (usually at the project root level). If you find any, investigate why they're showing up. One resolution option is updating [.npmignore](.npmignore).
- For a full release, run `npm publish`. This will publish the new version to the [npm registry](https://www.npmjs.com/package/plotly.js).
- For a release candidate, run `npm publish --tag rc` instead
- You will be prompted by npm to authorize publishing before proceeding. If you see an option to allow publishing without a challenge for the next few minutes, enable it. This will allow for easy partial bundle publishing that immediately follows completion of the `publish` step.

  > [!NOTE]
  > Before the `publish` step starts, the `prepack` and `postpack` scripts will run. These manage converting TS files to JS before packing and removing them after packing. After the `publish` step completes, the `postpublish` script will run. This kicks off `tasks/sync_packages.js`, which publishes the partial bundles.

### Publish to the Plotly CDN

- Run `which aws` to determine if the AWS CLI is installed on your system
- If the command returns no path, install the CLI. You can run `pip install awscli`, or `brew install awscli` on macOS.
- Run `./tasks/cdn_publish.sh` to upload the new release files to the CDN bucket on S3
- If that step fails with an authentication error, run `aws configure` and enter the credentials for the plotly.js CDN bucket

### Publish to GitHub

- Open the [releases page](https://github.com/plotly/plotly.js/releases) and click "Draft a new release"
- Select the tag for the release
- Set the title to `vX.Y.Z`, the same text as the tag
- Copy the description from the matching section of the CHANGELOG. Add extra context if necessary.
- For a release candidate, select the "This is a pre-release" box
- Click "Publish release"

## Post-release tasks

- Post a link to the release tag, `https://github.com/plotly/plotly.js/releases/tag/vX.Y.Z`, in the team announcement channels

## Make a maintenance release

At times it may be required to patch an older version of plotly.js (for a security fix, etc.). This example patches `v3.7.0` and publishes `3.7.1`.

- Run `git show v3.7.0:package.json` and read the `preversion` script for the toolchain
  - A v3 tag needs Node.js 18. A v4 tag needs Node.js 22.
- Run `git switch -c maintenance-v3.7.1 v3.7.0`
- Run `npm ci`
- Find the commits on `main` that fixed the bugs in question. This example uses `a34ad3`.
- Run `git cherry-pick a34ad3`, fix the merge conflicts, and test the behavior
- To apply several patches at once, use GitHub's `.patch` URLs with `git am`
- Run `npm version patch`. The command bumps the version to `3.7.1`, runs `npm run build`, commits, and adds the tag `v3.7.1`.
- Run `git show HEAD` to review the version commit
- Run `git push && git push --tags`
- Run `DRYRUN=1 npm publish --tag maintenance`
  - `DRYRUN` prevents publishing of the partial bundles via `tasks/sync_packages.js`. The patched bundle will still be published.
- Run `npm view plotly.js versions` and confirm that the list holds `3.7.1`
- Run `npm dist-tag ls plotly.js` and confirm that `latest` still points at the current release

### Notes on maintenance releases

- The `--tag` argument in the `npm publish` step is **very important**. Without that argument, the maintenance release takes the `latest` tag on npm. A clean `npm install plotly.js` then installs `3.7.1` instead of the current release from `main`.
- Do not push a maintenance release to the CDN. This policy encourages every user to run the current plotly.js release.
