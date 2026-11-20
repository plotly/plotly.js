'use strict';

import { encode } from 'base64-arraybuffer';
import * as Lib from './index';
import type { FontSource } from '../types/core/config';

// lib/index.js builds its exports at run time, so TypeScript cannot type them.
// Read warn at call time, so that a spy on Lib.warn sees the warnings.
const warn = (...args: unknown[]) => (Lib as unknown as { warn: (...a: unknown[]) => void }).warn(...args);

/** Time limit for the download of one font file, in milliseconds */
const DOWNLOAD_TIMEOUT = 10000;

/** Export formats that put the font bytes in a file that the user keeps */
const DOCUMENT_FORMATS = ['svg', 'pdf', 'eps'];

/** The tag of the OpenType table that holds the embedding permission, 'OS/2' */
const OS2_TAG = 0x4f532f32;

/** Font container formats by the first four bytes of the file */
const SIGNATURES: Record<number, string> = {
    0x00010000: 'truetype',
    0x74727565: 'truetype',
    0x4f54544f: 'opentype',
    0x774f4646: 'woff',
    0x774f4632: 'woff2'
};

const MIME_TYPES: Record<string, string> = {
    truetype: 'font/ttf',
    opentype: 'font/otf',
    woff: 'font/woff',
    woff2: 'font/woff2'
};

/** The characters that the XML serializer writes as named entities */
const XML_ENTITIES: Record<string, string> = { amp: '&', apos: "'", gt: '>', lt: '<', quot: '"' };

const ITEM_WARNING =
    'config.fonts: each item must have a *family* string and a *source*: ' +
    'the URL of a font file, a base64 data URL, an ArrayBuffer or a typed array.';

type Permission = 'embed' | 'forbid' | 'unknown';
type Source = string | ArrayBuffer | ArrayBufferView;

interface Face {
    sourceKey: string;
    key: string;
    family: string;
    weight: string;
    style: string;
    loading: Promise<boolean>;
    loaded: boolean;
    settled: boolean;
    permission: Permission;
    bytes?: ArrayBuffer;
    format?: string;
    rule?: string;
    warned?: boolean;
}

// Faces by source key, then by family, weight and style. Two byte sources with equal bytes have the same key.
// A string source is its own key, so the cache finds the face of a long data URL without a copy of the URL.
const faces = new Map<string, Map<string, Face>>();
// The content keys of byte sources, so that each buffer gets one hash
const byteKeys = new WeakMap<object, string>();
// The values of config.fonts that produced a warning already
const warnedObjects = new WeakSet<object>();
const warnedValues = new Set<unknown>();

/**
 * Load the faces of `config.fonts` before the graph draws.
 * A face that loads stays in the cache, and later graphs use it.
 * If the download of a face fails, the face leaves the cache, and the next graph that draws tries the download again.
 * A face whose font file cannot be decoded stays in the cache as failed, so the graph warns one time.
 *
 * @param fonts - the `fonts` value of the graph config
 * @returns undefined if no face must load. Otherwise a promise that resolves after the faces load or fail.
 *   The promise resolves to true if a face loaded during the wait.
 *   A face that fails produces a warning. The promise does not reject.
 */
export function loadFonts(fonts: unknown): Promise<boolean> | undefined {
    if (fonts == null) return;
    if (!Array.isArray(fonts)) {
        warnOnce(fonts, 'config.fonts must be an array of objects with a *family* and a *source*.');
        return;
    }
    if (!fonts.length || typeof FontFace === 'undefined' || !document.fonts) return;

    const pending: Promise<boolean>[] = [];
    for (const font of fonts) {
        const face = findFace(font, true);
        if (!face) {
            warnOnce(font, ITEM_WARNING);
            continue;
        }
        if (!face.settled) pending.push(face.loading);
    }
    if (!pending.length) return;

    return Promise.all(pending).then((loaded) => loaded.indexOf(true) !== -1);
}

