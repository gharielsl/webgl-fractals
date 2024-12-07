let pressed = new Set();

function toRadians(deg) {
  return deg * (Math.PI / 180);
}

function keyPress(keyEvent) {
	pressed.add(keyEvent.code);
}

function keyRelease(keyEvent) {
	pressed.delete(keyEvent.code);
}

function getNewPosition(currentPosition, currentRotation, speed) {
	let newPosition = {...currentPosition};
	let zValue = 0;
	for(key of pressed) {
		if(key == 'KeyA') {
			let dx = -speed * Math.sin(toRadians(currentRotation.y + 90));
			let dz = speed * Math.sin(toRadians(90 - currentRotation.y + 90));
			newPosition.x += dx;
			newPosition.z += dz;
		}
		if(key == 'KeyD') {
			let dx = speed * Math.sin(toRadians(currentRotation.y + 90));
			let dz = -speed * Math.sin(toRadians(90 - currentRotation.y + 90));
			newPosition.x += dx;
			newPosition.z += dz;
		}
		if(key == 'KeyW') {
			let dx = speed * Math.sin(toRadians(currentRotation.y));
			let dz = speed * Math.sin(toRadians(90 - currentRotation.y));
			zValue++;
			newPosition.x += dx;
			newPosition.z += dz;
		}
		if(key == 'KeyS') {
			let dx = -speed * Math.sin(toRadians(currentRotation.y));
			let dz = -speed * Math.sin(toRadians(90 - currentRotation.y));
			zValue--;
			newPosition.x += dx;
			newPosition.z += dz;
		}
        let dy = zValue * speed * Math.sin(toRadians(-currentRotation.x));
        newPosition.y += dy;
	}
	return newPosition;
}

let prevMouseX = 0, prevMouseY = 0;

function getNewRotation(currentRotation, mouseMoveEvent, isMousePressed, speed) {
	let newRotation = {...currentRotation};
	if(isMousePressed) {
		let dxDeg = (mouseMoveEvent.offsetX - prevMouseX) * speed;
		let dyDeg = (mouseMoveEvent.offsetY - prevMouseY) * speed;
		newRotation.x += dyDeg;
		newRotation.y += dxDeg;
	}
	prevMouseX = mouseMoveEvent.offsetX;
	prevMouseY = mouseMoveEvent.offsetY;
	return newRotation;
}