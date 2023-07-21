import {c2mChart} from "chart2music";

export function enable(gd) {

    var fullLayout = gd._fullLayout;
    var fullData = gd._fullData;

    const c2mData = {};

    for(var i = 0; i < fullData.length; i++) {
        var trace = fullData[i];
        if(trace.type === 'scatter') {
            c2mData[i] = trace.y;
        }
        else {
            Lib.warn('Accessibility not implemented for trace type: ' + trace.type);
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
                curveNumber: slice, 
                pointNumber: index
            }])
            },
            ...gd._context.chart2musicOptions
        },
        info: gd._context.chart2musicInfo
    });      
};