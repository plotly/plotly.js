var isNumeric = require('fast-isnumeric');
var mouseEvent = require('./mouse_event');
var getNodeCoords = require('./get_node_coords');

function makeFns(node, dx, dy, opts) {
    opts = opts || {};

    var nsteps = opts.nsteps || 1;
    var edge = opts.edge || '';
    var noCover = Boolean(opts.noCover);

    var coords = getNodeCoords(node, edge);
    var fromX = isNumeric(opts.x0) ? opts.x0 : coords.x;
    var fromY = isNumeric(opts.y0) ? opts.y0 : coords.y;

    var dragCoverNode;
    var toX;
    var toY;

    function start() {
        mouseEvent('mousemove', fromX, fromY, {element: node});
        mouseEvent('mousedown', fromX, fromY, {element: node});

        return (noCover ? Promise.resolve(node) : waitForDragCover())
        .then(function(_dragCoverNode) {
            dragCoverNode = _dragCoverNode;

            for(var i = 1; i <= nsteps; i++) {
                toX = fromX + i * dx / nsteps;
                toY = fromY + i * dy / nsteps;
                mouseEvent('mousemove', toX, toY, {element: dragCoverNode});
            }
        });
    }

    function end() {
        mouseEvent('mouseup', toX, toY, {element: dragCoverNode});
        return noCover || waitForDragCoverRemoval();
    }

    return {
        start: start,
        end: end
    };
}

/*
 * drag: grab a node and drag it (dx, dy) pixels
 * optionally specify an edge ('n', 'se', 'w' etc)
 * to grab it by an edge or corner (otherwise the middle is used)
 */
function drag(node, dx, dy, edge, x0, y0, nsteps, noCover) {
    var fns = makeFns(node, dx, dy, {
        edge: edge,
        x0: x0,
        y0: y0,
        nsteps: nsteps,
        noCover: noCover
    });

    return fns.start().then(fns.end);
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
drag.makeFns = makeFns;
drag.waitForDragCover = waitForDragCover;
drag.waitForDragCoverRemoval = waitForDragCoverRemoval;
