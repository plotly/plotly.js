'use strict';

/*
 * make a font attribute group
 *
 * @param {object} opts
 *   @param {string}
 *     opts.description: where & how this font is used
 *   @param {optional bool} arrayOk:
 *     should each part (family, size, color) be arrayOk? default false.
 *   @param {string} editType:
 *     the editType for all pieces of this font
 *   @param {optional string} colorEditType:
 *     a separate editType just for color
 *
 * @return {object} attributes object containing {family, size, color} as specified
 */
module.exports = function(opts) {
    var editType = opts.editType;
    var colorEditType = opts.colorEditType;
    if(colorEditType === undefined) colorEditType = editType;
    var attrs = {
        family: {
            valType: 'string',
            noBlank: true,
            strict: true,
            editType: editType,
            description: [
                'HTML font family - the typeface that will be applied by the web browser.',
                'The web browser will only be able to apply a font if it is available on the system',
                'which it operates. Provide multiple font families, separated by commas, to indicate',
                'the preference in which to apply fonts if they aren\'t available on the system.',
                'The Chart Studio Cloud (at https://chart-studio.plotly.com or on-premise) generates images on a server,',
                'where only a select number of',
                'fonts are installed and supported.',
                'These include *Arial*, *Balto*, *Courier New*, *Droid Sans*,, *Droid Serif*,',
                '*Droid Sans Mono*, *Gravitas One*, *Old Standard TT*, *Open Sans*, *Overpass*,',
                '*PT Sans Narrow*, *Raleway*, *Times New Roman*.'
            ].join(' ')
        },
        size: {
            valType: 'number',
            min: 1,
            editType: editType
        },
        color: {
            valType: 'color',
            editType: colorEditType
        },

        weight: {
            editType: editType,
            valType: 'integer',
            min: 1,
            max: 1000,
            extras: ['normal', 'bold'],
            dflt: 'normal',
            description: [
                'See https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight',
            ].join(' ')
        },

        style: {
            editType: editType,
            valType: 'enumerated',
            values: [
                'normal',
                'italic',
                'oblique -75',
                'oblique -60',
                'oblique -45',
                'oblique -30',
                'oblique -15',
                'oblique 15',
                'oblique 30',
                'oblique 45',
                'oblique 60',
                'oblique 75'
            ],
            dflt: 'normal',
            description: [
                'See https://developer.mozilla.org/en-US/docs/Web/CSS/font-style',
            ].join(' ')
        },

        stretch: {
            editType: editType,
            valType: 'enumerated',
            values: [
                'normal',
                'ultra-condensed',
                'extra-condensed',
                'condensed',
                'semi-condensed',
                'semi-expanded',
                'expanded',
                'extra-expanded',
                'ultra-expanded',
                '50%',
                '100%',
                '200%',
            ],
            dflt: 'normal',
            description: [
                'See https://developer.mozilla.org/en-US/docs/Web/CSS/font-stretch',
            ].join(' ')
        },

        variant: {
            editType: editType,
            valType: 'string',
            dflt: 'normal',
            description: [
                'See https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant',
            ].join(' ')
        },

        editType: editType,
        // blank strings so compress_attributes can remove
        // TODO - that's uber hacky... better solution?
        description: '' + (opts.description || '') + ''
    };

    if(opts.autoSize) attrs.size.dflt = 'auto';
    if(opts.autoColor) attrs.color.dflt = 'auto';

    if(opts.arrayOk) {
        attrs.family.arrayOk = true;
        attrs.size.arrayOk = true;
        attrs.color.arrayOk = true;
    }

    return attrs;
};
