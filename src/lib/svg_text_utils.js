/**
* Copyright 2012-2016, Plotly, Inc.
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

// Append SVG

d3.selection.prototype.appendSVG = function(_svgString) {
    var skeleton = [
        '<svg xmlns="', xmlnsNamespaces.svg, '" ',
        'xmlns:xlink="', xmlnsNamespaces.xlink, '">',
        _svgString,
        '</svg>'
    ].join('');

    var dom = new DOMParser().parseFromString(skeleton, 'application/xml'),
        childNode = dom.documentElement.firstChild;

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

exports.convertToTspans = function(_context, _callback) {
    var str = _context.text();
    var converted = convertToSVG(str);
    var that = _context;

    // Until we get tex integrated more fully (so it can be used along with non-tex)
    // allow some elements to prohibit it by attaching 'data-notex' to the original
    var tex = (!that.attr('data-notex')) && converted.match(/([^$]*)([$]+[^$]*[$]+)([^$]*)/);
    var result = str;
    var parent = d3.select(that.node().parentNode);
    if(parent.empty()) return;
    var svgClass = (that.attr('class')) ? that.attr('class').split(' ')[0] : 'text';
    svgClass += '-math';
    parent.selectAll('svg.' + svgClass).remove();
    parent.selectAll('g.' + svgClass + '-group').remove();
    _context.style({visibility: null});
    for(var up = _context.node(); up && up.removeAttribute; up = up.parentNode) {
        up.removeAttribute('data-bb');
    }

    function showText() {
        if(!parent.empty()) {
            svgClass = that.attr('class') + '-math';
            parent.select('svg.' + svgClass).remove();
        }
        _context.text('')
            .style({
                visibility: 'visible',
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

        if(_callback) _callback.call(that);
    }

    if(tex) {
        var td = Lib.getPlotDiv(that.node());
        ((td && td._promises) || []).push(new Promise(function(resolve) {
            that.style({visibility: 'hidden'});
            var config = {fontSize: parseInt(that.style('font-size'), 10)};

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

                var fill = that.style('fill') || 'black';
                newSvg.select('g').attr({fill: fill, stroke: fill});

                var newSvgW = getSize(newSvg, 'width'),
                    newSvgH = getSize(newSvg, 'height'),
                    newX = +that.attr('x') - newSvgW *
                        {start: 0, middle: 0.5, end: 1}[that.attr('text-anchor') || 'start'],
                    // font baseline is about 1/4 fontSize below centerline
                    textHeight = parseInt(that.style('font-size'), 10) ||
                        getSize(that, 'height'),
                    dy = -textHeight / 4;

                if(svgClass[0] === 'y') {
                    mathjaxGroup.attr({
                        transform: 'rotate(' + [-90, +that.attr('x'), +that.attr('y')] +
                        ') translate(' + [-newSvgW / 2, dy - newSvgH / 2] + ')'
                    });
                    newSvg.attr({x: +that.attr('x'), y: +that.attr('y')});
                }
                else if(svgClass[0] === 'l') {
                    newSvg.attr({x: that.attr('x'), y: dy - (newSvgH / 2)});
                }
                else if(svgClass[0] === 'a') {
                    newSvg.attr({x: 0, y: dy});
                }
                else {
                    newSvg.attr({x: newX, y: (+that.attr('y') + dy - newSvgH / 2)});
                }

                if(_callback) _callback.call(that, mathjaxGroup);
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
    // would like to use baseline-shift but FF doesn't support it yet
    // so we need to use dy along with the uber hacky shift-back-to
    // baseline below
    sup: 'font-size:70%" dy="-0.6em',
    sub: 'font-size:70%" dy="0.3em',
    b: 'font-weight:bold',
    i: 'font-style:italic',
    a: '',
    span: '',
    br: '',
    em: 'font-style:italic;font-weight:bold'
};

var PROTOCOLS = ['http:', 'https:', 'mailto:'];

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

exports.plainText = function(_str) {
    // strip out our pseudo-html so we have a readable
    // version to put into text fields
    return (_str || '').replace(STRIP_TAGS, ' ');
};

function replaceFromMapObject(_str, list) {
    var out = _str || '';

    for(var i = 0; i < list.length; i++) {
        var item = list[i];
        out = out.replace(item.regExp, item.sub);
    }

    return out;
}

function convertEntities(_str) {
    return replaceFromMapObject(_str, ENTITY_TO_UNICODE);
}

function encodeForHTML(_str) {
    return replaceFromMapObject(_str, UNICODE_TO_ENTITY);
}

function convertToSVG(_str) {
    _str = convertEntities(_str);

    var result = _str
        .split(/(<[^<>]*>)/).map(function(d) {
            var match = d.match(/<(\/?)([^ >]*)\s*(.*)>/i),
                tag = match && match[2].toLowerCase(),
                style = TAG_STYLES[tag];

            if(style !== undefined) {
                var close = match[1],
                    extra = match[3],
                    /**
                     * extraStyle: any random extra css (that's supported by svg)
                     * use this like <span style="font-family:Arial"> to change font in the middle
                     *
                     * at one point we supported <font family="..." size="..."> but as this isn't even
                     * valid HTML anymore and we dropped it accidentally for many months, we will not
                     * resurrect it.
                     */
                    extraStyle = extra.match(/^style\s*=\s*"([^"]+)"\s*/i);

                // anchor and br are the only ones that don't turn into a tspan
                if(tag === 'a') {
                    if(close) return '</a>';
                    else if(extra.substr(0, 4).toLowerCase() !== 'href') return '<a>';
                    else {
                        // remove quotes, leading '=', replace '&' with '&amp;'
                        var href = extra.substr(4)
                            .replace(/["']/g, '')
                            .replace(/=/, '');

                        // check protocol
                        var dummyAnchor = document.createElement('a');
                        dummyAnchor.href = href;
                        if(PROTOCOLS.indexOf(dummyAnchor.protocol) === -1) return '<a>';

                        return '<a xlink:show="new" xlink:href="' + encodeForHTML(href) + '">';
                    }
                }
                else if(tag === 'br') return '<br>';
                else if(close) {
                    // closing tag

                    // sub/sup: extra tspan with zero-width space to get back to the right baseline
                    if(tag === 'sup') return '</tspan><tspan dy="0.42em">&#x200b;</tspan>';
                    if(tag === 'sub') return '</tspan><tspan dy="-0.21em">&#x200b;</tspan>';
                    else return '</tspan>';
                }
                else {
                    var tspanStart = '<tspan';

                    if(tag === 'sup' || tag === 'sub') {
                        // sub/sup: extra zero-width space, fixes problem if new line starts with sub/sup
                        tspanStart = '&#x200b;' + tspanStart;
                    }

                    if(extraStyle) {
                        // most of the svg css users will care about is just like html,
                        // but font color is different. Let our users ignore this.
                        extraStyle = extraStyle[1].replace(/(^|;)\s*color:/, '$1 fill:');
                        style = (style ? style + ';' : '') + encodeForHTML(extraStyle);
                    }

                    return tspanStart + (style ? ' style="' + style + '"' : '') + '>';
                }
            }
            else {
                return exports.xml_entity_encode(d).replace(/</g, '&lt;');
            }
        });

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

