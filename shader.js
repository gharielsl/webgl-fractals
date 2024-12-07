let maxDistance = 1000.0;
let maxSteps = 256;
let minDistance = 0.01;
let skyColorFunction = 'vec3(0, 0, 1)';
let colorFunction = 'vec3(diffuse)';
let lightFunction = 'vec3(0, -15, 0)';
let lightDirFunction = 'normalize(lightPos - p)';
let shadows = true;
let reflectness = 0.5;
let reflections = 0;
let extra = '';
let spin = false;
let minDistanceFactor = 0.001;
let dynamicMinDistance = true;
let calcNormal = false;
let shadowStrength = 0.6;

const vertexShaderCode = `
precision highp float;
attribute vec2 position;
void main() {
	gl_Position = vec4(position, 0, 1);
}
`;

let fragmentShaderCode = `
#define PI 3.1415925359
#define MAX_STEPS #MAX_STEPS
#define MAX_DIST #MAX_DISTANCE
#define MIN_DIST #MIN_DISTANCE
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uPosition;
uniform vec3 uRotation;
int steps = 0;
${TRANSFORMATIONS_GLSL}

#DISTANCE_FUNCTION
float sceneDE(vec3 position, bool isLight, int reflectionIndex) {
	#SPIN
	return distanceFunction(position, isLight, reflectionIndex);
}

float minDistance = MIN_DIST;
float lastDistance = 0.0;
float rayMarch(vec3 rayPos, vec3 rayDir, bool isLight, int reflectionIndex) {
	float marchedDistance = 0.0;
	for(int i = 0; i < MAX_STEPS; i++) {
		steps = i;
		vec3 p = rayPos + rayDir * marchedDistance;
		float distance = sceneDE(p, isLight, reflectionIndex);
		if(#DYNAMIC_MIN_DIST && !isLight)
			minDistance = marchedDistance * #MIN_DIST_FACTOR;
		marchedDistance += distance;
		if(marchedDistance > MAX_DIST || distance < minDistance) {
			lastDistance = distance;
			break;
		}
	}
	return marchedDistance;
}

vec3 getNormal(vec3 p, int reflectionIndex) {
	float distance = sceneDE(p, true, reflectionIndex);
	vec2 epsilon = vec2(minDistance, 0);
	vec3 n = distance - vec3(
		sceneDE(p - epsilon.xyy, true, reflectionIndex),
		sceneDE(p - epsilon.yxy, true, reflectionIndex),
		sceneDE(p - epsilon.yyx, true, reflectionIndex));
	return normalize(n);
}

float getLight(vec3 p, int reflectionIndex) { 
	vec3 lightPos = #LIGHT_FUNCTION;
	vec3 lightDir = #LIGHT_DIR_FUNCTION;
	vec3 normal = getNormal(p, reflectionIndex);
	
	float diffuse = dot(normal, lightDir);
	diffuse = clamp(diffuse, 0.0, 1.0);
	
	#SHADOWS
 
	return diffuse;
}

#EXTRA

void main() {
	vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
	
	vec3 cameraPos = uPosition;
	vec3 rayDir = normalize(vec3(uv.x, uv.y, 1.0));
	rayDir = rayDir * mat3(rotateXYZ(uRotation));
	
	vec3 fragColor;
	bool isFirstSky = false;
	
	for(int reflection = 0; reflection < #REFLECTIONS + 1; reflection++) {
		vec3 normal;
		if(reflection > 0 || #CALC_NORMAL) {
			normal = getNormal(cameraPos, reflection);
			if(reflection > 0) rayDir = reflect(rayDir, normal);
		}
		float distance = rayMarch(reflection > 0 ? cameraPos + normal * (1.5 * minDistance) : cameraPos, rayDir, false, reflection);
		cameraPos += rayDir * distance;
		float diffuse = getLight(cameraPos, reflection);
		vec3 color = #COLOR_FUNCTION;
		if(distance > MAX_DIST) {
			color = #SKY_COLOR_FUNCTION;
			if(reflection == 0) isFirstSky = true;
		}
		else if(steps == MAX_STEPS) {
			color = #SKY_COLOR_FUNCTION;
			if(reflection == 0) isFirstSky = true;
		}
		
		if(reflection > 0 && !isFirstSky) fragColor = mix(fragColor, color, #REFLECTNESS);
		else if(reflection > 0);
		else fragColor = color;
	}
	gl_FragColor = vec4(fragColor, 1.0);
}
`;