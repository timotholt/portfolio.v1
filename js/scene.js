// Scene setup and management
export function createScene(THREE) {
    // Create scene and camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Initialize renderers
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
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

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Add subtle blue point light for atmosphere
    const pointLight = new THREE.PointLight(0x4444ff, 1.0, 100);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    // Post-processing setup
    const composer = new THREE.EffectComposer(renderer);
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        2.0,    // Stronger bloom intensity
        0.5,    // Moderate radius
        0.1     // Lower threshold for more glow
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
        composer.setSize(width, height);
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
