// Function to create and manage a webpage in the scene
export function createWebPage(THREE, scene) {
    // Create a canvas for the webpage texture
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    // Create webpage texture
    const webpageTexture = new THREE.CanvasTexture(canvas);
    webpageTexture.minFilter = THREE.LinearFilter;
    webpageTexture.magFilter = THREE.LinearFilter;

    // Function to update the texture
    function updateTexture() {
        // Clear canvas
        ctx.fillStyle = 'rgba(0, 40, 30, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw text
        ctx.fillStyle = 'rgba(0, 255, 200, 1)';
        ctx.font = '24px Consolas';
        ctx.fillText('Test Web Page', 20, 40);
        ctx.font = '16px Consolas';
        ctx.fillText('This is rendered directly on a canvas', 20, 80);
        ctx.fillText('Current time: ' + new Date().toLocaleTimeString(), 20, 120);

        // Add some cyberpunk effects
        ctx.strokeStyle = 'rgba(0, 255, 200, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        
        // Update texture
        webpageTexture.needsUpdate = true;
    }

    // Create a plane with the webpage texture
    const planeGeometry = new THREE.PlaneGeometry(500, 300);
    const planeMaterial = new THREE.MeshStandardMaterial({
        map: webpageTexture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        metalness: 0.1,
        roughness: 0.8,
        emissive: 0x002010,
        emissiveIntensity: 0.2,
        depthWrite: true,
        depthTest: true,
        alphaTest: 0.1
    });
    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.position.set(0, 200, -500);
    planeMesh.rotation.x = -0.2;
    planeMesh.renderOrder = 0;  // Render first
    scene.add(planeMesh);

    // Start updating
    setInterval(updateTexture, 1000);
    updateTexture();

    return { planeMesh, updateTexture };
}
