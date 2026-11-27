'use strict';

const Lib = require("../../lib");
const prepareRegl = require('../../lib/prepare_regl');

const scatterglPlot = require('../scattergl/plot');
const sceneUpdate = require('../scattergl/scene_update');
const convert = require('../scattergl/convert');
const TOO_MANY_POINTS = require('../scattergl/constants').TOO_MANY_POINTS;

const reglPrecompiled = {};

const vertexShaderSource = [
    'precision highp float;',
    'attribute vec2 position;',
    'varying vec2 uv;',
    'void main() {',
    '    uv = position;',
    '    gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);',
    '}'
].join('\n');

const fragmentShaderSource = [
    'precision highp float;',
    'uniform sampler2D source;',
    'varying vec2 uv;',
    'void main() {',
    '    gl_FragColor = texture2D(source, uv);',
    '}'
].join('\n');

module.exports = function plot(gd, subplot, moduleCalcData) {
    if (!moduleCalcData.length) return;

    const scene = sceneUpdate(gd, subplot);

    for (const [cd] of moduleCalcData) {
        const trace = cd.trace;
        const stash = cd.t;
        const positions = stash.positions;
        const opts = convert.style(gd, trace);
        const len = trace._length;

        trace._xA = subplot.xaxis;
        trace._yA = subplot.yaxis;

        // re-build x/y for hover/select/zoom
        const x = (stash.x = new Float64Array(len));
        const y = (stash.y = new Float64Array(len));

        const amin = subplot.aaxis.range[0];
        const bmin = subplot.baxis.range[1];
        const cmin = subplot.caxis.range[1];

        for (let i = 0; i < len; i++) {
            const inside = stash.a[i] >= amin && stash.b[i] >= bmin && stash.c[i] >= cmin;

            x[i] = inside ? stash.rawx[i] : NaN;
            y[i] = inside ? stash.rawy[i] : NaN;
        }

        if (opts.marker) {
            opts.marker.positions = opts.markerSel.positions = opts.markerUnsel.positions = positions;

            if (len >= TOO_MANY_POINTS) {
                opts.marker.cluster = stash.tree;
            }

            scene.scatter2d = scene.scatter2d || true;
        }

        if (opts.line) {
            Lib.extendFlat(opts.line, convert.linePositions(gd, trace, positions));

            scene.line2d = scene.line2d || true;
        }

        if (opts.fill) {
            scene.fill2d = scene.fill2d || true;
        }

        if (opts.text) {
            Lib.extendFlat(
                opts.text,
                {positions: positions},
                convert.textPosition(gd, trace, opts.text, opts.marker)
            );
            Lib.extendFlat(
                opts.textSel,
                {positions: positions},
                convert.textPosition(gd, trace, opts.text, opts.markerSel)
            );
            Lib.extendFlat(
                opts.textUnsel,
                {positions: positions},
                convert.textPosition(gd, trace, opts.text, opts.markerUnsel)
            );

            scene.glText = scene.glText || true;
        }

        scene.lineOptions.push(opts.line);
        scene.fillOptions.push(opts.fill);
        scene.markerOptions.push(opts.marker);
        scene.markerSelectedOptions.push(opts.markerSel);
        scene.markerUnselectedOptions.push(opts.markerUnsel);
        scene.textOptions.push(opts.text);
        scene.textSelectedOptions.push(opts.textSel);
        scene.textUnselectedOptions.push(opts.textUnsel);
        scene.selectBatch.push([]);
        scene.unselectBatch.push([]);

        stash._scene = scene;
        stash.index = scene.count++;
    }

    if (!prepareRegl(gd, ['ANGLE_instanced_arrays', 'OES_element_index_uint'], reglPrecompiled)) {
        scene.init();
        return;
    }

    scatterglPlot(gd, subplot, moduleCalcData);

    // create the ternary clipping layer once for the lifetime of scattergl scene
    if (scene.ternaryClip) return;

    // render the shared scattergl layers offscreen, then composite them through a triangle
    const targets = (scene.ternaryClip = gd._fullLayout._glcanvas
        .data()
        .slice(0, 2) // scattergl uses contextLayer and focusLayer
        .map(({ regl }) => {
            const framebuffer = regl.framebuffer({ width: 1, height: 1, depth: false, stencil: false });
            const scope = regl({ framebuffer });
            const composite = regl({
                framebuffer: null, // render to the canvas drawing buffer
                viewport: {
                    x: 0,
                    y: 0,
                    width: regl.context('drawingBufferWidth'),
                    height: regl.context('drawingBufferHeight')
                },
                vert: vertexShaderSource,
                frag: fragmentShaderSource,
                attributes: { position: regl.prop('positions') },
                uniforms: { source: framebuffer },
                count: 3,
                depth: { enable: false },
                blend: { enable: true, func: { src: 'one', dst: 'one minus src alpha' } }
            });

            return { regl, framebuffer, scope, composite };
        }));

    const draw = scene.draw;
    const destroy = scene.destroy;

    scene.draw = () => {
        const layout = gd._fullLayout;

        const left = subplot.x0 / layout.width;
        const right = (subplot.x0 + subplot.w) / layout.width;
        const bottom = 1 - (subplot.y0 + subplot.h) / layout.height;
        const top = 1 - subplot.y0 / layout.height;

        const positions = [
            [left, bottom],
            [right, bottom],
            [(left + right) / 2, top]
        ];

        for (const target of targets) {
            const canvas = target.regl._gl.canvas;

            if (target.framebuffer.width !== canvas.width || target.framebuffer.height !== canvas.height) {
                target.framebuffer.resize(canvas.width, canvas.height);
            }

            target.scope(() => target.regl.clear({ color: [0, 0, 0, 0] }));
        }

        // draw once while both contexts are scoped to their framebuffers
        targets[0].scope(() => targets[1].scope(draw));

        for (const target of targets) {
            target.composite({ positions });
        }
    };

    scene.destroy = () => {
        for (const target of targets) {
            target.framebuffer.destroy();
        }

        destroy();
    };
};

module.exports.reglPrecompiled = reglPrecompiled;
