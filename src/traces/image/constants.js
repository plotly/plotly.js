'use strict';

module.exports = {
    colormodel: {
        // min and max define the numerical range accepted in CSS
        // If z(min|max)Dflt are not defined, z(min|max) will default to min/max
        rgb: {
            min: [0, 0, 0],
            max: [255, 255, 255],
            fmt: function(c) {return c.slice(0, 3);},
            suffix: ['', '', '']
        },
        rgba: {
            min: [0, 0, 0, 0],
            max: [255, 255, 255, 1],
            fmt: function(c) {return c.slice(0, 4);},
            suffix: ['', '', '', '']
        },
        rgba256: {
            colormodel: 'rgba', // because rgba256 is not an accept colormodel in CSS
            zminDflt: [0, 0, 0, 0],
            zmaxDflt: [255, 255, 255, 255],
            min: [0, 0, 0, 0],
            max: [255, 255, 255, 1],
            fmt: function(c) {return c.slice(0, 4);},
            suffix: ['', '', '', '']
        },
        hsl: {
            min: [0, 0, 0],
            max: [360, 100, 100],
            fmt: function(c) {
                var p = c.slice(0, 3);
                p[1] = p[1] + '%';
                p[2] = p[2] + '%';
                return p;
            },
            suffix: ['°', '%', '%']
        },
        hsla: {
            min: [0, 0, 0, 0],
            max: [360, 100, 100, 1],
            fmt: function(c) {
                var p = c.slice(0, 4);
                p[1] = p[1] + '%';
                p[2] = p[2] + '%';
                return p;
            },
            suffix: ['°', '%', '%', '']
        }
    }
};
