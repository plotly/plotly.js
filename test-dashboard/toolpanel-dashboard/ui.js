'use strict';

var Plotly = window.Plotly;
var ToolPanel = window.ToolPanel;

(function createPlot (divId) {
    var containerDiv = document.getElementById('main');
    var graphDiv = document.createElement('div');
    graphDiv.id = divId;
    containerDiv.appendChild(graphDiv);

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

    graphDiv.toolPanel = new ToolPanel(Plotly, graphDiv);
    graphDiv.toolPanel.makeMenu(graphDiv);

})('yo');
