var click = require('./click');
var getNodeCoords = require('./get_node_coords');
var DBLCLICKDELAY = require('../../../src/plot_api/plot_config').dfltConfig.doubleClickDelay;

/*
 * Double click on a point.
 * You can either specify x,y as pixels, or
 * you can specify node and optionally an edge ('n', 'se', 'w' etc)
 * to grab it by an edge or corner (otherwise the middle is used).
 * You can also pass options for the underlying click, e.g.
 * to specify modifier keys. See `click` function
 * for more info.
 */
module.exports = function doubleClick(x, y, clickOpts) {
    if(typeof x === 'object') {
        var coords = getNodeCoords(x, y);
        x = coords.x;
        y = coords.y;
    }
    return new Promise(function(resolve) {
        click(x, y, clickOpts);

        setTimeout(function() {
            click(x, y, clickOpts);
            setTimeout(function() { resolve(); }, DBLCLICKDELAY / 2);
        }, DBLCLICKDELAY / 2);
    });
};
