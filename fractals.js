let iterations = 7;
let power = 10;
let bailout = 50;
let colorIterations = 3;

function setIterations(itr) {
	iterations = itr;
	updateFractalGLSL();
}

function setPower(pow) {
	power = pow;
	updateFractalGLSL();
}

function setBailout(bout) {
	this.bailout = bout;
	updateFractalGLSL();
}

function setColorIterations(colorItr) {
	colorIterations = colorItr;
	updateFractalGLSL();
}

const DEFAULT_FRACTAL_COLOR = 'vec3(orbitTrap.x * 0.2, orbitTrap.y * 0.4, orbitTrap.z * 0.9) * orbitTrap.w + diffuse';
const DEFAULT_FRACTAL_COLOR_BRIGHT = 'vec3(orbitTrap.x * 0.2, orbitTrap.y * 0.4, orbitTrap.z * 0.9) * orbitTrap.w + diffuse + 0.2';

let MANDELBULB_GLSL;
let SPHERE_SPONGE_GLSL;
let MANDELBOX_GLSL;
updateFractalGLSL();

function updateFractalGLSL() {
	MANDELBULB_GLSL = 
`
	vec4 orbitTrap = vec4(MAX_DIST);
	float distanceFunction(vec3 position, bool isLight, int reflectionIndex) {
		position *= mat3(rotateXaxis(PI / 2.0));
		if(!isLight) orbitTrap = vec4(MAX_DIST);
		vec3 z = position;
		float dr = 1.0;
		float r = 0.0;
		for (int i = 0; i < ${iterations} ; i++) {
			r = length(z);
			if (r > ${bailout.toFixed(5)}) 
				break;
			float theta = acos(z.z/r);
			float phi = atan(z.y,z.x);
			dr =  pow( r, ${power.toFixed(5)} - 1.0 ) * ${power.toFixed(5)} * dr + 1.0;
			float zr = pow(r, ${power.toFixed(5)});
			theta = theta * ${power.toFixed(5)};
			phi = phi * ${power.toFixed(5)};
			z = zr * vec3(sin(theta)*cos(phi), sin(phi)*sin(theta), cos(theta));
			z += position;
			if (i < ${colorIterations} && !isLight) 
				orbitTrap = min(orbitTrap, abs(vec4(z.x, z.y, z.z, r*r)));
		}
		return 0.5*log(r)*r/dr;
	}
`;

	SPHERE_SPONGE_GLSL =
`
vec4 orbitTrap = vec4(MAX_DIST);
float distanceFunction(vec3 position, bool isLight, int reflectionIndex) {
	if(!isLight) orbitTrap = vec4(MAX_DIST);
    float scale = 2.0;
    float spongeScale = 2.05;
    float k = scale;
    float d = -MAX_DIST, md = MAX_DIST;
    float d1, r;

    for (int i = 0; i < int(${iterations}); i++) {
        vec3 z = mod(position * k, 4.0) - vec3(0.5 * 4.0);
        r = length(z);
        d1 = (spongeScale - r) / k;
        k *= scale;
        d = max(d, d1);
        if (i < ${colorIterations} && !isLight) {
			md = min(md, d);
            orbitTrap = vec4(md, md, md, r);
		}
    }
    return d;
}
`;

	MANDELBOX_GLSL = 
`
vec4 orbitTrap = vec4(MAX_DIST);
float distanceFunction(vec3 pos, bool isLight, int reflectionIndex) {
    if(!isLight) orbitTrap = vec4(MAX_DIST);
    float scale = 2.8;
    float MR2 = 0.2;
    vec4 scalevec = vec4(scale, scale, scale, abs(scale)) / MR2;
    float C1 = abs(scale - 1.0), C2 = pow(abs(scale), float(1 - ${iterations}));
    vec4 p = vec4(pos.xyz, 1.0), p0 = vec4(pos.xyz, 1.0);

    for (int i = 0; i < ${iterations}; i++) {
        p.xyz = clamp(p.xyz, -1.0, 1.0) * 2.0 - p.xyz;
        float r2 = dot(p.xyz, p.xyz);
        if (i < ${colorIterations} && !isLight) 
			orbitTrap = min(orbitTrap, abs(vec4(p.xyz, r2)));
        p.xyzw *= clamp(max(MR2/r2, MR2), 0.0, 1.0);
        p.xyzw = p * scalevec + p0;
    }
    return ((length(p.xyz) - C1) / p.w) - C2;
}
`;
}