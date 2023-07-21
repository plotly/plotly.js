import {c2mChart} from "chart2music";

export function enable(gd) {

    var fullLayout = gd._fullLayout;
    var fullData = gd._fullData;

    const c2mData = {};

    var labels = [];
    
    for(var i = 0; i < fullData.length; i++) {
        var trace = fullData[i];
        Lib.warn(trace);
        if(trace.type === 'scatter') {
            var traceData = [];
            for(var p = 0; p < trace.y.length; p++) {
                traceData.push(
                    {
                        x: trace.x ? trace.x[p] : p,
                        y: trace.y[p] ?? none,
                        label: trace.text[p] ?? p
                    })
            }
            c2mData[trace.name ?? i] = traceData;
            labels.push(trace.name ?? i);
        }
        else {
            Lib.error('Accessibility not implemented for trace type: ' + trace.type);
            return;
        }
    }
    
    var closed_captions = document.createElement('div');
    closed_captions.id = 'cc';
    closed_captions.className = 'closed_captions';
    gd.appendChild(closed_captions);

    c2mChart({
        title: fullLayout.title.text ?? "",
        type: "line",
        axes: {
            x: {
            label: fullLayout.xaxis.title.text ?? ""
            },
            y: {
            label: fullLayout.yaxis.title.text ?? ""
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