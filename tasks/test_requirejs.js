var JSDOM = require('jsdom').JSDOM;
global.document = new JSDOM('<!DOCTYPE html><head></head><html><body></body></html>').window.document;
global.window = document.defaultView;
global.window.document = global.document;
global.self = global.window;
global.Blob = global.window.Blob;
global.DOMParser = global.window.DOMParser;
global.getComputedStyle = global.window.getComputedStyle;
global.window.URL.createObjectURL = function() {};

var requirejs = require('requirejs');

requirejs.config({
    paths: {
        'plotly': '../dist/plotly.min'
    }
});

requirejs(['plotly'],
function(plotly) {
    if(plotly && plotly.PlotSchema) {
        console.log(plotly);
    } else {
        throw 'Error: loading with requirejs';
    }
});
