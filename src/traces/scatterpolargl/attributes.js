'use strict';

// No cliponaxis or hoveron
const { cliponaxis, hoveron, ...scatterPolarAttrs } = require('../scatterpolar/attributes');
const {
    connectgaps,
    line: { color, dash, width },
    fill,
    fillcolor,
    marker,
    textfont,
    textposition
} = require('../scattergl/attributes');

module.exports = {
    ...scatterPolarAttrs,
    connectgaps,
    fill,
    fillcolor,
    line: { color, dash, editType: 'calc', width },
    marker,
    textfont,
    textposition
};
