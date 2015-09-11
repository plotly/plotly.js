'use strict';

var Plotly = require('./plotly'),
    d3 = require('d3'),
    isNumeric = require('./isnumeric');

var annotations = module.exports = {};

// centerx is a center of scaling tuned for maximum scalability of
// the arrowhead ie throughout mag=0.3..3 the head is joined smoothly
// to the line, but the endpoint moves.
// backoff is the distance to move the arrowhead, and the end of the
// line, in order to end at the right place
// TODO: option to have the pointed-to  point a little in front of the
// end of the line, as people tend to want a bit of a gap there...
annotations.ARROWPATHS = [
    // no arrow
    '',
    // wide with flat back
    {
        path: 'M-2.4,-3V3L0.6,0Z',
        backoff: 0.6
    },
    // narrower with flat back
    {
        path: 'M-3.7,-2.5V2.5L1.3,0Z',
        backoff: 1.3
    },
    // barbed
    {
        path: 'M-4.45,-3L-1.65,-0.2V0.2L-4.45,3L1.55,0Z',
        backoff: 1.55
    },
    // wide line-drawn
    {
        path: 'M-2.2,-2.2L-0.2,-0.2V0.2L-2.2,2.2L-1.4,3L1.6,0L-1.4,-3Z',
        backoff: 1.6
    },
    // narrower line-drawn
    {
        path: 'M-4.4,-2.1L-0.6,-0.2V0.2L-4.4,2.1L-4,3L2,0L-4,-3Z',
        backoff: 2
    },
    // circle
    {
        path: 'M2,0A2,2 0 1,1 0,-2A2,2 0 0,1 2,0Z',
        backoff: 0
    },
    // square
    {
        path: 'M2,2V-2H-2V2Z',
        backoff: 0
    }
];

