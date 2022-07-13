'use strict';

var hiddenlabels = require('../pie/layout_attributes').hiddenlabels;

module.exports = {
    hiddenlabels: hiddenlabels,

    funnelareacolorway: {
        valType: 'colorlist',
        editType: 'calc',
        description: [
            'Sets the default funnelarea slice colors. Defaults to the main',
            '`colorway` used for trace colors. If you specify a new',
            'list here it can still be extended with lighter and darker',
            'colors, see `extendfunnelareacolors`.'
        ].join(' ')
    },
    extendfunnelareacolors: {
        valType: 'boolean',
        dflt: true,
        editType: 'calc',
        description: [
            'If `true`, the funnelarea slice colors (whether given by `funnelareacolorway` or',
            'inherited from `colorway`) will be extended to three times its',
            'original length by first repeating every color 20% lighter then',
            'each color 20% darker. This is intended to reduce the likelihood',
            'of reusing the same color when you have many slices, but you can',
            'set `false` to disable.',
            'Colors provided in the trace, using `marker.colors`, are never',
            'extended.'
        ].join(' ')
    }
};
