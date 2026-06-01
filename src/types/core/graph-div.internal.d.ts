/**
 * Internal GraphDiv types (not in public API)
 *
 * The `gd` parameter appears throughout the codebase and represents
 * the graph div element with plotly-specific properties attached.
 * Commonly referred to as `gd` in the codebase.
 */

import type { Layout } from '../generated/schema';
import type { Config } from './config';
import type { Data } from './data';
import type { CalcData, FullData } from './data.internal';
import type { FullLayout } from './layout.internal';

/**
 * Graph context containing environment info (mirrors Config for internal storage).
 *
 * Stored on `gd._context`. Mostly the resolved `Config`, but the index
 * signature allows trace modules and components to stash module-specific
 * runtime state alongside the user-visible config.
 */
export interface GraphContext extends Partial<Config> {
    /** Module-specific runtime state attached to the context. */
    [key: string]: any;
}

/**
 * The main graph div element that Plotly operates on.
 * This is an HTMLDivElement with additional Plotly-specific properties.
 */
export interface GraphDiv extends HTMLDivElement {
    /** Resolved configuration plus internal context. */
    _context?: GraphContext;
    /** True while an inline edit is in progress (e.g. axis title rename). */
    _editing?: boolean;
    /** Trace data after defaults are applied. */
    _fullData?: FullData[];
    /** Layout after defaults are applied. */
    _fullLayout?: FullLayout;
    /** Most recent hover payloads (used to deduplicate hover events). */
    _hoverdata?: any[];
    /** True once `Plotly.plot`/`newPlot` has run at least once. */
    _initialized?: boolean;
    /** Outstanding async operations the next call must await. */
    _promises?: Promise<any>[];
    /** Transient state used during transitions and animations. */
    _transitionData?: any;
    /** True while a transition/animation is running. */
    _transitioning?: boolean;
    /** Per-subplot, per-trace `calcdata` arrays produced by the calc step. */
    calcdata?: CalcData[][];
    /** User-supplied config object. */
    config?: Partial<Config>;
    /** User-supplied data array. */
    data?: Data[];
    /** Plotly event emitter; bound to `EventEmitter` once initialized. */
    emit?: (event: string, ...args: any[]) => void;
    /** User-supplied layout object. */
    layout?: Partial<Layout>;
    /** Misc plotly-internal properties (module bookkeeping, caches, etc.). */
    [key: string]: any;
}
