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

interface BaseAttrInfo {
    description?: string;
    editType?: string;
    role?: 'object' | 'info' | 'style' | 'data';
    arrayOk?: boolean;
    anim?: boolean;
    dflt?: unknown;
    /** Names a reusable item slot in template processing */
    _isLinkedToArray?: string;
    /** Marker for axis/subplot id-style attributes */
    _isSubplotObj?: boolean;
}

export interface DataArrayAttr extends BaseAttrInfo {
    valType: 'data_array';
    dflt?: Datum[] | TypedArray;
}

export interface NumberAttr extends BaseAttrInfo {
    valType: 'number';
    dflt?: number;
    min?: number;
    max?: number;
}

export interface IntegerAttr extends BaseAttrInfo {
    valType: 'integer';
    dflt?: number;
    min?: number;
    max?: number;
}

export interface StringAttr extends BaseAttrInfo {
    valType: 'string';
    dflt?: string;
    /** Allow whitespace-only strings */
    noBlank?: boolean;
    strict?: boolean;
    values?: readonly string[];
}

export interface BooleanAttr extends BaseAttrInfo {
    valType: 'boolean';
    dflt?: boolean;
}

export interface ColorAttr extends BaseAttrInfo {
    valType: 'color';
    dflt?: string;
}

export interface ColorScaleAttr extends BaseAttrInfo {
    valType: 'colorscale';
    dflt?: ColorScale;
}

export interface ColorListAttr extends BaseAttrInfo {
    valType: 'colorlist';
    dflt?: string[];
}

export interface AngleAttr extends BaseAttrInfo {
    valType: 'angle';
    dflt?: number | 'auto';
}

export interface SubplotIdAttr extends BaseAttrInfo {
    valType: 'subplotid';
    dflt?: string;
    regex?: string;
}

export interface EnumeratedAttr<V extends readonly unknown[] = readonly unknown[]> extends BaseAttrInfo {
    valType: 'enumerated';
    values: V;
    dflt?: V[number];
    coerceNumber?: boolean;
}

export interface FlagListAttr<F extends readonly string[] = readonly string[]> extends BaseAttrInfo {
    valType: 'flaglist';
    flags: F;
    extras?: readonly string[];
    dflt?: string;
}

export interface InfoArrayAttr extends BaseAttrInfo {
    valType: 'info_array';
    items?: AttrInfo | readonly AttrInfo[];
    freeLength?: boolean;
    dimensions?: 1 | 2 | '1-2';
    dflt?: unknown[];
}

export interface AnyAttr extends BaseAttrInfo {
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
    [key: string]: AttrInfo | AttributeMap | string | boolean | undefined;
}

