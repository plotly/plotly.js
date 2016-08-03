'use strict';

// var Lib = require('@src/lib');
var Lib = require('../../../../src/lib');

/*eslint no-unused-vars: 0*/


// so that Plotly.register knows what to do with it
exports.moduleType = 'transform';

// determines to link between transform type and transform module
exports.name = 'groupby';

// ... as trace attributes
exports.attributes = {
    active: {
        valType: 'boolean',
        dflt: true
    },
    groups: {
        valType: 'data_array',
        dflt: []
    },
    groupColors: {
        valType: 'any',
        dflt: {}
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
exports.supplyDefaults = function(transformIn, fullData, layout) {
    var transformOut = {};

    function coerce(attr, dflt) {
        return Lib.coerce(transformIn, transformOut, exports.attributes, attr, dflt);
    }

    var active = coerce('active');

    if(!active) return transformOut;

    coerce('groups');
    coerce('groupColors');

    // or some more complex logic using fullData and layout

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

    // one-to-many case

    var newData = [];

    data.forEach(function(trace) {
        newData = newData.concat(transformOne(trace, state));
    });

    return newData;
};

function transformOne(trace, state) {
    var opts = state.transform;
    var groups = opts.groups;

    var groupNames = groups.filter(function(g, i, self) {
        return self.indexOf(g) === i;
    });

    var newData = new Array(groupNames.length);
    var len = Math.min(trace.x.length, trace.y.length, groups.length);

    for(var i = 0; i < groupNames.length; i++) {
        var groupName = groupNames[i];

        // TODO is this the best pattern ???
        // maybe we could abstract this out
        var newTrace = newData[i] = Lib.extendDeep({}, trace);

        newTrace.x = [];
        newTrace.y = [];

        for(var j = 0; j < len; j++) {
            if(groups[j] !== groupName) continue;

            newTrace.x.push(trace.x[j]);
            newTrace.y.push(trace.y[j]);
        }

        newTrace.name = groupName;
        newTrace.marker.color = opts.groupColors[groupName];
    }

    return newData;
}
