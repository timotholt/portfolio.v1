// Wait for Three.js to be loaded
if (typeof THREE === 'undefined') {
    console.error('Three.js not loaded! Please check your script tags.');
    throw new Error('Three.js not loaded');
}

// Wait for modules to be loaded
if (typeof THREE.CSS2DRenderer === 'undefined' || typeof THREE.CSS3DRenderer === 'undefined') {
    console.error('Required modules not loaded! Please check your script tags.');
    throw new Error('Required modules not loaded');
}

// Create the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Create layers for bloom effect
const BLOOM_LAYER = 1;
const NORMAL_LAYER = 0;

// Set up the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.layers.enable(BLOOM_LAYER);  // Enable bloom layer on camera
camera.layers.enable(NORMAL_LAYER); // Enable normal layer on camera

// Create the renderer
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('portfolio-container').appendChild(renderer.domElement);

// Create CSS2D renderer for labels
const labelRenderer = new THREE.CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
document.getElementById('portfolio-container').appendChild(labelRenderer.domElement);

// Create CSS3D renderer for HUD
const css3dRenderer = new THREE.CSS3DRenderer();
css3dRenderer.setSize(window.innerWidth, window.innerHeight);
css3dRenderer.domElement.style.position = 'absolute';
css3dRenderer.domElement.style.top = '0';
css3dRenderer.domElement.style.pointerEvents = 'none';
document.getElementById('portfolio-container').appendChild(css3dRenderer.domElement);

// Set up post-processing
const composer = new THREE.EffectComposer(renderer);
const renderPass = new THREE.RenderPass(scene, camera);
composer.addPass(renderPass);

// Set up bloom pass for the road and rings
const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    2.0,    // Stronger bloom intensity
    0.5,    // Moderate radius
    0.1     // Lower threshold for more glow
);
composer.addPass(bloomPass);

// Add lights
const ambientLight = new THREE.AmbientLight(0x111111, 0.2); // Dimmer ambient
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Add subtle blue point light for atmosphere
const pointLight = new THREE.PointLight(0x4444ff, 1.0, 100);
pointLight.position.set(0, 5, 0);
scene.add(pointLight);

// Import and create webpage
import { createWebPage } from './js/webpage.js';

// Remove old webpage if it exists
if (window.testPage) {
    scene.remove(testPage.css3dObject);
    scene.remove(testPage.mesh);
}

// Create the webpage
const webpage = createWebPage(THREE, scene);

// Import and create track
import { createTrack } from './js/track.js';
const { track, curve, material: trackMaterial } = createTrack(THREE, scene);

// Import and create star field
import { createStarField } from './js/stars.js';
const { stars, particles, updateParticles } = createStarField(THREE, scene);

// Import and create rings
import { createRings } from './js/rings.js';
const { rings, milestones, updateRingsOpacity } = createRings(THREE, scene, curve, camera);

// Camera controls
let progress = 0;
let targetProgress = 0;
let cameraRotationOffset = 0;  // Current camera rotation offset
const cameraOffset = new THREE.Vector3(0, 0.5, 0);
const ROTATION_SPEED = 0.05;  // How fast to rotate
const ROTATION_RETURN_SPEED = 0.1;  // How fast to return to center
let isRotatingLeft = false;
let isRotatingRight = false;

function handleKeyState() {
    const speed = 0.005; // Reduced from 0.012
    if (keyState.w || keyState.arrowup) targetProgress += speed;
    if (keyState.s || keyState.arrowdown) targetProgress -= speed;
    if (keyState.a || keyState.arrowleft) isRotatingLeft = true;
    if (keyState.d || keyState.arrowright) isRotatingRight = true;
    
    // Reset rotation if no rotation keys are pressed
    if (!keyState.a && !keyState.arrowleft) isRotatingLeft = false;
    if (!keyState.d && !keyState.arrowright) isRotatingRight = false;
}

