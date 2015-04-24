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

            gd = document.createElement('div');
            anchor.appendChild(gd);

            var plot = plots[plotname];
            Plotly.plot(gd, plot.data, plot.layout);


        });
    });

    var snapshot = document.createElement('button');

    snapshot.style.cssFloat = 'left';
    snapshot.style.width = '100px';
    snapshot.style.height = '40px';
    snapshot.style.marginLeft = '25px';
    snapshot.innerHTML = 'snapshot';
    snapshot.style.background = 'blue';

    plotlist.appendChild(snapshot);

    snapshot.addEventListener('click', function () {

        /*
         * Grab the currently loaded plot and make an image - replacing the plot.
         */
        if (!gd) return;

        var layout = gd.layout;
        var data = gd.data;

        if (!layout || !data) return;

        Plotly.Lib.getSceneKeys(gd._fullLayout).forEach( function (key) {
            var scene = gd._fullLayout[key]._scene;
            scene.destroy();

        });

        // create a fresh gd
        anchor.innerHTML = '';
        gd = document.createElement('div');
        anchor.appendChild(gd);

        /*
         * Replot with staticPlot
         */
        Plotly.plot(gd, data, layout, {staticPlot: true}).then( function () {

            setTimeout( function () {

                Plotly.Lib.getSceneKeys(gd._fullLayout).forEach( function (key) {

                    var scene = gd._fullLayout[key]._scene;
                    var dataURL = scene.toImage();

                    var myImage = new Image();
                    myImage.src = dataURL;

                    myImage.onload = function () {
                        myImage.height = scene.container.clientHeight;
                        myImage.width = scene.container.clientWidth;
                    };

                    image.innerHTML = '';
                    image.appendChild(myImage);

                });

            }, 500);

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
