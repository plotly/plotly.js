/**
 * Generate TypeScript interfaces from the plot schema.
 *
 * Walks schema.traces and schema.layout.layoutAttributes, emitting interfaces
 * for all trace types, layout component types, and a top-level Layout interface
 * into a single .d.ts file. All attribute metadata (valType, values, arrayOk,
 * etc.) is mapped to the corresponding TypeScript type.
 *
 * Repeated container subtrees (colorbar, hoverlabel, font, etc.) are
 * automatically detected via fingerprinting and extracted into shared
 * interfaces to reduce output size.
 *
 * Run via `npm run schema` (which calls this after writing plot-schema.json).
 */

import * as fs from 'fs';

// ---------------------------------------------------------------------------
// Meta keys to skip (not user-facing attributes)
// ---------------------------------------------------------------------------

const META_KEYS = new Set([
    'editType',
    'role',
    'description',
    'impliedEdits',
    '_isSubplotObj',
    '_isLinkedToArray',
    '_arrayAttrRegexps',
    '_deprecated'
]);

// ---------------------------------------------------------------------------
// Common enum types — discovered from the schema at generation time and
// emitted as named type aliases in the output. Each anchor specifies a
// PascalCase type name and a `match(key, path, values)` predicate. The first
// enumerated attribute whose match returns true defines the alias's values.
// ---------------------------------------------------------------------------

const COMMON_TYPE_ANCHORS = [
    { name: 'Calendar', match: (key) => /^[xyz]?calendar$/.test(key) },
    { name: 'Dash', match: (key) => key === 'dash' },
    { name: 'AxisType', match: (key, path) => key === 'type' && /[xyz]axis\.type$/.test(path) },
    {
        name: 'XRef',
        match: (key, _path, values) => key === 'xref' && values.length === 2 && values.includes('container')
    },
    {
        name: 'YRef',
        match: (key, _path, values) => key === 'yref' && values.length === 2 && values.includes('container')
    },
    { name: 'PatternShape', match: (key, path) => key === 'shape' && /\.pattern\.shape$/.test(path) },
    { name: 'TransitionEasing', match: (key) => key === 'easing' }
];

/**
 * Module-level map populated by `discoverCommonTypes` before generation.
 * Sorted-JSON-stringified values → common type name.
 */
const VALUES_TO_COMMON_TYPE = new Map();

/** Attribute name patterns that should use a specific common type. */
const ATTR_NAME_OVERRIDES = new Map([['marker.symbol', 'MarkerSymbol']]);

/**
 * Walk the schema to find the canonical `values` array for each anchor in
 * `COMMON_TYPE_ANCHORS`. The first matching enumerated attribute wins.
 * Also emits a `PlotType` alias derived from the trace-names list.
 *
 * Populates `VALUES_TO_COMMON_TYPE` and returns `Map<name, {values}>` for
 * emitting type aliases.
 */
function discoverCommonTypes(schema) {
    // Collect every match for each anchor — we'll pick the superset at the end.
    const candidates = new Map(COMMON_TYPE_ANCHORS.map((a) => [a.name, []]));

    function visit(node, path) {
        if (!node || typeof node !== 'object') return;
        for (const [key, val] of Object.entries(node)) {
            if (val && typeof val === 'object') {
                const childPath = path ? `${path}.${key}` : key;
                if (
                    val.valType === 'enumerated' &&
                    Array.isArray(val.values) &&
                    val.values.every((v) => typeof v === 'string')
                ) {
                    for (const anchor of COMMON_TYPE_ANCHORS) {
                        if (anchor.match(key, childPath, val.values)) {
                            candidates.get(anchor.name).push(val.values.slice());
                        }
                    }
                }
                visit(val, childPath);
            }
        }
    }
    visit(schema.traces, 'traces');
    visit(schema.layout, 'layout');
    if (schema.animation) visit(schema.animation, 'animation');

    // For each anchor, pick the largest value set. When sizes tie, the first
    // match wins. The superset rule handles axis-type-style cases where
    // different axis kinds (cartesian vs 3D scene) have different value sets.
    const found = new Map();
    for (const anchor of COMMON_TYPE_ANCHORS) {
        const matches = candidates.get(anchor.name);
        if (matches.length === 0) {
            throw new Error(
                `Could not find an enumerated schema attribute for common type '${anchor.name}'. ` +
                    `Either the schema no longer exposes a matching attribute, or the anchor's match predicate needs updating.`
            );
        }
        const best = matches.reduce((a, b) => (b.length > a.length ? b : a));
        found.set(anchor.name, { values: best });
        VALUES_TO_COMMON_TYPE.set(JSON.stringify(best.slice().sort()), anchor.name);
    }

    // PlotType — derived from the list of trace names, not from an attribute.
    found.set('PlotType', { values: Object.keys(schema.traces).sort() });

    return found;
}

