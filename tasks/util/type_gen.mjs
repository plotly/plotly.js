/**
 * Shared helpers for the TypeScript declaration generators.
 */

// ---------------------------------------------------------------------------
// Generated file headers
// ---------------------------------------------------------------------------

/**
 * Opening text of every generated header.
 *
 * `generatedHeader` writes this text and `isGenerated` looks for it, so the two
 * cannot drift apart. A task that deletes its own stale output depends on that:
 * if the recognizer stopped matching the emitter, cleanup would quietly skip
 * every file instead of failing.
 */
const HEADER_OPENING = '/**\n * Generated from ';

/**
 * Build the header block for a generated file.
 *
 * The caller adds the blank line that separates the header from the body.
 *
 * @param source - what the file is generated from, as a path or file name
 * @param task - path of the task that writes the file, from the repository root
 * @param command - npm command that regenerates the file
 * @returns the header block, without a trailing newline
 */
export function generatedHeader({ source, task, command }) {
    return [
        `${HEADER_OPENING}${source} by ${task}.`,
        // NOTE: the em dash matches the header that `schema.d.ts` already
        // carries. Changing it rewrites that file for no behavioral gain.
        ` * Do not edit by hand — run \`${command}\` to regenerate.`,
        ' */'
    ].join('\n');
}

/**
 * Report whether a file was written by one of the type generators.
 *
 * Use this before deleting a file that a generator no longer produces, so a
 * hand-written file in the same directory is never removed.
 *
 * @param text - the file's contents
 * @returns true when the file carries a generated header
 */
export function isGenerated(text) {
    return text.startsWith(HEADER_OPENING);
}

// ---------------------------------------------------------------------------
// File text
// ---------------------------------------------------------------------------

/**
 * Join generated lines into a file body.
 *
 * The result ends in exactly one newline, whatever the caller's array ends with.
 * `npm run test-syntax` asserts that every file in the repository ends in a
 * newline, and a generator that emits two would fail the repository's own
 * formatting rules.
 *
 * @param lines - the generated lines, without line endings
 * @returns the file body
 */
export function toFileText(lines) {
    return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}

// ---------------------------------------------------------------------------
// TypeScript literals
// ---------------------------------------------------------------------------

/**
 * Render a JavaScript value as a TypeScript literal.
 *
 * Strings are single-quoted, with backslashes and single quotes escaped.
 * Numbers and booleans are rendered as themselves.
 *
 * @param value - the value to render
 * @returns the literal, ready to paste into generated source
 */
export function tsLiteral(value) {
    if (typeof value === 'string') {
        const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return `'${escaped}'`;
    }
    return String(value);
}

// ---------------------------------------------------------------------------
// JSDoc
// ---------------------------------------------------------------------------

/**
 * Build a JSDoc comment block.
 *
 * A description and no tags collapse to a single line. Anything longer becomes a
 * multi-line block. A description with no tags and no text produces no lines at
 * all, so a caller can pass whatever it has without testing for emptiness first.
 *
 * Any `*​/` inside the text is escaped, so a description cannot close the comment
 * early and corrupt the file.
 *
 * @param description - free text, which may contain newlines
 * @param tags - extra lines placed after the description, such as `@default 3`
 * @param indent - string prefixed to every emitted line
 * @returns the block's lines, without line endings
 */
export function jsDocBlock({ description, tags = [], indent = '' }) {
    if (!description && tags.length === 0) return [];

    const escape = (text) => text.replace(/\*\//g, '*\\/');

    if (description && tags.length === 0 && !description.includes('\n')) {
        return [`${indent}/** ${escape(description)} */`];
    }

    const out = [`${indent}/**`];

    if (description) {
        for (const line of escape(description).split('\n')) {
            out.push(line === '' ? `${indent} *` : `${indent} * ${line}`);
        }
    }

    for (const tag of tags) out.push(`${indent} * ${tag}`);

    out.push(`${indent} */`);
    return out;
}
