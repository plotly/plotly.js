# Code style

`npm run lint` runs the biome linter, and `biome.json` fixes the formatting settings. This document covers the judgment calls that neither one can make.

## Formatting

Biome owns formatting. The JavaScript rules live in `biome.json`.

Run the formatter on every file you add:

```bash
npx @biomejs/biome format --write <path>
```

Format only files you created. Never pass a directory, and never format a file that already existed. The CLI formats a whole file at a time, and this repository is not formatted from end to end, so either one rewrites lines your change never touched and buries the real diff.

In an existing file, write the lines you add by hand, to follow the rules outlined in `biome.json`. The settings are the house style, so follow them even when the lines around yours predate them. If you formatted such a file by accident, undo your changes and redo the edit.

`npm run lint-fix` also writes. It formats `test/image/mocks` and applies the safe lint fixes across every included path, so run it only when you want both.

## Modernize the lines you touch

Use `const` and `let`, arrow functions, template literals, and `async`/`await` on every line you change. Do not convert the rest of the file. A pull request that modernizes a whole file hides the real change from the reviewer.

Much of this code predates ES6. That is a reason to leave untouched lines alone, not a reason to write pre-ES6 code in the lines you add.

## Extend what exists

Update the existing function instead of adding a helper beside it. A new helper that overlaps an old one leaves the reader with two ways to do one thing, and the old one keeps its callers.

Before you write a helper, search `src/lib/` for the behavior. `Lib` already holds the common cases, including `coerce`, `nestedProperty`, `isPlainObject`, and the date helpers. Color is the exception: it lives in `src/components/color`, not in `Lib`.

The same rule applies to types. Reuse a type from `src/types/` instead of declaring a similar one.

## Do not rename for taste

Keep the diff focused on behavior. Rename an identifier only when the change makes the old name actively wrong. A rename spreads the diff across files and blocks `git blame`.

Do not abbreviate words that the codebase spells out. Write `constructor`, not `ctor`.

## Comments

- Do not rewrite a comment when the replacement means the same thing. Leave the author's phrasing alone.
- Delete a comment that restates the code. `// footer info` above `getFooter()` is noise.
- Code must be self-documenting where possible
- An inline comment gives the reason for the code, not a translation of it
- A doc comment is a contract: what the unit does, what the caller supplies, what it returns, and how it fails. See [writing-style.md](writing-style.md).
- Default to no comment. A comment must earn its place for a future maintainer reading the code cold. It must explain *why* something non-obvious is there, never how it was discovered. Naming the specific call site, flag, or test that motivated a defensive line is noise.

## JSDoc

Put the parameter list in one top-level block. Use `@param name - description`. Do not annotate each parameter inline. VS Code renders the first form and drops the second.

```js
/**
 * Coerce the axis range from user input.
 *
 * @param containerIn - the user-supplied axis container
 * @param containerOut - the full axis container to write into
 * @returns the coerced range, or undefined when the axis is autoranged
 */
```

## TypeScript

The repository moves toward TypeScript. Prefer `.ts` for a new file. Do not run a bulk migration of existing `.js` files as part of another change.

Put `import type` on its own line. The repository has no inline `type` imports.

```ts
import isNumeric from 'fast-isnumeric';
import { BADNUM } from '../constants/numerical';
import type { Datum } from '../types/lib/common';
```

Run `npm run typecheck` after any change under `src/types/`.

## Markdown

- Default to writing long sentences without line breaks. Only add line breaks for long lines if the surrounding text uses them.

## Efficiency beats cleverness

This library redraws a whole figure on every interaction, and a figure can carry a million points. So the code that runs per point pays for every abstraction. In `calc`, `plot`, `style`, `hoverPoints`, `selectPoints`, and any loop over a data array, write the plain, obvious, fast thing.

- Use a plain `for` loop over a data array. A chain of `map`, `filter`, and `reduce` allocates an array per step and walks the data once per step.
- Allocate nothing per point. Reuse an object, or write into a typed array.
- Hoist the invariant work out of the loop: property lookups, `Lib.nestedProperty` calls, closures, and regular expressions
- Walk the data once. A short expression that hides a second pass, or an O(n²) scan, costs more than ten plain lines that scan once.
- Never reach for a clever construct to save a line in a hot path. The reviewer must see the cost of the code from the shape of the code.

Outside the hot paths, clarity wins. The defaults path, the attribute files, and the plot API run once per figure, so write them for the reader.

## plotly.js idioms

- `Lib.coerce` with `dflt: null` deletes the property. An unset attribute reads as `undefined`, not `null`. Test with the loose `== null`.
- Every attribute needs an `editType`. The flag decides which redraw path runs. A wrong `editType` produces a stale plot with no test failure.
- Attribute objects must stay JSON-serializable. The schema generator reads them.
- `supplyDefaults` must scale with the attribute count, not the data point count. Loop over data arrays in `calc` instead.
- `@plotly/d3` is a fork of d3 v3. Do not reach for a d3 v7 API, and do not propose `@types/d3` v7 or a d3-v7-era submodule version.
