'use strict';

var Lib = require('../../lib');
var Template = require('../../plot_api/plot_template');

var handleTickValueDefaults = require('../../plots/cartesian/tick_value_defaults');
var handleTickMarkDefaults = require('../../plots/cartesian/tick_mark_defaults');
var handleTickLabelDefaults = require('../../plots/cartesian/tick_label_defaults');
var handlePrefixSuffixDefaults = require('../../plots/cartesian/prefix_suffix_defaults');

var attributes = require('./attributes');

module.exports = function colorbarDefaults(containerIn, containerOut, layout) {
    var colorbarOut = Template.newContainer(containerOut, 'colorbar');
    var colorbarIn = containerIn.colorbar || {};

    function coerce(attr, dflt) {
        return Lib.coerce(colorbarIn, colorbarOut, attributes, attr, dflt);
    }

    var margin = layout.margin || {t: 0, b: 0, l: 0, r: 0};
    var w = layout.width - margin.l - margin.r;
    var h = layout.height - margin.t - margin.b;

    var orientation = coerce('orientation');
    var isVertical = orientation === 'v';

    var thicknessmode = coerce('thicknessmode');
    coerce('thickness', (thicknessmode === 'fraction') ?
        30 / (isVertical ? w : h) :
        30
    );

    var lenmode = coerce('lenmode');
    coerce('len', (lenmode === 'fraction') ?
        1 :
        isVertical ? h : w
    );

    coerce('x', isVertical ? 1.02 : 0.5);
    coerce('xanchor', isVertical ? 'left' : 'center');
    coerce('xpad');
    coerce('y', isVertical ? 0.5 : 1.02);
    coerce('yanchor', isVertical ? 'middle' : 'bottom');
    coerce('ypad');
    Lib.noneOrAll(colorbarIn, colorbarOut, ['x', 'y']);

    coerce('outlinecolor');
    coerce('outlinewidth');
    coerce('bordercolor');
    coerce('borderwidth');
    coerce('bgcolor');

    var ticklabelposition = Lib.coerce(colorbarIn, colorbarOut, {
        ticklabelposition: {
            valType: 'enumerated',
            dflt: 'outside',
            values: isVertical ? [
                'outside', 'inside',
                'outside top', 'inside top',
                'outside bottom', 'inside bottom'
            ] : [
                'outside', 'inside',
                'outside left', 'inside left',
                'outside right', 'inside right'
            ]
        }
    }, 'ticklabelposition');

    coerce('ticklabeloverflow', ticklabelposition.indexOf('inside') !== -1 ? 'hide past domain' : 'hide past div');

    handleTickValueDefaults(colorbarIn, colorbarOut, coerce, 'linear');

    var font = layout.font;
    var opts = {outerTicks: false, font: font};
    if(ticklabelposition.indexOf('inside') !== -1) {
        opts.bgColor = 'black'; // could we instead use the average of colors in the scale?
    }
    handlePrefixSuffixDefaults(colorbarIn, colorbarOut, coerce, 'linear', opts);
    handleTickLabelDefaults(colorbarIn, colorbarOut, coerce, 'linear', opts);
    handleTickMarkDefaults(colorbarIn, colorbarOut, coerce, 'linear', opts);

    coerce('title.text', layout._dfltTitle.colorbar);

    var tickFont = colorbarOut.tickfont;
    var dfltTitleFont = Lib.extendFlat({}, tickFont, {
        color: font.color,
        size: Lib.bigFont(tickFont.size)
    });
    Lib.coerceFont(coerce, 'title.font', dfltTitleFont);
    coerce('title.side', isVertical ? 'top' : 'right');
};
