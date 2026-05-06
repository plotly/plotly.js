/**
 * Attribute schema → TypeScript type extraction
 *
 * Plotly's attribute files describe both the runtime metadata (valType, dflt,
 * editType, description, ...) AND the public-facing type. This file provides:
 *
 *   - AttrInfo / AttributeMap: structural shape that attribute objects must
 *     satisfy (compile-time validation of attribute authoring)
 *   - AttrsToType<T>: a mapped type that walks an attribute object and
 *     produces the corresponding TypeScript interface
 *
 * Author attribute files like:
 *
 *     export const attributes = {
 *         orientation: {
 *             valType: 'enumerated',
 *             values: ['v', 'h'] as const,
 *             dflt: 'h',
 *             editType: 'modebar',
 *         },
 *         bgcolor: { valType: 'color', editType: 'modebar' },
 *     } as const satisfies AttributeMap;
 *
 *     export type ModeBarAttributes = AttrsToType<typeof attributes>;
 */

import type { Color, ColorScale, Datum, TypedArray } from './common';

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

// ---------------------------------------------------------------------------
// Type-level conversion
// ---------------------------------------------------------------------------

/**
 * Wrap a type with `T | T[]` if `arrayOk: true` is set on the attribute.
 */
type ApplyArrayOk<A, V> = A extends { arrayOk: true } ? V | V[] : V;

/**
 * Map a single leaf attribute (object with `valType`) to its TS value type.
 */
export type ValTypeToTS<A extends AttrInfo> = A extends DataArrayAttr
    ? Datum[] | TypedArray
    : A extends NumberAttr
      ? ApplyArrayOk<A, number>
      : A extends IntegerAttr
        ? ApplyArrayOk<A, number>
        : A extends StringAttr
          ? ApplyArrayOk<A, A extends { values: readonly (infer U extends string)[] } ? U : string>
          : A extends BooleanAttr
            ? ApplyArrayOk<A, boolean>
            : A extends ColorAttr
              ? ApplyArrayOk<A, Color>
              : A extends ColorScaleAttr
                ? ColorScale
                : A extends ColorListAttr
                  ? Color[]
                  : A extends AngleAttr
                    ? ApplyArrayOk<A, number | 'auto'>
                    : A extends SubplotIdAttr
                      ? string
                      : A extends EnumeratedAttr<infer V>
                        ? ApplyArrayOk<A, V[number]>
                        : A extends FlagListAttr
                          ? ApplyArrayOk<A, string>
                          : A extends InfoArrayAttr
                            ? unknown[]
                            : A extends AnyAttr
                              ? any
                              : never;

/**
 * Keys that are metadata about the container itself (not nested attributes).
 * They are stripped during type extraction.
 */
type ReservedKey = 'editType' | 'role' | '_isLinkedToArray' | '_isSubplotObj' | '_arrayAttrRegexps' | '_deprecated';

/**
 * Walk an AttributeMap and produce the corresponding TS interface shape.
 * - Leaf entries (with `valType`) → their TS value type
 * - Nested entries → recurse
 * - Reserved meta-keys → omitted
 *
 * The `-readonly` modifier strips the readonly that `as const` introduces
 * on the source attributes object. The attributes definition is genuinely
 * static, but the derived user-facing type represents user-supplied input
 * which should be mutable.
 */
export type AttrsToType<T> = {
    -readonly [K in keyof T as K extends ReservedKey ? never : K]?: T[K] extends AttrInfo
        ? ValTypeToTS<T[K]>
        : T[K] extends Record<string, any>
          ? AttrsToType<T[K]>
          : never;
};