annotations.layoutAttributes = {
    _isLinkedToArray: true,

    text: {
        valType: 'string',
        role: 'info',
        description: [
            'Sets the text associated with this annotation.',
            'Plotly uses a subset of HTML tags to do things like',
            'newline (<br>), bold (<b></b>), italics (<i></i>),',
            'hyperlinks (<a href=\'...\'></a>). Tags <em>, <sup>, <sub>',
            '<span> are also supported.'
        ].join(' ')
    },
    textangle: {
        valType: 'angle',
        dflt: 0,
        role: 'style',
        description: [
            'Sets the angle at which the `text` is drawn',
            'with respect to the horizontal.'
        ].join(' ')
    },
    font: Plotly.Lib.extendFlat(Plotly.Plots.fontAttrs, {
        description: 'Sets the annotation text font.'
    }),
    opacity: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 1,
        role: 'style',
        description: 'Sets the opacity of the annotation (text + arrow).'
    },
    align: {
        valType: 'enumerated',
        values: ['left', 'center', 'right'],
        dflt: 'center',
        role: 'style',
        description: [
            'Sets the vertical alignment of the `text` with',
            'respect to the set `x` and `y` position.',
            'Has only an effect if `text` spans more two or more lines',
            '(i.e. `text` contains one or more <br> HTML tags).'
        ].join(' ')
    },
    bgcolor: {
        valType: 'color',
        dflt: 'rgba(0,0,0,0)',
        role: 'style',
        description: 'Sets the background color of the annotation.'
    },
    bordercolor: {
        valType: 'color',
        dflt: 'rgba(0,0,0,0)',
        role: 'style',
        description: [
            'Sets the color of the border enclosing the annotation `text`.'
        ].join(' ')
    },
    borderpad: {
        valType: 'number',
        min: 0,
        dflt: 1,
        role: 'style',
        description: [
            'Sets the padding (in px) between the `text`',
            'and the enclosing border.'
        ].join(' ')
    },
    borderwidth: {
        valType: 'number',
        min: 0,
        dflt: 1,
        role: 'style',
        description: [
            'Sets the width (in px) of the border enclosing',
            'the annotation `text`.'
        ].join(' ')
    },
    // arrow
    showarrow: {
        valType: 'boolean',
        dflt: true,
        role: 'style',
        description: [
            'Determines whether or not the annotation is drawn with an arrow.',
            'If *true*, `text` is placed near the arrow\'s tail.',
            'If *false*, `text` lines up with the `x` and `y` provided.'
        ].join(' ')
    },
    arrowcolor: {
        valType: 'color',
        role: 'style',
        description: 'Sets the color of the annotation arrow.'
    },
    arrowhead: {
        valType: 'integer',
        min: 0,
        max: annotations.ARROWPATHS.length,
        dflt: 1,
        role: 'style',
        description: 'Sets the annotation arrow head style.'
    },
    arrowsize: {
        valType: 'number',
        min: 0.3,
        dflt: 1,
        role: 'style',
        description: 'Sets the size (in px) of annotation arrow head.'
    },
    arrowwidth: {
        valType: 'number',
        min: 0.1,
        role: 'style',
        description: 'Sets the width (in px) of annotation arrow.'
    },
    ax: {
        valType: 'number',
        dflt: -10,
        role: 'info',
        description: [
            'Sets the x component of the arrow tail about the arrow head.',
            'A positive (negative) component corresponds to an arrow pointing',
            'from right to left (left to right)'
        ].join(' ')
    },
    ay: {
        valType: 'number',
        dflt: -30,
        role: 'info',
        description: [
            'Sets the y component of the arrow tail about the arrow head.',
            'A positive (negative) component corresponds to an arrow pointing',
            'from bottom to top (top to bottom)'
        ].join(' ')
    },
    // positioning
    xref: {
        valType: 'enumerated',
        values: ['paper', '/^x[0-9]/*$'],
        role: 'info',
        description: [
            'Sets the annotation\'s x coordinate axis.',
            'If set to an x axis id (e.g. *x* or *x2*), the `x` position',
            'refers to an x coordinate',
            'If set to *paper*, the `x` position refers to the distance from',
            'the left side of the plotting area in normalized coordinates',
            'where 0 (1) corresponds to the left (right) side.'
        ].join(' ')
    },
    x: {
        valType: 'number',
        role: 'info',
        description: [
            'Sets the annotation\'s x position.',
            'Note that dates and categories are converted to numbers.'
        ].join(' ')
    },
    xanchor: {
        valType: 'enumerated',
        values: ['auto', 'left', 'center', 'right'],
        dflt: 'auto',
        role: 'info',
        description: [
            'Sets the annotation\'s horizontal position anchor',
            'This anchor binds the `x` position to the *left*, *center*',
            'or *right* of the annotation.',
            'For example, if `x` is set to 1, `xref` to *paper* and',
            '`xanchor` to *right* then the right-most portion of the',
            'annotation lines up with the right-most edge of the',
            'plotting area.',
            'If *auto*, the anchor is equivalent to *center* for',
            'data-referenced annotations',
            'whereas for paper-referenced, the anchor picked corresponds',
            'to the closest side.'
        ].join(' ')
    },
    yref: {
        valType: 'enumerated',
        values: ['paper', '/^y[0-9]/*$'],
        role: 'info',
        description: [
            'Sets the annotation\'s y coordinate axis.',
            'If set to an y axis id (e.g. *y* or *y2*), the `y` position',
            'refers to an y coordinate',
            'If set to *paper*, the `y` position refers to the distance from',
            'the bottom of the plotting area in normalized coordinates',
            'where 0 (1) corresponds to the bottom (top).'
        ].join(' ')
    },
    y: {
        valType: 'number',
        role: 'info',
        description: [
            'Sets the annotation\'s y position.',
            'Note that dates and categories are converted to numbers.'
        ].join(' ')
    },
    yanchor: {
        valType: 'enumerated',
        values: ['auto', 'top', 'middle', 'bottom'],
        dflt: 'auto',
        role: 'info',
        description: [
            'Sets the annotation\'s vertical position anchor',
            'This anchor binds the `y` position to the *top*, *middle*',
            'or *bottom* of the annotation.',
            'For example, if `y` is set to 1, `yref` to *paper* and',
            '`yanchor` to *top* then the top-most portion of the',
            'annotation lines up with the top-most edge of the',
            'plotting area.',
            'If *auto*, the anchor is equivalent to *middle* for',
            'data-referenced annotations',
            'whereas for paper-referenced, the anchor picked corresponds',
            'to the closest side.'
        ].join(' ')
    }
};

annotations.supplyLayoutDefaults = function(layoutIn, layoutOut) {
    var containerIn = layoutIn.annotations || [],
        containerOut = layoutOut.annotations = [];

    for(var i = 0; i < containerIn.length; i++) {
        containerOut.push(handleAnnotationDefaults(containerIn[i] || {}, layoutOut));
    }
};

