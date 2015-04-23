'use strict';

var plotlist = document.getElementById('plot-list');
var anchor = document.getElementById('embedded-graph');
var image = document.getElementById('embedded-image');

var gd = null;

anchor.style.position = 'relative';
anchor.style.top = '80px';

anchor.style.height = '600px';
anchor.style.width = '1000px';

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
            myImage.src = './testplots/'+ plotname + '.png';

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
plots['mirror-ticks'] = require('./testplots/mirror-ticks.json');
plots['autorange-zero'] = require('./testplots/autorange-zero.json');
plots['contour-lines'] = require('./testplots/contour-lines.json');
plots['xy-defined-ticks'] = require('./testplots/xy-defined-ticks.json');
plots['opacity-surface'] = require('./testplots/opacity-surface.json');
plots['projection-traces'] = require('./testplots/projection-traces.json');
plots['opacity-scaling-spikes'] = require('./testplots/opacity-scaling-spikes.json');
plots['text-weirdness'] = require('./testplots/text-weirdness.json');

plotButtons(plots);