/**
 * Make the `@font-face` rules that embed the faces of `config.fonts` in an exported SVG.
 * An SVG image cannot use the fonts of the page, so the SVG must hold the font bytes.
 *
 * @param fonts - the `fonts` value of the graph config
 * @param svg - the serialized SVG. A face gets a rule only if a `font-family` declaration of the SVG names its family.
 * @param format - the export format. For *svg*, *pdf* and *eps*, a face gets no rule if
 *   its font file forbids embedding. A face whose permission cannot be read gets a rule.
 * @returns the CSS text for a `<style>` element, or an empty string
 */
export function fontFaceRules(fonts: unknown, svg: string, format?: string): string {
    if (!Array.isArray(fonts) || !fonts.length) return '';

    const keepsBytes = !format || DOCUMENT_FORMATS.indexOf(format) !== -1;
    const used = new Set<Face>();
    let families: Set<string> | undefined;
    let rules = '';
    for (const font of fonts) {
        const face = findFace(font, false);
        if (!face || !face.loaded || used.has(face)) continue;

        // Read the families of the SVG only when a loaded face needs them
        if (!families) families = usedFamilies(svg);
        if (!families.has(familyKey(face.family))) continue;

        used.add(face);
        if (keepsBytes && face.permission === 'forbid') {
            warnNotEmbedded(face, format || 'svg');
            continue;
        }
        rules += faceRule(face);
    }
    return rules;
}

/**
 * Read the embedding permission of a font file from the `fsType` field of its OS/2 table.
 *
 * @param bytes - the font file: TrueType, OpenType, WOFF or WOFF2
 * @returns *embed* if the font permits embedding, *forbid* if it does not,
 *   and *unknown* if the permission cannot be read. An export embeds a face of unknown permission.
 *   A WOFF2 file is always *unknown*, because browsers have no Brotli decoder.
 *   A compressed WOFF file is *unknown* if the browser has no `DecompressionStream`.
 */
export async function readEmbeddingPermission(bytes: ArrayBuffer): Promise<Permission> {
    try {
        const view = new DataView(bytes);
        const format = fontFormat(bytes);
        if (format === 'truetype' || format === 'opentype') {
            const numTables = view.getUint16(4);
            for (let i = 0; i < numTables; i++) {
                const record = 12 + 16 * i;
                if (view.getUint32(record) === OS2_TAG) {
                    return permission(view.getUint16(view.getUint32(record + 8) + 8));
                }
            }
            return 'embed';
        }
        if (format === 'woff') {
            const numTables = view.getUint16(12);
            for (let i = 0; i < numTables; i++) {
                const entry = 44 + 20 * i;
                if (view.getUint32(entry) !== OS2_TAG) continue;

                const offset = view.getUint32(entry + 4);
                const compressedLength = view.getUint32(entry + 8);
                if (compressedLength === view.getUint32(entry + 12)) {
                    return permission(view.getUint16(offset + 8));
                }
                if (typeof DecompressionStream === 'undefined') return 'unknown';

                const stream = new Blob([new Uint8Array(bytes, offset, compressedLength)])
                    .stream()
                    .pipeThrough(new DecompressionStream('deflate'));
                const table = await new Response(stream).arrayBuffer();
                return permission(new DataView(table).getUint16(8));
            }
            return 'embed';
        }
    } catch (error) {
        // A truncated or malformed file falls through to unknown
    }
    return 'unknown';
}

/**
 * Interpret the `fsType` field of the OS/2 table.
 * Bits 1 to 3 hold the usage permission, and the least restrictive bit applies.
 * Bit 1 alone (Restricted License) and bit 9 (Bitmap Embedding Only) forbid the embedding of outlines.
 */
function permission(fsType: number): Permission {
    return (fsType & 0x000e) === 0x0002 || (fsType & 0x0200) !== 0 ? 'forbid' : 'embed';
}

function fontFormat(bytes: ArrayBuffer): string | undefined {
    if (bytes.byteLength < 4) return;
    return SIGNATURES[new DataView(bytes).getUint32(0)];
}

/**
 * Find the face of one item of `config.fonts` in the cache.
 *
 * @param font - an item of `config.fonts`
 * @param create - if true, create the face and start to load it when the cache has no such face
 * @returns the face, or undefined for an invalid item or a face that is not in the cache
 */
