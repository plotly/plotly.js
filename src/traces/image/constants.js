/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    colormodel: {
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
