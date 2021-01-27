'use strict';

var Lib = require('../lib');
var Axes = require('../plots/cartesian/axes');
var pointsAccessorFunction = require('./helpers').pointsAccessorFunction;

var BADNUM = require('../constants/numerical').BADNUM;

exports.moduleType = 'transform';

exports.name = 'sort';

exports.attributes = {
    enabled: {
        valType: 'boolean',
        dflt: true,
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
    if(trace._length) len = Math.min(len, trace._length);

    var arrayAttrs = trace._arrayAttrs;
    var d2c = Axes.getDataToCoordFunc(gd, trace, target, targetArray);
    var indices = getIndices(opts, targetArray, d2c, len);
    var originalPointsAccessor = pointsAccessorFunction(trace.transforms, opts);
    var indexToPoints = {};
    var i, j;

    for(i = 0; i < arrayAttrs.length; i++) {
        var np = Lib.nestedProperty(trace, arrayAttrs[i]);
        var arrayOld = np.get();
        var arrayNew = new Array(len);

        for(j = 0; j < len; j++) {
            arrayNew[j] = arrayOld[indices[j]];
        }

        np.set(arrayNew);
    }

    for(j = 0; j < len; j++) {
        indexToPoints[j] = originalPointsAccessor(indices[j]);
    }

    opts._indexToPoints = indexToPoints;
    trace._length = len;
};

function getIndices(opts, targetArray, d2c, len) {
    var sortedArray = new Array(len);
    var indices = new Array(len);
    var i;

    for(i = 0; i < len; i++) {
        sortedArray[i] = {v: targetArray[i], i: i};
    }

    sortedArray.sort(getSortFunc(opts, d2c));

    for(i = 0; i < len; i++) {
        indices[i] = sortedArray[i].i;
    }

    return indices;
}

function getSortFunc(opts, d2c) {
    switch(opts.order) {
        case 'ascending':
            return function(a, b) {
                var ac = d2c(a.v);
                var bc = d2c(b.v);
                if(ac === BADNUM) {
                    return 1;
                }
                if(bc === BADNUM) {
                    return -1;
                }
                return ac - bc;
            };
        case 'descending':
            return function(a, b) {
                var ac = d2c(a.v);
                var bc = d2c(b.v);
                if(ac === BADNUM) {
                    return 1;
                }
                if(bc === BADNUM) {
                    return -1;
                }
                return bc - ac;
            };
    }
}
