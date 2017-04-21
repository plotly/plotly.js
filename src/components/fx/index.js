/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');
var Lib = require('../../lib');
var dragElement = require('../dragelement');
var helpers = require('./helpers');
var layoutAttributes = require('./layout_attributes');

module.exports = {
    moduleType: 'component',
    name: 'fx',

    constants: require('./constants'),
    schema: {
        layout: layoutAttributes
    },

    attributes: require('./attributes'),
    layoutAttributes: layoutAttributes,
    supplyDefaults: require('./defaults'),
    supplyLayoutDefaults: require('./layout_defaults'),

    calc: require('./calc'),

    getDistanceFunction: helpers.getDistanceFunction,
    getClosest: helpers.getClosest,
    inbox: helpers.inbox,

    hover: require('./hover').hover,
    unhover: dragElement.unhover,

    loneHover: require('./hover').loneHover,
    loneUnhover: loneUnhover,

    click: require('./click')
};

function loneUnhover(containerOrSelection) {
    // duck type whether the arg is a d3 selection because ie9 doesn't
    // handle instanceof like modern browsers do.
    var selection = Lib.isD3Selection(containerOrSelection) ?
            containerOrSelection :
            d3.select(containerOrSelection);

    selection.selectAll('g.hovertext').remove();
    selection.selectAll('.spikeline').remove();
}
