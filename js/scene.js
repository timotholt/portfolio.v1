// Scene setup and management
import { createBuilding } from './buildings.js';
import { createCityGrid } from './cityblocks.js';

export function createScene(THREE) {
    // Create scene and camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // Add fog for atmosphere
    scene.fog = new THREE.FogExp2(0x000000, 0.002);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);

    // Initialize renderers
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio
    document.getElementById('portfolio-container').appendChild(renderer.domElement);

    const css3dRenderer = new THREE.CSS3DRenderer();
    css3dRenderer.setSize(window.innerWidth, window.innerHeight);
    css3dRenderer.domElement.style.position = 'absolute';
    css3dRenderer.domElement.style.top = 0;
    css3dRenderer.domElement.style.pointerEvents = 'none';
    document.getElementById('portfolio-container').appendChild(css3dRenderer.domElement);

    const labelRenderer = new THREE.CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = 0;
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.getElementById('portfolio-container').appendChild(labelRenderer.domElement);

    // Setup lighting
    const ambientLight = new THREE.AmbientLight(0x111111, 0.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x4444ff, 0.3);  // More blue tint
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Add multiple colored point lights for atmosphere
    const pointLights = [
        { color: 0x4444ff, intensity: 1.0, distance: 200, position: [0, 50, 0] },
        { color: 0x00ffcc, intensity: 0.8, distance: 150, position: [100, 30, 100] },
        { color: 0xff00ff, intensity: 0.6, distance: 150, position: [-100, 40, -100] }
    ];

    pointLights.forEach(light => {
        const pointLight = new THREE.PointLight(light.color, light.intensity, light.distance);
        pointLight.position.set(...light.position);
        scene.add(pointLight);
    });

    // Create a city grid
    const cityGrid = createCityGrid(THREE);
    scene.add(cityGrid);

    // Add a global flag to control bloom
    const ENABLE_BLOOM = false;  // Set to true to enable bloom

    // Post-processing setup
    const composer = new THREE.EffectComposer(renderer);
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Only add bloom pass if ENABLE_BLOOM is true
    let bloomPass;
    if (ENABLE_BLOOM) {
        bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth * 0.5, window.innerHeight * 0.5),  
            1.2,    // Reduced from previous value
            0.5,    
            0.1     // Lowered threshold
        );
        composer.addPass(bloomPass);
    }

    // Modify render function to use standard renderer if bloom is disabled
    function render() {
        if (ENABLE_BLOOM) {
            composer.render();
        } else {
            renderer.render(scene, camera);
        }
        css3dRenderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    }

    // Handle window resize
    function handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
        css3dRenderer.setSize(width, height);
        labelRenderer.setSize(width, height);
        composer.setSize(width * 0.5, height * 0.5);  
    }
    window.addEventListener('resize', handleResize);

    return {
        scene,
        camera,
        renderer,
        css3dRenderer,
        labelRenderer,
        composer: ENABLE_BLOOM ? composer : null,
        render
    };
}
