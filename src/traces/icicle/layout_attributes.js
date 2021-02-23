'use strict';

module.exports = {
    iciclecolorway: {
        valType: 'colorlist',
        editType: 'calc',
        description: [
            'Sets the default icicle slice colors. Defaults to the main',
            '`colorway` used for trace colors. If you specify a new',
            'list here it can still be extended with lighter and darker',
            'colors, see `extendiciclecolors`.'
        ].join(' ')
    },
    extendiciclecolors: {
        valType: 'boolean',
        dflt: true,
        editType: 'calc',
        description: [
            'If `true`, the icicle slice colors (whether given by `iciclecolorway` or',
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
