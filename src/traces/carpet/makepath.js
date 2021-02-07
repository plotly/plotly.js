'use strict';

module.exports = function makePath(xp, yp, isBicubic) {
    // Prevent d3 errors that would result otherwise:
    if(xp.length === 0) return '';

    var i;
    var path = [];
    var stride = isBicubic ? 3 : 1;
    for(i = 0; i < xp.length; i += stride) {
        path.push(xp[i] + ',' + yp[i]);

        if(isBicubic && i < xp.length - stride) {
            path.push('C');
            path.push([
                xp[i + 1] + ',' + yp[i + 1],
                xp[i + 2] + ',' + yp[i + 2] + ' ',
            ].join(' '));
        }
    }
    return path.join(isBicubic ? '' : 'L');
};
