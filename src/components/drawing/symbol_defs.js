'use strict';

/** Marker symbol definitions
 * users can specify markers either by number or name
 * add 100 (or '-open') and you get an open marker
 *  open markers have no fill and use line color as the stroke color
 * add 200 (or '-dot') and you get a dot in the middle
 * add both and you get both
 *
 * Each symbol has a `p` property: the SVG path string for r=20, centered at origin.
 * All coordinates are integers.
 */

module.exports = {
    circle: {
        n: 0,
        p: 'M20,0A20,20 0 1,1 0,-20A20,20 0 0,1 20,0Z'
    },
    square: {
        n: 1,
        p: 'M20,20H-20V-20H20Z'
    },
    diamond: {
        n: 2,
        p: 'M26,0L0,26L-26,0L0,-26Z'
    },
    cross: {
        n: 3,
        p: 'M24,8H8V24H-8V8H-24V-8H-8V-24H8V-8H24Z'
    },
    x: {
        n: 4,
        p: 'M0,11l11,11l11,-11l-11,-11l11,-11l-11,-11l-11,11l-11,-11l-11,11l11,11l-11,11l11,11Z'
    },
    'triangle-up': {
        n: 5,
        p: 'M-23,10H23L0,-20Z'
    },
    'triangle-down': {
        n: 6,
        p: 'M-23,-10H23L0,20Z'
    },
    'triangle-left': {
        n: 7,
        p: 'M10,-23V23L-20,0Z'
    },
    'triangle-right': {
        n: 8,
        p: 'M-10,-23V23L20,0Z'
    },
    'triangle-ne': {
        n: 9,
        p: 'M-24,-12H12V24Z'
    },
    'triangle-se': {
        n: 10,
        p: 'M12,-24V12H-24Z'
    },
    'triangle-sw': {
        n: 11,
        p: 'M24,12H-12V-24Z'
    },
    'triangle-nw': {
        n: 12,
        p: 'M-12,24V-12H24Z'
    },
    pentagon: {
        n: 13,
        p: 'M19,-6L12,16H-12L-19,-6L0,-20Z'
    },
    hexagon: {
        n: 14,
        p: 'M17,-10V10L0,20L-17,10V-10L0,-20Z'
    },
    hexagon2: {
        n: 15,
        p: 'M-10,17H10L20,0L10,-17H-10L-20,0Z'
    },
    octagon: {
        n: 16,
        p: 'M-8,-18H8L18,-8V8L8,18H-8L-18,8V-8Z'
    },
    star: {
        n: 17,
        p: 'M6,-9H27L10,3L16,23L0,11L-16,23L-10,3L-27,-9H-6L0,-28Z'
    },
    hexagram: {
        n: 18,
        p: 'M-15,0l-8,-13h15l8,-13l8,13h15l-8,13l8,13h-15l-8,13l-8,-13h-15Z'
    },
    'star-triangle-up': {
        n: 19,
        p: 'M-28,16A80,80 0 0 1 28,16A80,80 0 0 1 0,-32A80,80 0 0 1 -28,16Z'
    },
    'star-triangle-down': {
        n: 20,
        p: 'M28,-16A80,80 0 0 1 -28,-16A80,80 0 0 1 0,32A80,80 0 0 1 28,-16Z'
    },
    'star-square': {
        n: 21,
        p: 'M-22,-22A40,40 0 0 1 -22,22A40,40 0 0 1 22,22A40,40 0 0 1 22,-22A40,40 0 0 1 -22,-22Z'
    },
    'star-diamond': {
        n: 22,
        p: 'M-28,0A38,38 0 0 1 0,28A38,38 0 0 1 28,0A38,38 0 0 1 0,-28A38,38 0 0 1 -28,0Z'
    },
    'diamond-tall': {
        n: 23,
        p: 'M0,28L14,0L0,-28L-14,0Z'
    },
    'diamond-wide': {
        n: 24,
        p: 'M0,14L28,0L0,-14L-28,0Z'
    },
    hourglass: {
        n: 25,
        p: 'M20,20H-20L20,-20H-20Z',
        noDot: true
    },
    bowtie: {
        n: 26,
        p: 'M20,20V-20L-20,20V-20Z',
        noDot: true
    },
    'circle-cross': {
        n: 27,
        p: 'M0,20V-20M20,0H-20M20,0A20,20 0 1,1 0,-20A20,20 0 0,1 20,0Z',
        needLine: true,
        noDot: true
    },
    'circle-x': {
        n: 28,
        p: 'M14,14L-14,-14M14,-14L-14,14M20,0A20,20 0 1,1 0,-20A20,20 0 0,1 20,0Z',
        needLine: true,
        noDot: true
    },
    'square-cross': {
        n: 29,
        p: 'M0,20V-20M20,0H-20M20,20H-20V-20H20Z',
        needLine: true,
        noDot: true
    },
    'square-x': {
        n: 30,
        p: 'M20,20L-20,-20M20,-20L-20,20M20,20H-20V-20H20Z',
        needLine: true,
        noDot: true
    },
    'diamond-cross': {
        n: 31,
        p: 'M26,0L0,26L-26,0L0,-26ZM0,-26V26M-26,0H26',
        needLine: true,
        noDot: true
    },
    'diamond-x': {
        n: 32,
        p: 'M26,0L0,26L-26,0L0,-26ZM-13,-13L13,13M-13,13L13,-13',
        needLine: true,
        noDot: true
    },
    'cross-thin': {
        n: 33,
        p: 'M0,28V-28M28,0H-28',
        needLine: true,
        noDot: true,
        noFill: true
    },
    'x-thin': {
        n: 34,
        p: 'M20,20L-20,-20M20,-20L-20,20',
        needLine: true,
        noDot: true,
        noFill: true
    },
    asterisk: {
        n: 35,
        p: 'M0,24V-24M24,0H-24M17,17L-17,-17M17,-17L-17,17',
        needLine: true,
        noDot: true,
        noFill: true
    },
    hash: {
        n: 36,
        p: 'M10,20V-20M-10,-20V20M20,10H-20M-20,-10H20',
        needLine: true,
        noFill: true
    },
    'y-up': {
        n: 37,
        p: 'M-24,16L0,0M24,16L0,0M0,-32L0,0',
        needLine: true,
        noDot: true,
        noFill: true
    },
    'y-down': {
        n: 38,
        p: 'M-24,-16L0,0M24,-16L0,0M0,32L0,0',
        needLine: true,
        noDot: true,
        noFill: true
    },
    'y-left': {
        n: 39,
        p: 'M16,24L0,0M16,-24L0,0M-32,0L0,0',
        needLine: true,
        noDot: true,
        noFill: true
    },
    'y-right': {
        n: 40,
        p: 'M-16,24L0,0M-16,-24L0,0M32,0L0,0',
        needLine: true,
        noDot: true,
        noFill: true
    },
    'line-ew': {
        n: 41,
        p: 'M28,0H-28',
        needLine: true,
        noDot: true,
        noFill: true
    },
    'line-ns': {
        n: 42,
        p: 'M0,28V-28',
        needLine: true,
        noDot: true,
        noFill: true
    },
    'line-ne': {
        n: 43,
        p: 'M20,-20L-20,20',
        needLine: true,
        noDot: true,
        noFill: true
    },
    'line-nw': {
        n: 44,
        p: 'M20,20L-20,-20',
        needLine: true,
        noDot: true,
        noFill: true
    },
    'arrow-up': {
        n: 45,
        p: 'M0,0L-20,40H20Z',
        backoff: 1,
        noDot: true
    },
    'arrow-down': {
        n: 46,
        p: 'M0,0L-20,-40H20Z',
        noDot: true
    },
    'arrow-left': {
        n: 47,
        p: 'M0,0L40,-20V20Z',
        noDot: true
    },
    'arrow-right': {
        n: 48,
        p: 'M0,0L-40,-20V20Z',
        noDot: true
    },
    'arrow-bar-up': {
        n: 49,
        p: 'M-20,0H20M0,0L-20,40H20Z',
        backoff: 1,
        needLine: true,
        noDot: true
    },
    'arrow-bar-down': {
        n: 50,
        p: 'M-20,0H20M0,0L-20,-40H20Z',
        needLine: true,
        noDot: true
    },
    'arrow-bar-left': {
        n: 51,
        p: 'M0,-20V20M0,0L40,-20V20Z',
        needLine: true,
        noDot: true
    },
    'arrow-bar-right': {
        n: 52,
        p: 'M0,-20V20M0,0L-40,-20V20Z',
        needLine: true,
        noDot: true
    },
    arrow: {
        n: 53,
        p: 'M0,0L-12,38L12,38Z',
        backoff: 0.9,
        noDot: true
    },
    'arrow-wide': {
        n: 54,
        p: 'M0,0L-28,28A40,40 0 0 1 28,28Z',
        backoff: 0.4,
        noDot: true
    }
};
