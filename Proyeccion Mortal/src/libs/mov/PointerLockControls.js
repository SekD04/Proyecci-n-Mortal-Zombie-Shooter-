

const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _vector = new THREE.Vector3();

const _changeEvent = { type: 'change' };
const _lockEvent = { type: 'lock' };
const _unlockEvent = { type: 'unlock' };

const _PI_2 = Math.PI / 2;

class EventDispatcher {

	addEventListener(type, listener) {

		if (this._listeners === undefined) this._listeners = {};

		const listeners = this._listeners;

		if (listeners[type] === undefined) {

			listeners[type] = [];

		}

		if (listeners[type].indexOf(listener) === - 1) {

			listeners[type].push(listener);

		}

	}

	hasEventListener(type, listener) {

		if (this._listeners === undefined) return false;

		const listeners = this._listeners;

		return listeners[type] !== undefined && listeners[type].indexOf(listener) !== - 1;

	}

	removeEventListener(type, listener) {

		if (this._listeners === undefined) return;

		const listeners = this._listeners;
		const listenerArray = listeners[type];

		if (listenerArray !== undefined) {

			const index = listenerArray.indexOf(listener);

			if (index !== - 1) {

				listenerArray.splice(index, 1);

			}

		}

	}

	dispatchEvent(event) {

		if (this._listeners === undefined) return;

		const listeners = this._listeners;
		const listenerArray = listeners[event.type];

		if (listenerArray !== undefined) {

			event.target = this;

			// Make a copy, in case listeners are removed while iterating.
			const array = listenerArray.slice(0);

			for (let i = 0, l = array.length; i < l; i++) {

				array[i].call(this, event);

			}

			event.target = null;

		}

	}

}

class PointerLockControls extends EventDispatcher {

	constructor(camera, domElement) {

		super();

		if (domElement === undefined) {

			console.warn('THREE.PointerLockControls: The second parameter "domElement" is now mandatory.');
			domElement = document.body;

		}

		this.domElement = domElement;
		this.isLocked = false;

		// Set to constrain the pitch of the camera
		// Range is 0 to Math.PI radians
		this.minPolarAngle = 0; // radians
		this.maxPolarAngle = Math.PI; // radians

		const scope = this;

		function onMouseMove(event) {

			if (scope.isLocked === false) return;

			const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
			const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

			_euler.setFromQuaternion(camera.quaternion);

			_euler.y -= movementX * 0.002;
			_euler.x -= movementY * 0.002;

			_euler.x = Math.max(_PI_2 - scope.maxPolarAngle, Math.min(_PI_2 - scope.minPolarAngle, _euler.x));

			camera.quaternion.setFromEuler(_euler);

			scope.dispatchEvent(_changeEvent);

		}

		function onPointerlockChange() {

			if (scope.domElement.ownerDocument.pointerLockElement === scope.domElement) {

				scope.dispatchEvent(_lockEvent);

				scope.isLocked = true;

			} else {

				scope.dispatchEvent(_unlockEvent);

				scope.isLocked = false;

			}

		}

		function onPointerlockError() {

			document.getElementById('instructions').style.display = 'block';
			console.error('THREE.PointerLockControls: Unable to use Pointer Lock API');

		}

		this.connect = function () {

			scope.domElement.ownerDocument.addEventListener('mousemove', onMouseMove);
			scope.domElement.ownerDocument.addEventListener('pointerlockchange', onPointerlockChange);
			scope.domElement.ownerDocument.addEventListener('pointerlockerror', onPointerlockError);

		};

		this.disconnect = function () {

			scope.domElement.ownerDocument.removeEventListener('mousemove', onMouseMove);
			scope.domElement.ownerDocument.removeEventListener('pointerlockchange', onPointerlockChange);
			scope.domElement.ownerDocument.removeEventListener('pointerlockerror', onPointerlockError);

		};

		this.dispose = function () {

			this.disconnect();

		};

		this.getObject = function () { // retaining this method for backward compatibility

			return camera;

		};

		this.getDirection = function () {

			const direction = new THREE.Vector3(0, 0, - 1);

			return function (v) {

				return v.copy(direction).applyQuaternion(camera.quaternion);

			};

		}();

		this.moveForward = function (distance) {

			// move forward parallel to the xz-plane
			// assumes camera.up is y-up

			_vector.setFromMatrixColumn(camera.matrix, 0);

			_vector.crossVectors(camera.up, _vector);

			camera.position.addScaledVector(_vector, distance);

		};

		this.moveRight = function (distance) {

			_vector.setFromMatrixColumn(camera.matrix, 0);

			camera.position.addScaledVector(_vector, distance);

		};

		this.lock = function () {

			this.domElement.requestPointerLock();

		};

		this.unlock = function () {

			scope.domElement.ownerDocument.exitPointerLock();

		};

		this.connect();

	}

}
