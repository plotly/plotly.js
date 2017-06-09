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

var DOM_PARSER;

exports.getDOMParser = function() {
    if(DOM_PARSER) {
        return DOM_PARSER;
    } else if(window.DOMParser) {
        DOM_PARSER = new window.DOMParser();
        return DOM_PARSER;
    } else {
        throw new Error('Cannot initialize DOMParser');
    }
};

// Append SVG

d3.selection.prototype.appendSVG = function(_svgString) {
    var skeleton = [
        '<svg xmlns="', xmlnsNamespaces.svg, '" ',
        'xmlns:xlink="', xmlnsNamespaces.xlink, '">',
        _svgString,
        '</svg>'
    ].join('');

    var domParser = exports.getDOMParser();
    var dom = domParser.parseFromString(skeleton, 'application/xml');
    var childNode = dom.documentElement.firstChild;

    while(childNode) {
        this.node().appendChild(this.node().ownerDocument.importNode(childNode, true));
        childNode = childNode.nextSibling;
    }
    if(dom.querySelector('parsererror')) {
        Lib.log(dom.querySelector('parsererror div').textContent);
        return null;
    }
    return d3.select(this.node().lastChild);
};

// Text utilities

exports.html_entity_decode = function(s) {
    var hiddenDiv = d3.select('body').append('div').style({display: 'none'}).html('');
    var replaced = s.replace(/(&[^;]*;)/gi, function(d) {
        if(d === '&lt;') { return '&#60;'; } // special handling for brackets
        if(d === '&rt;') { return '&#62;'; }
        if(d.indexOf('<') !== -1 || d.indexOf('>') !== -1) { return ''; }
        return hiddenDiv.html(d).text(); // everything else, let the browser decode it to unicode
    });
    hiddenDiv.remove();
    return replaced;
};

