/**
 * Config types
 *
 * `Config` is built by overlaying a small hand-written interface on top of
 * the schema-derived `ConfigBase`. Most fields come straight from the
 * schema; the overrides cover seven fields whose schema `valType` is `any`
 * because the underlying JS attribute accepts a function value, an
 * arbitrary-key map, or a structure too irregular for the schema to model.
 */

import type { ConfigBase, Edits } from '../generated/schema';
import type { PlotlyHTMLElement } from './events';
import type { ModeBarButtonAny, ModeBarDefaultButtons } from './layout';

export type { Edits };

// ---------------------------------------------------------------------------
// Image export options
// ---------------------------------------------------------------------------

export interface ToImgopts {
    format: 'jpeg' | 'png' | 'webp' | 'svg';
    /** If null, uses current graph width */
    width: number | null;
    /** If null, uses current graph height */
    height: number | null;
    scale?: number | undefined;
}

export interface DownloadImgopts {
    format: 'jpeg' | 'png' | 'webp' | 'svg';
    width: number | null;
    height: number | null;
    filename: string;
}

export interface ToImageButtonOptions {
    format?: 'png' | 'svg' | 'jpeg' | 'webp';
    filename?: string;
    height?: number;
    width?: number;
    scale?: number;
}

// ---------------------------------------------------------------------------
// Config — hybrid (schema-derived + hand-written overrides)
// ---------------------------------------------------------------------------

/**
 * Hand-written overrides for the seven `schema.config` fields whose
 * `valType` is `any`. These accept functions or arbitrary-key maps that the
 * JSON schema fundamentally cannot describe, so they stay typed by hand.
 */
interface ConfigOverrides {
    /** Override the background color: a static color name, or a function called per-render. */
    setBackground?: 'opaque' | 'transparent' | ((gd: PlotlyHTMLElement, bgColor: string) => void);
    /** Source attribution shown at the bottom of the graph. */
    showSources?: false | ((gd: PlotlyHTMLElement) => void | Promise<void>);
    /** Define fully custom mode bar buttons as nested array of button groups. */
    modeBarButtons?: ModeBarButtonAny[][] | false;
    /** Add mode bar buttons using config objects or default-button names. */
    modeBarButtonsToAdd?: ModeBarButtonAny[];
    /** Remove mode bar buttons by name. */
    modeBarButtonsToRemove?: ModeBarDefaultButtons[];
    /** Statically override options for the toImage mode bar button. */
    toImageButtonOptions?: ToImageButtonOptions;
    /** Localization definitions keyed by locale id (e.g. `'en-US'`, `'fr'`). */
    locales?: Record<string, { dictionary?: Record<string, string>; format?: Record<string, any> }>;
}

export type Config = Omit<ConfigBase, keyof ConfigOverrides> & ConfigOverrides;
