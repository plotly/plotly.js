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

function createTrace (type) {

    function rand() {
        return Math.random() * 360;
    }

    var traces = {
        polar: {
            r: [1, 2, 3, 4],
            t: [rand(), rand(), rand(), rand()],
            type: 'scatter',
            name: new Date()
        },
        line: {
            x: [1, 2, 3, 4],
            y: [rand(), rand(), rand(), rand()],
            type: 'scatter',
            name: new Date()
        }
    };

    return traces[type] || traces.line;
}

function createPlot (divId, type) {
    var containerDiv = document.getElementById('main');
    var graphDiv = document.createElement('div');
    var toolDiv = document.createElement('div');
    containerDiv.style.width = '100%';
    containerDiv.style.height = '100%';
    containerDiv.style.clear = 'both';

    graphDiv.id = divId;
    graphDiv.style.width = '50%';
    graphDiv.style.display = 'inline-block';
    graphDiv.style.margin = '0px';
    graphDiv.style.verticalAlign = 'top';

    toolDiv.className = 'toolDiv';
    toolDiv.style.display = 'inline-block';


    containerDiv.appendChild(graphDiv);
    containerDiv.appendChild(toolDiv);

    var data = [
        createTrace(type),
        createTrace(type),
        createTrace(type)
    ];

    var toolPanel;

    Plotly.newPlot(divId, data);

    graphDiv.toolPanel = toolPanel = new ToolPanel(Plotly, graphDiv, {
        standalone: true,
        popoverContainer: containerDiv,
        slideoutDirection: 'left'
    });

    window.toolPanel = graphDiv.toolPanel;

    graphDiv.toolPanel.makeMenu({
        toolMenuContainer: toolDiv,
        menuStyle: 'classic'
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
    createPlot(index, 'line');
});

createRemoveButton();
