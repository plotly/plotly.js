'use strict';

var c2m = require('chart2music');
var Fx = require('../../components/fx');
var Lib = require('../../lib');

var codecs = require('./all_codecs').codecs;

function initC2M(gd, defaultConfig) {
    // TODO what is there besides a fullReset?
    // TODO Do we need the capacity to add data (live listen?)
    // TODO Do we need the capacity to reset all data
    var c2mContext = gd._context._c2m = {};
    c2mContext.options = Lib.extendDeepAll({}, defaultConfig.options);
    c2mContext.info = Lib.extendDeepAll({}, defaultConfig.info);
    c2mContext.ccOptions = Lib.extendDeepAll({}, defaultConfig.closedCaptions);

    var labels = []; // TODO this probably needs to be stored in context-
    // when data is updated this specific instance needs to be updated
    // or the below function eneds to be reset to use the new instance of labels.
    c2mContext.options.onFocusCallback = function(dataInfo) {
        Fx.hover(gd, [{
            curveNumber: labels.indexOf(dataInfo.slice),
            pointNumber: dataInfo.index
        }]);
    };
    // I generally don't like using closures like this.
    // In this case it works out, we effectively treat 'labels'
    // like a global, but it's a local.
    // I'd rather the callback be given its c2m handler which
    // could store extra data. Or bind c2mContext as `this`.

    var titleText = 'Chart';
    if((gd._fullLayout.title !== undefined) && (gd._fullLayout.title.text !== undefined)) {
        titleText = gd._fullLayout.title.text;
    }

    var ccElement = initClosedCaptionDiv(gd, c2mContext.ccOptions);

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

    // I think that the traces have to point to their axis,
    // since it might not be x1, could be x2, etc
    // So this really needs to be part of process()
    var c2mData = {};
    var types = [];
    var fullData = gd._fullData;
    // TODO: We're looping through all traces, and that's fine, but it might be helpful to discern how things are organized
    for(var i = 0; i < fullData.length; i++) {
        var trace = fullData[i];
        // TODO: what happens if this doesn't run, weird c2m errors
        for(var codecI = 0; codecI < codecs.length; codecI++) {
            var test = codecs[codecI].test(trace);
            if(!test) continue;
            var label = test.name ? test.name : i.toString() + ' ';

            var labelCount = 0;
            var originalLabel = label;
            while(label in c2mData) {
                labelCount++;
                label = originalLabel + labelCount.toString();
            }

            labels.push(label);
            types.push(test.type);
            c2mData[label] = codecs[codecI].process(trace);
        }
    } // TODO add unsupported codec

    c2mContext.c2mHandler = c2m.c2mChart({
        title: titleText,
        type: types,
        axes: {
            x: { // needs to be generated
                label: xAxisText
            },
            y: {
                label: yAxisText
            },
        },
        element: gd,
        cc: ccElement,
        data: c2mData,
        options: c2mContext.options,
        info: c2mContext.info
    });
    // TODO: We need to handle the possible error that c2mChart returns
}
exports.initC2M = initC2M;

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

exports.initClosedCaptionDiv = initClosedCaptionDiv;
