/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../lib');
var Axes = require('../plots/cartesian/axes');

exports.moduleType = 'transform';

exports.name = 'sort';

exports.attributes = {
    enabled: {
        valType: 'boolean',
        dflt: true,
        role: 'info',
        editType: 'calc',
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
        role: 'info',
        editType: 'calc',
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
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the sort transform order.'
        ].join(' ')
    },
    editType: 'calc'
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

    var targetArray = Lib.getTargetArray(trace, opts);
    if(!targetArray) return;

    var target = opts.target;
    var len = targetArray.length;
    var arrayAttrs = trace._arrayAttrs;
    var d2c = Axes.getDataToCoordFunc(gd, trace, target, targetArray);
    var indices = getIndices(opts, targetArray, d2c);

    for(var i = 0; i < arrayAttrs.length; i++) {
        var np = Lib.nestedProperty(trace, arrayAttrs[i]);
        var arrayOld = np.get();
        var arrayNew = new Array(len);

        for(var j = 0; j < len; j++) {
            arrayNew[j] = arrayOld[indices[j]];
        }

        np.set(arrayNew);
    }
};

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
