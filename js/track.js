// Create and manage the track in the scene
export function createTrack(THREE, scene) {
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
    track.renderOrder = 1;  // Render after webpage
    scene.add(track);

    return {
        track,
        curve,
        material: trackMaterial
    };
}
