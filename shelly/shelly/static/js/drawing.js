(function() {
    'use strict';

    // ---Plotly global modules
    /* global Plotly:false */

    // ---external global dependencies
    /* global d3:false, tinycolor:false */

    var drawing = Plotly.Drawing = {};
    // -----------------------------------------------------
    // styling functions for plot elements
    // -----------------------------------------------------

    drawing.rgb = function(cstr) {
        var c = tinycolor(cstr).toRgb();
        return 'rgb(' + Math.round(c.r) + ', ' +
            Math.round(c.g) + ', ' + Math.round(c.b) + ')';
    };

    drawing.opacity = function(cstr) { return tinycolor(cstr).alpha; };

    drawing.addOpacity = function(cstr,op) {
        var c = tinycolor(cstr).toRgb();
        return 'rgba(' + Math.round(c.r) + ', ' +
            Math.round(c.g) + ', ' + Math.round(c.b) + ', ' + op + ')';
    };

    drawing.strokeColor = function(s,c) {
        s.style({'stroke':drawing.rgb(c), 'stroke-opacity':drawing.opacity(c)});
    };

    drawing.fillColor = function(s,c) {
        s.style({'fill':drawing.rgb(c), 'fill-opacity':drawing.opacity(c)});
    };

    drawing.font = function(s,family,size,fill) {
        if(family!==undefined) { s.style('font-family',family); }
        if(size!==undefined) { s.style('font-size',size+'px'); }
        if(fill!==undefined) { s.call(drawing.fillColor,fill); }
    };

    drawing.setPosition = function(s,x,y) { s.attr('x',x).attr('y',y); };
    drawing.setSize = function(s,w,h) { s.attr('width',w).attr('height',h); };
    drawing.setRect = function(s,x,y,w,h) {
        s.call(drawing.setPosition,x,y).call(drawing.setSize,w,h);
    };

    drawing.translatePoints = function(s,xa,ya){
        s.each(function(d){
            // put xp and yp into d if pixel scaling is already done
            var x = d.xp || xa.c2p(d.x),
                y = d.yp || ya.c2p(d.y),
                p = d3.select(this);
            if($.isNumeric(x) && $.isNumeric(y)) {
                // for multiline text this works better
                if(this.nodeName==='text') { p.attr('x',x).attr('y',y); }
                else { p.attr('transform','translate('+x+','+y+')'); }
            }
            else { p.remove(); }
        });
    };

    drawing.getPx = function(s,styleAttr) {
        // helper to pull out a px value from a style that may contain px units
        // s is a d3 selection (will pull from the first one)
        return Number(s.style(styleAttr).replace(/px$/,''));
    };

    drawing.lineGroupStyle = function(s,lw,lc,ld) {
        s.style('fill','none')
        .each(function(d){
            var lw1 = lw||(d&&d[0]&&d[0].t&&d[0].t.lw)||0,
                da = ld||(d&&d[0]&&d[0].t&&d[0].t.ld),
                dlw = Math.max(lw1,3);
            if(da==='solid') { da = ''; }
            else if(da==='dot') { da = dlw+'px,'+dlw+'px'; }
            else if(da==='dash') { da = (3*dlw)+'px,'+(3*dlw)+'px'; }
            else if(da==='longdash') { da = (5*dlw)+'px,'+(5*dlw)+'px'; }
            else if(da==='dashdot') {
                da = (3*dlw)+'px,'+dlw+'px,'+dlw+'px,'+dlw+'px';
            }
            else if(da==='longdashdot') {
                da = (5*dlw)+'px,'+(2*dlw)+'px,'+dlw+'px,'+(2*dlw)+'px';
            }
            // otherwise user wrote the dasharray themselves - leave it be

            d3.select(this)
                .call(drawing.strokeColor,lc||(d&&d[0]&&d[0].t&&d[0].t.lc))
                .style('stroke-dasharray',da)
                .style('stroke-width',lw1+'px');
        });
    };

    drawing.fillGroupStyle = function(s) {
        s.style('stroke-width',0)
        .each(function(d){
            var shape = d3.select(this);
            try {
                shape.call(drawing.fillColor,d[0].t.fc);
            }
            catch(e) {
                console.log(e,s);
                shape.remove();
            }
        });
    };

    // apply the marker to each point
    // draws the marker with diameter roughly markersize, centered at 0,0
    // POINTCODE: let users specify numbers 0..8 for symbols, instead of names
    var SYMBOLCODE = [
        'circle',
        'square',
        'diamond',
        'cross',
        'x',
        'triangle-up',
        'triangle-down',
        'triangle-left',
        'triangle-right'
    ];
    drawing.pointStyle = function(s,t) {
        // only scatter & box plots get marker path and opacity
        // bars, histograms don't
        if(['scatter','box'].indexOf(t.type)!==-1) {
            var r,
                // for bubble charts, allow scaling the provided value linearly
                // and by area or diameter.
                // Note this only applies to the array-value sizes
                sizeRef = t.msr || 1,
                sizeFn = (t.msm==='area') ?
                    function(v){ return Math.sqrt(v/sizeRef); } :
                    function(v){ return v/sizeRef; };
            s.attr('d',function(d){
                if(d.ms+1) { r = sizeFn(d.ms/2); }
                else { r = ((t.ms+1 || (d.t ? d.t.ms : 0)+1)-1)/2; }

                // store the calculated size so hover can use it
                d.mrc = r;

                // in case of "various" etc... set a visible default
                if(!$.isNumeric(r) || r<0) { r=3; }
                var rt=String(d3.round(r*2/Math.sqrt(3),2)),
                    r2=String(d3.round(r/2,2)),
                    rs=String(d3.round(r,2));
                var x=(d.mx || t.mx || (d.t ? d.t.mx : ''));
                if($.isNumeric(x)) { x = SYMBOLCODE[x]; }
                if(x==='square') {
                    return 'M'+rs+','+rs+'H-'+rs+'V-'+rs+'H'+rs+'Z';
                }
                if(x==='diamond') {
                    var rd=String(d3.round(r*Math.sqrt(2),2));
                    return 'M'+rd+',0L0,'+rd+'L-'+rd+',0L0,-'+rd+'Z';
                }
                if(x==='triangle-up') {
                    return 'M-'+rt+','+r2+'H'+rt+'L0,-'+rs+'Z';
                }
                if(x==='triangle-down') {
                    return 'M-'+rt+',-'+r2+'H'+rt+'L0,'+rs+'Z';
                }
                if(x==='triangle-right') {
                    return 'M-'+r2+',-'+rt+'V'+rt+'L'+rs+',0Z';
                }
                if(x==='triangle-left') {
                    return 'M'+r2+',-'+rt+'V'+rt+'L-'+rs+',0Z';
                }
                if(x==='cross') {
                    var rc = String(d3.round(r*0.4,2)),
                        rc2 = String(d3.round(r*1.2,2));
                    return 'M'+rc2+','+rc+'H'+rc+'V'+rc2+'H-'+rc+
                        'V'+rc+'H-'+rc2+'V-'+rc+'H-'+rc+'V-'+rc2+
                        'H'+rc+'V-'+rc+'H'+rc2+'Z';
                }
                if(x==='x') {
                    var rx = String(d3.round(r*0.8/Math.sqrt(2),2)),
                        ne = 'l'+rx+','+rx, se = 'l'+rx+',-'+rx,
                        sw = 'l-'+rx+',-'+rx, nw = 'l-'+rx+','+rx;
                    return 'M0,'+rx+ne+se+sw+se+sw+nw+sw+nw+ne+nw+ne+'Z';
                }
                // circle is default
                return 'M'+rs+',0A'+rs+','+rs+' 0 1,1 0,-'+rs+
                    'A'+rs+','+rs+' 0 0,1 '+rs+',0Z';
            })
            .style('opacity',function(d){
                return (d.mo+1 || t.mo+1 || (d.t ? d.t.mo : 0) +1) - 1;
            });
        }
        // allow array marker and marker line colors to be
        // scaled by given max and min to colorscales
        var colorscales = {
            m: drawing.tryColorscale(s,t,'m'),
            ml: drawing.tryColorscale(s,t,'ml'),
            so: drawing.tryColorscale(s,t,'so'),
            sol: drawing.tryColorscale(s,t,'sol')
        };
        s.each(function(d){
            // 'so' is suspected outliers, for box plots
            var a = (d.so) ? 'so' : 'm',
                lw = a+'lw', c = a+'c', lc = a+'lc',
                w = (d[lw]+1 || t[lw]+1 || (d.t ? d.t[lw] : 0)+1) - 1,
                p = d3.select(this),
                cc,lcc;
            if(d[c]) { d[c+'c'] = cc = colorscales[a](d[c]); }
            else { cc = t[c] || (d.t ? d.t[c] : ''); }
            p.style('stroke-width',w+'px')
                .call(drawing.fillColor, cc);
            if(w) {
                if(d[lc]) { d[lc+'c'] = lcc = colorscales[a+'l'](d[lc]); }
                else { lcc = t[lc] || (d.t ? d.t[lc] : ''); }
                p.call(drawing.strokeColor, lcc);
            }
        });
    };

    // for a given color attribute (ie m -> mc = marker.color) look to see if we
    // have a colorscale for it (ie mscl, mcmin, mcmax) - if we do, translate
    // all numeric color values according to that scale
    drawing.tryColorscale = function(s,t,attr) {
        if((attr+'scl') in t && (attr+'cmin') in t && (attr+'cmax') in t) {
            var scl = t[attr+'scl'],
                min = t[attr+'cmin'],
                max = t[attr+'cmax'],
                auto = t[attr+'cauto'];
            if(typeof scl === 'string' && scl in Plotly.colorscales) {
                scl = Plotly.colorscales[scl];
            }
            else if(!scl) {
                scl = Plotly.defaultColorscale;
            }

            // autoscale the colors - put the results back into t
            // (which is in calcdata)
            if(auto || !$.isNumeric(min) || !$.isNumeric(max)) {
                min = max = null;
                s.each(function(d){
                    var v = d[attr+'c'];
                    if($.isNumeric(v)) {
                        if(min===null || min>v) { min = v; }
                        if(max===null || max<v) { max = v; }
                    }
                });
                t[attr+'cmin'] = min;
                t[attr+'cmax'] = max;
            }

            var d = scl.map(function(si){ return min + si[0]*(max-min); }),
                r = scl.map(function(si){ return si[1]; }),
                sclfunc = d3.scale.linear()
                    .domain(d)
                    .interpolate(d3.interpolateRgb)
                    .range(r);
            return function(v){ return $.isNumeric(v) ? sclfunc(v) : v; };
        }
        else { return Plotly.Lib.identity; }
    };

    // draw text at points
    var TEXTOFFSETSIGN = {start:1,end:-1,middle:0,bottom:1,top:-1},
        LINEEXPAND = 1.3;
    drawing.textPointStyle = function(s,t) {
        s.each(function(d){
            var p = d3.select(this);
            if(!d.tx) { p.remove(); return; }
            var pos = d.tp || t.tp || (d.t ? d.t.tp : ''),
                v = pos.indexOf('top')!==-1 ? 'top' :
                    pos.indexOf('bottom')!==-1 ? 'bottom' : 'middle',
                h = pos.indexOf('left')!==-1 ? 'end' :
                    pos.indexOf('right')!==-1 ? 'start' : 'middle',
                fontSize = d.ts || t.ts || (d.t ? d.t.tf : ''),
                // if markers are shown, offset a little more than
                // the nominal marker size
                // ie 2/1.6 * nominal, bcs some markers are a bit bigger
                r=t.mode.indexOf('markers')===-1 ? 0 :
                    (((d.ms+1 || t.ms+1 || (d.t ? d.t.ms : 0)+1)-1)/1.6+1);
            p.style('opacity', (d.mo+1 || t.mo+1 || (d.t ? d.t.mo : 0) +1) - 1)
                .call(drawing.font,
                    d.tf || t.tf || (d.t ? d.t.tf : ''),
                    fontSize,
                    d.tc || t.tc || (d.t ? d.t.tc : ''))
                .attr('text-anchor',h)
                .text(d.tx)
                .call(Plotly.util.convertToTspans);
            var pgroup = d3.select(this.parentNode),
                tspans = p.selectAll('tspan.line'),
                numLines = ((tspans[0].length||1)-1)*LINEEXPAND+1,
                dx = TEXTOFFSETSIGN[h]*r,
                dy = fontSize*0.75 + TEXTOFFSETSIGN[v]*r +
                    (TEXTOFFSETSIGN[v]-1)*numLines*fontSize/2;

            // fix the overall text group position
            pgroup.attr('transform','translate('+dx+','+dy+')');

            // then fix multiline text
            if(numLines>1) {
                tspans.attr({ x: p.attr('x'), y: p.attr('y') });
            }
        });
    };

    // generalized Catmull-Rom splines, per
    // http://www.cemyuksel.com/research/catmullrom_param/catmullrom.pdf
    var CatmullRomExp = 0.5;
    drawing.smoothopen = function(pts,smoothness) {
        if(pts.length<3) { return 'M' + pts.join('L');}
        var path = 'M'+pts[0],
            tangents = [], i;
        for(i=1; i<pts.length-1; i++) {
            tangents.push(makeTangent(pts[i-1], pts[i], pts[i+1], smoothness));
        }
        path += 'Q'+tangents[0][0]+' '+pts[1];
        for(i=2; i<pts.length-1; i++) {
            path += 'C'+tangents[i-2][1]+' '+tangents[i-1][0]+' '+pts[i];
        }
        path += 'Q'+tangents[pts.length-3][1]+' '+pts[pts.length-1];
        return path;
    };

    drawing.smoothclosed = function(pts,smoothness) {
        if(pts.length<3) { return 'M' + pts.join('L') + 'Z'; }
        var path = 'M'+pts[0],
            pLast = pts.length-1,
            tangents = [makeTangent(pts[pLast],
                            pts[0], pts[1], smoothness)],
            i;
        for(i=1; i<pLast; i++) {
            tangents.push(makeTangent(pts[i-1], pts[i], pts[i+1], smoothness));
        }
        tangents.push(
            makeTangent(pts[pLast-1], pts[pLast], pts[0], smoothness)
        );

        for(i=1; i<=pLast; i++) {
            path += 'C'+tangents[i-1][1]+' '+tangents[i][0]+' '+pts[i];
        }
        path += 'C'+tangents[pLast][1]+' '+tangents[0][0]+' '+pts[0] + 'Z';
        return path;
    };

    function makeTangent(prevpt,thispt,nextpt,smoothness) {
        var d1x = prevpt[0]-thispt[0],
            d1y = prevpt[1]-thispt[1],
            d2x = nextpt[0]-thispt[0],
            d2y = nextpt[1]-thispt[1],
            d1a = Math.pow(d1x*d1x + d1y*d1y, CatmullRomExp/2),
            d2a = Math.pow(d2x*d2x + d2y*d2y, CatmullRomExp/2),
            numx = (d2a*d2a*d1x - d1a*d1a*d2x)*smoothness,
            numy = (d2a*d2a*d1y - d1a*d1a*d2y)*smoothness,
            denom1 = 3*d2a*(d1a+d2a),
            denom2 = 3*d1a*(d1a+d2a);
        return [
            [
                d3.round(thispt[0]+(denom1 && numx/denom1),2),
                d3.round(thispt[1]+(denom1 && numy/denom1),2)
            ],[
                d3.round(thispt[0]-(denom2 && numx/denom2),2),
                d3.round(thispt[1]-(denom2 && numy/denom2),2)
            ]
        ];
    }

    // step paths - returns a generator function for paths
    // with the given step shape
    var STEPPATH = {
        hv: function(p0,p1) {
            return 'H'+d3.round(p1[0],2)+'V'+d3.round(p1[1],2);
        },
        vh: function(p0,p1) {
            return 'V'+d3.round(p1[1],2)+'H'+d3.round(p1[0],2);
        },
        hvh: function(p0,p1) {
            return 'H'+d3.round((p0[0]+p1[0])/2,2)+'V'+
                d3.round(p1[1],2)+'H'+d3.round(p1[0],2);
        },
        vhv: function(p0,p1) {
            return 'V'+d3.round((p0[1]+p1[1])/2,2)+'H'+
                d3.round(p1[0],2)+'V'+d3.round(p1[1],2);
        }
    };
    var STEPLINEAR = function(p0,p1) {
        return 'L'+d3.round(p1[0],2)+','+d3.round(p1[1],2);
    };
    drawing.steps = function(shape) {
        var onestep = STEPPATH[shape] || STEPLINEAR;
        return function(pts) {
            var path = 'M'+d3.round(pts[0][0],2)+','+d3.round(pts[0][1],2);
            for(var i=1; i<pts.length; i++) {
                path += onestep(pts[i-1],pts[i]);
            }
            return path;
        };
    };

    // use our offscreen tester to get a clientRect for an element,
    // in a reference frame where it isn't translated and its anchor
    // point is at (0,0)
    var savedBBoxes = [],
        maxSavedBBoxes = 10000;
    drawing.bBox = function(node) {
        // cache elements we've already measured so we don't have to
        // remeasure the same thing many times
        var saveNum = node.attributes['data-bb'];
        if(saveNum) { return savedBBoxes[saveNum.value]; }

        var test3 = d3.select('#js-plotly-tester'),
            tester = test3.node();

        // copy the node to test into the tester
        var testNode = node.cloneNode(true);
        tester.appendChild(testNode);
        // standardize its position... do we really want to do this?
        d3.select(testNode).attr({x:0, y:0, transform:''});

        var testRect = testNode.getBoundingClientRect(),
            refRect = test3.select('.js-reference-point')
                .node().getBoundingClientRect();

        tester.removeChild(testNode);

        var bb = {
            height: testRect.height,
            width: testRect.width,
            left: testRect.left - refRect.left,
            top: testRect.top - refRect.top,
            right: testRect.right - refRect.left,
            bottom: testRect.bottom - refRect.top
        };

        // make sure we don't have too many saved boxes,
        // or a long session could overload on memory
        // by saving boxes for long-gone elements
        if(savedBBoxes.length>=maxSavedBBoxes) {
            $('[data-bb]').attr('data-bb',null);
            savedBBoxes = [];
        }

        // cache this bbox
        $(node).attr('data-bb',savedBBoxes.length);
        savedBBoxes.push(bb);

        return bb;
    };

}()); // end Drawing object definition