function findFace(font: FontSource, create: boolean): Face | undefined {
    if (!font || typeof font.family !== 'string' || !font.family) return;

    const { family, source } = font;
    const sourceKey = keyOf(source);
    if (!sourceKey) return;

    const weight = descriptor(font.weight);
    const style = descriptor(font.style);
    const key = `${family}\n${weight}\n${style}`;

    let bySource = faces.get(sourceKey);
    let face = bySource && bySource.get(key);
    if (!face && create) {
        if (!bySource) {
            bySource = new Map();
            faces.set(sourceKey, bySource);
        }
        const newFace: Face = {
            sourceKey,
            key,
            family,
            weight,
            style,
            loading: Promise.resolve(false),
            loaded: false,
            settled: false,
            permission: 'unknown'
        };
        bySource.set(key, newFace);
        newFace.loading = loadFace(newFace, source as Source);
        face = newFace;
    }
    return face;
}

/** Remove a face from the cache, so that the next graph that draws loads it again */
function forgetFace(face: Face): void {
    const bySource = faces.get(face.sourceKey);
    if (!bySource || bySource.get(face.key) !== face) return;

    bySource.delete(face.key);
    if (!bySource.size) faces.delete(face.sourceKey);
}

/**
 * Make the cache key of a font source.
 * A string source is its own key. A byte source gets a key from its length and two 32-bit hashes of its bytes,
 * so that a new buffer with the same bytes finds the same face.
 *
 * @returns the key, or undefined for a source that is not a non-empty string, an `ArrayBuffer` or a typed array
 */
function keyOf(source: unknown): string | undefined {
    if (typeof source === 'string') return source || undefined;
    if (!(source instanceof ArrayBuffer || ArrayBuffer.isView(source))) return;

    let key = byteKeys.get(source);
    if (!key) {
        const bytes =
            source instanceof ArrayBuffer
                ? new Uint8Array(source)
                : new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
        let a = 0x811c9dc5;
        let b = 0x9e3779b9;
        for (let i = 0; i < bytes.length; i++) {
            a = Math.imul(a ^ bytes[i], 0x01000193);
            b = Math.imul(b ^ bytes[i], 0x5bd1e995);
        }
        key = `bytes ${bytes.length} ${(a >>> 0).toString(16)} ${(b >>> 0).toString(16)}`;
        byteKeys.set(source, key);
    }
    return key;
}

/** Accept a CSS keyword or number for a face descriptor. Reject text that could break the CSS rule. */
function descriptor(value: unknown): string {
    const text = value == null ? 'normal' : String(value);
    return /^[\w .-]+$/.test(text) ? text : 'normal';
}

/** Warn one time about a value of `config.fonts`. A value can be an object or a primitive, such as a string item. */
function warnOnce(value: unknown, message: string): void {
    if (value && typeof value === 'object') {
        if (warnedObjects.has(value)) return;
        warnedObjects.add(value);
    } else {
        if (warnedValues.has(value)) return;
        warnedValues.add(value);
    }
    warn(message, value);
}

async function loadFace(face: Face, source: Source): Promise<boolean> {
    // A download can fail because of a short network fault. A data URL or bytes always give the same result.
    let retry = typeof source === 'string' && !source.startsWith('data:');
    try {
        const bytes = await readBytes(source);
        // The download finished, so from here a failure comes from the font file
        retry = false;
        face.bytes = bytes;
        face.format = fontFormat(bytes);
        face.permission = await readEmbeddingPermission(bytes);

        const fontFace = new FontFace(face.family, bytes, { weight: face.weight, style: face.style });
        await fontFace.load();
        document.fonts.add(fontFace);
        face.loaded = true;
    } catch (error) {
        if (retry) forgetFace(face);
        // A face that did not load is never embedded, so it does not need its bytes
        face.bytes = undefined;
        warn(`Cannot load the font "${face.family}" (${error}). The graph uses a fallback font.`);
    }
    face.settled = true;
    return face.loaded;
}