function updateCamera() {
    progress += (targetProgress - progress) * 0.03;  
    const wrappedProgress = ((progress % 1.0) + 1.0) % 1.0;  // Always positive
    const point = curve.getPointAt(wrappedProgress);  
    const lookAhead = curve.getPointAt((wrappedProgress + 0.01) % 1.0);
    
    // Update camera rotation
    if (isRotatingLeft) {
        cameraRotationOffset += ROTATION_SPEED;
    } else if (isRotatingRight) {
        cameraRotationOffset -= ROTATION_SPEED;
    } else if (cameraRotationOffset !== 0) {
        // Smoothly return to center when not rotating
        cameraRotationOffset *= (1 - ROTATION_RETURN_SPEED);
        if (Math.abs(cameraRotationOffset) < 0.001) cameraRotationOffset = 0;
    }
    
    // Apply camera position and rotation
    camera.position.copy(point).add(cameraOffset);
    
    // Create a look target that's offset by our rotation
    const forward = new THREE.Vector3().subVectors(lookAhead, point);
    const right = new THREE.Vector3(forward.z, 0, -forward.x).normalize();
    const rotatedTarget = new THREE.Vector3().copy(lookAhead);
    rotatedTarget.add(right.multiplyScalar(cameraRotationOffset));
    rotatedTarget.y += 0.1;
    
    camera.lookAt(rotatedTarget);

    // Update HUD metrics
    const milestoneElement = document.getElementById('milestone-value');
    const milestoneNameElement = document.getElementById('milestone-name');
    const arrows = document.querySelectorAll('.arrow');
    
    if (milestoneElement && milestoneNameElement && arrows.length > 0) {
        // Find next milestone with safety check
        const nextMilestoneIndex = milestones.findIndex(m => m.position > wrappedProgress);
        const safeIndex = nextMilestoneIndex === -1 ? 0 : nextMilestoneIndex;
        let distance = Math.abs(milestones[safeIndex].position - wrappedProgress);
        if (distance > 0.5) distance = 1 - distance;  // Use same wraparound logic as rings
        milestoneElement.textContent = (distance * 100).toFixed(2);
        milestoneNameElement.textContent = milestones[safeIndex].name;

        // Update arrows
        const currentPosition = Math.floor(wrappedProgress * 20);
        arrows.forEach((arrow, i) => {
            arrow.className = 'arrow';  // Reset classes
            if (i <= currentPosition) {
                arrow.classList.add('active');
            }
            // If we're exactly at this arrow's position and it's a milestone
            if (i === currentPosition && arrow.classList.contains('milestone')) {
                arrow.classList.add('current-milestone');
            }
        });
    }
    
    updateRingsOpacity(progress);
}

// Handle keyboard controls
let lastKeyTime = 0;
const keyState = {
    w: false,
    s: false,
    a: false,
    d: false,
    space: false,
    arrowup: false,
    arrowdown: false,
    arrowleft: false,
    arrowright: false
};

document.addEventListener('keydown', (event) => {
    const now = Date.now();
    if (now - lastKeyTime < 16) return; // Skip if less than 16ms (60fps) since last key
    lastKeyTime = now;
    
    const key = event.key.toLowerCase();
    const keyMap = {
        'w': 'w',
        's': 's',
        'a': 'a',
        'd': 'd',
        ' ': 'space',
        'arrowup': 'arrowup',
        'arrowdown': 'arrowdown',
        'arrowleft': 'arrowleft',
        'arrowright': 'arrowright'
    };
    
    const mappedKey = keyMap[key];
    if (mappedKey) {
        keyState[mappedKey] = true;
        // Find corresponding visual key for WASD only
        if ('wasd'.includes(mappedKey)) {
            const keyElement = document.querySelector(`.key-${mappedKey}`);
            if (keyElement) keyElement.classList.add('active');
        } else if (mappedKey === 'space') {
            const keyElement = document.querySelector('.key-spacebar');
            if (keyElement) keyElement.classList.add('active');
            handleSpacebarPress();
        }
    }
    
    if (key === ' ') {  // Spacebar
        // const currentPos = progress % 1.0;
        // const milestones = [0.20, 0.45, 0.70, 0.95];
        // const nextMilestone = milestones.find(m => m > currentPos) || milestones[0];
        // targetProgress = nextMilestone;
    }
});

