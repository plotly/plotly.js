var gd = document.getElementById('embedded-graph');

var trace1  = {
    x: [1,2,3,4],
    y: [4,3,4,5],
    z: [3,2,4,5],
    type: 'scatter3d'
};

var data = [trace1];
var layout = {};

layout.title = 'pig in a fur coat';

Plotly.plot(gd, data, layout);
