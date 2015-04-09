'use strict';

var plotlist = document.getElementById('plot-list');
var anchor = document.getElementById('embedded-graph');
var image = document.getElementById('embedded-image');

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

            var myImage = new Image();
            myImage.src = 'gl3d/testplots/'+ plotname + '.png';

            image.innerHTML = '';
            image.appendChild(myImage);


            anchor.innerHTML = '';

            // create a fresh gd
            gd = document.createElement('div');
            anchor.appendChild(gd);

            var plot = plots[plotname];
            Plotly.plot(gd, plot.data, plot.layout);


        });
    });
}

var plots = {};

plots['log-axis'] = require('./testplots/marker-color.json');
plots['delaunay'] = require('./testplots/delaunay.json');
plots['log-axis'] = require('./testplots/log-axis.json');
plots['multi-scene'] = require('./testplots/multi-scene.json');
plots['surface-lighting'] = require('./testplots/surface-lighting.json');
plots['z-range'] = require('./testplots/z-range.json');

plotButtons(plots);
