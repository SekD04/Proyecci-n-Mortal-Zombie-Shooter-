//zzzz

// ----------------------------
// Inicialización de Variables:
// ----------------------------
var scene = null,
    camera = null,
    renderer = null,
    controls = null;


var sound1 = null,
    countPoints = null,
    modelLoad = null,
    light = null,
    figuresGeo = [];

var sensitivity = 0.1;

var MovingCube = null,
    collidableMeshList = [],
    collidablePoints = [],
    lives = 3,
    numberToCreate = 5,
    worldObjects = [],
    scoreCount = 0;

let cubes = [] // array to store the cubes
let mixers = [] // array to store the animation mixers
let cubeHeight // variable to store the height of the cubes

let clock = new THREE.Clock();
var weaponP = null;
let pointerSprite = null;
const bullets = [];
const bulletSpeed = 1; // Ajusta la velocidad de las balas
const availableTargets = []; // Añade los objetivos aquí
const raycaster = new THREE.Raycaster();
const sceneMeshes = []; // Aquí almacenaremos los objetos con los que la cámara puede colisionar


var color = new THREE.Color();
var player = { height: 5, speed: 0.4, turnSpeed: Math.PI * 0.02 };
var keyboard = {};

let radius = 200
let loaderZ
let zombieClip; // handles the current animation clip
let zombieCubes = [] // array to store zombies
let zombieCount = 175; // number of zombies to be created
const colliders = []; // Para los colisionadores
const zombieModels = new Map(); // Relaciona colisionadores con modelos GLTF
let sounds = {}
var coliss = null;
var finale = 0;
var isAnimating = true;
var scale = 1;
var rotSpd = 0.05;
var spd = 0.05;
var input = { left: 0, right: 0, up: 0, down: 0 };
// ----------------------------
// Funciones de creación init:
// ----------------------------
function start() {
    initScene();
    window.onresize = onWindowResize;
    AddWeapon();
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function initScene() {
    initBasicElements(); // Scene, Camera and Render
    createLight();       // Create light
    createEnviroment();
    createPointer();
    // Llama a esta función para visualizar los rayos
    //createPlayerMove();
    // Set up the random cubes

    const cubeGeometry = new THREE.BoxBufferGeometry(3, 8, 3);
    const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });


    function generatRandomXZINsertion(object, i, y, minDistance) {

        // Generate random x and z values within the circular area
        const x = Math.random() * radius * 2 - radius;
        const z = Math.random() * radius * 2 - radius;

        if (Math.sqrt(x * x + z * z) > minDistance) {
            object.position.set(x, y, z);
        } else {
            // Generate new x and z values and try again
            i--;
        }

    }


    // Set up a model loader object
    loaderZ = new THREE.GLTFLoader();
    //loaderZ.setMeshoptDecoder(MeshoptDecoder);

    // Cargar colisionadores y modelos
    for (let i = 0; i < zombieCount; i++) {
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cubeHeight = 1.5;
        cube.position.set(
            Math.random() * 200 - 100 + 100,
            cubeHeight,
            Math.random() * 200 - 100 + 100
        );

        generatRandomXZINsertion(cube, i, cubeHeight, 50);

        cube.visible = true; // El colisionador es invisible
        cube.material.transparent = true;
        cube.material.opacity = 0;
        cube.name = `red-cube-collider-${i}`;
        scene.add(cube);
        colliders.push(cube);

        loaderZ.load('/modelos/gltf/minecraft-zombie-2/zombie-001.glb', function (gltf) {
            gltf.scene.position.set(cube.position.x, cubeHeight - 4, cube.position.z);
            gltf.scene.scale.set(5, 5, 5);
            gltf.scene.name = `red-cube-${i}`;
            scene.add(gltf.scene);

            // Relacionar colisionador con modelo GLTF
            zombieModels.set(cube, gltf.scene);

        });
    }

    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    function zombieParts(x, z) {

        for (let i = 0; i < 10; i++) {
            const size = Math.random() * 0.2 + 0.3; // Generates a random number between 0.5 and 0.9
            const zombieCubeGeometry = new THREE.BoxGeometry(size, size, size);
            const zombieCubeMaterial = new THREE.MeshBasicMaterial({ color: getRandomColor() });
            const zombieCube = new THREE.Mesh(zombieCubeGeometry, zombieCubeMaterial);
            // Set the initial position of the cube to 2 units above the origin
            zombieCube.position.set(x, 3, z);
            const zRotation = Math.random() * 2 * Math.PI; // generate a random z rotation angle between 0 and 2*PI
            const xRotation = Math.random() * 2 * Math.PI; // generate a random x rotation angle between 0 and 2*PI
            zombieCube.rotation.z = zRotation;
            zombieCube.rotation.x = xRotation;
            // Translate the cube in a random direction
            zombieCube.translateX(Math.random() * 2 - 1);
            zombieCube.translateY(Math.random() * 2 - 1);
            zombieCube.translateZ(Math.random() * 2 - 1);
            zombieCubes.push(zombieCube);
            scene.add(zombieCube);
        }

    }
}

