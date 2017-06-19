/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

/* global MathJax:false */

var d3 = require('d3');

var Lib = require('../lib');
var xmlnsNamespaces = require('../constants/xmlns_namespaces');
var stringMappings = require('../constants/string_mappings');
var LINE_SPACING = require('../constants/alignment').LINE_SPACING;

// text converter

function getSize(_selection, _dimension) {
    return _selection.node().getBoundingClientRect()[_dimension];
}

var FIND_TEX = /([^$]*)([$]+[^$]*[$]+)([^$]*)/;

exports.convertToTspans = function(_context, gd, _callback) {
    var str = _context.text();

    // Until we get tex integrated more fully (so it can be used along with non-tex)
    // allow some elements to prohibit it by attaching 'data-notex' to the original
    var tex = (!_context.attr('data-notex')) &&
        (typeof MathJax !== 'undefined') &&
        str.match(FIND_TEX);

    var parent = d3.select(_context.node().parentNode);
    if(parent.empty()) return;
    var svgClass = (_context.attr('class')) ? _context.attr('class').split(' ')[0] : 'text';
    svgClass += '-math';
    parent.selectAll('svg.' + svgClass).remove();
    parent.selectAll('g.' + svgClass + '-group').remove();
    _context.style('display', null)
        .attr({
            // some callers use data-unformatted *from the <text> element* in 'cancel'
            // so we need it here even if we're going to turn it into math
            // these two (plus style and text-anchor attributes) form the key we're
            // going to use for Drawing.bBox
            'data-unformatted': str,
            'data-math': 'N'
        });

    function showText() {
        if(!parent.empty()) {
            svgClass = _context.attr('class') + '-math';
            parent.select('svg.' + svgClass).remove();
        }
        _context.text('')
            .style('white-space', 'pre');

        var hasLink = buildSVGText(_context.node(), str);

        if(hasLink) {
            // at least in Chrome, pointer-events does not seem
            // to be honored in children of <text> elements
            // so if we have an anchor, we have to make the
            // whole element respond
            _context.style('pointer-events', 'all');
        }

        exports.positionText(_context);

        if(_callback) _callback.call(_context);
    }

    if(tex) {
        ((gd && gd._promises) || []).push(new Promise(function(resolve) {
            _context.style('display', 'none');
            var config = {fontSize: parseInt(_context.style('font-size'), 10)};

            texToSVG(tex[2], config, function(_svgEl, _glyphDefs, _svgBBox) {
                parent.selectAll('svg.' + svgClass).remove();
                parent.selectAll('g.' + svgClass + '-group').remove();

                var newSvg = _svgEl && _svgEl.select('svg');
                if(!newSvg || !newSvg.node()) {
                    showText();
                    resolve();
                    return;
                }

                var mathjaxGroup = parent.append('g')
                    .classed(svgClass + '-group', true)
                    .attr({
                        'pointer-events': 'none',
                        'data-unformatted': str,
                        'data-math': 'Y'
                    });

                mathjaxGroup.node().appendChild(newSvg.node());

                // stitch the glyph defs
                if(_glyphDefs && _glyphDefs.node()) {
                    newSvg.node().insertBefore(_glyphDefs.node().cloneNode(true),
                                               newSvg.node().firstChild);
                }

                newSvg.attr({
                    'class': svgClass,
                    height: _svgBBox.height,
                    preserveAspectRatio: 'xMinYMin meet'
                })
                .style({overflow: 'visible', 'pointer-events': 'none'});

                var fill = _context.style('fill') || 'black';
                newSvg.select('g').attr({fill: fill, stroke: fill});

                var newSvgW = getSize(newSvg, 'width'),
                    newSvgH = getSize(newSvg, 'height'),
                    newX = +_context.attr('x') - newSvgW *
                        {start: 0, middle: 0.5, end: 1}[_context.attr('text-anchor') || 'start'],
                    // font baseline is about 1/4 fontSize below centerline
                    textHeight = parseInt(_context.style('font-size'), 10) ||
                        getSize(_context, 'height'),
                    dy = -textHeight / 4;

                if(svgClass[0] === 'y') {
                    mathjaxGroup.attr({
                        transform: 'rotate(' + [-90, +_context.attr('x'), +_context.attr('y')] +
                        ') translate(' + [-newSvgW / 2, dy - newSvgH / 2] + ')'
                    });
                    newSvg.attr({x: +_context.attr('x'), y: +_context.attr('y')});
                }
                else if(svgClass[0] === 'l') {
                    newSvg.attr({x: _context.attr('x'), y: dy - (newSvgH / 2)});
                }
                else if(svgClass[0] === 'a') {
                    newSvg.attr({x: 0, y: dy});
                }
                else {
                    newSvg.attr({x: newX, y: (+_context.attr('y') + dy - newSvgH / 2)});
                }

                if(_callback) _callback.call(_context, mathjaxGroup);
                resolve(mathjaxGroup);
            });
        }));
    }
    else showText();

    return _context;
};


