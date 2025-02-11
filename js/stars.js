// Create and manage the star field in the scene
export function createStarField(THREE, scene) {
    // Create star field
    const starsGeometry = new THREE.BufferGeometry();
    const starsColors = new Float32Array(50000 * 3);
    const starsVertices = [];
    const radius = 1000;
    const starsCount = 50000;

    for (let i = 0; i < starsCount; i++) {
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        starsVertices.push(x, y, z);
        
        // Calculate distance from center for brightness
        const distFromCenter = Math.sqrt(x*x + y*y + z*z) / radius;
        const centerBrightness = 1 - (distFromCenter * 0.4);  // Changed to 0.4 to make edge stars 60% brightness
        
        // Add random individual star brightness
        const randomBrightness = 0.2 + Math.random() * 0.8;  // Each star gets random brightness between 0.2 and 1.0
        
        // Combine both effects
        const brightness = centerBrightness * randomBrightness;
        
        starsColors[i * 3] = brightness;
        starsColors[i * 3 + 1] = brightness;
        starsColors[i * 3 + 2] = brightness;
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starsColors, 3));

    const starsMaterial = new THREE.PointsMaterial({ 
        color: 0xffffff,
        size: 1,
        sizeAttenuation: false,
        vertexColors: true,
        opacity: 0.9,
        transparent: true
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Create circular sprite texture for particles
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    const particleTexture = new THREE.CanvasTexture(canvas);

    // Create particles
    const particlesCount = 12000;  // Tripled from 4000
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesColors = new Float32Array(particlesCount * 3);
    const particlePositions = new Float32Array(particlesCount * 3);
    const particleVelocities = new Float32Array(particlesCount * 3);
    const particleSizes = new Float32Array(particlesCount);
    const tubeRadius = 30; 
    const tubeLength = 150; 

    for (let i = 0; i < particlesCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * tubeRadius;
        const z = (Math.random() * 2 - 1) * tubeLength;
        
        particlePositions[i * 3] = Math.cos(angle) * r;
        particlePositions[i * 3 + 1] = Math.sin(angle) * r;
        particlePositions[i * 3 + 2] = z;
        
        particleVelocities[i * 3] = (Math.random() - 0.5) * 0.002;
        particleVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
        particleVelocities[i * 3 + 2] = -Math.random() * 0.01;
        
        // Random brightness like the stars
        const brightness = 0.2 + Math.random() * 0.8;  // Each star gets random brightness between 0.2 and 1.0
        
        particlesColors[i * 3] = brightness;
        particlesColors[i * 3 + 1] = brightness;
        particlesColors[i * 3 + 2] = brightness;
        
        particleSizes[i] = Math.random() * 0.3 + 0.1;  // Halved from (random * 0.6 + 0.2)
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particlesColors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.2,  // Halved from 0.4
        sizeAttenuation: true,
        map: particleTexture,
        transparent: true,
        opacity: 0.35,  // Halved from 0.7
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Update particles function
    function updateParticles() {
        const positions = particlesGeometry.attributes.position.array;
        
        for (let i = 0; i < particlesCount; i++) {
            positions[i * 3] += particleVelocities[i * 3];
            positions[i * 3 + 1] += particleVelocities[i * 3 + 1];
            positions[i * 3 + 2] += particleVelocities[i * 3 + 2];
            
            if (positions[i * 3 + 2] < -tubeLength) {
                positions[i * 3] = Math.cos(Math.random() * Math.PI * 2) * (Math.random() * tubeRadius);
                positions[i * 3 + 1] = Math.sin(Math.random() * Math.PI * 2) * (Math.random() * tubeRadius);
                positions[i * 3 + 2] = tubeLength;
            }
        }
        
        particlesGeometry.attributes.position.needsUpdate = true;
    }

    return {
        stars,
        particles,
        updateParticles
    };
}