exports.xml_entity_encode = function(str) {
    return str.replace(/&(?!\w+;|\#[0-9]+;| \#x[0-9A-F]+;)/g, '&amp;');
};

// text converter

function getSize(_selection, _dimension) {
    return _selection.node().getBoundingClientRect()[_dimension];
}

exports.convertToTspans = function(_context, gd, _callback) {
    var str = _context.text();
    var converted = convertToSVG(str);

    // Until we get tex integrated more fully (so it can be used along with non-tex)
    // allow some elements to prohibit it by attaching 'data-notex' to the original
    var tex = (!_context.attr('data-notex')) && converted.match(/([^$]*)([$]+[^$]*[$]+)([^$]*)/);
    var result = str;
    var parent = d3.select(_context.node().parentNode);
    if(parent.empty()) return;
    var svgClass = (_context.attr('class')) ? _context.attr('class').split(' ')[0] : 'text';
    svgClass += '-math';
    parent.selectAll('svg.' + svgClass).remove();
    parent.selectAll('g.' + svgClass + '-group').remove();
    _context.style({visibility: null});

    function showText() {
        if(!parent.empty()) {
            svgClass = _context.attr('class') + '-math';
            parent.select('svg.' + svgClass).remove();
        }
        _context.text('')
            .style({
                visibility: 'inherit',
                'white-space': 'pre'
            });

        result = _context.appendSVG(converted);

        if(!result) _context.text(str);

        if(_context.select('a').size()) {
            // at least in Chrome, pointer-events does not seem
            // to be honored in children of <text> elements
            // so if we have an anchor, we have to make the
            // whole element respond
            _context.style('pointer-events', 'all');
        }

        if(_callback) _callback.call(_context);
    }

    if(tex) {
        ((gd && gd._promises) || []).push(new Promise(function(resolve) {
            _context.style({visibility: 'hidden'});
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
                    .attr({'pointer-events': 'none'});

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

function cleanEscapesForTex(s) {
    return s.replace(/(<|&lt;|&#60;)/g, '\\lt ')
        .replace(/(>|&gt;|&#62;)/g, '\\gt ');
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
    sup: 'font-size:70%" dy="-0.6em',
    sub: 'font-size:70%" dy="0.3em',
    b: 'font-weight:bold',
    i: 'font-style:italic',
    a: 'cursor:pointer',
    span: '',
    br: '',
    em: 'font-style:italic;font-weight:bold'
};

// sub/sup: extra tspan with zero-width space to get back to the right baseline
var TAG_CLOSE = {
    sup: '<tspan dy="0.42em">&#x200b;</tspan>',
    sub: '<tspan dy="-0.21em">&#x200b;</tspan>'
};

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

var UNICODE_TO_ENTITY = Object.keys(stringMappings.unicodeToEntity).map(function(k) {
    return {
        regExp: new RegExp(k, 'g'),
        sub: '&' + stringMappings.unicodeToEntity[k] + ';'
    };
});

var NEWLINES = /(\r\n?|\n)/g;

var SPLIT_TAGS = /(<[^<>]*>)/;

var ONE_TAG = /<(\/?)([^ >]*)(\s+(.*))?>/i;

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

function encodeForHTML(_str) {
    return replaceFromMapObject(_str, UNICODE_TO_ENTITY);
}

function convertToSVG(_str) {
    _str = convertEntities(_str)
        /*
         * Normalize behavior between IE and others wrt newlines and whitespace:pre
         * this combination makes IE barf https://github.com/plotly/plotly.js/issues/746
         * Chrome and FF display \n, \r, or \r\n as a space in this mode.
         * I feel like at some point we turned these into <br> but currently we don't so
         * I'm just going to cement what we do now in Chrome and FF
         */
        .replace(NEWLINES, ' ');

    var result = _str
        .split(SPLIT_TAGS).map(function(d) {
            var match = d.match(ONE_TAG);
            var tag = match && match[2].toLowerCase();
            var tagStyle = TAG_STYLES[tag];

            if(tagStyle !== undefined) {
                var isClose = match[1];
                if(isClose) return (tag === 'a' ? '</a>' : '</tspan>') + (TAG_CLOSE[tag] || '');

                // break: later we'll turn these into newline <tspan>s
                // but we need to know about all the other tags first
                if(tag === 'br') return '<br>';

                /**
                 * extra includes href and any random extra css (that's supported by svg)
                 * use this like <span style="font-family:Arial"> to change font in the middle
                 *
                 * at one point we supported <font family="..." size="..."> but as this isn't even
                 * valid HTML anymore and we dropped it accidentally for many months, we will not
                 * resurrect it.
                 */
                var extra = match[4];

                var out;

                // anchor is the only tag that doesn't turn into a tspan
                if(tag === 'a') {
                    var href = getQuotedMatch(extra, HREFMATCH);

                    out = '<a';

                    if(href) {
                        // check safe protocols
                        var dummyAnchor = document.createElement('a');
                        dummyAnchor.href = href;
                        if(PROTOCOLS.indexOf(dummyAnchor.protocol) !== -1) {
                            href = encodeForHTML(href);

                            // look for target and popup specs
                            var target = encodeForHTML(getQuotedMatch(extra, TARGETMATCH)) || '_blank';
                            var popup = encodeForHTML(getQuotedMatch(extra, POPUPMATCH));

                            /*
                             * xlink:show is for backward compatibility only,
                             * newer browsers allow target just like html links.
                             */
                            var xlinkShow = (target === '_blank' || target.charAt(0) !== '_') ?
                                'new' : 'replace';

                            out += ' xlink:show="' + xlinkShow + '" target="' + target +
                                '" xlink:href="' + href + '"';

                            if(popup) {
                                /*
                                 * Add the window.open call to create a popup
                                 * Even when popup is specified, we leave the original
                                 * href and target in place in case javascript is
                                 * unavailable in this context (like downloaded svg)
                                 * and for accessibility and so users can see where
                                 * the link will lead.
                                 */
                                out += ' onclick="window.open(\'' + href + '\',\'' + target +
                                    '\',\'' + popup + '\');return false;"';
                            }
                        }
                    }
                }
                else {
                    out = '<tspan';

                    if(tag === 'sup' || tag === 'sub') {
                        // sub/sup: extra zero-width space, fixes problem if new line starts with sub/sup
                        out = '&#x200b;' + out;
                    }
                }

                // now add style, from both the tag name and any extra css
                // Most of the svg css that users will care about is just like html,
                // but font color is different (uses fill). Let our users ignore this.
                var css = getQuotedMatch(extra, STYLEMATCH);
                if(css) {
                    css = encodeForHTML(css.replace(COLORMATCH, '$1 fill:'));
                    if(tagStyle) css += ';' + tagStyle;
                }
                else if(tagStyle) css = tagStyle;

                if(css) return out + ' style="' + css + '">';

                return out + '>';
            }
            else {
                return exports.xml_entity_encode(d).replace(/</g, '&lt;');
            }
        });

    // now deal with line breaks
    // TODO: this next section attempts to close and reopen tags that
    // span a line break. But
    // a) it only closes and reopens one tag, and
    // b) all tags are treated like equivalent tspans (even <a> which isn't a tspan even now!)
    // we should really do this in a type-aware way *before* converting to tspans.
    var indices = [];
    for(var index = result.indexOf('<br>'); index > 0; index = result.indexOf('<br>', index + 1)) {
        indices.push(index);
    }
    var count = 0;
    indices.forEach(function(d) {
        var brIndex = d + count;
        var search = result.slice(0, brIndex);
        var previousOpenTag = '';
        for(var i2 = search.length - 1; i2 >= 0; i2--) {
            var isTag = search[i2].match(/<(\/?).*>/i);
            if(isTag && search[i2] !== '<br>') {
                if(!isTag[1]) previousOpenTag = search[i2];
                break;
            }
        }
        if(previousOpenTag) {
            result.splice(brIndex + 1, 0, previousOpenTag);
            result.splice(brIndex, 0, '</tspan>');
            count += 2;
        }
    });

    var joined = result.join('');
    var splitted = joined.split(/<br>/gi);
    if(splitted.length > 1) {
        result = splitted.map(function(d, i) {
            // TODO: figure out max font size of this line and alter dy
            // this requires either:
            // 1) bringing the base font size into convertToTspans, or
            // 2) only allowing relative percentage font sizes.
            // I think #2 is the way to go
            return '<tspan class="line" dy="' + (i * 1.3) + 'em">' + d + '</tspan>';
        });
    }

    return result.join('');
}

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
