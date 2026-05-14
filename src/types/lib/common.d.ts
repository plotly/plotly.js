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
