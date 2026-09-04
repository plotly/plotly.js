/**
 * Generate TypeScript declarations for the modular `lib/` entry points.
 *
 * `lib/index.d.ts` is hand-written and declares the full public API. Every
 * other entry point in `lib/` ships without a declaration, so a consumer that
 * writes `import * as scatter from 'plotly.js/lib/scatter'` is told that no
 * declaration file was found for the module. This task writes one declaration
 * per entry point.
 *
 * Declarations are written to `OUTPUT_DIR`, not next to the entry points, and
 * `typesVersions` in package.json maps `plotly.js/lib/<entry>` onto them.
 *
 * Four entry point shapes exist, and each maps to one declaration:
 *
 *   1. `core.js` and `index-*.js` expose the whole `Plotly` object, so their
 *      declarations re-export the hand-written `lib/index.d.ts`.
 *   2. `<trace>.js` re-exports `src/traces/<trace>`, a trace module descriptor
 *      for `Plotly.register`.
 *   3. `<component>.js` re-exports `src/components/<component>`, a component
 *      module descriptor for `Plotly.register`.
 *   4. `locales/<id>.js` holds a locale module descriptor inline.
 *
 * The task reads `lib/` instead of a hard-coded list, and throws on an entry
 * point it cannot classify. A new trace or locale therefore gets a declaration
 * for free, and a new entry point shape fails the build instead of passing
 * silently.
 *
 * Run via `npm run entry-point-types`. Run `npm run entry-point-types-check` to fail when the
 * committed output is missing, stale, or no longer generated.
 */

import * as fs from 'fs';
import * as path from 'path';

import constants from './util/constants.js';
import { generatedHeader, isGenerated, jsDocBlock, toFileText, tsLiteral } from './util/type_gen.mjs';

/** npm command that rewrites every declaration in `OUTPUT_DIR`. */
const COMMAND = 'npm run entry-point-types';

/** Path of this task, for the generated header. */
const TASK = 'tasks/generate_entry_point_types.mjs';

/**
 * Directory that holds the generated declarations, relative to the repo root.
 *
 * The declarations live here rather than beside the entry points so `lib/` stays
 * readable. `typesVersions` in package.json maps `plotly.js/lib/<entry>` onto
 * this directory, which is what makes the redirect work for consumers.
 */
export const OUTPUT_DIR = 'src/types/generated/entry_points';

/** Absolute path of `OUTPUT_DIR`. */
const pathToOutput = path.join(constants.pathToRoot, OUTPUT_DIR);

/** Path of the module descriptor types, from a file in `OUTPUT_DIR`. */
const API_TYPES_PATH = '../../core/api';

/** Path of the hand-written main declaration, from a file in `OUTPUT_DIR`. */
const MAIN_TYPES_PATH = '../../../../lib/index';

/**
 * Subdirectories of `lib/` that also hold entry points.
 *
 * `lib/locales/` holds one entry point per locale, each importable as
 * `plotly.js/lib/locales/<id>`, so each needs its own declaration.
 */
const GENERATED_SUBDIRS = ['locales'];

/**
 * `moduleType` value → the interface that describes that descriptor.
 *
 * An unmapped `moduleType` throws rather than emitting a wrong type.
 */
const DESCRIPTOR_INTERFACES = {
    trace: 'RegisterTraceModule',
    component: 'RegisterComponentModule',
    locale: 'LocaleModule'
};

// ---------------------------------------------------------------------------
// Entry point classification
// ---------------------------------------------------------------------------

/** `module.exports = require('../src/traces/scatter');` */
const RE_EXPORT = /^module\.exports = require\('\.\.\/(src\/[\w/-]+)'\);$/m;

/** `var Plotly = require('./core');` … `module.exports = Plotly;` */
const RE_BUNDLE = /require\('\.\/core'\)/;

/**
 * Classify one `lib/` entry point from its source.
 *
 * @param name - entry point name without the `.js` extension
 * @param source - full contents of the entry point
 * @returns `{kind: 'bundle'}`, or `{kind: 'module', target}` where `target` is
 *     the re-exported path relative to the repository root
 * @throws when the source matches no known shape
 */
function classify(name, source) {
    if (name === 'core' || RE_BUNDLE.test(source)) return { kind: 'bundle' };

    const match = source.match(RE_EXPORT);
    if (match) return { kind: 'module', target: match[1] };

    // `lib/locales/*.js` hold their descriptor inline rather than re-exporting it.
    const inline = matchDescriptor(source);
    if (inline) return { kind: 'inline', descriptor: inline };

    throw new Error(
        `Cannot classify lib/${name}.js. Its shape matches neither a bundle nor a module ` +
            're-export, so teach tasks/generate_entry_point_types.mjs how to declare it.'
    );
}

// ---------------------------------------------------------------------------
// Module descriptor lookup
// ---------------------------------------------------------------------------

