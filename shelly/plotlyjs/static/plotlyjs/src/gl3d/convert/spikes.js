'use strict'

module.exports = createSpikeOptions

var AXES_NAMES = ['xaxis', 'yaxis', 'zaxis']

function SpikeOptions() {
    this.enable = [true, true, true];
    this.colors = [[0,0,0,1],
                   [0,0,0,1],
                   [0,0,0,1]];
    this.sides = [true, true, true];
    this.width = [1,1,1];
}

var proto = SpikeOptions.prototype

proto.merge = function(sceneLayout) {
    var opts = this;
    for (var i = 0; i < 3; ++i) {
        var axes = sceneLayout[AXES_NAMES[i]];
    }
}

function createSpikeOptions(layout) {
    var result = new SpikeOptions()
    result.merge(layout)
    return result
}