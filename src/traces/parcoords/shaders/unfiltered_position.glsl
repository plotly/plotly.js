vec2 xyProjection = vec2(1, 1);

#pragma glslify: axisY = require("./y.glsl", mats=mats)

#pragma glslify: export(position)
vec4 position(
        float depth,
        vec2 resolution, vec2 viewBoxPosition, vec2 viewBoxSize,
        mat4 dims[4],
        float signum,
        mat4 dim0A, mat4 dim2A, mat4 dim0B, mat4 dim2B, mat4 dim0C, mat4 dim2C, mat4 dim0D, mat4 dim2D
    ) {

    float x = 0.5 * signum + 0.5;
    float y = axisY(x, dims, dim0A, dim2A, dim0B, dim2B, dim0C, dim2C, dim0D, dim2D);

    vec2 viewBoxXY = viewBoxPosition + viewBoxSize * vec2(x, y);

    return vec4(
        xyProjection * (2.0 * viewBoxXY / resolution - 1.0),
        depth,
        1.0
    );
}
