'use strict';

var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');


module.exports = function handlePositionDefaults(containerIn, containerOut, coerce, options) {
    var counterAxes = options.counterAxes || [];
    var overlayableAxes = options.overlayableAxes || [];
    var letter = options.letter;
    var grid = options.grid;
    var shift = options.shift;

    var dfltAnchor, dfltDomain, dfltSide, dfltPosition, dfltShift;

    if(grid) {
        dfltDomain = grid._domains[letter][grid._axisMap[containerOut._id]];
        dfltAnchor = grid._anchors[containerOut._id];
        if(dfltDomain) {
            dfltSide = grid[letter + 'side'].split(' ')[0];
            dfltPosition = grid.domain[letter][dfltSide === 'right' || dfltSide === 'top' ? 1 : 0];
        }
    }

    // Even if there's a grid, this axis may not be in it - fall back on non-grid defaults
    dfltDomain = dfltDomain || [0, 1];
    dfltAnchor = dfltAnchor || (isNumeric(containerIn.position) ? 'free' : (counterAxes[0] || 'free'));
    dfltSide = dfltSide || (letter === 'x' ? 'bottom' : 'left');
    dfltPosition = dfltPosition || 0;
    dfltShift = dfltShift || false;

    var anchor = Lib.coerce(containerIn, containerOut, {
        anchor: {
            valType: 'enumerated',
            values: ['free'].concat(counterAxes),
            dflt: dfltAnchor
        }
    }, 'anchor');

    // HANNAH - What does this syntax mean?
    var side = Lib.coerce(containerIn, containerOut, {
        side: {
            valType: 'enumerated',
            values: letter === 'x' ? ['bottom', 'top'] : ['left', 'right'],
            dflt: dfltSide
        }
    }, 'side');

    if(anchor === 'free') {
        if(shift === true) {
            if(containerIn.automargin) {
                coerce('automargin');
            } else {
                coerce('automargin', true);
            }
            if(side === 'left') {
                // TODO: Should really be the left edge of the domain of overlaying axis' anchor
                coerce('position', 0);
            } else if(side === 'right') {
                // TODO: Should really be the left edge of the domain of overlaying axis' anchor
                coerce('position', 1);
            }
        } else {
            if(containerIn.automargin) coerce('automargin');
            coerce('position', dfltPosition);
            coerce('shift', dfltShift);
            // Moved this over from axis_defaults since we want
            // the shift val to have an impact on the default automargin
        }
    } else {
        if(containerIn.automargin) coerce('automargin');
    }

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
        var domain = coerce('domain', dfltDomain);

        // according to https://www.npmjs.com/package/canvas-size
        // the minimum value of max canvas width across browsers and devices is 4096
        // which applied in the calculation below:
        if(domain[0] > domain[1] - 1 / 4096) containerOut.domain = dfltDomain;
        Lib.noneOrAll(containerIn.domain, containerOut.domain, dfltDomain);
    }

    coerce('layer');

    return containerOut;
};
