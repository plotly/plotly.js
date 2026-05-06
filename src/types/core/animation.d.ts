/**
 * Animation types
 *
 * Defines animation and transition types for Plotly.
 */

import type { PlotData } from './data';
import type { Layout } from './layout';

/**
 * Transition easing type
 */
export type TransitionEasing =
    | 'linear'
    | 'quad'
    | 'cubic'
    | 'sin'
    | 'exp'
    | 'circle'
    | 'elastic'
    | 'back'
    | 'bounce'
    | 'linear-in'
    | 'quad-in'
    | 'cubic-in'
    | 'sin-in'
    | 'exp-in'
    | 'circle-in'
    | 'elastic-in'
    | 'back-in'
    | 'bounce-in'
    | 'linear-out'
    | 'quad-out'
    | 'cubic-out'
    | 'sin-out'
    | 'exp-out'
    | 'circle-out'
    | 'elastic-out'
    | 'back-out'
    | 'bounce-out'
    | 'linear-in-out'
    | 'quad-in-out'
    | 'cubic-in-out'
    | 'sin-in-out'
    | 'exp-in-out'
    | 'circle-in-out'
    | 'elastic-in-out'
    | 'back-in-out'
    | 'bounce-in-out';

/**
 * Transition configuration
 */
export interface Transition {
    /**
     * Duration of the transition in milliseconds
     */
    duration?: number;

    /**
     * Easing function for the transition
     */
    easing?: TransitionEasing;

    /**
     * Ordering of the transition
     */
    ordering?: 'layout first' | 'traces first';
}

/**
 * Animation frame options
 */
export interface AnimationFrameOpts {
    /**
     * Duration of the frame in milliseconds
     */
    duration?: number;

    /**
     * Whether to redraw the plot
     */
    redraw?: boolean;
}

/**
 * Animation options
 */
export interface AnimationOpts {
    /**
     * Animation mode
     */
    mode?: 'immediate' | 'next' | 'afterall';

    /**
     * Animation direction
     */
    direction?: 'forward' | 'reverse';

    /**
     * Start from current state
     */
    fromcurrent?: boolean;

    /**
     * Transition configuration
     */
    transition?: Partial<Transition>;

    /**
     * Frame configuration
     */
    frame?: Partial<AnimationFrameOpts>;
}

/**
 * Animation frame
 */
export interface Frame {
    /**
     * Frame group
     */
    group?: string;

    /**
     * Frame name
     */
    name: string;

    /**
     * Trace indices this frame applies to
     */
    traces?: number[];

    /**
     * Base frame to inherit from
     */
    baseframe?: string;

    /**
     * Data updates for this frame
     */
    data?: Partial<PlotData>[];

    /**
     * Layout updates for this frame
     */
    layout?: Partial<Layout>;
}
