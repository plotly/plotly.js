precision highp float;

varying vec4 fragColor;

attribute vec4 p01_04, p05_08, p09_12, p13_16,
               p17_20, p21_24, p25_28, p29_32,
               p33_36, p37_40, p41_44, p45_48,
               p49_52, p53_56, p57_60, colors;

uniform mat4 dim0A, dim1A, dim0B, dim1B, dim0C, dim1C, dim0D, dim1D,
             loA, hiA, loB, hiB, loC, hiC, loD, hiD;

uniform vec2 resolution, viewBoxPos, viewBoxSize;
uniform sampler2D mask, palette;
uniform float maskHeight;
uniform float drwLayer; // 0: context, 1: focus, 2: pick
uniform vec4 contextColor;

bool isPick    = (drwLayer > 1.5);
bool isContext = (drwLayer < 0.5);

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

int iMod(int a, int b) {
    return a - b * (a / b);
}

bool fOutside(float p, float lo, float hi) {
    return (lo < hi) && (lo > p || p > hi);
}

bool vOutside(vec4 p, vec4 lo, vec4 hi) {
    return (
        fOutside(p[0], lo[0], hi[0]) ||
        fOutside(p[1], lo[1], hi[1]) ||
        fOutside(p[2], lo[2], hi[2]) ||
        fOutside(p[3], lo[3], hi[3])
    );
}

bool mOutside(mat4 p, mat4 lo, mat4 hi) {
    return (
        vOutside(p[0], lo[0], hi[0]) ||
        vOutside(p[1], lo[1], hi[1]) ||
        vOutside(p[2], lo[2], hi[2]) ||
        vOutside(p[3], lo[3], hi[3])
    );
}

bool outsideBoundingBox(mat4 A, mat4 B, mat4 C, mat4 D) {
    return mOutside(A, loA, hiA) ||
           mOutside(B, loB, hiB) ||
           mOutside(C, loC, hiC) ||
           mOutside(D, loD, hiD);
}

bool outsideRasterMask(mat4 A, mat4 B, mat4 C, mat4 D) {
    mat4 pnts[4];
    pnts[0] = A;
    pnts[1] = B;
    pnts[2] = C;
    pnts[3] = D;

    for(int i = 0; i < 4; ++i) {
        for(int j = 0; j < 4; ++j) {
            for(int k = 0; k < 4; ++k) {
                if(0 == iMod(
                    int(255.0 * texture2D(mask,
                        vec2(
                            (float(i * 2 + j / 2) + 0.5) / 8.0,
                            (pnts[i][j][k] * (maskHeight - 1.0) + 1.0) / maskHeight
                        ))[3]
                    ) / int(pow(2.0, float(iMod(j * 4 + k, 8)))),
                    2
                )) return true;
            }
        }
    }
    return false;
}

vec4 position(bool isContext, float v, mat4 A, mat4 B, mat4 C, mat4 D) {
    float x = 0.5 * sign(v) + 0.5;
    float y = axisY(x, A, B, C, D);
    float z = 1.0 - abs(v);

    z += isContext ? 0.0 : 2.0 * float(
        outsideBoundingBox(A, B, C, D) ||
        outsideRasterMask(A, B, C, D)
    );

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

    gl_Position = position(isContext, v, A, B, C, D);

    fragColor =
        isContext ? vec4(contextColor) :
        isPick ? vec4(colors.rgb, 1.0) : texture2D(palette, vec2(abs(v), 0.5));
}
