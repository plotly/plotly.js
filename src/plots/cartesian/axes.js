/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');
var d3 = require('d3');
var isNumeric = require('fast-isnumeric');

var axes = module.exports = {};

axes.attributes = require('./attributes');

Plotly.Plots.registerSubplot('cartesian', ['xaxis', 'yaxis'], ['x', 'y'], axes.attributes);

axes.layoutAttributes = require('./layout_attributes');

var xAxisMatch = /^xaxis[0-9]*$/,
    yAxisMatch = /^yaxis[0-9]*$/;

axes.supplyLayoutDefaults = function(layoutIn, layoutOut, fullData) {
    // get the full list of axes already defined
    var layoutKeys = Object.keys(layoutIn),
        xaList = [],
        yaList = [],
        outerTicks = {},
        noGrids = {},
        i;

    for(i = 0; i < layoutKeys.length; i++) {
        var key = layoutKeys[i];
        if(xAxisMatch.test(key)) xaList.push(key);
        else if(yAxisMatch.test(key)) yaList.push(key);
    }

    for(i = 0; i < fullData.length; i++) {
        var trace = fullData[i],
            xaName = axes.id2name(trace.xaxis),
            yaName = axes.id2name(trace.yaxis);

        // add axes implied by traces
        if(xaName && xaList.indexOf(xaName)===-1) xaList.push(xaName);
        if(yaName && yaList.indexOf(yaName)===-1) yaList.push(yaName);

        // check for default formatting tweaks
        if(Plotly.Plots.traceIs(trace, '2dMap')) {
            outerTicks[xaName] = true;
            outerTicks[yaName] = true;
        }

        if(Plotly.Plots.traceIs(trace, 'oriented')) {
            var positionAxis = trace.orientation==='h' ? yaName : xaName;
            noGrids[positionAxis] = true;
        }
    }

    function axSort(a,b) {
        var aNum = Number(a.substr(5)||1),
            bNum = Number(b.substr(5)||1);
        return aNum - bNum;
    }

    if(layoutOut._hasCartesian || layoutOut._hasGL2D || !fullData.length) {
        // make sure there's at least one of each and lists are sorted
        if(!xaList.length) xaList = ['xaxis'];
        else xaList.sort(axSort);

        if(!yaList.length) yaList = ['yaxis'];
        else yaList.sort(axSort);
    }

    xaList.concat(yaList).forEach(function(axName){
        var axLetter = axName.charAt(0),
            axLayoutIn = layoutIn[axName] || {},
            axLayoutOut = {},
            defaultOptions = {
                letter: axLetter,
                font: layoutOut.font,
                outerTicks: outerTicks[axName],
                showGrid: !noGrids[axName],
                name: axName,
                data: fullData
            },
            positioningOptions = {
                letter: axLetter,
                counterAxes: {x: yaList, y: xaList}[axLetter].map(axes.name2id),
                overlayableAxes: {x: xaList, y: yaList}[axLetter].filter(function(axName2){
                    return axName2!==axName && !(layoutIn[axName2]||{}).overlaying;
                }).map(axes.name2id)
            };

        function coerce(attr, dflt) {
            return Plotly.Lib.coerce(axLayoutIn, axLayoutOut,
                                     axes.layoutAttributes,
                                     attr, dflt);
        }

        axes.handleAxisDefaults(axLayoutIn, axLayoutOut, coerce, defaultOptions);
        axes.handleAxisPositioningDefaults(axLayoutIn, axLayoutOut, coerce, positioningOptions);
        layoutOut[axName] = axLayoutOut;

        // so we don't have to repeat autotype unnecessarily,
        // copy an autotype back to layoutIn
        if(!layoutIn[axName] && axLayoutIn.type!=='-') {
            layoutIn[axName] = {type: axLayoutIn.type};
        }

    });

    // plot_bgcolor only makes sense if there's a (2D) plot!
    // TODO: bgcolor for each subplot, to inherit from the main one
    if(xaList.length && yaList.length) {
        Plotly.Lib.coerce(layoutIn, layoutOut,
            Plotly.Plots.layoutAttributes, 'plot_bgcolor');
    }
};

/**
 * options: object containing:
 *      letter: 'x' or 'y'
 *      title: name of the axis (ie 'Colorbar') to go in default title
 *      name: axis object name (ie 'xaxis') if one should be stored
 *      font: the default font to inherit
 *      outerTicks: boolean, should ticks default to outside?
 *      showGrid: boolean, should gridlines be shown by default?
 *      noHover: boolean, this axis doesn't support hover effects?
 *      data: the plot data to use in choosing auto type
 */
axes.handleAxisDefaults = function(containerIn, containerOut, coerce, options) {
    var letter = options.letter,
        font = options.font || {},
        defaultTitle = 'Click to enter ' +
            (options.title || (letter.toUpperCase() + ' axis')) +
            ' title';

    // set up some private properties
    if(options.name) {
        containerOut._name = options.name;
        containerOut._id = axes.name2id(options.name);
    }

    // now figure out type and do some more initialization
    var axType = coerce('type');
    if(axType==='-') {
        setAutoType(containerOut, options.data);

        if(containerOut.type==='-') {
            containerOut.type = 'linear';
        }
        else {
            // copy autoType back to input axis
            // note that if this object didn't exist
            // in the input layout, we have to put it in
            // this happens in the main supplyDefaults function
            axType = containerIn.type = containerOut.type;
        }
    }
    axes.setConvert(containerOut);

    coerce('title', defaultTitle);
    Plotly.Lib.coerceFont(coerce, 'titlefont', {
        family: font.family,
        size: Math.round(font.size * 1.2),
        color: font.color
    });

    var validRange = (containerIn.range||[]).length===2 &&
            isNumeric(containerIn.range[0]) &&
            isNumeric(containerIn.range[1]),
        autoRange = coerce('autorange', !validRange);

    if(autoRange) coerce('rangemode');
    var range = coerce('range', [-1, letter==='x' ? 6 : 4]);
    if(range[0] === range[1]) {
        containerOut.range = [range[0] - 1, range[0] + 1];
    }
    Plotly.Lib.noneOrAll(containerIn.range, containerOut.range, [0, 1]);

    coerce('fixedrange');

    axes.handleTickValueDefaults(containerIn, containerOut, coerce, axType);

    axes.handleTickDefaults(containerIn, containerOut, coerce, axType, options);



    var lineColor = Plotly.Lib.coerce2(containerIn, containerOut, axes.layoutAttributes, 'linecolor'),
        lineWidth = Plotly.Lib.coerce2(containerIn, containerOut, axes.layoutAttributes, 'linewidth'),
        showLine = coerce('showline', !!lineColor || !!lineWidth);

    if(!showLine) {
        delete containerOut.linecolor;
        delete containerOut.linewidth;
    }

    if(showLine || containerOut.ticks) coerce('mirror');

    var gridColor = Plotly.Lib.coerce2(containerIn, containerOut, axes.layoutAttributes, 'gridcolor'),
        gridWidth = Plotly.Lib.coerce2(containerIn, containerOut, axes.layoutAttributes, 'gridwidth'),
        showGridLines = coerce('showgrid', options.showGrid || !!gridColor || !!gridWidth);

    if(!showGridLines) {
        delete containerOut.gridcolor;
        delete containerOut.gridwidth;
    }

    var zeroLineColor = Plotly.Lib.coerce2(containerIn, containerOut, axes.layoutAttributes, 'zerolinecolor'),
        zeroLineWidth = Plotly.Lib.coerce2(containerIn, containerOut, axes.layoutAttributes, 'zerolinewidth'),
        showZeroLine = coerce('zeroline', options.showGrid || !!zeroLineColor || !!zeroLineWidth);

    if(!showZeroLine) {
        delete containerOut.zerolinecolor;
        delete containerOut.zerolinewidth;
    }

    return containerOut;
};

/**
 * options: inherits font, outerTicks, noHover from axes.handleAxisDefaults
 */
axes.handleTickDefaults = function(containerIn, containerOut, coerce, axType, options) {
    var tickLen = Plotly.Lib.coerce2(containerIn, containerOut, axes.layoutAttributes, 'ticklen'),
        tickWidth = Plotly.Lib.coerce2(containerIn, containerOut, axes.layoutAttributes, 'tickwidth'),
        tickColor = Plotly.Lib.coerce2(containerIn, containerOut, axes.layoutAttributes, 'tickcolor'),
        showTicks = coerce('ticks', (options.outerTicks || tickLen || tickWidth || tickColor) ? 'outside' : '');
    if(!showTicks) {
        delete containerOut.ticklen;
        delete containerOut.tickwidth;
        delete containerOut.tickcolor;
    }

    var showTickLabels = coerce('showticklabels');
    if(showTickLabels) {
        Plotly.Lib.coerceFont(coerce, 'tickfont', options.font || {});
        coerce('tickangle');

        var showAttrDflt = axes.getShowAttrDflt(containerIn);

        if(axType !== 'category') {
            var tickFormat = coerce('tickformat');
            if(!options.noHover) coerce('hoverformat');

            if(!tickFormat && axType !== 'date') {
                coerce('showexponent', showAttrDflt);
                coerce('exponentformat');
            }
        }

        var tickPrefix = coerce('tickprefix');
        if(tickPrefix) coerce('showtickprefix', showAttrDflt);

        var tickSuffix = coerce('ticksuffix');
        if(tickSuffix) coerce('showticksuffix', showAttrDflt);
    }
};

axes.handleTickValueDefaults = function(containerIn, containerOut, coerce, axType) {
    var tickmodeDefault = 'auto';

    if(containerIn.tickmode === 'array' &&
            (axType === 'log' || axType === 'date')) {
        containerIn.tickmode = 'auto';
    }

    if(Array.isArray(containerIn.tickvals)) tickmodeDefault = 'array';
    else if(containerIn.dtick && isNumeric(containerIn.dtick)) {
        tickmodeDefault = 'linear';
    }
    var tickmode = coerce('tickmode', tickmodeDefault);

    if(tickmode === 'auto') coerce('nticks');
    else if(tickmode === 'linear') {
        coerce('tick0');
        coerce('dtick');
    }
    else {
        var tickvals = coerce('tickvals');
        if(tickvals === undefined) containerOut.tickmode = 'auto';
        else coerce('ticktext');
    }
};

axes.handleAxisPositioningDefaults = function(containerIn, containerOut, coerce, options) {
    var counterAxes = options.counterAxes || [],
        overlayableAxes = options.overlayableAxes || [],
        letter = options.letter;

    var anchor = Plotly.Lib.coerce(containerIn, containerOut,
        {
            anchor: {
                valType:'enumerated',
                values: ['free'].concat(counterAxes),
                dflt: isNumeric(containerIn.position) ? 'free' :
                    (counterAxes[0] || 'free')
            }
        },
        'anchor');

    if(anchor==='free') coerce('position');

    Plotly.Lib.coerce(containerIn, containerOut,
        {
            side: {
                valType: 'enumerated',
                values: letter==='x' ? ['bottom', 'top'] : ['left', 'right'],
                dflt: letter==='x' ? 'bottom' : 'left'
            }
        },
        'side');

    var overlaying = false;
    if(overlayableAxes.length) {
        overlaying = Plotly.Lib.coerce(containerIn, containerOut,
        {
            overlaying: {
                valType: 'enumerated',
                values: [false].concat(overlayableAxes),
                dflt: false
            }
        },
        'overlaying');
    }

    if(!overlaying) {
        // TODO: right now I'm copying this domain over to overlaying axes
        // in ax.setscale()... but this means we still need (imperfect) logic
        // in the axes popover to hide domain for the overlaying axis.
        // perhaps I should make a private version _domain that all axes get???
        var domain = coerce('domain');
        if(domain[0] > domain[1] - 0.01) containerOut.domain = [0,1];
        Plotly.Lib.noneOrAll(containerIn.domain, containerOut.domain, [0, 1]);
    }

    return containerOut;
};

