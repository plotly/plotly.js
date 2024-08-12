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
    var variantValues = opts.variantValues;
    var editType = opts.editType;
    var colorEditType = opts.colorEditType;
    if(colorEditType === undefined) colorEditType = editType;

    var weight = {
        editType: editType,
        valType: 'integer',
        min: 1,
        max: 1000,
        extras: ['normal', 'bold'],
        dflt: 'normal',
        description: [
            'Sets the weight (or boldness) of the font.'
        ].join(' ')
    };

    if(opts.noNumericWeightValues) {
        weight.valType = 'enumerated';
        weight.values = weight.extras;
        weight.extras = undefined;
        weight.min = undefined;
        weight.max = undefined;
    }

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
                'These include *Arial*, *Balto*, *Courier New*, *Droid Sans*, *Droid Serif*,',
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

        weight: weight,

        style: {
            editType: editType,
            valType: 'enumerated',
            values: ['normal', 'italic'],
            dflt: 'normal',
            description: [
                'Sets whether a font should be styled with a normal or italic face from its family.'
            ].join(' ')
        },

        variant: opts.noFontVariant ? undefined : {
            editType: editType,
            valType: 'enumerated',
            values: variantValues || [
                'normal',
                'small-caps',
                'all-small-caps',
                'all-petite-caps',
                'petite-caps',
                'unicase'
            ],
            dflt: 'normal',
            description: [
                'Sets the variant of the font.'
            ].join(' ')
        },

        textcase: opts.noFontTextcase ? undefined : {
            editType: editType,
            valType: 'enumerated',
            values: ['normal', 'word caps', 'upper', 'lower'],
            dflt: 'normal',
            description: [
                'Sets capitalization of text.',
                'It can be used to make text appear in all-uppercase or all-lowercase,',
                'or with each word capitalized.'
            ].join(' ')
        },

        lineposition: opts.noFontLineposition ? undefined : {
            editType: editType,
            valType: 'flaglist',
            flags: ['under', 'over', 'through'],
            extras: ['none'],
            dflt: 'none',
            description: [
                'Sets the kind of decoration line(s) with text,',
                'such as an *under*, *over* or *through*',
                'as well as combinations e.g. *under+over*, etc.'
            ].join(' ')
        },

        shadow: opts.noFontShadow ? undefined : {
            editType: editType,
            valType: 'string',
            dflt: opts.autoShadowDflt ? 'auto' : 'none',
            description: [
                'Sets the shape and color of the shadow behind text.',
                '*auto* places minimal shadow and applies contrast text font color.',
                'See https://developer.mozilla.org/en-US/docs/Web/CSS/text-shadow for additional options.'
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
        attrs.weight.arrayOk = true;
        attrs.style.arrayOk = true;
        if(!opts.noFontVariant) {
            attrs.variant.arrayOk = true;
        }
        if(!opts.noFontTextcase) {
            attrs.textcase.arrayOk = true;
        }
        if(!opts.noFontLineposition) {
            attrs.lineposition.arrayOk = true;
        }
        if(!opts.noFontShadow) {
            attrs.shadow.arrayOk = true;
        }
        attrs.size.arrayOk = true;
        attrs.color.arrayOk = true;
    }

    return attrs;
};