/** `moduleType: 'trace',` */
const RE_MODULE_TYPE = /moduleType: '(\w+)'/;

/** `name: 'scatter',` */
const RE_NAME = /\bname: '([\w-]+)'/;

/**
 * `var index = require('./base_index');` … `module.exports = index;`
 *
 * Four gl traces (parcoords, scattergl, scatterpolargl, splom) build their
 * descriptor in `base_index.js` and patch one field in `index.js`, so the
 * lookup follows this single level of indirection.
 */
const RE_INDIRECTION = /var (\w+) = require\('\.\/(\w+)'\);/;

/**
 * Read the `moduleType` and `name` that a module passes to `Plotly.register`.
 *
 * @param target - module path relative to the repository root, without `index.js`
 * @returns the descriptor's `moduleType` and `name`
 * @throws when neither the module nor the file it re-exports declares both fields
 */
function readDescriptor(target) {
    const entry = path.join(constants.pathToRoot, target, 'index.js');
    const source = fs.readFileSync(entry, 'utf-8');

    const found = matchDescriptor(source);
    if (found) return found;

    const indirect = source.match(RE_INDIRECTION);
    if (indirect && new RegExp(`module\\.exports = ${indirect[1]};`).test(source)) {
        const base = path.join(constants.pathToRoot, target, `${indirect[2]}.js`);
        const viaBase = matchDescriptor(fs.readFileSync(base, 'utf-8'));
        if (viaBase) return viaBase;
    }

    throw new Error(`Cannot read moduleType and name from ${target}/index.js`);
}

function matchDescriptor(source) {
    const moduleType = source.match(RE_MODULE_TYPE);
    const name = source.match(RE_NAME);
    if (!moduleType || !name) return null;
    return { moduleType: moduleType[1], name: name[1] };
}

// ---------------------------------------------------------------------------
// Declaration templates
// ---------------------------------------------------------------------------

/**
 * Declaration for `core.js` and the `index-*.js` partial bundles.
 *
 * Each of these entry points exports the same `Plotly` object as `lib/index.js`
 * and differs only in which trace modules it pre-registers. The type surface is
 * therefore identical, and the declaration re-exports `lib/index.d.ts` verbatim.
 *
 * @param name - entry point name without the `.js` extension
 */
function bundleDeclaration(name) {
    const bundle = name.replace(/^index-/, '');
    const traces = constants.partialBundleTraces[bundle];

    if (name !== 'core' && !traces) {
        throw new Error(
            `No trace list for the ${bundle} bundle. Add it to partialBundleTraces in tasks/util/constants.js.`
        );
    }

    const registered =
        name === 'core'
            ? ['It pre-registers no trace modules. Pass the ones you need to `Plotly.register`.']
            : [`It pre-registers the ${traces.length} trace modules of the ${bundle} bundle:`, `${traces.join(', ')}.`];

    return toFileText([
        generatedHeader({ source: `lib/${name}.js`, task: TASK, command: COMMAND }),
        '',
        ...jsDocBlock({
            description: [
                `Type surface of \`plotly.js/lib/${name}\`.`,
                '',
                ...registered,
                '',
                'The type surface is the same as the full bundle, so this re-exports the',
                'main declaration. A trace that is not registered at runtime still',
                'type-checks, which matches the `@types/plotly.js` declarations that this',
                'replaces.'
            ].join('\n')
        }),
        '',
        `export * from '${MAIN_TYPES_PATH}';`,
        `export { default } from '${MAIN_TYPES_PATH}';`
    ]);
}

/**
 * Declaration for a trace or component entry point.
 *
 * The declaration types the entry point as its `Plotly.register` descriptor with
 * a literal `name`, and uses `export =` to mirror the CommonJS
 * `module.exports = <descriptor>` shape. `export =` keeps both
 * `import * as scatter from '...'` and `import scatter from '...'` working.
 *
 * Only the fields that `Plotly.register` reads are declared. A trace module
 * carries many more (`attributes`, `supplyDefaults`, `plot`, …), but those are
 * internal and are deliberately left off the public surface.
 *
 * @param entry - entry point name without the `.js` extension
 * @param descriptor - `moduleType` and `name` read from the module
 * @param target - module path relative to the repository root, named in the error message
 * @param subdir - subdirectory under `lib/`, or `''` for a top-level entry point
 */
