precision highp float;

#pragma glslify: position = require("./position.glsl")

attribute vec4 p0, p1, p2, p3,
               p4, p5, p6, p7,
               p8, p9, pa, pb,
               pc, pd, pe, pf;

uniform mat4 dim0A, dim1A, dim0B, dim1B, dim0C, dim1C, dim0D, dim1D,
             loA, hiA, loB, hiB, loC, hiC, loD, hiD;

uniform vec2 resolution, viewBoxPosition, viewBoxSize, colorClamp;
uniform sampler2D mask, palette;
uniform float maskHeight;
uniform float isPickLayer;

varying vec4 fragColor;

void main() {

    mat4 A = mat4(p0, p1, p2, p3);
    mat4 B = mat4(p4, p5, p6, p7);
    mat4 C = mat4(p8, p9, pa, pb);
    mat4 D = mat4(pc, pd, pe, abs(pf));

    float v = pf[3];

    vec4 pos = position(
        v,
        A, B, C, D,

        dim0A, dim1A, dim0B, dim1B, dim0C, dim1C, dim0D, dim1D,
        loA, hiA, loB, hiB, loC, hiC, loD, hiD,
        viewBoxPosition, viewBoxSize,
        mask, maskHeight
    );

    gl_Position = vec4(
        pos.xy / resolution - 1.0,
        pos.zw
    );

    fragColor = (isPickLayer > 0.0) ? vec4(pf.rgb, 1.0) : texture2D(palette, vec2(
        (clamp((abs(v) - colorClamp[0]) / (colorClamp[1] - colorClamp[0]), 0.0, 1.0) * 255.0 + 0.5) / 256.0, 0.5
    ));
}
