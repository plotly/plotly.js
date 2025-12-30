/**
 * Common plot-related types
 *
 * Types shared across different plot modules
 */

/**
 * Plot info structure (internal)
 */
export interface PlotInfo {
    id: string;
    xaxis: any;
    yaxis: any;
    domain?: { x: [number, number]; y: [number, number] };
    _module?: any;
    [key: string]: any;
}

/**
 * Subplot structure
 */
export interface Subplot {
    id: string;
    type: string;
    domain?: { x: [number, number]; y: [number, number] };
    [key: string]: any;
}

/**
 * Axis range
 */
export type AxisRange = [number, number];

/**
 * Domain range (normalized 0-1)
 */
export type DomainRange = [number, number];
