var click = require('./click');
var getNodeCoords = require('./get_node_coords');
var DBLCLICKDELAY = require('../../../src/constants/interactions').DBLCLICKDELAY;

/*
 * double click on a point.
 * you can either specify x,y as pixels, or
 * you can specify node and optionally an edge ('n', 'se', 'w' etc)
 * to grab it by an edge or corner (otherwise the middle is used)
 */
module.exports = function doubleClick(x, y) {
    if(typeof x === 'object') {
        var coords = getNodeCoords(x, y);
        x = coords.x;
        y = coords.y;
    }
    return new Promise(function(resolve) {
        click(x, y);

        setTimeout(function() {
            click(x, y);
            setTimeout(function() { resolve(); }, DBLCLICKDELAY / 2);
        }, DBLCLICKDELAY / 2);
    });
};
