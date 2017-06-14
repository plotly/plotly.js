/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var extendFlat = require('../lib/extend').extendFlat;

var symbolsWithOpenSupport = {
    'circle': {
        unicode: '●'
    },
    'square': {
        unicode: '■'
    },
    'diamond': {
        unicode: '◆'
    },
    'cross': {
        unicode: '✚'
    },
    'x': {
        unicode: '❌'
    },
    'triangle-up': {
        unicode: '▲'
    },
    'triangle-down': {
        unicode: '▼'
    },
    'triangle-left': {
        unicode: '◄'
    },
    'triangle-right': {
        unicode: '►'
    },
    'triangle-ne': {
        unicode: '◥'
    },
    'triangle-nw': {
        unicode: '◤'
    },
    'triangle-se': {
        unicode: '◢'
    },
    'triangle-sw': {
        unicode: '◣'
    },
    'pentagon': {
        unicode: '⬟'
    },
    'hexagon': {
        unicode: '⬢'
    },
    'hexagon2': {
        unicode: '⬣'
    },
    'star': {
        unicode: '★'
    },
    'diamond-tall': {
        unicode: '♦'
    },
    'bowtie': {
        unicode: '⧓'
    },
    'diamond-x': {
        unicode: '❖'
    },
    'cross-thin': {
        unicode: '+',
        noBorder: true
    },
    'asterisk': {
        unicode: '✳',
        noBorder: true
    },
    'y-up': {
        unicode: '⅄',
        noBorder: true
    },
    'y-down': {
        unicode: 'Y',
        noBorder: true
    },
    'line-ew': {
        unicode: '─',
        noBorder: true
    },
    'line-ns': {
        unicode: '│',
        noBorder: true
    }
};

var openSymbols = {};
var keys = Object.keys(symbolsWithOpenSupport);

for(var i = 0; i < keys.length; i++) {
    var k = keys[i];
    openSymbols[k + '-open'] = extendFlat({}, symbolsWithOpenSupport[k]);
}

var otherSymbols = {
    'circle-cross-open': {
        unicode: '⨁',
        noFill: true
    },
    'circle-x-open': {
        unicode: '⨂',
        noFill: true
    },
    'square-cross-open': {
        unicode: '⊞',
        noFill: true
    },
    'square-x-open': {
        unicode: '⊠',
        noFill: true
    }
};

module.exports = extendFlat({},
    symbolsWithOpenSupport,
    openSymbols,
    otherSymbols
);
