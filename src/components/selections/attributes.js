'use strict';

var annAttrs = require('../annotations/attributes');
var scatterLineAttrs = require('../../traces/scatter/attributes').line;
var dash = require('../drawing/attributes').dash;
var extendFlat = require('../../lib/extend').extendFlat;
var overrideAll = require('../../plot_api/edit_types').overrideAll;
var templatedArray = require('../../plot_api/plot_template').templatedArray;
var axisPlaceableObjs = require('../../constants/axis_placeable_objects');

module.exports = overrideAll(templatedArray('selection', {
    type: {
        valType: 'enumerated',
        values: ['rect', 'path'],
        description: [
            'Specifies the selection type to be drawn.',

            'If *rect*, a rectangle is drawn linking',
            '(`x0`,`y0`), (`x1`,`y0`), (`x1`,`y1`) and (`x0`,`y1`).',

            'If *path*, draw a custom SVG path using `path`.'
        ].join(' ')
    },

    xref: extendFlat({}, annAttrs.xref, {
        description: [
            'Sets the selection\'s x coordinate axis.',
            axisPlaceableObjs.axisRefDescription('x', 'left', 'right')
        ].join(' ')
    }),

    yref: extendFlat({}, annAttrs.yref, {
        description: [
            'Sets the selection\'s x coordinate axis.',
            axisPlaceableObjs.axisRefDescription('y', 'bottom', 'top')
        ].join(' ')
    }),

    x0: {
        valType: 'any',
        description: 'Sets the selection\'s starting x position.'
    },
    x1: {
        valType: 'any',
        description: 'Sets the selection\'s end x position.'
    },

    y0: {
        valType: 'any',
        description: 'Sets the selection\'s starting y position.'
    },
    y1: {
        valType: 'any',
        description: 'Sets the selection\'s end y position.'
    },

    x0shift: {
        valType: 'number',
        dflt: 0,
        min: -1,
        max: 1,
        editType: 'calc',
        description: [
            'Only relevant if `xref` is a (multi-)category axes. Shifts `x0` by a fraction of the',
            'reference unit. E.g. -0.5 corresponds to the start of the category and 0.5 corresponds to the end of the category.'
        ].join(' ')
    },
    x1shift: {
        valType: 'number',
        dflt: 0,
        min: -1,
        max: 1,
        editType: 'calc',
        description: [
            'Only relevant if `xref` is a (multi-)category axes. Shifts `x1` by a fraction of the',
            'reference unit. E.g. -0.5 corresponds to the start of the category and 0.5 corresponds to the end of the category.'
        ].join(' ')
    },
    y0shift: {
        valType: 'number',
        dflt: 0,
        min: -1,
        max: 1,
        editType: 'calc',
        description: [
            'Only relevant if `yref` is a (multi-)category axes. Shifts `y0` by a fraction of the',
            'reference unit. E.g. -0.5 corresponds to the start of the category and 0.5 corresponds to the end of the category.'
        ].join(' ')
    },
    y1shift: {
        valType: 'number',
        dflt: 0,
        min: -1,
        max: 1,
        editType: 'calc',
        description: [
            'Only relevant if `yref` is a (multi-)category axes. Shifts `y1` by a fraction of the',
            'reference unit. E.g. -0.5 corresponds to the start of the category and 0.5 corresponds to the end of the category.'
        ].join(' ')
    },

    path: {
        valType: 'string',
        editType: 'arraydraw',
        description: [
            'For `type` *path* - a valid SVG path similar to `shapes.path` in data coordinates.',
            'Allowed segments are: M, L and Z.'
        ].join(' ')
    },

    opacity: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 0.7,
        editType: 'arraydraw',
        description: 'Sets the opacity of the selection.'
    },

    line: {
        color: scatterLineAttrs.color,
        width: extendFlat({}, scatterLineAttrs.width, {
            min: 1,
            dflt: 1
        }),
        dash: extendFlat({}, dash, {
            dflt: 'dot'
        })
    },
}), 'arraydraw', 'from-root');
