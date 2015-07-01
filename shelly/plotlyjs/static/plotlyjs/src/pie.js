'use strict';

// ---external global dependencies
/* global d3:false */

var pie = module.exports = {},
    Plotly = require('./plotly'),
    isNumeric = require('./isnumeric'),
    tinycolor = require('tinycolor2');

Plotly.Plots.register(pie, 'pie', ['pie']);

pie.attributes = {
    // data
    labels: {type: 'data_array'},
    // equivalent of x0 and dx, if label is missing
    label0: {type: 'number', dflt: 0},
    dlabel: {type: 'number', dflt: 1},

    values: {type: 'data_array'},

    // if color is missing, use default trace color set
    colors: {type: 'data_array'},

    scalegroup: {
        /**
         * if there are multiple pies that should be sized according to
         * their totals, link them by providing a non-empty group id here
         * shared by every trace in the same group
         * see eg:
         * https://www.e-education.psu.edu/natureofgeoinfo/sites/www.e-education.psu.edu.natureofgeoinfo/files/image/hisp_pies.gif
         * (this example involves a map too - may someday be a whole trace type
         * of its own. but the point is the size of the whole pie is important.)
         */
        type: 'string',
        dflt: ''
    },

    // TODO: after this add to restyle lists

    // labels (legend is handled by plots.attributes.showlegend and layout.legend.hiddenslices)
    insideinfo: {
        // text to show in the slices
        mode: {
            type: 'enumerated',
            values: ['label', 'percent', 'value', 'none'],
            dflt: 'percent'
        },
        font: {type: 'font'}
    },
    outsideinfo: {
        // text to show around the outside of the slices
        mode: {
            type: 'enumerated',
            values: ['label', 'percent', 'value', 'none'],
            dflt: 'none'
        },
        font: {type: 'font'}
    },

    // position and shape
    domain: { // TODO: this breaks filehst.utils.DATA_ARRAY_KEYS because we need x and y to be data.
        x: [
            {type: 'number', min: 0, max: 1, dflt: 0},
            {type: 'number', min: 0, max: 1, dflt: 1}
        ],
        y: [
            {type: 'number', min: 0, max: 1, dflt: 0},
            {type: 'number', min: 0, max: 1, dflt: 1}
        ]
    },
    tilt: {
        // degrees to tilt the pie back from straight on
        type: 'number',
        min: 0,
        max: 90,
        dflt: 0
    },
    tiltaxis: {
        // degrees away from straight up to tilt the pie
        // only has an effect if tilt is nonzero
        type: 'number',
        min: -360,
        max: 360,
        dflt: 0
    },
    depth: {
        // "3D" size, as a fraction of radius
        // only has an effect if tilt is nonzero
        type: 'number',
        min: 0,
        max: 10,
        dflt: 0.5
    },
    hole: {
        // fraction of the radius to cut out and make a donut
        type: 'number',
        min: 0,
        max: 1,
        dflt: 0
    },

    // ordering and direction
    sort: {
        // reorder slices from largest to smallest?
        type: 'boolean',
        dflt: true
    },
    direction: {
        /**
         * there are two common conventions, both of which place the first
         * (largest, if sorted) slice with its left edge at 12 o'clock but
         * succeeding slices follow either cw or ccw from there.
         *
         * see http://visage.co/data-visualization-101-pie-charts/
         */
        type: 'enumerated',
        values: ['cw', 'ccw'],
        dflt: 'ccw'
    },
    rotation: {
        // instead of the first slice starting at 12 o'clock, rotate to some other angle
        type: 'number',
        min: -360,
        max: 360,
        dflt: 0
    },

    // style
    line: {
        color: {
            type: 'color',
            arrayOk: true
        },
        width: {
            type: 'number',
            min: 0,
            dflt: 0,
            arrayOk: true
        }
    },
    shading: {
        // how much darker to make the sides than the top,
        // with a 3D effect. We could of course get all
        // fancy with lighting effects, but maybe this is
        // sufficient.
        type: 'number',
        min: 0,
        max: 1,
        dflt: 0.2
    },
    pull: {
        // fraction of larger radius to pull the slices
        // out from the center. This can be a constant
        // to pull all slices apart from each other equally
        // or an array to highlight one or more slices
        type: 'number',
        min: 0,
        max: 1,
        dflt: 0,
        arrayOk: true
    }
};