// Editable title

exports.makeEditable = function(context, _delegate, options) {
    if(!options) options = {};
    var that = this;
    var dispatch = d3.dispatch('edit', 'input', 'cancel');
    var textSelection = d3.select(this.node())
        .style({'pointer-events': 'all'});

    var handlerElement = _delegate || textSelection;
    if(_delegate) textSelection.style({'pointer-events': 'none'});

    function handleClick() {
        appendEditable();
        that.style({opacity: 0});
        // also hide any mathjax svg
        var svgClass = handlerElement.attr('class'),
            mathjaxClass;
        if(svgClass) mathjaxClass = '.' + svgClass.split(' ')[0] + '-math-group';
        else mathjaxClass = '[class*=-math-group]';
        if(mathjaxClass) {
            d3.select(that.node().parentNode).select(mathjaxClass).style({opacity: 0});
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
        var plotDiv = d3.select(Lib.getPlotDiv(that.node())),
            container = plotDiv.select('.svg-container'),
            div = container.append('div');
        div.classed('plugin-editable editable', true)
            .style({
                position: 'absolute',
                'font-family': that.style('font-family') || 'Arial',
                'font-size': that.style('font-size') || 12,
                color: options.fill || that.style('fill') || 'black',
                opacity: 1,
                'background-color': options.background || 'transparent',
                outline: '#ffffff33 1px solid',
                margin: [-parseFloat(that.style('font-size')) / 8 + 1, 0, 0, -1].join('px ') + 'px',
                padding: '0',
                'box-sizing': 'border-box'
            })
            .attr({contenteditable: true})
            .text(options.text || that.attr('data-unformatted'))
            .call(alignHTMLWith(that, container, options))
            .on('blur', function() {
                that.text(this.textContent)
                    .style({opacity: 1});
                var svgClass = d3.select(this).attr('class'),
                    mathjaxClass;
                if(svgClass) mathjaxClass = '.' + svgClass.split(' ')[0] + '-math-group';
                else mathjaxClass = '[class*=-math-group]';
                if(mathjaxClass) {
                    d3.select(that.node().parentNode).select(mathjaxClass).style({opacity: 0});
                }
                var text = this.textContent;
                d3.select(this).transition().duration(0).remove();
                d3.select(document).on('mouseup', null);
                dispatch.edit.call(that, text);
            })
            .on('focus', function() {
                var context = this;
                d3.select(document).on('mouseup', function() {
                    if(d3.event.target === context) return false;
                    if(document.activeElement === div.node()) div.node().blur();
                });
            })
            .on('keyup', function() {
                if(d3.event.which === 27) {
                    that.style({opacity: 1});
                    d3.select(this)
                        .style({opacity: 0})
                        .on('blur', function() { return false; })
                        .transition().remove();
                    dispatch.cancel.call(that, this.textContent);
                }
                else {
                    dispatch.input.call(that, this.textContent);
                    d3.select(this).call(alignHTMLWith(that, container, options));
                }
            })
            .on('keydown', function() {
                if(d3.event.which === 13) this.blur();
            })
            .call(selectElementContents);
    }

    if(options.immediate) handleClick();
    else handlerElement.on('click', handleClick);

    return d3.rebind(this, dispatch, 'on');
};
