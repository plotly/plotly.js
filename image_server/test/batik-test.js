'use strict';


var Batik = require('../server_app/batik');
var jarfile = '/usr/local/bin/batik-1.7/batik-rasterizer.jar';
var bat = new Batik(jarfile);
var svg = require('./mockSVG');

bat.on('ready', function () {
    var converter = bat.svgConverter();
    
    converter.on('success', function (img) {
        console.log('success', img);
    });

    converter.on('error', function (err) {
        console.log(err);
    });

    converter.convert(svg, 'eps');    
});



