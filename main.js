// Create the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Create layers for bloom effect
const BLOOM_LAYER = 1;
const NORMAL_LAYER = 0;

// Set up the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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
    new THREE.Vector3(20, 0, 0),
    new THREE.Vector3(15, 5, -5),
    new THREE.Vector3(10, 10, 0),
    new THREE.Vector3(5, 5, 5),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-5, -5, -5),
    new THREE.Vector3(-10, -10, 0),
    new THREE.Vector3(-15, -5, 5)
    // new THREE.Vector3(-20, 0, 0)
], true);  // Set to true for closed loop

// Create track geometry
const segments = 200;
const trackWidth = 0.4;
const trackThickness = 0.1;
const trackGeometry = new THREE.BufferGeometry();
const vertices = [];
const indices = [];
const uvs = [];  

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
    
    uvs.push(
        t * 10, 1,  
        t * 10, 0,  
        t * 10, 1,  
        t * 10, 0   
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
trackGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));  
trackGeometry.setIndex(indices);
trackGeometry.computeVertexNormals();

// Create track material with animated shader
const trackMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        opacity: { value: 0.5 }  
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform float opacity;
        varying vec2 vUv;
        
        void main() {
            // Create moving chevron pattern
            float v = vUv.x * 20.0 + time;  
            float chevron = abs(fract(v) * 2.0 - 1.0);
            chevron = step(chevron, 0.5);
            
            // Output color 
            gl_FragColor = vec4(0.6, 0.1, 0.1, chevron * opacity);
        }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const track = new THREE.Mesh(trackGeometry, trackMaterial);
scene.add(track);

// Create text label
function createTextSprite(text) {
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = text;
    return new THREE.CSS2DObject(label);
}

// Create rings array to store references
const rings = [];
const ringLabels = [];
const ringConnectors = [];  // Store connecting lines
const ringGeometry = new THREE.TorusGeometry(0.5, 0.02, 16, 32);
const ringMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffd700,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending
});

// Line material for connectors
const connectorMaterial = new THREE.LineBasicMaterial({
    color: 0x4dfff3,
    transparent: true,
    opacity: 0.6,
    depthTest: false,
    blending: THREE.NormalBlending  // Changed from AdditiveBlending to prevent bloom
});

// Create rings at milestone positions
const milestones = [0.20, 0.45, 0.70, 0.95];
const milestoneNames = ["EDUCATION", "EXPERIENCE", "PROJECTS", "CONTACT"];
const minOpacity = 0.05;   // Dimmer when far
const maxOpacity = 0.7;    // Less bright when close
const startFade = 0.08;    // Start fading sooner
const fadeRange = 0.15;    // Faster fade

milestones.forEach((milestone, index) => {
    const point = curve.getPointAt(milestone);
    const tangent = curve.getTangentAt(milestone);
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial.clone());
    ring.position.copy(point);
    ring.lookAt(point.clone().add(tangent));
    rings.push(ring);
    scene.add(ring);
    
    // Add text label
    const label = createTextSprite(milestoneNames[index]);
    label.position.copy(point);
    ringLabels.push(label);
    scene.add(label);
    
    // Create connector line
    const linePositions = new Float32Array(6); // Two points, xyz each
    const connectorGeometry = new THREE.BufferGeometry();
    connectorGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const connector = new THREE.Line(connectorGeometry, connectorMaterial);
    connector.renderOrder = 1;  // Render after rings
    ringConnectors.push(connector);
    scene.add(connector);
});

