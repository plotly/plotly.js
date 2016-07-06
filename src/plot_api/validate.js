/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';


var Lib = require('../lib');
var Plots = require('../plots/plots');
var PlotSchema = require('./plot_schema');

var isPlainObject = Lib.isPlainObject;

// validation error codes
var code2msgFunc = {
    invisible: function(path) {
        return 'trace ' + path + ' got defaulted to be not visible';
    },
    schema: function(path) {
        return 'key ' + path.join('.') + ' is not part of the schema';
    },
    container: function(path) {
        return 'key ' + path.join('.') + ' is supposed to be linked to a container';
    },
    unused: function(path, valIn) {
        var prefix = isPlainObject(valIn) ? 'container' : 'key';

        return prefix + ' ' + path.join('.') + ' did not get coerced';
    },
    value: function(path, valIn) {
        return 'key ' + path.join('.') + ' is set to an invalid value (' + valIn + ')';
    }
};

module.exports = function valiate(data, layout) {
    if(!Array.isArray(data)) {
        throw new Error('data must be an array');
    }

    if(!isPlainObject(layout)) {
        throw new Error('layout must be an object');
    }

    var gd = {
        data: Lib.extendDeep([], data),
        layout: Lib.extendDeep({}, layout)
    };
    Plots.supplyDefaults(gd);

    var schema = PlotSchema.get();

    var dataOut = gd._fullData,
        len = data.length,
        dataList = new Array(len);

    for(var i = 0; i < len; i++) {
        var traceIn = data[i];
        var traceList = dataList[i] = [];

        if(!isPlainObject(traceIn)) {
            throw new Error('each data trace must be an object');
        }

        var traceOut = dataOut[i],
            traceType = traceOut.type,
            traceSchema = schema.traces[traceType].attributes;

        // PlotSchema does something fancy with trace 'type', reset it here
        // to make the trace schema compatible with Lib.validate.
        traceSchema.type = {
            valType: 'enumerated',
            values: [traceType]
        };

        if(traceOut.visible === false && traceIn.visible !== false) {
            traceList.push(format('invisible', i));
        }

        crawl(traceIn, traceOut, traceSchema, traceList);
    }

    var layoutOut = gd._fullLayout,
        layoutSchema = fillLayoutSchema(schema, dataOut),
        layoutList = [];

    crawl(layout, layoutOut, layoutSchema, layoutList);

    return {
        data: dataList,
        layout: layoutList
    };
};

function crawl(objIn, objOut, schema, list, path) {
    path = path || [];

    var keys = Object.keys(objIn);

    for(var i = 0; i < keys.length; i++) {
        var k = keys[i];

        var p = path.slice();
        p.push(k);

        var valIn = objIn[k],
            valOut = objOut[k];

        var nestedSchema = getNestedSchema(schema, k);

        if(!isInSchema(schema, k)) {
            list.push(format('schema', p));
        }
        else if(isPlainObject(valIn) && isPlainObject(valOut)) {
            crawl(valIn, valOut, nestedSchema, list, p);
        }
        else if(!isPlainObject(valIn) && isPlainObject(valOut)) {
            list.push(format('container', p, valIn));
        }
        else if(nestedSchema.items && Array.isArray(valIn)) {
            var itemName = k.substr(0, k.length - 1);

            for(var j = 0; j < valIn.length; j++) {
                p[p.length - 1] = k + '[' + j + ']';

                crawl(valIn[j], valOut[j], nestedSchema.items[itemName], list, p);
            }
        }
        else if(!(k in objOut)) {
            list.push(format('unused', p, valIn));
        }
        else if(!Lib.validate(valIn, nestedSchema)) {
            list.push(format('value', p, valIn));
        }
    }

    return list;
}

// the 'full' layout schema depends on the traces types presents
function fillLayoutSchema(schema, dataOut) {
    for(var i = 0; i < dataOut.length; i++) {
        var traceType = dataOut[i].type,
            traceLayoutAttr = schema.traces[traceType].layoutAttributes;

        if(traceLayoutAttr) {
            Lib.extendFlat(schema.layout.layoutAttributes, traceLayoutAttr);
        }
    }

    return schema.layout.layoutAttributes;
}

function format(code, path, valIn) {
    return {
        code: code,
        path: path,
        msg: code2msgFunc[code](path, valIn)
    };
}

function isInSchema(schema, key) {
    var parts = splitKey(key),
        keyMinusId = parts.keyMinusId,
        id = parts.id;

    if((keyMinusId in schema) && schema[keyMinusId]._isSubplotObj && id) {
        return true;
    }

    return (key in schema);
}

function getNestedSchema(schema, key) {
    var parts = splitKey(key);

    return schema[parts.keyMinusId];
}

function splitKey(key) {
    var idRegex = /([2-9]|[1-9][0-9]+)$/;

    var keyMinusId = key.split(idRegex)[0],
        id = key.substr(keyMinusId.length, key.length);

    return {
        keyMinusId: keyMinusId,
        id: id
    };
}
