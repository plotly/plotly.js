precision highp float;

attribute vec4 p0, p1, p2, p3,
               p4, p5, p6, p7,
               p8, p9, pa, pb,
               pc, pd, pe, pf;

uniform mat4 dim0A, dim1A, dim0B, dim1B, dim0C, dim1C, dim0D, dim1D;

uniform vec2 resolution, viewBoxPosition, viewBoxSize, colorClamp;
uniform sampler2D palette;

varying vec4 fragColor;

const vec4 unit = vec4(1.0, 1.0, 1.0, 1.0);

float val(mat4 p, mat4 v) {
    return dot(matrixCompMult(p, v) * unit, unit);
}

float axisY(float ratio, mat4 A, mat4 B, mat4 C, mat4 D) {
    float y1 = val(A, dim0A) + val(B, dim0B) + val(C, dim0C) + val(D, dim0D);
    float y2 = val(A, dim1A) + val(B, dim1B) + val(C, dim1C) + val(D, dim1D);
    return y1 * (1.0 - ratio) + y2 * ratio;
}

vec4 unfilteredPosition(float v, mat4 A, mat4 B, mat4 C, mat4 D) {
    float depth = 1.0 - abs(v);

    float x = 0.5 * sign(v) + 0.5;
    float y = axisY(x, A, B, C, D);

    vec2 viewBoxXY = viewBoxPosition + viewBoxSize * vec2(x, y);

    return vec4(
        2.0 * viewBoxXY / resolution - 1.0,
        depth,
        1.0
    );
}

void main() {
    mat4 A = mat4(p0, p1, p2, p3);
    mat4 B = mat4(p4, p5, p6, p7);
    mat4 C = mat4(p8, p9, pa, pb);
    mat4 D = mat4(pc, pd, pe, abs(pf));

    float v = pf[3];

    gl_Position = unfilteredPosition(v, A, B, C, D);

    float clampedColorIndex = clamp((abs(v) - colorClamp[0]) / (colorClamp[1] - colorClamp[0]), 0.0, 1.0);
    fragColor = texture2D(palette, vec2((clampedColorIndex * 255.0 + 0.5) / 256.0, 0.5));
}
