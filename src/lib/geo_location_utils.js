/**
* Copyright 2012-2019, Plotly, Inc.
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

function countryNameToISO3(countryName) {
    for(var i = 0; i < countryIds.length; i++) {
        var iso3 = countryIds[i];
        var regex = new RegExp(countryRegex[iso3]);

        if(regex.test(countryName.trim().toLowerCase())) return iso3;
    }

    Lib.log('Unrecognized country name: ' + countryName + '.');

    return false;
}

function locationToFeature(locationmode, location, features) {
    if(!location || typeof location !== 'string') return false;

    var locationId = locationmodeToIdFinder[locationmode](location);
    var features2;
    var f, i;

    if(locationId) {
        if(locationmode === 'USA-states') {
            // Filter out features south of the equator
            //
            // This is important as the Natural Earth files
            // include state/provinces from USA, Canada, Australia and Brazil
            // which have some overlay in their two-letter ids. For example,
            // 'WA' is used for both Washington state and Western Australia.
            // As subunits from USA and Canada never conflict, filtering out features
            // south of the equator suffices to fix https://github.com/plotly/plotly.js/issues/3779
            //
            // A better fix would have us add a "governing unit" properties in subunit features
            // in the `sane-topojson` package to avoid conflicts.
            features2 = [];
            for(i = 0; i < features.length; i++) {
                f = features[i];
                if(f.properties && f.properties.ct && f.properties.ct[1] > 0) {
                    features2.push(f);
                }
            }
        } else {
            features2 = features;
        }

        for(i = 0; i < features2.length; i++) {
            f = features2[i];
            if(f.id === locationId) return f;
        }

        Lib.log([
            'Location with id', locationId,
            'does not have a matching topojson feature at this resolution.'
        ].join(' '));
    }

    return false;
}

module.exports = {
    locationToFeature: locationToFeature
};
