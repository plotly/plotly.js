'use strict';

var Lib = require('../../lib');
var Template = require('../../plot_api/plot_template');

var handleTickValueDefaults = require('../../plots/cartesian/tick_value_defaults');
var handleTickMarkDefaults = require('../../plots/cartesian/tick_mark_defaults');
var handleTickLabelDefaults = require('../../plots/cartesian/tick_label_defaults');

var attributes = require('./attributes');

module.exports = function colorbarDefaults(containerIn, containerOut, layout) {
    var colorbarOut = Template.newContainer(containerOut, 'colorbar');
    var colorbarIn = containerIn.colorbar || {};

    function coerce(attr, dflt) {
        return Lib.coerce(colorbarIn, colorbarOut, attributes, attr, dflt);
    }

    var thicknessmode = coerce('thicknessmode');
    coerce('thickness', (thicknessmode === 'fraction') ?
        30 / (layout.width - layout.margin.l - layout.margin.r) :
        30
    );

    var lenmode = coerce('lenmode');
    coerce('len', (lenmode === 'fraction') ?
        1 :
        layout.height - layout.margin.t - layout.margin.b
    );

    coerce('x');
    coerce('xanchor');
    coerce('xpad');
    coerce('y');
    coerce('yanchor');
    coerce('ypad');
    Lib.noneOrAll(colorbarIn, colorbarOut, ['x', 'y']);

    coerce('outlinecolor');
    coerce('outlinewidth');
    coerce('bordercolor');
    coerce('borderwidth');
    coerce('bgcolor');

    var ticklabelposition = coerce('ticklabelposition');
    coerce('ticklabeloverflow', ticklabelposition.indexOf('inside') !== -1 ? 'hide past domain' : 'hide past div');

    handleTickValueDefaults(colorbarIn, colorbarOut, coerce, 'linear');

    var font = layout.font;
    var opts = {outerTicks: false, font: font};
    if(ticklabelposition.indexOf('inside') !== -1) {
        opts.bgColor = 'black'; // could we instead use the average of colors in the scale?
    }
    handleTickLabelDefaults(colorbarIn, colorbarOut, coerce, 'linear', opts);
    handleTickMarkDefaults(colorbarIn, colorbarOut, coerce, 'linear', opts);

    coerce('title.text', layout._dfltTitle.colorbar);

    var tickFont = colorbarOut.tickfont;
    var dfltTitleFont = Lib.extendFlat({}, tickFont, {
        color: font.color,
        size: Lib.bigFont(tickFont.size)
    });
    Lib.coerceFont(coerce, 'title.font', dfltTitleFont);
    coerce('title.side');
};