function animate() {
    if (isAnimating) {
        requestAnimationFrame(animate);
        // Tiempo transcurrido desde el último frame

        delta = clock.getDelta();
        updateControls(); // Actualizar movimientos
        //console.log(camera.position.x, " ", camera.position.y, " ", camera.position.z)
        updatePointer();
        updateWeaponPosition();
        updateBullets(); // Actualizar balas activas
        updateZ(delta);
        //movePlayer();
        // Llamar al siguiente frame

        renderer.render(scene, camera);
    }

}

// Controlador de Movimiento de la Cámara
class MouseControls {
    constructor(camera) {
        this.camera = camera;
        this._motion = { rotation: { x: 0, y: 0 } };

        // Limitar ángulos verticales
        this.minPolarAngle = -Math.PI / 3; // -60 grados
        this.maxPolarAngle = Math.PI / 3;  // +60 grados

        this.pointerLocked = false; // Estado del puntero bloqueado
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.init();
    }

    init() {
        // Registrar eventos de movimiento del mouse
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // Elemento que usaremos para bloquear el puntero
        const blocker = document.getElementById('blocker') || document.body;

        // Solicitar bloqueo de puntero al hacer clic
        blocker.addEventListener('click', () => {
            blocker.requestPointerLock();
        });

        // Detectar cambios en el estado de bloqueo
        document.addEventListener('pointerlockchange', () => {
            this.pointerLocked = document.pointerLockElement === blocker;
            if (this.pointerLocked) {
                console.log("Pointer locked");
                blocker.style.display = "none"; // Ocultar el elemento visual
            } else {
                console.log("Pointer unlocked");
                blocker.style.display = "block"; // Mostrar el elemento visual
            }
        });

        // Manejo de errores de bloqueo del puntero
        document.addEventListener('pointerlockerror', () => {
            console.error("Pointer lock failed");
        });
    }

    onMouseMove(e) {
        if (!this.pointerLocked) return; // Solo funciona cuando el puntero está bloqueado

        // Movimiento del mouse
        const movementX = (e.movementX || e.mozMovementX || e.webkitMovementX || 0) * sensitivity;
        const movementY = (e.movementY || e.mozMovementY || e.webkitMovementY || 0) * sensitivity;

        // Rotaciones
        this._motion.rotation.y -= movementX * Math.PI / 180;
        this._motion.rotation.x -= movementY * Math.PI / 180;

        // Limitar el ángulo vertical
        this._motion.rotation.x = Math.min(Math.max(this._motion.rotation.x, this.minPolarAngle), this.maxPolarAngle);

        // Aplicar rotación a la cámara
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.x = this._motion.rotation.x;
        euler.y = this._motion.rotation.y;
        this.camera.quaternion.setFromEuler(euler);
    }
}
function initBasicElements() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("#app") });
    //const canvas = document.querySelector("#app"); // Asegúrate de seleccionar tu canvas
    //canvas.addEventListener('click', () => {
    //    canvas.requestPointerLock();
    //});

    // controls = new THREE.OrbitControls(camera, renderer.domElement);
    // controls.update();

    camera.position.set(84.40, player.height, 92);
    camera.lookAt(new THREE.Vector3(2, player.height, 88));
    const controls = new MouseControls(camera);

    scene.background = new THREE.Color(0x0099ff);


    renderer.setSize(window.innerWidth, window.innerHeight - 4);
    document.body.appendChild(renderer.domElement);

}


