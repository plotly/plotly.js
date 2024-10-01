'use strict';

var c2m = require('chart2music');
var Fx = require('../components/fx');
var Lib = require('../lib');

var codecs = require('./all_codecs').codecs;

/* initClosedCaptionDiv: Initialize the closed caption div with the given configuration.
 * This function works by either creating a new div or returning the existing div
*/
function initClosedCaptionDiv(gd, config) {
    if(config.generate) {
        var closedCaptions = document.createElement('div');
        closedCaptions.id = config.elId;
        closedCaptions.className = config.elClassname;
        gd.parentNode.insertBefore(closedCaptions, gd.nextSibling); // this really might not work
        return closedCaptions;
    } else {
        return document.getElementById(config.elId);
    }
}

/* initC2M: Initialize the chart2music library with the given configuration.
 * This function works by resetting the c2m context of the given graph div
 */
function initC2M(gd, defaultConfig) {
    var c2mContext = gd._context._c2m = {};
    c2mContext.options = Lib.extendDeepAll({}, defaultConfig.options);
    c2mContext.info = Lib.extendDeepAll({}, defaultConfig.info);
    c2mContext.ccOptions = Lib.extendDeepAll({}, defaultConfig.closedCaptions);

    var labels = []; 
    // Set the onFocusCallback to highlight the hovered point
    c2mContext.options.onFocusCallback = function(dataInfo) {
        Fx.hover(gd, [{
            curveNumber: labels.indexOf(dataInfo.slice),
            pointNumber: dataInfo.index
        }]);
    };

    var ccElement = initClosedCaptionDiv(gd, c2mContext.ccOptions);

    // Get the chart, x, and y axis titles from the layout.
    // This will be used for the closed captions. 
    var titleText = 'Chart';
    if((gd._fullLayout.title !== undefined) && (gd._fullLayout.title.text !== undefined)) {
        titleText = gd._fullLayout.title.text;
    }
    var xAxisText = 'X Axis';
    if((gd._fullLayout.xaxis !== undefined) &&
      (gd._fullLayout.xaxis.title !== undefined) &&
      (gd._fullLayout.xaxis.title.text !== undefined)) {
        xAxisText = gd._fullLayout.xaxis.title.text;
    }
    var yAxisText = 'Y Axis';
    if((gd._fullLayout.yaxis !== undefined) &&
      (gd._fullLayout.yaxis.title !== undefined) &&
      (gd._fullLayout.yaxis.title.text !== undefined)) {
        yAxisText = gd._fullLayout.yaxis.title.text;
    }

    // Convert the data to the format that c2m expects
    var c2mData = {};
    var types = [];
    var fullData = gd._fullData;

    // Iterate through the traces and find the codec that matches the trace
    for(var trace of fullData) {
        for(var codec of codecs) {
            var test = codec.test(trace);
            if(!test) continue;

            // Generate a unique label for the trace
            var label = test.name ? test.name : i.toString() + ' ';
            var labelCount = 0;
            var originalLabel = label;
            while(label in c2mData) {
                labelCount++;
                label = originalLabel + labelCount.toString();
            }

            labels.push(label);
            types.push(test.type);
            c2mData[label] = codec.process(trace);
        }
    }

    c2mContext.c2mHandler = c2m.c2mChart({
        title: titleText,
        type: types,
        axes: {
            x: { label: xAxisText },
            y: { label: yAxisText },
        },
        element: gd,
        cc: ccElement,
        data: c2mData,
        options: c2mContext.options,
        info: c2mContext.info
    });
}
exports.initC2M = initC2M;
