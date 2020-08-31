'use strict';

module.exports = function destroyGraphDiv(id) {
    id = (id === undefined) ? 'graph' : id;
    var gd = document.getElementById(id);

    if(gd) document.body.removeChild(gd);
};
