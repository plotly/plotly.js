/**
 * Internal data/trace types (not in public API)
 *
 * These are runtime-resolved versions of trace data with internal state
 * properties. For public trace types, see data.d.ts.
 */

import type { Data } from './data';

/**
 * Calculated trace data (internal)
 */
export interface CalcData {
    i?: number;
    t?: any;
    trace?: FullData;
    x?: any;
    y?: any;
    z?: any;
    [key: string]: any;
}

/**
 * Internal `_`-prefixed fields added to traces during defaults supply.
 * Combined with the user-facing trace shape via `FullData`. Not exported —
 * internal helpers should use `FullData` rather than this directly.
 */
interface FullDataInternals {
    _arrayAttrs?: string[];
    _expandedIndex?: number;
    _extremes?: Record<string, any>;
    _fullInput?: any;
    _hasCalcTransform?: boolean;
    _indexToPoints?: { [key: number]: number[] };
    _input?: any;
    _length?: number;
    _meta?: { meta?: any; layout?: { meta?: any } };
    _module?: any;
    _template?: any;
    index?: number;
    [key: string]: any;
}

/**
 * Fully processed plot data with defaults applied (internal use).
 *
 * `FullData` is the `Data` discriminated union intersected with internal state.
 * That means narrowing on `trace.type` gives you the right trace-specific
 * fields (`if (trace.type === 'bar') trace.marker?.cornerradius`) while
 * `_`-prefixed internal fields are always accessible.
 */
export type FullData = Data & FullDataInternals;
