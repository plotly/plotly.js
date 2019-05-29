vec4 unit = vec4(1, 1, 1, 1);

float val(mat4 p, mat4 v) {
    return dot(matrixCompMult(p, v) * unit, unit);
}

#pragma glslify: export(axisY)
float axisY(
        float x,
        mat4 d[4],
        mat4 dim0A, mat4 dim1A, mat4 dim0B, mat4 dim1B, mat4 dim0C, mat4 dim1C, mat4 dim0D, mat4 dim1D
    ) {

    float y1 = val(d[0], dim0A) + val(d[1], dim0B) + val(d[2], dim0C) + val(d[3], dim0D);
    float y2 = val(d[0], dim1A) + val(d[1], dim1B) + val(d[2], dim1C) + val(d[3], dim1D);
    return y1 * (1.0 - x) + y2 * x;
}
