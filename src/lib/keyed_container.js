/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var nestedProperty = require('./nested_property');

var SIMPLE_PROPERTY_REGEX = /^\w*$/;

// bitmask for deciding what's updated:
var NONE = 0;
var NAME = 1;
var VALUE = 2;
var BOTH = 3;

module.exports = function keyedContainer(baseObj, path, keyName, valueName) {
    keyName = keyName || 'name';
    valueName = valueName || 'value';
    var i, arr;
    var changeTypes = {};

    if(path && path.length) { arr = nestedProperty(baseObj, path).get();
    } else {
        arr = baseObj;
    }

    path = path || '';
    arr = arr || [];

    // Construct an index:
    var indexLookup = {};
    for(i = 0; i < arr.length; i++) {
        indexLookup[arr[i][keyName]] = i;
    }

    var isSimpleValueProp = SIMPLE_PROPERTY_REGEX.test(valueName);

    var obj = {
        // NB: this does not actually modify the baseObj
        set: function(name, value) {
            var changeType = NONE;
            var idx = indexLookup[name];
            if(idx === undefined) {
                changeType = BOTH;
                idx = arr.length;
                indexLookup[name] = idx;
            } else if(value !== (isSimpleValueProp ? arr[idx][valueName] : nestedProperty(arr[idx], valueName).get())) {
                changeType = VALUE;
            }
            var newValue = {};
            newValue[keyName] = name;

            if(isSimpleValueProp) {
                newValue[valueName] = value;
            } else {
                nestedProperty(newValue, valueName).set(value);
            }

            arr[idx] = newValue;

            changeTypes[idx] = changeTypes[idx] | changeType;

            return obj;
        },
        get: function(name) {
            var idx = indexLookup[name];

            if(idx === undefined) {
                return undefined;
            } else if(isSimpleValueProp) {
                return arr[idx][valueName];
            } else {
                return nestedProperty(arr[idx], valueName).get();
            }
        },
        rename: function(name, newName) {
            var idx = indexLookup[name];

            if(idx === undefined) return obj;
            changeTypes[idx] = changeTypes[idx] | NAME;

            indexLookup[newName] = idx;
            delete indexLookup[name];

            arr[idx][keyName] = newName;

            return obj;
        },
        remove: function(name) {
            var idx = indexLookup[name];
            if(idx === undefined) return obj;
            for(i = idx; i < arr.length; i++) {
                changeTypes[i] = changeTypes[i] | BOTH;
            }
            for(i = idx; i < arr.length; i++) {
                indexLookup[arr[i][keyName]]--;
            }
            arr.splice(idx, 1);
            delete(indexLookup[name]);

            return obj;
        },
        constructUpdate: function() {
            var astr, idx;
            var update = {};
            var changed = Object.keys(changeTypes);
            for(var i = 0; i < changed.length; i++) {
                idx = changed[i];
                astr = path + '[' + idx + ']';
                if(arr[idx]) {
                    if(changeTypes[idx] & NAME) {
                        update[astr + '.' + keyName] = arr[idx][keyName];
                    }
                    if(changeTypes[idx] & VALUE) {
                        if(isSimpleValueProp) {
                            update[astr + '.' + valueName] = arr[idx][valueName];
                        } else {
                            update[astr + '.' + valueName] = nestedProperty(arr[idx], valueName).get();
                        }
                    }
                } else {
                    update[astr] = null;
                }
            }

            return update;
        }
    };

    return obj;
};
