// Wait for Three.js to be loaded
if (typeof THREE === 'undefined') {
    console.error('Three.js not loaded! Please check your script tags.');
    throw new Error('Three.js not loaded');
}

// Import and create scene
import { createScene } from './js/scene.js';
const { scene, camera, renderer, css3dRenderer, composer, render } = createScene(THREE);

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

// Import and create HUD
import { createHUD } from './js/hud.js';
const { updateHUD } = createHUD(milestones);

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

    // Update HUD and rings
    updateHUD(wrappedProgress);
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
    
    // Render the scene
    render();
}

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
    css3dRenderer.setSize(width, height);
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
