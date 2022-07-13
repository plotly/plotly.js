'use strict';

var Lib = require('../../lib');


module.exports = function hasColorbar(container) {
    return Lib.isPlainObject(container.colorbar);
};
