'use strict';

var Lib = require('../../lib');
var Color = require('../../components/color');
var Template = require('../../plot_api/plot_template');

var handleSubplotDefaults = require('../subplot_defaults');
var getSubplotData = require('../get_data').getSubplotData;

var handleTickValueDefaults = require('../cartesian/tick_value_defaults');
var handleTickMarkDefaults = require('../cartesian/tick_mark_defaults');
var handleTickLabelDefaults = require('../cartesian/tick_label_defaults');
var handlePrefixSuffixDefaults = require('../cartesian/prefix_suffix_defaults');
var handleCategoryOrderDefaults = require('../cartesian/category_order_defaults');
var handleLineGridDefaults = require('../cartesian/line_grid_defaults');
var handleAutorangeOptionsDefaults = require('../cartesian/autorange_options_defaults');
var autoType = require('../cartesian/axis_autotype');

var layoutAttributes = require('./layout_attributes');
var setConvert = require('./set_convert');
var constants = require('./constants');
var axisNames = constants.axisNames;

function handleDefaults(contIn, contOut, coerce, opts) {
    var bgColor = coerce('bgcolor');
    opts.bgColor = Color.combine(bgColor, opts.paper_bgcolor);

    var sector = coerce('sector');
    coerce('hole');

    // could optimize, subplotData is not always needed!
    var subplotData = getSubplotData(opts.fullData, constants.name, opts.id);
    var layoutOut = opts.layoutOut;
    var axName;

    function coerceAxis(attr, dflt) {
        return coerce(axName + '.' + attr, dflt);
    }

    for(var i = 0; i < axisNames.length; i++) {
        axName = axisNames[i];

        if(!Lib.isPlainObject(contIn[axName])) {
            contIn[axName] = {};
        }

        var axIn = contIn[axName];
        var axOut = Template.newContainer(contOut, axName);
        axOut._id = axOut._name = axName;
        axOut._attr = opts.id + '.' + axName;
        axOut._traceIndices = subplotData.map(function(t) { return t._expandedIndex; });

        var dataAttr = constants.axisName2dataArray[axName];
        var axType = handleAxisTypeDefaults(axIn, axOut, coerceAxis, subplotData, dataAttr, opts);

        handleCategoryOrderDefaults(axIn, axOut, coerceAxis, {
            axData: subplotData,
            dataAttr: dataAttr
        });

        var visible = coerceAxis('visible');
        setConvert(axOut, contOut, layoutOut);

        coerceAxis('uirevision', contOut.uirevision);

        // We don't want to make downstream code call ax.setScale,
        // as both radial and angular axes don't have a set domain.
        // Furthermore, angular axes don't have a set range.
        //
        // Mocked domains and ranges are set by the polar subplot instances,
        // but Axes.findExtremes uses the sign of _m to determine which padding value
        // to use.
        //
        // By setting, _m to 1 here, we make Axes.findExtremes think that
        // range[1] > range[0], and vice-versa for `autorange: 'reversed'` below.
        axOut._m = 1;

        switch(axName) {
            case 'radialaxis':
                coerceAxis('minallowed');
                coerceAxis('maxallowed');
                var range = coerceAxis('range');
                var autorangeDflt = axOut.getAutorangeDflt(range);
                var autorange = coerceAxis('autorange', autorangeDflt);
                var shouldAutorange;

                // validate range and set autorange true for invalid partial ranges
                if(range && (
                    (range[0] === null && range[1] === null) ||
                    ((range[0] === null || range[1] === null) && (autorange === 'reversed' || autorange === true)) ||
                    (range[0] !== null && (autorange === 'min' || autorange === 'max reversed')) ||
                    (range[1] !== null && (autorange === 'max' || autorange === 'min reversed'))
                )) {
                    range = undefined;
                    delete axOut.range;
                    axOut.autorange = true;
                    shouldAutorange = true;
                }

                if(!shouldAutorange) {
                    autorangeDflt = axOut.getAutorangeDflt(range);
                    autorange = coerceAxis('autorange', autorangeDflt);
                }

                axIn.autorange = autorange;
                if(autorange) {
                    handleAutorangeOptionsDefaults(coerceAxis, autorange, range);

                    if(axType === 'linear' || axType === '-') coerceAxis('rangemode');
                    if(axOut.isReversed()) axOut._m = -1;
                }

                axOut.cleanRange('range', {dfltRange: [0, 1]});
                break;

            case 'angularaxis':
                // We do not support 'true' date angular axes yet,
                // users can still plot dates on angular axes by setting
                // `angularaxis.type: 'category'`.
                //
                // Here, if a date angular axes is detected, we make
                // all its corresponding traces invisible, so that
                // when we do add support for data angular axes, the new
                // behavior won't conflict with existing behavior
                if(axType === 'date') {
                    Lib.log('Polar plots do not support date angular axes yet.');

                    for(var j = 0; j < subplotData.length; j++) {
                        subplotData[j].visible = false;
                    }

                    // turn this into a 'dummy' linear axis so that
                    // the subplot still renders ok
                    axType = axIn.type = axOut.type = 'linear';
                }

                if(axType === 'linear') {
                    coerceAxis('thetaunit');
                } else {
                    coerceAxis('period');
                }

                var direction = coerceAxis('direction');
                coerceAxis('rotation', {counterclockwise: 0, clockwise: 90}[direction]);
                break;
        }

        handlePrefixSuffixDefaults(axIn, axOut, coerceAxis, axOut.type, {
            tickSuffixDflt: axOut.thetaunit === 'degrees' ? '°' : undefined
        });

        if(visible) {
            var dfltColor;
            var dfltFontColor;
            var dfltFontSize;
            var dfltFontFamily;
            var dfltFontWeight;
            var dfltFontStyle;
            var dfltFontVariant;
            var dfltFontTextcase;
            var dfltFontLineposition;
            var dfltFontShadow;
            var font = opts.font || {};

            dfltColor = coerceAxis('color');
            dfltFontColor = (dfltColor === axIn.color) ? dfltColor : font.color;
            dfltFontSize = font.size;
            dfltFontFamily = font.family;
            dfltFontWeight = font.weight;
            dfltFontStyle = font.style;
            dfltFontVariant = font.variant;
            dfltFontTextcase = font.textcase;
            dfltFontLineposition = font.lineposition;
            dfltFontShadow = font.shadow;

            handleTickValueDefaults(axIn, axOut, coerceAxis, axOut.type);
            handleTickLabelDefaults(axIn, axOut, coerceAxis, axOut.type, {
                font: {
                    weight: dfltFontWeight,
                    style: dfltFontStyle,
                    variant: dfltFontVariant,
                    textcase: dfltFontTextcase,
                    lineposition: dfltFontLineposition,
                    shadow: dfltFontShadow,
                    color: dfltFontColor,
                    size: dfltFontSize,
                    family: dfltFontFamily
                },
                noAutotickangles: axName === 'angularaxis',
                noTicklabelshift: true,
                noTicklabelstandoff: true
            });

            handleTickMarkDefaults(axIn, axOut, coerceAxis, {outerTicks: true});

            handleLineGridDefaults(axIn, axOut, coerceAxis, {
                dfltColor: dfltColor,
                bgColor: opts.bgColor,
                // default grid color is darker here (60%, vs cartesian default ~91%)
                // because the grid is not square so the eye needs heavier cues to follow
                blend: 60,
                showLine: true,
                showGrid: true,
                noZeroLine: true,
                attributes: layoutAttributes[axName]
            });

            coerceAxis('layer');

            if(axName === 'radialaxis') {
                coerceAxis('side');
                coerceAxis('angle', sector[0]);

                coerceAxis('title.text');
                Lib.coerceFont(coerceAxis, 'title.font', {
                    weight: dfltFontWeight,
                    style: dfltFontStyle,
                    variant: dfltFontVariant,
                    textcase: dfltFontTextcase,
                    lineposition: dfltFontLineposition,
                    shadow: dfltFontShadow,
                    color: dfltFontColor,
                    size: Lib.bigFont(dfltFontSize),
                    family: dfltFontFamily
                });
            }
        }

        if(axType !== 'category') coerceAxis('hoverformat');

        axOut._input = axIn;
    }

    if(contOut.angularaxis.type === 'category') {
        coerce('gridshape');
    }
}