function handleAnnotationDefaults(annIn, fullLayout) {
    var annOut = {};

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(annIn, annOut,
                                 annotations.layoutAttributes,
                                 attr, dflt);
    }

    coerce('opacity');
    coerce('align');
    coerce('bgcolor');
    var borderColor = coerce('bordercolor'),
        borderOpacity = Plotly.Color.opacity(borderColor);
    coerce('borderpad');
    var borderWidth = coerce('borderwidth');
    var showArrow = coerce('showarrow');
    if(showArrow) {
        coerce('arrowcolor',
            borderOpacity ? annOut.bordercolor : Plotly.Color.defaultLine);
        coerce('arrowhead');
        coerce('arrowsize');
        coerce('arrowwidth', ((borderOpacity && borderWidth) || 1) * 2);
        coerce('ax');
        coerce('ay');

        // if you have one part of arrow length you should have both
        Plotly.Lib.noneOrAll(annIn, annOut, ['ax', 'ay']);
    }
    coerce('text', showArrow ? '&nbsp;' : 'new text');
    coerce('textangle');
    Plotly.Lib.coerceFont(coerce, 'font', fullLayout.font);

    // positioning
    var axLetters = ['x','y'];
    for(var i = 0; i < 2; i++) {
        var axLetter = axLetters[i],
            tdMock = {_fullLayout: fullLayout};

        // xref, yref
        var axRef = Plotly.Axes.coerceRef(annIn, annOut, tdMock, axLetter);

        // x, y
        var defaultPosition = 0.5;
        if(axRef!=='paper') {
            var ax = Plotly.Axes.getFromId(tdMock, axRef);
            defaultPosition = ax.range[0] + defaultPosition * (ax.range[1] - ax.range[0]);

            // convert date or category strings to numbers
            if(['date','category'].indexOf(ax.type)!==-1 &&
                    typeof annIn[axLetter]==='string') {
                var newval;
                if(ax.type==='date') {
                    newval = Plotly.Lib.dateTime2ms(annIn[axLetter]);
                    if(newval!==false) annIn[axLetter] = newval;
                }
                else if((ax._categories||[]).length) {
                    newval = ax._categories.indexOf(annIn[axLetter]);
                    if(newval!==-1) annIn[axLetter] = newval;
                }
            }
        }
        coerce(axLetter, defaultPosition);

        // xanchor, yanchor
        if(!showArrow) coerce(axLetter + 'anchor');
    }

    // if you have one coordinate you should have both
    Plotly.Lib.noneOrAll(annIn, annOut, ['x', 'y']);

    return annOut;
}

annotations.drawAll = function(gd) {
    var fullLayout = gd._fullLayout;
    fullLayout._infolayer.selectAll('.annotation').remove();
    for(var i = 0; i < fullLayout.annotations.length; i++) {
        annotations.draw(gd, i);
    }
    return Plotly.Plots.previousPromises(gd);
};

