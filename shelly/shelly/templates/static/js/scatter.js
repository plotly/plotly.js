(function() {
var scatter = window.Plotly.Scatter = {};

scatter.PTS_LINESONLY = 20; // traces with < this many points are by default shown with points and lines, > just get lines

scatter.calc = function(gd,gdc) {
    // verify that data exists, and make scaled data if necessary
    if(!('y' in gdc) && !('x' in gdc)) { return; } // no data!

    var cd = [];

    // ignore as much processing as possible (and including in autorange) if trace is not visible
    if(gdc.visible!==false) {

        var xa = gd.layout.xaxis,
            ya = gd.layout.yaxis,
            x = Plotly.Axes.convertOne(gdc,'x',xa),
            y = Plotly.Axes.convertOne(gdc,'y',ya),
            serieslen = Math.min(x.length,y.length);

        // check whether x bounds should be tight or padded
        // regardless of everything else, y errorbars mean x should be padded
        if(gdc.error_y && gdc.error_y.visible) {
            Plotly.Axes.expandBounds(xa,xa._padded,x,serieslen);
        }
        // include zero (tight) and extremes (padded) if fill to zero
        else if(gdc.fill=='tozerox' || (gdc.fill=='tonextx' && gd.firstscatter)) {
            Plotly.Axes.expandWithZero(xa,x,serieslen);
        }
        // tight x: any y fill, or no markers or text
        else if(['tonexty','tozeroy'].indexOf(gdc.fill)!=-1 ||
          (gdc.mode && gdc.mode.indexOf('markers')==-1 && gdc.mode.indexOf('text')==-1) || // explicit no markers/text
          (!gdc.mode && serieslen>=scatter.PTS_LINESONLY)) { // automatic no markers
            Plotly.Axes.expandBounds(xa,xa._tight,x,serieslen);
        }
        // otherwise both ends padded
        else { Plotly.Axes.expandBounds(xa,xa._padded,x,serieslen); }

        // now check for y - rather different logic
        // include zero (tight) and extremes (padded) if fill to zero
        if(gdc.fill=='tozeroy' || (gdc.fill=='tonexty' && gd.firstscatter)) {
            Plotly.Axes.expandWithZero(ya,y,serieslen);
        }
        // tight y: any x fill
        else if(['tonextx','tozerox'].indexOf(gdc.fill)!=-1) {
            Plotly.Axes.expandBounds(ya,ya._tight,y,serieslen);
        }
        // otherwise both ends padded - whether or not there are markers
        else { Plotly.Axes.expandBounds(ya,ya._padded,y,serieslen); }

        // create the "calculated data" to plot
        for(i=0;i<serieslen;i++) {
            cd.push(($.isNumeric(x[i]) && $.isNumeric(y[i])) ? {x:x[i],y:y[i]} : {x:false, y:false});
        }
        gd.firstscatter = false;
        return cd;
    }
    // even if trace is not visible, need to figure out whether there are enough points to trigger auto-no-lines
    else if(gdc.mode || ((!gdc.x || gdc.x.length<scatter.PTS_LINESONLY) &&
      (!gdc.y || gdc.y.length<scatter.PTS_LINESONLY))) {
        return [{x:false, y:false}];
    }
    else {
        for(i=0; i<scatter.PTS_LINESONLY+1; i++) { cd.push({x:false, y:false}); }
        return cd;
    }

};

scatter.plot = function(gd,cdscatter) {
    var xa = gd.layout.xaxis,
        ya = gd.layout.yaxis;
    // make the container for scatter plots (so error bars can find them along with bars)
    var scattertraces = gd.plot.selectAll('g.trace.scatter') // <-- select trace group
        .data(cdscatter) // <-- bind calcdata to traces
      .enter().append('g') // <-- add a trace for each calcdata
        .attr('class','trace scatter');


    // BUILD SCATTER LINES AND FILL
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
            var pts='';
            for(i++; i<d.length; i++) {
                var x=xa.c2p(d[i].x),y=ya.c2p(d[i].y);
                if(!$.isNumeric(x)||!$.isNumeric(y)) { break; } // TODO: smart lines going off the edge?
                pts+=x+','+y+' ';
                if(!$.isNumeric(x0)) { x0=x; y0=y; }
                x1=x; y1=y;
            }
            if(pts) {
                pts2+=pts;
                if(t.mode.indexOf('lines')!=-1) {
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
                tonext.attr('points',pts2+prevpts);
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