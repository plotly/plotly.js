'use strict';

module.exports = function destroyGraphDiv() {
    var gd = document.getElementById('graph');

    if(gd) document.body.removeChild(gd);
};
