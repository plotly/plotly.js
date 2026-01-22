/**
 * Common component-related types
 *
 * Types shared across different component modules
 */

/**
 * Component module interface
 */
export interface ComponentModule {
    includeBasePlot?: (basePlotModule: string) => void;
    layoutAttributes?: any;
    name: string;
    supplyLayoutDefaults?: (layoutIn: any, layoutOut: any, fullData: any) => void;
}

/**
 * Drawing options (used by many components)
 */
export interface DrawingOptions {
    duration?: number;
    ease?: string;
    redraw?: boolean;
}

/**
 * SVG text utilities return type
 */
export interface TextBBox {
    bottom: number;
    height: number;
    left: number;
    right: number;
    top: number;
    width: number;
}

/**
 * Color with alpha
 */
export type ColorString = string;
