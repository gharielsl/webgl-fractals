let gl, canvas;
let uPosition, uTime, uResolution, uRotation;
let cameraPosition = {x: 0, y: 0, z: -3.5};
let cameraRotation = {x: 0, y: 0, z: 0};
let mouseMoveEvent, isMousePressed;
let moveSpeed = 0.01, lookSpeed = 0.25;
let moveOnlyWhenMouseInside = true;
let mouseInside = false;
let moving = false;
let previewScale = 4;
let mouseWheelFactor = 1.5;
let pauseWhenNotMoving = true;
let canvasStartDimention = {};
let doEveryFrame = function(){};

const keyDown = e => {
	if(moveOnlyWhenMouseInside && !mouseInside) return;
	setMoving();
	keyPress(e);
}
const keyUp = e => keyRelease(e);
const mouseWheel = e => {
	let delta = e.deltaY / 40.0;
	if(delta < 0) moveSpeed *= mouseWheelFactor;
	else moveSpeed /= mouseWheelFactor;
};
const mouseMove = e => mouseMoveEvent = e;
const mouseUp = e => isMousePressed = false;
const mouseDown = e => isMousePressed = true;
const mouseEnter = () => mouseInside = true;
const mouseOut = () => mouseInside = false;

let program;
let vao;
let lastDf;

