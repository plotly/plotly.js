'use strict';

var Lib = require('../../lib');
var Color = require('../../components/color');
var Template = require('../../plot_api/plot_template');

var handleSubplotDefaults = require('../subplot_defaults');
var getSubplotData = require('../get_data').getSubplotData;

var handlePrefixSuffixDefaults = require('../cartesian/prefix_suffix_defaults');
var handleTickLabelDefaults = require('../cartesian/tick_label_defaults');
var handleLineGridDefaults = require('../cartesian/line_grid_defaults');
var setConvertCartesian = require('../cartesian/set_convert');

var layoutAttributes = require('./layout_attributes');
var constants = require('./constants');
var axisNames = constants.axisNames;

var makeImagDflt = memoize(function(realTickvals) {
    // TODO: handle this case outside supply defaults step
    if(Lib.isTypedArray(realTickvals)) realTickvals = Array.from(realTickvals);

    return realTickvals.slice().reverse().map(function(x) { return -x; })
        .concat([0])
        .concat(realTickvals);
}, String);

function handleDefaults(contIn, contOut, coerce, opts) {
    var bgColor = coerce('bgcolor');
    opts.bgColor = Color.combine(bgColor, opts.paper_bgcolor);

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

        var visible = coerceAxis('visible');

        axOut.type = 'linear';
        setConvertCartesian(axOut, layoutOut);

        handlePrefixSuffixDefaults(axIn, axOut, coerceAxis, axOut.type);

        if(visible) {
            var isRealAxis = axName === 'realaxis';
            if(isRealAxis) coerceAxis('side');

            if(isRealAxis) {
                coerceAxis('tickvals');
            } else {
                var imagTickvalsDflt = makeImagDflt(
                    contOut.realaxis.tickvals ||
                    layoutAttributes.realaxis.tickvals.dflt
                );

                coerceAxis('tickvals', imagTickvalsDflt);
            }

            // TODO: handle this case outside supply defaults step
            if(Lib.isTypedArray(axOut.tickvals)) axOut.tickvals = Array.from(axOut.tickvals);

            var dfltColor;
            var dfltFontColor;
            var dfltFontSize;
            var dfltFontFamily;
            var font = opts.font || {};

            if(visible) {
                dfltColor = coerceAxis('color');
                dfltFontColor = (dfltColor === axIn.color) ? dfltColor : font.color;
                dfltFontSize = font.size;
                dfltFontFamily = font.family;
            }

            handleTickLabelDefaults(axIn, axOut, coerceAxis, axOut.type, {
                noAutotickangles: true,
                noTicklabelshift: true,
                noTicklabelstandoff: true,
                noTicklabelstep: true,
                noAng: !isRealAxis,
                noExp: true,
                font: {
                    color: dfltFontColor,
                    size: dfltFontSize,
                    family: dfltFontFamily
                }
            });

            Lib.coerce2(contIn, contOut, layoutAttributes, axName + '.ticklen');
            Lib.coerce2(contIn, contOut, layoutAttributes, axName + '.tickwidth');
            Lib.coerce2(contIn, contOut, layoutAttributes, axName + '.tickcolor', contOut.color);
            var showTicks = coerceAxis('ticks');
            if(!showTicks) {
                delete contOut[axName].ticklen;
                delete contOut[axName].tickwidth;
                delete contOut[axName].tickcolor;
            }

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
        }

        coerceAxis('hoverformat');

        delete axOut.type;

        axOut._input = axIn;
    }
}

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    handleSubplotDefaults(layoutIn, layoutOut, fullData, {
        noUirevision: true,
        type: constants.name,
        attributes: layoutAttributes,
        handleDefaults: handleDefaults,
        font: layoutOut.font,
        paper_bgcolor: layoutOut.paper_bgcolor,
        fullData: fullData,
        layoutOut: layoutOut
    });
};

function memoize(fn, keyFn) {
    var cache = {};
    return function(val) {
        var newKey = keyFn ? keyFn(val) : val;
        if(newKey in cache) { return cache[newKey]; }

        var out = fn(val);
        cache[newKey] = out;
        return out;
    };
}
