'use strict'

// TODO: Something is wrong with the y values?

// Calculate the pixel values from various objects

// {layout} is where the margins are obtained from
// {axis} can be x or y and is used to extract the values for making the
// calculation. If axis is y then d is converted to 1 - d to be consistent with
// how the y axis in Plotly.js works.
// {domain} depends on the application: if we're converting from the paper domain
// to pixels then domain can just be [0,1]. If we're converting from an axis
// domain to pixels, then domain[0] is the start of its domain and domain[1] the
// end (as obtained from layout.xaxis.domain for example).
// {d} Is normalized to domain length, so 0 is the beginning of the domain and 1
// the end, but it can have values beyond this (e.g., -2 is twice the domain
// length in the opposite direction). For the case where you want to convert
// from range to pixels, convert the range to a normalized using the range for
// that axis (e.g., layout.xaxis.range)
function mapToPixelHelper(layout, axis, domain, d) {
    var dim;
    var lower;
    var upper;
    if (axis === 'x') {
        dim = 'width';
        lower = 'l';
        upper = 'r';
    } else if (axis === 'y') {
        dim = 'height';
        lower = 'b';
        upper = 't';
        d = 1 - d;
    } else {
        throw "Bad axis letter: " + axis;
    }
    var plotwidth = layout[dim] - layout.margin[lower] - layout.margin[upper];
    var domwidth = (domain[1] - domain[0]) * plotwidth;
    return layout.margin[lower] + domain[0] * plotwidth + domwidth * d;
}

// axis must be single letter, e.g., x or y
function mapPaperToPixel(layout, axis, d) {
    return mapToPixelHelper(layout,axis,[0,1],d);
}

// Here axis must have the same form as in layout, e.g., xaxis, yaxis2, etc.
function mapDomainToPixel(layout, axis, d) {
    return mapToPixelHelper(layout,axis[0],layout[axis].domain,d);
}

// Here axis must have the same form as in layout, e.g., xaxis, yaxis2, etc.
function mapRangeToPixel(layout, axis, r) {
    var d = (r - layout[axis].range[0]) / (layout[axis].range[1] - layout[axis].range[0]);
    return mapDomainToPixel(layout, axis, d);
}

module.exports = {
mapPaperToPixel: mapPaperToPixel,
mapDomainToPixel: mapDomainToPixel,
mapRangeToPixel: mapRangeToPixel
};
