/**
 * Config types
 *
 * This file overlays a small hand-written interface on the schema-derived
 * `ConfigBase` to build `Config`. Most fields come straight from the schema.
 * The overrides cover the five fields whose schema `valType` is `any`. Those
 * fields accept a function value, an arbitrary-key map, or a structure too
 * irregular for the schema to model.
 */

import type { ConfigBase, Edits, ToImageButtonOptions, ToImageFormat } from '../generated/schema';
import type { PlotlyHTMLElement } from './events';
import type { ModeBarButtonAny, ModeBarDefaultButtons } from './layout';

export type { Edits, ToImageButtonOptions, ToImageFormat };

// ---------------------------------------------------------------------------
// Image export options
// ---------------------------------------------------------------------------

/**
 * Background mode for `Plotly.toImage` and `config.setBackground`.
 * A function receives the graph div and the resolved background color.
 */
export type SetBackground = 'opaque' | 'transparent' | ((gd: PlotlyHTMLElement, bgColor: string) => void);

/**
 * Options for `Plotly.toImage`. `toImage` renders the graph to a string that
 * works as a data URI or as raw SVG markup. The mode-bar button reads the same
 * fields, minus the two below, through `config.toImageButtonOptions`.
 */
export interface ToImgopts extends Omit<ToImageButtonOptions, 'filename'> {
    /** Override the background color with a static color name, or with a function that runs on each render */
    setBackground?: SetBackground;
    /** Return the bare image data, without the leading `data:image;` prefix */
    imageDataOnly?: boolean;
}

/**
 * Options for `Plotly.downloadImage`. Like `ToImgopts`, but adds a `filename`
 * because the browser saves the result to disk. `downloadImage` forces
 * `imageDataOnly` on, so a caller cannot set it.
 */
export interface DownloadImgopts extends Omit<ToImgopts, 'imageDataOnly'> {
    /**
     * Name for the downloaded file, without an extension. `downloadImage`
     * appends the extension that matches `format`. The name defaults to the
     * plot title, then the plot subtitle, then `plot-image`.
     */
    filename?: string;
}

// ---------------------------------------------------------------------------
// Config - hybrid (schema-derived + hand-written overrides)
// ---------------------------------------------------------------------------

/**
 * Hand-written overrides for the five `schema.config` fields whose `valType`
 * is `any`. These fields accept functions or arbitrary-key maps, which the
 * JSON schema cannot describe.
 */
interface ConfigOverrides {
    /** Override the background color with a static color name, or with a function that runs on each render */
    setBackground?: SetBackground;
    /** Define fully custom mode bar buttons as a nested array of button groups */
    modeBarButtons?: ModeBarButtonAny[][] | false;
    /** Add mode bar buttons with config objects or default-button names */
    modeBarButtonsToAdd?: ModeBarButtonAny[];
    /** Remove mode bar buttons by name */
    modeBarButtonsToRemove?: ModeBarDefaultButtons[];
    /** Localization definitions under a locale id key, for example `'en-US'` or `'fr'` */
    locales?: Record<string, { dictionary?: Record<string, string>; format?: Record<string, any> }>;
}

/**
 * Full plot config. `Config` combines `ConfigBase` (schema-derived) with the
 * hand-written `ConfigOverrides`, so the hand-written entries replace the
 * loosely-typed versions from the schema.
 */
export type Config = Omit<ConfigBase, keyof ConfigOverrides> & ConfigOverrides;
