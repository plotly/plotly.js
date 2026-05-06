/**
 * Common library utility types
 *
 * Utility types, scalars, and helpers used throughout plotly.js
 */

// ---------------------------------------------------------------------------
// Scalar / union types
// ---------------------------------------------------------------------------

export type Datum = string | number | Date | null;

export type TypedArray =
    | Int8Array
    | Uint8Array
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Uint8ClampedArray
    | Float32Array
    | Float64Array;

export type Color =
    | string
    | number
    | Array<string | number | undefined | null>
    | Array<Array<string | number | undefined | null>>;

export type ColorScale = string | string[] | Array<[number, string]>;

export type Dash = 'solid' | 'dot' | 'dash' | 'longdash' | 'dashdot' | 'longdashdot';

export type Calendar =
    | 'gregorian'
    | 'chinese'
    | 'coptic'
    | 'discworld'
    | 'ethiopian'
    | 'hebrew'
    | 'islamic'
    | 'julian'
    | 'mayan'
    | 'nanakshahi'
    | 'nepali'
    | 'persian'
    | 'jalali'
    | 'taiwan'
    | 'thai'
    | 'ummalqura';

export type AxisType = '-' | 'linear' | 'log' | 'date' | 'category' | 'multicategory';

export type DTickValue = number | string;

export type MarkerSymbol = string | number | Array<string | number>;

export type XAnchor = 'auto' | 'left' | 'center' | 'right';
export type YAnchor = 'auto' | 'top' | 'middle' | 'bottom';
export type XRef = 'container' | 'paper';
export type YRef = 'container' | 'paper';

// ---------------------------------------------------------------------------
// Error bars
// ---------------------------------------------------------------------------

export interface ErrorOptions {
    visible: boolean;
    symmetric: boolean;
    color: Color;
    thickness: number;
    width: number;
}

export type ErrorBar = Partial<ErrorOptions> &
    (
        | {
              type: 'constant' | 'percent';
              value: number;
              valueminus?: number | undefined;
          }
        | {
              type: 'data';
              array: Datum[];
              arrayminus?: Datum[] | undefined;
          }
    );

// ---------------------------------------------------------------------------
// Pattern
// ---------------------------------------------------------------------------

export type PatternShape = '' | '/' | '\\' | 'x' | '-' | '|' | '+' | '.';

export interface Pattern {
    shape?: PatternShape | PatternShape[] | undefined;
    path?: string | undefined;
    fillmode?: 'replace' | 'overlay' | undefined;
    bgcolor?: string | string[] | undefined;
    fgcolor?: string | string[] | undefined;
    fgopacity?: number | undefined;
    size?: number | number[] | undefined;
    solidity?: number | number[] | undefined;
}

// ---------------------------------------------------------------------------
// Internal / lib utility types
// ---------------------------------------------------------------------------

export type CoerceFn = (attr: string, dflt?: any) => any;

export type PropertyPath = string | string[];

export type DateFormat = string;

export type NumericArray = number[] | Float32Array | Float64Array;

export type Arrayable<T> = T | T[];

export interface Rect {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width?: number;
    height?: number;
}

export interface Point2D {
    x: number;
    y: number;
}

export interface Point3D extends Point2D {
    z: number;
}

export interface RGBAColor {
    r: number;
    g: number;
    b: number;
    a: number;
}
