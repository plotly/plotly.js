'use strict';

var Plotly = window.Plotly;
var ToolPanel = window.ToolPanel;
var divs = [];

function createPlot (divId) {
    var containerDiv = document.getElementById('main');
    var graphDiv = document.createElement('div');
    graphDiv.id = divId;
    graphDiv.style.width = '45%';
    graphDiv.style.display = 'inline-block';
    graphDiv.style.margin = '10px';
    graphDiv.style.position = 'relative';
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

    graphDiv.toolPanel = new ToolPanel(Plotly, graphDiv, {
        standalone: true
    });
    graphDiv.toolPanel.makeMenu(graphDiv);

    divs.push(graphDiv);

}

['one', 'two'].forEach(function (index) {
    createPlot(index);
});
