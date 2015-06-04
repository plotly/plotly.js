'use strict';

var Plotly = require('../../plotly'),
    params = require('../lib/params');

var GeoAxes = module.exports = {};

GeoAxes.layoutAttributes = {
    range: [
        {type: 'number'},
        {type: 'number'}
    ],
    showgrid: {
        type: 'boolean'
    },
    tick0: {
        type: 'number'
    },
    dtick: {
        type: 'number'
    },
    gridcolor: {
        type: 'color',
        dftl: Plotly.Color.defaultLine
    },
    gridwidth: {
        type: 'number',
        min: 0,
        dflt: 1
    }
};

GeoAxes.supplyLayoutDefaults = function(geoLayoutIn, geoLayoutOut) {
    var axesNames = params.axesNames;

    var axisIn, axisOut, axisName, isLonAxis, rangeDflt, range0;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(axisIn, axisOut,
                                 GeoAxes.layoutAttributes, attr, dflt);
    }

    function getRangeDflt(axisName) {
        var scope = geoLayoutOut.scope;

        var projType, projRotate, rotateInd, dfltSpans, halfSpan;

        if(scope === 'world') {
            projType = geoLayoutOut.projection.type;
            projRotate = geoLayoutOut.projection.rotate;
            rotateInd = {lonaxis: 0, lataxis: 1}[axisName];
            dfltSpans = params[axisName + 'Span'];
            halfSpan = dfltSpans[projType]!==undefined ?
                dfltSpans[projType] / 2 :
                dfltSpans['*'] /2;

            return [projRotate[rotateInd] - halfSpan,
                    projRotate[rotateInd] + halfSpan];
        }
        else return params.scopeDefaults[scope][axisName + 'Range'];
    }

    for(var i = 0; i < axesNames.length; i++) {
        axisName = axesNames[i];
        axisIn = geoLayoutIn[axisName] || {};
        axisOut = {};

        isLonAxis = axisName==='lonaxis';
        rangeDflt = getRangeDflt(axisName);

        range0 = coerce('range[0]', rangeDflt[0]);
        coerce('range[1]', rangeDflt[1]);
        Plotly.Lib.noneOrAll(axisIn.range, axisOut.range, [0, 1]);

        coerce('showgrid', isLonAxis);
        coerce('tick0', range0);
        coerce('dtick', isLonAxis ? 30 : 10);
        coerce('gridcolor');
        coerce('gridwidth');

        geoLayoutOut[axisName] = axisOut;
        geoLayoutOut[axisName]._fullRange = rangeDflt;
    }
};
