
function plot() {
    var trace = { x: [], y: [], fill: 'tozeroy' };
    var layout = {
        xaxis: {
            type: 'date',
            rangeslider: {
                visible: true
            }
        }
    };

    Plotly.d3.csv('../../hughes_demo/report.csv').row(function(d) {
        trace.x.push(new Date(d['Date/Time']));
        trace.y.push(d['someStats (units)'] || null);
    }).get(function() {
        plotData(trace);
    });


    function plotData(trace) {
        var gd = document.getElementById('plot');

        Plotly.plot(Tabs.fresh(), [trace], layout);
    }
}
