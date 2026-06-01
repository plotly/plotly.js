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

/**
 * Options for `Plotly.toImage`. The graph is rendered to a string suitable
 * for use as a data URI or as raw SVG markup.
 */
export interface ToImgopts {
    /** Output image format. */
    format: 'jpeg' | 'png' | 'webp' | 'svg';
    /** If null, uses current graph width */
    width: number | null;
    /** If null, uses current graph height */
    height: number | null;
    /** Resolution multiplier for raster formats. */
    scale?: number | undefined;
}

/**
 * Options for `Plotly.downloadImage`. Like `ToImgopts`, but also requires
 * a `filename` because the result is saved to disk by the browser.
 */
export interface DownloadImgopts {
    /** Output image format. */
    format: 'jpeg' | 'png' | 'webp' | 'svg';
    /** Output width in pixels. */
    width: number | null;
    /** Output height in pixels. */
    height: number | null;
    /** Filename used for the downloaded file (no extension required). */
    filename: string;
}

/**
 * Static defaults applied to the mode-bar "download image" button. Set
 * via `config.toImageButtonOptions`.
 */
export interface ToImageButtonOptions {
    /** Output image format. */
    format?: 'png' | 'svg' | 'jpeg' | 'webp';
    /** Downloaded filename. */
    filename?: string;
    /** Output height in pixels. */
    height?: number;
    /** Output width in pixels. */
    width?: number;
    /** Resolution multiplier for raster formats. */
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

/**
 * Full plot config. Combines `ConfigBase` (schema-derived) with the
 * hand-written `ConfigOverrides` so the hand-written entries replace the
 * loosely-typed `any` versions from the schema.
 */
export type Config = Omit<ConfigBase, keyof ConfigOverrides> & ConfigOverrides;
