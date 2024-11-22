'use strict';

module.exports = function makeFillcolorAttr(hasFillgradient) {
    return {
        valType: 'color',
        editType: 'style',
        anim: true,
        description: [
            'Sets the fill color.',
            'Defaults to a half-transparent variant of the line color,',
            'marker color, or marker line color, whichever is available.' + (
                hasFillgradient ?
                    ' If fillgradient is specified, fillcolor is ignored except for setting the background color of the hover label, if any.' :
                    ''
            )
        ].join(' ')
    };
};
