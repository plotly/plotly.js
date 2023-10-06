'use strict';

var d3 = require('@plotly/d3');

var Colorscale = require('../../components/colorscale');
var endPlus = require('./end_plus');

module.exports = function makeColorMap(trace) {
    var contours = trace.contours;
    var start = contours.start;
    var end = endPlus(contours);
    var cs = contours.size || 1;
    var nc = Math.floor((end - start) / cs) + 1;
    var extra = contours.coloring === 'lines' ? 0 : 1;
    var cOpts = Colorscale.extractOpts(trace);

    if(!isFinite(cs)) {
        cs = 1;
        nc = 1;
    }

    var scl = cOpts.reversescale ?
        Colorscale.flipScale(cOpts.colorscale) :
        cOpts.colorscale;

    var len = scl.length;
    var domain = new Array(len);
    var range = new Array(len);

    var si, i;

    var zmin0 = cOpts.min;
    var zmax0 = cOpts.max;

    if(contours.coloring === 'heatmap') {
        for(i = 0; i < len; i++) {
            si = scl[i];
            domain[i] = si[0] * (zmax0 - zmin0) + zmin0;
            range[i] = si[1];
        }

        // do the contours extend beyond the colorscale?
        // if so, extend the colorscale with constants
        var zRange = d3.extent([
            zmin0,
            zmax0,
            contours.start,
            contours.start + cs * (nc - 1)
        ]);
        var zmin = zRange[zmin0 < zmax0 ? 0 : 1];
        var zmax = zRange[zmin0 < zmax0 ? 1 : 0];

        if(zmin !== zmin0) {
            domain.splice(0, 0, zmin);
            range.splice(0, 0, range[0]);
        }

        if(zmax !== zmax0) {
            domain.push(zmax);
            range.push(range[range.length - 1]);
        }
    } else {
        var zRangeInput = trace._input && (
            typeof trace._input.zmin === 'number' && typeof trace._input.zmax === 'number'
        );

        // If zmin/zmax are explicitly set, consider case where user specifies a
        // narrower z range than that of the contours start/end.
        if(zRangeInput && (start <= zmin0 || end >= zmax0)) {
            if(start <= zmin0) start = zmin0;
            if(end >= zmax0) end = zmax0;
            nc = Math.floor((end - start) / cs) + 1;
            extra = 0;
        }

        for(i = 0; i < len; i++) {
            si = scl[i];
            domain[i] = (si[0] * (nc + extra - 1) - (extra / 2)) * cs + start;
            range[i] = si[1];
        }

        // Make the colorscale fit the z range except if contours are explicitly
        // set BUT NOT zmin/zmax.
        if(zRangeInput || trace.autocontour) {
            if(domain[0] > zmin0) {
                domain.unshift(zmin0);
                range.unshift(range[0]);
            }
            if(domain[domain.length - 1] < zmax0) {
                domain.push(zmax0);
                range.push(range[range.length - 1]);
            }
        }
    }

    return Colorscale.makeColorScaleFunc(
        {domain: domain, range: range},
        {noNumericCheck: true}
    );
};