// find the list of possible axes to reference with an xref or yref attribute
// and coerce it to that list
axes.coerceRef = function(containerIn, containerOut, td, axLetter) {
    var axlist = td._fullLayout._hasGL2D ? [] : axes.listIds(td, axLetter),
        refAttr = axLetter + 'ref',
        attrDef = {};

    // data-ref annotations are not supported in gl2d yet

    attrDef[refAttr] = {
        valType: 'enumerated',
        values: axlist.concat(['paper']),
        dflt: axlist[0] || 'paper'
    };

    // xref, yref
    return Plotly.Lib.coerce(containerIn, containerOut, attrDef, refAttr);
};

// empty out types for all axes containing these traces
// so we auto-set them again
axes.clearTypes = function(gd, traces) {
    if(!Array.isArray(traces) || !traces.length) {
        traces = (gd._fullData).map(function(d,i) { return i; });
    }
    traces.forEach(function(tracenum) {
        var trace = gd.data[tracenum];
        delete (axes.getFromId(gd, trace.xaxis)||{}).type;
        delete (axes.getFromId(gd, trace.yaxis)||{}).type;
    });
};

// convert between axis names (xaxis, xaxis2, etc, elements of td.layout)
// and axis id's (x, x2, etc). Would probably have ditched 'xaxis'
// completely in favor of just 'x' if it weren't ingrained in the API etc.
var AX_ID_PATTERN = /^[xyz][0-9]*$/,
    AX_NAME_PATTERN = /^[xyz]axis[0-9]*$/;
axes.id2name = function(id) {
    if(typeof id !== 'string' || !id.match(AX_ID_PATTERN)) return;
    var axNum = id.substr(1);
    if(axNum==='1') axNum = '';
    return id.charAt(0) + 'axis' + axNum;
};

axes.name2id = function(name) {
    if(!name.match(AX_NAME_PATTERN)) return;
    var axNum = name.substr(5);
    if(axNum==='1') axNum = '';
    return name.charAt(0)+axNum;
};

axes.cleanId = function(id, axLetter) {
    if(!id.match(AX_ID_PATTERN)) return;
    if(axLetter && id.charAt(0)!==axLetter) return;

    var axNum = id.substr(1).replace(/^0+/,'');
    if(axNum==='1') axNum = '';
    return id.charAt(0) + axNum;
};

axes.cleanName = function(name, axLetter) {
    if(!name.match(AX_ID_PATTERN)) return;
    if(axLetter && name.charAt(0)!==axLetter) return;

    var axNum = name.substr(5).replace(/^0+/,'');
    if(axNum==='1') axNum = '';
    return name.charAt(0) + 'axis' + axNum;
};

// get counteraxis letter for this axis (name or id)
// this can also be used as the id for default counter axis
axes.counterLetter = function(id) {
    return {x:'y',y:'x'}[id.charAt(0)];
};

function setAutoType(ax, data){
    // new logic: let people specify any type they want,
    // only autotype if type is '-'
    if(ax.type!=='-') return;

    var id = ax._id,
        axLetter = id.charAt(0);

    // support 3d
    if(id.indexOf('scene') !== -1) id = axLetter;

    var d0 = getFirstNonEmptyTrace(data, id, axLetter);
    if(!d0) return;

    // first check for histograms, as the count direction
    // should always default to a linear axis
    if(d0.type==='histogram' &&
            axLetter==={v:'y', h:'x'}[d0.orientation || 'v']) {
        ax.type='linear';
        return;
    }

    // check all boxes on this x axis to see
    // if they're dates, numbers, or categories
    if(isBoxWithoutPositionCoords(d0, axLetter)) {
        var posLetter = getBoxPosLetter(d0),
            boxPositions = [],
            trace;

        for(var i = 0; i < data.length; i++) {
            trace = data[i];
            if(!Plotly.Plots.traceIs(trace, 'box') ||
               (trace[axLetter + 'axis'] || axLetter) !== id) continue;

            if(trace[posLetter] !== undefined) boxPositions.push(trace[posLetter][0]);
            else if(trace.name !== undefined) boxPositions.push(trace.name);
            else boxPositions.push('text');
        }

        ax.type = axes.autoType(boxPositions);
    }
    else {
        ax.type = axes.autoType(d0[axLetter] || [d0[axLetter+'0']]);
    }
}

function getBoxPosLetter(trace) {
    return {v:'x', h:'y'}[trace.orientation || 'v'];
}

function isBoxWithoutPositionCoords(trace, axLetter) {
    var posLetter = getBoxPosLetter(trace);
    return Plotly.Plots.traceIs(trace, 'box') && axLetter===posLetter &&
            trace[posLetter]===undefined && trace[posLetter + '0']===undefined;
}

function getFirstNonEmptyTrace(data, id, axLetter) {
    var trace;

    for(var i = 0; i < data.length; i++) {
        trace = data[i];

        if((trace[axLetter + 'axis'] || axLetter) === id) {
            if(isBoxWithoutPositionCoords(trace, axLetter)) {
                return trace;
            }
            else if((trace[axLetter] || []).length || trace[axLetter + '0']) {
                return trace;
            }
        }
    }
}

axes.autoType = function(array) {
    if(axes.moreDates(array)) return 'date';
    if(axes.category(array)) return 'category';
    if(linearOK(array)) return 'linear';
    else return '-';
};

/*
 * Attributes 'showexponent', 'showtickprefix' and 'showticksuffix'
 * share values.
 *
 * If only 1 attribute is set,
 * the remaining attributes inherit that value.
 *
 * If 2 attributes are set to the same value,
 * the remaining attribute inherits that value.
 *
 * If 2 attributes are set to different values,
 * the remaining is set to its dflt value.
 *
 */
axes.getShowAttrDflt = function getShowAttrDflt(containerIn) {
    var showAttrsAll = ['showexponent',
                        'showtickprefix',
                        'showticksuffix'],
        showAttrs = showAttrsAll.filter(function(a){
            return containerIn[a]!==undefined;
        }),
        sameVal = function(a){
            return containerIn[a]===containerIn[showAttrs[0]];
        };
    if (showAttrs.every(sameVal) || showAttrs.length===1) {
        return containerIn[showAttrs[0]];
    }
};

// is there at least one number in array? If not, we should leave
// ax.type empty so it can be autoset later
function linearOK(array) {
    if(!array) return false;
    for(var i = 0; i < array.length; i++) {
        if(isNumeric(array[i])) return true;
    }
    return false;
}

// does the array a have mostly dates rather than numbers?
// note: some values can be neither (such as blanks, text)
// 2- or 4-digit integers can be both, so require twice as many
// dates as non-dates, to exclude cases with mostly 2 & 4 digit
// numbers and a few dates
axes.moreDates = function(a) {
    var dcnt=0, ncnt=0,
        // test at most 1000 points, evenly spaced
        inc = Math.max(1,(a.length-1)/1000),
        ai;
    for(var i=0; i<a.length; i+=inc) {
        ai = a[Math.round(i)];
        if(Plotly.Lib.isDateTime(ai)) dcnt+=1;
        if(isNumeric(ai)) ncnt+=1;
    }
    return (dcnt>ncnt*2);
};

// are the (x,y)-values in td.data mostly text?
// require twice as many categories as numbers
axes.category = function(a) {
    // test at most 1000 points
    var inc = Math.max(1, (a.length - 1) / 1000),
        curvenums = 0,
        curvecats = 0,
        ai;

    for(var i = 0; i < a.length; i += inc) {
        ai = axes.cleanDatum(a[Math.round(i)]);
        if(isNumeric(ai)) curvenums++;
        else if(typeof ai === 'string' && ai !== '' && ai !== 'None') curvecats++;
    }
    return curvecats > curvenums * 2;
};

