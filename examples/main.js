import * as THREE from 'three';
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


let camera, scene, renderer, controls;
let currentPanorama;
// const panoramas = [
//     'textures/drabri.jpg',
//     'textures/bienst.jpg',
//     'textures/dau_st.jpg',
//     'textures/sontra.jpg',
//     'textures/wayinST.jpg',
//     'textures/seaST2.jpg',
//     'textures/viewsontra.jpg',
// ];


const panoramas = [
    {
        url: './examples/textures/nuverxai.jpg',
        description: 'Nuverxai',
        coordinates: { lat: 10.123456, lng: 105.654321 },
        connectedPanoramas: [
        // { index: 1, direction: { x: -0.5, z: -0.5 } },
        ]
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
    renderer = new THREE.WebGLRenderer();
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    // Scene
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 0, 0.1);
    
    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;  // Enable zooming
    controls.zoomSpeed = 1.2;    // Adjust zoom speed (default is 1)
    
    // Load initial panorama
    loadPanorama(currentPanoramaIndex);
    
    // Event listeners for switching panoramas
    document.getElementById('direction-arrow').addEventListener('click', () => switchPanorama(0));
    // document.getElementById('left-arrow').addEventListener('click', () => switchPanorama(-1));
    // document.getElementById('right-arrow').addEventListener('click', () => switchPanorama(1));
    
    // Resize listener
    window.addEventListener('resize', onWindowResize, false);
}


function loadPanorama(index) {
    // Xóa các mũi tên cũ
    const directionArrows = document.querySelectorAll('.direction-arrow');
    directionArrows.forEach(arrow => arrow.remove());
  
    // Hiển thị thông tin vị trí panorama
    const { description, coordinates, connectedPanoramas } = panoramas[index];
    document.getElementById('info').textContent = `${description} `;
  
    // Tạo các mũi tên chỉ hướng
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
  
      // Tính toán góc quay của mũi tên
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
  
    // Tải panorama
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

        // Tạo GUI
        createGUI(material, camera, controls, {
        panoramas: panoramas,
        panoramaDescriptions: panoramas.map(item => item.description),
        envMap: panoramas[index].description,
        exposure: params.exposure
        });
    });
  }
  


  function createGUI(material, camera, controls, params) {
    const gui = new GUI();
  
    // Thêm folder Background
    const backgroundFolder = gui.addFolder('Background');
    // backgroundFolder.add(material, 'color').name('Color');
    backgroundFolder.add(material, 'opacity', 0, 1).name('Opacity');
    backgroundFolder.open();
  
    // Thêm folder Camera
    const cameraFolder = gui.addFolder('Camera');
    cameraFolder.add(camera, 'fov', 10, 120).name('Field of View').onChange(() => {
      camera.updateProjectionMatrix();
    });
    cameraFolder.add(controls, 'minDistance', 50, 1000).name('Min Distance');
    cameraFolder.add(controls, 'maxDistance', 50, 1000).name('Max Distance');
    cameraFolder.open();
  
    // Thêm control để chọn panorama
    const panoramaFolder = gui.addFolder('Panorama');
    panoramaFolder.add(params, 'envMap', params.panoramaDescriptions)
      .onChange(function (value) {
        // Tìm index của panorama dựa trên mô tả
        const index = params.panoramas.findIndex(item => item.description === value);
        loadPanorama(index);
      });
    panoramaFolder.add(params, 'exposure', 0, 2, 0.01).onChange(function (value) {
      renderer.toneMappingExposure = value;
    });
    panoramaFolder.open();
  
    return gui;
  }
  
  
init();
animate();
// init();

// function switchPanorama(direction) {
//     currentPanoramaIndex = (currentPanoramaIndex + direction + panoramas.length) % panoramas.length;
//     loadPanorama(panoramas[currentPanoramaIndex]);
// }

function switchPanorama(index) {
    currentPanoramaIndex = index;
    loadPanorama(currentPanoramaIndex);
    }


// function switchPanorama(direction) {
//     currentPanoramaIndex = (currentPanoramaIndex + direction + panoramas.length) % panoramas.length;
//     loadPanorama(currentPanoramaIndex);
//     }


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    updateDirectionArrow();
    // updateTargetArrow();
    renderer.render(scene, camera);
}

function updateDirectionArrow() {
    const directionArrow = document.getElementById('direction-arrow');
    const vector = new THREE.Vector3(0, 0, -1);
    vector.applyQuaternion(camera.quaternion);
    const angle = Math.atan2(vector.x, vector.z);
    directionArrow.style.transform = `translateX(-50%) rotate(${angle}rad)`;
}

// function updateTargetArrow() {
//     const targetArrow = document.getElementById('target-arrow');
//     const targetPosition = new THREE.Vector3(1, 1, 1); // Vị trí mục tiêu
//     const direction = targetPosition.sub(camera.position).normalize();
//     targetArrow.style.transform = `translateX(-50%) rotate(${Math.atan2(direction.x, direction.z)}rad)`;
// }