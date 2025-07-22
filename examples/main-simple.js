// Simple version without dynamic imports for better GitHub Pages compatibility
import * as THREE from '../build/three.module.js';
import { GUI } from './jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';

let camera, scene, renderer, controls;
let currentPanorama;

const panoramas = [
    {
        url: './examples/textures/nuverxai.JPG',
        description: 'Nuverxai',
        coordinates: { lat: 10.123456, lng: 105.654321 },
        connectedPanoramas: []
    },
];

let currentPanoramaIndex = 0;

const params = {
    envMap: "HDR JPG",
    roughness: 0.0,
    metalness: 1.0,
    exposure: 0.5,
    debug: false,
};

function init() {
    scene = new THREE.Scene();
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 0, 0.1);
    
    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.zoomSpeed = 1.2;
    
    // Load initial panorama
    loadPanorama(currentPanoramaIndex);
    
    // Event listeners
    document.getElementById('direction-arrow').addEventListener('click', () => switchPanorama(0));
    window.addEventListener('resize', onWindowResize, false);
}

function loadPanorama(index) {
    // Remove old arrows
    const directionArrows = document.querySelectorAll('.direction-arrow');
    directionArrows.forEach(arrow => arrow.remove());
  
    // Display panorama info
    const { description, coordinates, connectedPanoramas } = panoramas[index];
    document.getElementById('info').textContent = `${description}`;
  
    // Create direction arrows
    const totalConnections = connectedPanoramas.length;
    const angleIncrement = (2 * Math.PI) / totalConnections;
    let currentAngle = 0;
  
    connectedPanoramas.forEach((connectedPanorama, index) => {
        const directionArrow = document.createElement('div');
        directionArrow.classList.add('direction-arrow');
        directionArrow.style.position = 'absolute';
        directionArrow.style.width = '50px';
        directionArrow.style.height = '50px';
        directionArrow.style.backgroundImage = 'url(./examples/textures/arrow.png)';
        directionArrow.style.backgroundRepeat = 'no-repeat';
        directionArrow.style.backgroundPosition = 'center center';
        directionArrow.style.backgroundSize = 'contain';
  
        const arrowAngle = currentAngle + controls.getAzimuthalAngle();
        directionArrow.style.transform = `translate(-50%, -50%) rotate(${arrowAngle}rad)`;
  
        directionArrow.style.top = '50%';
        directionArrow.style.left = '50%';
        directionArrow.style.cursor = 'pointer';
        directionArrow.setAttribute('data-description', panoramas[connectedPanorama.index].description);
        directionArrow.addEventListener('click', () => switchPanorama(connectedPanorama.index));
        directionArrow.style.transform += ` translate(${150 * Math.cos(currentAngle)}px, ${150 * Math.sin(currentAngle)}px)`;
        document.body.appendChild(directionArrow);
        currentAngle += angleIncrement;
    });
  
    // Load panorama
    if (currentPanorama) {
        scene.remove(currentPanorama);
    }
  
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(panoramas[index].url, function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        // Create sphere geometry
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1);

        // Create material
        const material = new THREE.MeshBasicMaterial({ map: texture });

        // Create mesh and add to scene
        currentPanorama = new THREE.Mesh(geometry, material);
        scene.add(currentPanorama);

        // Create GUI
        createGUI(material, camera, controls, {
            panoramas: panoramas,
            panoramaDescriptions: panoramas.map(item => item.description),
            envMap: panoramas[index].description,
            exposure: params.exposure
        });
    }, undefined, function(error) {
        console.error('Error loading texture:', error);
        // Try alternative path
        const altUrl = panoramas[index].url.replace('./examples/textures/nuverxai.JPG', './examples/textures/nuverxai.jpg');
        textureLoader.load(altUrl, function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            const geometry = new THREE.SphereGeometry(500, 60, 40);
            geometry.scale(-1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ map: texture });
            currentPanorama = new THREE.Mesh(geometry, material);
            scene.add(currentPanorama);
        });
    });
}

function createGUI(material, camera, controls, params) {
    const gui = new GUI();
  
    // Background folder
    const backgroundFolder = gui.addFolder('Background');
    backgroundFolder.add(material, 'opacity', 0, 1).name('Opacity');
    backgroundFolder.open();
  
    // Camera folder
    const cameraFolder = gui.addFolder('Camera');
    cameraFolder.add(camera, 'fov', 10, 120).name('Field of View').onChange(() => {
        camera.updateProjectionMatrix();
    });
    cameraFolder.add(controls, 'minDistance', 50, 1000).name('Min Distance');
    cameraFolder.add(controls, 'maxDistance', 50, 1000).name('Max Distance');
    cameraFolder.open();
  
    // Panorama folder
    const panoramaFolder = gui.addFolder('Panorama');
    panoramaFolder.add(params, 'envMap', params.panoramaDescriptions)
        .onChange(function (value) {
            const index = params.panoramas.findIndex(item => item.description === value);
            loadPanorama(index);
        });
    panoramaFolder.add(params, 'exposure', 0, 2, 0.01).onChange(function (value) {
        renderer.toneMappingExposure = value;
    });
    panoramaFolder.open();
  
    return gui;
}

function switchPanorama(index) {
    currentPanoramaIndex = index;
    loadPanorama(currentPanoramaIndex);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    updateDirectionArrow();
    renderer.render(scene, camera);
}

function updateDirectionArrow() {
    const directionArrow = document.getElementById('direction-arrow');
    if (directionArrow) {
        const vector = new THREE.Vector3(0, 0, -1);
        vector.applyQuaternion(camera.quaternion);
        const angle = Math.atan2(vector.x, vector.z);
        directionArrow.style.transform = `translateX(-50%) rotate(${angle}rad)`;
    }
}

// Initialize and start
init();
animate(); 