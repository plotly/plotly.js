# Pull request checklist

Walk this list before you hand the work back. Answer each item with evidence, not with an assumption.

## Before a pull request exists

- [ ] An issue covers the change, and it carries no `plotly-internal` label
- [ ] A human asked for the pull request. If nobody asked, you open the issue and stop.
- [ ] A human reviewed the code
- [ ] You saw the rendered plot, for any change that moves pixels
- [ ] You read the last few merged pull requests and matched their shape

## The change

- [ ] The diff covers the requested task and nothing else
- [ ] The change extends existing logic. No new helper duplicates an old one.
- [ ] No hot path gained a per-point allocation, an extra pass over the data, or a clever construct that hides its cost
- [ ] The change reuses existing attribute names, enum values, and types
- [ ] Backwards compatibility holds, or the pull request argues that the old output was wrong
- [ ] New lines follow the biome settings, and untouched lines stay untouched
- [ ] No identifier changed name without a behavioral reason
- [ ] No comment changed without a correctness reason
- [ ] No file under `dist/` changed
- [ ] `package-lock.json` changed only when a dependency changed

## Generated output

- [ ] `npm run schema` ran after any attribute or description edit
- [ ] `test/plot-schema.json` and `src/types/generated/schema.d.ts` are staged
- [ ] `npm run schema-typegen-diff-check` reports no drift
- [ ] The hand-written declarations under `src/types/core/` and `src/types/lib/` match the new API surface
- [ ] Regl shaders regenerated, if the diff touches a regl path

## Checks that ran

- [ ] `npx @biomejs/biome format --write` ran on every file you added
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run test-syntax` passes
- [ ] `npm run test-mock <name>` passes, for every new or edited mock

Paste the real output. If a check failed, say so.

## Handed to the human

- [ ] Named the jasmine suites that cover the change
- [ ] Named the baselines the change moves, if any
- [ ] Stated the plan for new baselines: take them from the CI artifact

## Paperwork

- [ ] A `draftlogs/` file follows [draftlogs/README.md](../draftlogs/README.md), and you said which file needs its number fixed once the pull request opens
- [ ] The pull request body links the issue and names the tests
- [ ] The pull request body is succinct, and it holds no sentence a reviewer can skip
- [ ] The body holds the bird emoji (🐦), if you ran without a human in the loop
- [ ] Prose follows [writing-style.md](writing-style.md)
- [ ] Any rule the next agent needs goes to `.agents/` in its own pull request, not this one

## Boundaries

- [ ] You ran no force push, no `gh pr merge`, and no command that rewrites history
- [ ] You posted no review, and no comment on any issue or pull request
- [ ] Every action from the "ask before" list got explicit permission
- [ ] Your report states what ran, what failed, and what you skipped
