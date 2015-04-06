'use strict';

var plotlist = document.getElementById('plot-list');
var anchor = document.getElementById('embedded-graph');
var gd = null;

anchor.style.position = 'relative';
anchor.style.top = '80px';

function plotButtons(plots) {

    Object.keys(plots).forEach( function (plotname) {

        var button = document.createElement('button');

        button.style.cssFloat = 'left';
        button.style.width = '100px';
        button.style.height = '40px';

        button.innerHTML = plotname;

        plotlist.appendChild(button);

        button.addEventListener('click', function () {

            anchor.innerHTML = '';

            // create a fresh gd
            gd = document.createElement('div');
            anchor.appendChild(gd);

            var plot = plots[plotname];

            Plotly.plot(gd, plot.data, plot.layout);

        });
    });
}


var plots = {
    'marker-color': {
        data: [
            {
                type:'scatter3d',
                y:[-102.63,-110.53,-96.97,-163.59],
                x:[100.75,157.53,140.72,134.03],
                z:[100.75,157.53,140.72,134.03],
                marker: {
                    color: ['blue', 'orange', 'black'],
                    size: [10, 20, 30, 40]
                }
            }],
        layout: {
            title: "Scatter3d with under-defined marker color array"
        }
    },

    'log-axis': {
        data: [
            {
                type: 'scatter3d',
                mode: 'lines',
                x: [1,2,3,4,5],
                y: [1,2,3,4,5],
                z: [3,3,3,3,3],
                line: { width: 6 }
            },
            {
                type: 'scatter3d',
                mode: 'lines',
                x: [1,2,3,4,5],
                y: [3,2,1, 0, -1],
                z: [3,3,3, 3, 3],
                line: { width: 20 }
            }
        ],
        layout: {
            title: 'test',
            scene: {
                xaxis: {
                    type: 'log'
                }
            }
        }
    },


    'multi-scene': {
        data:  [{
            type: 'scatter3d',
            x: [1],
            y: [1],
            z: [1],
            marker: {color: 'blue'},
            scene: 'scene1'
        },{
            type: 'scatter3d',
            x: [2],
            y: [2],
            z: [2],
            marker: {color: 'red'},
            scene: 'scene2'
        }],
        layout: {
            title: '\'scene\' should be the same as \'scene1\'',
            scene1: {
                domain: {
                    x: [0, 0.5],
                    y: [0, 0.5]
                }
            },
            scene2: {
                domain: {
                    x: [0.5, 1],
                    y: [0.5, 1]
                }
            }
        }
    }



};





plotButtons(plots);
