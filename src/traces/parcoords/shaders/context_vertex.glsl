precision highp float;

attribute vec4 p0, p1, p2, p3,
               p4, p5, p6, p7,
               p8, p9, pa, pb,
               pc, pd, pe, pf;

uniform mat4 dim0A, dim1A, dim0B, dim1B, dim0C, dim1C, dim0D, dim1D;

uniform vec2 resolution, viewBoxPosition, viewBoxSize, colorClamp;
uniform sampler2D palette;

varying vec4 fragColor;

vec4 unit = vec4(1.0, 1.0, 1.0, 1.0);

float val(mat4 p, mat4 v) {
    return dot(matrixCompMult(p, v) * unit, unit);
}

float axisY(
        float x,
        mat4 A, mat4 B, mat4 C, mat4 D,
        mat4 dim0A, mat4 dim1A, mat4 dim0B, mat4 dim1B, mat4 dim0C, mat4 dim1C, mat4 dim0D, mat4 dim1D
    ) {

    float y1 = val(A, dim0A) + val(B, dim0B) + val(C, dim0C) + val(D, dim0D);
    float y2 = val(A, dim1A) + val(B, dim1B) + val(C, dim1C) + val(D, dim1D);
    return y1 * (1.0 - x) + y2 * x;
}

vec4 unfilteredPosition(
        mat4 A, mat4 B, mat4 C, mat4 D,
        float v
    ) {

    float depth = 1.0 - abs(v);

    float x = 0.5 * sign(v) + 0.5;
    float y = axisY(x, A, B, C, D, dim0A, dim1A, dim0B, dim1B, dim0C, dim1C, dim0D, dim1D);

    vec2 viewBoxXY = viewBoxPosition + viewBoxSize * vec2(x, y);

    return vec4(
        2.0 * viewBoxXY,
        depth,
        1.0
    );
}

void main() {

    mat4 A = mat4(p0, p1, p2, p3);
    mat4 B = mat4(p4, p5, p6, p7);
    mat4 C = mat4(p8, p9, pa, pb);
    mat4 D = mat4(pc, pd, pe, abs(pf));

    vec4 pos = unfilteredPosition(
        A, B, C, D,
        pf[3]
    );

    gl_Position = vec4(
        pos.xy / resolution - 1.0,
        pos.zw
    );

    float prominence = abs(pf[3]);
    float clampedColorIndex = clamp((prominence - colorClamp[0]) / (colorClamp[1] - colorClamp[0]), 0.0, 1.0);
    fragColor = texture2D(palette, vec2((clampedColorIndex * 255.0 + 0.5) / 256.0, 0.5));
}
