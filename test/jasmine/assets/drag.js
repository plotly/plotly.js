var mouseEvent = require('../assets/mouse_event');

/*
 * drag: grab a node and drag it (dx, dy) pixels
 * optionally specify an edge ('n', 'se', 'w' etc)
 * to grab it by an edge or corner (otherwise the middle is used)
 */
module.exports = function(node, dx, dy, edge) {

    edge = edge || '';
    var bbox = node.getBoundingClientRect(),
        fromX, fromY;

    if(edge.indexOf('n') !== -1) fromY = bbox.top;
    else if(edge.indexOf('s') !== -1) fromY = bbox.bottom;
    else fromY = (bbox.bottom + bbox.top) / 2;

    if(edge.indexOf('w') !== -1) fromX = bbox.left;
    else if(edge.indexOf('e') !== -1) fromX = bbox.right;
    else fromX = (bbox.left + bbox.right) / 2;


    var toX = fromX + dx,
        toY = fromY + dy;

    mouseEvent('mousemove', fromX, fromY, {element: node});
    mouseEvent('mousedown', fromX, fromY, {element: node});

    var promise = waitForDragCover().then(function(dragCoverNode) {
        mouseEvent('mousemove', toX, toY, {element: dragCoverNode});
        mouseEvent('mouseup', toX, toY, {element: dragCoverNode});
        return waitForDragCoverRemoval();
    });

    return promise;
};

function waitForDragCover() {
    return new Promise(function(resolve) {
        var interval = 5,
            timeout = 5000;

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
        var interval = 5,
            timeout = 5000;

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
