'use strict';

module.exports = function createGraphDiv() {
    var gd = document.createElement('div');
    gd.id = 'graph';
    document.body.appendChild(gd);

    var closedCaptions = document.createElement('div');
    closedCaptions.id = 'c2m-plotly-cc';
    closedCaptions.className = 'c2m-plotly-closed_captions';
    document.body.appendChild(closedCaptions); // this does get generated

    // force the graph to be at position 0,0 no matter what
    gd.style.position = 'fixed';
    gd.style.left = 0;
    gd.style.top = 0;

    return gd;
};
