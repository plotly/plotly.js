precision highp float;

attribute vec4 p0, p1, p2, p3,
               p4, p5, p6, p7,
               p8, p9, pa, pb,
               pc, pd, pe, pf;

uniform mat4 dim0A, dim1A, dim0B, dim1B, dim0C, dim1C, dim0D, dim1D;

uniform vec2 resolution,
             viewBoxPosition,
             viewBoxSize;

uniform sampler2D palette;

uniform vec2 colorClamp;

varying vec4 fragColor;

vec4 unit = vec4(1.0, 1.0, 1.0, 1.0);

float val(mat4 p, mat4 v) {
    return dot(matrixCompMult(p, v) * unit, unit);
}

float axisY(
        float x,
        mat4 d[4],
        mat4 dim0A, mat4 dim1A, mat4 dim0B, mat4 dim1B, mat4 dim0C, mat4 dim1C, mat4 dim0D, mat4 dim1D
    ) {

    float y1 = val(d[0], dim0A) + val(d[1], dim0B) + val(d[2], dim0C) + val(d[3], dim0D);
    float y2 = val(d[0], dim1A) + val(d[1], dim1B) + val(d[2], dim1C) + val(d[3], dim1D);
    return y1 * (1.0 - x) + y2 * x;
}

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
        2.0 * viewBoxXY / resolution - 1.0,
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
