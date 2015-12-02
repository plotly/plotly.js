'use strict';

module.exports = function destroyGraphDiv() {
    var gd = document.getElementById('graph');
    document.body.removeChild(gd);
};