// Update rings opacity based on track distance
function updateRingsOpacity() {
    const wrappedProgress = ((progress % 1.0) + 1.0) % 1.0;  // Same wrapping as camera
    
    rings.forEach((ring, index) => {
        const milestone = milestones[index];
        
        // Calculate shortest distance along track (handling wraparound)
        let trackDistance = Math.abs(milestone - wrappedProgress);
        if (trackDistance > 0.5) {
            trackDistance = 1 - trackDistance;
        }
        
        // Update ring opacity and color
        if (trackDistance <= startFade) {
            ring.material.opacity = maxOpacity;
            const whiteBlend = 1 - (trackDistance / startFade);
            const color = new THREE.Color(0xffd700);
            color.lerp(new THREE.Color(0xffffff), whiteBlend * 0.5);
            ring.material.color = color;
        } else if (trackDistance <= startFade + fadeRange) {
            const fadeValue = Math.pow(1 - ((trackDistance - startFade) / fadeRange), 3);
            ring.material.opacity = minOpacity + (maxOpacity - minOpacity) * fadeValue;
            ring.material.color.setHex(0xffd700);
        } else {
            ring.material.opacity = minOpacity;
            ring.material.color.setHex(0xffd700);
        }
        
        // Project ring center and edge to screen space
        const ringCenter = ring.position.clone();
        const screenCenter = ringCenter.clone().project(camera);
        
        // Project ring edge point (0.5 units = ring radius)
        const edgePoint = ringCenter.clone().add(new THREE.Vector3(0.5, 0, 0));
        const screenEdge = edgePoint.clone().project(camera);
        
        // Calculate ring radius in screen space
        const ringScreenRadius = new THREE.Vector2(
            screenEdge.x - screenCenter.x,
            screenEdge.y - screenCenter.y
        ).length();
        
        // Calculate distance-based damping (less scaling when close)
        const cameraDistance = camera.position.distanceTo(ring.position);
        const damping = Math.min(cameraDistance / 5, 1); // Full damping at 5 units or closer
        
        // Base the offset on the ring's screen size with damping, but ensure we stay outside
        const minOffset = Math.max(ringScreenRadius * (1.2 + damping * 0.8), 0.05);
        const rightOffset = minOffset * 2; // twice to the right
        const upOffset = minOffset;
        
        // Get camera's right and up vectors in world space
        const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const cameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        
        // Project points 1 unit right and up from ring center
        const rightPoint = ringCenter.clone().add(cameraRight);
        const upPoint = ringCenter.clone().add(cameraUp);
        const screenRight = rightPoint.clone().project(camera);
        const screenUp = upPoint.clone().project(camera);
        
        // Calculate screen-space vectors
        const rightVector = new THREE.Vector2(
            screenRight.x - screenCenter.x,
            screenRight.y - screenCenter.y
        ).normalize();
        
        const upVector = new THREE.Vector2(
            screenUp.x - screenCenter.x,
            screenUp.y - screenCenter.y
        ).normalize();
        
        // Combine the offsets using camera orientation
        const offsetX = rightVector.x * rightOffset + upVector.x * upOffset;
        const offsetY = rightVector.y * rightOffset + upVector.y * upOffset;
        
        // Get label dimensions in screen space
        const currentLabel = ringLabels[index];
        const labelRect = currentLabel.element.getBoundingClientRect();
        const labelWidth = (labelRect.width / window.innerWidth) * 2;
        const labelHeight = (labelRect.height / window.innerHeight) * 2;
        
        // Calculate screen position and clamp to viewport (accounting for label size)
        const margin = 0.05; // 5% margin from edges
        const screenX = Math.max(
            -1 + labelWidth/2 + margin, 
            Math.min(1 - labelWidth/2 - margin, 
            screenCenter.x + offsetX)
        );
        const screenY = Math.max(
            -1 + labelHeight/2 + margin, 
            Math.min(1 - labelHeight/2 - margin, 
            screenCenter.y + offsetY)
        );
        
        // Calculate label position from clamped screen coordinates
        const labelPos = new THREE.Vector3(
            screenX,
            screenY,
            screenCenter.z
        ).unproject(camera);
        
        // Update label position
        const label = ringLabels[index];
        label.position.copy(labelPos);
        
        // Update connector line
        const connector = ringConnectors[index];
        const positions = connector.geometry.attributes.position.array;
        
        // Start at ring position
        positions[0] = ring.position.x;
        positions[1] = ring.position.y;
        positions[2] = ring.position.z;
        
        // End at label position
        positions[3] = labelPos.x;
        positions[4] = labelPos.y;
        positions[5] = labelPos.z;
        
        connector.geometry.attributes.position.needsUpdate = true;
    });
}

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
    const brightness = 0.2 + Math.random() * 0.8;  // Back to original range
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

// Camera controls
let progress = 0;
let targetProgress = 0;
let cameraRotationOffset = 0;  // Current camera rotation offset
const cameraOffset = new THREE.Vector3(0, 0.5, 0);
const ROTATION_SPEED = 0.05;  // How fast to rotate
const ROTATION_RETURN_SPEED = 0.1;  // How fast to return to center
let isRotatingLeft = false;
let isRotatingRight = false;

function updateCamera() {
    progress += (targetProgress - progress) * 0.03;  
    const wrappedProgress = ((progress % 1.0) + 1.0) % 1.0;  // Always positive
    const point = curve.getPointAt(wrappedProgress);  
    const lookAhead = curve.getPointAt((wrappedProgress + 0.01) % 1.0);
    
    // Update camera rotation
    if (isRotatingLeft) {
        cameraRotationOffset -= ROTATION_SPEED;
    } else if (isRotatingRight) {
        cameraRotationOffset += ROTATION_SPEED;
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
        const milestones = [
            { progress: 0.20, name: "[ EDUCATION ]" },
            { progress: 0.45, name: "[ EXPERIENCE ]" },
            { progress: 0.70, name: "[ PROJECTS ]" },
            { progress: 0.95, name: "[ CONTACT ]" }
        ];
        
        // Find next milestone
        const nextMilestone = milestones.find(m => m.progress > wrappedProgress) || milestones[0];
        let distance = Math.abs(nextMilestone.progress - wrappedProgress);
        if (distance > 0.5) distance = 1 - distance;  // Use same wraparound logic as rings
        milestoneElement.textContent = (distance * 100).toFixed(2);
        milestoneNameElement.textContent = nextMilestone.name;

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
    
    updateRingsOpacity();
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

// Handle keyboard controls
let lastKeyTime = 0;
document.addEventListener('keydown', (event) => {
    const now = Date.now();
    if (now - lastKeyTime < 16) return; // Skip if less than 16ms (60fps) since last key
    lastKeyTime = now;
    
    const speed = 0.007;  
    switch(event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            targetProgress += speed;
            break;
        case 's':
        case 'arrowdown':
            targetProgress -= speed;
            break;
        case 'a':
        case 'arrowleft':
            isRotatingLeft = true;
            break;
        case 'd':
        case 'arrowright':
            isRotatingRight = true;
            break;
        case ' ':  // Spacebar
            const currentPos = progress % 1.0;
            const milestones = [0.20, 0.45, 0.70, 0.95];
            const nextMilestone = milestones.find(m => m > currentPos) || milestones[0];
            targetProgress = nextMilestone;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch(event.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
            isRotatingLeft = false;
            break;
        case 'd':
        case 'arrowright':
            isRotatingRight = false;
            break;
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    updateParticles();
    updateCamera();
    updateRingsOpacity();
    
    // Update shader time
    trackMaterial.uniforms.time.value += 0.03;
    
    composer.render();
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
    composer.setSize(width, height);
});
