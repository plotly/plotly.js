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
var axisIds = require('../plots/cartesian/axis_ids');
var autoType = require('../plots/cartesian/axis_autotype');
var setConvert = require('../plots/cartesian/set_convert');

exports.moduleType = 'transform';

exports.name = 'sort';

exports.attributes = {
    enabled: {
        valType: 'boolean',
        dflt: true,
        description: [
            'Determines whether this sort transform is enabled or disabled.'
        ].join(' ')
    },
    target: {
        valType: 'string',
        strict: true,
        noBlank: true,
        arrayOk: true,
        dflt: 'x',
        description: [
            'Sets the target by which the sort transform is applied.',

            'If a string, *target* is assumed to be a reference to a data array',
            'in the parent trace object.',
            'To sort about nested variables, use *.* to access them.',
            'For example, set `target` to *marker.size* to sort',
            'about the marker size array.',

            'If an array, *target* is then the data array by which',
            'the sort transform is applied.'
        ].join(' ')
    },
    order: {
        valType: 'enumerated',
        values: ['ascending', 'descending'],
        dflt: 'ascending',
        description: [
            'Sets the sort transform order.'
        ].join(' ')
    }
};

exports.supplyDefaults = function(transformIn) {
    var transformOut = {};

    function coerce(attr, dflt) {
        return Lib.coerce(transformIn, transformOut, exports.attributes, attr, dflt);
    }

    var enabled = coerce('enabled');

    if(enabled) {
        coerce('target');
        coerce('order');
    }

    return transformOut;
};

exports.calcTransform = function(gd, trace, opts) {
    if(!opts.enabled) return;

    var target = opts.target;
    var targetArray = getTargetArray(trace, target);
    var len = targetArray.length;

    if(!len) return;

    var arrayAttrs = PlotSchema.findArrayAttributes(trace);
    var d2c = getDataToCoordFunc(gd, trace, target, targetArray);
    var indices = getIndices(opts, targetArray, d2c);

    for(var i = 0; i < arrayAttrs.length; i++) {
        var np = Lib.nestedProperty(trace, arrayAttrs[i]);
        var arrayCopy = np.get().slice();
        var arrayNew = new Array(len);

        for(var j = 0; j < len; j++) {
            arrayNew[j] = arrayCopy[indices[j]];
        }

        np.set(arrayNew);
    }
};

// TODO reuse for filter.js
function getTargetArray(trace, target) {
    if(typeof target === 'string' && target) {
        var array = Lib.nestedProperty(trace, target).get();

        return Array.isArray(array) ? array : [];
    }
    else if(Array.isArray(target)) return target.slice();

    return false;
}

// TODO reuse for filter.js
function getDataToCoordFunc(gd, trace, target, targetArray) {
    var ax;

    // If target points to an axis, use the type we already have for that
    // axis to find the data type. Otherwise use the values to autotype.
    if(target === 'x' || target === 'y' || target === 'z') {
        ax = axisIds.getFromTrace(gd, trace, target);
    }
    // In the case of an array target, make a mock data array
    // and call supplyDefaults to the data type and
    // setup the data-to-calc method.
    else if(Array.isArray(target)) {
        ax = {
            type: autoType(targetArray),
            // TODO does this still work with the new hash object
            _categories: []
        };
        setConvert(ax);

        // build up ax._categories (usually done during ax.makeCalcdata()
        if(ax.type === 'category') {
            for(var i = 0; i < targetArray.length; i++) {
                ax.d2c(targetArray[i]);
            }
        }
    }

    // if 'target' has corresponding axis
    // -> use setConvert method
    if(ax) return ax.d2c;

    // special case for 'ids'
    // -> cast to String
    if(target === 'ids') return function(v) { return String(v); };

    // otherwise (e.g. numeric-array of 'marker.color' or 'marker.size')
    // -> cast to Number
    return function(v) { return +v; };
}

function getIndices(opts, targetArray, d2c) {
    var len = targetArray.length;
    var indices = new Array(len);

    var sortedArray = targetArray
        .slice()
        .sort(getSortFunc(opts, d2c));

    for(var i = 0; i < len; i++) {
        var vTarget = targetArray[i];

        for(var j = 0; j < len; j++) {
            var vSorted = sortedArray[j];

            if(vTarget === vSorted) {
                indices[j] = i;

                // clear sortedArray item to get correct
                // index of duplicate items (if any)
                sortedArray[j] = null;
                break;
            }
        }
    }

    return indices;
}

function getSortFunc(opts, d2c) {
    switch(opts.order) {
        case 'ascending':
            return function(a, b) { return d2c(a) - d2c(b); };
        case 'descending':
            return function(a, b) { return d2c(b) - d2c(a); };
    }
}
