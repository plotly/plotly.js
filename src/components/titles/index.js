'use strict';

var d3 = require('@plotly/d3');
var isNumeric = require('fast-isnumeric');

var Plots = require('../../plots/plots');
var Registry = require('../../registry');
var Lib = require('../../lib');
var strTranslate = Lib.strTranslate;
var Drawing = require('../drawing');
var Color = require('../color');
var svgTextUtils = require('../../lib/svg_text_utils');
var interactConstants = require('../../constants/interactions');

var OPPOSITE_SIDE = require('../../constants/alignment').OPPOSITE_SIDE;
var numStripRE = / [XY][0-9]* /;
var SUBTITLE_PADDING_MATHJAX_EM = 1.6;
var SUBTITLE_PADDING_EM = 1.6;

/**
 * Titles - (re)draw titles on the axes and plot:
 * @param {DOM element} gd - the graphDiv
 * @param {string} titleClass - the css class of this title
 * @param {object} options - how and what to draw
 *      propContainer - the layout object containing the `title` attribute that 
 *          applies to this title
 *      propName - the full name of the title property (for Plotly.relayout)
 *      [traceIndex] - include only if this property applies to one trace
 *          (such as a colorbar title) - then editing pipes to Plotly.restyle
 *          instead of Plotly.relayout
 *      placeholder - placeholder text for an empty editable title
 *      [avoid] {object} - include if this title should move to avoid other elements
 *          selection - d3 selection of elements to avoid
 *          side - which direction to move if there is a conflict
 *          [offsetLeft] - if these elements are subject to a translation
 *              wrt the title element
 *          [offsetTop]
 *      attributes {object} - position and alignment attributes
 *          x - pixels
 *          y - pixels
 *          text-anchor - start|middle|end
 *      transform {object} - how to transform the title after positioning
 *          rotate - degrees
 *          offset - shift up/down in the rotated frame (unused?)
 *      containerGroup - if an svg <g> element already exists to hold this
 *          title, include here. Otherwise it will go in fullLayout._infolayer
 *      _meta {object (optional} - meta key-value to for title with
 *          Lib.templateString, default to fullLayout._meta, if not provided
 *
 *  @return {selection} d3 selection of title container group
 */
