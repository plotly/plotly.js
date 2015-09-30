'use strict';

var Plotly = window.Plotly;
var ToolPanel = window.ToolPanel;
var divs = [];

function createRemoveButton () {
    var removeButton = document.createElement('button');
    removeButton.innerHTML = 'remove toolpanel';
    removeButton.id = 'removeButton';
    document.body.appendChild(removeButton);

    removeButton.onclick = function () {
        divs[0].toolPanel.remove();
    };
}

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

    toolDiv.className = 'toolDiv';

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
    var toolPanel;

    Plotly.newPlot(divId, data);

    graphDiv.toolPanel = toolPanel = new ToolPanel(Plotly, graphDiv, {
        standalone: true,
        popoverContainer: containerDiv
    });

    window.toolPanel = graphDiv.toolPanel;

    graphDiv.toolPanel.makeMenu({
        toolMenuContainer: toolDiv
    });

    toolPanel.createMenuMultiButton([
        {
            labelContent: 'Undo',
            iconClass: 'icon-rotate-left',
            handler: toolPanel.undo
        },
        {
            labelContent: 'Redo',
            iconClass: 'icon-rotate-right',
            handler: toolPanel.redo
        }
    ]);

    toolPanel.createMenuSpacer();

    toolPanel.createMenuButtons(toolPanel.getPanelButtonSpecs());

    divs.push(graphDiv, toolDiv);

}

['one'].forEach(function (index) {
    createPlot(index);
});

createRemoveButton();