annotations.add = function(gd) {
    var nextAnn = gd._fullLayout.annotations.length;
    Plotly.relayout(gd, 'annotations['+nextAnn+']', 'add');
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
annotations.draw = function(gd, index, opt, value) {
    var layout = gd.layout,
        fullLayout = gd._fullLayout,
        i;

    if(!isNumeric(index) || index===-1) {
        // no index provided - we're operating on ALL annotations
        if(!index && Array.isArray(value)) {
            // a whole annotation array is passed in
            // (as in, redo of delete all)
            layout.annotations = value;
            annotations.supplyLayoutDefaults(layout, fullLayout);
            annotations.drawAll(gd);
            return;
        }
        else if(value==='remove') {
            // delete all
            delete layout.annotations;
            fullLayout.annotations = [];
            annotations.drawAll(gd);
            return;
        }
        else if(opt && value!=='add') {
            // make the same change to all annotations
            for(i = 0; i < fullLayout.annotations.length; i++) {
                annotations.draw(gd, i, opt, value);
            }
            return;
        }
        else {
            // add a new empty annotation
            index = fullLayout.annotations.length;
            fullLayout.annotations.push({});
        }
    }

    if(!opt && value) {
        if(value==='remove') {
            fullLayout._infolayer.selectAll('.annotation[data-index="'+index+'"]')
                .remove();
            fullLayout.annotations.splice(index,1);
            layout.annotations.splice(index,1);
            for(i=index; i<fullLayout.annotations.length; i++) {
                fullLayout._infolayer
                    .selectAll('.annotation[data-index="'+(i+1)+'"]')
                    .attr('data-index',String(i));

                // redraw all annotations past the removed one,
                // so they bind to the right events
                annotations.draw(gd,i);
            }
            return;
        }
        else if(value==='add' || Plotly.Lib.isPlainObject(value)) {
            fullLayout.annotations.splice(index,0,{});

            var rule = Plotly.Lib.isPlainObject(value) ? $.extend({},value) : {text: 'New text'};

            if (layout.annotations) {
                layout.annotations.splice(index, 0, rule);
            } else {
                layout.annotations = [rule];
            }

            for(i=fullLayout.annotations.length-1; i>index; i--) {
                fullLayout._infolayer
                    .selectAll('.annotation[data-index="'+(i-1)+'"]')
                    .attr('data-index',String(i));
                annotations.draw(gd,i);
            }
        }
    }

    // remove the existing annotation if there is one
    fullLayout._infolayer.selectAll('.annotation[data-index="'+index+'"]').remove();

    // remember a few things about what was already there,
    var optionsIn = layout.annotations[index],
        oldPrivate = fullLayout.annotations[index];

    // not sure how we're getting here... but C12 is seeing a bug
    // where we fail here when they add/remove annotations
    if(!optionsIn) return;

    var oldRef = {xref: optionsIn.xref, yref: optionsIn.yref};

    // alter the input annotation as requested
    var optionsEdit = {};
    if(typeof opt === 'string' && opt) optionsEdit[opt] = value;
    else if(Plotly.Lib.isPlainObject(opt)) optionsEdit = opt;

    var optionKeys = Object.keys(optionsEdit);
    for(i = 0; i < optionKeys.length; i++) {
        var k = optionKeys[i];
        Plotly.Lib.nestedProperty(optionsIn, k).set(optionsEdit[k]);
    }

    var gs = fullLayout._size;

    var axLetters = ['x', 'y'];
    for(i = 0; i < 2; i++) {
        var axLetter = axLetters[i];
        // if we don't have an explicit position already,
        // don't set one just because we're changing references
        // or axis type.
        // the defaults will be consistent most of the time anyway,
        // except in log/linear changes
        if(optionsEdit[axLetter]!==undefined ||
                optionsIn[axLetter]===undefined) {
            continue;
        }

        var axOld = Plotly.Axes.getFromId(gd,
                Plotly.Axes.coerceRef(oldRef, {}, gd, axLetter)),
            axNew = Plotly.Axes.getFromId(gd,
                Plotly.Axes.coerceRef(optionsIn, {}, gd, axLetter)),
            position = optionsIn[axLetter],
            axTypeOld = oldPrivate['_' + axLetter + 'type'];

        if(optionsEdit[axLetter + 'ref']!==undefined) {
            var autoAnchor = optionsIn[axLetter + 'anchor'] === 'auto',
                plotSize = (axLetter === 'x' ? gs.w : gs.h),
                halfSizeFrac = (oldPrivate['_' + axLetter + 'size'] || 0) /
                    (2 * plotSize);
            if(axOld && axNew) { // data -> different data
                // go to the same fraction of the axis length
                // whether or not these axes share a domain

                // first convert to fraction of the axis
                position = (position - axOld.range[0]) /
                    (axOld.range[1] - axOld.range[0]);

                // then convert to new data coordinates at the same fraction
                position = axNew.range[0] +
                    position * (axNew.range[1] - axNew.range[0]);
            }
            else if(axOld) { // data -> paper
                // first convert to fraction of the axis
                position = (position - axOld.range[0]) /
                    (axOld.range[1] - axOld.range[0]);

                // next scale the axis to the whole plot
                position = axOld.domain[0] +
                    position * (axOld.domain[1] - axOld.domain[0]);

                // finally see if we need to adjust auto alignment
                // because auto always means middle / center alignment for data,
                // but it changes for page alignment based on the closest side
                if(autoAnchor) {
                    var posPlus = position + halfSizeFrac,
                        posMinus = position - halfSizeFrac;
                    if(position + posMinus < 2/3) position = posMinus;
                    else if(position + posPlus > 4/3) position = posPlus;
                }
            }
            else if(axNew) { // paper -> data
                // first see if we need to adjust auto alignment
                if(autoAnchor) {
                    if(position < 1/3) position += halfSizeFrac;
                    else if(position > 2/3) position -= halfSizeFrac;
                }

                // next convert to fraction of the axis
                position = (position - axNew.domain[0]) /
                    (axNew.domain[1] - axNew.domain[0]);

                // finally convert to data coordinates
                position = axNew.range[0] +
                    position * (axNew.range[1] - axNew.range[0]);
            }
        }

        if(axNew && axNew===axOld && axTypeOld) {
            if(axTypeOld==='log' && axNew.type!=='log') {
                position = Math.pow(10,position);
            }
            else if(axTypeOld!=='log' && axNew.type==='log') {
                position = (position>0) ?
                    Math.log(position)/Math.LN10 : undefined;
            }
        }

        optionsIn[axLetter] = position;
    }

    var options = handleAnnotationDefaults(optionsIn, fullLayout);
    fullLayout.annotations[index] = options;

    var xa = Plotly.Axes.getFromId(gd, options.xref),
        ya = Plotly.Axes.getFromId(gd, options.yref),
        annPosPx = {x: 0, y: 0},
        textangle = +options.textangle || 0;

    // create the components
    // made a single group to contain all, so opacity can work right
    // with border/arrow together this could handle a whole bunch of
    // cleanup at this point, but works for now
    var anngroup = fullLayout._infolayer.append('g')
        .classed('annotation', true)
        .attr('data-index', String(index))
        .style('opacity', options.opacity)
        .on('click', function() {
            gd._dragging = false;
            $(gd).trigger('plotly_clickannotation', {
                index: index,
                annotation: optionsIn,
                fullAnnotation: options
            });
        });

    // another group for text+background so that they can rotate together
    var anng = anngroup.append('g')
        .classed('annotation-text-g', true)
        .attr('data-index', String(index));

    var ann = anng.append('svg')
        .call(Plotly.Drawing.setPosition, 0, 0);

    var borderwidth = options.borderwidth,
        borderpad = options.borderpad,
        borderfull = borderwidth + borderpad;

    var annbg = ann.append('rect')
        .attr('class','bg')
        .style('stroke-width', borderwidth+'px')
        .call(Plotly.Color.stroke, options.bordercolor)
        .call(Plotly.Color.fill, options.bgcolor);

    var font = options.font;

    var anntext = ann.append('text')
        .classed('annotation', true)
        .attr('data-unformatted', options.text)
        .text(options.text);

    function textLayout(s){
        s.call(Plotly.Drawing.font, font)
        .attr({
            'text-anchor': {
                left: 'start',
                right: 'end'
            }[options.align] || 'middle'
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
            annheight = anntextBB.height,
            outerwidth = Math.round(annwidth + 2 * borderfull),
            outerheight = Math.round(annheight + 2 * borderfull);


        // save size in the annotation object for use by autoscale
        options._w = annwidth;
        options._h = annheight;

        function shiftFraction(v, anchor){
            if(anchor==='auto'){
                if(v < 1/3) anchor = 'left';
                else if(v > 2/3) anchor = 'right';
                else anchor = 'center';
            }
            return {
                center: 0,
                middle: 0,
                left: 0.5,
                bottom: -0.5,
                right: -0.5,
                top: 0.5
            }[anchor];
        }

        var annotationIsOffscreen = false;
        ['x', 'y'].forEach(function(axLetter) {
            var ax = Plotly.Axes.getFromId(gd,
                    options[axLetter+'ref']||axLetter),
                dimAngle = (textangle + (axLetter==='x' ? 0 : 90)) * Math.PI/180,
                annSize = outerwidth * Math.abs(Math.cos(dimAngle)) +
                          outerheight * Math.abs(Math.sin(dimAngle)),
                anchor = options[axLetter + 'anchor'],
                alignPosition;

            // calculate pixel position
            if(ax) {
                // hide the annotation if it's pointing
                // outside the visible plot (as long as the axis
                // isn't autoranged - then we need to draw it
                // anyway to get its bounding box)
                if(!ax.autorange && ((options[axLetter] - ax.range[0]) *
                                     (options[axLetter] - ax.range[1]) > 0)) {
                    annotationIsOffscreen = true;
                    return;
                }
                annPosPx[axLetter] = ax._offset+ax.l2p(options[axLetter]);
                alignPosition = 0.5;
            }
            else {
                alignPosition = options[axLetter];
                if(axLetter === 'y') alignPosition = 1 - alignPosition;
                annPosPx[axLetter] = (axLetter === 'x') ?
                    (gs.l + gs.w * alignPosition) :
                    (gs.t + gs.h * alignPosition);
            }

            var alignShift = 0;
            if(options.showarrow) {
                alignShift = options['a' + axLetter];
            }
            else {
                alignShift = annSize * shiftFraction(alignPosition, anchor);
            }
            annPosPx[axLetter] += alignShift;

            // save the current axis type for later log/linear changes
            options['_' + axLetter + 'type'] = ax && ax.type;

            // save the size and shift in this dim for autorange
            options['_' + axLetter + 'size'] = annSize;
            options['_' + axLetter + 'shift'] = alignShift;
        });

        if(annotationIsOffscreen) {
            ann.remove();
            return;
        }

        var arrowX, arrowY;

        // make sure the arrowhead (if there is one)
        // and the annotation center are visible
        if(options.showarrow){
            arrowX = Plotly.Lib.constrain(annPosPx.x - options.ax, 1, fullLayout.width - 1);
            arrowY = Plotly.Lib.constrain(annPosPx.y - options.ay, 1, fullLayout.height - 1);
        }
        annPosPx.x = Plotly.Lib.constrain(annPosPx.x, 1, fullLayout.width - 1);
        annPosPx.y = Plotly.Lib.constrain(annPosPx.y, 1, fullLayout.height - 1);

        var texty = borderfull - anntextBB.top,
            textx = borderfull - anntextBB.left;

        if(hasMathjax) {
            mathjaxGroup.select('svg').attr({x: borderfull - 1, y: borderfull});
        }
        else {
            anntext.attr({x: textx, y: texty});
            anntext.selectAll('tspan.line').attr({y: texty, x: textx});
        }

        annbg.call(Plotly.Drawing.setRect, borderwidth / 2, borderwidth / 2,
            outerwidth-borderwidth, outerheight - borderwidth);
        ann.call(Plotly.Drawing.setRect,
            Math.round(annPosPx.x - outerwidth / 2),
            Math.round(annPosPx.y - outerheight / 2),
            outerwidth, outerheight);

        var annbase = 'annotations['+index+']';

        // add the arrow
        // uses options[arrowwidth,arrowcolor,arrowhead] for styling
        var drawArrow = function(dx, dy){
            $(gd).find('.annotation-arrow-g[data-index="' + index + '"]')
                .remove();
            // find where to start the arrow:
            // at the border of the textbox, if that border is visible,
            // or at the edge of the lines of text, if the border is hidden
            // TODO: tspan bounding box fails in chrome
            // looks like there may be a cross-browser solution, see
            // http://stackoverflow.com/questions/5364980/
            //    how-to-get-the-width-of-an-svg-tspan-element
            var arrowX0 = annPosPx.x + dx,
                arrowY0 = annPosPx.y + dy,

                // create transform matrix and related functions
                transform =
                    Plotly.Lib.rotationXYMatrix(textangle, arrowX0, arrowY0),
                applyTransform = Plotly.Lib.apply2DTransform(transform),
                applyTransform2 = Plotly.Lib.apply2DTransform2(transform),

                // calculate and transform bounding box
                xHalf = annbg.attr('width')/2,
                yHalf = annbg.attr('height')/2,
                edges = [
                    [arrowX0 - xHalf, arrowY0 - yHalf, arrowX0 - xHalf, arrowY0 + yHalf],
                    [arrowX0 - xHalf, arrowY0 + yHalf, arrowX0 + xHalf, arrowY0 + yHalf],
                    [arrowX0 + xHalf, arrowY0 + yHalf, arrowX0 + xHalf, arrowY0 - yHalf],
                    [arrowX0 + xHalf, arrowY0 - yHalf, arrowX0 - xHalf, arrowY0 - yHalf]
                ].map(applyTransform2);

            // Remove the line if it ends inside the box.  Use ray
            // casting for rotated boxes: see which edges intersect a
            // line from the arrowhead to far away and reduce with xor
            // to get the parity of the number of intersections.
            if(edges.reduce(function(a, x) {
                        return a ^
                            !!lineIntersect(arrowX, arrowY, arrowX + 1e6, arrowY + 1e6,
                                x[0], x[1], x[2], x[3]);
                    },false)) {
                // no line or arrow - so quit drawArrow now
                return;
            }

            edges.forEach(function(x){
                var p = lineIntersect(arrowX0, arrowY0, arrowX, arrowY,
                            x[0], x[1], x[2], x[3]);
                if(p) {
                    arrowX0 = p.x;
                    arrowY0 = p.y;
                }
            });

            var strokewidth = options.arrowwidth,
                arrowColor = options.arrowcolor;

            var arrowgroup = anngroup.append('g')
                .style({opacity: Plotly.Color.opacity(arrowColor)})
                .classed('annotation-arrow-g', true)
                .attr('data-index', String(index));

            var arrow = arrowgroup.append('path')
                .attr('d', 'M'+arrowX0+','+arrowY0+'L'+arrowX+','+arrowY)
                .style('stroke-width', strokewidth+'px')
                .call(Plotly.Color.stroke,
                    Plotly.Color.rgb(arrowColor));

            annotations.arrowhead(arrow, options.arrowhead, 'end', options.arrowsize);

            var arrowdrag = arrowgroup.append('path')
                .classed('annotation', true)
                .classed('anndrag', true)
                .attr({
                    'data-index': String(index),
                    d: 'M3,3H-3V-3H3ZM0,0L' + (arrowX0-arrowX) + ',' + (arrowY0-arrowY),
                    transform:'translate('+arrowX+','+arrowY+')'
                })
                .style('stroke-width', (strokewidth+6)+'px')
                .call(Plotly.Color.stroke, 'rgba(0,0,0,0)')
                .call(Plotly.Color.fill, 'rgba(0,0,0,0)');

            if(gd._context.editable) {
                var update,
                    annx0,
                    anny0;

                Plotly.Fx.dragElement({
                    element: arrowdrag.node(),
                    prepFn: function() {
                        annx0 = Number(ann.attr('x'));
                        anny0 = Number(ann.attr('y'));
                        update = {};
                        if(xa && xa.autorange) {
                            update[xa._name+'.autorange'] = true;
                        }
                        if(ya && ya.autorange) {
                            update[ya._name+'.autorange'] = true;
                        }
                    },
                    moveFn: function(dx, dy) {
                        arrowgroup.attr('transform', 'translate('+dx+','+dy+')');

                        var annxy0 = applyTransform(annx0, anny0),
                            xcenter = annxy0[0] + dx,
                            ycenter = annxy0[1] + dy;
                        ann.call(Plotly.Drawing.setPosition,
                            xcenter, ycenter);

                        update[annbase+'.x'] = xa ?
                            (options.x + dx / xa._m) :
                            ((arrowX + dx - gs.l) / gs.w);
                        update[annbase+'.y'] = ya ?
                            (options.y + dy / ya._m) :
                            (1 - ((arrowY + dy - gs.t) / gs.h));

                        anng.attr({
                            transform: 'rotate(' + textangle + ',' +
                                   xcenter + ',' + ycenter + ')'
                        });
                    },
                    doneFn: function(dragged) {
                        if(dragged) {
                            Plotly.relayout(gd, update);
                            var notesBox = document.querySelector('.js-notes-box-panel');
                            if(notesBox) notesBox.redraw(notesBox.selectedObj);
                        }
                    }
                });
            }
        };

        if(options.showarrow) drawArrow(0, 0);

        // create transform matrix and related functions
        var transform = Plotly.Lib.rotationXYMatrix(textangle,
                annPosPx.x, annPosPx.y),
            applyTransform = Plotly.Lib.apply2DTransform(transform);

        // user dragging the annotation (text, not arrow)
        if(gd._context.editable) {
            var x0,
                y0,
                update;

            Plotly.Fx.dragElement({
                element: ann.node(),
                prepFn: function() {
                    x0 = Number(ann.attr('x'));
                    y0 = Number(ann.attr('y'));
                    update = {};
                },
                moveFn: function(dx, dy) {
                    ann.call(Plotly.Drawing.setPosition, x0 + dx, y0 + dy);
                    var csr = 'pointer';
                    if(options.showarrow) {
                        update[annbase+'.ax'] = options.ax + dx;
                        update[annbase+'.ay'] = options.ay + dy;
                        drawArrow(dx, dy);
                    }
                    else {
                        if(xa) update[annbase + '.x'] = options.x + dx / xa._m;
                        else {
                            var widthFraction = options._xsize / gs.w,
                                xLeft = options.x + options._xshift / gs.w - widthFraction / 2;

                            update[annbase + '.x'] = Plotly.Fx.dragAlign(xLeft + dx / gs.w,
                                widthFraction, 0, 1, options.xanchor);
                        }

                        if(ya) update[annbase + '.y'] = options.y + dy / ya._m;
                        else {
                            var heightFraction = options._ysize / gs.h,
                                yBottom = options.y - options._yshift / gs.h - heightFraction / 2;

                            update[annbase + '.y'] = Plotly.Fx.dragAlign(yBottom - dy / gs.h,
                                heightFraction, 0, 1, options.yanchor);
                        }
                        if(!xa || !ya) {
                            csr = Plotly.Fx.dragCursors(
                                xa ? 0.5 : update[annbase + '.x'],
                                ya ? 0.5 : update[annbase + '.y'],
                                options.xanchor, options.yanchor
                            );
                        }
                    }

                    var xy1 = applyTransform(x0, y0),
                        x1 = xy1[0] + dx,
                        y1 = xy1[1] + dy;

                    ann.call(Plotly.Drawing.setPosition, x1, y1);

                    anng.attr({
                        transform: 'rotate(' + textangle + ',' +
                               x1 + ',' + y1 + ')'
                    });

                    Plotly.Fx.setCursor(ann, csr);
                },
                doneFn: function(dragged) {
                    Plotly.Fx.setCursor(ann);
                    if(dragged) {
                        Plotly.relayout(gd, update);
                        var notesBox = document.querySelector('.js-notes-box-panel');
                        if(notesBox) notesBox.redraw(notesBox.selectedObj);
                    }
                }
            });
        }
    }

    if(gd._context.editable) {
        anntext.call(Plotly.util.makeEditable, ann)
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
    else anntext.call(textLayout);

    // rotate and position text and background
    anng.attr({transform: 'rotate(' + textangle + ',' +
                        annPosPx.x + ',' + annPosPx.y + ')'})
        .call(Plotly.Drawing.setPosition, annPosPx.x, annPosPx.y);
};

// add arrowhead(s) to a path or line d3 element el3
// style: 1-6, first 5 are pointers, 6 is circle, 7 is square, 8 is none
// ends is 'start', 'end' (default), 'start+end'
// mag is magnification vs. default (default 1)
annotations.arrowhead = function(el3, style, ends, mag) {
    if(!isNumeric(mag)) mag = 1;
    var el = el3.node(),
        headStyle = annotations.ARROWPATHS[style||0];
    if(!headStyle) return;

    if(typeof ends !== 'string' || !ends) ends = 'end';

    var scale = (Plotly.Drawing.getPx(el3,'stroke-width') || 1) * mag,
        stroke = el3.style('stroke') || Plotly.Color.defaultLine,
        opacity = el3.style('stroke-opacity') || 1,
        doStart = ends.indexOf('start') >= 0,
        doEnd = ends.indexOf('end') >= 0,
        backOff = headStyle.backoff * scale,
        start,
        end,
        startRot,
        endRot;

    if(el.nodeName === 'line') {
        start = {x: +el3.attr('x1'), y: +el3.attr('y1')};
        end = {x: +el3.attr('x2'), y: +el3.attr('y2')};
        startRot = Math.atan2(start.y - end.y, start.x - end.x);
        endRot = startRot + Math.PI;
        if(backOff) {
            var backOffX = backOff * Math.cos(startRot),
                backOffY = backOff * Math.sin(startRot);

            if(doStart) {
                start.x -= backOffX;
                start.y -= backOffY;
                el3.attr({x1: start.x, y1: start.y});
            }
            if(doEnd) {
                end.x += backOffX;
                end.y += backOffY;
                el3.attr({x2: end.x, y2: end.y});
            }
        }
    }
    else if(el.nodeName === 'path') {
        var pathlen = el.getTotalLength(),
            // using dash to hide the backOff region of the path.
            // if we ever allow dash for the arrow we'll have to
            // do better than this hack... maybe just manually
            // combine the two
            dashArray = '';

        if(doStart) {
            var start0 = el.getPointAtLength(0),
                dstart = el.getPointAtLength(0.1);
            startRot = Math.atan2(start0.y - dstart.y, start0.x - dstart.x);
            start = el.getPointAtLength(Math.min(backOff, pathlen));
            if(backOff) dashArray = '0px,' + backOff + 'px,';
        }

        if(doEnd) {
            var end0 = el.getPointAtLength(pathlen),
                dend = el.getPointAtLength(pathlen - 0.1);
            endRot = Math.atan2(end0.y - dend.y, end0.x - dend.x);
            end = el.getPointAtLength(Math.max(0, pathlen - backOff));

            if(backOff) {
                var shortening = dashArray ? 2 * backOff : backOff;
                dashArray += (pathlen - shortening) + 'px,' + pathlen + 'px';
            }
        }
        else if(dashArray) dashArray += pathlen + 'px';

        if(dashArray) el3.style('stroke-dasharray', dashArray);
    }

    var drawhead = function(p, rot) {
        if(style>5) rot=0; // don't rotate square or circle
        d3.select(el.parentElement).append('path')
            .attr({
                'class': el3.attr('class'),
                d: headStyle.path,
                transform:
                    'translate(' + p.x + ',' + p.y + ')' +
                    'rotate(' + (rot * 180 / Math.PI) + ')' +
                    'scale(' + scale + ')'
            })
            .style({
                fill: stroke,
                opacity: opacity,
                'stroke-width': 0
            });
    };

    if(doStart) drawhead(start, startRot);
    if(doEnd) drawhead(end, endRot);
};

annotations.calcAutorange = function(gd) {
    var fullLayout = gd._fullLayout,
        annotationList = fullLayout.annotations;

    if(!annotationList.length || !gd._fullData.length) return;

    var annotationAxes = {};
    annotationList.forEach(function(ann){
        annotationAxes[ann.xref] = true;
        annotationAxes[ann.yref] = true;
    });

    var autorangedAnnos = Plotly.Axes.list(gd)
        .filter(function(ax) {
            return ax.autorange && annotationAxes[ax._id];
        });
    if(!autorangedAnnos.length) return;

    return Plotly.Lib.syncOrAsync([
        annotations.drawAll,
        annAutorange
    ], gd);
};

function annAutorange(gd) {
    var fullLayout = gd._fullLayout;

    // find the bounding boxes for each of these annotations'
    // relative to their anchor points
    // use the arrow and the text bg rectangle,
    // as the whole anno may include hidden text in its bbox
    fullLayout.annotations.forEach(function(ann){
        var xa = Plotly.Axes.getFromId(gd, ann.xref),
            ya = Plotly.Axes.getFromId(gd, ann.yref);
        if(!(xa || ya)) return;

        var halfWidth = (ann._xsize || 0)/2,
            xShift = ann._xshift || 0,
            halfHeight = (ann._ysize || 0)/2,
            yShift = ann._yshift || 0,
            leftSize = halfWidth - xShift,
            rightSize = halfWidth + xShift,
            topSize = halfHeight - yShift,
            bottomSize = halfHeight + yShift;
        if(ann.showarrow) {
            var headSize = 3 * ann.arrowsize * ann.arrowwidth;
            leftSize = Math.max(leftSize, headSize);
            rightSize = Math.max(rightSize, headSize);
            topSize = Math.max(topSize, headSize);
            bottomSize = Math.max(bottomSize, headSize);
        }
        if(xa && xa.autorange) {
            Plotly.Axes.expand(xa, [xa.l2c(ann.x)],{
                ppadplus: rightSize,
                ppadminus: leftSize
            });
        }
        if(ya && ya.autorange) {
            Plotly.Axes.expand(ya, [ya.l2c(ann.y)], {
                ppadplus: bottomSize,
                ppadminus: topSize
            });
        }
    });
}

// look for intersection of two line segments
//   (1->2 and 3->4) - returns array [x,y] if they do, null if not
function lineIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    var a = x2 - x1,
        b = x3 - x1,
        c = x4 - x3,
        d = y2 - y1,
        e = y3 - y1,
        f = y4 - y3,
        det = a * f - c * d;
    // parallel lines? intersection is undefined
    // ignore the case where they are colinear
    if(det === 0) return null;
    var t = (b * f - c * e) / det,
        u = (b * d - a * e) / det;
    // segments do not intersect?
    if(u<0 || u>1 || t<0 || t>1) return null;

    return {x: x1 + a * t, y: y1 + d * t};
}
