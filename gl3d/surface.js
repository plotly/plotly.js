module.exports = Surface;


function Surface (config) {

    this.config = config;

}

var proto = Surface.prototype;

proto.attributes = {
    x: {type: 'data_array'},
    y: {type: 'data_array'},
    z: {type: 'data_array'},
    scene: {
        type: 'sceneid',
        dflt: 'scene'
    },
    color: {}
};