document.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    const keyMap = {
        'w': 'w',
        's': 's',
        'a': 'a',
        'd': 'd',
        ' ': 'space',
        'arrowup': 'arrowup',
        'arrowdown': 'arrowdown',
        'arrowleft': 'arrowleft',
        'arrowright': 'arrowright'
    };
    
    const mappedKey = keyMap[key];
    if (mappedKey) {
        keyState[mappedKey] = false;
        // Find corresponding visual key for WASD only
        if ('wasd'.includes(mappedKey)) {
            const keyElement = document.querySelector(`.key-${mappedKey}`);
            if (keyElement) keyElement.classList.remove('active');
        } else if (mappedKey === 'space') {
            const keyElement = document.querySelector('.key-spacebar');
            if (keyElement) keyElement.classList.remove('active');
        }
    }
});

// Touch/mouse controls
function setupTouchControls() {
    const keys = document.querySelectorAll('.key');
    console.log('Found keys:', keys.length);
    
    function handleStart(event, key) {
        event.preventDefault();
        const keyClass = Array.from(key.classList).find(c => c.startsWith('key-'));
        console.log('Key pressed:', keyClass);
        if (!keyClass) return;
        
        const keyName = keyClass.replace('key-', '');
        const mappedKey = keyName === 'spacebar' ? 'space' : keyName;
        console.log('Mapped key:', mappedKey);
        
        key.classList.add('active');
        keyState[mappedKey] = true;
        console.log('Key states:', keyState);
        
        if (mappedKey === 'space') {
            handleSpacebarPress();
        }
    }
    
    function handleEnd(event, key) {
        event.preventDefault();
        const keyClass = Array.from(key.classList).find(c => c.startsWith('key-'));
        console.log('Key released:', keyClass);
        if (!keyClass) return;
        
        const keyName = keyClass.replace('key-', '');
        const mappedKey = keyName === 'spacebar' ? 'space' : keyName;
        console.log('Mapped key released:', mappedKey);
        
        key.classList.remove('active');
        keyState[mappedKey] = false;
        console.log('Key states after release:', keyState);
    }
    
    keys.forEach(key => {
        // Mouse events
        key.addEventListener('mousedown', (e) => handleStart(e, key));
        key.addEventListener('mouseup', (e) => handleEnd(e, key));
        key.addEventListener('mouseleave', (e) => handleEnd(e, key));
        
        // Touch events
        key.addEventListener('touchstart', (e) => handleStart(e, key));
        key.addEventListener('touchend', (e) => handleEnd(e, key));
        key.addEventListener('touchcancel', (e) => handleEnd(e, key));
    });
}

// Initialize touch controls
setupTouchControls();

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    handleKeyState();  // Handle key states every frame
    updateParticles();
    updateCamera();
    
    // Update shader time
    trackMaterial.uniforms.time.value += 0.03;
    
    composer.render();
    css3dRenderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

// Set initial camera position and start animation
updateCamera();
animate();

// Handle mouse wheel
document.addEventListener('wheel', (event) => {
    const delta = event.deltaY * 0.0002;
    targetProgress += delta;  
});

// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    labelRenderer.setSize(width, height);
    css3dRenderer.setSize(width, height);
    composer.setSize(width, height);
});

function handleSpacebarPress() {
    const currentPos = progress % 1.0;
    const epsilon = 0.01; // Increased from 0.001
    const nextMilestoneIndex = milestones.findIndex(m => Math.abs(m.position - currentPos) < epsilon);
    console.log('Current milestone index:', nextMilestoneIndex);
    
    // Get next milestone index
    const nextIndex = (nextMilestoneIndex === -1) 
        ? milestones.findIndex(m => m.position > currentPos)
        : (nextMilestoneIndex + 1) % milestones.length;
    console.log('Next milestone index:', nextIndex);
    
    // Get next milestone value
    const nextMilestone = milestones[nextIndex].position;
    console.log('Next milestone:', nextMilestone);
    
    // If we're wrapping around to the beginning
    if (nextIndex === 0) {
        targetProgress = Math.ceil(progress) + nextMilestone;
        console.log('Wrapping to next cycle:', targetProgress);
    } else {
        targetProgress = Math.floor(progress) + nextMilestone;
        console.log('Moving to next milestone:', targetProgress);
    }
}
