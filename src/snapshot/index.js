'use strict';

var helpers = require('./helpers');

var Snapshot = {
    getDelay: helpers.getDelay,
    getRedrawFunc: helpers.getRedrawFunc,
    clone: require('./cloneplot'),
    toSVG: require('./tosvg'),
    svgToImg: require('./svgtoimg'),
    toImage: require('./toimage'),
    downloadImage: require('./download')
};

module.exports = Snapshot;
