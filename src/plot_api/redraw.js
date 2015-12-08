var Lib = require('../lib');
var plot = require('./plot');

module.exports = redraw;

// convenience function to force a full redraw, mostly for use by plotly.js
function redraw(gd) {
    gd = getGraphDiv(gd);

    if(!Lib.isPlotDiv(gd)) {
        console.log('This element is not a Plotly Plot', gd);
        return;
    }

    gd.calcdata = undefined;
    return plot(gd).then(function () {
        gd.emit('plotly_redraw');
        return gd;
    });
};


function getGraphDiv(gd) {
    var gdElement;

    if(typeof gd === 'string') {
        gdElement = document.getElementById(gd);

        if(gdElement === null) {
            throw new Error('No DOM element with id \'' + gd + '\' exists on the page.');
        }

        return gdElement;
    }
    else if(gd===null || gd===undefined) {
        throw new Error('DOM element provided is null or undefined');
    }

    return gd;  // otherwise assume that gd is a DOM element
}