function handleAxisTypeDefaults(axIn, axOut, coerce, subplotData, dataAttr, options) {
    var autotypenumbers = coerce('autotypenumbers', options.autotypenumbersDflt);
    var axType = coerce('type');

    if(axType === '-') {
        var trace;

        for(var i = 0; i < subplotData.length; i++) {
            if(subplotData[i].visible) {
                trace = subplotData[i];
                break;
            }
        }

        if(trace && trace[dataAttr]) {
            axOut.type = autoType(trace[dataAttr], 'gregorian', {
                noMultiCategory: true,
                autotypenumbers: autotypenumbers
            });
        }

        if(axOut.type === '-') {
            axOut.type = 'linear';
        } else {
            // copy autoType back to input axis
            // note that if this object didn't exist
            // in the input layout, we have to put it in
            // this happens in the main supplyDefaults function
            axIn.type = axOut.type;
        }
    }

    return axOut.type;
}

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    handleSubplotDefaults(layoutIn, layoutOut, fullData, {
        type: constants.name,
        attributes: layoutAttributes,
        handleDefaults: handleDefaults,
        font: layoutOut.font,
        autotypenumbersDflt: layoutOut.autotypenumbers,
        paper_bgcolor: layoutOut.paper_bgcolor,
        fullData: fullData,
        layoutOut: layoutOut
    });
};
