'use strict';

module.exports = function destroyGraphDiv() {
    // remove both plain graphs and shadow DOM graph containers
    ['graph', 'shadowcontainer'].forEach(function(id) {
        var el = document.getElementById(id);
        if(el) document.body.removeChild(el);
    });
};
