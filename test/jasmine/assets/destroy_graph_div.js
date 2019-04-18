'use strict';

module.exports = function() {
    var gd = document.getElementById('graph');

    if(gd) document.body.removeChild(gd);
};
