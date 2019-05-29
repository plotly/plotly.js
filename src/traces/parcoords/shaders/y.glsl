vec4 unit = vec4(1, 1, 1, 1);

float val(mat4 p, mat4 v) {
    return dot(matrixCompMult(p, v) * unit, unit);
}

#pragma glslify: export(axisY)
float axisY(
        float x,
        mat4 d[4],
        mat4 dim0A, mat4 dim2A, mat4 dim0B, mat4 dim2B, mat4 dim0C, mat4 dim2C, mat4 dim0D, mat4 dim2D
    ) {

    float y1 = val(d[0], dim0A) + val(d[1], dim0B) + val(d[2], dim0C) + val(d[3], dim0D);
    float y2 = val(d[0], dim2A) + val(d[1], dim2B) + val(d[2], dim2C) + val(d[3], dim2D);
    return y1 * (1.0 - x) + y2 * x;
}
