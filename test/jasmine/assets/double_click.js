var click = require('./click');
var DBLCLICKDELAY = require('@src/plots/cartesian/constants').DBLCLICKDELAY;

module.exports = function doubleClick(x, y) {
    return new Promise(function(resolve) {
        click(x, y);

        setTimeout(function() {
            click(x, y);
            setTimeout(function() { resolve(); }, DBLCLICKDELAY / 2);
        }, DBLCLICKDELAY / 2);
    });
};