// ---------------------------------------------------------------------------
// Layout naming maps
// ---------------------------------------------------------------------------

/**
 * Override auto-generated shared type names to produce correct PascalCase.
 * The fingerprint-based naming just capitalizes the first letter, which
 * produces "Colorbar" instead of "ColorBar". These overrides fix that.
 */
const SHARED_NAME_OVERRIDES = new Map([
    ['colorbar', 'ColorBar'],
    ['hoverlabel', 'HoverLabel'],
    ['tickformatstops', 'TickFormatStops'],
    ['autorangeoptions', 'AutoRangeOptions'],
    ['legendgrouptitle', 'LegendGroupTitle'],
    ['error_y', 'ErrorY'],
    ['error_x', 'ErrorX'],
    ['stream', 'Stream']
]);

/** Interface names for layout subplot containers (_isSubplotObj). */
const LAYOUT_CONTAINER_NAMES = new Map([
    ['xaxis', 'LayoutAxis'],
    ['yaxis', 'LayoutAxis'],
    ['legend', 'Legend'],
    ['scene', 'Scene'],
    ['polar', 'PolarLayout'],
    ['ternary', 'TernaryLayout'],
    ['geo', 'GeoLayout'],
    ['map', 'MapLayout'],
    ['mapbox', 'MapLayout'],
    ['coloraxis', 'ColorAxis'],
    ['smith', 'SmithLayout']
]);

/** Interface names for layout linked-to-array containers. */
const LAYOUT_ARRAY_NAMES = new Map([
    ['annotations', 'Annotation'],
    ['shapes', 'Shape'],
    ['images', 'LayoutImage'],
    ['sliders', 'Slider'],
    ['updatemenus', 'UpdateMenu'],
    ['selections', 'LayoutSelection']
]);

// ---------------------------------------------------------------------------
// valType → TS type
// ---------------------------------------------------------------------------

function serializeValue(v) {
    if (typeof v === 'string') {
        const escaped = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return `'${escaped}'`;
    }
    return String(v); // numbers, booleans
}

/**
 * Try to match a values array to a known common type.
 * Returns the type name string or null.
 */
function matchCommonType(values) {
    const sorted = values
        .slice()
        .filter((v) => typeof v === 'string')
        .sort();
    const key = JSON.stringify(sorted);
    return VALUES_TO_COMMON_TYPE.get(key) ?? null;
}

/**
 * Map an info_array attribute to a TypeScript type.
 *
 * info_array items in the schema carry an `items` array describing
 * each element's valType (e.g. [{valType:'number'}, {valType:'number'}]).
 * When all elements share the same valType we can emit a precise tuple
 * or array type instead of `unknown[]`.
 */
function infoArrayToTS(attr) {
    if (!attr.items) return 'any[]';

    // items can be an array of item descriptors or a single descriptor
    // (single descriptor = freeLength homogeneous array)
    if (!Array.isArray(attr.items)) {
        const elemType = simpleValType(attr.items.valType);
        return `${elemType}[]`;
    }

    const elemTypes = attr.items.map((item) => simpleValType(item.valType));

    if (attr.freeLength) {
        // Variable-length — use array of the union of element types
        const unique = [...new Set(elemTypes)];
        const union = unique.length === 1 ? unique[0] : unique.join(' | ');
        return `${union}[]`;
    }

    // Fixed-length — emit tuple
    return `[${elemTypes.join(', ')}]`;
}

/** Map a valType string to a simple TS type (no arrayOk handling). */
function simpleValType(valType) {
    switch (valType) {
        case 'number':
        case 'integer':
            return 'number';
        case 'string':
        case 'subplotid':
            return 'string';
        case 'boolean':
            return 'boolean';
        case 'color':
            return 'Color';
        default:
            return 'any';
    }
}

/**
 * Format a schema description as a JSDoc comment block.
 * Returns an array of lines (including the indent), or an empty array
 * if the attribute has no description.
 *
 * @param {string|undefined} description
 * @param {string} indent
 * @returns {string[]}
 */