function createLight() {
    // Niebla para limitar visibilidad y añadir atmósfera
    scene.fog = new THREE.Fog(0x222233, 10, 250); // Color oscuro con inicio y fin de la niebla ajustados

    // Luz hemisférica con colores fríos y baja intensidad
    const hemisphereLight = new THREE.HemisphereLight(0x444466, 0x222222, 0.5);
    hemisphereLight.position.set(0, 50, 0); // Altura para simular iluminación tenue desde arriba
    scene.add(hemisphereLight);

    // Luz direccional para generar sombras y un punto de iluminación destacado
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
    directionalLight.position.set(50, 50, 50); // Ajusta la posición para iluminar desde un ángulo
    directionalLight.castShadow = true; // Habilitar sombras
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);

    // Luz puntual con un tono rojo tenue (para efecto de terror)
    const pointLight = new THREE.PointLight(0xff0000, 3.0, 50); // Rojo con atenuación
    pointLight.position.set(-50, 20, -40); // Cerca del suelo para simular una fuente baja
    pointLight.castShadow = true; // Habilitar sombras
    scene.add(pointLight);

    // Luz ambiental tenue para evitar que las áreas no iluminadas sean completamente negras
    const ambientLight = new THREE.AmbientLight(0x111122, 3); // Muy tenue con tonos oscuros
    scene.add(ambientLight);

    // Crear un Spotlight para simular el foco de una lámpara colgante
    const spotLight = new THREE.SpotLight(0xffffff, 12); // Luz blanca con intensidad moderada
    spotLight.position.set(-105, 10, 99); // Posición elevada para simular que cuelga del techo
    spotLight.angle = Math.PI / 6; // Ángulo de apertura (ajustar para enfocar más o menos)
    spotLight.penumbra = 0.3; // Suavidad en los bordes de la luz
    spotLight.decay = 2; // Atenuación (cómo disminuye la intensidad con la distancia)
    spotLight.distance = 50; // Alcance de la luz

    // Activar sombras para el Spotlight
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024; // Resolución de las sombras
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 100;

    // Agregar el Spotlight a la escena
    scene.add(spotLight);
}

// ----------------------------------
// Función Para mover al jugador:
// ----------------------------------


function createEnviroment() {
    var mtlLoaderC = new THREE.MTLLoader();
    var pathMtlC = "salas.mtl";
    var generalPC = "./modelos/cinema/";
    var objCi = "salas.obj";

    mtlLoaderC.setTexturePath(generalPC);
    mtlLoaderC.setPath(generalPC);
    mtlLoaderC.load(pathMtlC, function (materials) {
        materials.preload();

        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath(generalPC);
        objLoader.load(objCi, function (object) {
            object.scale.set(10, 10, 10);
            object.position.set(5, -5, -20);

            object.traverse(function (child) {
                if (child.isMesh) {
                    child.geometry.computeBoundingBox(); // Recalcular BoundingBox
                    child.geometry.computeBoundingSphere(); // Opcional
                    sceneMeshes.push(child);
                }
            });

            scene.add(object);
        });
    });
}

