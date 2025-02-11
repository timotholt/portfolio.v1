// Scene setup and management
import { createBuilding } from './buildings.js';

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

    // Create a grid of buildings
    const buildingGrid = [];
    const gridSize = 3;  // Reduced from 5
    const spacing = 80;  // Increased spacing
    
    for(let x = -gridSize; x <= gridSize; x++) {
        for(let z = -gridSize; z <= gridSize; z++) {
            // Skip more positions randomly to create gaps
            if(Math.random() < 0.4) continue;  // Increased skip chance
            
            const height = 50 + Math.random() * 150;
            const width = 20 + Math.random() * 20;
            const building = createBuilding(THREE, {
                width: width,
                height: height,
                depth: width,
                windowRows: Math.floor(height/8),  // Reduced window density
                windowCols: 3,  // Reduced from 4
                color: 0x001133,
                emissiveColor: 0x00ffcc,
                emissiveIntensity: 0.5
            });
            
            building.position.set(
                x * spacing + (Math.random() - 0.5) * 20,
                height/2,
                z * spacing + (Math.random() - 0.5) * 20
            );
            
            building.rotation.y = Math.random() * Math.PI * 2;
            scene.add(building);
            buildingGrid.push(building);
        }
    }

    // Post-processing setup
    const composer = new THREE.EffectComposer(renderer);
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth * 0.5, window.innerHeight * 0.5),  
        1.2,    
        0.5,    
        0.3     
    );
    composer.addPass(bloomPass);

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

    // Render function
    function render() {
        composer.render();
        css3dRenderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    }

    return {
        scene,
        camera,
        renderer,
        css3dRenderer,
        labelRenderer,
        composer,
        render
    };
}
