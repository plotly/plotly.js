precision highp float;

attribute vec4 p01_04, p05_08, p09_12, p13_16,
               p17_20, p21_24, p25_28, p29_32,
               p33_36, p37_40, p41_44, p45_48,
               p49_52, p53_56, p57_60, colors;

uniform mat4 dim0A, dim1A, dim0B, dim1B, dim0C, dim1C, dim0D, dim1D;

uniform vec2 resolution, viewBoxPos, viewBoxSize;
uniform sampler2D palette;

varying vec4 fragColor;

const vec4 ZEROS = vec4(0.0, 0.0, 0.0, 0.0);
const vec4 UNITS = vec4(1.0, 1.0, 1.0, 1.0);

float val(mat4 p, mat4 v) {
    return dot(matrixCompMult(p, v) * UNITS, UNITS);
}

float axisY(float ratio, mat4 A, mat4 B, mat4 C, mat4 D) {
    float y1 = val(A, dim0A) + val(B, dim0B) + val(C, dim0C) + val(D, dim0D);
    float y2 = val(A, dim1A) + val(B, dim1B) + val(C, dim1C) + val(D, dim1D);
    return y1 * (1.0 - ratio) + y2 * ratio;
}

vec4 unfilteredPosition(float v, mat4 A, mat4 B, mat4 C, mat4 D) {
    float x = 0.5 * sign(v) + 0.5;
    float y = axisY(x, A, B, C, D);
    float z = 1.0 - abs(v);

    return vec4(
        2.0 * (vec2(x, y) * viewBoxSize + viewBoxPos) / resolution - 1.0,
        z,
        1.0
    );
}

void main() {
    mat4 A = mat4(p01_04, p05_08, p09_12, p13_16);
    mat4 B = mat4(p17_20, p21_24, p25_28, p29_32);
    mat4 C = mat4(p33_36, p37_40, p41_44, p45_48);
    mat4 D = mat4(p49_52, p53_56, p57_60, ZEROS);

    float v = colors[3];

    gl_Position = unfilteredPosition(v, A, B, C, D);

    fragColor = texture2D(palette, vec2(abs(v), 0.5));
}
