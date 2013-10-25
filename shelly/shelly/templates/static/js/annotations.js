(function() {
var annotations = Plotly.Annotations = {};

annotations.drawAll = function(gd) {
    var anns = gd.layout.annotations;
    gd.infolayer.selectAll('.annotation').remove();
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
            gd.infolayer.selectAll('.annotation[data-index="'+index+'"]').remove();
            gl.annotations.splice(index,1);
            for(i=index; i<gl.annotations.length; i++) {
                gd.infolayer.selectAll('.annotation[data-index="'+(i+1)+'"]')
                    .attr('data-index',String(i));
                annotations.draw(gd,i); // redraw all annotations past the removed, so they bind to the right events
            }
            return;
        }
        else if(value=='add' || $.isPlainObject(value)) {
            gl.annotations.splice(index,0,{});
            if($.isPlainObject(value)) { Object.keys(value).forEach(function(k){ gl.annotations[index][k] = value[k]; }); }
            for(i=gl.annotations.length-1; i>index; i--) {
                gd.infolayer.selectAll('.annotation[data-index="'+(i-1)+'"]')
                    .attr('data-index',String(i));
                annotations.draw(gd,i);
            }
        }
    }

    // remove the existing annotation if there is one
    gd.infolayer.selectAll('.annotation[data-index="'+index+'"]').remove();

    // edit the options
    var options = gl.annotations[index];
    var oldref = options.ref,
        xa = gl.xaxis,
        ya = gl.yaxis,
        xr = xa.range[1]-xa.range[0],
        yr = ya.range[1]-ya.range[0];
    if(typeof opt == 'string' && opt) { Plotly.Lib.nestedProperty(options,opt).set(value); }
    else if($.isPlainObject(opt)) { Object.keys(opt).forEach(function(k){ options[k] = opt[k]; }); }

    // set default options (default x, y, ax, ay are set later)
    if(!options.bordercolor) { options.bordercolor = ''; }
    if(!$.isNumeric(options.borderwidth)) { options.borderwidth = 1; }
    if(!options.bgcolor) { options.bgcolor = 'rgba(0,0,0,0)'; }
    if(!options.ref) { options.ref='plot'; }
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
    var paperBB = gd.paperdiv.node().getBoundingClientRect(),
        plotBB = d3.select(gd).select('.nsewdrag').node().getBoundingClientRect(),
        x = plotBB.left-paperBB.left,
        y = plotBB.top-paperBB.top;

    // create the components
    var ann = gd.infolayer.append('svg')
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

    // check for change between log and linear
    // off-scale transition to log: put the annotation near low end of the log
    // axis, but not quite at it (in case that would put it off screen)
    function checklog(v,oldtype,newtype,dflt) {
        if(oldtype=='log' && newtype!='log') { return Math.pow(10,v); }
        else if(oldtype!='log' && newtype=='log') {
            return (v>0) ? Math.log(v)/Math.LN10 : dflt;
        }
        else { return v; }
    }
    if(options.ref=='plot') {
        options.x = checklog(options.x,options._xatype,xa.type,
            (xa.range[0]+xa.range[1]-Math.abs(xr*0.8))/2);
        options.y = checklog(options.y,options._yatype,ya.type,
            (ya.range[0]+ya.range[1]-Math.abs(yr*0.8))/2);
    }
    options._xatype=xa.type;
    options._yatype=ya.type;

    // check for change between paper and plot ref - need to wait for
    // annwidth/annheight to do this properly
    function fshift(v){ return Plotly.Lib.constrain(Math.floor(v*3-1),-0.5,0.5); }
    if(oldref && options.x && options.y) {
        if(options.ref=='plot' && oldref=='paper') {
            var xshift = 0, yshift = 0;
            if(!options.showarrow) {
                xshift = fshift(options.x)*annwidth/xa._m;
                yshift = fshift(options.y)*annheight/ya._m;
            }
            options.x = xa.range[0] + xr*options.x - xshift;
            options.y = ya.range[0] + yr*options.y + yshift;
        }
        else if(options.ref=='paper' && oldref=='plot') {
            options.x = (options.x-xa.range[0])/xr;
            options.y = (options.y-ya.range[0])/yr;
            if(!options.showarrow) {
                options.x += fshift(options.x)*annwidth/(xr*xa._m);
                options.y -= fshift(options.y)*annheight/(yr*ya._m);
            }
        }
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

    if(options.ref=='paper') {
        if(!$.isNumeric(options.x)) { options.x=0.1; }
        if(!$.isNumeric(options.y)) { options.y=0.7; }
        x += plotBB.width*options.x;
        y += plotBB.height*(1-options.y);
        if(!options.showarrow){
            if(options.x>2/3) { x -= annwidth/2; }
            else if(options.x<1/3) { x += annwidth/2; }

            if(options.y<1/3) { y -= annheight/2; }
            else if(options.y>2/3) { y += annheight/2; }
        }
    }
    else {
        // hide the annotation if it's pointing outside the visible plot
        if((options.x-xa.range[0])*(options.x-xa.range[1])>0 ||
            (options.y-ya.range[0])*(options.y-ya.range[1])>0) {
            ann.remove();
            return;
        }
        if(!$.isNumeric(options.x)) { options.x=(xa.range[0]*0.9+xa.range[1]*0.1); }
        if(!$.isNumeric(options.y)) { options.y=(ya.range[0]*0.7+ya.range[1]*0.3); }
        x += xa._b+options.x*xa._m;
        y += ya._b+options.y*ya._m;
    }

    // if there's an arrow, it gets the position we just calculated, and the text gets offset by ax,ay
    // and make sure the text and arrowhead are on the paper
    if(options.showarrow){
        var ax = Plotly.Lib.constrain(x,1,paperBB.width-1),
            ay = Plotly.Lib.constrain(y,1,paperBB.height-1);
        x += options.ax;
        y += options.ay;
    }
    x = Plotly.Lib.constrain(x,1,paperBB.width-1);
    y = Plotly.Lib.constrain(y,1,paperBB.height-1);

    var borderpad = Number(options.borderpad),
        borderfull = borderwidth+borderpad+1,
        outerwidth = annwidth+2*borderfull,
        outerheight = annheight+2*borderfull;
    ann.call(Plotly.Drawing.setRect, x-outerwidth/2, y-outerheight/2, outerwidth, outerheight);
    annbg.call(Plotly.Drawing.setSize, annwidth+borderwidth+2*borderpad, annheight+borderwidth+2*borderpad);
    anntext.call(Plotly.Drawing.setPosition, paperBB.left-anntextBB.left+borderfull, paperBB.top-anntextBB.top+borderfull)
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
        var ax0 = x+dx,
            ay0 = y+dy,
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
            var arrowgroup = gd.infolayer.append('g')
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

// add arrowhead(s) to a path or line d3 element el3
// style: 1-6, first 5 are pointers, 6 is circle, 7 is square, 8 is none
// ends is 'start', 'end' (default), 'start+end'
// mag is magnification vs. default (default 1)
function arrowhead(el3,style,ends,mag) {
    if(!$.isNumeric(mag)) { mag=1; }
    var el = el3.node();
        s = ['M-1,-2V2L1,0Z',
            'M-2,-2V2L2,0Z',
            'M-2,-2L0,0L-2,2L2,0Z',
            'M-2.2,-2.2L0,0L-2.2,2.2L-1.4,3L1.6,0L-1.4,-3Z',
            'M-4.2,-2.1L0,0L-4.2,2.1L-3.8,3L2.2,0L-3.8,-3Z',
            'M2,0A2,2 0 1,1 0,-2A2,2 0 0,1 2,0Z',
            'M2,2V-2H-2V2Z',
            ''][style-1];
    if(!s) { return; }
    if(typeof ends != 'string' || !ends) ends = 'end';

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
            .attr('d',s)
            .attr('transform','translate('+p.x+','+p.y+')rotate('+rot+')scale('+scale+')');
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
    return [1,2,3,4,5,6,7,8].map(function(i){
        return {
            val:i,
            name:'<svg width="40" height="20" data-arrowhead="'+i+'" style="position: relative; top: 2px;">'+
                '<line stroke="rgb(0,0,0)" style="fill: none;" x1="5" y1="10" x2="25" y2="10" stroke-width="2">'+
                '</line></svg>'
        }; });
};

annotations.calcAutorange = function(gd) {
    var gl = gd.layout, xa = gl.xaxis, ya = gl.yaxis;
    if((!xa.autorange && !ya.autorange) || !gl.annotations || !gd.data || !gd.data.length) { return; }

    var saveAnnotations = gl.annotations, // store the real annotations
        plotBB = gd.plotbg.node().getBoundingClientRect(),
        plotcenterx = (plotBB.left+plotBB.right)/2,
        plotcentery = (plotBB.top+plotBB.bottom)/2,
        blank = {left:plotcenterx, right:plotcenterx, top:plotcentery, bottom:plotcentery};

    // temporarily replace plot-referenced annotations with transparent, centered ones
    var tempAnnotations = [];
    saveAnnotations.forEach(function(ann){
        if(ann.ref=='plot') {
            tempAnnotations.push($.extend({},ann,
                {x:0.5, y:0.5, ref:'paper', x0:ann.x, y0:ann.y, opacity:1}));
        }
    });
    gl.annotations = tempAnnotations;
    annotations.drawAll(gd);

    // find the bounding boxes for each of these annotations relative to the center of the plot
    gl.annotations.forEach(function(ann,i){
        var arrowNode = gd.infolayer.selectAll('g.annotation[data-index="'+i+'"]').node(),
            arrowBB = arrowNode ? arrowNode.getBoundingClientRect() : blank,
            textNode = gd.infolayer.selectAll('svg.annotation[data-index="'+i+'"]').node(),
            textBB = textNode ? textNode.getBoundingClientRect() : blank,
            leftpad = Math.max(0,plotcenterx - Math.min(arrowBB.left,textBB.left)),
            rightpad = Math.max(0,Math.max(arrowBB.right,textBB.right) - plotcenterx),
            toppad = Math.max(0,plotcentery - Math.min(arrowBB.top,textBB.top)),
            bottompad = Math.max(0,Math.max(arrowBB.bottom,textBB.bottom) - plotcentery);
        Plotly.Axes.expand(xa, [xa.l2c(ann.x0)], {ppadplus:rightpad, ppadminus:leftpad});
        Plotly.Axes.expand(ya, [ya.l2c(ann.y0)], {ppadplus:bottompad, ppadminus:toppad});
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