pie.supplyDefaults = function(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, pie.attributes, attr, dflt);
    }

    var vals = coerce('values');
    if(!Array.isArray(vals) || !vals.length) {
        traceOut.visible = false;
        return;
    }

    var labels = coerce('labels');
    if(!Array.isArray(labels)) { // TODO: what if labels is shorter than vals?
        coerce('label0');
        coerce('dlabel');
    }

    var colors = coerce('colors');
    if(!Array.isArray(colors)) traceOut.colors = []; // later this will get padded with default colors

    coerce('scalegroup');
    // TODO: tilt, depth, and hole all need to be coerced to the same values within a sharegroup
    // and if colors aren't specified we should match these up - potentially even if separate pies
    // are NOT in the same sharegroup

    var insideMode = coerce('insideinfo.mode');
    if(insideMode !== 'none') coerce('insideinfo.font', layout.font);

    var outsideMode = coerce('outsideinfo.mode');
    if(outsideMode !== 'none') coerce('outsideinfo.font', layout.font);

    coerce('domain.x[0]');
    coerce('domain.x[1]');
    coerce('domain.y[0]');
    coerce('domain.y[1]');

    var tilt = coerce('tilt');
    if(tilt) {
        coerce('tiltaxis');
        coerce('depth');
        coerce('shading');
    }

    coerce('hole');

    coerce('sort');
    coerce('direction');
    coerce('rotation');

    var lineWidth = coerce('line.width');
    if(lineWidth) coerce('line.color');

    coerce('pull');
};

pie.supplyLayoutDefaults  = function(layoutIn, layoutOut){
    // clear out stashed label -> color mappings to be used by calc
    layoutOut._piecolormap = {};
    layoutOut._piedefaultcolorcount = 0;
};

pie.calc = function(gd, trace) {
    var vals = trace.values,
        labels = trace.labels,
        cd = [],
        fullLayout = gd._fullLayout,
        colorMap = fullLayout._piecolormap,
        allLabels = {},
        needDefaults = false,
        vTotal = 0,
        i,
        v,
        label,
        color;

    for(i = 0; i < vals.length; i++) {
        v = vals[i];
        if(!isNumeric(v)) continue;
        v = +v;
        if(v < 0) continue;

        label = labels[i];
        if(label === undefined || label === '') label = i;
        label = String(label);
        // only take the first occurrence of any given label.
        // TODO: perhaps (optionally?) sum values for a repeated label?
        if(allLabels[label] === undefined) allLabels[label] = true;
        else continue;

        color = tinycolor(trace.colors[i]);
        if(color.isValid()) {
            color = Plotly.Color.tinyRGB(color);
            colorMap[label] = color;
        }
        // have we seen this label and assigned a color to it in a previous trace?
        else if(colorMap[label]) color = colorMap[label];
        // color needs a default - mark it false, come back after sorting
        else {
            color = false;
            needDefaults = true;
        }

        vTotal += v;

        cd.push({
            v: v,
            label: label,
            color: color,
            i: i
        });
    }

    if(trace.sort) cd.sort(function(a, b) { return b.v - a.v; });

    /**
     * now go back and fill in colors we're still missing
     * this is done after sorting, so we pick defaults
     * in the order slices will be displayed
     */

    if(needDefaults) {
        for(i = 0; i < cd.length; i++) {
            if(cd[i].color === false) {
                colorMap[cd[i].label] = cd[i].color = nextDefaultColor(fullLayout._piedefaultcolorcount);
                fullLayout._piedefaultcolorcount++;
            }
        }
    }

    // include the sum of all values in the first point
    if(cd[0]) cd[0].vTotal = vTotal;

    return cd;
};

/**
 * pick a default color from the main default set, augmented by
 * itself lighter then darker before repeating
 */
var pieDefaultColors;

function nextDefaultColor(index) {
    if(!pieDefaultColors) {
        // generate this default set on demand (but then it gets saved in the module)
        var mainDefaults = Plotly.Color.defaults;
        pieDefaultColors = mainDefaults.slice();
        for(var i = 0; i < mainDefaults.length; i++) {
            pieDefaultColors.push(tinycolor(mainDefaults[i]).lighten(20).toHexString());
        }
        for(i = 0; i < Plotly.Color.defaults.length; i++) {
            pieDefaultColors.push(tinycolor(mainDefaults[i]).darken(20).toHexString());
        }
    }

    return pieDefaultColors[index % pieDefaultColors.length];
}

