(function() {
var contour = window.Plotly.Contour = {};

// contour maps use heatmap.calc but have their own plot function

// Creates a contour map image from a z matrix and embeds adds it to svg plot
// Example usage:
// plot(gd, [{'type':'heatmap','z':[[1,2],[3,4]], 'x0':2, 'y0':2, 'dx':0.5, 'dy':0.5}])
// From http://www.xarg.org/2010/03/generate-client-side-png-files-using-javascript/
contour.plot = function(gd,plotinfo,cd) {
    Plotly.Lib.markTime('in Contour.plot');
    var t = cd[0].t,
        i = t.curve,
        xa = plotinfo.x,
        ya = plotinfo.y,
        gl = gd.layout;

    var id='contour'+i; // heatmap id
    var cb_id='cb'+i; // colorbar id

    if(t.visible===false) {
        gl._paper.selectAll('.'+id).remove();
        gl._paper.selectAll('.'+cb_id).remove();
        return;
    }

    var z=cd[0].z, min=t.zmin, max=t.zmax, scl=Plotly.Plots.getScale(cd[0].t.scl), x=cd[0].x, y=cd[0].y;
    // get z dims
    var m=z.length, n=z[0].length; // num rows, cols

    // find all the contours at once
    // since we want to be exhaustive we'll check for contour crossings at every intersection
    // using a modified marching squares algorithm, so we disambiguate the saddle points from the start
    // and we ignore the cases with no crossings
    // the index I'm using is based on http://en.wikipedia.org/wiki/Marching_squares
    // except that the saddles bifurcate:
    function getMarchingIndex(val,corners) {
        var mi = (corners[0][0]>val ? 0:1) +
                 (corners[0][1]>val ? 0:2) +
                 (corners[1][1]>val ? 0:4) +
                 (corners[1][0]>val ? 0:8);
        if(mi==5||mi==10) {
            var avg = (corners[0][0]+corners[0][1]+corners[1][0]+corners[1][1])/4;
            if(val>avg) {
                // two peaks with a big valley
                if(mi==5) { return 713; } // ie conceptually a combo of 7 and 13
                return 1114; // ie conceptually combo of 11 and 14
            }
            else {
                // two valleys with a big ridge
                if(mi==5) { return 104; } // ie conceptually combo of 1 and 4
                return 208; // ie conceptually a combo of 2 and 8
            }
        }
        return mi;
    }
    var contours = [], // the levels we're drawing
        crossings = [], // all the cells with nontrivial marching index at each crossing
        starts = [], // starting points on the edges of the lattice for each contour
                     // we'll first follow all such paths, then we'll pick starting points
                     // at random for the closed loops
        paths = [];
    for(var nc=0; nc<t.ncontours; nc++) {
        contours.push(t.contour0+nc*t.dcontour);
        crossings.push({});
        starts.push([]);
        paths.push([]);
    }
    var xi,yi,ystartindices,startIndices,label,corners,cmin,cmax,mi;
    var bottomStart = [1,9,13,104,713],
        topStart = [4,6,7,104,713],
        leftStart = [8,12,14,208,1114],
        rightStart = [2,3,11,208,1114],

        newDelta = [ // which way [dx,dy] do we leave a given index? saddles are already disambiguated
            null,[-1,0],[0,-1],[-1,0],
            [1,0],null,[0,-1],[-1,0],
            [0,1],[0,1],null,[0,1],
            [1,0],[1,0],[0,-1]
        ],
        chooseSaddle = { // for each saddle, the first index here is used for dx||dy<0, the second for dx||dy>0
            104:[4, 1],
            208:[2, 8],
            713:[7, 13],
            1114:[11, 14]
        },
        // after one index has been used for a saddle, which to we substitute to be used up later?
        saddleRemainder = {1:4, 2:8, 4:1, 7:13, 8:2, 11:14, 13:7, 14:11};


    for(yi = 0; yi<m-1; yi++) {
        if(yi===0) { ystartIndices = bottomStart; }
        else if(yi==m-2) { ystartIndices = topStart; }
        else { ystartIndices = []; }

        for(xi = 0; xi<n-1; xi++) {
            if(xi===0) { startIndices = ystartIndices.concat(leftStart); }
            else if(xi==n-2) { startIndices = ystartIndices.concat(rightStart); }
            else { startIndices = ystartIndices; }

            label = yi+','+xi;
            corners = [[z[yi][xi],z[yi][xi+1]],[z[yi+1][xi],z[yi+1][xi+1]]];
            cmax = Plotly.Lib.findBin(Plotly.Lib.aggNums(Math.max,null,corners),contours);
            cmin = Plotly.Lib.findBin(Plotly.Lib.aggNums(Math.min,null,corners),contours);

            for(nc=cmin+1; nc<=cmax; nc++) {
                mi = getMarchingIndex(contours[nc],corners);
                crossings[nc][label] = mi;
                if(startIndices.indexOf(mi)!=-1) { starts[nc].push(label); }
            }
        }
    }

    // now calculate the paths

    function getHInterp(level,locx,locy) {
        var dx = (level-z[locy][locx])/(z[locy][locx+1]-z[locy][locx]);
        return [xa.c2p((1-dx)*x[locx] + dx*x[locx+1]), ya.c2p(y[locy])];
    }

    function getVInterp(level,locx,locy) {
        var dy = (level-z[locy][locx])/(z[locy+1][locx]-z[locy][locx]);
        return [xa.c2p(x[locx]), ya.c2p((1-dy)*y[locy] + dy*y[locy+1])];
    }


    function makePath(nc,st,edgeflag) {
        // find the interpolated starting point
        var loc = st.split(',').map(Number),
            mi = crossings[nc][st],
            level = contours[nc];

        var interp_f, dx=0, dy=0;
        if(mi>20 && edgeflag) {
            if(mi==208 || mi==1114) {
                interp_f = getVInterp;
                dx = loc[0]===0 ? 1 : -1;
            }
            else {
                interp_f = getHInterp;
                dy = loc[1]===0 ? 1 : -1;
            }
        }
        else if(bottomStart.indexOf(mi)!=-1) { interp_f = getHInterp; dy = 1; }
        else if(leftStart.indexOf(mi)!=-1) { interp_f = getVInterp; dx = -1; }
        else if(topStart.indexOf(mi)!=-1) { interp_f = getHInterp; dy = -1; }
        else { interp_f = getVInterp; dx = 1; }
        var pts = [interp_f(level,loc[0]+Math.max(-dx,0),loc[1]+Math.max(-dy,0))];

        // now follow the path
        var miTaken, locstr;
        for(var cnt=0; cnt<10000; cnt++) { // just to avoid infinite loops
            miTaken = mi>20 ? chooseSaddle[mi][dx||dy] : mi;
            locstr = loc.join(',');
            if(miTaken==mi) { delete crossings[nc][locstr];}
            else { crossings[nc][locstr] = saddleRemainder[miTaken]; }
            dx = newDelta[miTaken][0];
            dy = newDelta[miTaken][1];
            if(dx) {
                pts.push(getVInterp(level,loc[0]+Math.max(dx,0),loc[1]));
                loc[0]+=dx;
            }
            else {
                pts.push(getHInterp(level,loc[0],loc[1]+Math.max(dy,0)));
                loc[1]+=dy;
            }
            if(edgeflag) {
                if(dx) { if(loc[0]<0||loc[0]>n-2) { break; } }
                else if(loc[1]<0||loc[1]>m-2) { break; }
            }
            else if(locstr==st) { break; }
        }
        if(cnt==10000) { console.log('Infinite loop in contour?'); }

    }

    function edgePath(nc,st){ paths[nc].push(makePath(nc,st,'edge')); }

    for(nc=0; nc<t.ncontours; nc++) {
        starts[nc].forEach(edgePath);
        while(Object.keys(crossings[nc]).length) {
            paths[nc].push(makePath(nc,st));
        }
    }

    var plotgroup = plotinfo.plot.selectAll('g.contour.'+id).data([0]);
    plotgroup.enter().append('g').classed('contour',true).classed(id,true);
    plotgroup.exit().remove();

    var fillgroup = plotgroup.selectAll('g.contourfill').data([0]);
    fillgroup.enter().append('g').classed('contourfill',true);
    fillgroup.exit().remove();

    var linegroup = plotgroup.selectAll('g.contourlevel').data(paths);
    linegroup.enter().append('g').classed('contourlevel',true);
    linegroup.exit().remove();

    var contourline = linegroup.selectAll('path').data(function(d){return d;});
    contourline.enter().append('path');
    contourline.exit().remove();

    contourline.attr('d',function(d){return 'M'+d.join('L');})
        .style('stroke-width',1)
        .style('stroke','black')
        .style('stroke-miterlimit',1)
        .style('fill','none');

    // TODO - display, add the fill, specialized color bar, etc.




    // TODO: left over from heatmaps... some we may want

    // interpolate for color scale
    // https://github.com/mbostock/d3/wiki/Quantitative-Scales
    // http://nelsonslog.wordpress.com/2011/04/11/d3-scales-and-interpolation/

    // var d = scl.map(function(si){ return si[0]*255; }),
    //     r = scl.map(function(si){ return si[1]; });

    // s = d3.scale.linear()
    //     .domain(d)
    //     .interpolate(d3.interpolateRgb)
    //     .range(r);

    // // create a color in the png color table
    // // save p.color and luminosity each time we calculate anew, because these are the slowest parts
    // var colors = {};
    // colors[256] = p.color(0,0,0,0); // non-numeric shows as transparent TODO: make this an option
    // function setColor(v,pixsize) {
    //     if($.isNumeric(v)) {
    //         // get z-value, scale for 8-bit color by rounding z to an integer 0-254
    //         // (one value reserved for transparent (missing/non-numeric data)
    //         var vr = Plotly.Lib.constrain(Math.round((v-min)*254/(max-min)),0,254);
    //         c=s(vr);
    //         pixcount+=pixsize;
    //         if(!colors[vr]) {
    //             var c = s(vr);
    //             colors[vr] = [
    //                 tinycolor(c).toHsl().l,
    //                 p.color('0x'+c.substr(1,2),'0x'+c.substr(3,2),'0x'+c.substr(5,2))
    //             ];
    //         }
    //         lumcount+=pixsize*colors[vr][0];
    //         return colors[vr][1];
    //     }
    //     else { return colors[256]; }
    // }

    // gd.hmpixcount = (gd.hmpixcount||0)+pixcount;
    // gd.hmlumcount = (gd.hmlumcount||0)+lumcount;

    // // http://stackoverflow.com/questions/6249664/does-svg-support-embedding-of-bitmap-images
    // // https://groups.google.com/forum/?fromgroups=#!topic/d3-js/aQSWnEDFxIc
    // var imgstr = "data:image/png;base64,\n" + p.getBase64();
    // gl._paper.selectAll('.'+id).remove(); // put this right before making the new image, to minimize flicker
    // plotinfo.plot.append('svg:image')
    //     .classed(id,true)
    //     .datum(cd[0])
    //     // .classed('pixelated',true) // we can hope pixelated works...
    //     .attr({
    //         xmlns:"http://www.w3.org/2000/svg",
    //         "xlink:xlink:href":imgstr, // odd d3 quirk, need namespace twice
    //         height:ht,
    //         width:wd,
    //         x:left,
    //         y:top,
    //         preserveAspectRatio:'none'});

    // Plotly.Lib.markTime('done showing png');

    // // show a colorscale
    // gl._infolayer.selectAll('.'+cb_id).remove();
    // if(t.showscale!==false){ insert_colorbar(gd,cd, cb_id, scl); }
    // Plotly.Lib.markTime('done colorbar');
};

contour.style = function(s) {
    s.style('opacity',function(d){ return d.t.op; });
};

}()); // end Heatmap object definition