/**
 * Write the TypeScript declarations for the modular `lib/` entry points.
 *
 * Run via `npm run entry-point-types`. With `--check`, the task writes nothing and exits
 * 1 when a committed declaration is missing, stale, or no longer generated. CI
 * runs the check so a new entry point cannot ship without its declaration.
 */

import { findStaleEntryPointTypes, OUTPUT_DIR, writeEntryPointTypes } from './generate_entry_point_types.mjs';

if (process.argv.includes('--check')) {
    const stale = findStaleEntryPointTypes();

    if (stale.length) {
        console.error(
            `Found ${stale.length} entry point declaration(s) out of date. Run \`npm run entry-point-types\`:`
        );
        for (const file of stale) console.error(`  ${OUTPUT_DIR}/${file}`);
        process.exit(1);
    }

    console.log('OK: entry point declarations are up to date');
} else {
    const { written, removed } = writeEntryPointTypes();

    console.log(`Generated ${written} declaration(s) → ${OUTPUT_DIR}/`);
    for (const file of removed) console.log(`Removed stale ${OUTPUT_DIR}/${file}`);
}
