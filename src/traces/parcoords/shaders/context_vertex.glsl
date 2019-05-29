precision highp float;

#pragma glslify: axisY = require("./y.glsl", mats=mats)

attribute vec4 p0, p1, p2, p3,
               p4, p5, p6, p7,
               p8, p9, pa, pb,
               pc, pd, pe;

attribute vec4 pf;

uniform mat4 dim0A, dim1A, dim0B, dim1B, dim0C, dim1C, dim0D, dim1D;

uniform vec2 resolution,
             viewBoxPosition,
             viewBoxSize;

uniform sampler2D palette;

uniform vec2 colorClamp;

varying vec4 fragColor;

vec2 xyProjection = vec2(1.0, 1.0);

vec4 unfilteredPosition(
        vec2 resolution,
        mat4 dims[4],
        float v
    ) {

    float depth = 1.0 - abs(v);

    float x = 0.5 * sign(v) + 0.5;
    float y = axisY(x, dims, dim0A, dim1A, dim0B, dim1B, dim0C, dim1C, dim0D, dim1D);

    vec2 viewBoxXY = viewBoxPosition + viewBoxSize * vec2(x, y);

    return vec4(
        xyProjection * (2.0 * viewBoxXY / resolution - 1.0),
        depth,
        1.0
    );
}

void main() {

    mat4 dims[4];
    dims[0] = mat4(p0, p1, p2, p3);
    dims[1] = mat4(p4, p5, p6, p7);
    dims[2] = mat4(p8, p9, pa, pb);
    dims[3] = mat4(pc, pd, pe, abs(pf));

    gl_Position = unfilteredPosition(
        resolution,
        dims,
        pf[3]
    );

    float prominence = abs(pf[3]);

    float clampedColorIndex = clamp((prominence - colorClamp[0]) / (colorClamp[1] - colorClamp[0]), 0.0, 1.0);
    fragColor = texture2D(palette, vec2((clampedColorIndex * 255.0 + 0.5) / 256.0, 0.5));
}
