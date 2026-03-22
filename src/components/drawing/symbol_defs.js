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
        p: 'M20,0A20,20 0 1,1 0,-20A20,20 0 0,1 20,0Z'
    },
    square: {
        p: 'M20,20H-20V-20H20Z'
    },
    diamond: {
        p: 'M26,0L0,26L-26,0L0,-26Z'
    },
    cross: {
        p: 'M24,8H8V24H-8V8H-24V-8H-8V-24H8V-8H24Z'
    },
    x: {
        p: 'M0,11l11,11l11,-11l-11,-11l11,-11l-11,-11l-11,11l-11,-11l-11,11l11,11l-11,11l11,11Z'
    },
    'triangle-up': {
        p: 'M-23,10H23L0,-20Z'
    },
    'triangle-down': {
        p: 'M-23,-10H23L0,20Z'
    },
    'triangle-left': {
        p: 'M10,-23V23L-20,0Z'
    },
    'triangle-right': {
        p: 'M-10,-23V23L20,0Z'
    },
    'triangle-ne': {
        p: 'M-24,-12H12V24Z'
    },
    'triangle-se': {
        p: 'M12,-24V12H-24Z'
    },
    'triangle-sw': {
        p: 'M24,12H-12V-24Z'
    },
    'triangle-nw': {
        p: 'M-12,24V-12H24Z'
    },
    pentagon: {
        p: 'M19,-6L12,16H-12L-19,-6L0,-20Z'
    },
    hexagon: {
        p: 'M17,-10V10L0,20L-17,10V-10L0,-20Z'
    },
    hexagon2: {
        p: 'M-10,17H10L20,0L10,-17H-10L-20,0Z'
    },
    octagon: {
        p: 'M-8,-18H8L18,-8V8L8,18H-8L-18,8V-8Z'
    },
    star: {
        p: 'M6,-9H27L10,3L16,23L0,11L-16,23L-10,3L-27,-9H-6L0,-28Z'
    },
    hexagram: {
        p: 'M-15,0l-8,-13h15l8,-13l8,13h15l-8,13l8,13h-15l-8,13l-8,-13h-15Z'
    },
    'star-triangle-up': {
        p: 'M-28,16A80,80 0 0 1 28,16A80,80 0 0 1 0,-32A80,80 0 0 1 -28,16Z'
    },
    'star-triangle-down': {
        p: 'M28,-16A80,80 0 0 1 -28,-16A80,80 0 0 1 0,32A80,80 0 0 1 28,-16Z'
    },
    'star-square': {
        p: 'M-22,-22A40,40 0 0 1 -22,22A40,40 0 0 1 22,22A40,40 0 0 1 22,-22A40,40 0 0 1 -22,-22Z'
    },
    'star-diamond': {
        p: 'M-28,0A38,38 0 0 1 0,28A38,38 0 0 1 28,0A38,38 0 0 1 0,-28A38,38 0 0 1 -28,0Z'
    },
    'diamond-tall': {
        p: 'M0,28L14,0L0,-28L-14,0Z'
    },
    'diamond-wide': {
        p: 'M0,14L28,0L0,-14L-28,0Z'
    },
    hourglass: {
        p: 'M20,20H-20L20,-20H-20Z',
        noDot: true
    },
    bowtie: {
        p: 'M20,20V-20L-20,20V-20Z',
        noDot: true
    },
    'circle-cross': {
        p: 'M0,20V-20M20,0H-20M20,0A20,20 0 1,1 0,-20A20,20 0 0,1 20,0Z',
        needLine: true,
        noDot: true
    },
    'circle-x': {
        p: 'M14,14L-14,-14M14,-14L-14,14M20,0A20,20 0 1,1 0,-20A20,20 0 0,1 20,0Z',
        needLine: true,
        noDot: true
    },
    'square-cross': {
        p: 'M0,20V-20M20,0H-20M20,20H-20V-20H20Z',
        needLine: true,
        noDot: true
    },
    'square-x': {
        p: 'M20,20L-20,-20M20,-20L-20,20M20,20H-20V-20H20Z',
        needLine: true,
        noDot: true
    },
    'diamond-cross': {
        p: 'M26,0L0,26L-26,0L0,-26ZM0,-26V26M-26,0H26',
        needLine: true,
        noDot: true
    },
    'diamond-x': {
        p: 'M26,0L0,26L-26,0L0,-26ZM-13,-13L13,13M-13,13L13,-13',
        needLine: true,
        noDot: true
    },
    'cross-thin': {
        p: 'M0,28V-28M28,0H-28',
        needLine: true,
        noDot: true,
        noFill: true
    },
    'x-thin': {
        p: 'M20,20L-20,-20M20,-20L-20,20',
        needLine: true,
        noDot: true,
        noFill: true
    },
    asterisk: {
        p: 'M0,24V-24M24,0H-24M17,17L-17,-17M17,-17L-17,17',
        needLine: true,
        noDot: true,
        noFill: true
    },
    hash: {
        p: 'M10,20V-20M-10,-20V20M20,10H-20M-20,-10H20',
        needLine: true,
        noFill: true
    },
    'y-up': {
        p: 'M-24,16L0,0M24,16L0,0M0,-32L0,0',
        needLine: true,
        noDot: true,
        noFill: true
    },
    'y-down': {
        p: 'M-24,-16L0,0M24,-16L0,0M0,32L0,0',
        needLine: true,
        noDot: true,
        noFill: true
    },
    'y-left': {
        p: 'M16,24L0,0M16,-24L0,0M-32,0L0,0',
        needLine: true,
        noDot: true,
        noFill: true
    },
    'y-right': {
        p: 'M-16,24L0,0M-16,-24L0,0M32,0L0,0',
        needLine: true,
        noDot: true,
        noFill: true
    },
    'line-ew': {
        p: 'M28,0H-28',
        needLine: true,
        noDot: true,
        noFill: true
    },
    'line-ns': {
        p: 'M0,28V-28',
        needLine: true,
        noDot: true,
        noFill: true
    },
    'line-ne': {
        p: 'M20,-20L-20,20',
        needLine: true,
        noDot: true,
        noFill: true
    },
    'line-nw': {
        p: 'M20,20L-20,-20',
        needLine: true,
        noDot: true,
        noFill: true
    },
    'arrow-up': {
        p: 'M0,0L-20,40H20Z',
        backoff: 1,
        noDot: true
    },
    'arrow-down': {
        p: 'M0,0L-20,-40H20Z',
        noDot: true
    },
    'arrow-left': {
        p: 'M0,0L40,-20V20Z',
        noDot: true
    },
    'arrow-right': {
        p: 'M0,0L-40,-20V20Z',
        noDot: true
    },
    'arrow-bar-up': {
        p: 'M-20,0H20M0,0L-20,40H20Z',
        backoff: 1,
        needLine: true,
        noDot: true
    },
    'arrow-bar-down': {
        p: 'M-20,0H20M0,0L-20,-40H20Z',
        needLine: true,
        noDot: true
    },
    'arrow-bar-left': {
        p: 'M0,-20V20M0,0L40,-20V20Z',
        needLine: true,
        noDot: true
    },
    'arrow-bar-right': {
        p: 'M0,-20V20M0,0L-40,-20V20Z',
        needLine: true,
        noDot: true
    },
    arrow: {
        p: 'M0,0L-12,38L12,38Z',
        backoff: 0.9,
        noDot: true
    },
    'arrow-wide': {
        p: 'M0,0L-28,28A40,40 0 0 1 28,28Z',
        backoff: 0.4,
        noDot: true
    }
};
