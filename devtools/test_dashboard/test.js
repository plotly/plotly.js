var trace1 = {
  x: [1, 2, 3, 4],
  y: [10, 15, 13, 17],
  mode: 'markers',
  type: 'scattergl',
  marker:{size:30, color: 'red', symbol: 'asterisk'}
};

var data = [ trace1 ];

var layout = {
  title:'Line and Scatter Plot',
  height: 400,
  width: 480
};

Plotly.newPlot('graph', data, layout);