'use strict';

var pieAttrs = require('../pie/attributes');
var baseAttrs = require('../../plots/attributes');
var domainAttrs = require('../../plots/domain').attributes;
var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var texttemplateAttrs = require('../../plots/template_attributes').texttemplateAttrs;

var extendFlat = require('../../lib/extend').extendFlat;

module.exports = {
    labels: pieAttrs.labels,
    // equivalent of x0 and dx, if label is missing
    label0: pieAttrs.label0,
    dlabel: pieAttrs.dlabel,
    values: pieAttrs.values,

    marker: {
        colors: pieAttrs.marker.colors,
        line: {
            color: extendFlat({}, pieAttrs.marker.line.color, {
                dflt: null,
                description: [
                    'Sets the color of the line enclosing each sector.',
                    'Defaults to the `paper_bgcolor` value.'
                ].join(' ')
            }),
            width: extendFlat({}, pieAttrs.marker.line.width, {dflt: 1}),
            editType: 'calc'
        },
        editType: 'calc'
    },

    text: pieAttrs.text,
    hovertext: pieAttrs.hovertext,

    scalegroup: extendFlat({}, pieAttrs.scalegroup, {
        description: [
            'If there are multiple funnelareas that should be sized according to',
            'their totals, link them by providing a non-empty group id here',
            'shared by every trace in the same group.'
        ].join(' ')
    }),

    textinfo: extendFlat({}, pieAttrs.textinfo, {
        flags: ['label', 'text', 'value', 'percent']
    }),

    texttemplate: texttemplateAttrs({editType: 'plot'}, {
        keys: ['label', 'color', 'value', 'text', 'percent']
    }),

    hoverinfo: extendFlat({}, baseAttrs.hoverinfo, {
        flags: ['label', 'text', 'value', 'percent', 'name']
    }),

    hovertemplate: hovertemplateAttrs({}, {
        keys: ['label', 'color', 'value', 'text', 'percent']
    }),

    textposition: extendFlat({}, pieAttrs.textposition, {
        values: ['inside', 'none'],
        dflt: 'inside'
    }),

    textfont: pieAttrs.textfont,
    insidetextfont: pieAttrs.insidetextfont,

    title: {
        text: pieAttrs.title.text,
        font: pieAttrs.title.font,
        position: extendFlat({}, pieAttrs.title.position, {
            values: ['top left', 'top center', 'top right'],
            dflt: 'top center'
        }),
        editType: 'plot'
    },

    domain: domainAttrs({name: 'funnelarea', trace: true, editType: 'calc'}),

    aspectratio: {
        valType: 'number',
        min: 0,
        dflt: 1,
        editType: 'plot',
        description: [
            'Sets the ratio between height and width'
        ].join(' ')
    },

    baseratio: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 0.333,
        editType: 'plot',
        description: [
            'Sets the ratio between bottom length and maximum top length.'
        ].join(' ')
    }
};
