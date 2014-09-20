(function() {
    'use strict';

    // ---Plotly global modules
    /* global Plotly:false */

    // ---external global dependencies
    /* global d3:false */

    var annotations = Plotly.Annotations = {};

    // centerx is a center of scaling tuned for maximum scalability of
    // the arrowhead ie throughout mag=0.3..3 the head is joined smoothly
    // to the line, but the endpoint moves.
    // TODO: option to have the pointed-to
    // point a little in front of the end of the line, as people tend
    // to want a bit of a gap there...
    var ARROWPATHS = [
        // no arrow
        '',
        // wide with flat back
        {path:'M-2,-3V3L1,0Z',centerx:0.4},
        // narrower with flat back
        {path:'M-3,-2.5V2.5L2,0Z',centerx:0.7},
        // barbed
        {path:'M-4,-3L-1.2,-0.2V0.2L-4,3L2,0Z',centerx:0.45},
        // wide line-drawn
        {
            path:'M-2.2,-2.2L-0.2,-0.2V0.2L-2.2,2.2L-1.4,3L1.6,0L-1.4,-3Z',
            centerx:0
        },
        // narrower line-drawn
        {
            path:'M-4.2,-2.1L-0.4,-0.2V0.2L-4.2,2.1L-3.8,3L2.2,0L-3.8,-3Z',
            centerx:0.2
        },
        // circle
        {path:'M2,0A2,2 0 1,1 0,-2A2,2 0 0,1 2,0Z',centerx:0},
        // square
        {path:'M2,2V-2H-2V2Z',centerx:0}
    ];

    annotations.attributes = {
        text: {
            type: 'string',
            dflt: 'new text'
        },
        textangle: {
            type: 'angle',
            dflt: 0
        },
        font: {type: 'font'},
        opacity: {
            type: 'number',
            min: 0,
            max: 1,
            dflt: 1
        },
        align: {
            type: 'enumerated',
            values: ['left', 'center', 'right'],
            dflt: 'center'
        },
        bgcolor: {
            type: 'color',
            dflt: 'rgba(0,0,0,0)'
        },
        bordercolor: {
            type: 'color',
            dflt: 'rgba(0,0,0,0)'
        },
        borderpad: {
            type: 'number',
            min: 0,
            dflt: 1
        },
        borderwidth: {
            type: 'number',
            min: 0,
            dflt: 1
        },
        // arrow
        showarrow: {
            type: 'boolean',
            dflt: true
        },
        arrowcolor: {
            type: 'color',
        },
        arrowhead: {
            type: 'integer',
            min: 0,
            max: ARROWPATHS.length,
            dflt: 1
        },
        arrowsize: {
            type: 'number',
            min: 0,
            dflt: 1
        },
        arrowwidth: {
            type: 'number',
            min: 0,
            dflt: 0
        },
        ax: {
            type: 'number',
            dflt: -10
        },
        ay: {
            type: 'number',
            dflt: -30
        },
        // positioning
        // xref: not used directly, can be 'paper' or any x axis id
        xref: {type: 'enumerated'},
        x: {type: 'number'},
        xanchor: {
            type: 'enumerated',
            values: ['auto', 'left', 'center', 'right'],
            dflt: 'auto'
        },
        // yref: not used directly, can be 'paper' or any y axis id
        yref: {type: 'enumerated'},
        y: {type: 'number'},
        yanchor: {
            type: 'enumerated',
            values: ['auto', 'top', 'middle', 'bottom'],
            dflt: 'auto'
        },
        // TODO: do we use tag anymore? I don't think so...
        tag: {
            type: 'string',
            dflt: ''
        }
    };

    annotations.supplyDefaults = function(layoutIn, layoutOut) {
        var containerIn = layoutIn.annotations || [];
        layoutOut.annotations = containerIn.map(function(annIn){
            var annOut = {};

            function coerce(attr, dflt) {
                return Plotly.Lib.coerce(annIn, annOut, annotations.attributes, attr, dflt);
            }

            coerce('text');
            coerce('textangle');
            coerce('font', layoutOut.font);
            coerce('opacity');
            coerce('align');
            coerce('bgcolor');
            var borderColor = coerce('bordercolor');
            coerce('borderpad');
            coerce('borderwidth');
            var showArrow = coerce('showarrow');
            if(showArrow) {
                coerce('arrowcolor',
                    Plotly.Drawing.opacity(borderColor) ? annOut.bordercolor : '#444');
                coerce('arrowhead');
                coerce('arrowsize');
                coerce('arrowwidth');
                coerce('ax');
                coerce('ay');
            }

            // TODO: positioning
            // TODO: attributes for fit?

            return annOut;
        });
    };

    annotations.drawAll = function(gd) {
        var anns = gd.layout.annotations;
        gd.layout._infolayer.selectAll('.annotation').remove();
        if(anns) { for(var i in anns) { annotations.draw(gd,i); } }
        return Plotly.Plots.previousPromises(gd);
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
    //  annotation at that point in the array, or 'remove' to delete this one
    annotations.draw = function(gd,index,opt,value) {
        // console.log(index,opt,value,gd.layout.annotations);
        var gl = gd.layout,
            gs = gl._size,
            MINDRAG = Plotly.Fx.MINDRAG,
            i;
        if(!gl.annotations) { gl.annotations = []; }

        if(!$.isNumeric(index) || index===-1) {
            if(!index && $.isArray(value)) {
                // a whole annotation array is passed in
                // (as in, redo of delete all)
                gl.annotations = value;
                annotations.drawAll(gd);
                return;
            }
            else if(value==='remove') {
                // delete all
                gl.annotations = [];
                annotations.drawAll(gd);
                return;
            }
            else if(opt && value!=='add') {
                for(i=0; i<gl.annotations.length; i++) {
                    annotations.draw(gd,i,opt,value);
                }
                return;
            }
            else {
                index = gl.annotations.length;
                gl.annotations.push({});
            }
        }

        if(!opt && value) {
            if(value==='remove') {
                gl._infolayer.selectAll('.annotation[data-index="'+index+'"]')
                    .remove();
                gl.annotations.splice(index,1);
                for(i=index; i<gl.annotations.length; i++) {
                    gl._infolayer
                        .selectAll('.annotation[data-index="'+(i+1)+'"]')
                        .attr('data-index',String(i));

                    // redraw all annotations past the removed one,
                    // so they bind to the right events
                    annotations.draw(gd,i);
                }
                return;
            }
            else if(value==='add' || $.isPlainObject(value)) {
                gl.annotations.splice(index,0,{});
                if($.isPlainObject(value)) {
                    Object.keys(value).forEach(function(k){
                        gl.annotations[index][k] = value[k];
                    });
                }
                for(i=gl.annotations.length-1; i>index; i--) {
                    gl._infolayer
                        .selectAll('.annotation[data-index="'+(i-1)+'"]')
                        .attr('data-index',String(i));
                    annotations.draw(gd,i);
                }
            }
        }

        // remove the existing annotation if there is one
        gl._infolayer.selectAll('.annotation[data-index="'+index+'"]').remove();

        // combine default and existing options
        // (default x, y, ax, ay are set later)
        var oldopts = gl.annotations[index],
            oldref = {
                // .ref for backward compat only (from before multiaxes)
                // TODO: move this to layout import instead
                x: oldopts.xref || (oldopts.ref==='paper' ? 'paper' : 'x'),
                y: oldopts.yref || (oldopts.ref==='paper' ? 'paper' : 'y')
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

        // most options we can allow bad entries to silently revert to
        // defaults... but anchors may make weird behavior if you mix
        // x and y like xanchor='top'
        if(['left','right','center'].indexOf(options.xanchor)===-1) {
            options.xanchor = 'auto';
        }
        if(['top','bottom','middle'].indexOf(options.yanchor)===-1) {
            options.yanchor = 'auto';
        }

        if(typeof opt === 'string' && opt) {
            Plotly.Lib.nestedProperty(options,opt).set(value);
        }
        else if($.isPlainObject(opt)) {
            Object.keys(opt).forEach(function(k){
                Plotly.Lib.nestedProperty(options,k).set(opt[k]);
            });
        }

        if(!options.text) {
            options.text = options.showarrow ? '&nbsp;' : 'new text';
        }

        var xa = Plotly.Axes.getFromId(gd,options.xref),
            ya = Plotly.Axes.getFromId(gd,options.yref),
            annPosPx = {x:0, y:0},

            //default is horizontal
            textangle = options.textangle || 0;
        textangle = $.isNumeric(textangle) ? textangle : 0;

        // create the components
        // made a single group to contain all, so opacity can work right
        // with border/arrow together this could handle a whole bunch of
        // cleanup at this point, but works for now
        var anngroup = gl._infolayer.append('g')
            .classed('annotation',true)
            .attr({
                'data-index':String(index),
                'data-cmmt':options.tag
            })
            .style('opacity',options.opacity);

        // another group for text+background so that they can rotate together
        var anng = anngroup.append('g')
            .classed('annotation-text-g',true)
            .attr({'data-index':String(index)});

        var ann = anng.append('svg')
            .attr('data-cmmt',options.tag)
            .call(Plotly.Drawing.setPosition,0,0);

        var borderwidth = options.borderwidth;

        var annbg = ann.append('rect')
            .attr('class','bg')
            .style('stroke-width',borderwidth+'px')
            .call(Plotly.Drawing.strokeColor,
                options.bordercolor || 'rgba(0,0,0,0)')
            .call(Plotly.Drawing.fillColor,options.bgcolor);

        var font = options.font.family||gl.font.family||'Arial',
            fontSize = options.font.size||gl.font.size||12,
            fontColor = options.font.color||gl.font.color||'#444';

        var anntext = ann.append('text')
            .classed('annotation',true)
            .attr({
                'data-cmmt':options.tag,
                'data-unformatted': options.text
            })
            .text(options.text);

        function textLayout(s){
            s.style({
                'font-family': font,
                'font-size': fontSize+'px',
                fill: Plotly.Drawing.rgb(fontColor),
                opacity: Plotly.Drawing.opacity(fontColor)
            })
            .attr({
                'text-anchor': {
                    left:'start',
                    right:'end'
                }[options.align]||'middle'
            });
            Plotly.util.convertToTspans(s, drawGraphicalElements);
            return s;
        }

        function drawGraphicalElements(){

            // make sure lines are aligned the way they will be
            // at the end, even if their position changes
            anntext.selectAll('tspan.line').attr({y: 0, x: 0});

            var mathjaxGroup = ann.select('.annotation-math-group'),
                hasMathjax = !mathjaxGroup.empty(),
                anntextBB = Plotly.Drawing.bBox(
                    (hasMathjax ? mathjaxGroup : anntext).node()),
                annwidth = anntextBB.width,
                annheight = anntextBB.height;

            // save size in the annotation object for use by autoscale
            options._w = annwidth;
            options._h = annheight;

            function fshift(v,anchor){
                if(anchor==='center' || anchor==='middle') {
                    return 0;
                }
                else if(anchor==='left' || anchor==='bottom') {
                    return -0.5;
                }
                else if(anchor==='right' || anchor==='top') {
                    return 0.5;
                }
                // auto or missing
                else {
                    return Plotly.Lib.constrain(Math.floor(v*3-1),-0.5,0.5);
                }
            }

            var okToContinue = true;
            ['x','y'].forEach(function(axletter) {
                var ax = Plotly.Axes.getFromId(gd,
                        options[axletter+'ref']||axletter),
                    axOld = Plotly.Axes.getFromId(gd,
                        oldref[axletter]||axletter),
                    typeAttr = '_'+axletter+'type',
                    annSize = axletter==='x' ? annwidth : -annheight,
                    axRange = (ax||axOld) ?
                        (ax||axOld).range[1]-(ax||axOld).range[0] : null,
                    defaultVal = ax ?
                        ax.range[0] + (axletter==='x' ? 0.1 : 0.3)*axRange :
                        (axletter==='x' ? 0.1 : 0.7),
                    anchor = options[axletter+'anchor'];

                // check for date or category strings
                if(ax && ['date','category'].indexOf(ax.type)!==-1 &&
                        typeof options[axletter]==='string') {
                    var newval;
                    if(ax.type==='date') {
                        newval = Plotly.Lib.dateTime2ms(options[axletter]);
                        if(newval!==false) {
                            options[axletter] = newval;
                        }
                    }
                    else if(ax.categories && ax.categories.length) {
                        newval = ax.categories.indexOf(options[axletter]);
                        if(newval!==-1) {
                            options[axletter] = newval;
                        }
                    }
                }

                // if we're still referencing the same axis,
                // see if it has changed linear <-> log
                if(ax && ax===axOld && options[typeAttr]) {
                    checklog(options,ax);
                }
                // if we're changing a reference axis on an existing annotation
                else if($.isNumeric(options[axletter]) && ax!==axOld) {
                    // moving from one axis to another - just reset to default
                    // TODO: if the axes overlap, perhaps we could put it in
                    // the equivalent position on the new one?
                    if(ax && axOld) {
                        options[axletter] = defaultVal;
                    }
                    // moving from paper to plot reference
                    else if(ax) {
                        if(!ax.domain) { ax.domain = [0,1]; }

                        var axFraction = (options[axletter]-ax.domain[0])/
                            (ax.domain[1]-ax.domain[0]);
                        options[axletter] = ax.range[0] + axRange*axFraction -
                            (options.showarrow ? 0 :
                            ((fshift(axFraction,anchor)-fshift(0,anchor))*
                                annSize/ax._m));
                    }
                    // moving from plot to paper reference
                    else if(axOld) {
                        if(!axOld.domain) { axOld.domain = [0,1]; }
                        options[axletter] = (axOld.domain[0] +
                            (axOld.domain[1]-axOld.domain[0]) *
                            (options[axletter]-axOld.range[0])/axRange );
                        if(!options.showarrow) {
                            options[axletter] +=
                                (fshift(options[axletter],anchor) -
                                    fshift(0,anchor)) * annSize/axOld._length;
                        }
                    }
                }

                // calculate pixel position
                if(!$.isNumeric(options[axletter])) {
                    options[axletter] = defaultVal;
                }

                if(!ax) {
                    annPosPx[axletter] = (axletter==='x') ?
                        (gs.l + (gs.w)*options[axletter]) :
                        (gs.t + (gs.h)*(1-options[axletter]));
                }
                else {
                    // hide the annotation if it's pointing
                    // outside the visible plot (as long as the axis
                    // isn't autoranged - then we need to draw it
                    // anyway to get its bounding box)
                    if(((options[axletter]-ax.range[0]) *
                                (options[axletter]-ax.range[1])>0) &&
                            !ax.autorange) {
                        okToContinue = false;
                    }
                    annPosPx[axletter] = ax._offset+ax.l2p(options[axletter]);
                }
                if(!options.showarrow) {
                    annPosPx[axletter] -= annSize *
                        fshift(ax ? 0 : options[axletter],anchor);
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

            // now position the annotation and arrow,
            // based on options[x,y,ref,showarrow,ax,ay]

            // position is either in plot coords (ref='plot') or
            // in fraction of the plot area (ref='paper') as with legends,
            // except that positions outside the plot are just numbers outside
            // [0,1] but we will constrain the annotation center to be on the
            // page, in case it gets dragged too far.

            // if there's no arrow, alignment is as with legend:
            //   values <1/3 align the low side at that fraction,
            //   1/3-2/3 align the center at that fraction,
            //   >2/3 align the right at that fraction
            // independent of the alignment of the text

            // if there is an arrow, alignment is to the arrowhead,
            // and ax and ay give the offset (in pixels) between
            // the arrowhead and the center of the annotation


            // if there's an arrow, it gets the position we just calculated,
            // and the text gets offset by ax,ay
            // and make sure the text and arrowhead are on the paper

            var ax, ay;

            if(options.showarrow){
                ax = Plotly.Lib.constrain(annPosPx.x,1,gl.width-1);
                ay = Plotly.Lib.constrain(annPosPx.y,1,gl.height-1);
                annPosPx.x += options.ax;
                annPosPx.y += options.ay;
            }
            annPosPx.x = Plotly.Lib.constrain(annPosPx.x,1,gl.width-1);
            annPosPx.y = Plotly.Lib.constrain(annPosPx.y,1,gl.height-1);

            var borderpad = Number(options.borderpad),
                borderfull = borderwidth+borderpad,
                texty = borderfull-anntextBB.top,
                textx = borderfull-anntextBB.left;

            if(hasMathjax) {
                mathjaxGroup.select('svg').attr({x:borderfull-1, y:borderfull});
            }
            else {
                anntext.attr({x: textx, y: texty});
                anntext.selectAll('tspan.line').attr({y: texty, x: textx});
            }

            var outerwidth = Math.round(annwidth+2*borderfull),
                outerheight = Math.round(annheight+2*borderfull);

            annbg.call(Plotly.Drawing.setRect, borderwidth/2, borderwidth/2,
                outerwidth-borderwidth, outerheight-borderwidth);
            ann.call(Plotly.Drawing.setRect,
                Math.round(annPosPx.x-outerwidth/2),
                Math.round(annPosPx.y-outerheight/2),
                outerwidth, outerheight);

            // add the arrow
            // uses options[arrowwidth,arrowcolor,arrowhead] for styling
            var drawArrow = function(dx,dy){
                $(gd).find('.annotation-arrow-g[data-index="'+index+'"]')
                    .remove();
                // find where to start the arrow:
                // at the border of the textbox, if that border is visible,
                // or at the edge of the lines of text, if the border is hidden
                // TODO: tspan bounding box fails in chrome
                // looks like there may be a cross-browser solution, see
                // http://stackoverflow.com/questions/5364980/
                //    how-to-get-the-width-of-an-svg-tspan-element
                var ax0 = annPosPx.x+dx,
                    ay0 = annPosPx.y+dy,

                    // create transform matrix and related functions
                    transform =
                        Plotly.Lib.rotationXYMatrix(textangle, ax0, ay0),
                    applyTransform = Plotly.Lib.apply2DTransform(transform),
                    applyTransform2 = Plotly.Lib.apply2DTransform2(transform),

                    // calculate and transform bounding box
                    xHalf = annbg.attr('width')/2,
                    yHalf = annbg.attr('height')/2,
                    edges = [
                        [ax0-xHalf, ay0-yHalf, ax0-xHalf, ay0+yHalf],
                        [ax0-xHalf, ay0+yHalf, ax0+xHalf, ay0+yHalf],
                        [ax0+xHalf, ay0+yHalf, ax0+xHalf, ay0-yHalf],
                        [ax0+xHalf, ay0-yHalf, ax0-xHalf, ay0-yHalf],
                    ].map(applyTransform2);

                // Remove the line if it ends inside the box.  Use ray
                // casting for rotated boxes: see which edges intersect a
                // line from the arrowhead to far away and reduce with xor
                // to get the parity of the number of intersections.
                if(edges.reduce(function(a,x) {
                            return a ^
                                !!lineIntersect(ax, ay, ax+1e6, ay+1e6,
                                    x[0], x[1], x[2], x[3]);
                        },false)) {
                    // no line or arrow - so quit drawArrow now
                    return;
                }

                edges.forEach(function(x){
                    var p = lineIntersect(ax0,ay0,ax,ay,
                                x[0],x[1],x[2],x[3]);
                    if(p) {
                        ax0 = p.x;
                        ay0 = p.y;
                    }
                });

                var strokewidth = options.arrowwidth || borderwidth*2 || 2,
                    arrowColor = options.arrowcolor ||
                        (Plotly.Drawing.opacity(options.bordercolor) ?
                            options.bordercolor : '') || '#444';

                var arrowgroup = anngroup.append('g')
                    .attr('data-cmmt',options.tag)
                    .style({opacity: Plotly.Drawing.opacity(arrowColor)})
                    .classed('annotation-arrow-g', true)
                    .attr({'data-index':String(index)});

                var arrow = arrowgroup.append('path')
                    .attr('data-cmmt',options.tag)
                    .attr('d','M'+ax0+','+ay0+'L'+ax+','+ay)
                    .style('stroke-width',strokewidth+'px')
                    .call(Plotly.Drawing.strokeColor,
                        Plotly.Drawing.rgb(arrowColor));

                arrowhead(arrow,options.arrowhead,'end',options.arrowsize);

                var arrowdrag = arrowgroup.append('path')
                    .classed('annotation',true)
                    .classed('anndrag',true)
                    .attr({
                        'data-cmmt':options.tag,
                        'data-index':String(index),
                        d:'M3,3H-3V-3H3ZM0,0L'+(ax0-ax)+','+(ay0-ay),
                        transform:'translate('+ax+','+ay+')'
                    })
                    .style('stroke-width',(strokewidth+6)+'px')
                    .call(Plotly.Drawing.strokeColor,'rgba(0,0,0,0)')
                    .call(Plotly.Drawing.fillColor,'rgba(0,0,0,0)');

                if(gd.mainsite) {
                    arrowdrag.node().onmousedown = function(e) {
                        // deal with other UI elements, and allow them
                        // to cancel dragging
                        if(Plotly.Fx.dragClear(gd)) { return true; }

                        var annx0 = Number(ann.attr('x')),
                            anny0 = Number(ann.attr('y')),
                            update = {},
                            annbase = 'annotations['+index+']';

                        if(xa && xa.autorange) {
                            update[xa._name+'.autorange'] = true;
                        }
                        if(ya && ya.autorange) {
                            update[ya._name+'.autorange'] = true;
                        }

                        gd.dragged = false;
                        window.onmousemove = function(e2) {
                            var dx = e2.clientX-e.clientX,
                                dy = e2.clientY-e.clientY;
                            if(Math.abs(dx)<MINDRAG) { dx=0; }
                            if(Math.abs(dy)<MINDRAG) { dy=0; }
                            if(dx||dy) { gd.dragged = true; }
                            arrowgroup.attr({
                                transform: 'translate('+dx+','+dy+')'
                            });

                            var annxy0 = applyTransform(annx0, anny0),
                                xcenter = annxy0[0]+dx,
                                ycenter = annxy0[1]+dy;
                            ann.call(Plotly.Drawing.setPosition,
                                xcenter, ycenter);

                            update[annbase+'.x'] = xa ?
                                (options.x+dx / xa._m) :
                                ((ax+dx-gs.l) / gs.w);
                            update[annbase+'.y'] = ya ?
                                (options.y+dy / ya._m) :
                                (1 - ((ay+dy-gs.t) / gs.h));

                            anng.attr({
                                transform: 'rotate(' + textangle + ',' +
                                       xcenter + ',' + ycenter + ')'
                            });

                            return Plotly.Lib.pauseEvent(e2);
                        };
                        window.onmouseup = function(e2) {
                            window.onmousemove = null;
                            window.onmouseup = null;
                            if(gd.dragged) { Plotly.relayout(gd,update); }
                            return Plotly.Lib.pauseEvent(e2);
                        };
                        return Plotly.Lib.pauseEvent(e);
                    };
                }
            };

            if(options.showarrow) { drawArrow(0,0); }


            // create transform matrix and related functions
            var transform = Plotly.Lib.rotationXYMatrix(textangle,
                    annPosPx.x, annPosPx.y),
                applyTransform = Plotly.Lib.apply2DTransform(transform);

            // user dragging the annotation (text, not arrow)
            if(gd.mainsite) {
                ann.node().onmousedown = function(e) {
                    // deal with other UI elements, and allow them
                    // to cancel dragging
                    if(Plotly.Fx.dragClear(gd)) { return true; }

                    var el3=d3.select(this),
                        x0=Number(el3.attr('x')),
                        y0=Number(el3.attr('y')),
                        update = {},
                        annbase = 'annotations['+index+']';
                    if(xa && xa.autorange) {
                        update[xa._name+'.autorange'] = true;
                    }
                    if(ya && ya.autorange) {
                        update[ya._name+'.autorange'] = true;
                    }
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
                            update[annbase+'.x'] = xa ?
                                (options.x+dx/xa._m) :
                                (Plotly.Fx.dragAlign(x0+dx+borderfull,
                                    annwidth,gs.l,gs.l+gs.w,options.xanchor));
                            update[annbase+'.y'] = ya ?
                                (options.y+dy/ya._m) :
                                (Plotly.Fx.dragAlign(y0+dy+borderfull+annheight,
                                    -annheight,gs.t+gs.h,gs.t,options.yanchor));
                            if(!xa || !ya) {
                                csr = Plotly.Fx.dragCursors(
                                    xa ? 0.5 : update[annbase+'.x'],
                                    ya ? 0.5 : update[annbase+'.y'],
                                    options.xanchor, options.yanchor
                                );
                            }
                        }

                        var xy1 = applyTransform(x0, y0),
                            x1 = xy1[0] + dx,
                            y1 = xy1[1] + dy;

                        el3.call(Plotly.Drawing.setPosition, x1, y1);

                        anng.attr({
                            transform: 'rotate(' + textangle + ',' +
                                   x1 + ',' + y1 + ')'
                        });

                        Plotly.Fx.setCursor(el3,csr);
                        return Plotly.Lib.pauseEvent(e2);
                    };

                    window.onmouseup = function(e2) {
                        window.onmousemove = null;
                        window.onmouseup = null;
                        Plotly.Fx.setCursor(el3);
                        if(gd.dragged) { Plotly.relayout(gd,update); }
                        return Plotly.Lib.pauseEvent(e2);
                    };

                    return Plotly.Lib.pauseEvent(e);
                };
            }

        }

        if(gd.mainsite) {
            anntext.call(Plotly.util.makeEditable, annbg)
                .call(textLayout)
                .on('edit', function(_text){
                    options.text = _text;
                    this.attr({'data-unformatted': options.text});
                    this.call(textLayout);
                    var update = {};
                    update['annotations['+index+'].text'] = options.text;
                    if(xa && xa.autorange) {
                        update[xa._name+'.autorange'] = true;
                    }
                    if(ya && ya.autorange) {
                        update[ya._name+'.autorange'] = true;
                    }
                    Plotly.relayout(gd,update);
                });
        }
        else { anntext.call(textLayout); }

        // rotate and position text and background
        anng.attr({transform: 'rotate(' + textangle + ',' +
                            annPosPx.x + ',' + annPosPx.y + ')'})
            .call(Plotly.Drawing.setPosition, annPosPx.x, annPosPx.y);
    };

    // check if we need to edit the annotation position for log/linear changes
    function checklog(options,ax) {
        var axletter = ax._id.charAt(0),
            typeAttr = '_'+axletter+'type',
            oldtype = options[typeAttr],
            newtype = ax.type;
        if(oldtype) {
            if(oldtype==='log' && newtype!=='log') {
                options[axletter] = Math.pow(10,options[axletter]);
            }
            else if(oldtype!=='log' && newtype==='log') {
                options[axletter] = (options[axletter]>0) ?
                    Math.log(options[axletter])/Math.LN10 :
                    (ax.range[0]+ax.range[1])/2;
            }
        }
        options[typeAttr] = newtype;
    }

    // add arrowhead(s) to a path or line d3 element el3
    // style: 1-6, first 5 are pointers, 6 is circle, 7 is square, 8 is none
    // ends is 'start', 'end' (default), 'start+end'
    // mag is magnification vs. default (default 1)
    function arrowhead(el3,style,ends,mag) {
        if(!$.isNumeric(mag)) { mag=1; }
        var el = el3.node(),
            headStyle = ARROWPATHS[style||0];
        if(!headStyle) { return; }

        if(typeof ends !== 'string' || !ends) { ends = 'end'; }

        var start,end,dstart,dend,pathlen;
        if(el.nodeName==='line') {
            start = {x:el3.attr('x1'), y:el3.attr('y1')};
            end = {x:el3.attr('x2'), y:el3.attr('y2')};
            dstart = end;
            dend = start;
        }
        else if(el.nodeName==='path') {
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
                    'transform':
                        'translate('+p.x+','+p.y+')'+
                        'rotate('+rot+')'+
                        'translate('+(headStyle.centerx*scale*(1/mag-1))+',0)'+
                        'scale('+scale+')'
                })
                .style({fill:stroke, opacity:opacity, 'stroke-width':0});
        };

        if(ends.indexOf('start')>=0) { drawhead(start,dstart); }
        if(ends.indexOf('end')>=0) { drawhead(end,dend); }
    }

    // allArrowheads: call twice to make an arrowheads dropdown.
    // once (with no container) for the data to send to layoutBoxDrop,
    // and again (with a container) to add arrowheads to the list
    annotations.allArrowheads = function(container){
        // if a dom element is passed in, add appropriate arrowheads
        // to every arrowhead selector in the container
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
                name:'<svg width="40" height="20" data-arrowhead="'+i+
                            '" style="position: relative; top: 2px;">'+
                        '<line stroke="rgb(0,0,0)" style="fill: none;" '+
                        'x1="5" y1="10" x2="25" y2="10" stroke-width="2">'+
                        '</line>'+
                    '</svg>'
            });
        }
        return outArray;
    };

    annotations.calcAutorange = function(gd) {
        var gl = gd.layout;

        if(!gl.annotations || !gd.data || !gd.data.length) { return; }
        if(!Plotly.Axes.list(gd)
            .filter(function(ax) { return ax.autorange; })
            .length) { return; }

        return Plotly.Lib.syncOrAsync([
            annotations.drawAll,
            annAutorange
        ], gd);
    };

    function annAutorange(gd) {
        var gl = gd.layout,
            blank = {left:0, right:0, top:0, bottom:0, width:0, height:0};

        // find the bounding boxes for each of these annotations'
        // relative to their anchor points
        // use the arrow and the text bg rectangle,
        // as the whole anno may include hidden text in its bbox
        gl.annotations.forEach(function(ann,i){
            var xa = Plotly.Axes.getFromId(gd, ann.xref),
                ya = Plotly.Axes.getFromId(gd, ann.yref);
            if(!(xa||ya)) { return; }

            var annBB,
                textNode = gl._infolayer
                    .selectAll('g.annotation[data-index="'+i+'"] rect.bg')
                    .node(),
                textBB = textNode ? Plotly.Drawing.bBox(textNode) : blank,
                textExtra = ann.borderwidth||0,
                textWidth = textBB.width + textExtra,
                textHeight = textBB.height + textExtra;
            if(ann.showarrow) {
                var headSize = 3 * (ann.arrowsize||1) * (ann.arrowwidth||1);
                annBB = {
                    left: Math.min(ann.ax - textWidth/2, -headSize),
                    right: Math.max(ann.ax + textWidth/2, headSize),
                    top: Math.min(ann.ay - textHeight/2, -headSize),
                    bottom: Math.max(ann.ay + textHeight/2, headSize)
                };
            }
            else {
                annBB = {
                    left: textWidth *
                        ({center: -0.5, right: -1}[ann.xanchor]||0),
                    right: textWidth *
                        ({center: 0.5, right: 0}[ann.xanchor]||1),
                    top: textHeight *
                        ({middle: -0.5, top: 0}[ann.yanchor]||1),
                    bottom: textHeight *
                        ({middle: 0.5, top: 1}[ann.yanchor]||0)
                };
            }
            if(xa && xa.autorange) {
                Plotly.Axes.expand(xa, [xa.l2c(ann.x)],{
                    ppadplus: annBB.right,
                    ppadminus: -annBB.left
                });
            }
            if(ya && ya.autorange) {
                Plotly.Axes.expand(ya, [ya.l2c(ann.y)], {
                    ppadplus: annBB.bottom,
                    ppadminus: -annBB.top
                });
            }
        });
    };

    // look for intersection of two line segments
    //   (1->2 and 3->4) - returns array [x,y] if they do, null if not
    function lineIntersect(x1,y1,x2,y2,x3,y3,x4,y4) {
        var a=x2-x1, b=x3-x1, c=x4-x3,
            d=y2-y1, e=y3-y1, f=y4-y3,
            det=a*f-c*d;
        // parallel lines? intersection is undefined
        // ignore the case where they are colinear
        if(det===0) { return null; }
        var t=(b*f-c*e)/det,
            u=(b*d-a*e)/det;
        if(u<0 || u>1 || t<0 || t>1) {
            // segments do not intersect
            return null;
        }
        return {x:x1+a*t, y:y1+d*t};
    }

}()); // end Annotations object definition
