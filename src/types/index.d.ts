/**
 * Central type definitions for plotly.js
 *
 * @example
 * import type { GraphDiv, Layout, PlotData } from '../types';
 */

// Library utilities
export * from './lib/common';

// Core types (public)
export * from './core/animation';
export * from './core/api';
export * from './core/config';
export * from './core/data';
export * from './core/events';
export * from './core/layout';

// Core types (internal — not re-exported in lib/index.d.ts)
export * from './core/data.internal';
export * from './core/graph-div.internal';
export * from './core/layout.internal';

// Schema-generated types (traces + layout + shared interfaces)
export * from './generated/schema';
