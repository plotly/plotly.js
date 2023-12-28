'use strict';

var scatterPolarAttrs = require('../scatterpolar/attributes');
var scatterGlAttrs = require('../scattergl/attributes');
var texttemplateAttrs = require('../../plots/template_attributes').texttemplateAttrs;

module.exports = {
    mode: scatterPolarAttrs.mode,
    r: scatterPolarAttrs.r,
    theta: scatterPolarAttrs.theta,
    r0: scatterPolarAttrs.r0,
    dr: scatterPolarAttrs.dr,
    theta0: scatterPolarAttrs.theta0,
    dtheta: scatterPolarAttrs.dtheta,
    thetaunit: scatterPolarAttrs.thetaunit,

    text: scatterPolarAttrs.text,
    texttemplate: texttemplateAttrs({editType: 'plot'}, {
        keys: ['r', 'theta', 'text']
    }),
    hovertext: scatterPolarAttrs.hovertext,
    hovertemplate: scatterPolarAttrs.hovertemplate,

    line: {
        color: scatterGlAttrs.line.color,
        width: scatterGlAttrs.line.width,
        dash: scatterGlAttrs.line.dash,
        editType: 'calc'
    },

    connectgaps: scatterGlAttrs.connectgaps,

    marker: scatterGlAttrs.marker,
    // no cliponaxis

    fill: scatterGlAttrs.fill,
    fillcolor: scatterGlAttrs.fillcolor,

    textposition: scatterGlAttrs.textposition,
    textfont: scatterGlAttrs.textfont,

    hoverinfo: scatterPolarAttrs.hoverinfo,
    // no hoveron

    selected: scatterPolarAttrs.selected,
    unselected: scatterPolarAttrs.unselected
};
