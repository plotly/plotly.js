'use strict';

var locationUtils = module.exports = {};

var Plotly = require('../../plotly'),
    // an hash object iso3 to regex string
    countryNameData = require('../raw/country-name_to_iso3.json');

// make list of all country iso3 ids from at runtime
var countryIds = Object.keys(countryNameData);

var locationmodeToIdFinder = {
    'ISO-3': Plotly.Lib.identity,
    'USA-states': Plotly.Lib.identity,
    'country names': countryNameToISO3
};

locationUtils.locationToId = function(locationmode, location) {
    var idFinder = locationmodeToIdFinder[locationmode];
    return idFinder(location);
};


function countryNameToISO3(countryName) {
    var iso3, regex;

    for(var i = 0; i < countryIds.length; i++) {
        iso3 = countryIds[i];
        regex = new RegExp(countryNameData[iso3]);

        if(regex.test(countryName.toLowerCase())) return iso3;
    }

    console.warn('unrecognized country name ' + countryName);
}
