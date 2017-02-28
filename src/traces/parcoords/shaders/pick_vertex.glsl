precision highp float;

attribute vec4 p0, p1, p2, p3,
               p4, p5, p6, p7,
               p8, p9, pa, pb,
               pc, pd, pe;

attribute vec4 pf;

uniform mat4 dim1A, dim2A, dim1B, dim2B, dim1C, dim2C, dim1D, dim2D,
             loA, hiA, loB, hiB, loC, hiC, loD, hiD;

uniform vec2 resolution,
             viewBoxPosition,
             viewBoxSize;

uniform sampler2D palette;

uniform vec2 colorClamp;

uniform float scatter;

varying vec4 fragColor;

vec4 zero = vec4(0, 0, 0, 0);
vec4 unit = vec4(1, 1, 1, 1);
vec2 xyProjection = vec2(1, 1);

mat4 mclamp(mat4 m, mat4 lo, mat4 hi) {
    return mat4(clamp(m[0], lo[0], hi[0]),
                clamp(m[1], lo[1], hi[1]),
                clamp(m[2], lo[2], hi[2]),
                clamp(m[3], lo[3], hi[3]));
}

bool mshow(mat4 p, mat4 lo, mat4 hi) {
    return mclamp(p, lo, hi) == p;
}

float val(mat4 p, mat4 v) {
    return dot(matrixCompMult(p, v) * unit, unit);
}

void main() {

    float x = 0.5 * sign(pf[3]) + 0.5;
    float prominence = abs(pf[3]);
    float depth = 1.0 - prominence;

    mat4 pA = mat4(p0, p1, p2, p3);
    mat4 pB = mat4(p4, p5, p6, p7);
    mat4 pC = mat4(p8, p9, pa, pb);
    mat4 pD = mat4(pc, pd, pe, abs(pf));

    float show = float(mshow(pA, loA, hiA) &&
                       mshow(pB, loB, hiB) &&
                       mshow(pC, loC, hiC) &&
                       mshow(pD, loD, hiD));

    vec2 yy = show * vec2(val(pA, dim2A) + val(pB, dim2B) + val(pC, dim2C) + val(pD, dim2D),
                          val(pA, dim1A) + val(pB, dim1B) + val(pC, dim1C) + val(pD, dim1D));

    vec2 dimensionToggle = vec2(x, 1.0 - x);

    vec2 scatterToggle = vec2(scatter, 1.0 - scatter);

    float y = dot(yy, dimensionToggle);
    mat2 xy = mat2(viewBoxSize * yy + dimensionToggle, viewBoxSize * vec2(x, y));

    vec2 viewBoxXY = viewBoxPosition + xy * scatterToggle;

    float depthOrHide = depth + 2.0 * (1.0 - show);

    gl_Position = vec4(
        xyProjection * (2.0 * viewBoxXY / resolution - 1.0),
        depthOrHide,
        1.0
    );

    // pick coloring
    fragColor = vec4(pf.rgb, 1.0);
}
