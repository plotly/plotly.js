(function() {
var contour = window.Plotly.Contour = {};

// contour maps use heatmap.calc but have their own plot function

contour.SMT = 0.5; // Catmull-Rom exponent
contour.SML = 1; // control point length factor (<1 makes the lines sharper)
smoothopen = function(pts) {
    if(pts.length<3) { return 'M' + pts.join('L');}
    var path = 'M'+pts[0],
        tangents = [], i;
    for(i=1; i<pts.length-1; i++) {
        tangents.push(makeTangent(pts[i-1],pts[i],pts[i+1]));
    }
    path += 'Q'+tangents[0][0]+' '+pts[1];
    for(i=2; i<pts.length-1; i++) {
        path += 'C'+tangents[i-2][1]+' '+tangents[i-1][0]+' '+pts[i];
    }
    path += 'Q'+tangents[pts.length-3][1]+' '+pts[pts.length-1];
    return path;
};

smoothclosed = function(pts) {
    if(pts.length<3) { return 'M' + pts.join('L') + 'Z'; }
    var path = 'M'+pts[0],
        tangents = [makeTangent(pts[pts.length-1],pts[0],pts[1])], i;
    for(i=1; i<pts.length-1; i++) {
        tangents.push(makeTangent(pts[i-1],pts[i],pts[i+1]));
    }
    tangents.push(makeTangent(pts[pts.length-2],pts[pts.length-1],pts[0]));
    for(i=1; i<pts.length; i++) {
        path += 'C'+tangents[i-1][1]+' '+tangents[i][0]+' '+pts[i];
    }
    path += 'C'+tangents[pts.length-1][1]+' '+tangents[0][0]+' '+pts[0] + 'Z';
    return path;
};

// generalized Catmull-Rom splines, per http://www.cemyuksel.com/research/catmullrom_param/catmullrom.pdf
function makeTangent(prevpt,thispt,nextpt) {
    var alpha = contour.SMT,
        len = contour.SML,
        d1x = prevpt[0]-thispt[0],
        d1y = prevpt[1]-thispt[1],
        d2x = nextpt[0]-thispt[0],
        d2y = nextpt[1]-thispt[1],
        d1a = Math.pow(d1x*d1x + d1y*d1y, alpha/2),
        d2a = Math.pow(d2x*d2x + d2y*d2y, alpha/2),
        numx = (d2a*d2a*d1x - d1a*d1a*d2x)*len,
        numy = (d2a*d2a*d1y - d1a*d1a*d2y)*len,
        denom1 = 3*d2a*(d1a+d2a),
        denom2 = 3*d1a*(d1a+d2a);
    return [[thispt[0]+numx/denom1, thispt[1]+numy/denom1], [thispt[0]-numx/denom2, thispt[1]-numy/denom2]];
}

contour.plot = function(gd,plotinfo,cd) {
    Plotly.Lib.markTime('in Contour.plot');
    var t = cd[0].t,
        i = t.curve,
        xa = plotinfo.x,
        ya = plotinfo.y,
        gl = gd.layout;

    var id='contour'+i; // contour group id
    var cb_id='cb'+i; // colorbar id

    if(t.coloring=='heatmap') { // use a heatmap to fill - draw it behind the lines
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

    var z=cd[0].z, min=t.zmin, max=t.zmax, x=cd[0].x, y=cd[0].y;
    // get z dims
    var m=z.length, n=z[0].length; // num rows, cols

    // find all the contours at once
    // since we want to be exhaustive we'll check for contour crossings at every intersection
    // using a modified marching squares algorithm, so we disambiguate the saddle points from the start
    // and we ignore the cases with no crossings
    // the index I'm using is based on http://en.wikipedia.org/wiki/Marching_squares
    // except that the saddles bifurcate
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
        else if(mi==15) { return 0; }
        return mi;
    }
    var contours = [], pathinfo = [];
    for(var ci=t.contourstart; ci<t.contourend+t.contoursize/10; ci+=t.contoursize||1) {
        contours.push(ci);
        pathinfo.push({level:ci,
            crossings:{}, // all the cells with nontrivial marching index
            starts:[], // starting points on the edges of the lattice for each contour
            edgepaths:[], // all unclosed paths (may have less items than starts, if a path is closed by rounding)
            paths:[] // all closed paths
        });
    }
    t.numcontours = pathinfo.length;
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
        if(mi) {
            pi.crossings[label] = mi;
            if(startIndices.indexOf(mi)!=-1) { pi.starts.push(label.split(',').map(Number)); }
        }
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
        var dx = (level-z[locy][locx])/(z[locy][locx+1]-z[locy][locx]);
        return [xa.c2p((1-dx)*x[locx] + dx*x[locx+1]), ya.c2p(y[locy])];
    }

    function getVInterp(level,locx,locy) {
        var dy = (level-z[locy][locx])/(z[locy+1][locx]-z[locy][locx]);
        return [xa.c2p(x[locx]), ya.c2p((1-dy)*y[locy] + dy*y[locy+1])];
    }

    function equalpts(pt1,pt2) {
        return Math.abs(pt1[0]-pt2[0])<0.01 && Math.abs(pt1[1]-pt2[1])<0.01;
    }


    function makePath(nc,st,edgeflag) {
        var pi = pathinfo[nc],
            loc = st.split(',').map(Number),
            mi = pi.crossings[st],
            level = pi.level,
            loclist = [];

        // find the interpolated starting point
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
            loclist.push(locstr);
            miTaken = mi>20 ? chooseSaddle[mi][(dx||dy)<0?0:1] : mi;
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
            // don't include the same point multiple times
            if(equalpts(pts[pts.length-1],pts[pts.length-2])) {
                pts.pop();
            }
            locstr = loc.join(',');
            if(locstr==st || (edgeflag && ((dx&&(loc[0]<0||loc[0]>n-2)) || (dy&&(loc[1]<0||loc[1]>m-2))))) {
                break;
            }
            mi = pi.crossings[locstr];
        }
        if(cnt==10000) { console.log('Infinite loop in contour?'); }

        // check for points that are too close together (<1/10 the average dist?) and just take the center (or avg of center 2)
        // this cuts down on funny behavior when a point is very close to a contour level
        var totaldist=0,
            thisdist,
            alldists=[],
            dist_threshold_factor=0.1;
        for(cnt=1; cnt<pts.length; cnt++) {
            dx = pts[cnt][0]-pts[cnt-1][0];
            dy = pts[cnt][1]-pts[cnt-1][1];
            thisdist = dx*dx+dy*dy;
            totaldist += thisdist;
            alldists.push(thisdist);
        }
        var dist_threshold = totaldist/alldists.length*dist_threshold_factor,distgroup,cnt2;
        for(cnt=pts.length-3; cnt>0; cnt--) {
            distgroup = alldists[cnt];
            if(distgroup<dist_threshold) {
                for(cnt2=cnt-1; cnt2>0; cnt2--) {
                    if(distgroup+alldists[cnt2]<dist_threshold) { distgroup += alldists[cnt2]; }
                    else { break; }
                }
                var newx,newy,ptcnt=cnt-cnt2+1;
                if(ptcnt%2===0) { // even # of pts - average central two
                    newx = (pts[(cnt+cnt2+1)/2][0]+pts[(cnt+cnt2+3)/2][0])/2;
                    newy = (pts[(cnt+cnt2+1)/2][1]+pts[(cnt+cnt2+3)/2][1])/2;
                }
                else { // odd # of points - just take the central one
                    newx = pts[(cnt+cnt2+2)/2][0];
                    newy = pts[(cnt+cnt2+2)/2][1];
                }
                pts.splice(cnt2+1,ptcnt,[newx,newy]);
                cnt = cnt2+1;
            }
        }

        // don't return single-point paths (ie all points were the same so they got deleted)
        if(pts.length<2) { return; }
        else if(equalpts(pts[0],pts[pts.length-1])) {
            pts.pop();
            pi.paths.push(pts);
        }
        else {
            if(!edgeflag) { console.log('unclosed interior contour?',nc,st,loclist,pts.join('L')); }

            // edge path - does it start where an existing edge path ends, or vice versa?
            var merged = false;
            pi.edgepaths.forEach(function(edgepath,edgei) {
                if(!merged && equalpts(edgepath[0],pts[pts.length-1])) {
                    pts.pop();
                    merged = true;
                    // now does it ALSO meet the end of another (or the same) path?
                    var doublemerged = false;
                    pi.edgepaths.forEach(function(edgepath2,edgei2) {
                        if(!doublemerged && equalpts(edgepath2[edgepath2.length-1],pts[0])) {
                            doublemerged = true;
                            pts.splice(0,1);
                            pi.edgepaths.splice(edgei,1);
                            if(edgei2==edgei) { pi.paths.push(pts.concat(edgepath2)); } // the path is now closed
                            else { pi.edgepaths[edgei2] = pi.edgepaths[edgei2].concat(pts,edgepath2); }
                        }
                    });
                    if(!doublemerged) { pi.edgepaths[edgei] = pts.concat(edgepath); }
                }
            });
            pi.edgepaths.forEach(function(edgepath,edgei) {
                if(!merged && equalpts(edgepath[edgepath.length-1],pts[0])) {
                    pts.splice(0,1);
                    pi.edgepaths[edgei] = edgepath.concat(pts);
                    merged = true;
                }
            });

            if(!merged) { pi.edgepaths.push(pts); }
        }
    }

    // console.log(contours,µ.util.deepExtend([],pathinfo));

    pathinfo.forEach(function(pi,nc){
        // console.log('starts',nc,pi.starts,µ.util.deepExtend({},pi.crossings));
        pi.starts.forEach(function(st){ makePath(nc,String(st),'edge'); });
        var cnt=0;
        // console.log('done starts',nc,µ.util.deepExtend([],pi.paths));
        while(Object.keys(pi.crossings).length && cnt<10000) {
            cnt++;
            makePath(nc,Object.keys(pi.crossings)[0]);
        }
        if(cnt==10000) { console.log('Infinite loop in contour?'); }
        // console.log('done paths',nc,µ.util.deepExtend([],pi.paths));
    });

    // console.log(µ.util.deepExtend([],pathinfo));

    // and draw everything
    var plotgroup = plotinfo.plot.selectAll('g.contour.'+id).data(cd);
    plotgroup.enter().append('g').classed('contour',true).classed(id,true);
    plotgroup.exit().remove();

    var leftedge = xa.c2p(x[0]),
        rightedge = xa.c2p(x[x.length-1]),
        bottomedge = ya.c2p(y[0]),
        topedge = ya.c2p(y[y.length-1]),
        perimeter = [[leftedge,topedge],[rightedge,topedge],[rightedge,bottomedge],[leftedge,bottomedge]];

    function isBetween(ptStart,ptEnd,ptNew) {
        // is ptNew on the (horz. or vert.) segment from ptStart to ptEnd?
        if(Math.abs(ptStart[0]-ptEnd[0])<0.01) {
            return Math.abs(ptStart[0]-ptNew[0])<0.01 && (ptNew[1]-ptStart[1])*(ptEnd[1]-ptNew[1])>0;
        }
        else if(Math.abs(ptStart[1]-ptEnd[1])<0.01) {
            return Math.abs(ptStart[1]-ptNew[1])<0.01 && (ptNew[0]-ptStart[0])*(ptEnd[0]-ptNew[0])>0;
        }
        else {
            console.log('ptStart to ptEnd is not vert. or horz.',ptStart,ptEnd,ptNew);
        }
    }
    function istop(pt) { return Math.abs(pt[1]-topedge)<0.01; }
    function isbottom(pt) { return Math.abs(pt[1]-bottomedge)<0.01; }
    function isleft(pt) { return Math.abs(pt[0]-leftedge)<0.01; }
    function isright(pt) { return Math.abs(pt[0]-rightedge)<0.01; }

    var bggroup = plotgroup.selectAll('g.contourbg').data([0]);
    bggroup.enter().append('g').classed('contourbg',true);
    var bgfill = bggroup.selectAll('path').data(t.coloring=='fill' ? [0] : []);
    bgfill.enter().append('path');
    bgfill.exit().remove();
    bgfill
        .attr('d','M'+perimeter.join('L')+'Z')
        .style('stroke','none');

    var fillgroup = plotgroup.selectAll('g.contourfill').data([0]);
    fillgroup.enter().append('g').classed('contourfill',true);
    var fillitems = fillgroup.selectAll('path').data(t.coloring=='fill' ? pathinfo : []);
    fillitems.enter().append('path');
    fillitems.exit().remove();
    fillitems.each(function(d,nc){
        // join all paths for this level together into a single path
        // first follow clockwise around the perimeter to close any open paths
        // if the whole perimeter is above this level, start with a path
        // enclosing the whole thing. With all that, the parity should mean
        // that we always fill everything above the contour, nothing below
        var fullpath = (d.edgepaths.length || z[0][0]<d.level) ? '' : ('M'+perimeter.join('L')+'Z');
        var i=0,
            startsleft = d.edgepaths.map(function(v,i){ return i; }),
            endpt, newendpt, cnt, nexti, newloop = true, addpath;
        while(startsleft.length) {
            addpath = smoothopen(d.edgepaths[i]);
            fullpath += newloop ? addpath : addpath.replace(/^M/,'L');
            startsleft.splice(startsleft.indexOf(i),1);
            endpt = d.edgepaths[i][d.edgepaths[i].length-1];
            cnt=0;
            //now loop through sides, moving our endpoint until we find a new start
            for(cnt=0; cnt<4; cnt++) { // just to prevent infinite loops
                if(!endpt) { console.log('missing end?',i,d); break; }

                if(istop(endpt) && !isright(endpt)) { newendpt = [rightedge,topedge]; }
                else if(isleft(endpt)) { newendpt = [leftedge,topedge]; }
                else if(isbottom(endpt)) { newendpt = [leftedge,bottomedge]; }
                else if(isright(endpt)) { newendpt = [rightedge,bottomedge]; }

                for(nexti=0; nexti<d.edgepaths.length; nexti++) {
                    if(isBetween(endpt,newendpt,d.edgepaths[nexti][0])) {
                        newendpt = d.edgepaths[nexti][0];
                        break;
                    }
                }

                endpt = newendpt;

                if(nexti<d.edgepaths.length) { break; }
                fullpath += 'L'+newendpt;
            }

            if(nexti==d.edgepaths.length) { console.log('unclosed perimeter path'); break; }

            i = nexti;

            // if we closed back on a loop we already included, close it and start a new loop
            newloop = (startsleft.indexOf(i)==-1);
            if(newloop) {
                i = startsleft[0];
                fullpath += 'Z';
            }
        }

        // finally add the interior paths
        d.paths.forEach(function(path) { fullpath += smoothclosed(path); });

        if(!fullpath) { d3.select(this).remove(); }
        else { d3.select(this).attr('d',fullpath).style('stroke','none'); }
    });

    var linegroup = plotgroup.selectAll('g.contourlevel').data(t.showlines ? pathinfo : []);
    linegroup.enter().append('g').classed('contourlevel',true);
    linegroup.exit().remove();

    var opencontourlines = linegroup.selectAll('path.openline')
        .data(function(d){ return d.edgepaths; });
    opencontourlines.enter().append('path').classed('openline',true);
    opencontourlines.exit().remove();
    opencontourlines
        .attr('d', smoothopen)
        .style('stroke-miterlimit',1);

    var closedcontourlines = linegroup.selectAll('path.closedline')
        .data(function(d){ return d.paths; });
    closedcontourlines.enter().append('path').classed('closedline',true);
    closedcontourlines.exit().remove();
    closedcontourlines
        .attr('d', smoothclosed)
        .style('stroke-miterlimit',1);

    // instantiate the colorbar (will be drawn and styled in contour.style)
    t.cb = Plotly.Heatmap.colorbar(gd,cb_id);
    t.cb_id = cb_id;

    Plotly.Lib.markTime('done Contour.plot');
};

