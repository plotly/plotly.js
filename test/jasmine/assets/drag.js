var mouseEvent = require('./mouse_event');
var getNodeCoords = require('./get_node_coords');

/*
 * drag: grab a node and drag it (dx, dy) pixels
 * optionally specify an edge ('n', 'se', 'w' etc)
 * to grab it by an edge or corner (otherwise the middle is used)
 */
module.exports = function(node, dx, dy, edge) {
  var coords = getNodeCoords(node, edge);
  var fromX = coords.x;
  var fromY = coords.y;

  var toX = fromX + dx;
  var toY = fromY + dy;

  mouseEvent('mousemove', fromX, fromY, { element: node });
  mouseEvent('mousedown', fromX, fromY, { element: node });

  var promise = waitForDragCover().then(function(dragCoverNode) {
    mouseEvent('mousemove', toX, toY, { element: dragCoverNode });
    mouseEvent('mouseup', toX, toY, { element: dragCoverNode });
    return waitForDragCoverRemoval();
  });

  return promise;
};

function waitForDragCover() {
  return new Promise(function(resolve) {
    var interval = 5, timeout = 5000;

    var id = setInterval(function() {
      var dragCoverNode = document.querySelector('.dragcover');
      if (dragCoverNode) {
        clearInterval(id);
        resolve(dragCoverNode);
      }

      timeout -= interval;
      if (timeout < 0) {
        clearInterval(id);
        throw new Error('waitForDragCover: timeout');
      }
    }, interval);
  });
}

function waitForDragCoverRemoval() {
  return new Promise(function(resolve) {
    var interval = 5, timeout = 5000;

    var id = setInterval(function() {
      var dragCoverNode = document.querySelector('.dragcover');
      if (!dragCoverNode) {
        clearInterval(id);
        resolve(dragCoverNode);
      }

      timeout -= interval;
      if (timeout < 0) {
        clearInterval(id);
        throw new Error('waitForDragCoverRemoval: timeout');
      }
    }, interval);
  });
}
