var JSDOM = require('jsdom').JSDOM;
global.document = new JSDOM('<!DOCTYPE html><head></head><html><body></body></html>').window.document;
global.window = document.defaultView;
global.window.document = global.document;
global.self = global.window;
global.Blob = global.window.Blob;
global.DOMParser = global.window.DOMParser;
global.getComputedStyle = global.window.getComputedStyle;
global.window.URL.createObjectURL = function() {};

// see: Building node modules with AMD or RequireJS https://requirejs.org/docs/node.html
if(typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require) {
    var plotly = require('../dist/plotly.min.js');

    if(plotly && plotly.PlotSchema) {
        console.log(plotly);
    } else {
        throw 'Error: loading with amdefine';
    }

    // The value returned from the function is
    // used as the module export visible to Node.
    return function() {};
});
