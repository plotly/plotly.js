/**
 * Common trace-related types
 *
 * Types shared across different trace modules
 */

/**
 * Calculated trace data (internal)
 */
export interface CalcData {
    x?: any;
    y?: any;
    z?: any;
    trace?: any;
    t?: any;
    [key: string]: any;
}

/**
 * Trace module interface
 */
export interface TraceModule {
    name: string;
    categories: string[];
    animatable?: boolean;
    meta?: any;

    // Lifecycle methods
    calc?: (gd: any, trace: any) => CalcData[];
    plot?: (gd: any, subplot: any, cdata: any, transitionOpts?: any) => void;
    style?: (gd: any, cd?: any) => void;
    hoverPoints?: (pointData: any, xval: any, yval: any, hovermode: any) => any;
    selectPoints?: (searchInfo: any, selectionTester: any) => any;
    eventData?: (out: any, pt: any, trace: any, cd: any, pointNumber: any) => any;

    // Other methods
    crossTraceCalc?: (gd: any, plotinfo: any, traces: any[]) => void;
    arraysToCalcdata?: (cd: any, trace: any) => void;
}

/**
 * Trace defaults function signature
 */
export type TraceDefaultsFn = (
    traceIn: any,
    traceOut: any,
    defaultColor: string,
    layout: any
) => void;

/**
 * Trace attributes structure
 */
export interface TraceAttributes {
    [key: string]: AttributeDefinition;
}

/**
 * Attribute definition
 */
export interface AttributeDefinition {
    arrayOk?: boolean;
    description?: string;
    dflt?: any;
    editType?: string;
    flags?: string[];
    max?: number;
    min?: number;
    role?: string;
    valType?: string;
    values?: any[];
    [key: string]: any;
}
