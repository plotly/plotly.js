(function() {
var contour = window.Plotly.Contour = {};

// contour maps use heatmap.calc but have their own plot function

contour.plot = function(gd,plotinfo,cd) {
    Plotly.Lib.markTime('in Contour.plot');
    var t = cd[0].t,
        i = t.curve,
        xa = plotinfo.x,
        ya = plotinfo.y,
        gl = gd.layout;

    var id='contour'+i; // contour group id
    var cb_id='cb'+i; // colorbar id

    if(cd[0].xfill && cd[0].yfill) { // use a heatmap to fill
        t.zsmooth = 'best';
        Plotly.Heatmap.plot(gd,plotinfo,cd);
    }
    else {
        gl._paper.selectAll('.hm'+i).remove(); // in case this used to be a heatmap (or have heatmap fill)
    }

    if(t.visible===false) {
        gl._paper.selectAll('.'+id).remove();
        gl._paper.selectAll('.'+cb_id).remove();
        return;
    }

    var z=cd[0].z, min=t.zmin, max=t.zmax, scl=Plotly.Plots.getScale(t.scl), x=cd[0].x, y=cd[0].y;
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
        // crossings = [], // all the cells with nontrivial marching index at each crossing
        // starts = [], // starting points on the edges of the lattice for each contour
        //              // we'll first follow all such paths, then we'll pick starting points
        //              // at random for the closed loops
        // ends = [],
        pathinfo = [];
    for(var ci=t.contourstart; ci<t.contourend+t.contoursize/10; ci+=t.contoursize||1) {
        contours.push(ci);
        pathinfo.push({level:ci, crossings:{}, starts:[], ends:[], paths:[]});
        // crossings.push({});
        // starts.push([]);
        // ends.push([]);
        // paths.push([]);
    }
    var xi,yi,ystartindices,startIndices,label,corners,cmin,cmax,mi,nc;
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

    function makeCrossings(pi) {
        mi = getMarchingIndex(pi.level,corners);
        pi.crossings[label] = mi;
        if(startIndices.indexOf(mi)!=-1) { pi.starts.push(label); }
    }

    for(yi = 0; yi<m-1; yi++) {
        if(yi===0) { ystartIndices = bottomStart; }
        else if(yi==m-2) { ystartIndices = topStart; }
        else { ystartIndices = []; }

        for(xi = 0; xi<n-1; xi++) {
            if(xi===0) { startIndices = ystartIndices.concat(leftStart); }
            else if(xi==n-2) { startIndices = ystartIndices.concat(rightStart); }
            else { startIndices = ystartIndices; }

            label = xi+','+yi;
            corners = [[z[yi][xi],z[yi][xi+1]],[z[yi+1][xi],z[yi+1][xi+1]]];
            cmax = Plotly.Lib.findBin(Plotly.Lib.aggNums(Math.max,null,corners),contours,true);
            cmin = Plotly.Lib.findBin(Plotly.Lib.aggNums(Math.min,null,corners),contours,true);

            pathinfo.forEach(makeCrossings);
        }
    }

    // now calculate the paths

    function getHInterp(level,locx,locy) {
        // console.log(locx+0.5,locy);
        var dx = (level-z[locy][locx])/(z[locy][locx+1]-z[locy][locx]);
        return [xa.c2p((1-dx)*x[locx] + dx*x[locx+1]), ya.c2p(y[locy])];
    }

    function getVInterp(level,locx,locy) {
        // console.log(locx,locy+0.5);
        var dy = (level-z[locy][locx])/(z[locy+1][locx]-z[locy][locx]);
        return [xa.c2p(x[locx]), ya.c2p((1-dy)*y[locy] + dy*y[locy+1])];
    }


    function makePath(nc,st,edgeflag) {
        // console.log(nc,st);
        // find the interpolated starting point
        var pi = pathinfo[nc],
            loc = st.split(',').map(Number),
            mi = pi.crossings[st],
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
        else if(bottomStart.indexOf(mi)!=-1) { interp_f = getHInterp; dy = -1; }
        else if(leftStart.indexOf(mi)!=-1) { interp_f = getVInterp; dx = -1; }
        else if(topStart.indexOf(mi)!=-1) { interp_f = getHInterp; dy = 1; }
        else { interp_f = getVInterp; dx = 1; }
        var pts = [interp_f(level,loc[0]+Math.max(dx,0),loc[1]+Math.max(dy,0))];

        // now follow the path
        var miTaken, locstr = loc.join(',');
        for(var cnt=0; cnt<10000; cnt++) { // just to avoid infinite loops
            miTaken = mi>20 ? chooseSaddle[mi][dx||dy] : mi;
            if(miTaken==mi) { delete pi.crossings[locstr];}
            else { pi.crossings[locstr] = saddleRemainder[miTaken]; }
            if(!newDelta[miTaken]) { console.log('found bad marching index',mi,miTaken,loc,nc); break;}
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
            locstr = loc.join(',');
            if(edgeflag) {
                if((dx&&(loc[0]<0||loc[0]>n-2)) || (dy&&(loc[1]<0||loc[1]>m-2))) {
                    pi.ends.push([loc[0]-dx,loc[1]-dy]);
                    break;
                }
            }
            else if(locstr==st) { break; }
            mi = pi.crossings[locstr];
            // console.log(locstr,mi);
        }
        if(cnt==10000) { console.log('Infinite loop in contour?'); }

        if(pts[0]==pts[pts.length-1]) { pts[pts.length-1] = 'Z'; }
        else if(!edgeflag) { console.log('unclosed interior contour?',nc,st,pts.join('L')); }

        return pts.join('L'); // TODO: smoothing
    }

    function edgePath(nc,st){ pathinfo[nc].paths.push(makePath(nc,st,'edge')); }

    // console.log(contours,µ.util.deepExtend([],crossings));

    pathinfo.forEach(function(pi,nc){
        pi.starts.forEach(function(st){ pi.paths.push(makePath(nc,st,'edge')); });
        var cnt=0;
        while(Object.keys(pi.crossings).length && cnt<10000) {
            cnt++;
            pi.paths.push(makePath(nc,Object.keys(pi.crossings)[0]));
        }
        if(cnt==10000) { console.log('Infinite loop in contour?'); }
    });

    // console.log(starts,paths);

    var plotgroup = plotinfo.plot.selectAll('g.contour.'+id).data([0]);
    plotgroup.enter().append('g').classed('contour',true).classed(id,true);
    plotgroup.exit().remove();

    var fillgroup = plotgroup.selectAll('g.contourfill').data([0]);
    fillgroup.enter().append('g').classed('contourfill',true);
    fillgroup.exit().remove();

    var perimeter = [[x[0],y[0]],[x[x.length-1],y[0]],[x[x.length-1],y[y.length-1]],[x[0],y[y.length-1]]]
        .map(function(p){return [xa.c2p(p[0]),ya.c2p(p[1])]; }),
        perimeterPath = perimeter.join('L')+'Z';
    var fillitems = fillgroup.selectAll('path')
        .data(t.fillmode=='fill' ? [{paths:[perimeterPath]}].concat(pathinfo) : []);
    fillitems.enter().append('path');
    fillitems.exit().remove();
    fillitems.each(function(d,nc){
        // join all paths for this level together into a single path
        // follow clockwise around the perimeter to close any open paths
        // if the whole perimeter is above this level, start with a path
        // enclosing the whole thing. With all that, the parity should mean
        // that we always fill everything above the contour, nothing below
        var fullpath = (d.starts.length || z[0][0]<contours[nc]) ? '' : ('M'+perimeterPath);
        // TODO
    });

    var linegroup = plotgroup.selectAll('g.contourlevel').data(t.showlines ? pathinfo : []);
    linegroup.enter().append('g').classed('contourlevel',true);
    linegroup.exit().remove();

    var contourline = linegroup.selectAll('path').data(function(d){return d.paths;});
    contourline.enter().append('path');
    contourline.exit().remove();
    contourline.each(function(d){d3.select(this).attr('d', 'M'+d);})
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
    Plotly.Lib.markTime('done Contour.plot');
};

contour.style = function(s) {
    s.style('opacity',function(d){ return d.t.op; });
};

}()); // end Heatmap object definition