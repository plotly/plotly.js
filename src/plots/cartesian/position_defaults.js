/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');


module.exports = function handlePositionDefaults(containerIn, containerOut, coerce, options) {
    var counterAxes = options.counterAxes || [],
        overlayableAxes = options.overlayableAxes || [],
        letter = options.letter;

    var anchor = Lib.coerce(containerIn, containerOut, {
        anchor: {
            valType: 'enumerated',
            values: ['free'].concat(counterAxes),
            dflt: isNumeric(containerIn.position) ? 'free' :
                (counterAxes[0] || 'free')
        }
    }, 'anchor');

    if(anchor === 'free') coerce('position');

    Lib.coerce(containerIn, containerOut, {
        side: {
            valType: 'enumerated',
            values: letter === 'x' ? ['bottom', 'top'] : ['left', 'right'],
            dflt: letter === 'x' ? 'bottom' : 'left'
        }
    }, 'side');

    var overlaying = false;
    if(overlayableAxes.length) {
        overlaying = Lib.coerce(containerIn, containerOut, {
            overlaying: {
                valType: 'enumerated',
                values: [false].concat(overlayableAxes),
                dflt: false
            }
        }, 'overlaying');
    }

    if(!overlaying) {
        // TODO: right now I'm copying this domain over to overlaying axes
        // in ax.setscale()... but this means we still need (imperfect) logic
        // in the axes popover to hide domain for the overlaying axis.
        // perhaps I should make a private version _domain that all axes get???
        var domain = coerce('domain');
        if(domain[0] > domain[1] - 0.01) containerOut.domain = [0, 1];
        Lib.noneOrAll(containerIn.domain, containerOut.domain, [0, 1]);
    }

    return containerOut;
};
