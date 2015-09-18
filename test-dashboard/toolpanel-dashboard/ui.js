'use strict';

var Plotly = window.Plotly;
var ToolPanel = window.ToolPanel;
var divs = [];

function createPlot (divId) {
    var containerDiv = document.getElementById('main');
    var graphDiv = document.createElement('div');
    var toolDiv = document.createElement('div');
    containerDiv.style.width = '100%';
    containerDiv.style.height = '100%';
    containerDiv.style.clear = 'both';

    graphDiv.id = divId;
    graphDiv.style.width = '80%';
    graphDiv.style.display = 'inline-block';
    graphDiv.style.margin = '0px';
    graphDiv.style.position = 'relative';
    graphDiv.style.verticalAlign = 'top';

    toolDiv.style.verticalAlign = 'top';
    toolDiv.style.width = '130px';
    toolDiv.style.display = 'inline-block';

    containerDiv.appendChild(toolDiv);
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

    graphDiv.toolPanel = new ToolPanel(Plotly, toolDiv, {
        standalone: true,
        popoverContainer: containerDiv
    });

    graphDiv.toolPanel.makeMenu();

    divs.push(graphDiv, toolDiv);

}

['one'].forEach(function (index) {
    createPlot(index);
});
