(function() {
    'use strict';

    // ---Plotly global modules
    /* global Plotly:false */

    // ---external global dependencies
    /* global d3:false, PNGlib:false, tinycolor:false */

    var heatmap = window.Plotly.Heatmap = {};

    heatmap.attributes = {
        z: {type: 'data_array'},
        transpose: {
            type: 'boolean',
            dflt: false
        },
        xtype: {
            type: 'enumerated',
            values: ['array', 'scaled']
        },
        ytype: {
            type: 'enumerated',
            values: ['array', 'scaled']
        },
        zauto: {
            type: 'boolean',
            dflt: true
        },
        zmin: {
            type: 'number',
            dflt: null
        },
        zmax: {
            type: 'number',
            dflt: null
        },
        colorscale: {
            type: 'colorscale'
        },
        reversescale: {
            type: 'boolean',
            dflt: false
        },
        showscale: {
            type: 'boolean',
            dflt: true
        },
        zsmooth: {
            type: 'enumerated',
            values: ['fast', 'best', false],
            dflt: false
        },
        // Inherited attributes - not used by supplyDefaults, so if there's
        // a better way to do this feel free to change.
        x: {from: 'Scatter'},
        x0: {from: 'Scatter'},
        dx: {from: 'Scatter'},
        y: {from: 'Scatter'},
        y0: {from: 'Scatter'},
        dy: {from: 'Scatter'},
        colorbar: {allFrom: 'Colorbar'}
    };

    heatmap.supplyDefaults = function(traceIn, traceOut, defaultColor, layout) {
        function coerce(attr, dflt) {
            return Plotly.Lib.coerce(traceIn, traceOut, heatmap.attributes, attr, dflt);
        }

        function coerceScatter(attr, dflt) {
            return Plotly.Lib.coerce(traceIn, traceOut, Plotly.Scatter.attributes, attr, dflt);
        }

        if(Plotly.Plots.isHist2D(traceOut.type)) {
            // x, y, z, marker.color, and x0, dx, y0, dy are coerced
            // in Histogram.supplyDefaults
            // (along with histogram-specific attributes)
            Plotly.Histogram.supplyDefaults(traceIn, traceOut);
            if(!traceOut.visible) return;
        }
        else {
            var z = coerce('z');
            if(!z) {
                traceOut.visible = false;
                return;
            }

            coerce('transpose');

            var x = coerceScatter('x'),
                xtype = x ? coerce('xtype', 'array') : 'scaled';
            if(xtype==='scaled') {
                coerceScatter('x0');
                coerceScatter('dx');
            }

            var y = coerceScatter('y'),
                ytype = y ? coerce('ytype', 'array') : 'scaled';
            if(ytype==='scaled') {
                coerceScatter('y0');
                coerceScatter('dy');
            }
        }

        coerce('zauto');
        coerce('zmin');
        coerce('zmax');

        if(!Plotly.Plots.isContour(traceOut.type) || (traceOut.contours||{}).coloring!=='none') {
            coerce('colorscale');
            var reverseScale = coerce('reversescale'),
                showScale = coerce('showscale');

            // apply the colorscale reversal here, so we don't have to
            // do it in separate modules later
            if(reverseScale) {
                traceOut.colorscale = traceOut.colorscale.map(flipScale).reverse();
            }

            if(showScale) {
                Plotly.Colorbar.supplyDefaults(traceIn, traceOut, defaultColor, layout);
            }
        }

        if(!Plotly.Plots.isContour(traceOut.type) || (traceOut.contours||{}).coloring==='heatmap') {
            coerce('zsmooth');
        }

    };

    function flipScale(si){ return [1 - si[0], si[1]]; }

    heatmap.calc = function(gd, trace) {
        // prepare the raw data
        // run makeCalcdata on x and y even for heatmaps, in case of category mappings
        Plotly.Lib.markTime('start convert x&y');
        var xa = Plotly.Axes.getFromId(gd, trace.xaxis||'x'),
            ya = Plotly.Axes.getFromId(gd, trace.yaxis||'y'),
            x,
            x0,
            dx,
            y,
            y0,
            dy,
            z,
            i;

        // cancel minimum tick spacings (only applies to bars and boxes)
        xa._minDtick = 0;
        ya._minDtick = 0;

        Plotly.Lib.markTime('done convert x&y');

        if(Plotly.Plots.isHist2D(trace.type)) {
            var binned = Plotly.Histogram.calc2d(gd, trace);
            x = binned.x;
            x0 = binned.x0;
            dx = binned.dx;
            y = binned.y;
            y0 = binned.y0;
            dy = binned.dy;
            z = binned.z;
        }
        else {
            x = trace.x ? xa.makeCalcdata(trace, 'x') : [];
            x0 = trace.x0||0;
            dx = trace.dx||1;

            y = trace.y ? ya.makeCalcdata(trace, 'y') : [];
            y0 = trace.y0||0;
            dy = trace.dy||1;

            if(trace.transpose) {
                var maxcols = Plotly.Lib.aggNums(Math.max,0,
                        trace.z.map(function(r){return r.length;}));
                z = [];
                for(var c=0; c<maxcols; c++) {
                    var newrow = [];
                    for(var r=0; r<trace.z.length; r++) {
                        newrow.push(cleanZ(trace.z[r][c]));
                    }
                    z.push(newrow);
                }
            }
            else z = trace.z.map(function(row){return row.map(cleanZ); });
        }

        // check whether we really can smooth (ie all boxes are about the same size)
        if([true,'fast'].indexOf(trace.zsmooth)!==-1) {
            if(xa.type==='log' || ya.type==='log') {
                trace._input.zsmooth = trace.zsmooth = false;
                Plotly.Lib.notifier('cannot fast-zsmooth: log axis found');
            }
            else if(!Plotly.Plots.isHist2D(trace.type)) {
                if(x.length) {
                    var avgdx = (x[x.length-1]-x[0]) / (x.length-1),
                        maxErrX = Math.abs(avgdx/100);
                    for(i=0; i<x.length-1; i++) {
                        if(Math.abs(x[i+1]-x[i]-avgdx)>maxErrX) {
                            trace._input.zsmooth = trace.zsmooth = false;
                            Plotly.Lib.notifier('cannot fast-zsmooth: x scale is not linear');
                            break;
                        }
                    }
                }
                if(y.length && [true,'fast'].indexOf(trace.zsmooth)!==-1) {
                    var avgdy = (y[y.length-1]-y[0])/(y.length-1),
                    maxErrY = Math.abs(avgdy/100);
                    for(i=0; i<y.length-1; i++) {
                        if(Math.abs(y[i+1]-y[i]-avgdy)>maxErrY) {
                            trace._input.zsmooth = trace.zsmooth = false;
                            Plotly.Lib.notifier('cannot fast-zsmooth: y scale is not linear');
                            break;
                        }
                    }
                }
            }
        }

        // create arrays of brick boundaries, to be used by autorange and heatmap.plot
        var xlen = Plotly.Lib.aggNums(Math.max,null,
                z.map(function(row) { return row.length; })),
            xIn = trace.xtype==='scaled' ? '' : trace.x,
            xArray = makeBoundArray(trace.type, xIn, x0, dx, xlen, xa),
            yIn = trace.ytype==='scaled' ? '' : trace.y,
            yArray = makeBoundArray(trace.type, yIn, y0, dy, z.length, ya);
        Plotly.Axes.expand(xa, xArray);
        Plotly.Axes.expand(ya, yArray);

        var cd0 = {x: xArray, y: yArray, z: z};

        // auto-z for heatmap
        if(trace.zauto!==false || !('zmin' in trace)) {
            trace.zmin = Plotly.Lib.aggNums(Math.min, null, z);
        }

        if(trace.zauto!==false || !('zmax' in trace)) {
            trace.zmax = Plotly.Lib.aggNums(Math.max, null, z);
        }

        if(trace.zmin===trace.zmax) {
            trace.zmin -= 0.5;
            trace.zmax += 0.5;
        }

        trace._input.zmin = trace.zmin;
        trace._input.zmax = trace.zmax;

        if(Plotly.Plots.isContour(trace.type) && trace.contours &&
                trace.contours.coloring==='heatmap') {
            var hmtype = trace.type==='contour' ? 'heatmap' : 'histogram2d';
            cd0.xfill = makeBoundArray(hmtype, xIn, x0, dx, xlen, xa);
            cd0.yfill = makeBoundArray(hmtype, yIn, y0, dy, z.length, ya);
        }

        return [cd0];
    };

    function cleanZ(v) {
        if(!v && v!==0) return null;
        return Number(v);
    }

    function makeBoundArray(type, arrayIn, v0In, dvIn, numbricks, ax) {
        var arrayOut = [], v0, dv, i;
        if($.isArray(arrayIn) && (!Plotly.Plots.isHist2D(type)) && (ax.type!=='category')) {
            arrayIn = arrayIn.map(ax.d2c);
            var len = arrayIn.length;

            // given vals are brick centers
            if(len===numbricks) {
                // contour plots only want the centers
                if(Plotly.Plots.isContour(type)) return arrayIn.slice(0,numbricks);
                if(numbricks===1) return [arrayIn[0]-0.5,arrayIn[0]+0.5];
                else {
                    arrayOut = [1.5*arrayIn[0]-0.5*arrayIn[1]];
                    for(i=1; i<len; i++) {
                        arrayOut.push((arrayIn[i-1] + arrayIn[i])*0.5);
                    }
                    arrayOut.push(1.5*arrayIn[len-1] - 0.5*arrayIn[len-2]);
                }
            }
            // hopefully length==numbricks+1, but do something regardless:
            // given vals are brick boundaries
            else return arrayIn.slice(0, numbricks+1);
        }
        else {
            dv = dvIn || 1;
            if(v0In===undefined) v0 = 0;
            else if(Plotly.Plots.isHist2D(type) || ax.type==='category') {
                v0 = v0In;
            }
            else v0 = ax.d2c(v0In);

            if(Plotly.Plots.isContour(type)) {
                for(i=0; i<numbricks; i++) arrayOut.push(v0+dv*i);
            }
            else {
                for(i=0; i<=numbricks; i++) arrayOut.push(v0+dv*(i-0.5));
            }
        }
        return arrayOut;
    }

    // From http://www.xarg.org/2010/03/generate-client-side-png-files-using-javascript/
    heatmap.plot = function(gd, plotinfo, cdheatmaps) {
        cdheatmaps.forEach(function(cd) { plotOne(gd, plotinfo, cd); });
    };

    function plotOne(gd, plotinfo, cd) {
        Plotly.Lib.markTime('in Heatmap.plot');
        var trace = cd[0].trace,
            uid = trace.uid,
            xa = plotinfo.x(),
            ya = plotinfo.y(),
            fullLayout = gd._fullLayout,
            id = 'hm' + uid,
            cbId = 'cb' + uid;

        fullLayout._paper.selectAll('.contour'+uid).remove(); // in case this used to be a contour map

        if(!trace.visible) {
            fullLayout._paper.selectAll('.'+id).remove();
            fullLayout._paper.selectAll('.'+cbId).remove();
            return;
        }

        var z = cd[0].z,
            min = trace.zmin,
            max = trace.zmax,
            scl = Plotly.Color.getScale(trace.colorscale),
            x = cd[0].x,
            y = cd[0].y,
            // fast smoothing - one pixel per brick
            fastsmooth = [true,'fast'].indexOf(trace.zsmooth)!==-1,

            // get z dims (n gets max row length, in case of uneven rows)
            m = z.length,
            n = Plotly.Lib.aggNums(Math.max,null,
                z.map(function(row) { return row.length; })),
            xrev = false,
            left,
            right,
            temp,
            yrev = false,
            top,
            bottom,
            i;

        // TODO: if there are multiple overlapping categorical heatmaps,
        // or if we allow category sorting, then the categories may not be
        // sequential... may need to reorder and/or expand z

        // Get edges of png in pixels (xa.c2p() maps axes coordinates to pixel coordinates)
        // figure out if either axis is reversed (y is usually reversed, in pixel coords)
        // also clip the image to maximum 50% outside the visible plot area
        // bigger image lets you pan more naturally, but slows performance.
        // TODO: use low-resolution images outside the visible plot for panning
        // these while loops find the first and last brick bounds that are defined
        // (in case of log of a negative)
        i=0;
        while(left===undefined && i<x.length-1) {
            left=xa.c2p(x[i]);
            i++;
        }
        i=x.length-1;
        while(right===undefined && i>0) {
            right=xa.c2p(x[i]);
            i--;
        }

        if(right<left) {
            temp = right;
            right = left;
            left = temp;
            xrev = true;
        }

        i=0;
        while(top===undefined && i<y.length-1) {
            top=ya.c2p(y[i]);
            i++;
        }
        i=y.length-1;
        while(bottom===undefined && i>0) {
            bottom=ya.c2p(y[i]);
            i--;
        }

        if(bottom<top) {
            temp = top;
            top = bottom;
            bottom = temp;
            yrev = true;
        }

        // for contours with heatmap fill, we generate the boundaries based on
        // brick centers but then use the brick edges for drawing the bricks
        if(Plotly.Plots.isContour(trace.type)) {
            // TODO: for 'best' smoothing, we really should use the given brick
            // centers as well as brick bounds in calculating values, in case of
            // nonuniform brick sizes
            x = cd[0].xfill;
            y = cd[0].yfill;
        }

        // make an image that goes at most half a screen off either side, to keep
        // time reasonable when you zoom in. if zsmooth is true/fast, don't worry
        // about this, because zooming doesn't increase number of pixels
        // if zsmooth is best, don't include anything off screen because it takes too long
        if(!fastsmooth) {
            var extra = trace.zsmooth==='best' ? 0 : 0.5;
            left = Math.max(-extra*xa._length,left);
            right = Math.min((1+extra)*xa._length,right);
            top = Math.max(-extra*ya._length,top);
            bottom = Math.min((1+extra)*ya._length,bottom);
        }

        var wd=Math.round(right-left),
            ht=Math.round(bottom-top);

        // now redraw

        // if image is entirely off-screen, don't even draw it
        if(wd<=0 || ht<=0) return;

        var p = fastsmooth ? new PNGlib(n,m,256) : new PNGlib(wd,ht, 256);

        // interpolate for color scale
        // https://github.com/mbostock/d3/wiki/Quantitative-Scales
        // http://nelsonslog.wordpress.com/2011/04/11/d3-scales-and-interpolation/

        var s = d3.scale.linear()
            .domain(scl.map(function(si){ return si[0]*255; }))
            .interpolate(d3.interpolateRgb)
            .range(scl.map(function(si){ return si[1]; }));

        // map brick boundaries to image pixels
        var xpx,ypx;
        if(fastsmooth) {
            xpx = xrev ? function(index){ return n-1-index; } : Plotly.Lib.identity;
            ypx = yrev ? function(index){ return m-1-index; } : Plotly.Lib.identity;
        }
        else {
            xpx = function(index){ return Plotly.Lib.constrain(Math.round(xa.c2p(x[index])-left),0,wd); };
            ypx = function(index){ return Plotly.Lib.constrain(Math.round(ya.c2p(y[index])-top),0,ht); };
        }

        // get interpolated bin value. Returns {bin0:closest bin, frac:fractional dist to next, bin1:next bin}
        function findInterp(pixel,pixArray) {
            var maxbin = pixArray.length-2,
                bin = Plotly.Lib.constrain(Plotly.Lib.findBin(pixel,pixArray),0,maxbin),
                pix0 = pixArray[bin],
                pix1 = pixArray[bin+1],
                interp = Plotly.Lib.constrain(bin+(pixel-pix0)/(pix1-pix0)-0.5,0,maxbin),
                bin0 = Math.round(interp),
                frac = Math.abs(interp-bin0);
            if(!interp || interp===maxbin || !frac) {
                return {
                    bin0: bin0,
                    bin1: bin0,
                    frac: 0
                };
            }
            return {
                bin0: bin0,
                frac: frac,
                bin1: Math.round(bin0+frac/(interp-bin0))
            };
        }

        // create a color in the png color table
        // save p.color and luminosity each time we calculate anew, because
        // these are the slowest parts
        var colors = {};
        // non-numeric shows as transparent TODO: make this an option
        colors[256] = p.color(0,0,0,0);
        function setColor(v,pixsize) {
            if($.isNumeric(v)) {
                // get z-value, scale for 8-bit color by rounding z to an integer 0-254
                // (one value reserved for transparent (missing/non-numeric data)
                var vr = Plotly.Lib.constrain(Math.round((v-min)*254/(max-min)),0,254),
                    c = s(vr);
                pixcount += pixsize;
                if(!colors[vr]) {
                    colors[vr] = [
                        tinycolor(c).toHsl().l,
                        p.color('0x'+c.substr(1,2),'0x'+c.substr(3,2),'0x'+c.substr(5,2))
                    ];
                }
                lumcount += pixsize*colors[vr][0];
                return colors[vr][1];
            }
            else return colors[256];
        }

        Plotly.Lib.markTime('done init png');
        // build the pixel map brick-by-brick
        // cruise through z-matrix row-by-row
        // build a brick at each z-matrix value
        var yi=ypx(0),
            yb=[yi,yi],
            xbi = xrev?0:1,
            ybi = yrev?0:1,
            // for collecting an average luminosity of the heatmap
            pixcount = 0,
            lumcount = 0,
            xb,
            j,
            xi,
            pc,
            v,
            row;
        if(trace.zsmooth==='best') {
            //first make arrays of x and y pixel locations of brick boundaries
            var xPixArray = x.map(function(v){ return Math.round(xa.c2p(v)-left); }),
                yPixArray = y.map(function(v){ return Math.round(ya.c2p(v)-top); }),
            // then make arrays of interpolations
            // (bin0=closest, bin1=next, frac=fractional dist.)
                xinterpArray = [],
                yinterpArray=[],
                xinterp,
                yinterp,
                r0,
                r1,
                z00,
                z10,
                z01,
                z11;
            for(i=0; i<wd; i++) { xinterpArray.push(findInterp(i,xPixArray)); }
            for(j=0; j<ht; j++) { yinterpArray.push(findInterp(j,yPixArray)); }
            // now do the interpolations and fill the png
            for(j=0; j<ht; j++) {
                yinterp = yinterpArray[j];
                r0 = z[yinterp.bin0];
                r1 = z[yinterp.bin1];
                if(!r0 || !r1) console.log(j,yinterp,z);
                for(i=0; i<wd; i++) {
                    xinterp = xinterpArray[i];
                    z00 = r0[xinterp.bin0];
                    if(!$.isNumeric(z00)) pc = setColor(null,1);
                    else {
                        z01 = r0[xinterp.bin1];
                        z10 = r1[xinterp.bin0];
                        z11 = r1[xinterp.bin1];
                        if(!$.isNumeric(z01)) z01 = z00;
                        if(!$.isNumeric(z10)) z10 = z00;
                        if(!$.isNumeric(z11)) z11 = z00;
                        pc = setColor( z00 + xinterp.frac*(z01-z00) +
                            yinterp.frac*((z10-z00) + xinterp.frac*(z00+z11-z01-z10)) );
                    }
                    p.buffer[p.index(i,j)] = pc;
                }
            }
        }
        else if(fastsmooth) {
            for(j=0; j<m; j++) {
                row = z[j];
                yb = ypx(j);
                for(i=0; i<n; i++) {
                    p.buffer[p.index(xpx(i),yb)] = setColor(row[i],1);
                }
            }
        }
        else {
            for(j=0; j<m; j++) {
                row = z[j];
                yb.reverse();
                yb[ybi] = ypx(j+1);
                if(yb[0]===yb[1] || yb[0]===undefined || yb[1]===undefined) {
                    continue;
                }
                xi=xpx(0);
                xb=[xi, xi];
                for(i=0; i<n; i++) {
                    // build one color brick!
                    xb.reverse();
                    xb[xbi] = xpx(i+1);
                    if(xb[0]===xb[1] || xb[0]===undefined || xb[1]===undefined) {
                        continue;
                    }
                    v=row[i];
                    pc = setColor(v, (xb[1]-xb[0])*(yb[1]-yb[0]));
                    for(xi=xb[0]; xi<xb[1]; xi++) {
                        for(yi=yb[0]; yi<yb[1]; yi++) {
                            p.buffer[p.index(xi, yi)] = pc;
                        }
                    }
                }
            }
        }
        Plotly.Lib.markTime('done filling png');
        gd._hmpixcount = (gd._hmpixcount||0) + pixcount;
        gd._hmlumcount = (gd._hmlumcount||0) + lumcount;

        // http://stackoverflow.com/questions/6249664/does-svg-support-embedding-of-bitmap-images
        // https://groups.google.com/forum/?fromgroups=#!topic/d3-js/aQSWnEDFxIc
        var imgstr = 'data:image/png;base64,\n' + p.getBase64();
        // put this right before making the new image, to minimize flicker
        fullLayout._paper.selectAll('.'+id).remove();
        plotinfo.plot.select('.maplayer').append('svg:image')
            .classed(id, true)
            .datum(cd[0])
            .attr({
                xmlns:'http://www.w3.org/2000/svg',
                'xlink:xlink:href':imgstr, // odd d3 quirk, need namespace twice
                height:ht,
                width:wd,
                x:left,
                y:top,
                preserveAspectRatio:'none'
            });

        Plotly.Lib.markTime('done showing png');
    }

    heatmap.colorbar = function(gd,cd) {
        var trace = cd[0].trace,
            cbId = 'cb'+trace.uid,
            scl = Plotly.Color.getScale(trace.colorscale),
            zmin = trace.zmin,
            zmax = trace.zmax;

        if (!$.isNumeric(zmin)) zmin = Plotly.Lib.aggNums(Math.min, null, trace.z);
        if (!$.isNumeric(zmax)) zmax = Plotly.Lib.aggNums(Math.max, null, trace.z);

        gd._fullLayout._infolayer.selectAll('.'+cbId).remove();
        if(!trace.showscale){
            Plotly.Plots.autoMargin(gd, cbId);
            return;
        }

        var cb = cd[0].t.cb = Plotly.Colorbar(gd,cbId);
        cb.fillcolor(d3.scale.linear()
                .domain(scl.map(function(v){ return zmin + v[0]*(zmax-zmin); }))
                .range(scl.map(function(v){ return v[1]; })))
            .filllevels({start: zmin, end: zmax, size: (zmax-zmin)/254})
            .options(trace.colorbar)();
        Plotly.Lib.markTime('done colorbar');
    };

    heatmap.style = function(gp) {
        gp.selectAll('image').style('opacity',function(d){ return d.trace.opacity; });
    };

}()); // end Heatmap object definition
