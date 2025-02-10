// Create the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Set up the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Create the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('portfolio-container').appendChild(renderer.domElement);

// Set up post-processing
const composer = new THREE.EffectComposer(renderer);
const renderPass = new THREE.RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    2.5,    // Increased bloom intensity from 1.5
    0.6,    // Increased bloom radius from 0.4
    0.4     // Decreased threshold from 0.85 to allow more elements to glow
);
composer.addPass(bloomPass);

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 1, 0);
scene.add(directionalLight);

// Create a spline path
const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-20, 0, 0),
    new THREE.Vector3(-15, 5, -5),
    new THREE.Vector3(-10, 10, 0),
    new THREE.Vector3(-5, 5, 5),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(5, -5, -5),
    new THREE.Vector3(10, -10, 0),
    new THREE.Vector3(15, -5, 5),
    new THREE.Vector3(20, 0, 0)
]);

// Create track geometry
const segments = 200;
const trackWidth = 0.4;
const trackThickness = 0.1;
const trackGeometry = new THREE.BufferGeometry();
const vertices = [];
const indices = [];

for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const normal = new THREE.Vector3(0, 1, 0);
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    
    vertices.push(
        point.x + binormal.x * trackWidth/2, point.y + trackThickness/2, point.z + binormal.z * trackWidth/2,
        point.x - binormal.x * trackWidth/2, point.y + trackThickness/2, point.z - binormal.z * trackWidth/2,
        point.x + binormal.x * trackWidth/2, point.y - trackThickness/2, point.z + binormal.z * trackWidth/2,
        point.x - binormal.x * trackWidth/2, point.y - trackThickness/2, point.z - binormal.z * trackWidth/2
    );

    if (i < segments) {
        const baseIndex = i * 4;
        indices.push(baseIndex, baseIndex + 1, baseIndex + 5);
        indices.push(baseIndex, baseIndex + 5, baseIndex + 4);
        indices.push(baseIndex + 2, baseIndex + 7, baseIndex + 3);
        indices.push(baseIndex + 2, baseIndex + 6, baseIndex + 7);
        indices.push(baseIndex, baseIndex + 2, baseIndex + 4);
        indices.push(baseIndex + 2, baseIndex + 6, baseIndex + 4);
        indices.push(baseIndex + 1, baseIndex + 3, baseIndex + 5);
        indices.push(baseIndex + 3, baseIndex + 7, baseIndex + 5);
    }
}

trackGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
trackGeometry.setIndex(indices);
trackGeometry.computeVertexNormals();

// Create track material
const trackMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 2.0,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
});

const track = new THREE.Mesh(trackGeometry, trackMaterial);
scene.add(track);

// Create rings
const ringGeometry = new THREE.TorusGeometry(0.5, 0.02, 16, 32);
const ringMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xffaa00,
    emissive: 0xffaa00,
    emissiveIntensity: 2.0,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
});

for(let i = 0; i <= 8; i++) {
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    const point = curve.getPoint(i / 8);
    const tangent = curve.getTangent(i / 8);
    ring.position.copy(point);
    ring.lookAt(point.clone().add(tangent));
    scene.add(ring);
}

// Create star field
const starsGeometry = new THREE.BufferGeometry();
const starsMaterial = new THREE.PointsMaterial({ 
    color: 0xffffff, 
    size: 1,
    sizeAttenuation: false
});

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
}

starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// Create particles
const particlesCount = 1000;
const particlesGeometry = new THREE.BufferGeometry();
const particlesMaterial = new THREE.PointsMaterial({
    color: 0xaaaaff,
    size: 0.5,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8
});

const particlePositions = new Float32Array(particlesCount * 3);
const particleVelocities = new Float32Array(particlesCount * 3);
const tubeRadius = 20;
const tubeLength = 100;

for (let i = 0; i < particlesCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * tubeRadius;
    const z = (Math.random() * 2 - 1) * tubeLength;
    
    particlePositions[i * 3] = Math.cos(angle) * r;
    particlePositions[i * 3 + 1] = Math.sin(angle) * r;
    particlePositions[i * 3 + 2] = z;
    
    particleVelocities[i * 3] = (Math.random() - 0.5) * 0.005;
    particleVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
    particleVelocities[i * 3 + 2] = -Math.random() * 0.02;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// Camera controls
let progress = 0;
let targetProgress = 0;
const cameraOffset = new THREE.Vector3(0, 0.5, 0);

function updateCamera() {
    progress += (targetProgress - progress) * 0.1;
    const point = curve.getPoint(progress);
    const lookAhead = curve.getPoint(Math.min(progress + 0.01, 1));
    lookAhead.y += 0.1; 
    camera.position.copy(point).add(cameraOffset);
    camera.lookAt(lookAhead);
}

// Update particles
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

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    updateParticles();
    updateCamera();
    composer.render();  
}

// Set initial camera position and start animation
updateCamera();
animate();

// Handle mouse wheel
document.addEventListener('wheel', (event) => {
    const delta = event.deltaY * 0.0002;
    targetProgress = Math.max(0, Math.min(1, targetProgress + delta));
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);  
});
