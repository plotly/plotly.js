# Architecture

Trace modules, the schema, and where a change lands. [CONTRIBUTING.md](../CONTRIBUTING.md) holds the full description of the trace module design.

## Trace modules

A trace module is a plain object with functions attached, exported from `src/traces/<name>/index.js` and registered through the registry. The figure-wide subroutines call the methods in a loop, so the subroutines work with whatever set of trace modules a bundle registers.

The methods you touch most:

- `attributes` - the JSON-serializable attribute declarations that feed the schema
- `supplyDefaults` - input settings to `gd._fullData`. Cheap. No data loops.
- `calc` - input data to calculated data. Allowed to scale with the data point count.
- `plot` - draws the trace. Called by the base plot module.
- `style`, `hoverPoints`, `selectPoints` - split out from `plot` where it helps

Read the "Trace module design" section of [CONTRIBUTING.md](../CONTRIBUTING.md) before you add a method or a new trace type.

## The schema

`test/plot-schema.json` is generated output that records the proposed API. Any change to an attribute or an attribute description changes this file.

```bash
npm run schema
```

Commit the result. The `generated-types-drift` CI job compares `src/types/generated/` and `test/plot-schema.json` against a fresh run and fails on a difference.

`dist/plot-schema.json` is a separate file. The maintainers update it at release time. Never touch it.

### Backwards compatibility and API consistency

Backwards compatibility outranks elegance. Thousands of saved figures, plus Plotly.py, Plotly.R, and Dash, feed JSON into this schema. A change that alters the output of an existing attribute needs the argument that the current output is wrong, not the argument that the new output is nicer.

So, before you add an attribute:

- Search the schema for a name that already means what you need, and reuse it. The same concept must carry the same name on every trace type.
- Reuse the existing enum values for a new value list. A new spelling of an old idea splits the API.
- Prefer a new value on an existing attribute over a new attribute
- Copy the naming pattern of the sibling attributes in the same container

```bash
grep -o '"[a-z_]*":' test/plot-schema.json | sort -u | grep <word>
```

### Hand-written types

`src/types/generated/schema.d.ts` comes from the generator. Everything else under `src/types/` is hand-written, and the generator does not update it. So when a change moves the public API surface, inspect the hand-written declarations under `src/types/core/` and `src/types/lib/` and update them in the same pull request.

The type documents live next to the code: [src/types/README.md](../src/types/README.md) for the map, [CONVERTING_ATTRIBUTES.md](../src/types/CONVERTING_ATTRIBUTES.md) for the conversion recipe, and [GENERATOR.md](../src/types/GENERATOR.md) for the generator.

## Where a change usually lands

| Change | Files |
|---|---|
| new attribute | `attributes.js`, `defaults.js`, the drawing code, a jasmine test, a mock |
| default value change | `defaults.js`, plus the baselines the change moves |
| hover or selection fix | `hoverPoints`/`selectPoints` in the trace, plus an interaction test |
| public API fix | `src/plot_api/`, plus a jasmine test |
| shader-adjacent change | see the regl section of [build-and-tooling.md](build-and-tooling.md) |
