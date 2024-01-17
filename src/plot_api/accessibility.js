"use strict";

var underlyingModule = import('chart2music');


const supportedAccessibilityLibraries = ['chart2music'];

function enable(gd) {
    const {library, options} = gd._context.accessibility;
    if (!supportedAccessibilityLibraries.includes(library)) {
        // 'Accessibility not implemented for library: ' + library
        return;
    }
    console.log("We're enabled!");
    if (library === 'chart2music') {
        console.log("Library === chart2music");
        const c2mData = {};
        const labels = [];
        const info = options.info;
        delete options.info;
        const fullData = gd._fullData;

        for(var i = 0; i < fullData.length; i++) {
            var trace = fullData[i] ?? {};
            var {type, x = [], y = [], name = i, text = []} = trace;
            if(type === 'scatter') {
                console.log("Found a scatter");
                var traceData = [];
                if ('y' in trace) {
                    for(var p = 0; p < y.length; p++) {
                        traceData.push(
                            {
                                x: x.length > 0 ? x[p] : p,
                                y: y[p],
                                label: text[p] ?? p
                            })
                    }
                    console.log("TraceData.length: " + String(traceData.length));
                    c2mData[name] = traceData;
                    labels.push(name);
                }
            }
            else {
                // 'Accessibility not implemented for trace type: ' + trace.type
                console.log("Accessibility not implemented for trace type.");
                return;
            };
        };

        var closed_captions = document.createElement('div');
        closed_captions.id = 'cc';
        closed_captions.className = 'closed_captions';
        gd.appendChild(closed_captions); // this does get generated

        const {
            title: {text: title_text = ''} = {},
            xaxis: {title: {text: xaxis_text = ''} = {}} = {},
            yaxis: {title: {text: yaxis_text = ''} = {}} = {},
        } = gd._fullLayout; // I do not understand this notation that well anyway.

        return underlyingModule.then( function(mod) {
            console.log("Got underlying module!");
            console.log(mod);
            var ret = mod.c2mChart({
                title: title_text,
                type: "line",
                axes: {
                    x: {
                    label: xaxis_text
                    },
                    y: {
                    label: yaxis_text
                    }
                },
                element: gd,
                cc: closed_captions,
                data: c2mData,
                options: {
                    onFocusCallback: ({slice, index}) => {
                    Plotly.Fx.hover(gd, [{
                        curveNumber: labels.indexOf(slice),
                        pointNumber: index
                    }])
                    },
                    ...options
                },
                info: info
            });
            console.log(ret);
        });
    };
};
module.exports = { enable };
