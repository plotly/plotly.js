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
    /**
     * Output image format. `'full-json'` returns the figure as a JSON
     * string instead of a raster/vector image.
     */
    format?: 'jpeg' | 'png' | 'webp' | 'svg' | 'full-json';
    /** If null (the default), uses current graph width */
    width?: number | null;
    /** If null (the default), uses current graph height */
    height?: number | null;
    /** Resolution multiplier for raster formats. Defaults to 1. */
    scale?: number | undefined;
    /**
     * Overrides the image background, which otherwise follows
     * `layout.paper_bgcolor`. Set to `'opaque'` when exporting a `'jpeg'`,
     * since JPEG does not support transparency.
     */
    setBackground?: 'opaque' | 'transparent' | ((gd: PlotlyHTMLElement, bgColor: string) => void);
    /**
     * If true, returns only the raw base64/SVG data, without the
     * `data:image/...;base64,` (or `data:image/svg+xml,`) prefix. Defaults
     * to false.
     */
    imageDataOnly?: boolean;
}

/**
 * Options for `Plotly.downloadImage`. Like `ToImgopts`, but adds a
 * `filename` for the downloaded file; unlike `ToImgopts`, `imageDataOnly`
 * is not accepted since `downloadImage` always saves a full file.
 */
export interface DownloadImgopts {
    /** Output image format. `'full-json'` downloads the figure as JSON. */
    format?: 'jpeg' | 'png' | 'webp' | 'svg' | 'full-json';
    /** Output width in pixels. If null (the default), uses current graph width. */
    width?: number | null;
    /** Output height in pixels. If null (the default), uses current graph height. */
    height?: number | null;
    /**
     * Filename used for the downloaded file (no extension required). If
     * omitted, a name is derived from the graph's title (or subtitle),
     * falling back to `'plot-image'`.
     */
    filename?: string;
    /** Resolution multiplier for raster formats. Defaults to 1. */
    scale?: number | undefined;
    /**
     * Overrides the image background, which otherwise follows
     * `layout.paper_bgcolor`. Set to `'opaque'` when exporting a `'jpeg'`,
     * since JPEG does not support transparency.
     */
    setBackground?: 'opaque' | 'transparent' | ((gd: PlotlyHTMLElement, bgColor: string) => void);
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
 * Hand-written overrides for the six `schema.config` fields whose
 * `valType` is `any`. These accept functions or arbitrary-key maps that the
 * JSON schema fundamentally cannot describe, so they stay typed by hand.
 */
interface ConfigOverrides {
    /** Override the background color: a static color name, or a function called per-render. */
    setBackground?: 'opaque' | 'transparent' | ((gd: PlotlyHTMLElement, bgColor: string) => void);
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