pie.plot = function(gd, cdpie) {
    var fullLayout = gd._fullLayout;

    scalePies(cdpie, fullLayout._size);

    var pieGroups = fullLayout._pielayer.selectAll('g.trace').data(cdpie);

    pieGroups.enter().append('g')
        .attr({
            'stroke-linejoin': 'round', // TODO: miter might look better but can sometimes cause problems
                                        // maybe miter with a small-ish stroke-miterlimit?
            'class': 'trace'
        });
    pieGroups.exit().remove();
    pieGroups.order();

    pieGroups.each(function(cd) {
        var pieGroup = d3.select(this),
            cd0 = cd[0],
            trace = cd0.trace,
            tiltRads = trace.tilt * Math.PI / 180,
            depthLength = (trace.depth||0) * cd0.r * Math.sin(tiltRads) / 2,
            tiltAxis = trace.tiltaxis || 0,
            tiltAxisRads = tiltAxis * Math.PI / 180,
            depthVector = [
                depthLength * Math.sin(tiltAxisRads),
                depthLength * Math.cos(tiltAxisRads)
            ],
            rSmall = cd0.r * Math.cos(tiltRads);

        var pieParts = pieGroup.selectAll('g.part')
            .data(trace.tilt ? ['top', 'sides'] : ['top']);

        pieParts.enter().append('g').attr('class', function(d) {
            return d + ' part';
        });
        pieParts.exit().remove();
        pieParts.order();

        setCoords(cd);

        pieGroup.selectAll('.top').each(function() {
            var slices = d3.select(this).selectAll('path').data(cd);

            slices.enter().append('path');
            slices.exit().remove();

            slices.attr('d', function(pt) {
                var cx = cd0.cx + depthVector[0],
                    cy = cd0.cy + depthVector[1];

                if(trace.pull) {
                    var pull = (Array.isArray(trace.pull) ? trace.pull[pt.i] : trace.pull) || 0;
                    cx += pull * pt.pxmid[0];
                    cy += pull * pt.pxmid[1];
                }
                var outerArc = 'a' + cd0.r + ',' + rSmall + ' ' + tiltAxis + ' ' + pt.largeArc + ' 1 ' +
                    (pt.px1[0] - pt.px0[0]) + ',' + (pt.px1[1] - pt.px0[1]);

                if(trace.hole) {
                    var hole = trace.hole,
                        rim = 1 - hole;
                    return 'M' + (cx + hole * pt.px1[0]) + ',' + (cy + hole * pt.px1[1]) +
                        'a' + (hole * cd0.r) + ',' + (hole * rSmall) + ' ' + tiltAxis + ' ' +
                            pt.largeArc + ' 0 ' +
                            (hole * (pt.px0[0] - pt.px1[0])) + ',' + (hole * (pt.px0[1] - pt.px1[1])) +
                        'l' + (rim * pt.px0[0]) + ',' + (rim * pt.px0[1]) +
                        outerArc + 'Z';
                }
                return 'M' + cx + ',' + cy + 'l' + pt.px0[0] + ',' + pt.px0[1] +
                    outerArc + 'Z';
            });
        });
    });
};

function scalePies(cdpie, plotSize) {
    var pieBoxWidth,
        pieBoxHeight,
        i,
        j,
        cd0,
        trace,
        tiltAxisRads,
        maxPull,
        scaleGroups = [],
        scaleGroup,
        minPxPerValUnit;

    // first figure out the center and maximum radius for each pie
    for(i = 0; i < cdpie.length; i++) {
        cd0 = cdpie[i][0];
        trace = cd0.trace;
        pieBoxWidth = plotSize.w * (trace.domain.x[1] - trace.domain.x[0]);
        pieBoxHeight = plotSize.h * (trace.domain.y[1] - trace.domain.y[0]);
        tiltAxisRads = trace.tiltaxis * Math.PI / 180;

        maxPull = trace.pull;
        if(Array.isArray(maxPull)) {
            maxPull = 0;
            for(j = 0; i < trace.pull.length; j++) {
                if(trace.pull[j] > maxPull) maxPull = trace.pull[j];
            }
        }

        cd0.r = Math.min(
                pieBoxWidth / maxExtent(trace.tilt, Math.sin(tiltAxisRads), trace.depth),
                pieBoxHeight / maxExtent(trace.tilt, Math.cos(tiltAxisRads), trace.depth)
            ) / (2 + 2 * maxPull);

        cd0.cx = plotSize.l + plotSize.w * (trace.domain.x[1] + trace.domain.x[0])/2;
        cd0.cy = plotSize.t + plotSize.h * (2 - trace.domain.y[1] - trace.domain.y[0])/2;

        if(trace.scalegroup && scaleGroups.indexOf(trace.scalegroup) === -1) {
            scaleGroups.push(trace.scalegroup);
        }
    }

    // Then scale any pies that are grouped
    for(j = 0; j < scaleGroups.length; j++) {
        minPxPerValUnit = Infinity;
        scaleGroup = scaleGroups[j];

        for(i = 0; i < cdpie.length; i++) {
            cd0 = cdpie[i][0];
            if(cd0.trace.scalegroup === scaleGroup) {
                minPxPerValUnit = Math.min(minPxPerValUnit,
                    cd0.r * cd0.r / cd0.vTotal);
            }
        }

        for(i = 0; i < cdpie.length; i++) {
            cd0 = cdpie[i][0];
            if(cd0.trace.scalegroup === scaleGroup) {
                cd0.r = Math.sqrt(minPxPerValUnit * cd0.vTotal);
            }
        }
    }

}

