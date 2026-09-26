import type { Dash } from '../types/generated/schema';

/** Dash pattern for gl3d lines: the gl-line3d `dashes` stops, then its `dashScale` repeat count */
type DashPattern = [number[], number];

const dashes = {
    solid: [[], 0],
    dot: [[0.5, 1], 200],
    dash: [[0.5, 1], 50],
    longdash: [[0.5, 1], 10],
    dashdot: [[0.5, 0.625, 0.875, 1], 50],
    longdashdot: [[0.5, 0.7, 0.8, 1], 10]
} as const satisfies Record<Dash, DashPattern>;

export default dashes;
