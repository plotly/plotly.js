/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../lib');
var PlotSchema = require('../plot_api/plot_schema');

exports.moduleType = 'transform';

exports.name = 'groupby';

exports.attributes = {
    enabled: {
        valType: 'boolean',
        dflt: true,
        description: [
            'Determines whether this group-by transform is enabled or disabled.'
        ].join(' ')
    },
    groups: {
        valType: 'data_array',
        dflt: [],
        description: [
            'Sets the groups in which the trace data will be split.',
            'For example, with `x` set to *[1, 2, 3, 4]* and',
            '`groups` set to *[\'a\', \'b\', \'a\', \'b\']*,',
            'the groupby transform with split in one trace',
            'with `x` [1, 3] and one trace with `x` [2, 4].'
        ].join(' ')
    },
    styles: {
        _isLinkedToArray: 'style',
        target: {
            valType: 'string',
            role: 'info',
            description: [
                'The group value which receives these styles.'
            ].join(' ')
        },
        value: {
            valType: 'any',
            role: 'info',
            dflt: {},
            description: [
                'Sets each group styles.',
                'For example, with `groups` set to *[\'a\', \'b\', \'a\', \'b\']*',
                'and `styles` set to *[{target: \'a\', value: { marker: { color: \'red\' } }}]',
                'marker points in group *\'a\'* will be drawn in red.'
            ].join(' ')
        },
    }
};

/**
 * Supply transform attributes defaults
 *
 * @param {object} transformIn
 *  object linked to trace.transforms[i] with 'type' set to exports.name
 * @param {object} fullData
 *  the plot's full data
 * @param {object} layout
 *  the plot's (not-so-full) layout
 *
 * @return {object} transformOut
 *  copy of transformIn that contains attribute defaults
 */
exports.supplyDefaults = function(transformIn) {
    var transformOut = {};

    function coerce(attr, dflt) {
        return Lib.coerce(transformIn, transformOut, exports.attributes, attr, dflt);
    }

    var enabled = coerce('enabled');

    if(!enabled) return transformOut;

    coerce('groups');

    var styleIn = transformIn.styles;
    var styleOut = transformOut.styles = [];

    if(styleIn) {
        for(var i = 0; i < styleIn.length; i++) {
            styleOut[i] = {};
            Lib.coerce(styleIn[i], styleOut[i], exports.attributes.styles, 'target');
            Lib.coerce(styleIn[i], styleOut[i], exports.attributes.styles, 'value');
        }
    }

    return transformOut;
};


/**
 * Apply transform !!!
 *
 * @param {array} data
 *  array of transformed traces (is [fullTrace] upon first transform)
 *
 * @param {object} state
 *  state object which includes:
 *      - transform {object} full transform attributes
 *      - fullTrace {object} full trace object which is being transformed
 *      - fullData {array} full pre-transform(s) data array
 *      - layout {object} the plot's (not-so-full) layout
 *
 * @return {object} newData
 *  array of transformed traces
 */
exports.transform = function(data, state) {
    var newData = [];

    for(var i = 0; i < data.length; i++) {
        newData = newData.concat(transformOne(data[i], state));
    }

    return newData;
};

function initializeArray(newTrace, a) {
    Lib.nestedProperty(newTrace, a).set([]);
}

function pasteArray(newTrace, trace, j, a) {
    Lib.nestedProperty(newTrace, a).set(
        Lib.nestedProperty(newTrace, a).get().concat([
            Lib.nestedProperty(trace, a).get()[j]
        ])
    );
}

function transformOne(trace, state) {
    var i;
    var opts = state.transform;
    var groups = trace.transforms[state.transformIndex].groups;

    if(!(Array.isArray(groups)) || groups.length === 0) {
        return trace;
    }

    var groupNames = Lib.filterUnique(groups),
        newData = new Array(groupNames.length),
        len = groups.length;

    var arrayAttrs = PlotSchema.findArrayAttributes(trace);

    var styles = opts.styles || [];
    var styleLookup = {};
    for(i = 0; i < styles.length; i++) {
        styleLookup[styles[i].target] = styles[i].value;
    }

    for(i = 0; i < groupNames.length; i++) {
        var groupName = groupNames[i];

        var newTrace = newData[i] = Lib.extendDeepNoArrays({}, trace);

        arrayAttrs.forEach(initializeArray.bind(null, newTrace));

        for(var j = 0; j < len; j++) {
            if(groups[j] !== groupName) continue;

            arrayAttrs.forEach(pasteArray.bind(0, newTrace, trace, j));
        }

        newTrace.name = groupName;

        // there's no need to coerce styleLookup[groupName] here
        // as another round of supplyDefaults is done on the transformed traces
        newTrace = Lib.extendDeepNoArrays(newTrace, styleLookup[groupName] || {});
    }

    return newData;
}
