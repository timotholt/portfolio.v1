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

// Import and create controls
import { createControls } from './js/controls.js';
const { handleKeyState, updateCamera, getProgress } = createControls(THREE, camera, curve, milestones);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    handleKeyState();  // Handle key states every frame
    updateParticles();
    const wrappedProgress = updateCamera();
    
    // Update components
    updateHUD(wrappedProgress);
    updateRingsOpacity(getProgress());
    
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
