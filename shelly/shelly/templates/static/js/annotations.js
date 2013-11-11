(function() {
var annotations = Plotly.Annotations = {};

annotations.drawAll = function(gd) {
    var anns = gd.layout.annotations;
    gd.layout._infolayer.selectAll('.annotation').remove();
    if(anns) { for(var i in anns) { annotations.draw(gd,i); } }
};

annotations.add = function(gd) {
    var anns = gd.layout.annotations || [];
    Plotly.relayout(gd, 'annotations['+anns.length+']', 'add');
};

// -----------------------------------------------------
// make or edit an annotation on the graph
// -----------------------------------------------------

// annotations are stored in gd.layout.annotations, an array of objects
// index can point to one item in this array,
//  or non-numeric to simply add a new one
//  or -1 to modify all existing
// opt can be the full options object, or one key (to be set to value)
//  or undefined to simply redraw
// if opt is blank, val can be 'add' or a full options object to add a new
//  annotation at that point in the array, or 'remove' to delete this annotation
annotations.draw = function(gd,index,opt,value) {
    // console.log(index,opt,value,gd.layout.annotations);
    var gl = gd.layout,
        gm = gd.margin,
        MINDRAG = Plotly.Fx.MINDRAG,
        i;
    if(!gl.annotations) { gl.annotations = []; }

    if(!$.isNumeric(index) || index==-1) {
        if(!index && $.isArray(value)) { // a whole annotation array is passed in (as in, redo of delete all)
            gl.annotations = value;
            annotations.drawAll(gd);
            return;
        }
        else if(value=='remove') { // delete all
            gl.annotations = [];
            annotations.drawAll(gd);
            return;
        }
        else if(opt && value!='add') {
            for(i=0; i<gl.annotations.length; i++) { annotations.draw(gd,i,opt,value); }
            return;
        }
        else {
            index = gl.annotations.length;
            gl.annotations.push({});
        }
    }

    if(!opt && value) {
        if(value=='remove') {
            gl._infolayer.selectAll('.annotation[data-index="'+index+'"]').remove();
            gl.annotations.splice(index,1);
            for(i=index; i<gl.annotations.length; i++) {
                gl._infolayer.selectAll('.annotation[data-index="'+(i+1)+'"]')
                    .attr('data-index',String(i));
                annotations.draw(gd,i); // redraw all annotations past the removed, so they bind to the right events
            }
            return;
        }
        else if(value=='add' || $.isPlainObject(value)) {
            gl.annotations.splice(index,0,{});
            if($.isPlainObject(value)) { Object.keys(value).forEach(function(k){ gl.annotations[index][k] = value[k]; }); }
            for(i=gl.annotations.length-1; i>index; i--) {
                gl._infolayer.selectAll('.annotation[data-index="'+(i-1)+'"]')
                    .attr('data-index',String(i));
                annotations.draw(gd,i);
            }
        }
    }

    // remove the existing annotation if there is one
    gl._infolayer.selectAll('.annotation[data-index="'+index+'"]').remove();

    // edit the options
    var options = gl.annotations[index],
        // oldref = options.ref,
        oldref = {
            x: options.xref || (options.ref=='paper' ? 'paper' : 'x'), // options.ref for backward compat only
            y: options.yref || (options.ref=='paper' ? 'paper' : 'y')
        };
    if(typeof opt == 'string' && opt) { Plotly.Lib.nestedProperty(options,opt).set(value); }
    else if($.isPlainObject(opt)) { Object.keys(opt).forEach(function(k){ options[k] = opt[k]; }); }

    // set default options (default x, y, ax, ay are set later)
    if(!options.bordercolor) { options.bordercolor = ''; }
    if(!$.isNumeric(options.borderwidth)) { options.borderwidth = 1; }
    if(!options.bgcolor) { options.bgcolor = 'rgba(0,0,0,0)'; }
    // if(!options.ref) { options.ref='plot'; }
    if(!options.xref) { options.xref=oldref.x; }
    if(!options.yref) { options.yref=oldref.y; }
    if(options.showarrow!==false) { options.showarrow=true; }
    if(!$.isNumeric(options.borderpad)) { options.borderpad=1; }
    if(!options.arrowwidth) { options.arrowwidth = 0; }
    if(!options.arrowcolor) { options.arrowcolor = ''; }
    if(!$.isNumeric(options.arrowhead)) { options.arrowhead=1; }
    if(!$.isNumeric(options.arrowsize)) { options.arrowsize=1; }
    if(!options.tag) { options.tag=''; }
    if(!options.text) { options.text=((options.showarrow && (options.text==='')) ? '' : 'new text'); }
    if(!options.font) { options.font={family:'',size:0,color:''}; }
    if(!options.opacity) { options.opacity=1; }

    // get the paper and plot bounding boxes before adding pieces that go off screen
    // firefox will include things that extend outside the original... can we avoid that?
    var paperBB = gl._paperdiv.node().getBoundingClientRect(),
        //plotBB = d3.select(gd).select('.nsewdrag').node().getBoundingClientRect(),
        annPosPx = {
            x: 0,//gd.margin.l,//plotBB.left-paperBB.left,
            y: 0//gd.margin.t//plotBB.top-paperBB.top
        };

    // create the components
    // TODO: make a single group to contain all, so opacity can work right with border/arrow together
    var ann = gl._infolayer.append('svg')
        .attr('class','annotation')
        .attr('data-cmmt',options.tag)
        .call(Plotly.Drawing.setPosition,0,0)
        .attr('data-index',String(index))
        .style('opacity',options.opacity);

    var borderwidth = options.borderwidth;
    var annbg = ann.append('rect')
        .attr('class','bg')
        .call(Plotly.Drawing.strokeColor,options.bordercolor || 'rgba(0,0,0,0)')
        .attr('stroke-width',borderwidth)
        .call(Plotly.Drawing.fillColor,options.bgcolor)
        .call(Plotly.Drawing.setPosition, borderwidth/2+1, borderwidth/2+1);

    if(!options.align) options.align='center';
    var anntext = ann.append('text')
        .attr('class','annotation')
        .attr('data-cmmt',options.tag)
        .call(Plotly.Drawing.setPosition,0,0)
        .attr('text-anchor',{left:'start', center:'middle', right:'end'}[options.align])
        .call(Plotly.Drawing.font,
            options.font.family||gl.font.family||'Arial',
            options.font.size||gl.font.size||12,
            options.font.color||gl.font.color||'#000');
    Plotly.Drawing.styleText(anntext.node(),options.text,'clickable');

    if(gd.mainsite) {
        anntext.on('click',function(){ if(!gd.dragged) { Plotly.Fx.autoGrowInput(this); } });
    }

    var anntextBB = anntext.node().getBoundingClientRect(),
        annwidth = anntextBB.width,
        annheight = anntextBB.height;
    // save size in the annotation object for use by autoscale
    options._w = annwidth;
    options._h = annheight;

    function fshift(v){ return Plotly.Lib.constrain(Math.floor(v*3-1),-0.5,0.5); }

    var okToContinue = true;
    ['x','y'].forEach(function(axletter) {
        var ax = Plotly.Axes.getFromId(gd,options[axletter+'ref']||axletter),
            axOld = Plotly.Axes.getFromId(gd,oldref[axletter]||axletter),
            typeAttr = '_'+axletter+'type',
            annSize = axletter=='x' ? annwidth : -annheight,
            axRange = (ax||axOld) ? (ax||axOld).range[1]-(ax||axOld).range[0] : null,
            defaultVal = ax ? ax.range[0] + (axletter=='x' ? 0.1 : 0.3)*axRange :
                (axletter=='x' ? 0.1 : 0.7);

        // if we're still referencing the same axis, see if it has changed linear <-> log
        if(ax && ax==axOld && options[typeAttr]) {
            checklog(options,ax);
        }
        // if we're changing a reference axis on an existing annotation
        else if($.isNumeric(options[axletter]) && ax!==axOld) {
            // moving from one axis to another - just reset to default
            // TODO: if the axes overlap, perhaps we could put it in the equivalent position on the new one?
            if(ax && axOld) {
                options[axletter] = defaultVal;
            }
            // moving from paper to plot reference
            else if(ax) {
                if(!ax.domain) { ax.domain = [0,100]; }
                var axFraction = (options[axletter]*100-ax.domain[0])/(ax.domain[1]-ax.domain[0]);
                options[axletter] = ax.range[0] + axRange*axFraction -
                    (options.showarrow ? 0 : fshift(axFraction)*annSize/ax._m);
            }
            // moving from plot to paper reference
            else if(axOld) {
                if(!axOld.domain) { axOld.domain = [0,100]; }
                options[axletter] = ( axOld.domain[0] + (axOld.domain[1]-axOld.domain[0])*
                    (options[axletter]-axOld.range[0])/axRange )/100;
                if(!options.showarrow) {
                    options[axletter] += fshift(options[axletter])*annSize/(axRange*ax._m);
                }
            }
        }

        // calculate pixel position
        if(!$.isNumeric(options[axletter])) { options[axletter] = defaultVal; }
        if(!ax) {
            annPosPx[axletter] = (axletter=='x') ?
                (gd.margin.l + gd.plotwidth*options[axletter]) :
                (gd.margin.t + gd.plotheight*(1-options[axletter]));
            if(!options.showarrow){
                annPosPx[axletter] -= annSize*fshift(options[axletter]);
            }
        }
        else {
            // hide the annotation if it's pointing outside the visible plot
            if((options[axletter]-ax.range[0])*(options[axletter]-ax.range[1])>0) { okToContinue = false; }
            annPosPx[axletter] = ax._offset+ax.l2p(options[axletter]);
            // console.log(options[axletter],ax.range[0],ax.range[1],okToContinue);
        }

        // save the current axis type for later log/linear changes
        options[typeAttr] = ax && ax.type;
    });

    if(!okToContinue) {
        ann.remove();
        return;
    }

    if(!options.ax) { options.ax=-10; }
    if(!options.ay) { options.ay=-annheight/2-20; }
    // now position the annotation and arrow, based on options[x,y,ref,showarrow,ax,ay]

    // position is either in plot coords (ref='plot') or
    // in fraction of the plot area (ref='paper') as with legends,
    // except that positions outside the plot are just numbers outside [0,1]
    // but we will constrain the annotation center to be on the page,
    // in case it gets dragged too far.

    // if there's no arrow, alignment is as with legend (values <1/3 align the low side
    // at that fraction, 1/3-2/3 align the center at that fraction, >2/3 align the right
    // at that fraction) independent of the alignment of the text

    // if there is an arrow, alignment is to the arrowhead, and ax and ay give the
    // offset (in pixels) between the arrowhead and the center of the annotation


    // if there's an arrow, it gets the position we just calculated, and the text gets offset by ax,ay
    // and make sure the text and arrowhead are on the paper
    if(options.showarrow){
        var ax = Plotly.Lib.constrain(annPosPx.x,1,paperBB.width-1),
            ay = Plotly.Lib.constrain(annPosPx.y,1,paperBB.height-1);
        annPosPx.x += options.ax;
        annPosPx.y += options.ay;
    }
    annPosPx.x = Plotly.Lib.constrain(annPosPx.x,1,paperBB.width-1);
    annPosPx.y = Plotly.Lib.constrain(annPosPx.y,1,paperBB.height-1);

    var borderpad = Number(options.borderpad),
        borderfull = borderwidth+borderpad+1,
        outerwidth = annwidth+2*borderfull,
        outerheight = annheight+2*borderfull;
    ann.call(Plotly.Drawing.setRect,
        annPosPx.x-outerwidth/2, annPosPx.y-outerheight/2, outerwidth, outerheight);
    annbg.call(Plotly.Drawing.setSize,
        annwidth+borderwidth+2*borderpad, annheight+borderwidth+2*borderpad);
    anntext.call(Plotly.Drawing.setPosition,
        paperBB.left-anntextBB.left+borderfull, paperBB.top-anntextBB.top+borderfull)
      .selectAll('tspan.nl')
        .attr('x',paperBB.left-anntextBB.left+borderfull);

    // add the arrow
    // uses options[arrowwidth,arrowcolor,arrowhead] for styling
    var drawArrow = function(dx,dy){
        $(gd).find('g.annotation[data-index="'+index+'"]').remove();
        // find where to start the arrow:
        // at the border of the textbox, if that border is visible,
        // or at the edge of the lines of text, if the border is hidden
        // TODO: commented out for now... tspan bounding box fails in chrome
        // looks like there may be a cross-browser solution, see
        // http://stackoverflow.com/questions/5364980/how-to-get-the-width-of-an-svg-tspan-element
        var ax0 = annPosPx.x+dx,
            ay0 = annPosPx.y+dy,
            showline = true;
//         if(borderwidth && tinycolor(bordercolor).alpha) {
            var boxes = [annbg.node().getBoundingClientRect()],
                pad = 0;
//         }
//         else {
//             var end_el = anntext.selectAll('tspan'),
//                 pad = 3;
//         }
        boxes.forEach(function(bb){
            var x1 = bb.left-paperBB.left-pad,
                y1 = bb.top-paperBB.top-pad,
                x2 = bb.right-paperBB.left+pad,
                y2 = bb.bottom-paperBB.top+pad,
                edges = [[x1,y1,x1,y2],[x1,y2,x2,y2],[x2,y2,x2,y1],[x2,y1,x1,y1]];
            if(ax>x1 && ax<x2 && ay>y1 && ay<y2) { // remove the line if it ends inside the box
                showline=false;
                return;
            }
            edges.forEach(function(i){
                var p = line_intersect(ax0,ay0,ax,ay,i[0],i[1],i[2],i[3]);
                if(p) {
                    ax0 = p.x;
                    ay0 = p.y;
                }
            });
        });
        if(showline) {
            var strokewidth = options.arrowwidth || borderwidth*2 || 2;
            var arrowgroup = gl._infolayer.append('g')
                .attr('class','annotation')
                .attr('data-cmmt',options.tag)
                .attr('data-index',String(index))
                .style('opacity',options.opacity);
            var arrow = arrowgroup.append('path')
                .attr('class','annotation')
                .attr('data-cmmt',options.tag)
                .attr('data-index',String(index))
                .attr('d','M'+ax0+','+ay0+'L'+ax+','+ay)
                .attr('stroke-width',strokewidth)
                .call(Plotly.Drawing.strokeColor,options.arrowcolor ||
                    (Plotly.Drawing.opacity(options.bordercolor) ? options.bordercolor : '') || '#000');
            arrowhead(arrow,options.arrowhead,'end',options.arrowsize);
            var arrowdrag = arrowgroup.append('path')
                .attr('class','annotation anndrag')
                .attr('data-cmmt',options.tag)
                .attr('data-index',String(index))
                .attr('d','M3,3H-3V-3H3ZM0,0L'+(ax0-ax)+','+(ay0-ay))
                .attr('transform','translate('+ax+','+ay+')')
                .attr('stroke-width',strokewidth+6)
                .call(Plotly.Drawing.strokeColor,'rgba(0,0,0,0)')
                .call(Plotly.Drawing.fillColor,'rgba(0,0,0,0)');
            if(gd.mainsite) { arrowdrag.node().onmousedown = function(e) {
                if(Plotly.Fx.dragClear(gd)) { return true; } // deal with other UI elements, and allow them to cancel dragging

                var eln = this,
                    el3 = d3.select(this),
                    annx0 = Number(ann.attr('x')),
                    anny0 = Number(ann.attr('y')),
                    update = {},
                    annbase = 'annotations['+index+']';
                gd.dragged = false;
                window.onmousemove = function(e2) {
                    var dx = e2.clientX-e.clientX,
                        dy = e2.clientY-e.clientY;
                    if(Math.abs(dx)<MINDRAG) { dx=0; }
                    if(Math.abs(dy)<MINDRAG) { dy=0; }
                    if(dx||dy) { gd.dragged = true; }
                    arrowgroup.attr('transform','translate('+dx+','+dy+')');
                    ann.call(Plotly.Drawing.setPosition, annx0+dx, anny0+dy);
                    if(options.ref=='paper') {
                        update[annbase+'.x'] = (ax+dx-gm.l)/(gl.width-gm.l-gm.r);
                        update[annbase+'.y'] = 1-((ay+dy-gm.t)/(gl.height-gm.t-gm.b));
                    }
                    else {
                        update[annbase+'.x'] = options.x+dx/gl.xaxis._m;
                        update[annbase+'.y'] = options.y+dy/gl.yaxis._m;
                    }
                    return Plotly.Lib.pauseEvent(e2);
                };
                window.onmouseup = function(e2) {
                    window.onmousemove = null; window.onmouseup = null;
                    if(gd.dragged) { Plotly.relayout(gd,update); }
                    return Plotly.Lib.pauseEvent(e2);
                };
                return Plotly.Lib.pauseEvent(e);
            };}
        }
    };
    if(options.showarrow) { drawArrow(0,0); }

    // user dragging the annotation (text, not arrow)
    if(gd.mainsite) { ann.node().onmousedown = function(e) {

        if(Plotly.Fx.dragClear(gd)) { return true; } // deal with other UI elements, and allow them to cancel dragging

        var eln=this,
            el3=d3.select(this),
            x0=Number(el3.attr('x')),
            y0=Number(el3.attr('y')),
            update = {},
            annbase = 'annotations['+index+']';
        gd.dragged = false;
        Plotly.Fx.setCursor(el3);

        window.onmousemove = function(e2) {
            var dx = e2.clientX-e.clientX,
                dy = e2.clientY-e.clientY;
            if(Math.abs(dx)<MINDRAG) { dx=0; }
            if(Math.abs(dy)<MINDRAG) { dy=0; }
            if(dx||dy) { gd.dragged = true; }
            el3.call(Plotly.Drawing.setPosition, x0+dx, y0+dy);
            var csr = 'pointer';
            if(options.showarrow) {
                update[annbase+'.ax'] = options.ax+dx;
                update[annbase+'.ay'] = options.ay+dy;
                drawArrow(dx,dy);
            }
            else if(options.ref=='paper') {
                update[annbase+'.x'] = Plotly.Fx.dragAlign(x0+dx+borderfull,annwidth,gm.l,gl.width-gm.r);
                update[annbase+'.y'] = 1-Plotly.Fx.dragAlign(y0+dy+borderfull,annheight,gm.t,gl.height-gm.b);
                csr = Plotly.Fx.dragCursors(update[annbase+'.x'],update[annbase+'.y']);
            }
            else {
                update[annbase+'.x'] = options.x+dx/gl.xaxis._m;
                update[annbase+'.y'] = options.y+dy/gl.yaxis._m;
            }
            Plotly.Fx.setCursor(el3,csr);
            return Plotly.Lib.pauseEvent(e2);
        };

        window.onmouseup = function(e2) {
            window.onmousemove = null; window.onmouseup = null;
            Plotly.Fx.setCursor(el3);
            if(gd.dragged) { Plotly.relayout(gd,update); }
            return Plotly.Lib.pauseEvent(e2);
        };

        return Plotly.Lib.pauseEvent(e);
    };}
};

// check if we need to edit the annotation position for log/linear changes
function checklog(options,ax) {
    var axletter = ax._id.charAt(0),
        typeAttr = '_'+axletter+'type',
        oldtype = options[typeAttr],
        newtype = ax.type;
    if(oldtype) {
        if(oldtype=='log' && newtype!='log') {
            options[axletter] = Math.pow(10,options[axletter]);
        }
        else if(oldtype!='log' && newtype=='log') {
            options[axletter] = (options[axletter]>0) ?
                Math.log(options[axletter])/Math.LN10 :
                (ax.range[0]+ax.range[1])/2;
        }
    }
    options[typeAttr] = newtype;
}

// centerx is a center of scaling tuned for maximum scalability of the arrowhead
// ie throughout mag=0.3..3 the head is joined smoothly to the line, but the endpoint
// moves. TODO: step back the head and line so that the actual end of the line (except for
// circle and square) is at exactly the point it's pointing to, for best scaling and rotating.
// could even have the pointed-to point a little in front of the end of the line, as people
// tend to want a bit of a gap there...
ARROWPATHS = [
    '', // no arrow
    {path:'M-2,-3V3L1,0Z',centerx:0.4}, // wide with flat back
    {path:'M-3,-2.5V2.5L2,0Z',centerx:0.7}, // narrower with flat back
    {path:'M-4,-3L-1.2,-0.2V0.2L-4,3L2,0Z',centerx:0.45}, // barbed
    {path:'M-2.2,-2.2L-0.2,-0.2V0.2L-2.2,2.2L-1.4,3L1.6,0L-1.4,-3Z',centerx:0}, // wide line-drawn
    {path:'M-4.2,-2.1L-0.4,-0.2V0.2L-4.2,2.1L-3.8,3L2.2,0L-3.8,-3Z',centerx:0.2}, // narrower line-drawn
    {path:'M2,0A2,2 0 1,1 0,-2A2,2 0 0,1 2,0Z',centerx:0}, // circle
    {path:'M2,2V-2H-2V2Z',centerx:0} // square
];

// add arrowhead(s) to a path or line d3 element el3
// style: 1-6, first 5 are pointers, 6 is circle, 7 is square, 8 is none
// ends is 'start', 'end' (default), 'start+end'
// mag is magnification vs. default (default 1)
function arrowhead(el3,style,ends,mag) {
    if(!$.isNumeric(mag)) { mag=1; }
    var el = el3.node();
        headStyle = ARROWPATHS[style||0];
    if(!headStyle) { return; }
    if(typeof ends != 'string' || !ends) { ends = 'end'; }

    var start,end,dstart,dend,pathlen;
    if(el.nodeName=='line') {
        start = {x:el3.attr('x1'),y:el3.attr('y1')};
        end = {x:el3.attr('x2'),y:el3.attr('y2')};
        dstart = end;
        dend = start;
    }
    else if(el.nodeName=='path') {
        start = el.getPointAtLength(0);
        dstart = el.getPointAtLength(0.1);
        pathlen = el.getTotalLength();
        end = el.getPointAtLength(pathlen);
        dend = el.getPointAtLength(pathlen-0.1);
    }

    var drawhead = function(p,q) {
        var rot = Math.atan2(p.y-q.y,p.x-q.x)*180/Math.PI,
            scale = (el3.attr('stroke-width') || 1)*(mag),
            stroke = el3.attr('stroke') || '#000',
            opacity = el3.style('stroke-opacity') || 1;
        if(style>5) { rot=0; } // don't rotate square or circle
        d3.select(el.parentElement).append('path')
            .attr('class',el3.attr('class'))
            .attr('data-cmmt',el3.attr('data-cmmt'))
            .attr('data-index',el3.attr('data-index'))
            .style('fill',stroke)
            .style('fill-opacity',opacity)
            .attr('stroke-width',0)
            .attr('d',headStyle.path)
            .attr('transform','translate('+p.x+','+p.y+')rotate('+rot+')'+
                'translate('+(headStyle.centerx*scale*(1/mag-1))+',0)scale('+scale+')');
    };

    if(ends.indexOf('start')>=0) { drawhead(start,dstart); }
    if(ends.indexOf('end')>=0) { drawhead(end,dend); }
}

// allArrowheads: call twice to make an arrowheads dropdown.
// once (with no container) for the data to send to layoutBoxDrop,
// and again (with a container) to add arrowheads to the list
annotations.allArrowheads = function(container){
    // if a dom element is passed in, add appropriate arrowheads to every arrowhead selector in the container
    if(container) {
        $(container).find('[data-arrowhead]').each(function(){
            arrowhead(d3.select(this).select('line'),Number($(this).attr('data-arrowhead')));
        });
        return;
    }
    // with no args, output an array of elements for the dropdown list
    var outArray = [];
    for(var i=0; i<ARROWPATHS.length; i++) {
        outArray.push({
            val:i,
            name:'<svg width="40" height="20" data-arrowhead="'+i+'" style="position: relative; top: 2px;">'+
                '<line stroke="rgb(0,0,0)" style="fill: none;" x1="5" y1="10" x2="25" y2="10" stroke-width="2">'+
                '</line></svg>'
        });
    }
    return outArray;
};

annotations.calcAutorange = function(gd) {
    var gl = gd.layout, gm = gd.margin;

    if(!gl.annotations || !gd.data || !gd.data.length) { return; }
    if(!Plotly.Axes.list(gd).filter(function(ax) { return ax.autorange; }).length) { return; }

    var saveAnnotations = gl.annotations, // store the real annotations
        paperBB = gl._paperdiv.node().getBoundingClientRect(),
        plotcenterx = (paperBB.left+paperBB.right+gm.l-gm.r)/2,
        plotcentery = (paperBB.top+paperBB.bottom+gm.t-gm.b)/2,
        blank = {left:plotcenterx, right:plotcenterx, top:plotcentery, bottom:plotcentery};

    // temporarily replace plot-referenced annotations with transparent, centered ones
    var tempAnnotations = [];
    saveAnnotations.forEach(function(ann){
        var xa = gl[Plotly.Axes.id2name(ann.xref || 'x')],
            ya = gl[Plotly.Axes.id2name(ann.yref || 'y')];
        if((xa && xa.autorange) || (ya && ya.autorange)) {
            if(xa) { checklog(ann,xa); }
            if(ya) { checklog(ann,ya); }
            tempAnnotations.push($.extend({},ann,
                {x:0.5, y:0.5, xref:'paper', yref:'paper', x0:ann.x, y0:ann.y, opacity:1, xa:xa, ya:ya}));
        }
    });
    gl.annotations = tempAnnotations;
    annotations.drawAll(gd);

    // find the bounding boxes for each of these annotations relative to the center of the plot
    gl.annotations.forEach(function(ann,i){
        var arrowNode = gl._infolayer.selectAll('g.annotation[data-index="'+i+'"]').node(),
            arrowBB = arrowNode ? arrowNode.getBoundingClientRect() : blank,
            textNode = gl._infolayer.selectAll('svg.annotation[data-index="'+i+'"]').node(),
            textBB = textNode ? textNode.getBoundingClientRect() : blank;
        if(ann.xa) {
            Plotly.Axes.expand(ann.xa, [ann.xa.l2c(ann.x0)],{
                ppadplus:Math.max(0,Math.max(arrowBB.right,textBB.right) - plotcenterx),
                ppadminus:Math.max(0,plotcenterx - Math.min(arrowBB.left,textBB.left))
            });
        }
        if(ann.ya) {
            Plotly.Axes.expand(ann.ya, [ann.ya.l2c(ann.y0)], {
                ppadplus:Math.max(0,Math.max(arrowBB.bottom,textBB.bottom) - plotcentery),
                ppadminus:Math.max(0,plotcentery - Math.min(arrowBB.top,textBB.top))
            });
        }
    });

    // restore the real annotations (will be redrawn later in Plotly.plot)
    gl.annotations = saveAnnotations;
};

// look for intersection of two line segments (1->2 and 3->4) - returns array [x,y] if they do, null if not
// return the intersection and the fraction of the way from 1->2 (t) and 3->4 (u)
function line_intersect(x1,y1,x2,y2,x3,y3,x4,y4) {
    var a=x2-x1, b=x3-x1, c=x4-x3,
        d=y2-y1, e=y3-y1, f=y4-y3,
        det=a*f-c*d;
    if(det===0) { return null; } // parallel lines, so intersection is undefined - ignore the case where they are colinear
    var t=(b*f-c*e)/det,
        u=(b*d-a*e)/det;
    if(u<0 || u>1 || t<0 || t>1) { return null; } // segments do not intersect
    return {x:x1+a*t, y:y1+d*t};
}

}()); // end Annotations object definition