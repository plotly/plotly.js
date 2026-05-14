/**
 * Central type definitions for plotly.js
 *
 * @example
 * import type { GraphDiv, Layout, PlotData } from '../types';
 */

// Library utilities
export * from './lib/common';

// Core types
export * from './core/animation';
export * from './core/api';
export * from './core/config';
export * from './core/data';
export * from './core/events';
export * from './core/graph-div';
export * from './core/layout';

// Schema-generated types (traces + layout + shared interfaces)
export * from './generated/schema';