contour.style = function(s) {
    s.style('opacity',function(d){ return d.t.op; })
    .each(function(d) {
        var c = d3.select(this),
            t = d.t,
            scl = Plotly.Plots.getScale(t.scl),
            extraLevel = t.coloring=='lines' ? 0 : 1,
            colormap = d3.scale.linear()
                .domain(scl.map(function(si){
                    return (si[0]*(t.numcontours+extraLevel-1)-(extraLevel/2))*t.contoursize+t.contourstart;
                }))
                .interpolate(d3.interpolateRgb)
                .range(scl.map(function(si){ return si[1]; }));

        c.selectAll('g.contourlevel').each(function(d,i) {
            var lc = t.coloring=='lines' ? colormap(t.contourstart+i*t.contoursize): t.lc;
            d3.select(this).selectAll('path')
                .call(Plotly.Drawing.lineGroupStyle,t.lw, lc, t.ld);
        });
        c.selectAll('g.contourbg path')
            .style('fill',colormap(t.contourstart-t.contoursize/2));
        c.selectAll('g.contourfill path')
            .style('fill',function(d,i){ return colormap(t.contourstart+(i+0.5)*t.contoursize); });

        // configure and call the colorbar
        t.cb
            .fillcolor(t.coloring=='fill' || t.coloring=='heatmap' ? colormap : '')
            .linecolor(t.coloring=='lines' ? colormap : t.lc)
            .linewidth(t.showlines ? t.lw : 0)
            .linedash(t.ld)
            .levels({start:t.contourstart, end:t.contourend, size:t.contoursize});
        if(t.coloring=='heatmap') {
            t.cb.filllevels({start:t.zmin, end:t.zmax, size:(t.zmax-t.zmin)/254});
        }
        t.cb();
    });
};

}()); // end Heatmap object definition