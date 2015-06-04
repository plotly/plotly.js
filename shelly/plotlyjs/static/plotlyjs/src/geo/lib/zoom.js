'use strict';

/* global d3:false */

function createGeoZoom(geo, geoLayout) {
    var projLayout = geoLayout.projection,
        zoom;

    if(projLayout._isScoped) zoom = zoomScoped;
    else if(projLayout._isClipped) zoom = zoomClipped;
    else zoom = zoomNonClipped;

    // TODO add a conic-specific zoom

    return zoom(geo, projLayout);
}

module.exports = createGeoZoom;


function initZoom(projection, projLayout) {
    var fullScale = projLayout._fullScale;

    return d3.behavior.zoom()
        .translate(projection.translate())
        .scale(projection.scale())
        .scaleExtent([0.5 * fullScale, 100 * fullScale]);  // TODO something smarter?
}

function zoomScoped(geo, projLayout) {
    var projection = geo.projection,
        zoom = initZoom(geo, projLayout);

    function handleZoomstart() {
        d3.select(this).style('cursor', 'pointer');
    }

    function handleZoom() {
        projection
            .scale(d3.event.scale)
            .translate(d3.event.translate);
    }

    function handleZoomend() {
        d3.select(this).style('cursor', 'auto');
    }

    zoom
        .on('zoomstart', handleZoomstart)
        .on('zoom', handleZoom)
        .on('zoomend', handleZoomend);

   return zoom;
}

function zoomNonClipped(geo, projLayout) {
    var projection = geo.projection,
        zoom = initZoom(geo, projLayout);

    var INSIDETOLORANCEPXS = 2;
    
    var mouse0, rotate0, translate0, lastRotate, zoomPoint,
        mouse1, rotate1, point1;

    function position(x) { return projection.invert(x); }

    function outside(x) {
        var pt = projection(position(x));
        return (Math.abs(pt[0] - x[0]) > INSIDETOLORANCEPXS ||
                Math.abs(pt[1] - x[1]) > INSIDETOLORANCEPXS);

        // TODO works, except above the north pole
    }

    function handleZoomstart() {
        d3.select(this).style('cursor', 'pointer');

        mouse0 = d3.mouse(this);
        rotate0 = projection.rotate();
        translate0 = projection.translate();
        lastRotate = rotate0;
        zoomPoint = position(mouse0);
    }

    function handleZoom() {
        mouse1 = d3.mouse(this);

        if(outside(mouse0)) {
            zoom.scale(projection.scale());
            zoom.translate(projection.translate());
            return;
        }

        projection.scale(d3.event.scale);

        // TODO restrict d3.event.translate - how?
        projection.translate([translate0[0], d3.event.translate[1]]);

        if(!zoomPoint) {
            mouse0 = mouse1;
            zoomPoint = position(mouse0);
        }
        else if(position(mouse1)) {
            point1 = position(mouse1);
            rotate1 = [lastRotate[0] + (point1[0] - zoomPoint[0]), rotate0[1]];
            projection.rotate(rotate1);
            lastRotate = rotate1;
        }

        geo.render();
    }

    function handleZoomend() {
        d3.select(this).style('cursor', 'auto');

        // or something like
        // http://www.jasondavies.com/maps/gilbert/
        // ... a little harder with multiple base layers
    }

    zoom
        .on('zoomstart', handleZoomstart)
        .on('zoom', handleZoom)
        .on('zoomend', handleZoomend);

   return zoom;
}

function zoomClipped() {
    // TODO
}
