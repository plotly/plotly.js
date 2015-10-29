'use strict';

var Plotly = require('../plotly');

function getDelay(fullLayout) {
    return (fullLayout._hasGL3D || fullLayout._hasGL2D) ? 500 : 0;
}

function getRedrawFunc(gd) {
    return function() {
        var fullLayout = gd._fullLayout;

        // doesn't work presently (and not needed) for polar or 3d
        if(fullLayout._hasGL3D || fullLayout._hasGL2D ||
            (gd.data && gd.data[0] && gd.data[0].r)
        ) return;

        Plotly.Annotations.drawAll(gd);
        Plotly.Legend.draw(gd, fullLayout.showlegend);
        (gd.calcdata || []).forEach(function(d) {
            if(d[0] && d[0].t && d[0].t.cb) d[0].t.cb();
        });
    };
}

var Snapshot = {
    getDelay: getDelay,
    getRedrawFunc: getRedrawFunc,
    clone: require('./cloneplot'),
    toSVG: require('./tosvg'),
    svgToImg: require('./svgtoimg'),
    toImage: require('./toimage')
};

module.exports = Snapshot;
