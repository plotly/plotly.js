var isNumeric = require('fast-isnumeric');
var mouseEvent = require('./mouse_event');
var getNodeCoords = require('./get_node_coords');

/*
 * drag: grab a node and drag it (dx, dy) pixels
 * optionally specify an edge ('n', 'se', 'w' etc)
 * to grab it by an edge or corner (otherwise the middle is used)
 */
function drag(node, dx, dy, edge, x0, y0, nsteps, noCover) {
    nsteps = nsteps || 1;

    var coords = getNodeCoords(node, edge);
    var fromX = isNumeric(x0) ? x0 : coords.x;
    var fromY = isNumeric(y0) ? y0 : coords.y;

    mouseEvent('mousemove', fromX, fromY, {element: node});
    mouseEvent('mousedown', fromX, fromY, {element: node});

    var promise = (noCover ? Promise.resolve(node) : waitForDragCover())
    .then(function(dragCoverNode) {
        var toX;
        var toY;

        for(var i = 1; i <= nsteps; i++) {
            toX = fromX + i * dx / nsteps;
            toY = fromY + i * dy / nsteps;
            mouseEvent('mousemove', toX, toY, {element: dragCoverNode});
        }

        mouseEvent('mouseup', toX, toY, {element: dragCoverNode});
        return noCover || waitForDragCoverRemoval();
    });

    return promise;
}

function waitForDragCover() {
    return new Promise(function(resolve) {
        var interval = 5;
        var timeout = 5000;

        var id = setInterval(function() {
            var dragCoverNode = document.querySelector('.dragcover');
            if(dragCoverNode) {
                clearInterval(id);
                resolve(dragCoverNode);
            }

            timeout -= interval;
            if(timeout < 0) {
                clearInterval(id);
                throw new Error('waitForDragCover: timeout');
            }
        }, interval);
    });
}

function waitForDragCoverRemoval() {
    return new Promise(function(resolve) {
        var interval = 5;
        var timeout = 5000;

        var id = setInterval(function() {
            var dragCoverNode = document.querySelector('.dragcover');
            if(!dragCoverNode) {
                clearInterval(id);
                resolve(dragCoverNode);
            }

            timeout -= interval;
            if(timeout < 0) {
                clearInterval(id);
                throw new Error('waitForDragCoverRemoval: timeout');
            }
        }, interval);
    });
}

module.exports = drag;
drag.waitForDragCover = waitForDragCover;
drag.waitForDragCoverRemoval = waitForDragCoverRemoval;
