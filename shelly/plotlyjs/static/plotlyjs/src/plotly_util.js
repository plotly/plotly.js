'use strict';
// ---external global dependencies
/* global d3:false, MathJax:false, FB:false, PLOTLYENV:false,
   Promise:false */

var util = module.exports = {},
    Plotly = require('./plotly');

// Script Loader
/////////////////////////////

util.scriptLoader = function(d, w){
    var config = {loadDelay: 0};
    function exports(_scriptNames){
        var loadDelay = config.loadDelay;
        var scriptNames = [].concat(_scriptNames);

        // Generic script injection
        var newScript, baseScript = d.getElementsByTagName('script')[0];
        function loadScript(id, src, delay, callback) {
            if (d.getElementById(id)) {return;}
            setTimeout(function () {
                newScript = d.createElement('script');
                newScript.type = 'text/javascript';
                newScript.id = id;
                newScript.async = true;
                newScript.src = src;
                baseScript.parentNode.insertBefore(newScript, baseScript);
                if(callback) callback.call(window);
            }, delay);
        }

        var protocol = /^http:/.test(d.location) ? 'http' : 'https';
        var protocol2 = (protocol === 'https') ? 'https://ssl' : 'http://www';

        if (scriptNames.indexOf('facebook') !== -1){
            var body = document.querySelector('body');
            var bodyFirstChild = body.firstChild;
            var newDiv = document.createElement('div');
            newDiv.id = 'fb-root';
            body.insertBefore(newDiv, bodyFirstChild);
            w.fbAsyncInit = function() {
                FB.init({
                    appId      : PLOTLYENV.FACEBOOK_PAGE_APP_ID,
                    /*channelUrl : 'WWW.YOUR_DOMAIN.COM/channel.html'*/
                    status     : true,
                    cookie     : true,
                    xfbml      : true
                });
            };
            var debug = false;
            loadScript('facebook-jssdk', '//connect.facebook.net/en_US/all' +
                (debug ? '/debug' : '') + '.js', loadDelay);
        }

        if (scriptNames.indexOf('googleAnalytics') !== -1){
            w._gaq = w._gaq || [];
            w._gaq.push(['_setAccount', PLOTLYENV.GOOGLEANALYTICS_ACCOUNT]);
            w._gaq.push(['_setSiteSpeedSampleRate', 10]);
            w._gaq.push(['_trackPageview']);
            loadScript('google-analytics', protocol2 + '.google-analytics.com/ga.js', loadDelay);
        }

        if(scriptNames.indexOf('googlePlus') !== -1){
            loadScript('google-plus', 'https://apis.google.com/js/plusone.js', loadDelay);
        }

        if(scriptNames.indexOf('twitter') !== -1){
            loadScript('twitter-wjs', protocol + '://platform.twitter.com/widgets.js', loadDelay);
        }

    }

    exports.config = function(_config){
        config = _config;
        return this;
    };

    return exports;
};


// Image exporter
/////////////////////////////

