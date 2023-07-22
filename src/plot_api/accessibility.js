"use strict";
import c2mChart from "chart2music";

export function enable (gd) {

    const c2mData = {};
    const labels = [];
    
    const fullData = gd._fullData;

    for(var i = 0; i < fullData.length; i++) {
        var trace = fullData[i] ?? {};
        var {type, x = [], y = [], name = i, text = []} = trace;
        if(type === 'scatter') {
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
                c2mData[name] = traceData;
                labels.push(name);
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