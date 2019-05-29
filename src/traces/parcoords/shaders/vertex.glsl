precision highp float;

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

precision highp float;

const int bitsPerByte = 8;

vec4 zero = vec4(0.0, 0.0, 0.0, 0.0);
vec4 unit = vec4(1.0, 1.0, 1.0, 1.0);

float val(mat4 p, mat4 v) {
    return dot(matrixCompMult(p, v) * unit, unit);
}

float axisY(
        float ratio,
        mat4 A, mat4 B, mat4 C, mat4 D
    ) {

    float y1 = val(A, dim0A) + val(B, dim0B) + val(C, dim0C) + val(D, dim0D);
    float y2 = val(A, dim1A) + val(B, dim1B) + val(C, dim1C) + val(D, dim1D);
    return y1 * (1.0 - ratio) + y2 * ratio;
}

int iMod(int a, int b) {
    return a - b * (a / b);
}

bool mShow(mat4 p, mat4 lo, mat4 hi) {
    return !(
        clamp(p[0], lo[0], hi[0]) != p[0] ||
        clamp(p[1], lo[1], hi[1]) != p[1] ||
        clamp(p[2], lo[2], hi[2]) != p[2] ||
        clamp(p[3], lo[3], hi[3]) != p[3]
    );
}

bool withinBoundingBox(
        mat4 A, mat4 B, mat4 C, mat4 D
    ) {

    return mShow(A, loA, hiA) &&
           mShow(B, loB, hiB) &&
           mShow(C, loC, hiC) &&
           mShow(D, loD, hiD);
}

bool withinRasterMask(mat4 A, mat4 B, mat4 C, mat4 D) {

    mat4 pnts[4];
    pnts[0] = A;
    pnts[1] = B;
    pnts[2] = C;
    pnts[3] = D;

    bool result = true;
    int bitInByteStepper;
    float valY, valueY, scaleX;
    int hit, bitmask, valX;
    for(int i = 0; i < 4; ++i) {
        for(int j = 0; j < 4; ++j) {
            for(int k = 0; k < 4; ++k) {
                bitInByteStepper = iMod(j * 4 + k, 8);
                valX = i * 2 + j / 2;
                valY = pnts[i][j][k];
                valueY = valY * (maskHeight - 1.0) + 0.5;
                scaleX = (float(valX) + 0.5) / 8.0;
                hit = int(texture2D(mask, vec2(scaleX, (valueY + 0.5) / maskHeight))[3] * 255.0) / int(pow(2.0, float(bitInByteStepper)));
                result = result && iMod(hit, 2) > 0;
            }
        }
    }
    return result;
}

vec4 position(
        float v,
        mat4 A, mat4 B, mat4 C, mat4 D
    ) {

    float depth = 1.0 - abs(v);

    float x = 0.5 * sign(v) + 0.5;
    float y = axisY(x, A, B, C, D);

    float show = float(
        withinBoundingBox(A, B, C, D) &&
        withinRasterMask(A, B, C, D)
    );

    vec2 viewBoxXY = viewBoxPosition + viewBoxSize * vec2(x, y);
    float depthOrHide = depth + 2.0 * (1.0 - show);

    return vec4(
        2.0 * viewBoxXY / resolution - 1.0,
        depthOrHide,
        1.0
    );
}

void main() {

    mat4 A = mat4(p0, p1, p2, p3);
    mat4 B = mat4(p4, p5, p6, p7);
    mat4 C = mat4(p8, p9, pa, pb);
    mat4 D = mat4(pc, pd, pe, abs(pf));

    float v = pf[3];

    gl_Position = position(v, A, B, C, D);

    fragColor = (isPickLayer > 0.0) ? vec4(pf.rgb, 1.0) : texture2D(palette, vec2(
        (clamp((abs(v) - colorClamp[0]) / (colorClamp[1] - colorClamp[0]), 0.0, 1.0) * 255.0 + 0.5) / 256.0, 0.5
    ));
}