function updateControls() {
    if (coliss == 1) {
        const speed = player.speed; // Velocidad ajustada al tiempo

        // Crear un vector de avance basado en el quaternion de la cámara
        const direction = new THREE.Vector3(0, 0, -1); // Dirección hacia adelante (negativa en Z)
        direction.applyQuaternion(camera.quaternion); // Transformar dirección según la orientación de la cámara
        direction.y = 0; // Ignorar el movimiento vertical (mantener en plano horizontal)
        direction.normalize(); // Asegurar que el vector tenga magnitud 1

        // Movimiento hacia adelante y atrás
        if (keyboard[87]) { // W key
            camera.position.addScaledVector(direction, speed);
        }
        if (keyboard[83]) { // S key
            camera.position.addScaledVector(direction, -speed);
        }

        // Movimiento lateral
        const strafe = new THREE.Vector3(); // Vector para movimiento lateral
        strafe.crossVectors(camera.up, direction); // Calcular dirección perpendicular (derecha o izquierda)
        strafe.normalize();

        if (keyboard[65]) { // A key
            camera.position.addScaledVector(strafe, speed); // Izquierda
        }
        if (keyboard[68]) { // D key
            camera.position.addScaledVector(strafe, -speed); // Derecha
        }
    }
    else {
        const speed = 0.8; // Velocidad ajustada al tiempo

        // Crear un vector de avance basado en el quaternion de la cámara
        const direction = new THREE.Vector3(0, 0, -1); // Dirección hacia adelante (negativa en Z)
        direction.applyQuaternion(camera.quaternion); // Transformar dirección según la orientación de la cámara
        direction.y = 0; // Ignorar el movimiento vertical (mantener en plano horizontal)
        direction.normalize(); // Asegurar que el vector tenga magnitud 1

        const strafe = new THREE.Vector3();
        strafe.crossVectors(camera.up, direction).normalize();

        const nextPosition = camera.position.clone(); // Clonar posición actual para prever colisiones

        // Movimiento hacia adelante y atrás
        if (keyboard[87]) { // W key
            const forward = direction.clone().multiplyScalar(speed);
            nextPosition.add(forward); // Simular nueva posición
            if (!checkCollision(nextPosition)) { // Verificar colisión antes de mover
                camera.position.add(forward);
            }
        }

        if (keyboard[83]) { // S key
            const backward = direction.clone().multiplyScalar(-speed);
            nextPosition.add(backward);
            if (!checkCollision(nextPosition)) {
                camera.position.add(backward);
            }
        }

        // Movimiento lateral
        if (keyboard[65]) { // A key
            const left = strafe.clone().multiplyScalar(speed);
            nextPosition.add(left);
            if (!checkCollision(nextPosition)) {
                camera.position.add(left);
            }
        }

        if (keyboard[68]) { // D key
            const right = strafe.clone().multiplyScalar(-speed);
            nextPosition.add(right);
            if (!checkCollision(nextPosition)) {
                camera.position.add(right);
            }
        }

    }
}

// Verifica colisiones usando raycasting
function checkCollision(position) {
    const directions = [
        new THREE.Vector3(1, 0, 0),   // Derecha
        new THREE.Vector3(0, 0, 1),   // Adelante
        new THREE.Vector3(-1, 0, 0),  // Izquierda
        new THREE.Vector3(0, 0, -1),  // Atrás
    ];

    for (const dir of directions) {
        const raycaster = new THREE.Raycaster();
        raycaster.set(position, dir.normalize()); // Establecer posición y dirección del rayo
        const intersects = raycaster.intersectObjects(sceneMeshes, false);

        if (intersects.length > 0 && intersects[0].distance < 1.5) {
            // Si hay colisión cercana, no permitimos el movimiento
            return true;
        }
    }
    return false; // No hay colisiones
}

function keyDown(event) {
    keyboard[event.keyCode] = true;
}

function keyUp(event) {
    keyboard[event.keyCode] = false;
}



window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);
// Manejar el evento de clic para disparar
document.addEventListener('click', () => {
    shoot();
});

// ----------------------------------
// Funciones llamadas desde el index:
// ----------------------------------
function go2Play(val) {
    variableColision(val);
    playAudio(t);
    start();
    document.getElementById('blocker').style.display = 'none';
    document.getElementById('cointainerOthers').style.display = 'block';
    document.getElementById("CountZ").innerHTML = zombieCount;
    document.getElementById("Score").innerHTML = scoreCount;
    initialiseTimer();
}

