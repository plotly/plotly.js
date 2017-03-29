/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../../lib');
var constants = require('../constants');
var axisAttributes = require('./axis_attributes');


module.exports = function supplyGeoAxisLayoutDefaults(geoLayoutIn, geoLayoutOut) {
    var axesNames = constants.axesNames;

    var axisIn, axisOut;

    function coerce(attr, dflt) {
        return Lib.coerce(axisIn, axisOut, axisAttributes, attr, dflt);
    }

    function getRangeDflt(axisName) {
        var scope = geoLayoutOut.scope;

        var projLayout, projType, projRotation, rotateAngle, dfltSpans, halfSpan;

        if(scope === 'world') {
            projLayout = geoLayoutOut.projection;
            projType = projLayout.type;
            projRotation = projLayout.rotation;
            dfltSpans = constants[axisName + 'Span'];

            halfSpan = dfltSpans[projType] !== undefined ?
                dfltSpans[projType] / 2 :
                dfltSpans['*'] / 2;
            rotateAngle = axisName === 'lonaxis' ?
                projRotation.lon :
                projRotation.lat;

            return [rotateAngle - halfSpan, rotateAngle + halfSpan];
        }
        else return constants.scopeDefaults[scope][axisName + 'Range'];
    }

    for(var i = 0; i < axesNames.length; i++) {
        var axisName = axesNames[i];
        axisIn = geoLayoutIn[axisName] || {};
        axisOut = {};

        var rangeDflt = getRangeDflt(axisName);

        var range = coerce('range', rangeDflt);

        Lib.noneOrAll(axisIn.range, axisOut.range, [0, 1]);

        coerce('tick0', range[0]);
        coerce('dtick', axisName === 'lonaxis' ? 30 : 10);

        var show = coerce('showgrid');
        if(show) {
            coerce('gridcolor');
            coerce('gridwidth');
        }

        geoLayoutOut[axisName] = axisOut;
        geoLayoutOut[axisName]._fullRange = rangeDflt;
    }
};
