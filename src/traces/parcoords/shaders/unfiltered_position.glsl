vec2 xyProjection = vec2(1, 1);

#pragma glslify: axisY = require("./y.glsl", mats=mats)

#pragma glslify: export(position)
vec4 position(
        float depth,
        vec2 resolution, vec2 viewBoxPosition, vec2 viewBoxSize,
        mat4 dims[4],
        float signum,
        mat4 dim0A, mat4 dim1A, mat4 dim0B, mat4 dim1B, mat4 dim0C, mat4 dim1C, mat4 dim0D, mat4 dim1D
    ) {

    float x = 0.5 * signum + 0.5;
    float y = axisY(x, dims, dim0A, dim1A, dim0B, dim1B, dim0C, dim1C, dim0D, dim1D);

    vec2 viewBoxXY = viewBoxPosition + viewBoxSize * vec2(x, y);

    return vec4(
        xyProjection * (2.0 * viewBoxXY / resolution - 1.0),
        depth,
        1.0
    );
}