function updateCubes() {
    colliders.forEach((cube, i) => {
        attackPlayer(cube);

        // Mantener los cubos en el mismo plano
        cube.position.y = cubeHeight;

        // Separar los cubos si colisionan
        colliders.forEach((otherCube, j) => {
            if (i !== j && cube.position.distanceTo(otherCube.position) < 1) {
                const separationDirection = new THREE.Vector3()
                    .subVectors(cube.position, otherCube.position)
                    .normalize();
                cube.position.add(separationDirection.multiplyScalar(0.01));
            }
        });

        // Rotar el cubo hacia la cámara (jugador)
        const targetPosition = new THREE.Vector3(camera.position.x, cube.position.y, camera.position.z);
        cube.lookAt(targetPosition);

        // Si el cubo tiene un modelo GLTF asociado, sincronizar posición y rotación
        if (zombieModels.has(cube)) {
            const model = zombieModels.get(cube);

            // Sincronizar posición (manteniendo Y fija en -2)
            model.position.set(cube.position.x, -2, cube.position.z);

            // Sincronizar rotación
            model.rotation.copy(cube.rotation);
        }
    });
}

function updateZombieCubes(delta) {
    zombieCubes.forEach(cube => {
        // Desplazar hacia abajo
        cube.position.y -= 10 * delta;

        // Evitar que la posición y sea negativa
        if (cube.position.y < 0) {
            cube.position.y = 0;
        }

        // Si el cubo tiene un modelo GLTF asociado, mueve el modelo a la posición del cubo
        if (zombieModels.has(cube)) {
            const model = zombieModels.get(cube);
            model.position.copy(cube.position);
            model.rotation.copy(cube.rotation);
        }
    });
}


function attackPlayer(cube) {
    // Mover el cubo hacia la cámara
    moveDirection(camera, cube);
}

function moveDirection(object, cube) {
    // Calculate the direction from the current cube to the camera
    // This creates a new Vector3 object that represents the direction from the current cube to the camera
    const direction = new THREE.Vector3().subVectors(object.position, cube.position).normalize();
    // Add some randomness to the direction
    // This adds a random value between -0.1 and 0.9 to the x and z components of the direction vector,
    // which makes the cube move in a more random direction
    direction.x += Math.random() * 1 - 2 * delta;
    direction.z += Math.random() * 1 - 2 * delta;
    // Calculate a random hesitation time between 0.8 and 1 seconds
    // This creates a random value between 0.8 and 1, which will be used to slow down the cube's movement
    const hesitation = Math.random() * 0.2 + 0.8;
    // Move the current cube towards the central cube
    // This moves the current cube towards the central cube by a small amount (0.03) multiplied by the hesitation time
    cube.position.add(direction.multiplyScalar(3 * hesitation * delta));
    // Calculate the direction from the current cube to the central cube
    const target = new THREE.Vector3().subVectors(object.position, cube.position).normalize();
    // Calculate the angle between the current cube and the central cube
    // This uses the atan2 function to calculate the angle of the direction vector in radians
    const angle = Math.atan2(target.x, target.z);
    // Rotate the current cube towards the central cube
    // This uses the lerp function to smoothly rotate the cube towards the target angle over time
    cube.rotation.y = THREE.Math.lerp(cube.rotation.y, angle, 5 * delta);

    // Rotar el cubo hacia la cámara (jugador)
    const targetPosition = new THREE.Vector3(object.position.x, cube.position.y, object.position.z);
    cube.lookAt(targetPosition);

    // Si el cubo tiene un modelo GLTF asociado, sincronizar posición y rotación
    if (zombieModels.has(cube)) {
        const model = zombieModels.get(cube);

        // Sincronizar posición (manteniendo Y fija en -2.5)
        model.position.set(cube.position.x, -2, cube.position.z);

        // Sincronizar rotación
        model.rotation.copy(cube.rotation);
    }

    // Verificar la distancia entre el cubo y el objeto objetivo
    const distance = cube.position.distanceTo(object.position);
    const proximityThreshold = 5; // Umbral de distancia para reproducir sonido (ajústalo según tus necesidades)

    // Si el cubo está cerca del objeto objetivo y el sonido está pausado, reproducirlo
    if (distance < proximityThreshold) {
        // Reproducir sonido
        const gruntSound = document.getElementById('zombieGrunt');
        gruntSound.currentTime = 0; // Reinicia el audio para reproducirlo desde el inicio
        gruntSound.volume = 1;
        gruntSound.play().catch((error) => {
            console.error("Error al reproducir el sonido de zombie:", error);
        });
    }
}