function formatJSDoc(description, indent) {
    if (!description) return [];
    // Escape stray */ sequences that would close the JSDoc comment
    const text = description.replace(/\*\//g, '*\\/');
    return [`${indent}/** ${text} */`];
}

/**
 * Map a single schema attribute to its TypeScript type string.
 *
 * @param {object} attr - The attribute object from the schema
 * @param {string} attrPath - Dot-separated path for name-based overrides
 * @returns {string} TypeScript type expression
 */
function valTypeToTS(attr, attrPath) {
    // Check name-based overrides first
    for (const [pattern, typeName] of ATTR_NAME_OVERRIDES) {
        if (attrPath.endsWith(pattern)) return typeName;
    }

    const { valType } = attr;
    let base;

    switch (valType) {
        case 'data_array':
            return 'Datum[] | TypedArray';

        case 'number':
        case 'integer': {
            const extras = Array.isArray(attr.extras) ? attr.extras.filter((v) => typeof v === 'string') : [];
            if (extras.length > 0) {
                base = 'number | ' + extras.map(serializeValue).join(' | ');
            } else {
                base = 'number';
            }
            break;
        }

        case 'string': {
            if (attr.values && Array.isArray(attr.values)) {
                const common = matchCommonType(attr.values);
                if (common) {
                    base = common;
                    break;
                }
                base = attr.values.map(serializeValue).join(' | ');
            } else {
                base = 'string';
            }
            break;
        }

        case 'boolean':
            base = 'boolean';
            break;

        case 'color':
            base = 'Color';
            break;

        case 'colorscale':
            base = 'ColorScale';
            break;

        case 'colorlist':
            return 'Color[]';

        case 'angle':
            base = "number | 'auto'";
            break;

        case 'subplotid':
            base = 'string';
            break;

        case 'enumerated': {
            if (attr.values && Array.isArray(attr.values)) {
                const common = matchCommonType(attr.values);
                if (common) {
                    base = common;
                    break;
                }
                base = attr.values.map(serializeValue).join(' | ');
            } else {
                base = 'any';
            }
            break;
        }

        case 'flaglist': {
            const parts = [];
            if (Array.isArray(attr.flags)) {
                parts.push(...attr.flags.map(serializeValue));
            }
            if (Array.isArray(attr.extras)) {
                parts.push(...attr.extras.map(serializeValue));
            }
            // Use (string & {}) to allow flag combinations like 'x+y'
            // while preserving autocomplete for individual flags.
            if (parts.length > 0) {
                parts.push('(string & {})');
                base = parts.join(' | ');
            } else {
                base = 'string';
            }
            break;
        }

        case 'info_array':
            return infoArrayToTS(attr);

        case 'any':
            return 'any';

        default:
            return 'any';
    }

    if (attr.arrayOk) {
        // Wrap in parens if base contains '|' to avoid ambiguity
        const needsParens = base.includes('|');
        return needsParens ? `${base} | (${base})[]` : `${base} | ${base}[]`;
    }

    return base;
}

// ---------------------------------------------------------------------------
// Structural helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if key looks like an auto-generated *src attribute.
 * These are created for Chart Studio Cloud and shouldn't appear in types.
 */
function isSrcAttr(key, siblings) {
    if (!key.endsWith('src')) return false;
    const base = key.slice(0, -3);
    return base in siblings;
}

/**
 * Detect a linked-to-array container in the serialized schema.
 *
 * In the source, these are marked with `_isLinkedToArray`, but that flag
 * is stripped during serialization. We detect them structurally: a container
 * whose only non-meta keys are `items`, and `items` is an object with exactly
 * one child that is itself an object with attribute leaves.
 */
function isLinkedToArrayContainer(obj) {
    if (!obj || typeof obj !== 'object' || !obj.items) return false;
    // The container should have no other meaningful keys
    const meaningful = Object.keys(obj).filter((k) => !META_KEYS.has(k) && k !== 'items');
    if (meaningful.length > 0) return false;
    // items should have exactly one named child that is an object
    const itemKeys = Object.keys(obj.items);
    if (itemKeys.length !== 1) return false;
    const child = obj.items[itemKeys[0]];
    return child && typeof child === 'object' && !child.valType;
}

// ---------------------------------------------------------------------------
// Fingerprinting — canonical representation of container subtree shapes
// ---------------------------------------------------------------------------

/**
 * Compute a canonical fingerprint for a leaf attribute (has valType).
 * Two leaves with the same fingerprint produce the same TS type.
 */
function leafFingerprint(attr, attrPath) {
    return valTypeToTS(attr, attrPath);
}

/**
 * Compute a canonical fingerprint for a container (no valType).
 * Recursively fingerprints nested containers. Two containers with the
 * same fingerprint produce identical TypeScript object types.
 */
function containerFingerprint(attrs) {
    const parts = [];

    for (const key of Object.keys(attrs).sort()) {
        if (META_KEYS.has(key)) continue;
        const val = attrs[key];
        if (isSrcAttr(key, attrs)) continue;
        if (val == null) continue;

        if (typeof val === 'string') {
            parts.push(`${key}:L'${val}'`);
            continue;
        }
        if (typeof val !== 'object') continue;

        if (val.valType) {
            parts.push(`${key}:${leafFingerprint(val, key)}`);
            continue;
        }

        if (isLinkedToArrayContainer(val)) {
            const itemChild = Object.values(val.items)[0];
            parts.push(`${key}:Array<${containerFingerprint(itemChild)}>`);
            continue;
        }

        parts.push(`${key}:{${containerFingerprint(val)}}`);
    }

    return parts.join(',');
}

/**
 * Walk an attribute tree and collect fingerprints for every container
 * subtree (including nested ones). Records each occurrence with the
 * attribute key name (used later for naming).
 *
 * @param {object} attrs - Attribute object
 * @param {Map} collector - Map<fingerprint, {count, names: Map<string,count>, attrs}>
 */
function collectFingerprints(attrs, collector) {
    for (const key of Object.keys(attrs).sort()) {
        if (META_KEYS.has(key)) continue;
        const val = attrs[key];
        if (isSrcAttr(key, attrs)) continue;
        if (val == null || typeof val !== 'object' || val.valType) continue;

        let containerAttrs;
        if (isLinkedToArrayContainer(val)) {
            // For linked-to-array containers, fingerprint the inner item,
            // not the wrapper. The wrapper itself is always {items:{X:{...}}}.
            containerAttrs = Object.values(val.items)[0];
        } else {
            containerAttrs = val;
        }

        const fp = containerFingerprint(containerAttrs);

        if (!collector.has(fp)) {
            collector.set(fp, { count: 0, names: new Map(), attrs: containerAttrs });
        }
        const entry = collector.get(fp);
        entry.count++;
        entry.names.set(key, (entry.names.get(key) || 0) + 1);

        // Recurse into children
        collectFingerprints(containerAttrs, collector);
    }
}

// ---------------------------------------------------------------------------
// Shared type selection and naming
// ---------------------------------------------------------------------------

const MIN_OCCURRENCES = 5;
const MIN_PROPERTIES = 4;

/**
 * Count the number of property lines a container would produce.
 */
function countProperties(attrs) {
    let count = 0;
    for (const key of Object.keys(attrs)) {
        if (META_KEYS.has(key)) continue;
        if (isSrcAttr(key, attrs)) continue;
        const val = attrs[key];
        if (val == null) continue;
        if (typeof val === 'string' || typeof val !== 'object') {
            count++;
            continue;
        }
        if (val.valType) {
            count++;
            continue;
        }
        count++; // container counts as one property
    }
    return count;
}

/** Convert an attribute key to a PascalCase interface name. */
function keyToInterfaceName(key) {
    const override = SHARED_NAME_OVERRIDES.get(key);
    if (override) return override;
    return key
        .split('_')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
}

/**
 * Determine shared types from collected fingerprints.
 *
 * Returns Map<fingerprint, interfaceName> for containers that should
 * be extracted into shared interfaces.
 */
function selectSharedTypes(collector) {
    /** @type {Map<string, string>} fingerprint → interface name */
    const shared = new Map();
    /** @type {Map<string, string>} interface name → canonical fingerprint (largest so far) */
    const nameToCanonFp = new Map();

    // Sort by count descending so the most common get first pick of names
    const candidates = [...collector.entries()]
        .filter(([, entry]) => {
            if (entry.count < MIN_OCCURRENCES) return false;
            if (countProperties(entry.attrs) >= MIN_PROPERTIES) return true;
            // Allow explicitly named overrides to bypass MIN_PROPERTIES
            for (const name of entry.names.keys()) {
                if (SHARED_NAME_OVERRIDES.has(name)) return true;
            }
            return false;
        })
        .sort((a, b) => b[1].count - a[1].count);

    for (const [fp, entry] of candidates) {
        // Pick the most common attribute key as the name
        let bestKey = '';
        let bestCount = 0;
        for (const [name, count] of entry.names) {
            if (count > bestCount) {
                bestKey = name;
                bestCount = count;
            }
        }

        let interfaceName = keyToInterfaceName(bestKey);

        // Disambiguate font variants by checking if properties have arrayOk
        if (interfaceName.toLowerCase().endsWith('font')) {
            const hasArrayOk = Object.values(entry.attrs).some(
                (v) => v && typeof v === 'object' && v.valType && v.arrayOk
            );
            interfaceName = hasArrayOk ? 'FontArray' : 'Font';
        }

        if (nameToCanonFp.has(interfaceName)) {
            // Name collision — check subset/superset relationship.
            // Since all properties are optional, a superset type safely
            // covers all subset variants.
            const existingFp = nameToCanonFp.get(interfaceName);
            const existingParts = existingFp.split(',');
            const newParts = fp.split(',');
            const existingSet = new Set(existingParts);
            const newSet = new Set(newParts);

            const newSubsetOfExisting = newParts.every((p) => existingSet.has(p));
            const existingSubsetOfNew = existingParts.every((p) => newSet.has(p));

            if (newSubsetOfExisting) {
                // New is a subset of existing — just map to existing name
                shared.set(fp, interfaceName);
                continue;
            } else if (existingSubsetOfNew) {
                // Existing is a subset of new — upgrade canonical to the superset
                shared.set(fp, interfaceName);
                nameToCanonFp.set(interfaceName, fp);
                continue;
            } else {
                // Unrelated — disambiguate with numeric suffix
                let suffix = 2;
                while (nameToCanonFp.has(interfaceName + suffix)) suffix++;
                interfaceName = interfaceName + suffix;
            }
        }

        nameToCanonFp.set(interfaceName, fp);
        shared.set(fp, interfaceName);
    }

    return shared;
}

/**
 * Attempt superset merging: if a smaller fingerprint is a strict subset
 * of a larger one (same keys minus a few extras), merge the smaller's
 * occurrences into the larger.
 *
 * We do this by checking if the property lines of the subset are a
 * prefix-match of the superset (since keys are sorted).
 */
function mergeSubsets(collector, shared) {
    // Merge non-shared fingerprints that are strict SUBSETS of a shared
    // fingerprint into the same name. Only one direction — we never expand
    // a shared type to a superset here (that's handled in selectSharedTypes
    // for same-named candidates). Iterate until stable for transitive
    // subset chains (if C ⊂ B and B was just merged into A, C should too).
    let changed = true;
    while (changed) {
        changed = false;
        for (const [fpA, nameA] of [...shared.entries()]) {
            const partsA = new Set(fpA.split(','));

            for (const [fpB, entryB] of collector.entries()) {
                if (fpB === fpA) continue;
                if (shared.has(fpB)) continue;
                if (entryB.count < 2) continue;

                // Check if B is a strict subset of A
                const partsB = fpB.split(',');
                const bSubsetOfA = partsB.every((p) => partsA.has(p));

                if (bSubsetOfA) {
                    shared.set(fpB, nameA);
                    changed = true;
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Attribute tree walker (with shared type support)
// ---------------------------------------------------------------------------

/**
 * Walk a schema attribute object and emit TypeScript property lines.
 *
 * @param {object} attrs - Attribute object from the schema
 * @param {string} indent - Current indentation string
 * @param {string} pathPrefix - Dot-separated path for name-based overrides
 * @param {Map<string,string>} sharedTypes - fingerprint → interface name
 * @param {Object<string,string>} [fieldOverrides] - field-name → TS type to
 *     force, bypassing schema-derived types. Used for fields whose schema
 *     valType is intentionally `any` because the schema is recursive (e.g.
 *     Frame.layout points to the entire Layout shape).
 * @returns {string[]} Array of TS property declaration lines
 */
function attrsToProperties(attrs, indent, pathPrefix, sharedTypes, fieldOverrides) {
    const lines = [];

    for (const key of Object.keys(attrs).sort()) {
        // Skip meta keys
        if (META_KEYS.has(key)) continue;

        const val = attrs[key];

        // Skip src attributes
        if (isSrcAttr(key, attrs)) continue;

        // Skip null/undefined
        if (val == null) continue;

        const attrPath = pathPrefix ? `${pathPrefix}.${key}` : key;

        // Field-level override — bypass schema typing entirely
        if (fieldOverrides && Object.prototype.hasOwnProperty.call(fieldOverrides, key)) {
            if (val && typeof val === 'object' && val.description) {
                lines.push(...formatJSDoc(val.description, indent));
            }
            lines.push(`${indent}${key}?: ${fieldOverrides[key]};`);
            continue;
        }

        // String literal (e.g. type: "ohlc")
        if (typeof val === 'string') {
            lines.push(`${indent}${key}?: '${val}';`);
            continue;
        }

        // Non-object primitive (shouldn't happen, but guard)
        if (typeof val !== 'object') continue;

        // Leaf attribute (has valType)
        if (val.valType) {
            const tsType = valTypeToTS(val, attrPath);
            lines.push(...formatJSDoc(val.description, indent));
            lines.push(`${indent}${key}?: ${tsType};`);
            continue;
        }

        // Linked-to-array container — check if inner item matches a shared type
        if (isLinkedToArrayContainer(val)) {
            const itemChild = Object.values(val.items)[0];
            const fp = containerFingerprint(itemChild);
            const sharedName = sharedTypes.get(fp);
            if (sharedName) {
                lines.push(...formatJSDoc(val.description, indent));
                lines.push(`${indent}${key}?: ${sharedName}[];`);
                continue;
            }
            const nested = attrsToProperties(itemChild, indent + '    ', attrPath, sharedTypes);
            if (nested.length > 0) {
                lines.push(...formatJSDoc(val.description, indent));
                lines.push(`${indent}${key}?: Array<{`);
                lines.push(...nested);
                lines.push(`${indent}}>;`);
                continue;
            }
        }

        // Check if this container matches a shared type
        const fp = containerFingerprint(val);
        const sharedName = sharedTypes.get(fp);
        if (sharedName) {
            lines.push(...formatJSDoc(val.description, indent));
            lines.push(`${indent}${key}?: ${sharedName};`);
            continue;
        }

        // Container object — recurse
        const nested = attrsToProperties(val, indent + '    ', attrPath, sharedTypes);
        if (nested.length > 0) {
            lines.push(...formatJSDoc(val.description, indent));
            lines.push(`${indent}${key}?: {`);
            lines.push(...nested);
            lines.push(`${indent}};`);
        }
    }

    return lines;
}

// ---------------------------------------------------------------------------
// Trace name → interface name
// ---------------------------------------------------------------------------

function traceNameToInterfaceName(traceName) {
    return traceName.charAt(0).toUpperCase() + traceName.slice(1) + 'Data';
}

// ---------------------------------------------------------------------------
// Layout generation helpers
// ---------------------------------------------------------------------------

/**
 * Group subplot containers by target interface name and merge their
 * attributes into a superset. E.g. xaxis and yaxis both map to LayoutAxis;
 * their attributes are merged so the interface covers both.
 *
 * @param {object} layoutAttrs - schema.layout.layoutAttributes
 * @returns {Map<string, {attrs: object, keys: string[]}>}
 */
function buildSubplotGroups(layoutAttrs) {
    const groups = new Map();
    for (const [key, val] of Object.entries(layoutAttrs)) {
        if (!val || typeof val !== 'object' || !val._isSubplotObj) continue;
        const name = LAYOUT_CONTAINER_NAMES.get(key) || keyToInterfaceName(key);
        const existing = groups.get(name);
        if (existing) {
            // Merge: superset of both attribute sets
            for (const [k, v] of Object.entries(val)) {
                if (!(k in existing.attrs)) existing.attrs[k] = v;
            }
            existing.keys.push(key);
        } else {
            groups.set(name, { attrs: { ...val }, keys: [key] });
        }
    }
    return groups;
}

/**
 * Extract linked-to-array containers from layout attributes.
 * Returns a map of interface name → item attributes.
 *
 * @param {object} layoutAttrs - schema.layout.layoutAttributes
 * @returns {Map<string, object>} name → item child attrs
 */
function extractArrayItems(layoutAttrs) {
    const items = new Map();
    for (const [key, val] of Object.entries(layoutAttrs)) {
        if (!val || typeof val !== 'object') continue;
        if (!isLinkedToArrayContainer(val)) continue;
        const name = LAYOUT_ARRAY_NAMES.get(key) || keyToInterfaceName(key);
        const itemChild = Object.values(val.items)[0];
        items.set(name, itemChild);
    }
    return items;
}

/**
 * Generate the Layout interface body.
 *
 * @param {object} layoutAttrs - schema.layout.layoutAttributes
 * @param {Map<string,string>} sharedTypes - fingerprint → interface name
 * @param {Map<string,{attrs,keys}>} subplotGroups - from buildSubplotGroups
 * @param {Map<string,object>} arrayItems - from extractArrayItems
 * @returns {string[]} property lines
 */
function generateLayoutProperties(layoutAttrs, sharedTypes, subplotGroups, arrayItems) {
    const lines = [];
    const subplotEntries = []; // {key, typeName} for index signatures

    // Build reverse maps: layout key → subplot name, layout key → array name
    const subplotKeyToName = new Map();
    for (const [name, { keys }] of subplotGroups) {
        for (const k of keys) subplotKeyToName.set(k, name);
    }
    const arrayKeyToName = new Map();
    for (const [key, val] of Object.entries(layoutAttrs)) {
        if (isLinkedToArrayContainer(val)) {
            arrayKeyToName.set(key, LAYOUT_ARRAY_NAMES.get(key) || keyToInterfaceName(key));
        }
    }

    for (const key of Object.keys(layoutAttrs).sort()) {
        if (META_KEYS.has(key)) continue;
        const val = layoutAttrs[key];
        if (isSrcAttr(key, layoutAttrs)) continue;
        if (val == null) continue;

        // String literal
        if (typeof val === 'string') {
            lines.push(`    ${key}?: '${val}';`);
            continue;
        }
        if (typeof val !== 'object') continue;

        // Leaf attribute
        if (val.valType) {
            const tsType = valTypeToTS(val, key);
            lines.push(`    ${key}?: ${tsType};`);
            continue;
        }

        // Subplot container — reference the named interface
        if (subplotKeyToName.has(key)) {
            const typeName = subplotKeyToName.get(key);
            lines.push(`    ${key}?: ${typeName};`);
            subplotEntries.push({ key, typeName });
            continue;
        }

        // Linked-to-array container — reference as array
        if (arrayKeyToName.has(key)) {
            const typeName = arrayKeyToName.get(key);
            lines.push(`    ${key}?: ${typeName}[];`);
            continue;
        }

        // Regular container — check for shared type
        const fp = containerFingerprint(val);
        const sharedName = sharedTypes.get(fp);
        if (sharedName) {
            lines.push(`    ${key}?: ${sharedName};`);
            continue;
        }

        // Inline container
        const nested = attrsToProperties(val, '        ', key, sharedTypes);
        if (nested.length > 0) {
            lines.push(`    ${key}?: {`);
            lines.push(...nested);
            lines.push(`    };`);
        }
    }

    // Subplot index signatures for numbered variants (xaxis2, scene3, etc.)
    if (subplotEntries.length > 0) {
        lines.push('');
        lines.push('    // Subplot index signatures for numbered variants');
        // Dedupe by typeName+key pattern (xaxis and yaxis have separate entries)
        for (const { key, typeName } of subplotEntries) {
            lines.push(`    [key: \`${key}\${number}\`]: ${typeName};`);
        }
    }

    return lines;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Generate type declarations from a plot schema object.
 *
 * @param {object} schema - The full plot schema (as from Plotly.PlotSchema.get())
 * @param {string} outputPath - Absolute path to write the .d.ts file
 */
export function generateSchemaTypes(schema, outputPath) {
    const traceNames = Object.keys(schema.traces).sort();
    const layoutAttrs = schema.layout.layoutAttributes;

    // ----- Phase 0: Discover common enum types (Calendar, Dash, ...) -----
    const commonTypes = discoverCommonTypes(schema);

    // ----- Phase 1: Fingerprint all container subtrees across traces + layout -----
    const collector = new Map();
    for (const traceName of traceNames) {
        collectFingerprints(schema.traces[traceName].attributes, collector);
    }
    collectFingerprints(layoutAttrs, collector);

    // ----- Phase 2: Select shared types and merge subsets -----
    const sharedTypes = selectSharedTypes(collector);
    mergeSubsets(collector, sharedTypes);

    // Build ordered list of shared interfaces. For each name, use the
    // LARGEST fingerprint (most properties) so the interface is a superset
    // of all variants mapped to that name.
    const nameToData = new Map();
    for (const [fp, name] of sharedTypes.entries()) {
        const entry = collector.get(fp);
        if (!entry) continue;
        const propCount = countProperties(entry.attrs);
        const existing = nameToData.get(name);
        if (!existing || propCount > existing.propCount) {
            nameToData.set(name, { fp, attrs: entry.attrs, propCount });
        }
    }

    // Inject animation subtree types as shared interfaces so AnimationOpts
    // and any other site referencing the same shape gets a named reference
    // instead of an inlined object. These occur fewer than MIN_OCCURRENCES
    // times so the automatic fingerprint extraction skips them.
    if (schema.animation) {
        const injectShared = (attrs, name) => {
            if (!attrs || typeof attrs !== 'object') return;
            const fp = containerFingerprint(attrs);
            if (!sharedTypes.has(fp)) {
                sharedTypes.set(fp, name);
                nameToData.set(name, { fp, attrs, propCount: countProperties(attrs) });
            }
        };
        injectShared(schema.animation.transition, 'Transition');
        injectShared(schema.animation.frame, 'AnimationFrameOpts');
    }

    const sharedList = [...nameToData.entries()]
        .map(([name, { fp, attrs }]) => [name, { fp, attrs }])
        .sort((a, b) => {
            // Leaf types first (Font before ColorBar/HoverLabel)
            const aDepth = a[1].fp.includes(':{') ? 1 : 0;
            const bDepth = b[1].fp.includes(':{') ? 1 : 0;
            if (aDepth !== bDepth) return aDepth - bDepth;
            return a[0].localeCompare(b[0]);
        });

    // For emitting shared interface bodies, use sharedTypes so nested
    // shared types get replaced (e.g. Font inside ColorBar), but exclude
    // all fingerprints that map to the same name to avoid circular
    // self-references (multiple fps can share a name after merging).
    const emitSharedBody = (attrs, selfName) => {
        const innerShared = new Map();
        for (const [fp, name] of sharedTypes) {
            if (name !== selfName) {
                innerShared.set(fp, name);
            }
        }
        return attrsToProperties(attrs, '    ', '', innerShared);
    };

    // ----- Phase 3: Layout-specific interfaces -----
    const subplotGroups = buildSubplotGroups(layoutAttrs);
    const arrayItems = extractArrayItems(layoutAttrs);

    // ----- Phase 4: Build output -----
    const chunks = [
        '/**',
        ' * Generated from plot-schema.json by tasks/generate_schema_types.mjs.',
        ' * Do not edit by hand — run `npm run schema` to regenerate.',
        ' */',
        '',
        "import type { Color, ColorScale, Datum, MarkerSymbol, TypedArray } from '../lib/common';",
        ''
    ];

    // Emit common enum type aliases discovered from the schema
    chunks.push('// ---------------------------------------------------------------------------');
    chunks.push('// Common enum types — value sets discovered from the schema');
    chunks.push('// ---------------------------------------------------------------------------');
    chunks.push('');
    for (const [name, { values }] of commonTypes) {
        const union = values.map(serializeValue).join(' | ');
        chunks.push(`export type ${name} = ${union};`);
        chunks.push('');
    }

    // Emit shared interfaces
    if (sharedList.length > 0) {
        chunks.push('// ---------------------------------------------------------------------------');
        chunks.push('// Shared interfaces — extracted from repeated attribute subtrees');
        chunks.push('// ---------------------------------------------------------------------------');
        chunks.push('');

        for (const [name, { fp, attrs }] of sharedList) {
            const properties = emitSharedBody(attrs, name);
            chunks.push(`export interface ${name} {`);
            chunks.push(...properties);
            chunks.push('}');
            chunks.push('');
        }
    }

    // Emit per-trace interfaces
    chunks.push('// ---------------------------------------------------------------------------');
    chunks.push('// Trace interfaces');
    chunks.push('// ---------------------------------------------------------------------------');
    chunks.push('');

    for (const traceName of traceNames) {
        const trace = schema.traces[traceName];
        const interfaceName = traceNameToInterfaceName(traceName);

        const properties = attrsToProperties(trace.attributes, '    ', '', sharedTypes);

        chunks.push(`export interface ${interfaceName} {`);
        chunks.push(...properties);
        chunks.push('}');
        chunks.push('');
    }

    // Emit layout-specific interfaces (subplots + array items)
    chunks.push('// ---------------------------------------------------------------------------');
    chunks.push('// Layout component interfaces');
    chunks.push('// ---------------------------------------------------------------------------');
    chunks.push('');

    for (const [name, { attrs }] of [...subplotGroups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        const properties = attrsToProperties(attrs, '    ', '', sharedTypes);
        chunks.push(`export interface ${name} {`);
        chunks.push(...properties);
        chunks.push('}');
        chunks.push('');
    }

    for (const [name, attrs] of [...arrayItems.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        const properties = attrsToProperties(attrs, '    ', '', sharedTypes);
        chunks.push(`export interface ${name} {`);
        chunks.push(...properties);
        chunks.push('}');
        chunks.push('');
    }

    // Emit the Layout interface
    chunks.push('// ---------------------------------------------------------------------------');
    chunks.push('// Layout');
    chunks.push('// ---------------------------------------------------------------------------');
    chunks.push('');

    const layoutProperties = generateLayoutProperties(layoutAttrs, sharedTypes, subplotGroups, arrayItems);
    chunks.push('export interface Layout {');
    chunks.push(...layoutProperties);
    chunks.push('}');
    chunks.push('');

    // ----- Phase 5: Animation, Frame, and Edits interfaces -----
    const extraInterfaces = [];
    if (schema.animation) {
        const animProps = attrsToProperties(schema.animation, '    ', 'animation', sharedTypes);
        extraInterfaces.push({ name: 'AnimationOpts', properties: animProps });
    }
    if (schema.frames && schema.frames.items) {
        const frameEntry = Object.values(schema.frames.items)[0];
        if (frameEntry) {
            // `data` and `layout` are `valType: 'any'` in the schema because they
            // recursively reference the schema's own top-level shapes — schema
            // can't self-reference, so override here at the type-generation layer.
            const frameProps = attrsToProperties(frameEntry, '    ', 'frame', sharedTypes, {
                data: 'any[]',
                layout: 'Partial<Layout>'
            });
            extraInterfaces.push({ name: 'Frame', properties: frameProps });
        }
    }
    if (schema.config && schema.config.edits) {
        const editsProps = attrsToProperties(schema.config.edits, '    ', 'edits', sharedTypes);
        extraInterfaces.push({ name: 'Edits', properties: editsProps });
    }

    if (extraInterfaces.length > 0) {
        chunks.push('// ---------------------------------------------------------------------------');
        chunks.push('// Animation, frames, and config interfaces');
        chunks.push('// ---------------------------------------------------------------------------');
        chunks.push('');
        for (const { name, properties } of extraInterfaces) {
            chunks.push(`export interface ${name} {`);
            chunks.push(...properties);
            chunks.push('}');
            chunks.push('');
        }
    }

    fs.writeFileSync(outputPath, chunks.join('\n'));

    const sharedCount = sharedList.length;
    const layoutCount = subplotGroups.size + arrayItems.size + 1; // +1 for Layout itself
    const extraCount = extraInterfaces.length;
    console.log(
        `Generated ${traceNames.length} trace(s) + ${layoutCount} layout type(s) + ${sharedCount} shared interface(s) + ${extraCount} animation/config interface(s) → ${outputPath}`
    );

    // Return all exported interface names so callers can verify re-exports
    const exportedNames = new Set();
    for (const name of commonTypes.keys()) exportedNames.add(name);
    for (const [name] of sharedList) exportedNames.add(name);
    for (const traceName of traceNames) exportedNames.add(traceNameToInterfaceName(traceName));
    for (const name of subplotGroups.keys()) exportedNames.add(name);
    for (const name of arrayItems.keys()) exportedNames.add(name);
    exportedNames.add('Layout');
    for (const { name } of extraInterfaces) exportedNames.add(name);
    return exportedNames;
}