util.imageExporter = function() {

    var dispatch = d3.dispatch('success', 'error');
    var imageFormat = 'png',
        targetSize = {width: 300, height: 150},
        sourceSize = {width: 300, height: 150},
        outputType = 'url',
        debugLevel = 0,
        canvasContainer,
        title = 'Converted Image',
        canvasElId = 'canvasEl',
        canvasContainerId = 'canvasContainer';

    function exports(_svg) {
        var xmlString, w, h;
        if(typeof _svg === 'string'){
            xmlString = _svg;
            w = sourceSize.width;
            h = sourceSize.height;
        }
        else if(!!_svg.append || !!_svg.className){
            var svgNode = (!!_svg.append)? _svg.node() : _svg;
            var serializer = new XMLSerializer();
            xmlString = serializer.serializeToString(svgNode);
            w = svgNode.offsetWidth;
            h = svgNode.offsetHeight;
        }
        else return sendError('wrong input svg (d3 selection or DOM node)');

        if(canvasContainer) canvasContainer.html('');
        canvasContainer = d3.select('body').append('div')
            .attr({id: canvasContainerId})
            .style({position: 'absolute', top: 0, left: 0, 'z-index': 1000});
        if(debugLevel < 2) canvasContainer.style({visibility: 'hidden'});
        var canvasEl = canvasContainer.append('canvas').attr({id: canvasElId, width: w, height: h});
        var canvasNode = canvasEl.node();

        var ctx = canvasNode.getContext('2d');
        var DOMURL = self.URL || self.webkitURL || self;
        var img = new Image();
        var svg = new Blob([xmlString], {type: 'image/svg+xml;charset=utf-8'});
        var url = DOMURL.createObjectURL(svg);
        img.onload = function() {
            ctx.drawImage(img, 0, 0);
            DOMURL.revokeObjectURL(url);
            encodeAll();
        };
        img.onerror = function() {
            DOMURL.revokeObjectURL(url);
            return sendError('img didnt load');
        };
        img.src = url;

        function encodeAll(){
            setTimeout(function(){
                var imgData;
                if (imageFormat === 'jpeg') {
                    imgData = canvasNode.toDataURL('image/jpeg');
                }
                else if (imageFormat === 'png') {
                    imgData = canvasNode.toDataURL('image/png');
                }
                else if (imageFormat === 'webp'){
                    imgData = canvasNode.toDataURL('image/webp');
                }
                else if (imageFormat === 'svg') imgData = _svg;
                else {
                    return sendError({err: 'Image format is not jpeg, png, or svg', code: 400});
                }

                if(debugLevel === 0) {
                    canvasContainer.remove();
                    canvasEl.remove();
                }
                if(imgData){
                    dispatch.success(imgData);
                }
                else sendError({err: 'Image is empty', code: 530});
            }, 0);
        }
    }

    function sendError(_msg){
        dispatch.error(_msg);
        if(debugLevel === 1) console.log('Error: ' + _msg);
        else if(debugLevel === 2) throw(_msg);
    }
    d3.rebind(exports, dispatch, 'on');
    exports.imageFormat = function(_imageFormat){
        imageFormat = _imageFormat; //png, svg, jpg, pdf
        return this;
    };
    exports.outputType = function(_outputType){
        outputType = _outputType; //img, link, url, forceDownload, downloadLink
        return this;
    };
    exports.debugLevel = function(_level){
        debugLevel = _level;
        return this;
    };
    exports.title = function(_title){
        title = _title;
        return this;
    };
    exports.sourceSize = function(_sourceSize){
        sourceSize = _sourceSize;
        return this;
    };
    exports.targetSize = function(_targetSize){
        targetSize = _targetSize;
        return this;
    };
    exports.canvasContainerId = function(_canvasContainerId){
        canvasContainerId = _canvasContainerId;
        return this;
    };
    exports.canvasElId = function(_canvasElId){
        canvasElId = _canvasElId;
        return this;
    };
    return exports;
};

// Append SVG
/////////////////////////////

d3.selection.prototype.appendSVG = function(_svgString) {
    var skeleton = '<svg xmlns="http://www.w3.org/2000/svg" ' +
            'xmlns:xlink="http://www.w3.org/1999/xlink">' +
            _svgString + '</svg>',
        dom = new DOMParser().parseFromString(skeleton, 'application/xml'),
        childNode = dom.documentElement.firstChild;
    while(childNode) {
        this.node().appendChild(this.node().ownerDocument.importNode(childNode, true));
        childNode = childNode.nextSibling;
    }
    if (dom.querySelector('parsererror')){
        console.log(dom.querySelector('parsererror div').textContent);
        return null;
    }
    return d3.select(this.node().lastChild);
};


// Simple templating
/////////////////////////////

util.compileTemplate = function(_template, _values){
    return [].concat(_values).map(function(d){
        return _template.replace(/{([^}]*)}/g, function(s, key){return d[key] || '';});
    }).join('\n');
};


