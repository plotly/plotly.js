'use strict';

Plotly = window.Plotly;

(function createPlot (divId) {

    var graphDiv = document.createElement('div');
    graphDiv.id = divId;
    document.body.appendChild(graphDiv);

    var trace1 = {
        x: [1, 2, 3, 4],
        y: [10, 15, 13, 17],
        type: 'scatter'
    };

    var trace2 = {
        x: [1, 2, 3, 4],
        y: [16, 5, 11, 9],
        type: 'scatter'
    };

    var data = [trace1, trace2];

    Plotly.newPlot(divId, data);

    var toolPanel = new ToolPanel({Plotly: Plotly});
    toolPanel.makeMenu(graphDiv);

})('yo');
