

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
        gs = gl._size,
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

    // combine default and existing options (default x, y, ax, ay are set later)
    var oldopts = gl.annotations[index],
        oldref = {
            x: oldopts.xref || (oldopts.ref=='paper' ? 'paper' : 'x'), // .ref for backward compat only (that was from before multiaxes)
            y: oldopts.yref || (oldopts.ref=='paper' ? 'paper' : 'y')
        },
        options = $.extend({
            text: 'new text',
            bordercolor: '',
            borderwidth: 1,
            borderpad: 1,
            bgcolor: 'rgba(0,0,0,0)',
            xref: oldref.x,
            yref: oldref.y,
            showarrow: true,
            arrowwidth: 0,
            arrowcolor: '',
            arrowhead: 1,
            arrowsize: 1,
	    textangle: 0,
            tag: '',
            font: {family:'',size:0,color:''},
            opacity: 1,
            align: 'center',
            xanchor: 'auto',
            yanchor: 'auto'
        },oldopts);
    gl.annotations[index] = options;

    // most options we can allow bad entries to silently revert to defaults... but anchors
    // may make weird behavior if you mix x and y like xanchor='top'
    if(['left','right','center'].indexOf(options.xanchor)==-1) { options.xanchor = 'auto'; }
    if(['top','bottom','middle'].indexOf(options.yanchor)==-1) { options.yanchor = 'auto'; }

    if(typeof opt == 'string' && opt) {
        Plotly.Lib.nestedProperty(options,opt).set(value);
    }
    else if($.isPlainObject(opt)) { Object.keys(opt).forEach(function(k){
        Plotly.Lib.nestedProperty(options,k).set(opt[k]);
    }); }

    if(!options.text) { options.text=options.showarrow ? '&nbsp;' : 'new text'; }

    // get the paper and plot bounding boxes before adding pieces that go off screen
    // firefox will include things that extend outside the original... can we avoid that?
    var paperBB = gl._paperdiv.node().getBoundingClientRect(),
        annPosPx = {x:0, y:0};


    var textangle = options.textangle || 0;

    // create the components
    // made a single group to contain all, so opacity can work right with border/arrow together
    // this could handle a whole bunch of cleanup at this point, but works for now
    var anngroup = gl._infolayer.append('g')
        .attr({'class':'annotation', 'data-index':String(index), 'data-cmmt':options.tag})
        .style('opacity',options.opacity);

    // another group for text and background so that they can rotate together
    var anng = anngroup.append('g')
        .attr({'class':'annotation-text-g', 'data-index':String(index)});

    var ann = anng.append('svg')
        .attr('data-cmmt',options.tag)
        .call(Plotly.Drawing.setPosition,0,0);

    var borderwidth = options.borderwidth;

    var annbg = ann.append('rect')
        .attr('class','bg')
        .style('stroke-width',borderwidth+'px')
        .call(Plotly.Drawing.strokeColor,options.bordercolor || 'rgba(0,0,0,0)')
        .call(Plotly.Drawing.fillColor,options.bgcolor);

    var font = options.font.family||gl.font.family||'Arial',
        fontSize = options.font.size||gl.font.size||12,
        fontColor = options.font.color||gl.font.color||'#444';
        // alignTo = {left:'right', center:'center', right:'left'}[options.align];

    var anntext = ann.append('text')
        .attr({'class':'annotation', 'data-cmmt':options.tag, 'data-unformatted': options.text})
        .text(options.text);

    if(gd.mainsite) {
        anntext.call(Plotly.util.makeEditable, annbg)
            .call(textLayout)
            .on('edit', function(_text){
                options.text = _text;
                this.attr({'data-unformatted': options.text});
                this.call(textLayout);
                var update = {},
                    xa = Plotly.Axes.getFromId(gd,options.xref),
                    ya = Plotly.Axes.getFromId(gd,options.yref);
                update['annotations['+index+'].text'] = options.text;
                if(xa && xa.autorange) { update[xa._name+'.autorange'] = true; }
                if(ya && ya.autorange) { update[ya._name+'.autorange'] = true; }
                Plotly.relayout(gd,update);
            });
    }
    else { anntext.call(textLayout); }

    function textLayout(){
        this.style({
            'font-family': font,
            'font-size': fontSize+'px',
            fill: Plotly.Drawing.rgb(fontColor),
            opacity: Plotly.Drawing.opacity(fontColor)
        })
        .attr({
            'text-anchor': {left:'start',right:'end'}[options.align]||'middle'
        });
        Plotly.util.convertToTspans(this, drawGraphicalElements);
        return this;
    }

    function drawGraphicalElements(){

        // make sure lines are aligned the way they will be at the end, even if their position changes
        anntext.selectAll('tspan.line').attr({y: 0, x: 0});

        var mathjaxGroup = ann.select('.annotation-math-group'),
            hasMathjax = !mathjaxGroup.empty(),
            anntextBB = (hasMathjax ? mathjaxGroup : anntext).node().getBoundingClientRect(),
            annwidth = anntextBB.width,
            annheight = anntextBB.height;

        // save size in the annotation object for use by autoscale
        options._w = annwidth;
        options._h = annheight;

        function fshift(v,anchor){
            if(anchor=='center' || anchor=='middle') { return 0; }
            else if(anchor=='left' || anchor=='bottom') { return -0.5; }
            else if(anchor=='right' || anchor=='top') { return 0.5; }
            else { return Plotly.Lib.constrain(Math.floor(v*3-1),-0.5,0.5); } // auto or missing
        }

        var okToContinue = true;
        ['x','y'].forEach(function(axletter) {
            var ax = Plotly.Axes.getFromId(gd,options[axletter+'ref']||axletter),
                axOld = Plotly.Axes.getFromId(gd,oldref[axletter]||axletter),
                typeAttr = '_'+axletter+'type',
                annSize = axletter=='x' ? annwidth : -annheight,
                axRange = (ax||axOld) ? (ax||axOld).range[1]-(ax||axOld).range[0] : null,
                defaultVal = ax ? ax.range[0] + (axletter=='x' ? 0.1 : 0.3)*axRange :
                    (axletter=='x' ? 0.1 : 0.7),
                anchor = options[axletter+'anchor'];

            // check for date or category strings
            if(ax && ['date','category'].indexOf(ax.type)!=-1 && typeof options[axletter]=='string') {
                var newval;
                if(ax.type=='date') {
                    newval = Plotly.Lib.dateTime2ms(options[axletter]);
                    if(newval!==false) { options[axletter] = newval; }
                }
                else if(ax.categories && ax.categories.length) {
                    newval = ax.categories.indexOf(options[axletter]);
                    if(newval!=-1) { options[axletter] = newval; }
                }
            }

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
                    if(!ax.domain) { ax.domain = [0,1]; }
                    var axFraction = (options[axletter]-ax.domain[0])/(ax.domain[1]-ax.domain[0]);
                    options[axletter] = ax.range[0] + axRange*axFraction -
                        (options.showarrow ? 0 : ((fshift(axFraction,anchor)-fshift(0,anchor))*annSize/ax._m));
                }
                // moving from plot to paper reference
                else if(axOld) {
                    if(!axOld.domain) { axOld.domain = [0,1]; }
                    options[axletter] = ( axOld.domain[0] + (axOld.domain[1]-axOld.domain[0])*
                        (options[axletter]-axOld.range[0])/axRange );
                    if(!options.showarrow) {
                        options[axletter] += (fshift(options[axletter],anchor)-fshift(0,anchor))*annSize/axOld._length;
                    }
                }
            }

            // calculate pixel position
            if(!$.isNumeric(options[axletter])) { options[axletter] = defaultVal; }
            if(!ax) {
                annPosPx[axletter] = (axletter=='x') ?
                    (gs.l + (gs.w)*options[axletter]) :
                    (gs.t + (gs.h)*(1-options[axletter]));
                // if(!options.showarrow){
                //     annPosPx[axletter] -= annSize*fshift(options[axletter],anchor);
                // }
            }
            else {
                // hide the annotation if it's pointing outside the visible plot
                if((options[axletter]-ax.range[0])*(options[axletter]-ax.range[1])>0) { okToContinue = false; }
                annPosPx[axletter] = ax._offset+ax.l2p(options[axletter]);
            }
            if(!options.showarrow) {
                annPosPx[axletter] -= annSize*fshift(ax ? 0 : options[axletter],anchor);
            }

            // save the current axis type for later log/linear changes
            options[typeAttr] = ax && ax.type;
        });

        if(!okToContinue) {
            ann.remove();
            return;
        }

        // default values for arrow vector
        if(!$.isNumeric(options.ax)) { options.ax=-10; }
        if(!$.isNumeric(options.ay)) { options.ay=-annheight/2-20; }
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
            bordershift = borderpad+borderwidth/2,
            borderfull = borderwidth+borderpad,
            texty = paperBB.top-anntextBB.top+borderfull;

        if(hasMathjax) {
            mathjaxGroup.select('svg').attr({x:borderfull-1, y:borderfull});
        }
        else {
            anntext.attr({x: paperBB.left-anntextBB.left+borderfull, y: texty});
            anntext.selectAll('tspan.line').attr({y: texty, x: paperBB.left-anntextBB.left+borderfull});
        }

        var outerwidth = Math.round(annwidth+2*borderfull),
            outerheight = Math.round(annheight+2*borderfull);

        annbg.call(Plotly.Drawing.setRect, borderwidth/2, borderwidth/2,
            outerwidth-borderwidth, outerheight-borderwidth);
        ann.call(Plotly.Drawing.setRect,
            Math.round(annPosPx.x-outerwidth/2), Math.round(annPosPx.y-outerheight/2),
                outerwidth, outerheight);

        // add the arrow
        // uses options[arrowwidth,arrowcolor,arrowhead] for styling
        var drawArrow = function(dx,dy){
            $(gd).find('.annotation-arrow-g[data-index="'+index+'"]').remove();
            // find where to start the arrow:
            // at the border of the textbox, if that border is visible,
            // or at the edge of the lines of text, if the border is hidden
            // TODO: commented out for now... tspan bounding box fails in chrome
            // looks like there may be a cross-browser solution, see
            // http://stackoverflow.com/questions/5364980/how-to-get-the-width-of-an-svg-tspan-element
            var ax0 = annPosPx.x+dx,
                ay0 = annPosPx.y+dy,
                showline = true;

	    // create transform matrix and related functions
	    var transform = Plotly.Lib.rotationXYMatrix(textangle, ax0, ay0);
	    var applyTransform = Plotly.Lib.apply2DTransform(transform);
	    var applyTransform2 = Plotly.Lib.apply2DTransform2(transform);

	    // de-rotate bakground so that getBoundingClientRect returns a
	    // thight bounding box
	    anng.attr("transform", function(d) {return '';})

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
                    edges = [[x1,y1,x1,y2],[x1,y2,x2,y2],[x2,y2,x2,y1],[x2,y1,x1,y1]].map(applyTransform2);

		// Remove the line if it ends inside the box.  Use ray
		// casting for rotated boxes: see which edges intersect a
		// line from the arrowhead to far away and reduce with xor
		// to get the parity of the number of intersections.
                if(edges.reduce(function(a,x) 
				{return a ^ 
				 !!line_intersect(ax, ay, ax+1e6, ay+1e6, 
						  x[0], x[1], x[2], x[3]);}, 
				false))
		{ 
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
                var strokewidth = options.arrowwidth || borderwidth*2 || 2,
                    arrowColor = options.arrowcolor ||
                        (Plotly.Drawing.opacity(options.bordercolor) ? options.bordercolor : '') || '#444';
		var arrowgroup = anngroup.append('g')
                    .attr('data-cmmt',options.tag)
                    .style({opacity: Plotly.Drawing.opacity(arrowColor)})
		    .attr({'class':'annotation-arrow-g', 'data-index':String(index)});
                var arrow = arrowgroup.append('path')
                    .attr('data-cmmt',options.tag)
                    .attr('d','M'+(ax0-1)+','+(ay0-1)+'L'+ax+','+ay) // no idea why the -1 here is needed
                    .style('stroke-width',strokewidth+'px')
                    .call(Plotly.Drawing.strokeColor,Plotly.Drawing.rgb(arrowColor));
                arrowhead(arrow,options.arrowhead,'end',options.arrowsize);
                var arrowdrag = arrowgroup.append('path')
                    .attr({
                        'class':'annotation anndrag',
                        'data-cmmt':options.tag,
                        'data-index':String(index),
                        'd':'M3,3H-3V-3H3ZM0,0L'+(ax0-ax)+','+(ay0-ay),
                        'transform':'translate('+ax+','+ay+')'})
                    .style('stroke-width',(strokewidth+6)+'px')
                    .call(Plotly.Drawing.strokeColor,'rgba(0,0,0,0)')
                    .call(Plotly.Drawing.fillColor,'rgba(0,0,0,0)');

                if(gd.mainsite) { arrowdrag.node().onmousedown = function(e) {
                    if(Plotly.Fx.dragClear(gd)) { return true; } // deal with other UI elements, and allow them to cancel dragging

                    var eln = this,
                        el3 = d3.select(this),
                        annx0 = Number(ann.attr('x')),
                        anny0 = Number(ann.attr('y')),
                        update = {},
                        annbase = 'annotations['+index+']',
                        xa = Plotly.Axes.getFromId(gd,options.xref),
                        ya = Plotly.Axes.getFromId(gd,options.yref);

                    if(xa && xa.autorange) { update[xa._name+'.autorange'] = true; }
                    if(ya && ya.autorange) { update[ya._name+'.autorange'] = true; }

                    gd.dragged = false;
                    window.onmousemove = function(e2) {
                        var dx = e2.clientX-e.clientX,
                            dy = e2.clientY-e.clientY;
                        if(Math.abs(dx)<MINDRAG) { dx=0; }
                        if(Math.abs(dy)<MINDRAG) { dy=0; }
                        if(dx||dy) { gd.dragged = true; }
                        arrowgroup.attr('transform','translate('+dx+','+dy+')'); 
			
			var annxy0 = applyTransform(annx0, anny0);
			ann.call(Plotly.Drawing.setPosition, annxy0[0]+dx, annxy0[1]+dy);

                        update[annbase+'.x'] = options.xref=='paper' ?
                            ((ax+dx-gs.l)/gs.w) :
                            (options.x+dx/Plotly.Axes.getFromId(gd,options.xref||'x')._m);
                        update[annbase+'.y'] = options.yref=='paper' ?
                            (1-((ay+dy-gs.t)/gs.h)) :
                            (options.y+dy/Plotly.Axes.getFromId(gd,options.yref||'y')._m);

			anng.attr("transform", function(d)
				  {return 'rotate(' + textangle + ', ' +
				   (annxy0[0]+dx) + ', ' + (annxy0[1]+dy) + ')';})

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


	// create transform matrix and related functions
	var transform = Plotly.Lib.rotationXYMatrix(textangle, annPosPx.x, annPosPx.y);
	var applyTransform = Plotly.Lib.apply2DTransform(transform);

        // user dragging the annotation (text, not arrow)
        if(gd.mainsite) {
            ann.node().onmousedown = function(e) {

                if(Plotly.Fx.dragClear(gd)) { return true; } // deal with other UI elements, and allow them to cancel dragging

                var eln=this,
                    el3=d3.select(this),
                    x0=Number(el3.attr('x')),
                    y0=Number(el3.attr('y')),
                    update = {},
                    annbase = 'annotations['+index+']',
                    xa = Plotly.Axes.getFromId(gd,options.xref),
                    ya = Plotly.Axes.getFromId(gd,options.yref);
                if(xa && xa.autorange) { update[xa._name+'.autorange'] = true; }
                if(ya && ya.autorange) { update[ya._name+'.autorange'] = true; }
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
                    else {
                        update[annbase+'.x'] = options.xref=='paper' ?
                            (Plotly.Fx.dragAlign(x0+dx+borderfull,annwidth,gs.l,gs.l+gs.w,options.xanchor)) :
                            (options.x+dx/Plotly.Axes.getFromId(gd,options.xref)._m);
                        update[annbase+'.y'] = options.yref=='paper' ?
                            (Plotly.Fx.dragAlign(y0+dy+borderfull+annheight,-annheight,gs.t+gs.h,gs.t,options.yanchor)) :
                            (options.y+dy/Plotly.Axes.getFromId(gd,options.yref)._m);
                        if(options.xref=='paper' || options.yref=='paper') {
                            csr = Plotly.Fx.dragCursors(
                                options.xref!='paper' ? 0.5 : update[annbase+'.x'],
                                options.yref!='paper' ? 0.5 : update[annbase+'.y'],
                                options.xanchor, options.yanchor
                            );
                        }
                    }
		    		    
		    var xy1 = applyTransform(x0, y0);
		    var x1 = xy1[0];
		    var y1 = xy1[1];

                    el3.call(Plotly.Drawing.setPosition, x1+dx, y1+dy);

		    anng.attr("transform", function(d)
			      {return 'rotate(' + textangle + ', ' +
			       (x1+dx) + ', ' + (y1+dy) + ')';})

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
            };
        }

    }

    // rotate and position text and background
    anng.attr("transform", function(d)
	      {return 'rotate(' + textangle + ', ' + annPosPx.x + ', ' + annPosPx.y + ')';})
        .call(Plotly.Drawing.setPosition, annPosPx.x, annPosPx.y);

    // drawGraphicalElements();
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
        start = {x:el3.attr('x1'), y:el3.attr('y1')};
        end = {x:el3.attr('x2'), y:el3.attr('y2')};
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
            scale = (Plotly.Drawing.getPx(el3,'stroke-width') || 1)*(mag),
            stroke = el3.style('stroke') || '#444',
            opacity = el3.style('stroke-opacity') || 1;
        if(style>5) { rot=0; } // don't rotate square or circle
        d3.select(el.parentElement).append('path')
            .attr({
                'class':el3.attr('class'),
                'data-cmmt':el3.attr('data-cmmt'),
                'd':headStyle.path,
                'transform':'translate('+p.x+','+p.y+')rotate('+rot+')'+
                    'translate('+(headStyle.centerx*scale*(1/mag-1))+',0)scale('+scale+')'})
            .style({fill:stroke, opacity:opacity, 'stroke-width':0});
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
            var s = d3.select(this);
            arrowhead(s.select('line'),Number(s.attr('data-arrowhead')));
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
    var gl = gd.layout, gs = gl._size;

    if(!gl.annotations || !gd.data || !gd.data.length) { return; }
    if(!Plotly.Axes.list(gd).filter(function(ax) { return ax.autorange; }).length) { return; }

    var saveAnnotations = gl.annotations, // store the real annotations
        paperBB = gl._paperdiv.node().getBoundingClientRect(),
        plotcenterx = (paperBB.left+paperBB.right+gs.l-gs.r)/2,
        plotcentery = (paperBB.top+paperBB.bottom+gs.t-gs.b)/2,
        blank = {left:plotcenterx, right:plotcenterx, top:plotcentery, bottom:plotcentery};

    // temporarily replace plot-referenced annotations with transparent, centered ones
    var tempAnnotations = [];
    saveAnnotations.forEach(function(ann){
        var xa = gl[Plotly.Axes.id2name(ann.xref || 'x')],
            ya = gl[Plotly.Axes.id2name(ann.yref || 'y')];
        if(ann.ref!='paper' && ((xa && xa.autorange) || (ya && ya.autorange))) {
            if(xa) { checklog(ann,xa); }
            if(ya) { checklog(ann,ya); }
            tempAnnotations.push($.extend({},ann,
                {x:0.5, y:0.5, xref:'paper', yref:'paper', x0:ann.x, y0:ann.y, opacity:1, xa:xa, ya:ya}));
        }
    });
    gl.annotations = tempAnnotations;
    annotations.drawAll(gd);

    // find the bounding boxes for each of these annotations relative to the center of the plot
    // use the arrow and the text bg rectangle, as the whole anno may include hidden text in its bbox
    gl.annotations.forEach(function(ann,i){
        var arrowNode = gl._infolayer.selectAll('g.annotation[data-index="'+i+'"]>g').node(),
            arrowBB = arrowNode ? arrowNode.getBoundingClientRect() : blank,
            textNode = gl._infolayer.selectAll('g.annotation[data-index="'+i+'"] rect.bg').node(),
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