function setCoords(cd) {
    var cd0 = cd[0],
        trace = cd0.trace,
        tilt = trace.tilt,
        tiltAxisRads,
        tiltAxisSin,
        tiltAxisCos,
        tiltRads,
        crossTilt,
        inPlane,
        currentAngle = trace.rotation * Math.PI / 180,
        angleFactor = 2 * Math.PI / cd0.vTotal,
        firstPt = 'px0',
        lastPt = 'px1',
        i,
        cdi,
        currentCoords;

    if(trace.direction === 'ccw') {
        currentAngle += angleFactor * cd0.v;
        angleFactor *= -1;
        firstPt = 'px1';
        lastPt = 'px0';
    }

    if(tilt) {
        tiltRads = tilt * Math.PI / 180;
        tiltAxisRads = trace.tiltaxis * Math.PI / 180;
        crossTilt = Math.sin(tiltAxisRads) * Math.cos(tiltAxisRads);
        inPlane = 1 - Math.cos(tiltRads);
        tiltAxisSin = Math.sin(tiltAxisRads);
        tiltAxisCos = Math.cos(tiltAxisRads);
    }

    function getCoords(angle) {
        var xFlat = cd0.r * Math.sin(angle),
            yFlat = -cd0.r * Math.cos(angle);

        if(!tilt) return [xFlat, yFlat];

        return [
            xFlat * (1 - inPlane * tiltAxisSin * tiltAxisSin) + yFlat * crossTilt * inPlane,
            xFlat * crossTilt * inPlane + yFlat * (1 - inPlane * tiltAxisCos * tiltAxisCos),
            Math.sin(tiltRads) * (yFlat * tiltAxisCos - xFlat * tiltAxisSin)
        ];
    }

    currentCoords = getCoords(currentAngle);

    for(i = 0; i < cd.length; i++) {
        cdi = cd[i];
        cdi[firstPt] = currentCoords;

        if(trace.pull) cdi.pxmid = getCoords(currentAngle + cdi.v / 2);

        currentAngle += angleFactor * cdi.v;
        currentCoords = getCoords(currentAngle);

        cdi[lastPt] = currentCoords;

        cdi.largeArc = (cdi.v > cd0.vTotal / 2) ? 1 : 0;
    }
}

function maxExtent(tilt, tiltAxisFraction, depth) {
    if(!tilt) return 1;
    var sinTilt = Math.sin(tilt * Math.PI / 180);
    return Math.max(0.01, // don't let it go crazy if you tilt the pie totally on its side
        depth * sinTilt * Math.abs(tiltAxisFraction) +
        2 * Math.sqrt(1 - sinTilt * sinTilt * tiltAxisFraction * tiltAxisFraction));
}

pie.style = function(gd) {
    gd._fullLayout._pielayer.selectAll('.trace').each(function(cd) {
        var cd0 = cd[0],
            trace = cd0.trace,
            getLineColor,
            getLineWidth,
            traceSelection = d3.select(this);

        traceSelection.style({opacity: trace.opacity});

        if(Array.isArray(trace.line.color)) {
            getLineColor = function(pt) {
                return Plotly.Color.rgb(trace.line.color[pt.i] || Plotly.Color.defaultLine);
            };
        } else {
            var lineColor = Plotly.Color.rgb(trace.line.color);
            getLineColor = function() { return lineColor; };
        }

        if(Array.isArray(trace.line.width)) {
            getLineWidth = function(pt) {
                return trace.line.width[pt.i] || 0;
            };
        } else {
            var lineWidth = trace.line.width || 0;
            getLineWidth = function() { return lineWidth; };
        }

        traceSelection.selectAll('.top path').each(function(pt) {
            d3.select(this).style({
                stroke: getLineColor(pt),
                'stroke-width': getLineWidth(pt),
                fill: pt.color
            });
        });
    });
};
