import type { AttributeMap } from '../../types/lib/attributes';

// There is type warning when using import (ESM), keep using require for now
const ternaryAttrs = require('../scatterternary/attributes');
const scatterGlAttrs = require('../scattergl/attributes');

// No cliponaxis and hoveron
const attributes = {
    a: ternaryAttrs.a,
    b: ternaryAttrs.b,
    c: ternaryAttrs.c,
    sum: ternaryAttrs.sum,
    mode: ternaryAttrs.mode,
    text: ternaryAttrs.text,
    texttemplate: ternaryAttrs.texttemplate,
    texttemplatefallback: ternaryAttrs.texttemplatefallback,
    hoverinfo: ternaryAttrs.hoverinfo,
    hovertext: ternaryAttrs.hovertext,
    hovertemplate: ternaryAttrs.hovertemplate,
    hovertemplatefallback: ternaryAttrs.hovertemplatefallback,
    line: {
        color: scatterGlAttrs.line.color,
        width: scatterGlAttrs.line.width,
        dash: scatterGlAttrs.line.dash,
        // no backoff and smoothing
        // and only 'linear' value for shape, so no need to expose
        editType: 'calc'
    },
    connectgaps: scatterGlAttrs.connectgaps,
    fill: ternaryAttrs.fill,
    fillcolor: scatterGlAttrs.fillcolor,
    marker: scatterGlAttrs.marker,
    textfont: scatterGlAttrs.textfont,
    textposition: scatterGlAttrs.textposition,
    selected: scatterGlAttrs.selected,
    unselected: scatterGlAttrs.unselected
} as const satisfies AttributeMap;

export default attributes;
