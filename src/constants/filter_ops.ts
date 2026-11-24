export const COMPARISON_OPS = ['=', '!=', '<', '>=', '>', '<='] as const;
export const COMPARISON_OPS2 = ['=', '<', '>=', '>', '<='] as const;
export const INTERVAL_OPS = ['[]', '()', '[)', '(]', '][', ')(', '](', ')['] as const;
export const SET_OPS = ['{}', '}{'] as const;
/** An operator that `CONSTRAINT_REDUCTION` maps to its canonical form */
export type ReducibleOp = (typeof COMPARISON_OPS2)[number] | (typeof INTERVAL_OPS)[number];

export const CONSTRAINT_REDUCTION = {
    // For contour constraints, open/closed endpoints are equivalent
    '=': '=',
    '<': '<',
    '<=': '<',
    '>': '>',
    '>=': '>',
    '[]': '[]',
    '()': '[]',
    '[)': '[]',
    '(]': '[]',
    '][': '][',
    ')(': '][',
    '](': '][',
    ')[': ']['
} as const satisfies Record<ReducibleOp, ReducibleOp>;
