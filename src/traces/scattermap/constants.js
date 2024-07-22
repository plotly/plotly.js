'use strict';

// Must use one of the following fonts as the family, else default to 'Open Sans Regular'
// See https://github.com/openmaptiles/fonts/blob/gh-pages/fontstacks.json
var supportedFonts = [
    'Metropolis Black Italic',
    'Metropolis Black',
    'Metropolis Bold Italic',
    'Metropolis Bold',
    'Metropolis Extra Bold Italic',
    'Metropolis Extra Bold',
    'Metropolis Extra Light Italic',
    'Metropolis Extra Light',
    'Metropolis Light Italic',
    'Metropolis Light',
    'Metropolis Medium Italic',
    'Metropolis Medium',
    'Metropolis Regular Italic',
    'Metropolis Regular',
    'Metropolis Semi Bold Italic',
    'Metropolis Semi Bold',
    'Metropolis Thin Italic',
    'Metropolis Thin',
    'Open Sans Bold Italic',
    'Open Sans Bold',
    'Open Sans Extrabold Italic',
    'Open Sans Extrabold',
    'Open Sans Italic',
    'Open Sans Light Italic',
    'Open Sans Light',
    'Open Sans Regular',
    'Open Sans Semibold Italic',
    'Open Sans Semibold',
    'Klokantech Noto Sans Bold',
    'Klokantech Noto Sans CJK Bold',
    'Klokantech Noto Sans CJK Regular',
    'Klokantech Noto Sans Italic',
    'Klokantech Noto Sans Regular'
];

module.exports = {
    isSupportedFont: function(a) {
        return supportedFonts.indexOf(a) !== -1;
    }
};
