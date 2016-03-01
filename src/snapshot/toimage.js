/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

/*eslint dot-notation: [2, {"allowPattern": "^catch$"}]*/

'use strict';

var EventEmitter = require('events').EventEmitter;
var Plotly = require('../plotly');

/**
 * @param {object} gd figure Object
 * @param {object} opts option object
 * @param opts.format 'jpeg' | 'png' | 'webp' | 'svg'
 */
function toImage(gd, opts) {

    // first clone the GD so we can operate in a clean environment
    var Snapshot = Plotly.Snapshot;
    var ev = new EventEmitter();

    var clone = Snapshot.clone(gd, {format: 'png'});
    var clonedGd = clone.td;

    // put the cloned div somewhere off screen before attaching to DOM
    clonedGd.style.position = 'absolute';
    clonedGd.style.left = '-5000px';
    document.body.appendChild(clonedGd);

    function wait() {
        var delay = Snapshot.getDelay(clonedGd._fullLayout);

        setTimeout(function() {
            var svg = Plotly.Snapshot.toSVG(clonedGd);

            var canvasContainer = window.document.createElement('div');
            var canvas = window.document.createElement('canvas');

            // window.document.body.appendChild(canvasContainer);
            canvasContainer.appendChild(canvas);

            canvasContainer.id = Plotly.Lib.randstr();
            canvas.id = Plotly.Lib.randstr();

            ev = Plotly.Snapshot.svgToImg({
                format: opts.format,
                width: clonedGd._fullLayout.width,
                height: clonedGd._fullLayout.height,
                canvas: canvas,
                emitter: ev,
                svg: svg
            });

            ev.clean = function() {
                if(clonedGd) clonedGd.remove();
            };

        }, delay);
    }

    var redrawFunc = Snapshot.getRedrawFunc(clonedGd);

    Plotly.plot(clonedGd, clone.data, clone.layout, clone.config)
        // TODO: the following is Plotly.Plots.redrawText but without the waiting.
        // we shouldn't need to do this, but in *occasional* cases we do. Figure
        // out why and take it out.
        .then(redrawFunc)
        .then(wait)
        .catch(function(err) {
            ev.emit('error', err);
        });


    return ev;
}

module.exports = toImage;