// Complex templating
// @see https://github.com/jashkenas/underscore/blob/master/underscore.js#L1234
/////////////////////////////
util.tmpl = function(text, data) {
    var settings = {
        evaluate: /<%([\s\S]+?)%>/g,
        interpolate: /<%=([\s\S]+?)%>/g,
        escape: /<%-([\s\S]+?)%>/g
    };

    var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

    var escapes = {
        '\'': '\'',
        '\\': '\\',
        '\r': 'r',
        '\n': 'n',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    };

    var escapeChar = function(match) {
        return '\\' + escapes[match];
    };

    // Combine delimiters into one regular expression via alternation.
    var noMatch = /(.)^/;
    var matcher = new RegExp([
        (settings.escape || noMatch).source,
        (settings.interpolate || noMatch).source,
        (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = '__p+=\'';
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
        source += text.slice(index, offset).replace(escaper, escapeChar);
        index = offset + match.length;

        if (escape) {
            source += '\'+\n((__t=(' + escape + '))==null?\'\':_.escape(__t))+\n\'';
        } else if (interpolate) {
            source += '\'+\n((__t=(' + interpolate + '))==null?\'\':__t)+\n\'';
        } else if (evaluate) {
            source += '\';\n' + evaluate + '\n__p+=\'';
        }

        // Adobe VMs need the match returned to produce the correct offest.
        return match;
    });
    source += '\';\n';

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = 'var __t,__p=\'\',__j=Array.prototype.join,' +
        'print=function(){__p+=__j.call(arguments,\'\');};\n' +
        source + 'return __p;\n';

    var render;
    try {
        render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
        e.source = source;
        throw e;
    }

    if (data) return render(data);
    var template = function(data) {
        return render.call(this, data);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
};


// Text utilities
/////////////////////////////

util.getSVGBBoxFromString = function(_string, _style){
    var tmp = d3.select('body').append('div').style({visibility: 'none'});
    var textSelection = tmp.append('svg').append('text').text(_string).style(_style);
    var bBox = textSelection.node().getBBox();
    tmp.remove();
    return bBox;
};

util.html_entity_decode = function(s) {
    var hiddenDiv = d3.select('body').append('div').style({display: 'none'}).html('');
    var replaced = s.replace(/(&[^;]*;)/gi, function(d){
        if(d==='&lt;') { return '&#60;'; } // special handling for brackets
        if(d==='&rt;') { return '&#62;'; }
        return hiddenDiv.html(d).text(); // everything else, let the browser decode it to unicode
    });
    hiddenDiv.remove();
    return replaced;
};

util.xml_entity_encode = function(str){
    return str.replace(/&(?!\w+;|\#[0-9]+;| \#x[0-9A-F]+;)/g,'&amp;');
};

util.toCamelCase = function(_str){
    return _str.toLowerCase().replace(/-(.)/g, function(match, group1){ return group1.toUpperCase(); });
};

util.jsHook = function(_el){
    var jsHook = _el.className.match(/js-[^ ]+/);
    return (jsHook) ? jsHook[0] : null;
};


// Word wrap
/////////////////////////////

util.wrap = function(_wrapW){
    return function(){
        var that = this;

        function tspanify(){
            var lineH = this.node().getBBox().height;
            this.text('')
                .selectAll('tspan')
                .data(lineArray)
                .enter().append('tspan')
                .attr({
                    x: 0,
                    y: function(d, i){ return (i + 1) * lineH; }
                })
                .text(function(d){ return d.join(' '); });
        }

        function checkW(_text){
            var textTmp = that
                .style({visibility: 'hidden'})
                .text(_text);
            var textW = textTmp.node().getBBox().width;
            that.style({visibility: 'visible'}).text(text);
            return textW;
        }

        var text = this.text();
        var parentNode = this.node().parentNode;
        var textSplitted = text.split(' ');
        var lineArray = [[]];
        var count = 0;
        textSplitted.forEach(function(d){
            if(checkW(lineArray[count].concat(d).join(' '), parentNode) >= _wrapW){
                count++;
                lineArray[count] = [];
            }
            lineArray[count].push(d);
        });

        this.call(tspanify);
    };
};

util.getSize = function(_selection, _dimension){
    return _selection.node().getBoundingClientRect()[_dimension];
};


// text converter
/////////////////////////////

util.convertToTspans = function(_context, _callback){
    var str = _context.text();
    var converted = Plotly.util.convertToSvg(str);
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
    // for Plotly.Drawing.bBox: unlink text and all parents from its cached box
    for(var up = _context.node(); up && up.removeAttribute; up = up.parentNode) {
        up.removeAttribute('data-bb');
    }

    function showText() {
        if(!parent.empty()){
            svgClass = that.attr('class') + '-math';
            parent.select('svg.' + svgClass).remove();
        }
        _context.text('')
            .style({visibility: 'visible'});
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

    if(tex){
        var td = Plotly.Lib.getPlotDiv(that.node());
        ((td && td._promises)||[]).push(new Promise(function(resolve) {
            that.style({visibility: 'hidden'});
            var config = {fontSize: parseInt(that.style('font-size'), 10)};
            Plotly.util.texToSVG(tex[2], config, function(_svgEl, _glyphDefs, _svgBBox){
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

                var newSvgW = Plotly.util.getSize(newSvg, 'width'),
                    newSvgH = Plotly.util.getSize(newSvg, 'height'),
                    newX = +that.attr('x') - newSvgW *
                        {start:0, middle:0.5, end:1}[that.attr('text-anchor') || 'start'],
                    // font baseline is about 1/4 fontSize below centerline
                    textHeight = parseInt(that.style('font-size'), 10) ||
                        Plotly.util.getSize(that, 'height'),
                    dy = -textHeight/4;

                if(svgClass[0] === 'y'){
                    mathjaxGroup.attr({
                        transform: 'rotate(' + [-90, +that.attr('x'), +that.attr('y')] +
                        ') translate(' + [-newSvgW / 2, dy - newSvgH / 2] + ')'
                    });
                    newSvg.attr({x: +that.attr('x'), y: +that.attr('y')});
                }
                else if(svgClass[0] === 'l'){
                    newSvg.attr({x: that.attr('x'), y: dy - (newSvgH / 2)});
                }
                else if(svgClass[0] === 'a'){
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
/////////////////////////////

function cleanEscapesForTex(s) {
    return s.replace(/(<|&lt;|&#60;)/g, '\\lt ')
        .replace(/(>|&gt;|&#62;)/g, '\\gt ');
}

util.texToSVG = function(_texString, _config, _callback){
    var randomID = 'math-output-' + Plotly.Lib.randstr([],64);
    var tmpDiv = d3.select('body').append('div')
        .attr({id: randomID})
        .style({visibility: 'hidden', position: 'absolute'})
        .style({'font-size': _config.fontSize + 'px'})
        .text(cleanEscapesForTex(_texString));

    MathJax.Hub.Queue(['Typeset', MathJax.Hub, tmpDiv.node()], function(){
        var glyphDefs = d3.select('body').select('#MathJax_SVG_glyphs');

        if(tmpDiv.select('.MathJax_SVG').empty() || !tmpDiv.select('svg').node()){
            console.log('There was an error in the tex syntax.', _texString);
            _callback();
        }
        else {
            var svgBBox = tmpDiv.select('svg').node().getBoundingClientRect();
            _callback(tmpDiv.select('.MathJax_SVG'), glyphDefs, svgBBox);
        }

        tmpDiv.remove();
    });
};

var CONVERSION = {
    // would like to use baseline-shift but FF doesn't support it yet
    // so we need to use dy along with the uber hacky shift-back-to
    // baseline below
    sup: 'font-size:70%" dy="-0.6em',
    sub: 'font-size:70%" dy="0.3em',
    b: 'font-weight:bold',
    i: 'font-style:italic',
    a: '',
    font: '',
    span: '',
    br: '',
    em: 'font-style:italic;font-weight:bold'
};

var STRIP_TAGS = new RegExp('</?(' + Object.keys(CONVERSION).join('|') + ')( [^>]*)?/?>', 'g');

util.plainText = function(_str){
    // strip out our pseudo-html so we have a readable
    // version to put into text fields
    return (_str||'').replace(STRIP_TAGS, ' ');
};

util.convertToSvg = function(_str){
    var uppercase = d3.keys(CONVERSION).map(function(d){ return d.toUpperCase(); });
    var htmlEntitiesDecoded = Plotly.util.html_entity_decode(_str);
    var result = htmlEntitiesDecoded
        .split(/(<[^<>]*>)/).map(function(d){
            var match = d.match(/<(\/?)([^ >]*)[ ]?(.*)>/i);
            if(match && (match[2] in CONVERSION || uppercase.indexOf(match[2]) !== -1)){
                if((match[2] === 'a' || match[2] === 'A') && match[3]){
                    return '<a xlink:show="new" xlink:'+ CONVERSION[match[2]] + match[3] + '>';
                }
                else if((match[2] === 'a' || match[2] === 'A') && match[1]) return '</a>';
                else if(match[1]) {
                    // extra tspan with zero-width space to get back to the right baseline
                    if(match[2] === 'sup' || match[2] === 'SUP') {
                        return '</tspan><tspan dy="0.42em">&#x200b;</tspan>';
                    }
                    if(match[2] === 'sub' || match[2] === 'SUB') {
                        return '</tspan><tspan dy="-0.21em">&#x200b;</tspan>';
                    }
                    return '</tspan>';
                }
                else if(match[3]) return '<tspan '+ CONVERSION[match[2]] + match[3] + '>';
                else if(match[2] === 'br' || match[2] === 'BR') return d;
                else return '<tspan' + ' style="' + CONVERSION[match[2]]+ '">';
            }
            else{
                return Plotly.util.xml_entity_encode(d).replace(/</g, '&lt;');
            }
        });

    var indices = [];
    for (var index = result.indexOf('<br>'); index > 0; index = result.indexOf('<br>', index+1)){
        indices.push(index);
    }
    var count = 0;
    indices.forEach(function(d){
        var brIndex = d + count;
        var search = result.slice(0, brIndex);
        var previousOpenTag = '';
        for(var i2=search.length-1; i2>=0; i2--){
            var isTag = search[i2].match(/<(\/?).*>/i);
            if(isTag && search[i2] !== '<br>'){
                if(!isTag[1]) previousOpenTag = search[i2];
                break;
            }
        }
        if(previousOpenTag){
            result.splice(brIndex+1, 0, previousOpenTag);
            result.splice(brIndex, 0, '</tspan>');
            count += 2;
        }
    });

    var joined = result.join('');
    var splitted = joined.split(/<br>/gi);
    if(splitted.length > 1){
        result = splitted.map(function(d, i){
            return '<tspan class="line" dy="' + (i*1.3) + 'em">'+ d +'</tspan>';
        });
    }

    return result.join('');
};

util.alignSVGWith = function (_base, _options){
    return function(){
        var baseBBox = _base.node().getBBox();
        var alignH = '50%';
        var alignTextH = alignH;
        var anchor = 'middle';
        var vMargin = 0;
        var hMargin = _options.horizontalMargin || 0;
        if(_options.orientation === 'under') vMargin = baseBBox.y + baseBBox.height;
        else if(_options.orientation === 'over') vMargin = baseBBox.y;
        else if(_options.orientation === 'inside'){
            vMargin = baseBBox.y;
        }
        if(_options.verticalMargin) vMargin += _options.verticalMargin;
        if(_options.horizontalAlign === 'center'){
            alignH = '50%';
            anchor = 'middle';
            hMargin = hMargin/4;
        }
        else if(_options.horizontalAlign === 'right'){
            alignH = '0%';
            anchor = 'start';
        }
        else if(_options.horizontalAlign === 'left'){
            alignH = '100%';
            anchor = 'end';
            hMargin = -hMargin;
        }
        else if(typeof _options.horizontalAlign === 'number'){
            alignH = _options.horizontalAlign;
            anchor = 'middle';
        }
        if(_options.orientation === 'inside'){
            alignTextH = 0;
        }

        this.attr({x: alignTextH, dx: hMargin, y: vMargin}).style({'text-anchor': anchor})
            .selectAll('tspan.line').attr({x: alignH, dx: hMargin, y: vMargin});

        return this;
    };
};

util.alignHTMLWith = function (_base, container, options){
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

    return function(){
        thisRect = this.node().getBoundingClientRect();
        this.style({
            top: (getTop() - cRect.top) + 'px',
            left: (getLeft() - cRect.left) + 'px',
            'z-index': 1000
        });
        return this;
    };
};

// Editable title
/////////////////////////////

util.makeEditable = function(context, _delegate, options){
    if(!options) options = {};
    var that = this;
    var dispatch = d3.dispatch('edit', 'input', 'cancel');
    var textSelection = d3.select(this.node())
        .style({'pointer-events': 'all'})
        .attr({'xml:space': 'preserve'});

    var handlerElement = _delegate || textSelection;
    if(_delegate) textSelection.style({'pointer-events': 'none'});

    function handleClick(){
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

    function appendEditable(){
        var plotDiv = d3.select(Plotly.Lib.getPlotDiv(that.node())),
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
                margin: [-parseFloat(that.style('font-size'))/8+1, 0, 0, -1].join('px ') + 'px',
                padding: '0',
                'box-sizing': 'border-box'
            })
            .attr({contenteditable: true})
            .text(options.text || that.attr('data-unformatted'))
            .call(util.alignHTMLWith(that, container, options))
            .on('blur', function(){
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
            .on('focus', function(){
                var context = this;
                d3.select(document).on('mouseup', function(){
                    if(d3.event.target === context) return false;
                    if(document.activeElement === div.node()) div.node().blur();
                });
            })
            .on('keyup', function(){
                if(d3.event.which === 27){
                    that.style({opacity: 1});
                    d3.select(this)
                        .style({opacity: 0})
                        .on('blur', function(){ return false; })
                        .transition().remove();
                    dispatch.cancel.call(that, this.textContent);
                }
                else{
                    dispatch.input.call(that, this.textContent);
                    d3.select(this).call(util.alignHTMLWith(that, container, options));
                }
            })
            .on('keydown', function(){
                if(d3.event.which === 13) this.blur();
            })
            .call(selectElementContents);
    }

    if(options.immediate) handleClick();
    else handlerElement.on('click', handleClick);

    return d3.rebind(this, dispatch, 'on');
};


// Varia
/////////////////////////////

util.deepExtend = function(destination, source) {
    for (var property in source) {
        if (source[property] && source[property].constructor && source[property].constructor === Object) {
            destination[property] = destination[property] || {};
            util.deepExtend(destination[property], source[property]);
        } else {
            destination[property] = source[property];
        }
    }
    return destination;
};


//Modified from https://github.com/ArthurClemens/Javascript-Undo-Manager
//Copyright (c) 2010-2013 Arthur Clemens, arthur@visiblearea.com
util.UndoManager = function(){
    var undoCommands = [],
            index = -1,
            isExecuting = false,
            callback;
    function execute(command, action){
        if(!command) return this;
        isExecuting = true;
        command[action]();
        isExecuting = false;
        return this;
    }
    return {
        add: function(command){
            if(isExecuting) return this;
            undoCommands.splice(index + 1, undoCommands.length - index);
            undoCommands.push(command);
            index = undoCommands.length - 1;
            return this;
        },
        setCallback: function(callbackFunc){ callback = callbackFunc; },
        undo: function(){
            var command = undoCommands[index];
            if(!command) return this;
            execute(command, 'undo');
            index -= 1;
            if(callback) callback(command.undo);
            return this;
        },
        redo: function(){
            var command = undoCommands[index + 1];
            if(!command) return this;
            execute(command, 'redo');
            index += 1;
            if(callback) callback(command.redo);
            return this;
        },
        clear: function(){
            undoCommands = [];
            index = -1;
        },
        hasUndo: function(){ return index !== -1; },
        hasRedo: function(){ return index < (undoCommands.length - 1); },
        getCommands: function(){ return undoCommands; },
        getPreviousCommand: function(){ return undoCommands[index-1]; },
        getIndex: function(){ return index; }
    };
};
