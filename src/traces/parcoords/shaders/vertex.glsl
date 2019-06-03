precision highp float;

attribute vec4 p0, p1, p2, p3,
               p4, p5, p6, p7,
               p8, p9, pa, pb,
               pc, pd, pe, pf;

uniform mat4 dim0A, dim1A, dim0B, dim1B, dim0C, dim1C, dim0D, dim1D,
             loA, hiA, loB, hiB, loC, hiC, loD, hiD;

uniform vec2 resolution, viewBoxPos, viewBoxSize;
uniform sampler2D mask, palette;
uniform float maskHeight;
uniform float isPickLayer;

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

vec4 position(float v, mat4 A, mat4 B, mat4 C, mat4 D) {
    float x = 0.5 * sign(v) + 0.5;
    float y = axisY(x, A, B, C, D);
    float z = 1.0 - abs(v);

    z += 2.0 * float(
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
    mat4 A = mat4(p0, p1, p2, p3);
    mat4 B = mat4(p4, p5, p6, p7);
    mat4 C = mat4(p8, p9, pa, pb);
    mat4 D = mat4(pc, pd, pe, vec4(0.0, 0.0, 0.0, 0.0));

    float v = pf[3];

    gl_Position = position(v, A, B, C, D);

    fragColor = (isPickLayer > 0.0) ? vec4(pf.rgb, 1.0) : texture2D(palette, vec2(abs(v), 0.5));
}