async function readBytes(source: Source): Promise<ArrayBuffer> {
    // Copy the bytes, so that a later change to the buffer of the caller cannot change the face
    if (source instanceof ArrayBuffer) return source.slice(0);
    if (ArrayBuffer.isView(source)) {
        return new Uint8Array(source.buffer, source.byteOffset, source.byteLength).slice().buffer;
    }
    if (source.startsWith('data:')) return decodeDataUrl(source);

    const controller = new AbortController();
    const timer = setTimeout(
        () => controller.abort(new Error(`no answer in ${DOWNLOAD_TIMEOUT / 1000} seconds`)),
        DOWNLOAD_TIMEOUT
    );
    try {
        const response = await fetch(source, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP status ${response.status}`);
        return await response.arrayBuffer();
    } finally {
        clearTimeout(timer);
    }
}

function decodeDataUrl(url: string): ArrayBuffer {
    const comma = url.indexOf(',');
    if (comma === -1 || !url.slice(0, comma).endsWith(';base64')) {
        throw new Error('a font data URL must use base64');
    }
    // atob skips the line breaks that some base64 encoders insert. The decoder of base64-arraybuffer does not.
    const binary = atob(url.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

/**
 * Find the font families that a serialized SVG names, as keys from `familyKey`.
 * The serializer writes the families in `style` attributes and encodes their quotes as XML entities.
 */
function usedFamilies(svg: string): Set<string> {
    const families = new Set<string>();
    const attributes = /\s(style|font-family)="([^"]*)"/g;
    let attribute: RegExpExecArray | null;
    while ((attribute = attributes.exec(svg))) {
        const [, name, value] = attribute;
        if (value.indexOf('font-family') === -1 && name === 'style') continue;

        const text = decodeXml(value);
        if (name === 'font-family') {
            addFamilies(families, text);
            continue;
        }
        const declarations = /(?:^|;)\s*font-family\s*:\s*((?:"[^"]*"|'[^']*'|[^;"'])*)/gi;
        let declaration: RegExpExecArray | null;
        while ((declaration = declarations.exec(text))) addFamilies(families, declaration[1]);
    }
    return families;
}

/** Add the names of a CSS `font-family` list to a set of family keys */
function addFamilies(families: Set<string>, list: string): void {
    const names = /"([^"]*)"|'([^']*)'|([^,"']+)/g;
    let name: RegExpExecArray | null;
    while ((name = names.exec(list))) {
        const key = familyKey(name[1] ?? name[2] ?? name[3]);
        if (key) families.add(key);
    }
}

/** CSS compares family names without case, and the serializer can change the white space between words */
function familyKey(family: string): string {
    return family.trim().replace(/\s+/g, ' ').toLowerCase();
}

function decodeXml(text: string): string {
    return text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (entity, name: string) => {
        const lower = name.toLowerCase();
        if (lower[0] !== '#') return XML_ENTITIES[lower] ?? entity;

        const code = lower[1] === 'x' ? parseInt(lower.slice(2), 16) : parseInt(lower.slice(1), 10);
        return code <= 0x10ffff ? String.fromCodePoint(code) : entity;
    });
}

function faceRule(face: Face): string {
    if (!face.rule && face.bytes) {
        // The rule goes into an SVG <style> element, so it must be safe in a CSS string and in XML
        const family = face.family
            .replace(/[\n\r\f]/g, ' ')
            .replace(/["\\]/g, '\\$&')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        const type = (face.format && MIME_TYPES[face.format]) || 'application/octet-stream';
        const hint = face.format ? ` format("${face.format}")` : '';
        face.rule =
            `@font-face{font-family:"${family}";font-style:${face.style};font-weight:${face.weight};` +
            `src:url(data:${type};base64,${encode(face.bytes)})${hint};}`;
    }
    return face.rule || '';
}

function warnNotEmbedded(face: Face, format: string): void {
    if (face.warned) return;
    face.warned = true;
    warn(`The ${format} export does not embed the font "${face.family}", because the font file forbids embedding.`);
}
