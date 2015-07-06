'use strict';

var locationUtils = module.exports = {};

var Plotly = require('../../plotly'),
    countryNameData = require('../raw/country-name_to_iso3.json');

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
    var item, regex;

    for(var i = 0; i < countryNameData.length; i++) {
        item = countryNameData[i];
        regex = new RegExp(item.regex);

        if(regex.test(countryName.toLowerCase())) return item.iso3;
    }

    console.warn('unrecognized country name ' + countryName);
}
