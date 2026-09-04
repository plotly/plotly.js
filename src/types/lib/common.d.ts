/**
 * Common library utility types
 *
 * Utility types, scalars, and helpers used throughout plotly.js
 */

// ---------------------------------------------------------------------------
// Scalar / union types
// ---------------------------------------------------------------------------

/**
 * A single data value as accepted by axes and marker channels. `null`
 * represents a missing point.
 */
export type Datum = string | number | Date | null;

/**
 * Any numeric typed array plotly.js accepts in place of a plain `number[]`.
 * Typed arrays avoid per-element boxing and are recommended for large
 * datasets.
 */
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

/**
 * A color value. Accepts CSS color strings, raw numeric values (mapped via
 * a colorscale), or arrays/2-D arrays for per-point/per-grid coloring.
 */
export type Color =
    | string
    | number
    | Array<string | number | undefined | null>
    | Array<Array<string | number | undefined | null>>;

/**
 * A colorscale specification: a named built-in scale (`'Viridis'`), an
 * array of CSS color strings, or an array of `[stop, color]` tuples where
 * `stop` is in `[0, 1]`.
 */
export type ColorScale = string | string[] | Array<[number, string]>;

/**
 * Value for `dtick` (tick spacing): a number for numeric axes, a
 * string for date/log/category axes (e.g. `'M1'` = one month).
 */
export type DTickValue = number | string;

/**
 * Marker symbol — a symbol name (`'circle'`, `'square-open'`), a symbol
 * index, or an array thereof for per-point symbols.
 */
export type MarkerSymbol = string | number | Array<string | number>;

/** Horizontal anchor position for components (legend, annotation, etc.). */
export type XAnchor = 'auto' | 'left' | 'center' | 'right';
/** Vertical anchor position for components (legend, annotation, etc.). */
export type YAnchor = 'auto' | 'top' | 'middle' | 'bottom';

// ---------------------------------------------------------------------------
// Axis and subplot identifiers
//
// The schema states these as regexes, which no TypeScript type can express
// exactly. The template literal types below enumerate the accepted strings
// instead, so they are bounded where the schema is not. See the digit-tier
// note on `AxisNumber`.
//
// tasks/generate_schema_types.mjs maps each schema regex onto one of these
// types through its REGEX_VALUE_TYPES table.
// ---------------------------------------------------------------------------

type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type NonZeroDigit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * Numeric axis suffix. Empty for the first axis (`x` / `y`), then `2` through
 * `999`. There is no `1` suffix — the first axis is unnumbered.
 *
 * The schema regex accepts any number of digits. This type stops at three
 * because a template literal union has to be finite, so charts with 1000 or
 * more axes of one letter cannot be typed.
 */
type AxisNumber = '' | `${Exclude<NonZeroDigit, 1>}` | `${NonZeroDigit}${Digit}` | `${NonZeroDigit}${Digit}${Digit}`;

/**
 * Two-digit variant of `AxisNumber`, capped at `99`.
 *
 * Used only where the suffix appears twice in one identifier. Three digits
 * squared exceeds the TypeScript union size limit.
 */
type ShortAxisNumber = '' | `${Exclude<NonZeroDigit, 1>}` | `${NonZeroDigit}${Digit}`;

/** Any valid x-axis reference: `'x'`, `'x2'`, …, optionally `' domain'`. */
export type XAxisName = `x${AxisNumber}${'' | ' domain'}`;
/** Any valid y-axis reference: `'y'`, `'y2'`, …, optionally `' domain'`. */
export type YAxisName = `y${AxisNumber}${'' | ' domain'}`;
/** Any valid axis reference (x or y, numbered or not, domain-qualified or not). */
export type AxisName = XAxisName | YAxisName;

/**
 * A cartesian subplot id pairing an x and a y axis, such as `'xy'` or
 * `'x3y2'`. Unlike `XAxisName`, no `' domain'` qualifier is permitted.
 */
export type CartesianSubplotId = `x${ShortAxisNumber}y${ShortAxisNumber}`;

// ---------------------------------------------------------------------------
// Error bars
// ---------------------------------------------------------------------------

/**
 * Shared options applicable to all error bar variants. Composed into
 * `ErrorBar` along with type-specific fields.
 */
export interface ErrorOptions {
    /** Whether error bars are drawn. */
    visible: boolean;
    /** When true, the same length is used on both sides of each point. */
    symmetric: boolean;
    /** Color of the error bar lines. */
    color: Color;
    /** Line thickness in pixels. */
    thickness: number;
    /** Cross-tick width in pixels at the end of each error bar. */
    width: number;
}

/**
 * Error bar configuration — a tagged union over `type`:
 * - `'constant'` / `'percent'` carry a scalar `value` (and optional
 *   `valueminus` for asymmetric bars).
 * - `'data'` carries explicit `array` (and optional `arrayminus`) data.
 */
export type ErrorBar = Partial<ErrorOptions> &
    (
        | {
              /** Bar length is computed from `value` (constant or percent of point). */
              type: 'constant' | 'percent';
              /** Magnitude of the upper (or symmetric) bar. */
              value: number;
              /** Magnitude of the lower bar when asymmetric. */
              valueminus?: number | undefined;
          }
        | {
              /** Bar lengths are taken from explicit data arrays. */
              type: 'data';
              /** Per-point magnitudes for the upper (or symmetric) bar. */
              array: Datum[];
              /** Per-point magnitudes for the lower bar when asymmetric. */
              arrayminus?: Datum[] | undefined;
          }
    );
