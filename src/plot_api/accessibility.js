'use strict';

var c2m = require('chart2music');
var Fx = require('../components/fx');

var supportedAccessibilityLibraries = ['chart2music'];

function enable(gd) {
    var accessibilityVars = gd._context.accessibility;
    var library = accessibilityVars.library;
    var options = accessibilityVars.options;
    if(!supportedAccessibilityLibraries.includes(library)) {
        // 'Accessibility not implemented for library: ' + library
        return;
    }
    if(library === 'chart2music') {
        var c2mData = {};
        var labels = [];
        var info = options.info;
        var closedCaptionsOptions = options.closedCaptions;
        delete options.info;
        delete options.closedCaptions;
        var fullData = gd._fullData;

        for(var i = 0; i < fullData.length; i++) {
            var trace = fullData[i] ? fullData[i] : {};
            var type = trace.type;
            var x = trace.x !== undefined ? trace.x : [];
            var y = trace.y !== undefined ? trace.y : [];
            var name = trace.name !== undefined ? trace.name : i;
            var text = trace.text !== undefined ? trace.text : [];
            if(type === 'scatter') {
                var traceData = [];
                if('y' in trace) {
                    for(var p = 0; p < y.length; p++) {
                        traceData.push(
                            {
                                x: x.length > 0 ? x[p] : p,
                                y: y[p],
                                label: text[p] ? text[p] : p
                            });
                    }
                    c2mData[name] = traceData;
                    labels.push(name);
                }
            } else {
                // 'Accessibility not implemented for trace type: ' + trace.type
                return;
            }
        }
        var closedCaptions;
        if(closedCaptionsOptions.generate) {
            closedCaptions = document.createElement('div'); // should this be Lib.getGraphDiv()?
            closedCaptions.id = closedCaptionsOptions.elId;
            closedCaptions.className = closedCaptionsOptions.elClassname;
            gd.parentNode.insertBefore(closedCaptions, gd.nextSibling); // this does get generated
        } else {
            closedCaptions = document.getElementById(closedCaptionsOptions.elId);
        }

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

        options.onFocusCallback = function(dataInfo) {
            Fx.hover(gd, [{
                curveNumber: labels.indexOf(dataInfo.slice),
                pointNumber: dataInfo.index
            }]);
        };
        c2m.c2mChart({
            title: titleText,
            type: 'line',
            axes: {
                x: {
                    label: xAxisText
                },
                y: {
                    label: yAxisText
                },
            },
            element: gd,
            cc: closedCaptions,
            data: c2mData,
            options: options,
            info: info
        });
    }
}
exports.enable = enable;
