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
        delete options.info;
        var fullData = gd._fullData;

        for(var i = 0; i < fullData.length; i++) {
            var trace = fullData[i] ? fullData[i] : {};
            var type = trace.type;
            var x = trace.x ? trace.x : [];
            var y = trace.y ? trace.y : [];
            var name = trace.name ? trace.name : i;
            var text = trace.text ? trace.text : [];
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

        var closedCaptions = document.createElement('div');
        closedCaptions.id = 'cc';
        closedCaptions.className = 'closed_captions';
        gd.appendChild(closedCaptions); // this does get generated

        var titleText = gd._fullLayout.title.text ? gd._fullLayout.title.text : 'Chart';
        var xaxisText = gd._fullLayout.xaxis.title.text ? gd._fullLayout.xaxis.title.text : 'X Axis';
        var yaxisText = gd._fullLayout.yaxis.title.text ? gd._fullLayout.yaxis.title.text : 'Y Axis';
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
                    label: xaxisText
                },
                y: {
                    label: yaxisText
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