function compile(distanceFunction) {
	program = null;
	vao = null;
	setMoving();
	if (!distanceFunction) {
		distanceFunction = lastDf;
	} else {
		lastDf = distanceFunction;
	}
	let thisFragmentShaderCode = fragmentShaderCode;
	thisFragmentShaderCode = thisFragmentShaderCode.replace(/#DISTANCE_FUNCTION/g, distanceFunction);
	thisFragmentShaderCode = thisFragmentShaderCode.replace(/#COLOR_FUNCTION/g, colorFunction);
	thisFragmentShaderCode = thisFragmentShaderCode.replace(/#SKY_COLOR_FUNCTION/g, skyColorFunction);
	thisFragmentShaderCode = thisFragmentShaderCode.replace(/#MAX_DISTANCE/g, maxDistance.toFixed(8));
	thisFragmentShaderCode = thisFragmentShaderCode.replace(/#MIN_DISTANCE/g, minDistance.toFixed(8));
	thisFragmentShaderCode = thisFragmentShaderCode.replace(/#MAX_STEPS/g, maxSteps);
	thisFragmentShaderCode = thisFragmentShaderCode.replace(/#LIGHT_FUNCTION/g, lightFunction);
	thisFragmentShaderCode = thisFragmentShaderCode.replace(/#LIGHT_DIR_FUNCTION/g, lightDirFunction);
	thisFragmentShaderCode = thisFragmentShaderCode.replace(/#REFLECTNESS/g, reflectness.toFixed(8));
	thisFragmentShaderCode = thisFragmentShaderCode.replace(/#REFLECTIONS/g, reflections);
	thisFragmentShaderCode = thisFragmentShaderCode.replace(/#EXTRA/g, extra);
	thisFragmentShaderCode = thisFragmentShaderCode.replace(/#MIN_DIST_FACTOR/g, minDistanceFactor.toFixed(8));
	thisFragmentShaderCode = thisFragmentShaderCode.replace(/#DYNAMIC_MIN_DIST/g, dynamicMinDistance);
	thisFragmentShaderCode = thisFragmentShaderCode.replace(/#CALC_NORMAL/g, calcNormal);
	thisFragmentShaderCode = thisFragmentShaderCode.replace(/#SPIN/g, 
			spin ? 'position *= mat3(rotateYaxis(mod(uTime / 2.0, 2.0 * PI)));' : '');
	thisFragmentShaderCode = thisFragmentShaderCode.replace(/#SHADOWS/g, 
						!shadows ? '' : `
						float d = rayMarch(p + normal * minDistance * 2.0, lightDir, true, reflectionIndex);
						if(d < length(lightPos-p)) diffuse *= ${1 - shadowStrength};
						`);
	
	canvas = document.getElementById('rm-canvas');
	gl = canvas.getContext('webgl');
	if(!gl)
		gl = canvas.getContext('experimental-webgl');
	
	canvasStartDimention.x = canvas.width;
	canvasStartDimention.y = canvas.height;

	let vertexShader = gl.createShader(gl.VERTEX_SHADER);
	let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
		
	gl.shaderSource(vertexShader, vertexShaderCode);
	gl.shaderSource(fragmentShader, thisFragmentShaderCode);
		
	gl.compileShader(vertexShader);
	if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
		throw ("compilation error: " + gl.getShaderInfoLog(vertexShader));
	gl.compileShader(fragmentShader);
	if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		return alert("compilation error: " + gl.getShaderInfoLog(fragmentShader));
	}
	program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
		
	gl.linkProgram(program);
	if(!gl.getProgramParameter(program, gl.LINK_STATUS))
		throw ("linking error: " + gl.getProgramInfoLog(program));
		
	gl.validateProgram(program);
	if(!gl.getProgramParameter(program, gl.VALIDATE_STATUS))
		throw ("validation error: " + gl.getProgramInfoLog(program));
	
	uTime = gl.getUniformLocation(program, 'uTime');
	uResolution = gl.getUniformLocation(program, 'uResolution');
	uPosition = gl.getUniformLocation(program, 'uPosition');
	uRotation = gl.getUniformLocation(program, 'uRotation');
	
	let vertices = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);
	vao = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vao);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, gl.FALSE, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
	gl.enableVertexAttribArray(0);

	gl.useProgram(program);
	
	addEventListener('keydown', keyDown);
	addEventListener('keyup', keyUp);
	window.addEventListener('mousemove', mouseMove);
	canvas.addEventListener('mouseup', mouseUp);
	canvas.addEventListener('mousedown', mouseDown);
	canvas.onmouseenter = mouseEnter;
	canvas.onmouseout = mouseOut;
	canvas.addEventListener('mousewheel', mouseWheel);

	if (!isRunning) {
		update();
	}
};

let moveStartTime;
function setMoving() {
	moving = true;
	moveStartTime = totalTime;
}

let totalTime = 0;
let lastTime = 0;
let isRunning = false;
function update() {
	isRunning = true;
	let delta = (Date.now() - lastTime) / 1000;
	if (lastTime === 0) {
		delta = 0;
	}
	lastTime = Date.now();
	if(isMousePressed) setMoving();
	if(moving) {
		canvas.width = window.innerWidth / previewScale;
		canvas.height = window.innerHeight / previewScale;
	}
	if(mouseMoveEvent) cameraRotation = getNewRotation(cameraRotation, mouseMoveEvent, isMousePressed, lookSpeed * (window.innerWidth / canvasStartDimention.x));
	if(moving || spin || !pauseWhenNotMoving) {
		if(totalTime - moveStartTime > 1 && !spin) {
			moving = false;
			moveStartTime = 0;
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		}
		gl.viewport(0, 0, canvas.width, canvas.height);
		cameraPosition = getNewPosition(cameraPosition, cameraRotation, moveSpeed);
		totalTime += delta;
		gl.uniform2f(uResolution, canvas.width, canvas.height);
		gl.uniform1f(uTime, totalTime);
		gl.uniform3f(uPosition, cameraPosition.x, cameraPosition.y, cameraPosition.z);
		gl.uniform3f(uRotation, toRadians(cameraRotation.x % 360), toRadians(cameraRotation.y % 360), toRadians(cameraRotation.z % 360));
		doEveryFrame();
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);	
	}
	
	requestAnimationFrame(update);
}

function destroy() {
	removeEventListener('keydown', keyDown);
	removeEventListener('keyup', keyUp);
	window.removeEventListener('mousemove', mouseMove);
	canvas.removeEventListener('mouseup', mouseUp);
	canvas.removeEventListener('mousedown', mouseDown);
	canvas.onmouseenter = null;
	canvas.onmouseout = null;
	canvas.removeEventListener('mousewheel', mouseWheel);
	gl.deleteProgram(program);
	gl.deleteBuffer(vao);
	gl.useProgram(null);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
}
