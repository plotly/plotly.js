export const xmlns = 'http://www.w3.org/2000/xmlns/';
export const svg = 'http://www.w3.org/2000/svg';
export const xlink = 'http://www.w3.org/1999/xlink';

// The 'old' d3 quirk got fix in v3.5.7
// https://github.com/mbostock/d3/commit/a6f66e9dd37f764403fc7c1f26be09ab4af24fed
export const svgAttrs = {
    xmlns: svg,
    'xmlns:xlink': xlink
} as const;
