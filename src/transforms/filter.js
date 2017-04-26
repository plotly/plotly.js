/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../lib');
var Registry = require('../registry');
var PlotSchema = require('../plot_api/plot_schema');
var axisIds = require('../plots/cartesian/axis_ids');
var autoType = require('../plots/cartesian/axis_autotype');
var setConvert = require('../plots/cartesian/set_convert');

var COMPARISON_OPS = ['=', '!=', '<', '>=', '>', '<='];
var INTERVAL_OPS = ['[]', '()', '[)', '(]', '][', ')(', '](', ')['];
var SET_OPS = ['{}', '}{'];

exports.moduleType = 'transform';

exports.name = 'filter';

exports.attributes = {
  enabled: {
    valType: 'boolean',
    dflt: true,
    description: [
      'Determines whether this filter transform is enabled or disabled.',
    ].join(' '),
  },
  target: {
    valType: 'string',
    strict: true,
    noBlank: true,
    arrayOk: true,
    dflt: 'x',
    description: [
      'Sets the filter target by which the filter is applied.',

      'If a string, *target* is assumed to be a reference to a data array',
      'in the parent trace object.',
      'To filter about nested variables, use *.* to access them.',
      'For example, set `target` to *marker.color* to filter',
      'about the marker color array.',

      'If an array, *target* is then the data array by which the filter is applied.',
    ].join(' '),
  },
  operation: {
    valType: 'enumerated',
    values: [].concat(COMPARISON_OPS).concat(INTERVAL_OPS).concat(SET_OPS),
    dflt: '=',
    description: [
      'Sets the filter operation.',

      '*=* keeps items equal to `value`',
      '*!=* keeps items not equal to `value`',

      '*<* keeps items less than `value`',
      '*<=* keeps items less than or equal to `value`',

      '*>* keeps items greater than `value`',
      '*>=* keeps items greater than or equal to `value`',

      '*[]* keeps items inside `value[0]` to value[1]` including both bounds`',
      '*()* keeps items inside `value[0]` to value[1]` excluding both bounds`',
      '*[)* keeps items inside `value[0]` to value[1]` including `value[0]` but excluding `value[1]',
      '*(]* keeps items inside `value[0]` to value[1]` excluding `value[0]` but including `value[1]',

      '*][* keeps items outside `value[0]` to value[1]` and equal to both bounds`',
      '*)(* keeps items outside `value[0]` to value[1]`',
      '*](* keeps items outside `value[0]` to value[1]` and equal to `value[0]`',
      '*)[* keeps items outside `value[0]` to value[1]` and equal to `value[1]`',

      '*{}* keeps items present in a set of values',
      '*}{* keeps items not present in a set of values',
    ].join(' '),
  },
  value: {
    valType: 'any',
    dflt: 0,
    description: [
      'Sets the value or values by which to filter by.',

      'Values are expected to be in the same type as the data linked',
      'to *target*.',

      'When `operation` is set to one of',
      'the comparison values (' + COMPARISON_OPS + ')',
      '*value* is expected to be a number or a string.',

      'When `operation` is set to one of the interval values',
      '(' + INTERVAL_OPS + ')',
      '*value* is expected to be 2-item array where the first item',
      'is the lower bound and the second item is the upper bound.',

      'When `operation`, is set to one of the set values',
      '(' + SET_OPS + ')',
      '*value* is expected to be an array with as many items as',
      'the desired set elements.',
    ].join(' '),
  },
  preservegaps: {
    valType: 'boolean',
    dflt: false,
    description: [
      'Determines whether or not gaps in data arrays produced by the filter operation',
      'are preserved.',
      'Setting this to *true* might be useful when plotting a line chart',
      'with `connectgaps` set to *false*.',
    ].join(' '),
  },
};

exports.supplyDefaults = function(transformIn) {
  var transformOut = {};

  function coerce(attr, dflt) {
    return Lib.coerce(
      transformIn,
      transformOut,
      exports.attributes,
      attr,
      dflt
    );
  }

  var enabled = coerce('enabled');

  if (enabled) {
    coerce('preservegaps');
    coerce('operation');
    coerce('value');
    coerce('target');

    var handleCalendarDefaults = Registry.getComponentMethod(
      'calendars',
      'handleDefaults'
    );
    handleCalendarDefaults(transformIn, transformOut, 'valuecalendar', null);
    handleCalendarDefaults(transformIn, transformOut, 'targetcalendar', null);
  }

  return transformOut;
};

