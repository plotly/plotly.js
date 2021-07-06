'use strict';

module.exports = {
    hiddenlabels: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'hiddenlabels is the funnelarea & pie chart analog of',
            'visible:\'legendonly\'',
            'but it can contain many labels, and can simultaneously',
            'hide slices from several pies/funnelarea charts'
        ].join(' ')
    },
    piecolorway: {
        valType: 'colorlist',
        editType: 'calc',
        description: [
            'Sets the default pie slice colors. Defaults to the main',
            '`colorway` used for trace colors. If you specify a new',
            'list here it can still be extended with lighter and darker',
            'colors, see `extendpiecolors`.'
        ].join(' ')
    },
    extendpiecolors: {
        valType: 'boolean',
        dflt: true,
        editType: 'calc',
        description: [
            'If `true`, the pie slice colors (whether given by `piecolorway` or',
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
