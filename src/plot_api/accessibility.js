"use strict";
// import c2mChart from "chart2music";
var c2mChart = require("chart2music");

export function enable (gd) {

    const c2mData = {};
    const labels = [];
    
    const fullData = gd._fullData;

    for(var i = 0; i < fullData.length; i++) {
        var trace = fullData[i];
        if(trace.type === 'scatter') {
            var traceData = [];
            if ('y' in trace) {
                for(var p = 0; p < trace.y.length; p++) {
                    traceData.push(
                        {
                            x: trace.x ? trace.x[p] : p,
                            y: trace.y[p],
                            label: trace.text[p] ?? p
                        })
                }
                c2mData[trace.name ?? i] = traceData;
                labels.push(trace.name ?? i);
            }
        }
        else {
            // 'Accessibility not implemented for trace type: ' + trace.type
            return;
        }
    }
    
    var closed_captions = document.createElement('div');
    closed_captions.id = 'cc';
    closed_captions.className = 'closed_captions';
    gd.appendChild(closed_captions);

    const {
        title: {text: title_text = ''} = {},
        xaxis: {title: {text: xaxis_text = ''} = {}} = {},
        yaxis: {title: {text: yaxis_text = ''} = {}} = {},
    } = gd._fullLayout;
    
    c2mChart({
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
            ...gd._context.chart2musicOptions
        },
        info: gd._context.chart2musicInfo
    });      
};