function moduleDeclaration(entry, descriptor, target, subdir) {
    const iface = DESCRIPTOR_INTERFACES[descriptor.moduleType];
    if (!iface) {
        throw new Error(`Unknown moduleType '${descriptor.moduleType}' in ${target}. Add it to DESCRIPTOR_INTERFACES.`);
    }

    const identifier = toIdentifier(entry);
    const apiTypesPath = subdir ? `../${API_TYPES_PATH}` : API_TYPES_PATH;
    const specifier = subdir ? `${subdir}/${entry}` : entry;

    return toFileText([
        generatedHeader({ source: `lib/${specifier}.js`, task: TASK, command: COMMAND }),
        '',
        `import type { ${iface} } from '${apiTypesPath}';`,
        '',
        ...jsDocBlock({
            description: [
                `The \`${descriptor.name}\` ${descriptor.moduleType} module, for \`Plotly.register\`.`,
                '',
                '@example',
                "import * as Plotly from 'plotly.js/lib/core';",
                `import * as ${identifier} from 'plotly.js/lib/${specifier}';`,
                '',
                `Plotly.register([${identifier}]);`
            ].join('\n')
        }),
        `declare const ${identifier}: ${iface} & { name: ${tsLiteral(descriptor.name)} };`,
        '',
        `export = ${identifier};`
    ]);
}

/** Convert an entry point name to a valid TypeScript identifier. */
function toIdentifier(name) {
    const identifier = name.replace(/-(\w)/g, (_, c) => c.toUpperCase());
    return /^\d/.test(identifier) ? `_${identifier}` : identifier;
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

/**
 * Build the declaration text for every generated declaration.
 *
 * Reads `lib/` and `src/`, and writes nothing. Callers either write the result
 * to disk or compare it against the committed files.
 *
 * @returns path under `OUTPUT_DIR` → declaration text, for every entry point
 *     except `lib/index.js`, whose declaration is hand-written
 * @throws when an entry point cannot be classified, or when a module does not
 *     declare both `moduleType` and `name`
 */
export function buildEntryPointTypes() {
    const declarations = new Map();

    for (const subdir of ['', ...GENERATED_SUBDIRS]) {
        const dir = path.join(constants.pathToLib, subdir);

        const entries = fs
            .readdirSync(dir)
            .filter((file) => file.endsWith('.js'))
            .map((file) => path.basename(file, '.js'))
            .filter((name) => !(subdir === '' && name === 'index'))
            .sort();

        for (const entry of entries) {
            const source = fs.readFileSync(path.join(dir, `${entry}.js`), 'utf-8');
            const classified = classify(entry, source);

            let text;
            if (classified.kind === 'bundle') {
                text = bundleDeclaration(entry);
            } else if (classified.kind === 'inline') {
                text = moduleDeclaration(entry, classified.descriptor, `lib/${subdir}/${entry}.js`, subdir);
            } else {
                text = moduleDeclaration(entry, readDescriptor(classified.target), classified.target, subdir);
            }

            declarations.set(subdir ? `${subdir}/${entry}.d.ts` : `${entry}.d.ts`, text);
        }
    }

    return declarations;
}

/**
 * List every committed `.d.ts` under `OUTPUT_DIR`.
 *
 * @returns paths relative to `OUTPUT_DIR`, using forward slashes
 */
function listCommittedDeclarations() {
    const files = [];

    for (const subdir of ['', ...GENERATED_SUBDIRS]) {
        const dir = path.join(pathToOutput, subdir);
        if (!fs.existsSync(dir)) continue;

        for (const file of fs.readdirSync(dir)) {
            if (!file.endsWith('.d.ts')) continue;
            files.push(subdir ? `${subdir}/${file}` : file);
        }
    }

    return files;
}

/**
 * Write every generated declaration into `OUTPUT_DIR`, and delete stale ones.
 *
 * A declaration that carries the generated banner but no longer has a matching
 * entry point in `lib/` is removed, so deleting a trace does not leave a
 * declaration for a module that no longer exists.
 *
 * @returns counts of the files written and removed
 */
export function writeEntryPointTypes() {
    const declarations = buildEntryPointTypes();

    for (const subdir of ['', ...GENERATED_SUBDIRS]) {
        fs.mkdirSync(path.join(pathToOutput, subdir), { recursive: true });
    }

    for (const [file, text] of declarations) {
        fs.writeFileSync(path.join(pathToOutput, file), text);
    }

    const removed = [];
    for (const file of listCommittedDeclarations()) {
        if (declarations.has(file)) continue;

        const full = path.join(pathToOutput, file);
        if (!isGenerated(fs.readFileSync(full, 'utf-8'))) continue;

        fs.unlinkSync(full);
        removed.push(file);
    }

    return { written: declarations.size, removed };
}

/**
 * Compare the committed declarations against freshly generated text.
 *
 * @returns names of the files that are missing, stale, or no longer generated
 */
export function findStaleEntryPointTypes() {
    const declarations = buildEntryPointTypes();
    const stale = [];

    for (const [file, text] of declarations) {
        const full = path.join(pathToOutput, file);
        if (!fs.existsSync(full) || fs.readFileSync(full, 'utf-8') !== text) stale.push(file);
    }

    for (const file of listCommittedDeclarations()) {
        if (declarations.has(file)) continue;
        if (isGenerated(fs.readFileSync(path.join(pathToOutput, file), 'utf-8'))) stale.push(file);
    }

    return stale.sort();
}