// cleanDatum: removes characters
// same replace criteria used in the grid.js:scrapeCol
// but also handling dates, numbers, and NaN, null, Infinity etc
axes.cleanDatum = function(c){
    try{
        if(typeof c==='object' && c!==null && c.getTime) {
            return Plotly.Lib.ms2DateTime(c);
        }
        if(typeof c!=='string' && !isNumeric(c)) {
            return '';
        }
        c = c.toString().replace(/['"%,$# ]/g,'');
    }catch(e){
        console.log(e,c);
    }
    return c;
};

/**
 * standardize all missing data in calcdata to use undefined
 * never null or NaN.
 * that way we can use !==undefined, or !==axes.BADNUM,
 * to test for real data
 */
axes.BADNUM = undefined;

// setConvert: define the conversion functions for an axis
// data is used in 4 ways:
//  d: data, in whatever form it's provided
//  c: calcdata: turned into numbers, but not linearized
//  l: linearized - same as c except for log axes (and other
//      mappings later?) this is used by ranges, and when we
//      need to know if it's *possible* to show some data on
//      this axis, without caring about the current range
//  p: pixel value - mapped to the screen with current size and zoom
// setAxConvert creates/updates these conversion functions
// also clears the autorange bounds ._min and ._max
// and the autotick constraints ._minDtick, ._forceTick0,
// and looks for date ranges that aren't yet in numeric format
axes.setConvert = function(ax) {
    // clipMult: how many axis lengths past the edge do we render?
    // for panning, 1-2 would suffice, but for zooming more is nice.
    // also, clipping can affect the direction of lines off the edge...
    var clipMult = 10;

    function toLog(v, clip){
        if(v>0) return Math.log(v)/Math.LN10;

        else if(v<=0 && clip && ax.range && ax.range.length===2) {
            // clip NaN (ie past negative infinity) to clipMult axis
            // length past the negative edge
            var r0 = ax.range[0],
                r1 = ax.range[1];
            return 0.5*(r0 + r1 - 3 * clipMult * Math.abs(r0 - r1));
        }

        else return axes.BADNUM;
    }
    function fromLog(v){ return Math.pow(10,v); }
    function num(v){ return isNumeric(v) ? Number(v) : axes.BADNUM; }

    ax.c2l = (ax.type==='log') ? toLog : num;
    ax.l2c = (ax.type==='log') ? fromLog : num;
    ax.l2d = function(v) { return ax.c2d(ax.l2c(v)); };

    // set scaling to pixels
    ax.setScale = function(){
        var gs = ax._td._fullLayout._size,
            i;

        // TODO cleaner way to handle this case
        if (!ax._categories) ax._categories = [];

        // make sure we have a domain (pull it in from the axis
        // this one is overlaying if necessary)
        if(ax.overlaying) {
            var ax2 = axes.getFromId(ax._td, ax.overlaying);
            ax.domain = ax2.domain;
        }

        // make sure we have a range (linearized data values)
        // and that it stays away from the limits of javascript numbers
        if(!ax.range || ax.range.length!==2 || ax.range[0]===ax.range[1]) {
            ax.range = [-1,1];
        }
        for(i=0; i<2; i++) {
            if(!isNumeric(ax.range[i])) {
                ax.range[i] = isNumeric(ax.range[1-i]) ?
                    (ax.range[1-i] * (i ? 10 : 0.1)) :
                    (i ? 1 : -1);
            }

            if(ax.range[i]<-(Number.MAX_VALUE/2)) {
                ax.range[i] = -(Number.MAX_VALUE/2);
            }
            else if(ax.range[i]>Number.MAX_VALUE/2) {
                ax.range[i] = Number.MAX_VALUE/2;
            }

        }

        if(ax._id.charAt(0)==='y') {
            ax._offset = gs.t+(1-ax.domain[1])*gs.h;
            ax._length = gs.h*(ax.domain[1]-ax.domain[0]);
            ax._m = ax._length/(ax.range[0]-ax.range[1]);
            ax._b = -ax._m*ax.range[1];
        }
        else {
            ax._offset = gs.l+ax.domain[0]*gs.w;
            ax._length = gs.w*(ax.domain[1]-ax.domain[0]);
            ax._m = ax._length/(ax.range[1]-ax.range[0]);
            ax._b = -ax._m*ax.range[0];
        }

        if (!isFinite(ax._m) || !isFinite(ax._b)) {
            Plotly.Lib.notifier(
                'Something went wrong with axis scaling',
                'long');
            ax._td._replotting = false;
            throw new Error('axis scaling');
        }
    };

    ax.l2p = function(v) {
        if(!isNumeric(v)) return axes.BADNUM;
        // include 2 fractional digits on pixel, for PDF zooming etc
        return d3.round(Plotly.Lib.constrain(ax._b + ax._m*v,
            -clipMult*ax._length, (1+clipMult)*ax._length), 2);
    };

    ax.p2l = function(px) { return (px-ax._b)/ax._m; };

    ax.c2p = function(v, clip) { return ax.l2p(ax.c2l(v, clip)); };
    ax.p2c = function(px){ return ax.l2c(ax.p2l(px)); };

    if(['linear','log','-'].indexOf(ax.type)!==-1) {
        ax.c2d = num;
        ax.d2c = function(v){
            v = axes.cleanDatum(v);
            return isNumeric(v) ? Number(v) : axes.BADNUM;
        };
        ax.d2l = function (v, clip) {
            if (ax.type === 'log') return ax.c2l(ax.d2c(v), clip);
            else return ax.d2c(v);
        };
    }
    else if(ax.type==='date') {
        ax.c2d = function(v) {
            return isNumeric(v) ? Plotly.Lib.ms2DateTime(v) : axes.BADNUM;
        };

        ax.d2c = function(v){
            return (isNumeric(v)) ? Number(v) : Plotly.Lib.dateTime2ms(v);
        };

        ax.d2l = ax.d2c;

        // check if date strings or js date objects are provided for range
        // and convert to ms
        if(ax.range && ax.range.length>1) {
            try {
                var ar1 = ax.range.map(Plotly.Lib.dateTime2ms);
                if(!isNumeric(ax.range[0]) && isNumeric(ar1[0])) {
                    ax.range[0] = ar1[0];
                }
                if(!isNumeric(ax.range[1]) && isNumeric(ar1[1])) {
                    ax.range[1] = ar1[1];
                }
            }
            catch(e) { console.log(e, ax.range); }
        }
    }
    else if(ax.type==='category') {

        ax.c2d = function(v) {
            return ax._categories[Math.round(v)];
        };

        ax.d2c = function(v) {
            // create the category list
            // this will enter the categories in the order it
            // encounters them, ie all the categories from the
            // first data set, then all the ones from the second
            // that aren't in the first etc.
            // TODO: sorting options - do the sorting
            // progressively here as we insert?
            if(ax._categories.indexOf(v)===-1) ax._categories.push(v);

            var c = ax._categories.indexOf(v);
            return c===-1 ? axes.BADNUM : c;
        };

        ax.d2l = ax.d2c;
    }

    // makeCalcdata: takes an x or y array and converts it
    // to a position on the axis object "ax"
    // inputs:
    //      tdc - a data object from td.data
    //      axletter - a string, either 'x' or 'y', for which item
    //          to convert (TODO: is this now always the same as
    //          the first letter of ax._id?)
    // in case the expected data isn't there, make a list of
    // integers based on the opposite data
    ax.makeCalcdata = function(tdc, axletter) {
        var arrayIn, arrayOut, i;

        if(axletter in tdc) {
            arrayIn = tdc[axletter];
            arrayOut = new Array(arrayIn.length);

            for(i = 0; i < arrayIn.length; i++) arrayOut[i] = ax.d2c(arrayIn[i]);
        }
        else {
            var v0 = ((axletter+'0') in tdc) ?
                    ax.d2c(tdc[axletter+'0']) : 0,
                dv = (tdc['d'+axletter]) ?
                    Number(tdc['d'+axletter]) : 1;

            // the opposing data, for size if we have x and dx etc
            arrayIn = tdc[{x: 'y',y: 'x'}[axletter]];
            arrayOut = new Array(arrayIn.length);

            for(i = 0; i < arrayIn.length; i++) arrayOut[i] = v0+i*dv;
        }
        return arrayOut;
    };

    // for autoranging: arrays of objects:
    //      {val: axis value, pad: pixel padding}
    // on the low and high sides
    ax._min = [];
    ax._max = [];

    // and for bar charts and box plots: reset forced minimum tick spacing
    ax._minDtick = null;
    ax._forceTick0 = null;
};

// incorporate a new minimum difference and first tick into
// forced
axes.minDtick = function(ax,newDiff,newFirst,allow) {
    // doesn't make sense to do forced min dTick on log or category axes,
    // and the plot itself may decide to cancel (ie non-grouped bars)
    if(['log','category'].indexOf(ax.type)!==-1 || !allow) {
        ax._minDtick = 0;
    }
    // null means there's nothing there yet
    else if(ax._minDtick===null) {
        ax._minDtick = newDiff;
        ax._forceTick0 = newFirst;
    }
    else if(ax._minDtick) {
        // existing minDtick is an integer multiple of newDiff
        // (within rounding err)
        // and forceTick0 can be shifted to newFirst
        if((ax._minDtick/newDiff+1e-6)%1 < 2e-6 &&
                (((newFirst-ax._forceTick0)/newDiff%1) +
                    1.000001) % 1 < 2e-6) {
            ax._minDtick = newDiff;
            ax._forceTick0 = newFirst;
        }
        // if the converse is true (newDiff is a multiple of minDtick and
        // newFirst can be shifted to forceTick0) then do nothing - same
        // forcing stands. Otherwise, cancel forced minimum
        else if((newDiff/ax._minDtick+1e-6)%1 > 2e-6 ||
                (((newFirst-ax._forceTick0)/ax._minDtick%1) +
                    1.000001) % 1 > 2e-6) {
            ax._minDtick = 0;
        }
    }
};

axes.doAutoRange = function(ax) {
    if(!ax._length) ax.setScale();

    if(ax.autorange && ax._min && ax._max &&
            ax._min.length && ax._max.length) {
        var minmin = ax._min[0].val,
            maxmax = ax._max[0].val,
            i;

        for(i = 1; i < ax._min.length; i++) {
            if(minmin !== maxmax) break;
            minmin = Math.min(minmin, ax._min[i].val);
        }
        for(i = 1; i < ax._max.length; i++) {
            if(minmin !== maxmax) break;
            maxmax = Math.max(maxmax, ax._max[i].val);
        }

        var j,minpt,maxpt,minbest,maxbest,dp,dv,
            mbest = 0,
            axReverse = (ax.range && ax.range[1]<ax.range[0]);
        // one-time setting to easily reverse the axis
        // when plotting from code
        if(ax.autorange==='reversed') {
            axReverse = true;
            ax.autorange = true;
        }
        for(i=0; i<ax._min.length; i++) {
            minpt = ax._min[i];
            for(j=0; j<ax._max.length; j++) {
                maxpt = ax._max[j];
                dv = maxpt.val-minpt.val;
                dp = ax._length-minpt.pad-maxpt.pad;
                if(dv>0 && dp>0 && dv/dp > mbest) {
                    minbest = minpt;
                    maxbest = maxpt;
                    mbest = dv/dp;
                }
            }
        }
        if(minmin===maxmax) {
            ax.range = axReverse ?
                [minmin+1, ax.rangemode!=='normal' ? 0 : minmin-1] :
                [ax.rangemode!=='normal' ? 0 : minmin-1, minmin+1];
        }
        else if(mbest) {
            if(ax.type==='linear' || ax.type==='-') {
                if(ax.rangemode==='tozero' && minbest.val>=0) {
                    minbest = {val:0, pad:0};
                }
                else if(ax.rangemode==='nonnegative') {
                    if(minbest.val - mbest*minbest.pad<0) {
                        minbest = {val:0, pad:0};
                    }
                    if(maxbest.val<0) {
                        maxbest = {val:1, pad:0};
                    }
                }

                // in case it changed again...
                mbest = (maxbest.val-minbest.val) /
                    (ax._length-minbest.pad-maxbest.pad);
            }

            ax.range = [
                minbest.val - mbest*minbest.pad,
                maxbest.val + mbest*maxbest.pad
            ];

            // don't let axis have zero size
            if(ax.range[0]===ax.range[1]) {
                ax.range = [ax.range[0]-1, ax.range[0]+1];
            }

            // maintain reversal
            if(axReverse) {
                ax.range.reverse();
            }
        }

        // doAutoRange will get called on fullLayout,
        // but we want to report its results back to layout
        var axIn = ax._td.layout[ax._name];
        if(!axIn) ax._td.layout[ax._name] = axIn = {};
        if(axIn!==ax) {
            axIn.range = ax.range.slice();
            axIn.autorange = ax.autorange;
        }
    }
};

// save a copy of the initial axis ranges in fullLayout
// use them in modebar and dblclick events
axes.saveRangeInitial = function(gd, overwrite) {
    var axList = axes.list(gd, '', true),
        hasOneAxisChanged = false;

    var ax, isNew, hasChanged;

    for(var i = 0; i < axList.length; i++) {
        ax = axList[i];

        isNew = ax._rangeInitial===undefined;
        hasChanged = isNew ||
            !(ax.range[0]===ax._rangeInitial[0] && ax.range[1]===ax._rangeInitial[1]);

        if((isNew && ax.autorange===false) || (overwrite && hasChanged)) {
            ax._rangeInitial = ax.range.slice();
            hasOneAxisChanged = true;
        }
    }

    return hasOneAxisChanged;
};

// axes.expand: if autoranging, include new data in the outer limits
// for this axis
// data is an array of numbers (ie already run through ax.d2c)
// available options:
//      vpad: (number or number array) pad values (data value +-vpad)
//      ppad: (number or number array) pad pixels (pixel location +-ppad)
//      ppadplus, ppadminus, vpadplus, vpadminus:
//          separate padding for each side, overrides symmetric
//      padded: (boolean) add 5% padding to both ends
//          (unless one end is overridden by tozero)
//      tozero: (boolean) make sure to include zero if axis is linear,
//          and make it a tight bound if possible
var FP_SAFE = Number.MAX_VALUE/2;
axes.expand = function(ax, data, options) {
    if(!ax.autorange || !data) return;
    if(!ax._min) ax._min = [];
    if(!ax._max) ax._max = [];
    if(!options) options = {};
    if(!ax._m) ax.setScale();

    var len = data.length,
        extrappad = options.padded ? ax._length*0.05 : 0,
        tozero = options.tozero && (ax.type==='linear' || ax.type==='-'),
        i, j, v, di, dmin, dmax,
        ppadiplus, ppadiminus, includeThis, vmin, vmax;

    function getPad(item) {
        if(Array.isArray(item)) {
            return function(i) { return Math.max(Number(item[i]||0),0); };
        }
        else {
            var v = Math.max(Number(item||0),0);
            return function(){ return v; };
        }
    }
    var ppadplus = getPad((ax._m>0 ?
            options.ppadplus : options.ppadminus) || options.ppad || 0),
        ppadminus = getPad((ax._m>0 ?
            options.ppadminus : options.ppadplus) || options.ppad || 0),
        vpadplus = getPad(options.vpadplus||options.vpad),
        vpadminus = getPad(options.vpadminus||options.vpad);

    function addItem(i) {
        di = data[i];
        if(!isNumeric(di)) return;
        ppadiplus = ppadplus(i) + extrappad;
        ppadiminus = ppadminus(i) + extrappad;
        vmin = di-vpadminus(i);
        vmax = di+vpadplus(i);
        // special case for log axes: if vpad makes this object span
        // more than an order of mag, clip it to one order. This is so
        // we don't have non-positive errors or absurdly large lower
        // range due to rounding errors
        if(ax.type==='log' && vmin<vmax/10) { vmin = vmax/10; }

        dmin = ax.c2l(vmin);
        dmax = ax.c2l(vmax);

        if(tozero) {
            dmin = Math.min(0,dmin);
            dmax = Math.max(0,dmax);
        }

        // In order to stop overflow errors, don't consider points
        // too close to the limits of js floating point
        function goodNumber(v) {
            return isNumeric(v) && Math.abs(v)<FP_SAFE;
        }

        if(goodNumber(dmin)) {
            includeThis = true;
            // take items v from ax._min and compare them to the
            // presently active point:
            // - if the item supercedes the new point, set includethis false
            // - if the new pt supercedes the item, delete it from ax._min
            for(j=0; j<ax._min.length && includeThis; j++) {
                v = ax._min[j];
                if(v.val<=dmin && v.pad>=ppadiminus) {
                    includeThis = false;
                }
                else if(v.val>=dmin && v.pad<=ppadiminus) {
                    ax._min.splice(j,1);
                    j--;
                }
            }
            if(includeThis) {
                ax._min.push({
                    val:dmin,
                    pad:(tozero && dmin===0) ? 0 : ppadiminus
                });
            }
        }

        if(goodNumber(dmax)) {
            includeThis = true;
            for(j=0; j<ax._max.length && includeThis; j++) {
                v = ax._max[j];
                if(v.val>=dmax && v.pad>=ppadiplus) {
                    includeThis = false;
                }
                else if(v.val<=dmax && v.pad<=ppadiplus) {
                    ax._max.splice(j,1);
                    j--;
                }
            }
            if(includeThis) {
                ax._max.push({
                    val:dmax,
                    pad:(tozero && dmax===0) ? 0 : ppadiplus
                });
            }
        }
    }

    // For efficiency covering monotonic or near-monotonic data,
    // check a few points at both ends first and then sweep
    // through the middle
    for(i=0; i<6; i++) addItem(i);
    for(i=len-1; i>5; i--) addItem(i);

};

axes.autoBin = function(data,ax,nbins,is2d) {
    var datamin = Plotly.Lib.aggNums(Math.min, null, data),
        datamax = Plotly.Lib.aggNums(Math.max, null, data);
    if(ax.type==='category') {
        return {
            start: datamin-0.5,
            end: datamax+0.5,
            size: 1
        };
    }

    var size0;
    if(nbins) size0 = ((datamax-datamin)/nbins);
    else {
        // totally auto: scale off std deviation so the highest bin is
        // somewhat taller than the total number of bins, but don't let
        // the size get smaller than the 'nice' rounded down minimum
        // difference between values
        var distinctData = Plotly.Lib.distinctVals(data),
            msexp = Math.pow(10, Math.floor(
                Math.log(distinctData.minDiff) / Math.LN10)),
            // TODO: there are some date cases where this will fail...
            minSize = msexp*Plotly.Lib.roundUp(
                distinctData.minDiff/msexp, [0.9, 1.9, 4.9, 9.9], true);
        size0 = Math.max(minSize, 2*Plotly.Lib.stdev(data) /
            Math.pow(data.length, is2d ? 0.25 : 0.4));
    }

    // piggyback off autotick code to make "nice" bin sizes
    var dummyax = {
        type: ax.type==='log' ? 'linear' : ax.type,
        range:[datamin, datamax]
    };
    axes.autoTicks(dummyax, size0);
    var binstart = axes.tickIncrement(
            axes.tickFirst(dummyax), dummyax.dtick, 'reverse'),
        binend;

    function nearEdge(v) {
        // is a value within 1% of a bin edge?
        return (1 + (v-binstart)*100/dummyax.dtick)%100 < 2;
    }

    // check for too many data points right at the edges of bins
    // (>50% within 1% of bin edges) or all data points integral
    // and offset the bins accordingly
    if(typeof dummyax.dtick === 'number') {
        var edgecount = 0,
            midcount = 0,
            intcount = 0,
            blankcount = 0;
        for(var i=0; i<data.length; i++) {
            if(data[i]%1===0) intcount++;
            else if(!isNumeric(data[i])) blankcount++;

            if(nearEdge(data[i])) edgecount++;
            if(nearEdge(data[i] + dummyax.dtick/2)) midcount++;
        }
        var datacount = data.length - blankcount;

        if(intcount===datacount && ax.type!=='date') {
            // all integers: if bin size is <1, it's because
            // that was specifically requested (large nbins)
            // so respect that... but center the bins containing
            // integers on those integers
            if(dummyax.dtick<1) {
                binstart = datamin - 0.5 * dummyax.dtick;
            }
            // otherwise start half an integer down regardless of
            // the bin size, just enough to clear up endpoint
            // ambiguity about which integers are in which bins.
            else binstart -= 0.5;
        }
        else if(midcount < datacount * 0.1) {
            if(edgecount > datacount * 0.3 ||
                    nearEdge(datamin) || nearEdge(datamax)) {
                // lots of points at the edge, not many in the middle
                // shift half a bin
                var binshift = dummyax.dtick / 2;
                binstart += (binstart+binshift<datamin) ? binshift : -binshift;
            }
        }

        var bincount = 1 + Math.floor((datamax - binstart) / dummyax.dtick);
        binend = binstart + bincount * dummyax.dtick;
    }
    else {
        // calculate the endpoint for nonlinear ticks - you have to
        // just increment until you're done
        binend = binstart;
        while(binend<=datamax) {
            binend = axes.tickIncrement(binend, dummyax.dtick);
        }
    }

    return {
        start: binstart,
        end: binend,
        size: dummyax.dtick
    };
};


// ----------------------------------------------------
// Ticks and grids
// ----------------------------------------------------

// calculate the ticks: text, values, positioning
// if ticks are set to automatic, determine the right values (tick0,dtick)
// in any case, set tickround to # of digits to round tick labels to,
// or codes to this effect for log and date scales
axes.calcTicks = function calcTicks (ax) {
    if(ax.tickmode === 'array') return arrayTicks(ax);

    // calculate max number of (auto) ticks to display based on plot size
    if(ax.tickmode === 'auto' || !ax.dtick){
        var nt = ax.nticks,
            minPx;
        if(!nt) {
            if(ax.type==='category') {
                minPx = ax.tickfont ? (ax.tickfont.size || 12) * 1.2 : 15;
                nt = ax._length / minPx;
            }
            else {
                minPx = ax._id.charAt(0)==='y' ? 40 : 80;
                nt = Plotly.Lib.constrain(ax._length / minPx, 4, 9) + 1;
            }
        }
        axes.autoTicks(ax,Math.abs(ax.range[1]-ax.range[0])/nt);
        // check for a forced minimum dtick
        if(ax._minDtick>0 && ax.dtick<ax._minDtick*2) {
            ax.dtick = ax._minDtick;
            ax.tick0 = ax._forceTick0;
        }
    }

    // check for missing tick0
    if(!ax.tick0) {
        ax.tick0 = (ax.type==='date') ?
            new Date(2000,0,1).getTime() : 0;
    }

    // now figure out rounding of tick values
    autoTickRound(ax);

    // find the first tick
    ax._tmin=axes.tickFirst(ax);

    // check for reversed axis
    var axrev = (ax.range[1]<ax.range[0]);

    // return the full set of tick vals
    var vals = [],
        // add a tiny bit so we get ticks which may have rounded out
        endtick = ax.range[1] * 1.0001 - ax.range[0]*0.0001;
    if(ax.type==='category') {
        endtick = (axrev) ? Math.max(-0.5,endtick) :
            Math.min(ax._categories.length-0.5,endtick);
    }
    for(var x = ax._tmin;
            (axrev)?(x>=endtick):(x<=endtick);
            x = axes.tickIncrement(x,ax.dtick,axrev)) {
        vals.push(x);

        // prevent infinite loops
        if(vals.length>1000) break;
    }

    // save the last tick as well as first, so we can
    // show the exponent only on the last one
    ax._tmax = vals[vals.length - 1];

    var ticksOut = new Array(vals.length);
    for(var i = 0; i < vals.length; i++) ticksOut[i] = axes.tickText(ax, vals[i]);

    return ticksOut;
};

function arrayTicks(ax) {
    var vals = ax.tickvals,
        text = ax.ticktext,
        ticksOut = new Array(vals.length),
        r0expanded = ax.range[0] * 1.0001 - ax.range[1] * 0.0001,
        r1expanded = ax.range[1] * 1.0001 - ax.range[0] * 0.0001,
        tickMin = Math.min(r0expanded, r1expanded),
        tickMax = Math.max(r0expanded, r1expanded),
        vali,
        i,
        j = 0;


    // without a text array, just format the given values as any other ticks
    // except with more precision to the numbers
    if(!Array.isArray(text)) text = [];

    for(i = 0; i < vals.length; i++) {
        vali = ax.d2l(vals[i]);
        if(vali > tickMin && vali < tickMax) {
            if(text[i] === undefined) ticksOut[j] = axes.tickText(ax, vali);
            else ticksOut[j] = tickTextObj(ax, vali, String(text[i]));
            j++;
        }
    }

    if(j < vals.length) ticksOut.splice(j, vals.length - j);

    return ticksOut;
}

var roundBase10 = [2, 5, 10],
    roundBase24 = [1, 2, 3, 6, 12],
    roundBase60 = [1, 2, 5, 10, 15, 30],
    // 2&3 day ticks are weird, but need something btwn 1&7
    roundDays = [1, 2, 3, 7, 14],
    // approx. tick positions for log axes, showing all (1) and just 1, 2, 5 (2)
    // these don't have to be exact, just close enough to round to the right value
    roundLog1 = [-0.046, 0, 0.301, 0.477, 0.602, 0.699, 0.778, 0.845, 0.903, 0.954, 1],
    roundLog2 = [-0.301, 0, 0.301, 0.699, 1];

function roundDTick(roughDTick, base, roundingSet) {
    return base * Plotly.Lib.roundUp(roughDTick / base, roundingSet);
}

// autoTicks: calculate best guess at pleasant ticks for this axis
// inputs:
//      ax - an axis object
//      roughDTick - rough tick spacing (to be turned into a nice round number)
// outputs (into ax):
//   tick0: starting point for ticks (not necessarily on the graph)
//      usually 0 for numeric (=10^0=1 for log) or jan 1, 2000 for dates
//   dtick: the actual, nice round tick spacing, somewhat larger than roughDTick
//      if the ticks are spaced linearly (linear scale, categories,
//          log with only full powers, date ticks < month),
//          this will just be a number
//      months: M#
//      years: M# where # is 12*number of years
//      log with linear ticks: L# where # is the linear tick spacing
//      log showing powers plus some intermediates:
//          D1 shows all digits, D2 shows 2 and 5
axes.autoTicks = function(ax, roughDTick){
    var base;

    if(ax.type === 'date'){
        ax.tick0 = new Date(2000, 0, 1).getTime();

        if(roughDTick > 15778800000){
            // years if roughDTick > 6mo
            roughDTick /= 31557600000;
            base = Math.pow(10, Math.floor(Math.log(roughDTick) / Math.LN10));
            ax.dtick = 'M' + (12 * roundDTick(roughDTick, base, roundBase10));
        }
        else if(roughDTick > 1209600000){
            // months if roughDTick > 2wk
            roughDTick /= 2629800000;
            ax.dtick = 'M' + roundDTick(roughDTick, 1, roundBase24);
        }
        else if(roughDTick > 43200000){
            // days if roughDTick > 12h
            ax.dtick = roundDTick(roughDTick, 86400000, roundDays);
            // get week ticks on sunday
            ax.tick0 = new Date(2000, 0, 2).getTime();
        }
        else if(roughDTick > 1800000){
            // hours if roughDTick > 30m
            ax.dtick = roundDTick(roughDTick, 3600000, roundBase24);
        }
        else if(roughDTick > 30000){
            // minutes if roughDTick > 30sec
            ax.dtick = roundDTick(roughDTick, 60000, roundBase60);
        }
        else if(roughDTick > 500){
            // seconds if roughDTick > 0.5sec
            ax.dtick = roundDTick(roughDTick, 1000, roundBase60);
        }
        else {
            //milliseconds
            base = Math.pow(10, Math.floor(Math.log(roughDTick) / Math.LN10));
            ax.dtick = roundDTick(roughDTick, base, roundBase10);
        }
    }
    else if(ax.type === 'log'){
        ax.tick0 = 0;

        //only show powers of 10
        if(roughDTick > 0.7) ax.dtick = Math.ceil(roughDTick);
        else if(Math.abs(ax.range[1] - ax.range[0]) < 1){
            // span is less than one power of 10
            var nt = 1.5 * Math.abs((ax.range[1] - ax.range[0]) / roughDTick);

            // ticks on a linear scale, labeled fully
            roughDTick = Math.abs(Math.pow(10, ax.range[1]) -
                Math.pow(10, ax.range[0])) / nt;
            base = Math.pow(10, Math.floor(Math.log(roughDTick) / Math.LN10));
            ax.dtick = 'L' + roundDTick(roughDTick, base, roundBase10);
        }
        else {
            // include intermediates between powers of 10,
            // labeled with small digits
            // ax.dtick = "D2" (show 2 and 5) or "D1" (show all digits)
            ax.dtick = (roughDTick > 0.3) ? 'D2' : 'D1';
        }
    }
    else if(ax.type==='category') {
        ax.tick0 = 0;
        ax.dtick = Math.ceil(Math.max(roughDTick, 1));
    }
    else{
        // auto ticks always start at 0
        ax.tick0 = 0;
        base = Math.pow(10, Math.floor(Math.log(roughDTick) / Math.LN10));
        ax.dtick = roundDTick(roughDTick, base, roundBase10);
    }

    // prevent infinite loops
    if(ax.dtick === 0) ax.dtick = 1;

    // TODO: this is from log axis histograms with autorange off
    if(!isNumeric(ax.dtick) && typeof ax.dtick !=='string') {
        var olddtick = ax.dtick;
        ax.dtick = 1;
        throw 'ax.dtick error: ' + String(olddtick);
    }
};

// after dtick is already known, find tickround = precision
// to display in tick labels
//   for numeric ticks, integer # digits after . to round to
//   for date ticks, the last date part to show (y,m,d,H,M,S)
//      or an integer # digits past seconds
function autoTickRound(ax) {
    var dtick = ax.dtick,
        maxend;

    ax._tickexponent = 0;
    if(!isNumeric(dtick) && typeof dtick !== 'string') dtick = 1;

    if(ax.type === 'category') ax._tickround = null;
    else if(isNumeric(dtick) || dtick.charAt(0) === 'L') {
        if(ax.type === 'date') {
            if(dtick >= 86400000) ax._tickround = 'd';
            else if(dtick >= 3600000) ax._tickround = 'H';
            else if(dtick >= 60000) ax._tickround = 'M';
            else if(dtick >= 1000) ax._tickround = 'S';
            else ax._tickround = 3 - Math.round(Math.log(dtick / 2) / Math.LN10);
        }
        else {
            if(!isNumeric(dtick)) dtick = Number(dtick.substr(1));
            // 2 digits past largest digit of dtick
            ax._tickround = 2 - Math.floor(Math.log(dtick) / Math.LN10 + 0.01);

            if(ax.type === 'log') {
                maxend = Math.pow(10, Math.max(ax.range[0], ax.range[1]));
            }
            else maxend = Math.max(Math.abs(ax.range[0]), Math.abs(ax.range[1]));

            var rangeexp = Math.floor(Math.log(maxend) / Math.LN10 + 0.01);
            if(Math.abs(rangeexp) > 3) {
                if(ax.exponentformat === 'SI' || ax.exponentformat === 'B') {
                    ax._tickexponent = 3 * Math.round((rangeexp - 1) / 3);
                }
                else ax._tickexponent = rangeexp;
            }
        }
    }
    else if(dtick.charAt(0) === 'M') ax._tickround = (dtick.length===2) ? 'm' : 'y';
    else ax._tickround = null;
}

// months and years don't have constant millisecond values
// (but a year is always 12 months so we only need months)
// log-scale ticks are also not consistently spaced, except
// for pure powers of 10
// numeric ticks always have constant differences, other datetime ticks
// can all be calculated as constant number of milliseconds
axes.tickIncrement = function(x, dtick, axrev){
    var axSign = axrev ? -1 : 1;

    // includes all dates smaller than month, and pure 10^n in log
    if(isNumeric(dtick)) return x + axSign * dtick;

    var tType = dtick.charAt(0),
        dtSigned = axSign * Number(dtick.substr(1));

    // Dates: months (or years)
    if(tType === 'M'){
        var y = new Date(x);
        // is this browser consistent? setMonth edits a date but
        // returns that date's milliseconds
        return y.setMonth(y.getMonth() + dtSigned);
    }

    // Log scales: Linear, Digits
    else if(tType === 'L') return Math.log(Math.pow(10, x) + dtSigned) / Math.LN10;

    // log10 of 2,5,10, or all digits (logs just have to be
    // close enough to round)
    else if(tType === 'D') {
        var tickset = (dtick === 'D2') ? roundLog2 : roundLog1,
            x2 = x + axSign * 0.01,
            frac = Plotly.Lib.roundUp(mod(x2, 1), tickset, axrev);

        return Math.floor(x2) +
            Math.log(d3.round(Math.pow(10, frac), 1)) / Math.LN10;
    }
    else throw 'unrecognized dtick ' + String(dtick);
};

// calculate the first tick on an axis
axes.tickFirst = function(ax){
    var axrev = ax.range[1] < ax.range[0],
        sRound = axrev ? Math.floor : Math.ceil,
        // add a tiny extra bit to make sure we get ticks
        // that may have been rounded out
        r0 = ax.range[0] * 1.0001 - ax.range[1] * 0.0001,
        dtick = ax.dtick,
        tick0 = ax.tick0;
    if(isNumeric(dtick)) {
        var tmin = sRound((r0 - tick0) / dtick) * dtick + tick0;

        // make sure no ticks outside the category list
        if(ax.type === 'category') {
            tmin = Plotly.Lib.constrain(tmin, 0, ax._categories.length - 1);
        }
        return tmin;
    }

    var tType = dtick.charAt(0),
        dtNum = Number(dtick.substr(1)),
        t0,
        mdif,
        t1;

    // Dates: months (or years)
    if(tType === 'M'){
        t0 = new Date(tick0);
        r0 = new Date(r0);
        mdif = (r0.getFullYear() - t0.getFullYear()) * 12 +
            r0.getMonth() - t0.getMonth();
        t1 = t0.setMonth(t0.getMonth() +
            (Math.round(mdif / dtNum) + (axrev ? 1 : -1)) * dtNum);

        while(axrev ? t1 > r0 : t1 < r0) {
            t1 = axes.tickIncrement(t1, dtick, axrev);
        }
        return t1;
    }

    // Log scales: Linear, Digits
    else if(tType === 'L') {
        return Math.log(sRound(
            (Math.pow(10, r0) - tick0) / dtNum) * dtNum + tick0) / Math.LN10;
    }
    else if(tType === 'D') {
        var tickset = (dtick === 'D2') ? roundLog2 : roundLog1,
            frac = Plotly.Lib.roundUp(mod(r0, 1), tickset, axrev);

        return Math.floor(r0) +
            Math.log(d3.round(Math.pow(10, frac), 1)) / Math.LN10;
    }
    else throw 'unrecognized dtick ' + String(dtick);
};

var yearFormat = d3.time.format('%Y'),
    monthFormat = d3.time.format('%b %Y'),
    dayFormat = d3.time.format('%b %-d'),
    hourFormat = d3.time.format('%b %-d %Hh'),
    minuteFormat = d3.time.format('%H:%M'),
    secondFormat = d3.time.format(':%S');

// add one item to d3's vocabulary:
// %{n}f where n is the max number of digits
// of fractional seconds
var fracMatch = /%(\d?)f/g;
function modDateFormat(fmt,x) {
    var fm = fmt.match(fracMatch),
        d = new Date(x);
    if(fm) {
        var digits = Math.min(+fm[1]||6,6),
            fracSecs = String((x/1000 % 1) + 2.0000005)
                .substr(2,digits).replace(/0+$/,'')||'0';
        return d3.time.format(fmt.replace(fracMatch,fracSecs))(d);
    }
    else {
        return d3.time.format(fmt)(d);
    }
}

// draw the text for one tick.
// px,py are the location on td.paper
// prefix is there so the x axis ticks can be dropped a line
// ax is the axis layout, x is the tick value
// hover is a (truthy) flag for whether to show numbers with a bit
// more precision for hovertext
axes.tickText = function(ax, x, hover){
    var out = tickTextObj(ax, x),
        hideexp,
        arrayMode = ax.tickmode === 'array',
        extraPrecision = hover || arrayMode;

    if(arrayMode && Array.isArray(ax.ticktext)) {
        var minDiff = Math.abs(ax.range[1] - ax.range[0]) / 10000;
        for(var i = 0; i < ax.ticktext.length; i++) {
            if(Math.abs(x - ax.d2l(ax.tickvals[i])) < minDiff) break;
        }
        if(i < ax.ticktext.length) {
            out.text = String(ax.ticktext[i]);
            return out;
        }
    }

    function isHidden(showAttr) {
        var first_or_last;

        if (showAttr===undefined) return true;
        if (hover) return showAttr==='none';

        first_or_last = {
            first: ax._tmin,
            last: ax._tmax
        }[showAttr];

        return showAttr!=='all' && x!==first_or_last;
    }

    hideexp = ax.exponentformat!=='none' && isHidden(ax.showexponent) ? 'hide' : '';

    if(ax.type==='date') formatDate(ax, out, hover, extraPrecision);
    else if(ax.type==='log') formatLog(ax, out, hover, extraPrecision, hideexp);
    else if(ax.type==='category') formatCategory(ax, out);
    else formatLinear(ax, out, hover, extraPrecision, hideexp);

    // add prefix and suffix
    if (ax.tickprefix && !isHidden(ax.showtickprefix)) out.text = ax.tickprefix + out.text;
    if (ax.ticksuffix && !isHidden(ax.showticksuffix)) out.text += ax.ticksuffix;

    return out;
};

function tickTextObj(ax, x, text) {
    var tf = ax.tickfont || ax._td._fullLayout.font;

    return {
        x: x,
        dx: 0,
        dy: 0,
        text: text || '',
        fontSize: tf.size,
        font: tf.family,
        fontColor: tf.color
    };
}

function formatDate(ax, out, hover, extraPrecision) {
    var x = out.x,
        tr = ax._tickround,
        d = new Date(x),
        // suffix completes the full date info, to be included
        // with only the first tick
        suffix = '',
        tt;
    if(hover && ax.hoverformat) {
        tt = modDateFormat(ax.hoverformat,x);
    }
    else if(ax.tickformat) {
        tt = modDateFormat(ax.tickformat,x);
        // TODO: potentially hunt for ways to automatically add more
        // precision to the hover text?
    }
    else {
        if(extraPrecision) {
            if(isNumeric(tr)) tr+=2;
            else tr = {y:'m', m:'d', d:'H', H:'M', M:'S', S:2}[tr];
        }
        if(tr==='y') tt = yearFormat(d);
        else if(tr==='m') tt = monthFormat(d);
        else {
            if(x===ax._tmin && !hover) {
                suffix = '<br>'+yearFormat(d);
            }

            if(tr==='d') tt = dayFormat(d);
            else if(tr==='H') tt = hourFormat(d);
            else {
                if(x===ax._tmin && !hover) {
                    suffix = '<br>'+dayFormat(d)+', '+yearFormat(d);
                }

                tt = minuteFormat(d);
                if(tr!=='M'){
                    tt += secondFormat(d);
                    if(tr!=='S') {
                        tt += numFormat(mod(x/1000,1),ax,'none',hover)
                            .substr(1);
                    }
                }
            }
        }
    }
    out.text = tt + suffix;
}

function formatLog(ax, out, hover, extraPrecision, hideexp) {
    var dtick = ax.dtick,
        x = out.x;
    if(extraPrecision && ((typeof dtick !== 'string') || dtick.charAt(0)!=='L')) dtick = 'L3';

    if(ax.tickformat || (typeof dtick === 'string' && dtick.charAt(0) === 'L')) {
        out.text = numFormat(Math.pow(10, x), ax, hideexp, extraPrecision);
    }
    else if(isNumeric(dtick)||((dtick.charAt(0)==='D')&&(mod(x+0.01,1)<0.1))) {
        if(['e','E','power'].indexOf(ax.exponentformat)!==-1) {
            var p = Math.round(x);
            if(p === 0) out.text = 1;
            else if(p === 1) out.text = '10';
            else if(p > 1) out.text = '10<sup>' + p + '</sup>';
            else out.text = '10<sup>\u2212' + -p + '</sup>';

            out.fontSize *= 1.25;
        }
        else {
            out.text = numFormat(Math.pow(10,x), ax,'','fakehover');
            if(dtick==='D1' && ax._id.charAt(0)==='y') {
                out.dy -= out.fontSize/6;
            }
        }
    }
    else if(dtick.charAt(0) === 'D') {
        out.text = String(Math.round(Math.pow(10, mod(x, 1))));
        out.fontSize *= 0.75;
    }
    else throw 'unrecognized dtick ' + String(dtick);

    // if 9's are printed on log scale, move the 10's away a bit
    if(ax.dtick==='D1') {
        var firstChar = String(out.text).charAt(0);
        if(firstChar === '0' || firstChar === '1') {
            if(ax._id.charAt(0) === 'y') {
                out.dx -= out.fontSize / 4;
            }
            else {
                out.dy += out.fontSize / 2;
                out.dx += (ax.range[1] > ax.range[0] ? 1 : -1) *
                    out.fontSize * (x < 0 ? 0.5 : 0.25);
            }
        }
    }
}

function formatCategory(ax, out) {
    var tt = ax._categories[Math.round(out.x)];
    if(tt === undefined) tt = '';
    out.text = String(tt);
}

function formatLinear(ax, out, hover, extraPrecision, hideexp) {
    // don't add an exponent to zero if we're showing all exponents
    // so the only reason you'd show an exponent on zero is if it's the
    // ONLY tick to get an exponent (first or last)
    if(ax.showexponent==='all' && Math.abs(out.x/ax.dtick)<1e-6) {
        hideexp = 'hide';
    }
    out.text = numFormat(out.x, ax, hideexp, extraPrecision);
}

// format a number (tick value) according to the axis settings
// new, more reliable procedure than d3.round or similar:
// add half the rounding increment, then stringify and truncate
// also automatically switch to sci. notation
var SIPREFIXES = ['f', 'p', 'n', '&mu;', 'm', '', 'k', 'M', 'G', 'T'];
function numFormat(v, ax, fmtoverride, hover) {
        // negative?
    var isNeg = v < 0,
        // max number of digits past decimal point to show
        tickRound = ax._tickround,
        exponentFormat = fmtoverride || ax.exponentformat || 'B',
        exponent = ax._tickexponent,
        tickformat = ax.tickformat;

    // special case for hover: set exponent just for this value, and
    // add a couple more digits of precision over tick labels
    if(hover) {
        // make a dummy axis obj to get the auto rounding and exponent
        var ah = {
            exponentformat:ax.exponentformat,
            dtick: ax.showexponent==='none' ? ax.dtick :
                (isNumeric(v) ? Math.abs(v) || 1 : 1),
            // if not showing any exponents, don't change the exponent
            // from what we calculate
            range: ax.showexponent === 'none' ? ax.range : [0, v || 1]
        };
        autoTickRound(ah);
        tickRound = (Number(ah._tickround) || 0) + 4;
        exponent = ah._tickexponent;
        if(ax.hoverformat) tickformat = ax.hoverformat;
    }

    if(tickformat) return d3.format(tickformat)(v).replace(/-/g,'\u2212');

    // 'epsilon' - rounding increment
    var e = Math.pow(10, -tickRound) / 2;

    // exponentFormat codes:
    // 'e' (1.2e+6, default)
    // 'E' (1.2E+6)
    // 'SI' (1.2M)
    // 'B' (same as SI except 10^9=B not G)
    // 'none' (1200000)
    // 'power' (1.2x10^6)
    // 'hide' (1.2, use 3rd argument=='hide' to eg
    //      only show exponent on last tick)
    if(exponentFormat === 'none') exponent = 0;

    // take the sign out, put it back manually at the end
    // - makes cases easier
    v = Math.abs(v);
    if(v < e) {
        // 0 is just 0, but may get exponent if it's the last tick
        v = '0';
        isNeg = false;
    }
    else {
        v += e;
        // take out a common exponent, if any
        if(exponent) {
            v *= Math.pow(10, -exponent);
            tickRound += exponent;
        }
        // round the mantissa
        if(tickRound === 0) v = String(Math.floor(v));
        else if(tickRound < 0) {
            v = String(Math.round(v));
            v = v.substr(0, v.length + tickRound);
            for(var i = tickRound; i < 0; i++) v += '0';
        }
        else {
            v = String(v);
            var dp = v.indexOf('.') + 1;
            if(dp) v = v.substr(0, dp + tickRound).replace(/\.?0+$/, '');
        }
        // insert appropriate decimal point and thousands separator
        v = numSeparate(v, ax._td._fullLayout.separators);
    }

    // add exponent
    if(exponent && exponentFormat !== 'hide') {
        var signedExponent;
        if(exponent < 0) signedExponent = '\u2212' + -exponent;
        else if(exponentFormat !== 'power') signedExponent = '+' + exponent;
        else signedExponent = String(exponent);

        if(exponentFormat === 'e' ||
                ((exponentFormat === 'SI' || exponentFormat === 'B') &&
                 (exponent > 12 || exponent < -15))) {
            v += 'e' + signedExponent;
        }
        else if(exponentFormat === 'E') {
            v += 'E' + signedExponent;
        }
        else if(exponentFormat === 'power') {
            v += '&times;10<sup>' + signedExponent + '</sup>';
        }
        else if(exponentFormat === 'B' && exponent === 9) {
            v += 'B';
        }
        else if(exponentFormat === 'SI' || exponentFormat === 'B') {
            v += SIPREFIXES[exponent / 3 + 5];
        }
    }

    // put sign back in and return
    // replace standard minus character (which is technically a hyphen)
    // with a true minus sign
    if(isNeg) return '\u2212' + v;
    return v;
}

// add arbitrary decimal point and thousands separator
var findThousands = /(\d+)(\d{3})/;
function numSeparate(nStr, separators) {
    // separators - first char is decimal point,
    // next char is thousands separator if there is one

    var dp = separators.charAt(0),
        thou = separators.charAt(1),
        x = nStr.split('.'),
        x1 = x[0],
        x2 = x.length > 1 ? dp + x[1] : '';
    // even if there is a thousands separator, don't use it on
    // 4-digit integers (like years)
    if(thou && (x.length > 1 || x1.length>4)) {
        while (findThousands.test(x1)) {
            x1 = x1.replace(findThousands, '$1' + thou + '$2');
        }
    }
    return x1 + x2;
}

// get all axis object names
// optionally restricted to only x or y or z by string axLetter
// and optionally 2D axes only, not those inside 3D scenes
function listNames(td, axLetter, only2d) {
    var fullLayout = td._fullLayout;
    if(!fullLayout) return [];

    function filterAxis(obj, extra) {
        var keys = Object.keys(obj),
            axMatch = /^[xyz]axis[0-9]*/,
            out = [];

        for(var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if(axLetter && k.charAt(0) !== axLetter) continue;
            if(axMatch.test(k)) out.push(extra + k);
        }

        return out.sort();
    }

    var names = filterAxis(fullLayout, '');
    if(only2d) return names;

    var sceneIds3D = Plotly.Plots.getSubplotIds(fullLayout, 'gl3d') || [];
    for(var i = 0; i < sceneIds3D.length; i++) {
        var sceneId = sceneIds3D[i];
        names = names.concat(
            filterAxis(fullLayout[sceneId], sceneId + '.')
        );
    }

    return names;
}

// get all axis objects, as restricted in listNames
axes.list = function(td, axletter, only2d) {
    return listNames(td, axletter, only2d)
        .map(function(axName) {
            return Plotly.Lib.nestedProperty(td._fullLayout, axName).get();
        });
};

// get all axis ids, optionally restricted by letter
// this only makes sense for 2d axes
axes.listIds = function(td, axletter) {
    return listNames(td, axletter, true).map(axes.name2id);
};

// get an axis object from its id 'x','x2' etc
// optionally, id can be a subplot (ie 'x2y3') and type gets x or y from it
axes.getFromId = function(td, id, type) {
    var fullLayout = td._fullLayout;

    if(type==='x') id = id.replace(/y[0-9]*/,'');
    else if(type==='y') id = id.replace(/x[0-9]*/,'');

    return fullLayout[axes.id2name(id)];
};

// get an axis object of specified type from the containing trace
axes.getFromTrace = function (td, fullTrace, type) {
    var fullLayout = td._fullLayout;
    var ax = null;
    if (Plotly.Plots.traceIs(fullTrace, 'gl3d')) {
        var scene = fullTrace.scene;
        if (scene.substr(0,5)==='scene') {
            ax = fullLayout[scene][type + 'axis'];
        }
    } else {
        ax = axes.getFromId(td, fullTrace[type + 'axis'] || type);
    }

    return ax;
};

axes.subplotMatch = /^x([0-9]*)y([0-9]*)$/;

// getSubplots - extract all combinations of axes we need to make plots for
// as an array of items like 'xy', 'x2y', 'x2y2'...
// sorted by x (x,x2,x3...) then y
// optionally restrict to only subplots containing axis object ax
// looks both for combinations of x and y found in the data
// and at axes and their anchors
axes.getSubplots = function(gd, ax) {
    var subplots = [];
    var i, j, sp;

    // look for subplots in the data
    var data = gd.data || [];

    for(i = 0; i < data.length; i++) {
        var trace = data[i];

        if(trace.visible === false || trace.visible === 'legendonly' ||
            !(Plotly.Plots.traceIs(trace, 'cartesian') ||
                Plotly.Plots.traceIs(trace, 'gl2d'))
        ) continue;

        var xId = trace.xaxis || 'x',
            yId = trace.yaxis || 'y';
        sp = xId + yId;

        if(subplots.indexOf(sp) === -1) subplots.push(sp);
    }

    // look for subplots in the axes/anchors, so that we at least draw all axes
    var axesList = axes.list(gd, '', true);

    function hasAx2(sp, ax2) {
        return sp.indexOf(ax2._id) !== -1;
    }

    for(i = 0; i < axesList.length; i++) {
        var ax2 = axesList[i],
            ax2Letter = ax2._id.charAt(0),
            ax3Id = (ax2.anchor === 'free') ?
                ((ax2Letter === 'x') ? 'y' : 'x') :
                ax2.anchor,
            ax3 = axes.getFromId(gd, ax3Id);

        // if a free axis is already represented in the data, ignore it
        var foundAx2 = false;
        for(j = 0; j < subplots.length; j++) {
             if(hasAx2(subplots[j], ax2)) {
                 foundAx2 = true;
                 break;
             }
        }
        if(ax2.anchor === 'free' && foundAx2) continue;

        if(!ax3) {
            console.log([
                'Warning: couldnt find anchor', ax3Id,
                'for axis', ax2._id
            ].join(' '));
            return;
        }

        sp = (ax2Letter === 'x') ?
            ax2._id + ax3._id :
            ax3._id + ax2._id;

        if(subplots.indexOf(sp) === -1) subplots.push(sp);
    }

    // filter invalid subplots
    var spMatch = axes.subplotMatch,
        allSubplots = [];

    for(i = 0; i < subplots.length; i++) {
        sp = subplots[i];
        if(spMatch.test(sp)) allSubplots.push(sp);
    }

    // sort the subplot ids
    allSubplots.sort(function(a, b) {
        var aMatch = a.match(spMatch),
            bMatch = b.match(spMatch);

        if(aMatch[1] === bMatch[1]) {
            return +(aMatch[2]||1) - (bMatch[2]||1);
        }

        return +(aMatch[1]||0) - (bMatch[1]||0);
    });

    if(ax) return axes.findSubplotsWithAxis(allSubplots, ax);
    return allSubplots;
};

// find all subplots with axis 'ax'
axes.findSubplotsWithAxis = function(subplots, ax) {
    var axMatch = new RegExp(
        (ax._id.charAt(0) === 'x') ?  ('^' + ax._id + 'y') : (ax._id + '$')
    );
    var subplotsWithAxis = [];

    for(var i = 0; i < subplots.length; i++) {
        var sp = subplots[i];
        if(axMatch.test(sp)) subplotsWithAxis.push(sp);
    }

    return subplotsWithAxis;
};

// makeClipPaths: prepare clipPaths for all single axes and all possible xy pairings
axes.makeClipPaths = function(td) {
    var layout = td._fullLayout,
        defs = layout._defs,
        fullWidth = {_offset: 0, _length: layout.width, _id: ''},
        fullHeight = {_offset: 0, _length: layout.height, _id: ''},
        xaList = axes.list(td, 'x', true),
        yaList = axes.list(td, 'y', true),
        clipList = [],
        i,
        j;

    for(i = 0; i < xaList.length; i++) {
        clipList.push({x: xaList[i], y: fullHeight});
        for(j = 0; j < yaList.length; j++) {
            if(i===0) clipList.push({x: fullWidth, y: yaList[j]});
            clipList.push({x: xaList[i], y: yaList[j]});
        }
    }

    var defGroup = defs.selectAll('g.clips')
        .data([0]);
    defGroup.enter().append('g')
        .classed('clips', true);

    // selectors don't work right with camelCase tags,
    // have to use class instead
    // https://groups.google.com/forum/#!topic/d3-js/6EpAzQ2gU9I
    var axClips = defGroup.selectAll('.axesclip')
        .data(clipList, function(d) { return d.x._id + d.y._id; });
    axClips.enter().append('clipPath')
        .classed('axesclip', true)
        .attr('id', function(d) { return 'clip' + layout._uid + d.x._id + d.y._id; } )
      .append('rect');
    axClips.exit().remove();
    axClips.each(function(d) {
        d3.select(this).select('rect').attr({
            x: d.x._offset || 0,
            y: d.y._offset || 0,
            width: d.x._length || 1,
            height: d.y._length || 1
        });
    });
};


// doTicks: draw ticks, grids, and tick labels
// axid: 'x', 'y', 'x2' etc,
//     blank to do all,
//     'redraw' to force full redraw, and reset ax._r
//          (stored range for use by zoom/pan)
//     or can pass in an axis object directly
axes.doTicks = function(td, axid, skipTitle) {
    var fullLayout = td._fullLayout,
        ax,
        independent = false;

    // allow passing an independent axis object instead of id
    if(typeof axid === 'object') {
        ax = axid;
        axid = ax._id;
        independent = true;
    }
    else {
        ax = axes.getFromId(td,axid);

        if(axid==='redraw') {
            fullLayout._paper.selectAll('g.subplot').each(function(subplot) {
                var plotinfo = fullLayout._plots[subplot],
                    xa = plotinfo.x(),
                    ya = plotinfo.y();
                plotinfo.plot.attr('viewBox',
                    '0 0 '+xa._length+' '+ya._length);
                plotinfo.xaxislayer
                    .selectAll('.'+xa._id+'tick').remove();
                plotinfo.yaxislayer
                    .selectAll('.'+ya._id+'tick').remove();
                plotinfo.gridlayer
                    .selectAll('path').remove();
                plotinfo.zerolinelayer
                    .selectAll('path').remove();
            });
        }

        if(!axid || axid==='redraw') {
            return Plotly.Lib.syncOrAsync(axes.list(td, '', true).map(function(ax) {
                return function(){
                    if(!ax._id) return;
                    var axDone = axes.doTicks(td,ax._id);
                    if(axid==='redraw') ax._r = ax.range.slice();
                    return axDone;
                };
            }));
        }
    }

    // make sure we only have allowed options for exponents
    // (others can make confusing errors)
    if(!ax.tickformat) {
        if(['none','e','E','power','SI','B'].indexOf(ax.exponentformat)===-1) {
            ax.exponentformat = 'e';
        }
        if(['all','first','last','none'].indexOf(ax.showexponent)===-1) {
            ax.showexponent = 'all';
        }
    }

    // in case a val turns into string somehow
    ax.range = [+ax.range[0], +ax.range[1]];

    // set scaling to pixels
    ax.setScale();

    var axletter = axid.charAt(0),
        counterLetter = axes.counterLetter(axid),
        vals = axes.calcTicks(ax),
        datafn = function(d){ return d.text + d.x + ax.mirror; },
        tcls = axid+'tick',
        gcls = axid+'grid',
        zcls = axid+'zl',
        pad = (ax.linewidth||1) / 2,
        labelStandoff =
            (ax.ticks==='outside' ? ax.ticklen : 1) + (ax.linewidth||0),
        gridWidth = Plotly.Drawing.crispRound(td, ax.gridwidth, 1),
        zeroLineWidth = Plotly.Drawing.crispRound(td, ax.zerolinewidth, gridWidth),
        tickWidth = Plotly.Drawing.crispRound(td, ax.tickwidth, 1),
        sides, transfn, tickprefix, tickmid,
        i;

    // positioning arguments for x vs y axes
    if(axletter==='x') {
        sides = ['bottom', 'top'];
        transfn = function(d){
            return 'translate('+ax.l2p(d.x)+',0)';
        };
        // dumb templating with string concat
        // would be better to use an actual template
        tickprefix = 'M0,';
        tickmid = 'v';
    }
    else if(axletter==='y') {
        sides = ['left', 'right'];
        transfn = function(d){
            return 'translate(0,'+ax.l2p(d.x)+')';
        };
        tickprefix = 'M';
        tickmid = ',0h';
    }
    else {
        console.log('unrecognized doTicks axis', axid);
        return;
    }
    var axside = ax.side||sides[0],
    // which direction do the side[0], side[1], and free ticks go?
    // then we flip if outside XOR y axis
        ticksign = [-1, 1, axside===sides[1] ? 1 : -1];
    if((ax.ticks!=='inside') === (axletter==='x')) {
        ticksign = ticksign.map(function(v){ return -v; });
    }

    // remove zero lines, grid lines, and inside ticks if they're within
    // 1 pixel of the end
    // The key case here is removing zero lines when the axis bound is zero.
    function clipEnds(d) {
        var p = ax.l2p(d.x);
        return (p>1 && p<ax._length-1);
    }
    var valsClipped = vals.filter(clipEnds);

    function drawTicks(container,tickpath) {
        var ticks=container.selectAll('path.'+tcls)
            .data(ax.ticks==='inside' ? valsClipped : vals, datafn);
        if(tickpath && ax.ticks) {
            ticks.enter().append('path').classed(tcls, 1).classed('ticks', 1)
                .classed('crisp', 1)
                .call(Plotly.Color.stroke, ax.tickcolor)
                .style('stroke-width', tickWidth + 'px')
                .attr('d',tickpath);
            ticks.attr('transform', transfn);
            ticks.exit().remove();
        }
        else ticks.remove();
    }

    function drawLabels(container,position) {
        // tick labels - for now just the main labels.
        // TODO: mirror labels, esp for subplots
        var tickLabels=container.selectAll('g.'+tcls).data(vals, datafn);
        if(!ax.showticklabels || !isNumeric(position)) {
            tickLabels.remove();
            Plotly.Titles.draw(td, axid + 'title');
            return;
        }

        var labelx, labely, labelanchor, labelpos0;
        if(axletter==='x') {
            var flipit = axside==='bottom' ? 1 : -1;
            labelx = function(d){ return d.dx; };
            labelpos0 = position + (labelStandoff+pad)*flipit;
            labely = function(d){
                return d.dy+labelpos0+d.fontSize *
                    (axside==='bottom' ? 1 : -0.5);
            };
            labelanchor = function(angle){
                if(!isNumeric(angle) || angle===0 || angle===180) {
                    return 'middle';
                }
                return angle*flipit<0 ? 'end' : 'start';
            };
        }
        else {
            labely = function(d){ return d.dy+d.fontSize/2; };
            labelx = function(d){
                return d.dx + position + (labelStandoff + pad +
                    (Math.abs(ax.tickangle)===90 ? d.fontSize/2 : 0)) *
                    (axside==='right' ? 1 : -1);
            };
            labelanchor = function(angle){
                if(isNumeric(angle) && Math.abs(angle)===90) {
                    return 'middle';
                }
                return axside==='right' ? 'start' : 'end';
            };
        }
        var maxFontSize = 0,
            autoangle = 0,
            labelsReady = [];
        tickLabels.enter().append('g').classed(tcls,1)
            .append('text')
                // only so tex has predictable alignment that we can
                // alter later
                .attr('text-anchor', 'middle')
                .each(function(d){
                    var thisLabel = d3.select(this),
                        newPromise = td._promises.length;
                    thisLabel
                        .call(Plotly.Drawing.setPosition,
                            labelx(d), labely(d))
                        .call(Plotly.Drawing.font,
                            d.font, d.fontSize, d.fontColor)
                        .text(d.text)
                        .call(Plotly.util.convertToTspans);
                    newPromise = td._promises[newPromise];
                    if(newPromise) {
                        // if we have an async label, we'll deal with that
                        // all here so take it out of td._promises and
                        // instead position the label and promise this in
                        // labelsReady
                        labelsReady.push(td._promises.pop().then(function(){
                            positionLabels(thisLabel, ax.tickangle);
                        }));
                    }
                    else {
                        // sync label: just position it now.
                        positionLabels(thisLabel, ax.tickangle);
                    }
                });
        tickLabels.exit().remove();

        tickLabels.each(function(d){
            maxFontSize = Math.max(maxFontSize, d.fontSize);
        });

        function positionLabels(s,angle) {
            s.each(function(d) {
                var anchor = labelanchor(angle);
                var thisLabel = d3.select(this),
                    mathjaxGroup = thisLabel.select('.text-math-group'),
                    transform = transfn(d) +
                        ((isNumeric(angle) && +angle!==0) ?
                        (' rotate('+angle+','+labelx(d)+','+
                            (labely(d)-d.fontSize/2)+')') :
                        '');
                if(mathjaxGroup.empty()) {
                    var txt = thisLabel.select('text').attr({
                        transform: transform,
                        'text-anchor': anchor
                    });

                    if(!txt.empty()) {
                        txt.selectAll('tspan.line').attr({
                            x: txt.attr('x'),
                            y: txt.attr('y')
                        });
                    }
                }
                else {
                    var mjShift =
                        Plotly.Drawing.bBox(mathjaxGroup.node()).width *
                            {end:-0.5, start:0.5}[anchor];
                    mathjaxGroup.attr('transform', transform +
                        (mjShift ? 'translate(' + mjShift + ',0)' : ''));
                }
            });
        }

        // make sure all labels are correctly positioned at their base angle
        // the positionLabels call above is only for newly drawn labels.
        // do this without waiting, using the last calculated angle to
        // minimize flicker, then do it again when we know all labels are
        // there, putting back the prescribed angle to check for overlaps.
        positionLabels(tickLabels,ax._lastangle || ax.tickangle);

        function allLabelsReady(){
            return labelsReady.length && Promise.all(labelsReady);
        }

        function fixLabelOverlaps(){
            positionLabels(tickLabels,ax.tickangle);

            // check for auto-angling if x labels overlap
            // don't auto-angle at all for log axes with
            // base and digit format
            if(axletter==='x' && !isNumeric(ax.tickangle) &&
                    (ax.type!=='log' || String(ax.dtick).charAt(0)!=='D')) {
                var lbbArray = [];
                tickLabels.each(function(d){
                    var s = d3.select(this),
                        thisLabel = s.select('.text-math-group'),
                        x = ax.l2p(d.x);
                    if(thisLabel.empty()) { thisLabel = s.select('text'); }
                    var bb = Plotly.Drawing.bBox(thisLabel.node());

                    lbbArray.push({
                        // ignore about y, just deal with x overlaps
                        top:0,
                        bottom:10,
                        height:10,
                        left: x-bb.width/2,
                        // impose a 2px gap
                        right: x+bb.width/2 + 2,
                        width: bb.width + 2
                    });
                });
                for(i=0; i<lbbArray.length-1; i++) {
                    if(Plotly.Lib.bBoxIntersect(
                            lbbArray[i],lbbArray[i+1])) {
                        // any overlap at all - set 30 degrees
                        autoangle = 30;
                        break;
                    }
                }
                if(autoangle) {
                    var tickspacing = Math.abs(
                            (vals[vals.length-1].x-vals[0].x)*ax._m
                        )/(vals.length-1);
                    if(tickspacing<maxFontSize*2.5) {
                        autoangle = 90;
                    }
                    positionLabels(tickLabels,autoangle);
                }
                ax._lastangle = autoangle;
            }

            // update the axis title
            // (so it can move out of the way if needed)
            // TODO: separate out scoot so we don't need to do
            // a full redraw of the title (modtly relevant for MathJax)
            if(!skipTitle) Plotly.Titles.draw(td, axid + 'title');
            return axid+' done';
        }

        var done = Plotly.Lib.syncOrAsync([
            allLabelsReady,
            fixLabelOverlaps
        ]);
        if(done && done.then) td._promises.push(done);
        return done;
    }

    function traceHasBarsOrFill(trace, subplot) {
        if(trace.visible !== true || trace.xaxis + trace.yaxis !== subplot) return false;
        if(Plotly.Plots.traceIs(trace, 'bar') && trace.orientation === {x: 'h', y: 'v'}[axletter]) return true;
        return trace.fill && trace.fill.charAt(trace.fill.length - 1) === axletter;
    }

    function drawGrid(plotinfo, counteraxis, subplot) {
        var gridcontainer = plotinfo.gridlayer,
            zlcontainer = plotinfo.zerolinelayer,
            gridvals = plotinfo['hidegrid'+axletter]?[]:valsClipped,
            gridpath = 'M0,0'+((axletter==='x') ? 'v' : 'h') +
                counteraxis._length,
            grid = gridcontainer.selectAll('path.'+gcls)
                .data(ax.showgrid===false ? [] : gridvals, datafn);
        grid.enter().append('path').classed(gcls, 1)
            .classed('crisp', 1)
            .attr('d', gridpath)
            .each(function(d) {
                if(ax.zeroline && (ax.type==='linear'||ax.type==='-') &&
                        Math.abs(d.x)<ax.dtick/100) {
                    d3.select(this).remove();
                }
            });
        grid.attr('transform',transfn)
            .call(Plotly.Color.stroke, ax.gridcolor || '#ddd')
            .style('stroke-width', gridWidth+'px');
        grid.exit().remove();

        // zero line
        var hasBarsOrFill = false;
        for(var i = 0; i < td._fullData.length; i++) {
            if(traceHasBarsOrFill(td._fullData[i], subplot)) {
                hasBarsOrFill = true;
                break;
            }
        }
        var showZl = (ax.range[0]*ax.range[1]<=0) && ax.zeroline &&
            (ax.type==='linear' || ax.type==='-') && gridvals.length &&
            (hasBarsOrFill || clipEnds({x:0}) || !ax.showline);

        var zl = zlcontainer.selectAll('path.'+zcls)
            .data(showZl ? [{x:0}] : []);
        zl.enter().append('path').classed(zcls,1).classed('zl',1)
            .classed('crisp',1)
            .attr('d',gridpath);
        zl.attr('transform',transfn)
            .call(Plotly.Color.stroke, ax.zerolinecolor || Plotly.Color.defaultLine)
            .style('stroke-width', zeroLineWidth+'px');
        zl.exit().remove();
    }

    if(independent) {
        drawTicks(ax._axislayer, tickprefix + (ax._pos+pad*ticksign[2]) +
            tickmid + (ticksign[2]*ax.ticklen));
        return drawLabels(ax._axislayer,ax._pos);
    }
    else {
        var alldone = axes.getSubplots(td,ax).map(function(subplot) {
            var plotinfo = fullLayout._plots[subplot];

            if(!fullLayout._hasCartesian) return;

            var container = plotinfo[axletter + 'axislayer'],

                // [bottom or left, top or right, free, main]
                linepositions = ax._linepositions[subplot]||[],
                counteraxis = plotinfo[counterLetter](),
                mainSubplot = counteraxis._id===ax.anchor,
                ticksides = [false, false, false],
                tickpath='';

            // ticks
            if(ax.mirror==='allticks') ticksides = [true, true, false];
            else if(mainSubplot) {
                if(ax.mirror==='ticks') ticksides = [true, true, false];
                else ticksides[sides.indexOf(axside)] = true;
            }
            if(ax.mirrors) {
                for(i=0; i<2; i++) {
                    var thisMirror = ax.mirrors[counteraxis._id+sides[i]];
                    if(thisMirror==='ticks' || thisMirror==='labels') {
                        ticksides[i] = true;
                    }
                }
            }

            // free axis ticks
            if(linepositions[2]!==undefined) ticksides[2] = true;

            ticksides.forEach(function(showside, sidei) {
                var pos = linepositions[sidei],
                    tsign = ticksign[sidei];
                if(showside && isNumeric(pos)) {
                    tickpath += tickprefix + (pos+pad*tsign) +
                        tickmid + (tsign*ax.ticklen);
                }
            });

            drawTicks(container, tickpath);
            drawGrid(plotinfo, counteraxis, subplot);
            return drawLabels(container,linepositions[3]);
        }).filter(function(onedone) { return onedone && onedone.then; });

        return alldone.length ? Promise.all(alldone) : 0;
    }
};

// swap all the presentation attributes of the axes showing these traces
axes.swap = function(gd, traces) {
    var axGroups = makeAxisGroups(gd, traces);

    for(var i = 0; i < axGroups.length; i++) {
        swapAxisGroup(gd, axGroups[i].x, axGroups[i].y);
    }
};

function makeAxisGroups(gd, traces) {
    var groups = [],
        i,
        j;

    for(i = 0; i < traces.length; i++) {
        var groupsi = [],
            xi = gd._fullData[traces[i]].xaxis,
            yi = gd._fullData[traces[i]].yaxis;
        if(!xi || !yi) continue; // not a 2D cartesian trace?

        for(j = 0; j < groups.length; j++) {
            if(groups[j].x.indexOf(xi) !== -1 || groups[j].y.indexOf(yi) !== -1) {
                groupsi.push(j);
            }
        }

        if(!groupsi.length) {
            groups.push({x:[xi], y: [yi]});
            continue;
        }

        var group0 = groups[groupsi[0]],
            groupj;

        if(groupsi.length>1) {
            for(j = 1; j < groupsi.length; j++) {
                groupj = groups[groupsi[j]];
                mergeAxisGroups(group0.x, groupj.x);
                mergeAxisGroups(group0.y, groupj.y);
            }
        }
        mergeAxisGroups(group0.x, [xi]);
        mergeAxisGroups(group0.y, [yi]);
    }

    return groups;
}

function mergeAxisGroups(intoSet, fromSet) {
    for(var i = 0; i < fromSet.length; i++) {
        if(intoSet.indexOf(fromSet[i]) === -1) intoSet.push(fromSet[i]);
    }
}

function swapAxisGroup(gd, xIds, yIds) {
    var i,
        j,
        xFullAxes = [],
        yFullAxes = [],
        layout = gd.layout;

    for(i = 0; i < xIds.length; i++) xFullAxes.push(axes.getFromId(gd, xIds[i]));
    for(i = 0; i < yIds.length; i++) yFullAxes.push(axes.getFromId(gd, yIds[i]));

    var allAxKeys = Object.keys(xFullAxes[0]),
        noSwapAttrs = [
            'anchor', 'domain', 'overlaying', 'position', 'side', 'tickangle'
        ],
        numericTypes = ['linear', 'log'];

    for(i = 0; i < allAxKeys.length; i++) {
        var keyi = allAxKeys[i],
            xVal = xFullAxes[0][keyi],
            yVal = yFullAxes[0][keyi],
            allEqual = true,
            coerceLinearX = false,
            coerceLinearY = false;
        if(keyi.charAt(0) === '_' || typeof xVal === 'function' ||
                noSwapAttrs.indexOf(keyi) !== -1) {
            continue;
        }
        for(j = 1; j < xFullAxes.length && allEqual; j++) {
            var xVali = xFullAxes[j][keyi];
            if(keyi === 'type' && numericTypes.indexOf(xVal) !== -1 &&
                    numericTypes.indexOf(xVali) !== -1 && xVal !== xVali) {
                // type is special - if we find a mixture of linear and log,
                // coerce them all to linear on flipping
                coerceLinearX = true;
            }
            else if(xVali !== xVal) allEqual = false;
        }
        for(j = 1; j < yFullAxes.length && allEqual; j++) {
            var yVali = yFullAxes[j][keyi];
            if(keyi === 'type' && numericTypes.indexOf(yVal) !== -1 &&
                    numericTypes.indexOf(yVali) !== -1 && yVal !== yVali) {
                // type is special - if we find a mixture of linear and log,
                // coerce them all to linear on flipping
                coerceLinearY = true;
            }
            else if(yFullAxes[j][keyi] !== yVal) allEqual = false;
        }
        if(allEqual) {
            if(coerceLinearX) layout[xFullAxes[0]._name].type = 'linear';
            if(coerceLinearY) layout[yFullAxes[0]._name].type = 'linear';
            swapAxisAttrs(layout, keyi, xFullAxes, yFullAxes);
        }
    }

    // now swap x&y for any annotations anchored to these x & y
    for(i = 0; i < gd._fullLayout.annotations.length; i++) {
        var ann = gd._fullLayout.annotations[i];
        if(xIds.indexOf(ann.xref) !== -1 &&
                yIds.indexOf(ann.yref) !== -1) {
            Plotly.Lib.swapAttrs(layout.annotations[i],['?']);
        }
    }
}

function swapAxisAttrs(layout, key, xFullAxes, yFullAxes) {
    // in case the value is the default for either axis,
    // look at the first axis in each list and see if
    // this key's value is undefined
    var np = Plotly.Lib.nestedProperty,
        xVal = np(layout[xFullAxes[0]._name], key).get(),
        yVal = np(layout[yFullAxes[0]._name], key).get(),
        i;
    if(key === 'title') {
        // special handling of placeholder titles
        if(xVal === 'Click to enter X axis title') {
            xVal = 'Click to enter Y axis title';
        }
        if(yVal === 'Click to enter Y axis title') {
            yVal = 'Click to enter X axis title';
        }
    }

    for(i = 0; i < xFullAxes.length; i++) {
        np(layout, xFullAxes[i]._name + '.' + key).set(yVal);
    }
    for(i = 0; i < yFullAxes.length; i++) {
        np(layout, yFullAxes[i]._name + '.' + key).set(xVal);
    }
}

// mod - version of modulus that always restricts to [0,divisor)
// rather than built-in % which gives a negative value for negative v
function mod(v,d){ return ((v%d) + d) % d; }
