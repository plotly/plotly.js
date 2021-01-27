'use strict';

var probeSync = require('probe-image-size/sync');
var dataUri = require('../../snapshot/helpers').IMAGE_URL_PREFIX;
var Buffer = require('buffer/').Buffer;  // note: the trailing slash is important!

exports.getImageSize = function(src) {
    var data = src.replace(dataUri, '');
    var buff = new Buffer(data, 'base64');
    return probeSync(buff);
};
