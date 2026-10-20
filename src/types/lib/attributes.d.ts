/**
 * Attribute schema validation types
 *
 * Plotly's attribute files describe runtime metadata (valType, dflt,
 * editType, description, ...). This file provides:
 *
 *   - AttrInfo / AttributeMap: structural shape that attribute objects must
 *     satisfy (compile-time validation of attribute authoring)
 *
 * Author attribute files like:
 *
 *     const attributes = {
 *         orientation: {
 *             valType: 'enumerated',
 *             values: ['v', 'h'] as const,
 *             dflt: 'h',
 *             editType: 'modebar',
 *         },
 *         bgcolor: { valType: 'color', editType: 'modebar' },
 *     } as const satisfies AttributeMap;
 *
 *     export default attributes;
 */

import type { ColorScale, Datum, TypedArray } from './common';

// ---------------------------------------------------------------------------
// Attribute info — discriminated union by valType
// ---------------------------------------------------------------------------

/**
 * Fields shared by every attribute kind, regardless of `valType`. Specific
 * attribute interfaces extend this with their `valType` discriminator and
 * any type-specific options.
 */
interface BaseAttrInfo {
    /** Human-readable description of the attribute, surfaced in the schema. */
    description?: string;
    /** Plotly editType bucket — what kind of redraw is triggered on change. */
    editType?: string;
    /** Semantic role used by the schema and template machinery. */
    role?: 'object' | 'info' | 'style' | 'data';
    /** When true, the attribute accepts a per-point array of values. */
    arrayOk?: boolean;
    /** When true, the attribute can be animated via `Plotly.animate`. */
    anim?: boolean;
    /** Default value used when the attribute is omitted. */
    dflt?: unknown;
    /** Names a reusable item slot in template processing */
    _isLinkedToArray?: string;
    /** Marker for axis/subplot id-style attributes */
    _isSubplotObj?: boolean;
}

/** Attribute backed by a data array (`x`, `y`, `z`, marker channels, etc.). */
export interface DataArrayAttr extends BaseAttrInfo {
    /** Discriminator: data array. */
    valType: 'data_array';
    /** Optional default data array. */
    dflt?: Datum[] | TypedArray;
}

/** Numeric attribute (may be fractional). */
export interface NumberAttr extends BaseAttrInfo {
    /** Discriminator: number. */
    valType: 'number';
    /** Default numeric value. */
    dflt?: number;
    /** Inclusive lower bound. */
    min?: number;
    /** Inclusive upper bound. */
    max?: number;
}

/** Integer-valued attribute. */
export interface IntegerAttr extends BaseAttrInfo {
    /** Discriminator: integer. */
    valType: 'integer';
    /** Default integer value. */
    dflt?: number;
    /** Inclusive lower bound. */
    min?: number;
    /** Inclusive upper bound. */
    max?: number;
}

/** Free-form string attribute, optionally constrained to a set of values. */
export interface StringAttr extends BaseAttrInfo {
    /** Discriminator: string. */
    valType: 'string';
    /** Default string value. */
    dflt?: string;
    /** Allow whitespace-only strings */
    noBlank?: boolean;
    /** When true, the coercer rejects non-string inputs instead of stringifying. */
    strict?: boolean;
    /** Optional allow-list of values (still typed as string for flexibility). */
    values?: readonly string[];
}

/** Boolean attribute. */
export interface BooleanAttr extends BaseAttrInfo {
    /** Discriminator: boolean. */
    valType: 'boolean';
    /** Default boolean value. */
    dflt?: boolean;
}

/** Color attribute — CSS color string. */
export interface ColorAttr extends BaseAttrInfo {
    /** Discriminator: color. */
    valType: 'color';
    /** Default color (CSS color string). */
    dflt?: string;
}

/** Colorscale attribute — a built-in name or an array of stops. */
export interface ColorScaleAttr extends BaseAttrInfo {
    /** Discriminator: colorscale. */
    valType: 'colorscale';
    /** Default colorscale. */
    dflt?: ColorScale;
}

/** Array of CSS color strings, used for categorical palettes. */
export interface ColorListAttr extends BaseAttrInfo {
    /** Discriminator: list of colors. */
    valType: 'colorlist';
    /** Default color list. */
    dflt?: string[];
}

/** Angle attribute — degrees, or `'auto'`. */
export interface AngleAttr extends BaseAttrInfo {
    /** Discriminator: angle. */
    valType: 'angle';
    /** Default angle, or `'auto'`. */
    dflt?: number | 'auto';
}

/** Subplot identifier (e.g. `'x2'`, `'yaxis3'`); pattern-matched at runtime. */
export interface SubplotIdAttr extends BaseAttrInfo {
    /** Discriminator: subplot id. */
    valType: 'subplotid';
    /** Default subplot id. */
    dflt?: string;
    /** Optional regex validation pattern. */
    regex?: string;
}

/**
 * Enumerated attribute — value must be one of `values`. Generic parameter
 * `V` narrows the union when authors declare the values with `as const`.
 */
export interface EnumeratedAttr<V extends readonly unknown[] = readonly unknown[]> extends BaseAttrInfo {
    /** Discriminator: enumerated. */
    valType: 'enumerated';
    /** Allowed values. */
    values: V;
    /** Default value, must appear in `values`. */
    dflt?: V[number];
    /** When true, numeric values are coerced to their nearest enum entry. */
    coerceNumber?: boolean;
}

/**
 * Flag-list attribute — value is a `+`-joined combination of `flags` plus
 * any single value from `extras` (e.g. `'x+y'`, `'all'`).
 */
export interface FlagListAttr<F extends readonly string[] = readonly string[]> extends BaseAttrInfo {
    /** Discriminator: flag list. */
    valType: 'flaglist';
    /** Combinable flag tokens. */
    flags: F;
    /** Standalone values that replace (rather than combine with) flags. */
    extras?: readonly string[];
    /** Default flag-list value. */
    dflt?: string;
}

/**
 * Info-array attribute — fixed- or variable-length tuple. `items` is one
 * descriptor (variable length) or an array of descriptors (per-slot).
 */
export interface InfoArrayAttr extends BaseAttrInfo {
    /** Discriminator: info array. */
    valType: 'info_array';
    /** Per-slot or single-element shape descriptor. */
    items?: AttrInfo | readonly AttrInfo[];
    /** When true, the array can have arbitrary length. */
    freeLength?: boolean;
    /** Dimensionality of the array (`1`, `2`, or `'1-2'` for either). */
    dimensions?: 1 | 2 | '1-2';
    /** Default array value. */
    dflt?: unknown[];
}

/** Catch-all attribute — accepts anything; weakest typing. */
export interface AnyAttr extends BaseAttrInfo {
    /** Discriminator: any. */
    valType: 'any';
}

/**
 * Union of all leaf attribute shapes (anything with a `valType`).
 */
export type AttrInfo =
    | DataArrayAttr
    | NumberAttr
    | IntegerAttr
    | StringAttr
    | BooleanAttr
    | ColorAttr
    | ColorScaleAttr
    | ColorListAttr
    | AngleAttr
    | SubplotIdAttr
    | EnumeratedAttr
    | FlagListAttr
    | InfoArrayAttr
    | AnyAttr;

/**
 * A nested map of attribute info. Properties may be leaf attributes
 * (with a `valType`) or further-nested maps. A few special meta-keys
 * (editType, role, _isLinkedToArray, etc.) live alongside attributes.
 */
export interface AttributeMap {
    /** Either a leaf attribute, a nested map, or one of the meta-key primitives. */
    [key: string]: AttrInfo | AttributeMap | string | boolean | undefined;
}