// Llamar a las funciones en cada frame
function updateZ(delta) {
    updateCubes();
    updateZombieCubes(delta);
}

// Función para crear el puntero con una imagen
function createPointer() {
    // Cargar la textura de la imagen
    const texture = new THREE.TextureLoader().load('./img/target.png'); // Reemplaza con la ruta de tu imagen
    const material = new THREE.SpriteMaterial({ map: texture });

    // Crear el sprite (puntero)
    pointerSprite = new THREE.Sprite(material);
    pointerSprite.scale.set(0.25, 0.25, 0.125); // Ajusta el tamaño del puntero si es necesario
    pointerSprite.position.set(0, 0, -18); // Posición inicial en el espacio (ajústalo si es necesario)

    scene.add(pointerSprite);
}

// Función para actualizar la posición del puntero
function updatePointer() {
    if (!pointerSprite) return;

    // Obtener la dirección hacia donde mira la cámara
    const direction = new THREE.Vector3(0, 0, -1);  // Dirección de la cámara
    direction.applyQuaternion(camera.quaternion).normalize();

    // Crear un offset para que el puntero aparezca en frente de la cámara
    const offset = new THREE.Vector3(0, 0, -6.5); // Ajusta la distancia si es necesario
    offset.applyQuaternion(camera.quaternion); // Aplica la rotación de la cámara
    pointerSprite.position.copy(camera.position).add(offset); // Posiciona el puntero en frente de la cámara

    // Opcional: Hacer que el puntero apunte hacia la dirección de la bala
    pointerSprite.lookAt(pointerSprite.position.clone().add(direction));
}

function shoot() {
    if (!weaponP) return; // Verificar si el arma está cargada

    // Reproducir sonido
    const shootSound = document.getElementById('shootSound');
    shootSound.currentTime = 0; // Reinicia el audio para reproducirlo desde el inicio
    shootSound.play().catch((error) => {
        console.error("Error al reproducir el sonido de disparo:", error);
    });

    const bullet = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );

    camera.getWorldPosition(bullet.position);
    const bulletDirection = new THREE.Vector3(0, 0, -1);
    camera.getWorldQuaternion(bullet.quaternion);

    const offset = new THREE.Vector3(1.8, 0.1, -4.5);
    offset.applyQuaternion(camera.quaternion);
    bullet.position.add(offset);

    bulletDirection.applyQuaternion(bullet.quaternion).normalize();
    bullet.userData = { direction: bulletDirection };

    scene.add(bullet);
    bullets.push(bullet);
}

function updateBullets() {
    bullets.forEach((bullet, index) => {
        const direction = bullet.userData.direction;

        // Mover la bala
        bullet.position.add(direction.clone().multiplyScalar(bulletSpeed));

        // Configurar raycaster para detectar colisiones
        raycaster.set(bullet.position, bullet.userData.direction)
        const hits = raycaster.intersectObjects(colliders, true);

        if (hits.length > 0) {
            const firstHit = hits[0].object;

            if (zombieModels.has(firstHit)) {
                const zombie = zombieModels.get(firstHit);
                // Eliminar zombie y colisionador
                scene.remove(zombie);
                scene.remove(firstHit);
                zombieModels.delete(firstHit);
                colliders.splice(colliders.indexOf(firstHit), 1);

                // Actualizar puntuaciones
                scoreCount += 1;
                document.getElementById("Score").innerHTML = scoreCount;
                zombieCount -= 1;
                document.getElementById("CountZ").innerHTML = zombieCount;

                if (zombieCount == 0) {
                    finale = 1;
                    isAnimating = false;
                    document.getElementById('instructions').style.display = 'none';
                    document.getElementById('resultados').style.display = 'block';
                    document.getElementById("ScreenOver").style.display = "block";
                    document.getElementById("cointainerOthers").style.display = "none";
                    document.exitPointerLock();
                    pauseAudio(t);
                    playAudio(ovR);
                }
                // Remover la bala
                scene.remove(bullet);
                bullets.splice(index, 1);

                // Detener búsqueda de más colisiones para esta bala
                return;
            }
        }

        // Eliminar bala si está fuera del rango visible
        if (bullet.position.length() > 200) {
            scene.remove(bullet);
            bullets.splice(index, 1);
        }
    });
}



