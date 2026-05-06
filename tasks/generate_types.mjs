#!/usr/bin/env node
/**
 * Generate flat .d.ts files from attribute schemas.
 *
 * Walks src/** /attributes.ts, finds each `export type XAttributes = AttrsToType<...>`,
 * resolves the mapped type to its concrete shape via the TypeScript Compiler API,
 * and emits flat declaration files into src/types/generated/.
 *
 * Each attribute file declares the canonical public type name via a JSDoc marker:
 *
 *     ＠generates ModeBar
 *
 * That tells the generator to emit `export type ModeBar = { ... }` in the
 * generated index, replacing any hand-written definition.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const tsconfigPath = path.join(repoRoot, 'tsconfig.json');
const generatedDir = path.join(repoRoot, 'src/types/generated');

// ---------------------------------------------------------------------------
// 1. Discover attribute files
// ---------------------------------------------------------------------------

function findAttributeFiles(dir, results = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === 'generated') continue;
            findAttributeFiles(full, results);
        } else if (entry.isFile() && entry.name === 'attributes.ts') {
            results.push(full);
        }
    }
    return results;
}

const attributeFiles = findAttributeFiles(path.join(repoRoot, 'src'));
console.log(`Found ${attributeFiles.length} attribute file(s):`);
for (const f of attributeFiles) console.log(`  ${path.relative(repoRoot, f)}`);

if (attributeFiles.length === 0) {
    console.log('No attribute files to process. Exiting.');
    process.exit(0);
}

// ---------------------------------------------------------------------------
// 2. Build a TypeScript program over those files
// ---------------------------------------------------------------------------

const tsconfigJson = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
if (tsconfigJson.error) {
    console.error('Failed to read tsconfig:', tsconfigJson.error);
    process.exit(1);
}

const parsed = ts.parseJsonConfigFileContent(tsconfigJson.config, ts.sys, repoRoot);

const program = ts.createProgram(attributeFiles, {
    ...parsed.options,
    noEmit: true
});

const checker = program.getTypeChecker();

// ---------------------------------------------------------------------------
// 3. For each file, find @generates marker + extracted type, emit flat .d.ts
// ---------------------------------------------------------------------------

/**
 * Extract the "@generates X" name from the leading JSDoc of the const
 * declaration (or any leading comment in the file).
 */
function findGeneratesMarker(sourceFile) {
    const text = sourceFile.getFullText();
    const m = text.match(/@generates\s+([A-Za-z_][A-Za-z0-9_]*)/);
    return m ? m[1] : null;
}

/**
 * Find the exported type alias whose name ends in `Attributes`.
 * Returns the type alias declaration node.
 */
function findExtractedTypeAlias(sourceFile) {
    let result = null;
    ts.forEachChild(sourceFile, (node) => {
        if (
            ts.isTypeAliasDeclaration(node) &&
            node.modifiers &&
            node.modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
            node.name.text.endsWith('Attributes')
        ) {
            result = node;
        }
    });
    return result;
}

/**
 * Convert a resolved Type to a TypeNode using the checker, then print it
 * using the TS printer. This produces real multi-line output and we
 * post-process import("...") paths into relative references.
 */
const nodeBuilderFlags =
    ts.NodeBuilderFlags.NoTruncation |
    ts.NodeBuilderFlags.MultilineObjectLiterals |
    ts.NodeBuilderFlags.WriteClassExpressionAsTypeLiteral |
    ts.NodeBuilderFlags.UseFullyQualifiedType |
    ts.NodeBuilderFlags.InTypeAlias;

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed, removeComments: false });

/**
 * Rewrite absolute `import("/abs/path")` references in printed output to
 * paths relative to the destination directory.
 */
function rewriteImports(text, outputDir) {
    return text.replace(/import\("([^"]+)"\)/g, (_, absPath) => {
        let rel = path.relative(outputDir, absPath);
        if (!rel.startsWith('.')) rel = './' + rel;
        rel = rel.replace(/\.d\.ts$|\.ts$/, '');
        return `import("${rel}")`;
    });
}

/**
 * Replace inline `import("path").Name` references with bare `Name` and
 * return the list of `import type` statements needed at the top of the
 * generated file.
 *
 * Inline import types are valid TS but noisier than a hoisted import,
 * which is what a human-author would write.
 */
function hoistImportTypes(text, selfName) {
    const matches = [...text.matchAll(/import\("([^"]+)"\)\.(\w+)/g)];
    if (matches.length === 0) return { text, importStatements: [] };

    // Group { path → set of names }
    const byPath = new Map();
    for (const [, importPath, name] of matches) {
        // Don't import the type we're declaring — it would collide.
        if (name === selfName) continue;
        if (!byPath.has(importPath)) byPath.set(importPath, new Set());
        byPath.get(importPath).add(name);
    }

    // Replace inline references with bare names.
    const replaced = text.replace(/import\("([^"]+)"\)\.(\w+)/g, (_, importPath, name) => {
        if (name === selfName) return `import("${importPath}").${name}`;
        return name;
    });

    // Sort by path, names within each import sorted alphabetically.
    const importStatements = [...byPath.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([importPath, names]) => {
            const sorted = [...names].sort();
            return `import type { ${sorted.join(', ')} } from '${importPath}';`;
        });

    return { text: replaced, importStatements };
}

