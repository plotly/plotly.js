precision highp float;

#pragma glslify: export(position)

const int bitsPerByte = 8;

vec4 zero = vec4(0.0, 0.0, 0.0, 0.0);
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

int mod2(int a) {
    return a - 2 * (a / 2);
}

int mod8(int a) {
    return a - 8 * (a / 8);
}

mat4 mclamp(mat4 m, mat4 lo, mat4 hi) {
    return mat4(
        clamp(m[0], lo[0], hi[0]),
        clamp(m[1], lo[1], hi[1]),
        clamp(m[2], lo[2], hi[2]),
        clamp(m[3], lo[3], hi[3])
    );
}

bool mshow(mat4 p, mat4 lo, mat4 hi) {
    return mclamp(p, lo, hi) == p;
}

bool withinBoundingBox(
        mat4 A, mat4 B, mat4 C, mat4 D,
        mat4 loA, mat4 hiA, mat4 loB, mat4 hiB, mat4 loC, mat4 hiC, mat4 loD, mat4 hiD
    ) {

    return mshow(A, loA, hiA) &&
           mshow(B, loB, hiB) &&
           mshow(C, loC, hiC) &&
           mshow(D, loD, hiD);
}

bool withinRasterMask(mat4 A, mat4 B, mat4 C, mat4 D, sampler2D mask, float height) {

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
                bitInByteStepper = mod8(j * 4 + k);
                valX = i * 2 + j / 2;
                valY = pnts[i][j][k];
                valueY = valY * (height - 1.0) + 0.5;
                scaleX = (float(valX) + 0.5) / 8.0;
                hit = int(texture2D(mask, vec2(scaleX, (valueY + 0.5) / height))[3] * 255.0) / int(pow(2.0, float(bitInByteStepper)));
                result = result && mod2(hit) == 1;
            }
        }
    }
    return result;
}

vec4 position(
        mat4 A, mat4 B, mat4 C, mat4 D,
        float v,

        mat4 dim0A, mat4 dim1A, mat4 dim0B, mat4 dim1B, mat4 dim0C, mat4 dim1C, mat4 dim0D, mat4 dim1D,
        mat4 loA, mat4 hiA, mat4 loB, mat4 hiB, mat4 loC, mat4 hiC, mat4 loD, mat4 hiD,
        vec2 viewBoxPosition, vec2 viewBoxSize,
        sampler2D mask, float maskHeight
    ) {

    float depth = 1.0 - abs(v);

    float x = 0.5 * sign(v) + 0.5;
    float y = axisY(x, A, B, C, D, dim0A, dim1A, dim0B, dim1B, dim0C, dim1C, dim0D, dim1D);

    float show = float(
        withinBoundingBox(A, B, C, D, loA, hiA, loB, hiB, loC, hiC, loD, hiD) &&
        withinRasterMask(A, B, C, D, mask, maskHeight)
    );

    vec2 viewBoxXY = viewBoxPosition + viewBoxSize * vec2(x, y);
    float depthOrHide = depth + 2.0 * (1.0 - show);

    return vec4(
        2.0 * viewBoxXY,
        depthOrHide,
        1.0
    );
}
