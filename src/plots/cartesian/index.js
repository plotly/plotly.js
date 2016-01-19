/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';


exports.name = 'cartesian';

exports.attr = ['xaxis', 'yaxis'];

exports.idRoot = ['x', 'y'];

exports.attributes = require('./attributes');

exports.idRegex = {
    x: /^x([2-9]|[1-9][0-9]+)?$/,
    y: /^y([2-9]|[1-9][0-9]+)?$/
};

exports.attrRegex = {
    x: /^xaxis([2-9]|[1-9][0-9]+)?$/,
    y: /^yaxis([2-9]|[1-9][0-9]+)?$/
};
