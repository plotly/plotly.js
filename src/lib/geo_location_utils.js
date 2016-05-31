/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var countryRegex = require('country-regex');
var Lib = require('../lib');


// make list of all country iso3 ids from at runtime
var countryIds = Object.keys(countryRegex);

var locationmodeToIdFinder = {
    'ISO-3': Lib.identity,
    'USA-states': Lib.identity,
    'country names': countryNameToISO3
};

exports.locationToFeature = function(locationmode, location, features) {
    var locationId = getLocationId(locationmode, location);
    var feature;

    for(var i = 0; i < features.length; i++) {
        feature = features[i];

        if(feature.id === locationId) return feature;
    }

    Lib.warn([
        'Location with id', locationId,
        'does not have a matching topojson feature at this resolution.'
    ].join(' '));
};

function getLocationId(locationmode, location) {
    var idFinder = locationmodeToIdFinder[locationmode];
    return idFinder(location);
}

function countryNameToISO3(countryName) {
    var iso3, regex;

    for(var i = 0; i < countryIds.length; i++) {
        iso3 = countryIds[i];
        regex = new RegExp(countryRegex[iso3]);

        if(regex.test(countryName.toLowerCase())) return iso3;
    }

    Lib.warn('Unrecognized country name: ' + countryName + '.');
}
