/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/**
 * centerx is a center of scaling tuned for maximum scalability of
 * the arrowhead ie throughout mag=0.3..3 the head is joined smoothly
 * to the line, but the endpoint moves.
 * backoff is the distance to move the arrowhead, and the end of the
 * line, in order to end at the right place
 *
 * TODO: option to have the pointed-to  point a little in front of the
 * end of the line, as people tend to want a bit of a gap there...
 */

module.exports = [
    // no arrow
    '',
    // wide with flat back
    {
        path: 'M-2.4,-3V3L0.6,0Z',
        backoff: 0.6
    },
    // narrower with flat back
    {
        path: 'M-3.7,-2.5V2.5L1.3,0Z',
        backoff: 1.3
    },
    // barbed
    {
        path: 'M-4.45,-3L-1.65,-0.2V0.2L-4.45,3L1.55,0Z',
        backoff: 1.55
    },
    // wide line-drawn
    {
        path: 'M-2.2,-2.2L-0.2,-0.2V0.2L-2.2,2.2L-1.4,3L1.6,0L-1.4,-3Z',
        backoff: 1.6
    },
    // narrower line-drawn
    {
        path: 'M-4.4,-2.1L-0.6,-0.2V0.2L-4.4,2.1L-4,3L2,0L-4,-3Z',
        backoff: 2
    },
    // circle
    {
        path: 'M2,0A2,2 0 1,1 0,-2A2,2 0 0,1 2,0Z',
        backoff: 0
    },
    // square
    {
        path: 'M2,2V-2H-2V2Z',
        backoff: 0
    }
];