const dummyFile = ts.createSourceFile('__d.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

/**
 * Convert a resolved Type into a printable declaration. If the type
 * resolves to an object literal, emit it as an `interface` (so the
 * canonical name appears in error messages and consumers can extend it
 * via declaration merging). Otherwise — for unions, intersections,
 * tuples, primitives — emit a `type` alias.
 *
 * Returns `{ kind: 'interface' | 'type', text }`. `text` is the body of
 * the interface (without name/braces) or the RHS of the type alias.
 */
function formatDeclaration(type, enclosingDecl, outputDir) {
    const typeNode = checker.typeToTypeNode(type, enclosingDecl, nodeBuilderFlags);
    if (!typeNode) return { kind: 'type', text: 'unknown' };

    if (ts.isTypeLiteralNode(typeNode)) {
        // Emit each member separately so we can build an interface body.
        const memberLines = typeNode.members.map((m) =>
            rewriteImports(printer.printNode(ts.EmitHint.Unspecified, m, dummyFile), outputDir)
        );
        return { kind: 'interface', text: memberLines.join('\n') };
    }

    const text = rewriteImports(printer.printNode(ts.EmitHint.Unspecified, typeNode, dummyFile), outputDir);
    return { kind: 'type', text };
}

/**
 * Convert "ScatterAttributes" → "Scatter" or use the @generates marker.
 */
function deriveCanonicalName(typeName, marker) {
    if (marker) return marker;
    if (typeName.endsWith('Attributes')) return typeName.slice(0, -'Attributes'.length);
    return typeName;
}

const generated = []; // { canonicalName, typeName, sourceRel, body }

for (const file of attributeFiles) {
    const sourceFile = program.getSourceFile(file);
    if (!sourceFile) {
        console.warn(`Skipping ${file}: not in program`);
        continue;
    }

    const alias = findExtractedTypeAlias(sourceFile);
    if (!alias) {
        console.warn(`  ⚠ ${path.relative(repoRoot, file)}: no exported "*Attributes" type alias`);
        continue;
    }

    const marker = findGeneratesMarker(sourceFile);
    const canonical = deriveCanonicalName(alias.name.text, marker);

    const sym = checker.getSymbolAtLocation(alias.name);
    if (!sym) {
        console.warn(`  ⚠ ${path.relative(repoRoot, file)}: could not resolve symbol`);
        continue;
    }

    // Determine where the .d.ts will land so we can compute relative imports.
    const sourceRel = path.relative(repoRoot, file);
    const outRel = sourceRel.replace(/^src\//, '').replace(/\/attributes\.ts$/, '.d.ts');
    const outPath = path.join(generatedDir, outRel);
    const outputDir = path.dirname(outPath);

    const type = checker.getDeclaredTypeOfSymbol(sym);
    const declaration = formatDeclaration(type, alias, outputDir);

    generated.push({
        canonicalName: canonical,
        typeName: alias.name.text,
        sourceRel,
        outPath,
        kind: declaration.kind,
        body: declaration.text
    });

    console.log(`  ✓ ${sourceRel} → ${canonical}`);
}

// ---------------------------------------------------------------------------
// 4. Emit individual .d.ts files + aggregating index
// ---------------------------------------------------------------------------

if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
}

// Per-file generated declarations
for (const g of generated) {
    fs.mkdirSync(path.dirname(g.outPath), { recursive: true });

    const header = `/**\n * Generated from ${g.sourceRel}.\n * Do not edit by hand — run \`npm run gen:types\`.\n */\n\n`;

    const { text: hoistedBody, importStatements } = hoistImportTypes(g.body, g.canonicalName);
    const importBlock = importStatements.length ? importStatements.join('\n') + '\n\n' : '';

    let declaration;
    if (g.kind === 'interface') {
        const indented = hoistedBody
            .split('\n')
            .map((line) => (line.length ? '    ' + line : line))
            .join('\n');
        declaration = `export interface ${g.canonicalName} {\n${indented}\n}\n`;
    } else {
        declaration = `export type ${g.canonicalName} = ${hoistedBody};\n`;
    }

    fs.writeFileSync(g.outPath, header + importBlock + declaration);
}

// Aggregating index that re-exports each canonical type
const indexPath = path.join(generatedDir, 'index.d.ts');
const indexLines = [
    '/**',
    ' * Generated type aggregator — do not edit by hand.',
    ' * Run `npm run gen:types` to regenerate.',
    ' */',
    ''
];

for (const g of generated.sort((a, b) => a.canonicalName.localeCompare(b.canonicalName))) {
    const rel = g.sourceRel.replace(/^src\//, './').replace(/\/attributes\.ts$/, '');
    // Use `export type` re-export form — works for both interface and type alias,
    // and signals to consumers that these are type-only re-exports.
    indexLines.push(`export type { ${g.canonicalName} } from '${rel}';`);
}
indexLines.push('');

fs.writeFileSync(indexPath, indexLines.join('\n'));

console.log(`\nWrote ${generated.length} generated type(s) to ${path.relative(repoRoot, generatedDir)}/`);
console.log(`Aggregator: ${path.relative(repoRoot, indexPath)}`);
