/*
 * get the pixel coordinates of a node on screen
 * optionally specify an edge ('n', 'se', 'w' etc)
 * to return an edge or corner (otherwise the middle is used)
 */
module.exports = function(node, edge) {
    edge = edge || '';
    var bbox = node.getBoundingClientRect(),
        x, y;

    if(edge.indexOf('n') !== -1) y = bbox.top;
    else if(edge.indexOf('s') !== -1) y = bbox.bottom;
    else y = (bbox.bottom + bbox.top) / 2;

    if(edge.indexOf('w') !== -1) x = bbox.left;
    else if(edge.indexOf('e') !== -1) x = bbox.right;
    else x = (bbox.left + bbox.right) / 2;

    return {x: x, y: y};
};
