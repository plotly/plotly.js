'use strict';

module.exports = function createGraphDiv() {
    var gd = document.createElement('div');
    gd.id = 'graph';
    document.body.appendChild(gd);
    return gd;
};
