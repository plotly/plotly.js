'use strict';

// var Lib = require('@src/lib');
var Lib = require('../../../../src/lib');

/*eslint no-unused-vars: 0*/


// so that Plotly.register knows what to do with it
exports.moduleType = 'transform';

// determines to link between transform type and transform module
exports.name = 'filter';

// ... as trace attributes
exports.attributes = {
    operation: {
        valType: 'enumerated',
        values: ['=', '<', '>'],
        dflt: '='
    },
    value: {
        valType: 'number',
        dflt: 0
    },
    filtersrc: {
        valType: 'enumerated',
        values: ['x', 'y'],
        dflt: 'x'
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

    coerce('operation');
    coerce('value');
    coerce('filtersrc');

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

    // one-to-one case

    var newData = data.map(function(trace) {
        return transformOne(trace, state);
    });

    return newData;
};

function transformOne(trace, state) {
    var newTrace = Lib.extendDeep({}, trace);

    var opts = state.transform;
    var src = opts.filtersrc;
    var filterFunc = getFilterFunc(opts);
    var len = trace[src].length;
    var arrayAttrs = findArrayAttributes(trace);

    arrayAttrs.forEach(function(attr) {
        Lib.nestedProperty(newTrace, attr).set([]);
    });

    function fill(attr, i) {
        var arr = Lib.nestedProperty(trace, attr).get();
        var newArr = Lib.nestedProperty(newTrace, attr).get();

        newArr.push(arr[i]);
    }

    for(var i = 0; i < len; i++) {
        var v = trace[src][i];

        if(!filterFunc(v)) continue;

        for(var j = 0; j < arrayAttrs.length; j++) {
            fill(arrayAttrs[j], i);
        }
    }

    return newTrace;
}

function getFilterFunc(opts) {
    var value = opts.value;

    switch(opts.operation) {
        case '=':
            return function(v) { return v === value; };
        case '<':
            return function(v) { return v < value; };
        case '>':
            return function(v) { return v > value; };
    }
}

function findArrayAttributes(obj, root) {
    root = root || '';

    var list = [];

    Object.keys(obj).forEach(function(k) {
        var val = obj[k];

        if(k.charAt(0) === '_') return;

        if(k === 'transforms') {
            val.forEach(function(item, i) {
                list = list.concat(
                    findArrayAttributes(item, root + k + '[' + i + ']' + '.')
                );
            });
        }
        else if(Lib.isPlainObject(val)) {
            list = list.concat(findArrayAttributes(val, root + k + '.'));
        }
        else if(Array.isArray(val)) {
            list.push(root + k);
        }
    });

    return list;
}
