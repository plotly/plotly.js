(function() {
var scatter = window.Plotly.Scatter = {};

scatter.PTS_LINESONLY = 20; // traces with < this many points are by default shown with points and lines, > just get lines

scatter.calc = function(gd,gdc) {
    // verify that data exists, and make scaled data if necessary
    if(!('y' in gdc) && !('x' in gdc)) { return; } // no data!

    var i, cd = [];

    // ignore as much processing as possible (and including in autorange) if trace is not visible
    if(gdc.visible===false) {
        // even if trace is not visible, need to figure out whether there are enough
        // points to trigger auto-no-lines
        if(gdc.mode || ((!gdc.x || gdc.x.length<scatter.PTS_LINESONLY) &&
          (!gdc.y || gdc.y.length<scatter.PTS_LINESONLY))) {
            return [{x:false, y:false}];
        }
        else {
            for(i=0; i<scatter.PTS_LINESONLY+1; i++) { cd.push({x:false, y:false}); }
            return cd;
        }
    }

    var xa = Plotly.Axes.getFromId(gd,gdc.xaxis||'x'),
        ya = Plotly.Axes.getFromId(gd,gdc.yaxis||'y'),
        x = Plotly.Axes.convertOne(gdc,'x',xa),
        y = Plotly.Axes.convertOne(gdc,'y',ya),
        serieslen = Math.min(x.length,y.length);

    // cancel minimum tick spacings (only applies to bars and boxes)
    xa._minDtick = 0;
    ya._minDtick = 0;

    if(x.length>serieslen) { x.splice(serieslen,x.length-serieslen); }
    if(y.length>serieslen) { y.splice(serieslen,y.length-serieslen); }

    // check whether bounds should be tight, padded, extended to zero...
    // most cases both should be padded on both ends, so start with that.
    var xOptions = {padded:true},
        yOptions = {padded:true};
    // include marker size
    if(gdc.mode && gdc.mode.indexOf('markers')!=-1) {
        var markerPad = gdc.marker ? gdc.marker.size : 0;
        markerTrans = function(v) { return (v||6)/1.6; };
        xOptions.ppad = yOptions.ppad = $.isArray(markerPad) ?
            markerPad.map(markerTrans) : markerTrans(markerPad);
    }
    // TODO: text size

    // include zero (tight) and extremes (padded) if fill to zero
    if(gdc.fill=='tozerox' || (gdc.fill=='tonextx' && gd.firstscatter)) {
        xOptions.tozero = true;
    }
    // if no error bars, markers or text, or fill to y=0 remove x padding
    else if((!gdc.error_y || !gdc.error_y.visible) &&
        (['tonexty','tozeroy'].indexOf(gdc.fill)!=-1 ||
        (gdc.mode && gdc.mode.indexOf('markers')==-1 && gdc.mode.indexOf('text')==-1) || // explicit no markers/text
        (!gdc.mode && serieslen>=scatter.PTS_LINESONLY))) { // automatic no markers
            xOptions.padded = false;
            xOptions.ppad = 0;
    }

    // now check for y - rather different logic, though still mostly padded both ends
    // include zero (tight) and extremes (padded) if fill to zero
    if(gdc.fill=='tozeroy' || (gdc.fill=='tonexty' && gd.firstscatter)) {
        yOptions.tozero = true;
    }
    // tight y: any x fill
    else if(['tonextx','tozerox'].indexOf(gdc.fill)!=-1) {
        yOptions.padded = false;
    }

    Plotly.Axes.expand(xa, x, xOptions);
    Plotly.Axes.expand(ya, y, yOptions);

    // create the "calculated data" to plot
    for(i=0;i<serieslen;i++) {
        cd.push(($.isNumeric(x[i]) && $.isNumeric(y[i])) ? {x:x[i],y:y[i]} : {x:false, y:false});
    }
    gd.firstscatter = false;
    return cd;
};

scatter.plot = function(gd,plotinfo,cdscatter) {
    var xa = plotinfo.x,
        ya = plotinfo.y;
    // make the container for scatter plots (so error bars can find them along with bars)
    var scattertraces = plotinfo.plot.selectAll('g.trace.scatter') // <-- select trace group
        .data(cdscatter);
    scattertraces.enter().append('g') // <-- add a trace for each calcdata
        .attr('class','trace scatter')
        .style('stroke-miterlimit',2);

    var prevpts='',tozero,tonext,nexttonext;
    scattertraces.each(function(d){ // <-- now, iterate through arrays of {x,y} objects
        var t=d[0].t; // <-- get trace-wide formatting object
        if(t.visible===false) { return; }
        var i=-1,tr=d3.select(this),pts2='';
        // make the fill-to-zero polyline now, so it shows behind the line
        // have to break out of d3-style here (data-curve attribute) because fill to next
        // puts the fill associated with one trace grouped with the previous
        tozero = (t.fill.substr(0,6)=='tozero' || (t.fill.substr(0,2)=='to' && !prevpts)) ?
            tr.append('polyline').classed('fill',true).attr('data-curve',t.cdcurve) : null;
        // make the fill-to-next polyline now for the NEXT trace, so it shows behind both lines
        // nexttonext was created last time, but tag it with this time's curve
        if(nexttonext) { tonext = nexttonext.attr('data-curve',t.cdcurve); }
        // now make a new nexttonext for next time
        nexttonext = tr.append('polyline')
            .classed('fill',true)
            .attr('data-curve',0);
        var x0,y0,x1,y1;
        x0=y0=x1=y1=null;
        while(i<d.length) {
            var pts='',
                atLeastTwo = false;
            for(i++; i<d.length; i++) {
                var x=xa.c2p(d[i].x),y=ya.c2p(d[i].y);
                if(!$.isNumeric(x)||!$.isNumeric(y)) { break; } // TODO: smart lines going off the edge?
                if(pts) { atLeastTwo = true; }
                pts+=x+','+y+' ';
                if(!$.isNumeric(x0)) { x0=x; y0=y; }
                x1=x; y1=y;
            }
            if(pts) {
                pts2+=pts;
                if(t.mode.indexOf('lines')!=-1 && atLeastTwo) {
                    tr.append('polyline').classed('line',true).attr('points',pts);
                }
            }
        }
        if(pts2) {
            if(tozero) {
                if(t.fill.charAt(t.fill.length-1)=='y') { y0=y1=ya.c2p(0,true); }
                else { x0=x1=xa.c2p(0,true); }
                tozero.attr('points',pts2+x1+','+y1+' '+x0+','+y0);
            }
            else if(t.fill.substr(0,6)=='tonext') {
                var ptsnext = pts2+prevpts;
                if(ptsnext.indexOf(',')!=ptsnext.lastIndexOf(',')) {
                    tonext.attr('points',pts2+prevpts);
                }
            }
            prevpts = pts2.split(' ').reverse().join(' ');
        }
    });

    // remove polylines that didn't get used
    $(gd).find('polyline:not([points])').remove();

    // BUILD SCATTER POINTS
    scattertraces.append('g')
        .attr('class','points')
        .each(function(d){
            var t = d[0].t,
                s = d3.select(this),
                showMarkers = t.mode.indexOf('markers')!=-1,
                showText = t.mode.indexOf('text')!=-1;
            if((!showMarkers && !showText) || t.visible===false) { s.remove(); }
            else {
                if(showMarkers) {
                    s.selectAll('path')
                        .data(Plotly.Lib.identity)
                        .enter().append('path')
                        .call(Plotly.Drawing.translatePoints,xa,ya);
                }
                if(showText) {
                    s.selectAll('text')
                        .data(Plotly.Lib.identity)
                        .enter().append('text')
                        .call(Plotly.Drawing.translatePoints,xa,ya);
                }
            }
        });
};

}()); // end Scatter object definition