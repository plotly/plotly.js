/**
 * Common library utility types
 *
 * Types for Lib utilities and helpers
 */

/**
 * Coercion function signature
 */
export type CoerceFn = (attr: string, dflt?: any) => any;

/**
 * Nested property path
 */
export type PropertyPath = string | string[];

/**
 * Color scale
 */
export type ColorScale = string | string[] | Array<[number, string]>;

/**
 * Date format string
 */
export type DateFormat = string;

/**
 * Single data value
 */
export type Datum = string | number | Date | null;

/**
 * Line dash styles
 */
export type Dash = 'solid' | 'dot' | 'dash' | 'longdash' | 'dashdot' | 'longdashdot';

/**
 * Supported calendar systems
 */
export type Calendar =
    | 'chinese'
    | 'coptic'
    | 'discworld'
    | 'ethiopian'
    | 'gregorian'
    | 'hebrew'
    | 'islamic'
    | 'jalali'
    | 'julian'
    | 'mayan'
    | 'nanakshahi'
    | 'nepali'
    | 'persian'
    | 'taiwan'
    | 'thai'
    | 'ummalqura';

/**
 * Axis type
 */
export type AxisType = '-' | 'category' | 'date' | 'linear' | 'log' | 'multicategory';

/**
 * Numeric array
 */
export type NumericArray = number[] | Float32Array | Float64Array;

/**
 * Type that can be a single value or an array
 */
export type Arrayable<T> = T | T[];

/**
 * Rectangle bounds
 */
export interface Rect {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width?: number;
    height?: number;
}

/**
 * Point in 2D space
 */
export interface Point2D {
    x: number;
    y: number;
}

/**
 * Point in 3D space
 */
export interface Point3D extends Point2D {
    z: number;
}

/**
 * RGBA color
 */
export interface RGBAColor {
    r: number;
    g: number;
    b: number;
    a: number;
}
