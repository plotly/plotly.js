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
        type: 'boolean',
        dflt: false
    },
    tick0: {
        type: 'number'
    },
    dtick: {
        type: 'number'
    },
    gridcolor: {
        type: 'color',
        dflt: Plotly.Color.lightLine
    },
    gridwidth: {
        type: 'number',
        min: 0,
        dflt: 1
    }
};

GeoAxes.supplyLayoutDefaults = function(geoLayoutIn, geoLayoutOut) {
    var axesNames = params.axesNames;

    var axisIn, axisOut, axisName, rangeDflt, range0, show;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(axisIn, axisOut,
                                 GeoAxes.layoutAttributes, attr, dflt);
    }

    function getRangeDflt(axisName) {
        var scope = geoLayoutOut.scope;

        var projLayout, projType, projRotation, rotateAngle, dfltSpans, halfSpan;

        if(scope === 'world') {
            projLayout = geoLayoutOut.projection;
            projType = projLayout.type;
            projRotation = projLayout.rotation;
            dfltSpans = params[axisName + 'Span'];

            halfSpan = dfltSpans[projType]!==undefined ?
                dfltSpans[projType] / 2 :
                dfltSpans['*'] / 2;
            rotateAngle = axisName==='lonaxis' ?
                projRotation.lon :
                projRotation.lat;

            return [rotateAngle - halfSpan, rotateAngle + halfSpan];
        }
        else return params.scopeDefaults[scope][axisName + 'Range'];
    }

    for(var i = 0; i < axesNames.length; i++) {
        axisName = axesNames[i];
        axisIn = geoLayoutIn[axisName] || {};
        axisOut = {};

        rangeDflt = getRangeDflt(axisName);

        range0 = coerce('range[0]', rangeDflt[0]);
        coerce('range[1]', rangeDflt[1]);

        Plotly.Lib.noneOrAll(axisIn.range, axisOut.range, [0, 1]);

        coerce('tick0', range0);
        coerce('dtick', axisName==='lonaxis' ? 30 : 10);

        show = coerce('showgrid');
        if(show) {
            coerce('gridcolor');
            coerce('gridwidth');
        }

        geoLayoutOut[axisName] = axisOut;
        geoLayoutOut[axisName]._fullRange = rangeDflt;
    }
};
