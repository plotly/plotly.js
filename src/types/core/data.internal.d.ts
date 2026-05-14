/**
 * Internal data/trace types (not in public API)
 *
 * These are runtime-resolved versions of trace data with internal state
 * properties. For public trace types, see data.d.ts.
 */

import type { PlotData } from './data';

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
 * Fully processed plot data with defaults applied (internal use)
 */
export interface FullData extends Partial<PlotData> {
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
