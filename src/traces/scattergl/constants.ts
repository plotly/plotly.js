import type { Dash } from '../../types/generated/schema';

export const TOO_MANY_POINTS = 1e5;

export const SYMBOL_SDF_SIZE = 200;
export const SYMBOL_SIZE = 20;
export const SYMBOL_STROKE = SYMBOL_SIZE / 20;

export const DOT_RE = /-dot/;
export const OPEN_RE = /-open/;

export const DASHES = {
    solid: [1],
    dot: [1, 1],
    dash: [4, 1],
    longdash: [8, 1],
    dashdot: [4, 1, 1, 1],
    longdashdot: [8, 1, 1, 1]
} as const satisfies Record<Dash, number[]>;
