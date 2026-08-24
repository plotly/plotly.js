# Testing

Two suites guard this library. Jasmine tests run in a real browser through karma. Image tests compare rendered PNGs against baselines.

## Which test does your change need

| The change affects | Write |
|---|---|
| a coerced default, a computed value, or a public API return | a jasmine test |
| hover, click, drag, select, or zoom behavior | a jasmine interaction test |
| the drawn output: geometry, color, text placement, layering | a mock plus a baseline |
| a new attribute that changes both logic and drawing | one jasmine test for the defaults, one mock for the drawing |
| a refactor with no behavior change | nothing new. The existing suites are the test. |

A jasmine test states the expected value, so it explains itself and it fails with a readable message. A baseline states nothing, and a reviewer must eyeball the diff. So prefer a jasmine test whenever an assertion can express the change, and add a mock only for what pixels alone can show.

## Update a test before you add one

Find the suite that already covers the area and extend its describe block. A new test file for behavior that an existing suite owns splits the coverage, and the next reader finds only one half. The same holds for mocks: add a trace or an attribute to a related mock before you add a mock of your own.

## What an agent runs, and what it does not

Run these yourself. They are fast and they need no browser.

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm run test-syntax
```

Do not start a karma run without a request. The run opens a browser, takes minutes, and the output needs a human eye. Instead, name the suites your change affects and stop. The human triggers the run.

Do not generate image baselines yourself. See "Image tests" below.

A passing test suite does not prove that a visual change is right. If your change moves pixels, look at the rendered plot in the dev dashboard before you propose the work. If you cannot see the plot, say so and hand the change to a human. See [boundaries.md](boundaries.md).

## Jasmine tests

Tests live in `test/jasmine/tests/`, one `<area>_test.js` file per area.

```bash
npm run test-jasmine -- axes --nowatch
```

`--nowatch` turns off the watch mode, so the run exits after one pass instead of waiting for the next file change. Pass the exact file basename without the `_test.js` suffix, which the karma config appends for you. The name is not a substring: `-- bar` runs `bar_test.js` alone, and a partial name such as `hover_lab` matches no file, so the run finds nothing to do. Several names in one command run several suites.

Write a test for every behavior change. A bug fix needs a test that fails before the fix.

For an interaction test, fix the width, height, margins, and both axis ranges. Interaction coordinates count from the top-left corner of the plot, including the margin. A test without fixed geometry turns flaky.

## Image tests

An image test is a mock plus a baseline PNG.

- The mock is figure JSON at `test/image/mocks/<name>.json`
- The baseline is `test/image/baselines/<name>.png`

Validate a new or edited mock:

```bash
npm run test-mock <name>
```

The `mock-validation` CI job runs the same check across all mocks.

CI produces the authoritative baselines on `ubuntu-latest`. A baseline generated on another machine differs by antialiasing and font rendering, and it fails the comparison. So when a change moves the pixels:

1. Say which baselines the change moves, and why
2. Let CI fail the `test-baselines` job
3. Tell the human to download the `baselines-default-diff` artifact from the failed run and commit the images from it

Add a new mock only when no existing mock covers the case. The repository already holds over 1300 mocks, and each one costs CI time on every run.

## CI failures worth knowing

[.github/workflows/ci.yml](../.github/workflows/ci.yml) holds the full set of jobs, and it is the authority. Most job names say what broke: `typecheck` means `tsc --noEmit` failed, and a jasmine job means a suite failed. Five failures do not point at their own fix.

| Failed job | What to do |
|---|---|
| `check-draftlog` | Add the missing file under `draftlogs/`. If the change warrants no entry, ask a human to apply the `no-draftlog` label. |
| `generated-types-drift` | Run `npm run schema` and stage `test/plot-schema.json` with `src/types/generated/schema.d.ts`. |
| `check-regl-codegen` | Take the `regl-codegen` artifact from the failed run. See [build-and-tooling.md](build-and-tooling.md). |
| `mock-validation` | Fix the invalid attribute in the mock. Run `npm run test-mock <name>` to find it. |
| `timezone-jasmine` | Inspect the hover label code for a date assumption. The job runs the same suite in four timezones, so a local run in your own timezone hides the failure. |

## Do not touch the test stack

Do not bump `jasmine`, `karma-jasmine`, or `karma-viewport`. A replacement of the whole test framework is planned, and a version bump now creates work that gets thrown away.