// MathJax

var LT_MATCH = /(<|&lt;|&#60;)/g;
var GT_MATCH = /(>|&gt;|&#62;)/g;

function cleanEscapesForTex(s) {
    return s.replace(LT_MATCH, '\\lt ')
        .replace(GT_MATCH, '\\gt ');
}

function texToSVG(_texString, _config, _callback) {
    var randomID = 'math-output-' + Lib.randstr([], 64);
    var tmpDiv = d3.select('body').append('div')
        .attr({id: randomID})
        .style({visibility: 'hidden', position: 'absolute'})
        .style({'font-size': _config.fontSize + 'px'})
        .text(cleanEscapesForTex(_texString));

    MathJax.Hub.Queue(['Typeset', MathJax.Hub, tmpDiv.node()], function() {
        var glyphDefs = d3.select('body').select('#MathJax_SVG_glyphs');

        if(tmpDiv.select('.MathJax_SVG').empty() || !tmpDiv.select('svg').node()) {
            Lib.log('There was an error in the tex syntax.', _texString);
            _callback();
        }
        else {
            var svgBBox = tmpDiv.select('svg').node().getBoundingClientRect();
            _callback(tmpDiv.select('.MathJax_SVG'), glyphDefs, svgBBox);
        }

        tmpDiv.remove();
    });
}

var TAG_STYLES = {
    // would like to use baseline-shift for sub/sup but FF doesn't support it
    // so we need to use dy along with the uber hacky shift-back-to
    // baseline below
    sup: 'font-size:70%',
    sub: 'font-size:70%',
    b: 'font-weight:bold',
    i: 'font-style:italic',
    a: 'cursor:pointer',
    span: '',
    em: 'font-style:italic;font-weight:bold'
};

// baseline shifts for sub and sup
var SHIFT_DY = {
    sub: '0.3em',
    sup: '-0.6em'
};
// reset baseline by adding a tspan (empty except for a zero-width space)
// with dy of -70% * SHIFT_DY (because font-size=70%)
var RESET_DY = {
    sub: '-0.21em',
    sup: '0.42em'
};
var ZERO_WIDTH_SPACE = '\u200b';

/*
 * Whitelist of protocols in user-supplied urls. Mostly we want to avoid javascript
 * and related attack vectors. The empty items are there for IE, that in various
 * versions treats relative paths as having different flavors of no protocol, while
 * other browsers have these explicitly inherit the protocol of the page they're in.
 */
var PROTOCOLS = ['http:', 'https:', 'mailto:', '', undefined, ':'];

var STRIP_TAGS = new RegExp('</?(' + Object.keys(TAG_STYLES).join('|') + ')( [^>]*)?/?>', 'g');

var ENTITY_TO_UNICODE = Object.keys(stringMappings.entityToUnicode).map(function(k) {
    return {
        regExp: new RegExp('&' + k + ';', 'g'),
        sub: stringMappings.entityToUnicode[k]
    };
});

var NEWLINES = /(\r\n?|\n)/g;

var SPLIT_TAGS = /(<[^<>]*>)/;

var ONE_TAG = /<(\/?)([^ >]*)(\s+(.*))?>/i;

var BR_TAG = /<br(\s+.*)?>/i;

/*
 * style and href: pull them out of either single or double quotes. Also
 * - target: (_blank|_self|_parent|_top|framename)
 *     note that you can't use target to get a popup but if you use popup,
 *     a `framename` will be passed along as the name of the popup window.
 *     per the spec, cannot contain whitespace.
 *     for backward compatibility we default to '_blank'
 * - popup: a custom one for us to enable popup (new window) links. String
 *     for window.open -> strWindowFeatures, like 'menubar=yes,width=500,height=550'
 *     note that at least in Chrome, you need to give at least one property
 *     in this string or the page will open in a new tab anyway. We follow this
 *     convention and will not make a popup if this string is empty.
 *     per the spec, cannot contain whitespace.
 *
 * Because we hack in other attributes with style (sub & sup), drop any trailing
 * semicolon in user-supplied styles so we can consistently append the tag-dependent style
 */
var STYLEMATCH = /(^|[\s"'])style\s*=\s*("([^"]*);?"|'([^']*);?')/i;
var HREFMATCH = /(^|[\s"'])href\s*=\s*("([^"]*)"|'([^']*)')/i;
var TARGETMATCH = /(^|[\s"'])target\s*=\s*("([^"\s]*)"|'([^'\s]*)')/i;
var POPUPMATCH = /(^|[\s"'])popup\s*=\s*("([^"\s]*)"|'([^'\s]*)')/i;

// dedicated matcher for these quoted regexes, that can return their results
// in two different places
function getQuotedMatch(_str, re) {
    if(!_str) return null;
    var match = _str.match(re);
    return match && (match[3] || match[4]);
}

var COLORMATCH = /(^|;)\s*color:/;

exports.plainText = function(_str) {
    // strip out our pseudo-html so we have a readable
    // version to put into text fields
    return (_str || '').replace(STRIP_TAGS, ' ');
};

function replaceFromMapObject(_str, list) {
    if(!_str) return '';

    for(var i = 0; i < list.length; i++) {
        var item = list[i];
        _str = _str.replace(item.regExp, item.sub);
    }

    return _str;
}

function convertEntities(_str) {
    return replaceFromMapObject(_str, ENTITY_TO_UNICODE);
}

/*
 * buildSVGText: convert our pseudo-html into SVG tspan elements, and attach these
 * to containerNode
 *
 * @param {svg text element} containerNode: the <text> node to insert this text into
 * @param {string} str: the pseudo-html string to convert to svg
 *
 * @returns {bool}: does the result contain any links? We need to handle the text element
 *   somewhat differently if it does, so just keep track of this when it happens.
 */
function buildSVGText(containerNode, str) {
    str = convertEntities(str)
        /*
         * Normalize behavior between IE and others wrt newlines and whitespace:pre
         * this combination makes IE barf https://github.com/plotly/plotly.js/issues/746
         * Chrome and FF display \n, \r, or \r\n as a space in this mode.
         * I feel like at some point we turned these into <br> but currently we don't so
         * I'm just going to cement what we do now in Chrome and FF
         */
        .replace(NEWLINES, ' ');

    var hasLink = false;

    // as we're building the text, keep track of what elements we're nested inside
    // nodeStack will be an array of {node, type, style, href, target, popup}
    // where only type: 'a' gets the last 3 and node is only added when it's created
    var nodeStack = [];
    var currentNode;
    var currentLine = -1;

    function newLine() {
        currentLine++;

        var lineNode = document.createElementNS(xmlnsNamespaces.svg, 'tspan');
        d3.select(lineNode).attr({
            class: 'line',
            dy: (currentLine * LINE_SPACING) + 'em'
        });
        containerNode.appendChild(lineNode);

        currentNode = lineNode;

        var oldNodeStack = nodeStack;
        nodeStack = [{node: lineNode}];

        if(oldNodeStack.length > 1) {
            for(var i = 1; i < oldNodeStack.length; i++) {
                enterNode(oldNodeStack[i]);
            }
        }
    }

    function enterNode(nodeSpec) {
        var type = nodeSpec.type;
        var nodeAttrs = {};
        var nodeType;

        if(type === 'a') {
            nodeType = 'a';
            var target = nodeSpec.target;
            var href = nodeSpec.href;
            var popup = nodeSpec.popup;
            if(href) {
                nodeAttrs = {
                    'xlink:xlink:show': (target === '_blank' || target.charAt(0) !== '_') ? 'new' : 'replace',
                    target: target,
                    'xlink:xlink:href': href
                };
                if(popup) {
                    nodeAttrs.onclick = 'window.open("' + href + '","' + target + '","' +
                        popup + '");return false;';
                }
            }
        }
        else nodeType = 'tspan';

        if(nodeSpec.style) nodeAttrs.style = nodeSpec.style;

        var newNode = document.createElementNS(xmlnsNamespaces.svg, nodeType);

        if(type === 'sup' || type === 'sub') {
            addTextNode(currentNode, ZERO_WIDTH_SPACE);
            currentNode.appendChild(newNode);

            var resetter = document.createElementNS(xmlnsNamespaces.svg, 'tspan');
            addTextNode(resetter, ZERO_WIDTH_SPACE);
            d3.select(resetter).attr('dy', RESET_DY[type]);
            nodeAttrs.dy = SHIFT_DY[type];

            currentNode.appendChild(newNode);
            currentNode.appendChild(resetter);
        }
        else {
            currentNode.appendChild(newNode);
        }

        d3.select(newNode).attr(nodeAttrs);

        currentNode = nodeSpec.node = newNode;
        nodeStack.push(nodeSpec);
    }

    function addTextNode(node, text) {
        node.appendChild(document.createTextNode(text));
    }

    function exitNode(type) {
        var innerNode = nodeStack.pop();
        if(type !== innerNode.type) {
            Lib.log('Start tag <' + innerNode.type + '> doesnt match end tag <' +
                type + '>. Pretending it did match.', str);
        }
        currentNode = nodeStack[nodeStack.length - 1].node;
    }

    var hasLines = BR_TAG.test(str);

    if(hasLines) newLine();
    else {
        currentNode = containerNode;
        nodeStack = [{node: containerNode}];
    }

    var parts = str.split(SPLIT_TAGS);
    for(var i = 0; i < parts.length; i++) {
        var parti = parts[i];
        var match = parti.match(ONE_TAG);
        var tagType = match && match[2].toLowerCase();
        var tagStyle = TAG_STYLES[tagType];

        if(tagType === 'br') {
            newLine();
        }
        else if(tagStyle === undefined) {
            addTextNode(currentNode, parti);
        }
        else {
            // tag - open or close
            if(match[1]) {
                exitNode(tagType);
            }
            else {
                var extra = match[4];

                var nodeSpec = {type: tagType};

                // now add style, from both the tag name and any extra css
                // Most of the svg css that users will care about is just like html,
                // but font color is different (uses fill). Let our users ignore this.
                var css = getQuotedMatch(extra, STYLEMATCH);
                if(css) {
                    css = css.replace(COLORMATCH, '$1 fill:');
                    if(tagStyle) css += ';' + tagStyle;
                }
                else if(tagStyle) css = tagStyle;

                if(css) nodeSpec.style = css;

                if(tagType === 'a') {
                    hasLink = true;

                    var href = getQuotedMatch(extra, HREFMATCH);

                    if(href) {
                        // check safe protocols
                        var dummyAnchor = document.createElement('a');
                        dummyAnchor.href = href;
                        if(PROTOCOLS.indexOf(dummyAnchor.protocol) !== -1) {
                            nodeSpec.href = href;
                            nodeSpec.target = getQuotedMatch(extra, TARGETMATCH) || '_blank';
                            nodeSpec.popup = getQuotedMatch(extra, POPUPMATCH);
                        }
                    }
                }

                enterNode(nodeSpec);
            }
        }
    }

    return hasLink;
}

exports.lineCount = function lineCount(s) {
    return s.selectAll('tspan.line').size() || 1;
};

exports.positionText = function positionText(s, x, y) {
    return s.each(function() {
        var text = d3.select(this);

        function setOrGet(attr, val) {
            if(val === undefined) {
                val = text.attr(attr);
                if(val === null) {
                    text.attr(attr, 0);
                    val = 0;
                }
            }
            else text.attr(attr, val);
            return val;
        }

        var thisX = setOrGet('x', x);
        var thisY = setOrGet('y', y);

        if(this.nodeName === 'text') {
            text.selectAll('tspan.line').attr({x: thisX, y: thisY});
        }
    });
};

function alignHTMLWith(_base, container, options) {
    var alignH = options.horizontalAlign,
        alignV = options.verticalAlign || 'top',
        bRect = _base.node().getBoundingClientRect(),
        cRect = container.node().getBoundingClientRect(),
        thisRect,
        getTop,
        getLeft;

    if(alignV === 'bottom') {
        getTop = function() { return bRect.bottom - thisRect.height; };
    } else if(alignV === 'middle') {
        getTop = function() { return bRect.top + (bRect.height - thisRect.height) / 2; };
    } else { // default: top
        getTop = function() { return bRect.top; };
    }

    if(alignH === 'right') {
        getLeft = function() { return bRect.right - thisRect.width; };
    } else if(alignH === 'center') {
        getLeft = function() { return bRect.left + (bRect.width - thisRect.width) / 2; };
    } else { // default: left
        getLeft = function() { return bRect.left; };
    }

    return function() {
        thisRect = this.node().getBoundingClientRect();
        this.style({
            top: (getTop() - cRect.top) + 'px',
            left: (getLeft() - cRect.left) + 'px',
            'z-index': 1000
        });
        return this;
    };
}

/*
 * Editable title
 * @param {d3.selection} context: the element being edited. Normally text,
 *   but if it isn't, you should provide the styling options
 * @param {object} options:
 *   @param {div} options.gd: graphDiv
 *   @param {d3.selection} options.delegate: item to bind events to if not this
 *   @param {boolean} options.immediate: start editing now (true) or on click (false, default)
 *   @param {string} options.fill: font color if not as shown
 *   @param {string} options.background: background color if not as shown
 *   @param {string} options.text: initial text, if not as shown
 *   @param {string} options.horizontalAlign: alignment of the edit box wrt. the bound element
 *   @param {string} options.verticalAlign: alignment of the edit box wrt. the bound element
 */

exports.makeEditable = function(context, options) {
    var gd = options.gd;
    var _delegate = options.delegate;
    var dispatch = d3.dispatch('edit', 'input', 'cancel');
    var handlerElement = _delegate || context;

    context.style({'pointer-events': _delegate ? 'none' : 'all'});

    if(context.size() !== 1) throw new Error('boo');

    function handleClick() {
        appendEditable();
        context.style({opacity: 0});
        // also hide any mathjax svg
        var svgClass = handlerElement.attr('class'),
            mathjaxClass;
        if(svgClass) mathjaxClass = '.' + svgClass.split(' ')[0] + '-math-group';
        else mathjaxClass = '[class*=-math-group]';
        if(mathjaxClass) {
            d3.select(context.node().parentNode).select(mathjaxClass).style({opacity: 0});
        }
    }

    function selectElementContents(_el) {
        var el = _el.node();
        var range = document.createRange();
        range.selectNodeContents(el);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        el.focus();
    }

    function appendEditable() {
        var plotDiv = d3.select(gd),
            container = plotDiv.select('.svg-container'),
            div = container.append('div');
        div.classed('plugin-editable editable', true)
            .style({
                position: 'absolute',
                'font-family': context.style('font-family') || 'Arial',
                'font-size': context.style('font-size') || 12,
                color: options.fill || context.style('fill') || 'black',
                opacity: 1,
                'background-color': options.background || 'transparent',
                outline: '#ffffff33 1px solid',
                margin: [-parseFloat(context.style('font-size')) / 8 + 1, 0, 0, -1].join('px ') + 'px',
                padding: '0',
                'box-sizing': 'border-box'
            })
            .attr({contenteditable: true})
            .text(options.text || context.attr('data-unformatted'))
            .call(alignHTMLWith(context, container, options))
            .on('blur', function() {
                gd._editing = false;
                context.text(this.textContent)
                    .style({opacity: 1});
                var svgClass = d3.select(this).attr('class'),
                    mathjaxClass;
                if(svgClass) mathjaxClass = '.' + svgClass.split(' ')[0] + '-math-group';
                else mathjaxClass = '[class*=-math-group]';
                if(mathjaxClass) {
                    d3.select(context.node().parentNode).select(mathjaxClass).style({opacity: 0});
                }
                var text = this.textContent;
                d3.select(this).transition().duration(0).remove();
                d3.select(document).on('mouseup', null);
                dispatch.edit.call(context, text);
            })
            .on('focus', function() {
                var editDiv = this;
                gd._editing = true;
                d3.select(document).on('mouseup', function() {
                    if(d3.event.target === editDiv) return false;
                    if(document.activeElement === div.node()) div.node().blur();
                });
            })
            .on('keyup', function() {
                if(d3.event.which === 27) {
                    gd._editing = false;
                    context.style({opacity: 1});
                    d3.select(this)
                        .style({opacity: 0})
                        .on('blur', function() { return false; })
                        .transition().remove();
                    dispatch.cancel.call(context, this.textContent);
                }
                else {
                    dispatch.input.call(context, this.textContent);
                    d3.select(this).call(alignHTMLWith(context, container, options));
                }
            })
            .on('keydown', function() {
                if(d3.event.which === 13) this.blur();
            })
            .call(selectElementContents);
    }

    if(options.immediate) handleClick();
    else handlerElement.on('click', handleClick);

    return d3.rebind(context, dispatch, 'on');
};
