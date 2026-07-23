/**
 * Internal data/trace types (not in public API)
 *
 * These are runtime-resolved versions of trace data with internal state
 * properties. For public trace types, see data.d.ts.
 */

import type { Datum } from '../lib/common';
import type { Data } from './data';

/**
 * Calculated trace data (internal).
 *
 * Per-trace `calcdata` entries produced during the calc step. The shape is
 * loose because each trace module attaches its own bookkeeping fields.
 */
export interface CalcData {
    /** Original index in the user-supplied data array. */
    i?: number;
    /** Trace-specific transient bag — shape varies by trace module. */
    t?: any;
    /** Back-reference to the fully-populated trace this calcdata belongs to. */
    trace?: FullData;
    /** Computed x coordinate(s). */
    x?: Datum | Datum[];
    /** Computed y coordinate(s). */
    y?: Datum | Datum[];
    /** Computed z coordinate(s) (for 3-D traces). */
    z?: Datum | Datum[];
    /** Trace-module-specific calc fields. */
    [key: string]: any;
}

/**
 * Internal `_`-prefixed fields added to traces during defaults supply.
 * Combined with the user-facing trace shape via `FullData`. Not exported —
 * internal helpers should use `FullData` rather than this directly.
 */
interface FullDataInternals {
    /** Names of attributes whose values are data arrays (used for hover/event data). */
    _arrayAttrs?: string[];
    /** Cached extremes (per axis) for autorange computation. */
    _extremes?: Record<string, any>;
    /** Original user-supplied trace object (pre-defaults). */
    _input?: Data;
    /** Length of the trace's data arrays (after coercion). */
    _length?: number;
    /** Captured `meta` references from trace and layout for template binding. */
    _meta?: { meta?: any; layout?: { meta?: any } };
    /** Reference to the trace module that handles this trace type. */
    _module?: any;
    /** Resolved template entry applied to this trace, if any. */
    _template?: any;
    /** Public trace index (also exposed to users on PlotData). */
    index?: number;
    /** Other internal fields written by trace modules. */
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