function initialiseTimer() {
    var sec = 0;
    function pad(val) { return val > 9 ? val : "0" + val; }

    setInterval(function () {
        document.getElementById("seconds").innerHTML = String(pad(++sec % 60));
        document.getElementById("minutes").innerHTML = String(pad(parseInt(sec / 60, 10)));

        if (finale == 1) {
            document.getElementById("secondsF").innerHTML = String(pad(++sec % 60));
            document.getElementById("minutesF").innerHTML = String(pad(parseInt(sec / 60, 10)));
            finale = 0;
        }
    }, 1000);



}

function variableColision(value) {
    coliss = value;
}
// ----------------------------------
// Funciones llamadas desde el index:
// ----------------------------------
function createPlayerMove() {
    var cubeGeometry = new THREE.CubeGeometry(1, 1, 1, 1, 1, 1);
    var wireMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.0 });
    MovingCube = new THREE.Mesh(cubeGeometry, wireMaterial);
    MovingCube.position.set(camera.position.x, camera.position.y, camera.position.z);
    scene.add(MovingCube);
}



function AddWeapon() {
    // Se añade el arma
    var mtlLoaderW = new THREE.MTLLoader();
    var pathMtlW = "Pistola.mtl";
    var generalPW = "./modelos/weapon/";
    var objCW = "Pistola.obj";

    mtlLoaderW.setTexturePath(generalPW);
    mtlLoaderW.setPath(generalPW);
    mtlLoaderW.load(pathMtlW, function (materials) {
        materials.preload();

        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath(generalPW);
        objLoader.load(objCW, function (object) {
            // Asigna el objeto cargado a la variable global weaponP
            weaponP = object;

            // Ajustes al objeto una vez cargado
            weaponP.scale.set(1.8, 1.8, 1.8);
            weaponP.position.set(84, player.height, 92);


            // Agregar el objeto a la escena
            scene.add(weaponP);
        });
    });
}

function updateWeaponPosition() {
    // Establecer la posición del arma en la posición de la cámara
    if (weaponP) {
        // El objeto weaponP está cargado, puedes usarlo aquí
        weaponP.position.copy(camera.position);

        // Asegurarse de que el arma esté un poco al frente de la cámara y ajustada a la derecha (o izquierda)
        const offset = new THREE.Vector3(2, -0.3, -4.1); // Ajusta estos valores según la posición deseada del arma
        const weaponPosition = offset.applyQuaternion(camera.quaternion); // Aplica la rotación de la cámara
        weaponP.position.add(weaponPosition);

        // Asegurar que la rotación del arma siga la rotación de la cámara

        // Crear un cuaternión basado en la rotación de la cámara
        const targetQuaternion = new THREE.Quaternion();
        targetQuaternion.copy(camera.quaternion);

        // Aplicar una rotación adicional de 90 grados en el eje Y
        const additionalRotation = new THREE.Quaternion();
        additionalRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.Math.degToRad(285)); // 90 grados en Y

        // Combinar cuaterniones
        targetQuaternion.multiply(additionalRotation);
        weaponP.quaternion.copy(targetQuaternion);
    } else {
        console.log("El arma aún no está cargada");
    }

}



function backHome() {
    document.getElementById('blocker').style.display = "block";
    document.getElementById('instructions').style.display = "block";
    document.getElementById("ScreenOver").style.display = 'none';
    window.location.href = "index.html";
    pauseAudio(oVR);
    playAudio(t);
}