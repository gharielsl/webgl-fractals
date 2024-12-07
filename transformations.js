const TRANSFORMATIONS_GLSL = 
`
mat4 rotateZaxis(float theta) {
    float c = cos(theta);
    float s = sin(theta);

    return mat4(
    vec4(c, -s, 0, 0),
    vec4(s, c, 0, 0),
    vec4(0, 0, 1, 0),
    vec4(0, 0, 0, 1)
    );
}

mat4 rotateYaxis(float theta) {
    float c = cos(theta);
    float s = sin(theta);

    return mat4(
    vec4(c, 0, s, 0),
    vec4(0, 1, 0, 0),
    vec4(-s, 0, c, 0),
    vec4(0, 0, 0, 1)
    );
}

mat4 rotateXaxis(float theta) {
    float c = cos(theta);
    float s = sin(theta);

    return mat4(
    vec4(1, 0, 0, 0),
    vec4(0, c, -s, 0),
    vec4(0,s, c, 0),
    vec4(0, 0, 0, 1)
    );
}

mat4 rotateXYZ(vec3 rotation) {
	return rotateXaxis(rotation.x) * rotateYaxis(rotation.y) * rotateZaxis(rotation.z);
}
`