function draw(gd, titleClass, options) {
    var fullLayout = gd._fullLayout;

    var cont = options.propContainer;
    var prop = options.propName;
    var placeholder = options.placeholder;
    var traceIndex = options.traceIndex;
    var avoid = options.avoid || {};
    var attributes = options.attributes;
    var transform = options.transform;
    var group = options.containerGroup;
    var opacity = 1;
    var title = cont.title;
    var txt = (title && title.text ? title.text : '').trim();
    var titleIsPlaceholder = false;

    var font = title && title.font ? title.font : {};
    var fontFamily = font.family;
    var fontSize = font.size;
    var fontColor = font.color;
    var fontWeight = font.weight;
    var fontStyle = font.style;
    var fontVariant = font.variant;
    var fontTextcase = font.textcase;
    var fontLineposition = font.lineposition;
    var fontShadow = font.shadow;

    // Get subtitle properties
    var subtitleProp = options.subtitlePropName;
    var subtitleEnabled = !!subtitleProp;
    var subtitlePlaceholder = options.subtitlePlaceholder;
    var subtitle = (cont.title || {}).subtitle || {text: '', font: {}};
    var subtitleTxt = subtitle.text.trim();
    var subtitleIsPlaceholder = false;
    var subtitleOpacity = 1;

    var subtitleFont = subtitle.font;
    var subFontFamily = subtitleFont.family;
    var subFontSize = subtitleFont.size;
    var subFontColor = subtitleFont.color;
    var subFontWeight = subtitleFont.weight;
    var subFontStyle = subtitleFont.style;
    var subFontVariant = subtitleFont.variant;
    var subFontTextcase = subtitleFont.textcase;
    var subFontLineposition = subtitleFont.lineposition;
    var subFontShadow = subtitleFont.shadow;

    // only make this title editable if we positively identify its property
    // as one that has editing enabled.
    // Subtitle is editable if and only if title is editable
    var editAttr;
    if(prop === 'title.text') editAttr = 'titleText';
    else if(prop.indexOf('axis') !== -1) editAttr = 'axisTitleText';
    else if(prop.indexOf('colorbar' !== -1)) editAttr = 'colorbarTitleText';
    var editable = gd._context.edits[editAttr];

    function matchesPlaceholder(text, placeholder) {
        if(text === undefined || placeholder === undefined) return false;
        // look for placeholder text while stripping out numbers from eg X2, Y3
        // this is just for backward compatibility with the old version that had
        // "Click to enter X2 title" and may have gotten saved in some old plots,
        // we don't want this to show up when these are displayed.
        return text.replace(numStripRE, ' % ') === placeholder.replace(numStripRE, ' % ');
    }

    if(txt === '') opacity = 0;
    else if(matchesPlaceholder(txt, placeholder)) {
        if(!editable) txt = '';
        opacity = 0.2;
        titleIsPlaceholder = true;
    }

    if(subtitleEnabled) {
        if(subtitleTxt === '') subtitleOpacity = 0;
        else if(matchesPlaceholder(subtitleTxt, subtitlePlaceholder)) {
            if(!editable) subtitleTxt = '';
            subtitleOpacity = 0.2;
            subtitleIsPlaceholder = true;
        }
    }

    if(options._meta) {
        txt = Lib.templateString(txt, options._meta);
    } else if(fullLayout._meta) {
        txt = Lib.templateString(txt, fullLayout._meta);
    }

    var elShouldExist = txt || subtitleTxt || editable;

    var hColorbarMoveTitle;
    if(!group) {
        group = Lib.ensureSingle(fullLayout._infolayer, 'g', 'g-' + titleClass);
        hColorbarMoveTitle = fullLayout._hColorbarMoveTitle;
    }

    var el = group.selectAll('text.' + titleClass)
        .data(elShouldExist ? [0] : []);
    el.enter().append('text');
    el.text(txt)
        // this is hacky, but convertToTspans uses the class
        // to determine whether to rotate mathJax...
        // so we need to clear out any old class and put the
        // correct one (only relevant for colorbars, at least
        // for now) - ie don't use .classed
        .attr('class', titleClass);
    el.exit().remove();

    var subtitleEl = null;
    var subtitleClass = titleClass + '-subtitle';
    var subtitleElShouldExist = subtitleTxt || editable;

    if(subtitleEnabled && subtitleElShouldExist) {
        subtitleEl = group.selectAll('text.' + subtitleClass)
            .data(subtitleElShouldExist ? [0] : []);
        subtitleEl.enter().append('text');
        subtitleEl.text(subtitleTxt).attr('class', subtitleClass);
        subtitleEl.exit().remove();
    }


    if(!elShouldExist) return group;

    function titleLayout(titleEl, subtitleEl) {
        Lib.syncOrAsync([drawTitle, scootTitle], { title: titleEl, subtitle: subtitleEl });
    }

    function drawTitle(titleAndSubtitleEls) {
        var titleEl = titleAndSubtitleEls.title;
        var subtitleEl = titleAndSubtitleEls.subtitle;

        var transformVal;

        if(!transform && hColorbarMoveTitle) {
            transform = {};
        }

        if(transform) {
            transformVal = '';
            if(transform.rotate) {
                transformVal += 'rotate(' + [transform.rotate, attributes.x, attributes.y] + ')';
            }
            if(transform.offset || hColorbarMoveTitle) {
                transformVal += strTranslate(0, (transform.offset || 0) - (hColorbarMoveTitle || 0));
            }
        } else {
            transformVal = null;
        }

        titleEl.attr('transform', transformVal);

        // Callback to adjust the subtitle position after mathjax is rendered
        // Mathjax is rendered asynchronously, which is why this step needs to be
        // passed as a callback
        function adjustSubtitlePosition(titleElMathGroup) {
            if(!titleElMathGroup) return;

            var subtitleElement = d3.select(titleElMathGroup.node().parentNode).select('.' + subtitleClass);
            if(!subtitleElement.empty()) {
                var titleElMathBbox = titleElMathGroup.node().getBBox();
                if(titleElMathBbox.height) {
                    // Position subtitle based on bottom of Mathjax title
                    var subtitleY = titleElMathBbox.y + titleElMathBbox.height + (SUBTITLE_PADDING_MATHJAX_EM * subFontSize);
                    subtitleElement.attr('y', subtitleY);
                }
            }
        }

        titleEl.style('opacity', opacity * Color.opacity(fontColor))
        .call(Drawing.font, {
            color: Color.rgb(fontColor),
            size: d3.round(fontSize, 2),
            family: fontFamily,
            weight: fontWeight,
            style: fontStyle,
            variant: fontVariant,
            textcase: fontTextcase,
            shadow: fontShadow,
            lineposition: fontLineposition,
        })
        .attr(attributes)
            .call(svgTextUtils.convertToTspans, gd, adjustSubtitlePosition);

        if(subtitleEl) {
            // Set subtitle y position based on bottom of title
            // We need to check the Mathjax group as well, in case the Mathjax
            // has already rendered
            var titleElMathGroup = group.select('.' + titleClass + '-math-group');
            var titleElBbox = titleEl.node().getBBox();
            var titleElMathBbox = titleElMathGroup.node() ? titleElMathGroup.node().getBBox() : undefined;
            var subtitleY = titleElMathBbox ? titleElMathBbox.y + titleElMathBbox.height + (SUBTITLE_PADDING_MATHJAX_EM * subFontSize) : titleElBbox.y + titleElBbox.height + (SUBTITLE_PADDING_EM * subFontSize);

            var subtitleAttributes = Lib.extendFlat({}, attributes, {
                y: subtitleY
            });

            subtitleEl.attr('transform', transformVal);
            subtitleEl.style('opacity', subtitleOpacity * Color.opacity(subFontColor))
            .call(Drawing.font, {
                color: Color.rgb(subFontColor),
                size: d3.round(subFontSize, 2),
                family: subFontFamily,
                weight: subFontWeight,
                style: subFontStyle,
                variant: subFontVariant,
                textcase: subFontTextcase,
                shadow: subFontShadow,
                lineposition: subFontLineposition,
            })
            .attr(subtitleAttributes)
                .call(svgTextUtils.convertToTspans, gd);
        }

        return Plots.previousPromises(gd);
    }

    function scootTitle(titleAndSubtitleEls) {
        var titleElIn = titleAndSubtitleEls.title;
        var titleGroup = d3.select(titleElIn.node().parentNode);

        if(avoid && avoid.selection && avoid.side && txt) {
            titleGroup.attr('transform', null);

            // move toward avoid.side (= left, right, top, bottom) if needed
            // can include pad (pixels, default 2)
            var backside = OPPOSITE_SIDE[avoid.side];
            var shiftSign = (avoid.side === 'left' || avoid.side === 'top') ? -1 : 1;
            var pad = isNumeric(avoid.pad) ? avoid.pad : 2;

            var titlebb = Drawing.bBox(titleGroup.node());

            // Account for reservedMargins
            var reservedMargins = {t: 0, b: 0, l: 0, r: 0};
            var margins = gd._fullLayout._reservedMargin;
            for(var key in margins) {
                for(var side in margins[key]) {
                    var val = margins[key][side];
                    reservedMargins[side] = Math.max(reservedMargins[side], val);
                }
            }
            var paperbb = {
                left: reservedMargins.l,
                top: reservedMargins.t,
                right: fullLayout.width - reservedMargins.r,
                bottom: fullLayout.height - reservedMargins.b
            };

            var maxshift = avoid.maxShift ||
                shiftSign * (paperbb[avoid.side] - titlebb[avoid.side]);
            var shift = 0;

            // Prevent the title going off the paper
            if(maxshift < 0) {
                shift = maxshift;
            } else {
                // so we don't have to offset each avoided element,
                // give the title the opposite offset
                var offsetLeft = avoid.offsetLeft || 0;
                var offsetTop = avoid.offsetTop || 0;
                titlebb.left -= offsetLeft;
                titlebb.right -= offsetLeft;
                titlebb.top -= offsetTop;
                titlebb.bottom -= offsetTop;

                // iterate over a set of elements (avoid.selection)
                // to avoid collisions with
                avoid.selection.each(function() {
                    var avoidbb = Drawing.bBox(this);

                    if(Lib.bBoxIntersect(titlebb, avoidbb, pad)) {
                        shift = Math.max(shift, shiftSign * (
                            avoidbb[avoid.side] - titlebb[backside]) + pad);
                    }
                });
                shift = Math.min(maxshift, shift);
                // Keeping track of this for calculation of full axis size if needed
                cont._titleScoot = Math.abs(shift);
            }

            if(shift > 0 || maxshift < 0) {
                var shiftTemplate = {
                    left: [-shift, 0],
                    right: [shift, 0],
                    top: [0, -shift],
                    bottom: [0, shift]
                }[avoid.side];
                titleGroup.attr('transform', strTranslate(shiftTemplate[0], shiftTemplate[1]));
            }
        }
    }

    el.call(titleLayout, subtitleEl);

    function setPlaceholder(element, placeholderText) {
        element.text(placeholderText)
            .on('mouseover.opacity', function() {
                d3.select(this).transition()
                    .duration(interactConstants.SHOW_PLACEHOLDER).style('opacity', 1);
            })
            .on('mouseout.opacity', function() {
                d3.select(this).transition()
                    .duration(interactConstants.HIDE_PLACEHOLDER).style('opacity', 0);
            });
    }

    if(editable) {
        if(!txt) {
            setPlaceholder(el, placeholder);
            titleIsPlaceholder = true;
        } else el.on('.opacity', null);

        el.call(svgTextUtils.makeEditable, {gd: gd})
            .on('edit', function(text) {
                if(traceIndex !== undefined) {
                    Registry.call('_guiRestyle', gd, prop, text, traceIndex);
                } else {
                    Registry.call('_guiRelayout', gd, prop, text);
                }
            })
            .on('cancel', function() {
                this.text(this.attr('data-unformatted'))
                    .call(titleLayout);
            })
            .on('input', function(d) {
                this.text(d || ' ')
                    .call(svgTextUtils.positionText, attributes.x, attributes.y);
            });

        if(subtitleEnabled) {
            // Adjust subtitle position now that title placeholder has been added
            // Only adjust if subtitle is enabled and title text was originally empty
            if(subtitleEnabled && !txt) {
                var titleElBbox = el.node().getBBox();
                var subtitleY = titleElBbox.y + titleElBbox.height + (SUBTITLE_PADDING_EM * subFontSize);
                subtitleEl.attr('y', subtitleY);
            }

            if(!subtitleTxt) {
                setPlaceholder(subtitleEl, subtitlePlaceholder);
                subtitleIsPlaceholder = true;
            } else subtitleEl.on('.opacity', null);
            subtitleEl.call(svgTextUtils.makeEditable, {gd: gd})
                .on('edit', function(text) {
                    Registry.call('_guiRelayout', gd, 'title.subtitle.text', text);
                })
                .on('cancel', function() {
                    this.text(this.attr('data-unformatted'))
                        .call(titleLayout);
                })
                .on('input', function(d) {
                    this.text(d || ' ')
                        .call(svgTextUtils.positionText, subtitleEl.attr('x'), subtitleEl.attr('y'));
                });
        }
    }

    el.classed('js-placeholder', titleIsPlaceholder);
    if(subtitleEl) subtitleEl.classed('js-placeholder', subtitleIsPlaceholder);

    return group;
}

module.exports = {
    draw: draw,
    SUBTITLE_PADDING_EM: SUBTITLE_PADDING_EM,
    SUBTITLE_PADDING_MATHJAX_EM: SUBTITLE_PADDING_MATHJAX_EM,
};
