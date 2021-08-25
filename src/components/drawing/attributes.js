'use strict';

exports.dash = {
    valType: 'string',
    // string type usually doesn't take values... this one should really be
    // a special type or at least a special coercion function, from the GUI
    // you only get these values but elsewhere the user can supply a list of
    // dash lengths in px, and it will be honored
    values: ['solid', 'dot', 'dash', 'longdash', 'dashdot', 'longdashdot'],
    dflt: 'solid',
    editType: 'style',
    description: [
        'Sets the dash style of lines. Set to a dash type string',
        '(*solid*, *dot*, *dash*, *longdash*, *dashdot*, or *longdashdot*)',
        'or a dash length list in px (eg *5px,10px,2px,2px*).'
    ].join(' ')
};

exports.pattern = {
    shape: {
        valType: 'enumerated',
        values: ['', '/', '\\', 'x', '-', '|', '+', '.'],
        dflt: '',
        arrayOk: true,
        editType: 'style',
        description: [
            'Sets the shape of the pattern fill.',
            'By default, no pattern is used for filling the area.',
        ].join(' ')
    },
    fillmode: {
        valType: 'enumerated',
        values: ['replace', 'overlay'],
        dflt: 'replace',
        editType: 'style',
        description: [
            'Determines whether `marker.color` should be used',
            'as a default to `bgcolor` or a `fgcolor`.'
        ].join(' ')
    },
    bgcolor: {
        valType: 'color',
        arrayOk: true,
        editType: 'style',
        description: [
            'When there is no colorscale sets the color of background pattern fill.',
            'Defaults to a `marker.color` background when `fillmode` is *overlay*.',
            'Otherwise, defaults to a transparent background.'
        ].join(' ')
    },
    fgcolor: {
        valType: 'color',
        arrayOk: true,
        editType: 'style',
        description: [
            'When there is no colorscale sets the color of foreground pattern fill.',
            'Defaults to a `marker.color` background when `fillmode` is *replace*.',
            'Otherwise, defaults to dark grey or white',
            'to increase contrast with the `bgcolor`.',
        ].join(' ')
    },
    fgopacity: {
        valType: 'number',
        editType: 'style',
        min: 0,
        max: 1,
        description: [
            'Sets the opacity of the foreground pattern fill.',
            'Defaults to a 0.5 when `fillmode` is *overlay*.',
            'Otherwise, defaults to 1.'
        ].join(' ')
    },
    size: {
        valType: 'number',
        min: 0,
        dflt: 8,
        arrayOk: true,
        editType: 'style',
        description: [
            'Sets the size of unit squares of the pattern fill in pixels,',
            'which corresponds to the interval of repetition of the pattern.',
        ].join(' ')
    },
    solidity: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 0.3,
        arrayOk: true,
        editType: 'style',
        description: [
            'Sets the solidity of the pattern fill.',
            'Solidity is roughly the fraction of the area filled by the pattern.',
            'Solidity of 0 shows only the background color without pattern',
            'and solidty of 1 shows only the foreground color without pattern.',
        ].join(' ')
    },
    editType: 'style',
    description: [
        'Sets the pattern within the marker.'
    ].join(' '),
};
