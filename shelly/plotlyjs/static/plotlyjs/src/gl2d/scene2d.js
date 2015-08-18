'use strict';

function Scene2D(options, fullLayout) {

    console.log('Instantiating Scene2d')

    return null;
}

module.exports = Scene2D;

var proto = Scene2D.prototype;

proto.plot = function(fullData, fullLayout) {

    console.log('Calling Scene2d.plot')
};