exports.calcTransform = function(gd, trace, opts) {
  if (!opts.enabled) return;

  var target = opts.target,
    filterArray = getFilterArray(trace, target),
    len = filterArray.length;

  if (!len) return;

  var targetCalendar = opts.targetcalendar;

  // even if you provide targetcalendar, if target is a string and there
  // is a calendar attribute matching target it will get used instead.
  if (typeof target === 'string') {
    var attrTargetCalendar = Lib.nestedProperty(
      trace,
      target + 'calendar'
    ).get();
    if (attrTargetCalendar) targetCalendar = attrTargetCalendar;
  }

  // if target points to an axis, use the type we already have for that
  // axis to find the data type. Otherwise use the values to autotype.
  var d2cTarget = target === 'x' || target === 'y' || target === 'z'
    ? target
    : filterArray;

  var dataToCoord = getDataToCoordFunc(gd, trace, d2cTarget);
  var filterFunc = getFilterFunc(opts, dataToCoord, targetCalendar);
  var arrayAttrs = PlotSchema.findArrayAttributes(trace);
  var originalArrays = {};

  function forAllAttrs(fn, index) {
    for (var j = 0; j < arrayAttrs.length; j++) {
      var np = Lib.nestedProperty(trace, arrayAttrs[j]);
      fn(np, index);
    }
  }

  var initFn;
  var fillFn;
  if (opts.preservegaps) {
    initFn = function(np) {
      originalArrays[np.astr] = Lib.extendDeep([], np.get());
      np.set(new Array(len));
    };
    fillFn = function(np, index) {
      var val = originalArrays[np.astr][index];
      np.get()[index] = val;
    };
  } else {
    initFn = function(np) {
      originalArrays[np.astr] = Lib.extendDeep([], np.get());
      np.set([]);
    };
    fillFn = function(np, index) {
      var val = originalArrays[np.astr][index];
      np.get().push(val);
    };
  }

  // copy all original array attribute values, and clear arrays in trace
  forAllAttrs(initFn);

  // loop through filter array, fill trace arrays if passed
  for (var i = 0; i < len; i++) {
    var passed = filterFunc(filterArray[i]);
    if (passed) forAllAttrs(fillFn, i);
  }
};

function getFilterArray(trace, target) {
  if (typeof target === 'string' && target) {
    var array = Lib.nestedProperty(trace, target).get();

    return Array.isArray(array) ? array : [];
  } else if (Array.isArray(target)) return target.slice();

  return false;
}

function getDataToCoordFunc(gd, trace, target) {
  var ax;

  // In the case of an array target, make a mock data array
  // and call supplyDefaults to the data type and
  // setup the data-to-calc method.
  if (Array.isArray(target)) {
    ax = {
      type: autoType(target),
      _categories: [],
    };

    setConvert(ax);

    if (ax.type === 'category') {
      // build up ax._categories (usually done during ax.makeCalcdata()
      for (var i = 0; i < target.length; i++) {
        ax.d2c(target[i]);
      }
    }
  } else {
    ax = axisIds.getFromTrace(gd, trace, target);
  }

  // if 'target' has corresponding axis
  // -> use setConvert method
  if (ax) return ax.d2c;

  // special case for 'ids'
  // -> cast to String
  if (target === 'ids')
    return function(v) {
      return String(v);
    };

  // otherwise (e.g. numeric-array of 'marker.color' or 'marker.size')
  // -> cast to Number
  return function(v) {
    return +v;
  };
}

function getFilterFunc(opts, d2c, targetCalendar) {
  var operation = opts.operation,
    value = opts.value,
    hasArrayValue = Array.isArray(value);

  function isOperationIn(array) {
    return array.indexOf(operation) !== -1;
  }

  var d2cValue = function(v) {
    return d2c(v, 0, opts.valuecalendar);
  },
    d2cTarget = function(v) {
      return d2c(v, 0, targetCalendar);
    };

  var coercedValue;

  if (isOperationIn(COMPARISON_OPS)) {
    coercedValue = hasArrayValue ? d2cValue(value[0]) : d2cValue(value);
  } else if (isOperationIn(INTERVAL_OPS)) {
    coercedValue = hasArrayValue
      ? [d2cValue(value[0]), d2cValue(value[1])]
      : [d2cValue(value), d2cValue(value)];
  } else if (isOperationIn(SET_OPS)) {
    coercedValue = hasArrayValue ? value.map(d2cValue) : [d2cValue(value)];
  }

  switch (operation) {
    case '=':
      return function(v) {
        return d2cTarget(v) === coercedValue;
      };

    case '!=':
      return function(v) {
        return d2cTarget(v) !== coercedValue;
      };

    case '<':
      return function(v) {
        return d2cTarget(v) < coercedValue;
      };

    case '<=':
      return function(v) {
        return d2cTarget(v) <= coercedValue;
      };

    case '>':
      return function(v) {
        return d2cTarget(v) > coercedValue;
      };

    case '>=':
      return function(v) {
        return d2cTarget(v) >= coercedValue;
      };

    case '[]':
      return function(v) {
        var cv = d2cTarget(v);
        return cv >= coercedValue[0] && cv <= coercedValue[1];
      };

    case '()':
      return function(v) {
        var cv = d2cTarget(v);
        return cv > coercedValue[0] && cv < coercedValue[1];
      };

    case '[)':
      return function(v) {
        var cv = d2cTarget(v);
        return cv >= coercedValue[0] && cv < coercedValue[1];
      };

    case '(]':
      return function(v) {
        var cv = d2cTarget(v);
        return cv > coercedValue[0] && cv <= coercedValue[1];
      };

    case '][':
      return function(v) {
        var cv = d2cTarget(v);
        return cv <= coercedValue[0] || cv >= coercedValue[1];
      };

    case ')(':
      return function(v) {
        var cv = d2cTarget(v);
        return cv < coercedValue[0] || cv > coercedValue[1];
      };

    case '](':
      return function(v) {
        var cv = d2cTarget(v);
        return cv <= coercedValue[0] || cv > coercedValue[1];
      };

    case ')[':
      return function(v) {
        var cv = d2cTarget(v);
        return cv < coercedValue[0] || cv >= coercedValue[1];
      };

    case '{}':
      return function(v) {
        return coercedValue.indexOf(d2cTarget(v)) !== -1;
      };

    case '}{':
      return function(v) {
        return coercedValue.indexOf(d2cTarget(v)) === -1;
      };
  }
}
