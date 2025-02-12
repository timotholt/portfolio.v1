// Building generation and management
// Shared geometries and materials for performance
const sharedGeometries = new Map();
const sharedMaterials = new Map();

// Create shared window geometry with vertex colors if it doesn't exist
let sharedWindowGeometry = null;

export function createBuilding(THREE) {
    // Initialize shared window geometry if not already done
    if (!sharedWindowGeometry) {
        const geometry = new THREE.BufferGeometry();
        
        // Vertices for a simple plane (2 triangles)
        const vertices = new Float32Array([
            -0.5, -0.5, 0,  // bottom left
            0.5, -0.5, 0,   // bottom right
            0.5, 0.5, 0,    // top right
            -0.5, -0.5, 0,  // bottom left
            0.5, 0.5, 0,    // top right
            -0.5, 0.5, 0    // top left
        ]);
        
        // UVs
        const uvs = new Float32Array([
            0, 0,
            1, 0,
            1, 1,
            0, 0,
            1, 1,
            0, 1
        ]);
        
        // Vertex colors (will be modified per instance)
        const colors = new Float32Array([
            1, 1, 1,  // bottom left
            1, 1, 1,  // bottom right
            1, 1, 1,  // top right
            1, 1, 1,  // bottom left
            1, 1, 1,  // top right
            1, 1, 1   // top left
        ]);
        
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        sharedWindowGeometry = geometry;
    }

    // Generate building parameters
    const windowWidth = 2 + Math.random() * 4;
    const windowHeight = 4 + Math.random() * 6;
    const gutterSize = ((windowWidth + windowHeight) / 2) * (0.5 * Math.random());
    const padding = gutterSize;
    const numFloors = Math.floor(Math.random() * 30) + 1;

    // First decide building widths
    const desiredWidthA = 20 + Math.random() * 40; // 20-60 units wide
    const desiredWidthB = 20 + Math.random() * 40;

    // Calculate how many rooms can fit in each width
    const roomsPerSideA = Math.max(4, Math.floor((desiredWidthA - 2 * padding) / (windowWidth + gutterSize)));
    const roomsPerSideB = Math.max(4, Math.floor((desiredWidthB - 2 * padding) / (windowWidth + gutterSize)));

    // Now calculate actual building dimensions based on room count
    const buildingWidthSideA = padding + (roomsPerSideA * windowWidth) + (gutterSize * (roomsPerSideA - 1)) + padding;
    const buildingWidthSideB = padding + (roomsPerSideB * windowWidth) + (gutterSize * (roomsPerSideB - 1)) + padding;

    // Calculate building height
    const buildingHeight = 
        padding + 
        (numFloors * windowHeight) + 
        (gutterSize * (numFloors - 1)) + 
        padding;

    // Determine building type based on physical characteristics
    const isModernBuilding = gutterSize < 0.3 && padding < 0.5;
    
    // Create window materials for different light levels
    const materialLevels = [
        new THREE.MeshPhongMaterial({  // dim
            color: 0x00ffcc,
            emissive: 0x00ffcc,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            side: THREE.DoubleSide
        }),
        new THREE.MeshPhongMaterial({  // low
            color: 0x00ffcc,
            emissive: 0x00ffcc,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            side: THREE.DoubleSide
        }),
        new THREE.MeshPhongMaterial({  // medium
            color: 0x00ffcc,
            emissive: 0x00ffcc,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            side: THREE.DoubleSide
        }),
        new THREE.MeshPhongMaterial({  // bright
            color: 0x00ffcc,
            emissive: 0x00ffcc,
            emissiveIntensity: 1.2,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            side: THREE.DoubleSide
        })
    ];

    // Building policy
    const buildingPolicy = {
        baseLevel: isModernBuilding ? 1 : 2,  // Modern buildings dimmer
        conformity: isModernBuilding ? 0.95 : 0.7
    };

    console.log(`Building Details:
    Modern: ${isModernBuilding}
    Policy: Level ${buildingPolicy.baseLevel} (${buildingPolicy.conformity * 100}% conformity)
    Height: ${buildingHeight}
    Width Side A: ${buildingWidthSideA}
    Width Side B: ${buildingWidthSideB}
    Rooms Side A: ${roomsPerSideA}
    Rooms Side B: ${roomsPerSideB}
    Window Size: ${windowWidth.toFixed(2)} x ${windowHeight.toFixed(2)}
    Gutter Size: ${gutterSize.toFixed(2)}
    Padding: ${padding.toFixed(2)}`);

    // Create building group
    const building = new THREE.Group();

    // Create building mesh
    const buildingGeometry = new THREE.BoxGeometry(buildingWidthSideA, buildingHeight, buildingWidthSideB);
    const buildingMaterial = new THREE.MeshPhongMaterial({
        color: isModernBuilding ? 0x444444 : 0x666666,
        shininess: isModernBuilding ? 100 : 10,
        depthWrite: true,
        depthTest: true
    });
    const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.add(buildingMesh);

    // Create window material that uses vertex colors
    const windowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffcc,
        transparent: true,
        opacity: 1.0,
        vertexColors: true,
        side: THREE.DoubleSide
    });

    const windowsSideA = new THREE.InstancedMesh(
        sharedWindowGeometry,
        windowMaterial,
        roomsPerSideA * numFloors * 2  // *2 for front and back
    );

    const windowsSideB = new THREE.InstancedMesh(
        sharedWindowGeometry,
        windowMaterial.clone(),
        roomsPerSideB * numFloors * 2  // *2 for left and right
    );

    const color = new THREE.Color();
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(windowWidth, windowHeight, 1);
    let brightness = 0;

    // Create windows for front and back (side A)
    let instanceIndex = 0;
    
    // Front face (Z+)
    quaternion.setFromEuler(new THREE.Euler(0, 0, 0));

    for (let floor = 0; floor < numFloors; floor++) {
        const y = -buildingHeight/2 + padding + floor * (windowHeight + gutterSize) + windowHeight/2;
        
        for (let room = 0; room < roomsPerSideA; room++) {
            const x = -buildingWidthSideA/2 + padding + room * (windowWidth + gutterSize) + windowWidth/2;
            const z = buildingWidthSideB/2 + 0.1;
            
            // Window brightness based on building policy
            if (Math.random() > buildingPolicy.conformity) {
                const level = Math.floor(Math.random() * 4);  // 0-3 levels
                brightness = 0.3 + (level * 0.3);  // 0.3 to 1.2
            } else {
                brightness = 0.3 + (buildingPolicy.baseLevel * 0.3) + (Math.random() * 0.2 - 0.1);
            }
            
            // Some windows are completely dark
            if (Math.random() < 0.1) brightness = 0;
            
            // Set color with cyan tint
            color.setRGB(0, brightness, brightness);
            position.set(x, y, z);
            matrix.compose(position, quaternion, scale);
            windowsSideA.setMatrixAt(instanceIndex, matrix);
            windowsSideA.setColorAt(instanceIndex, color);
            instanceIndex++;
        }
    }
    
    // Back face (Z-)
    quaternion.setFromEuler(new THREE.Euler(0, Math.PI, 0));
    
    for (let floor = 0; floor < numFloors; floor++) {
        const y = -buildingHeight/2 + padding + floor * (windowHeight + gutterSize) + windowHeight/2;
        
        for (let room = 0; room < roomsPerSideA; room++) {
            const x = -buildingWidthSideA/2 + padding + room * (windowWidth + gutterSize) + windowWidth/2;
            const z = -buildingWidthSideB/2 - 0.1;
            
            // Window brightness based on building policy
            if (Math.random() > buildingPolicy.conformity) {
                const level = Math.floor(Math.random() * 4);  // 0-3 levels
                brightness = 0.3 + (level * 0.3);  // 0.3 to 1.2
            } else {
                brightness = 0.3 + (buildingPolicy.baseLevel * 0.3) + (Math.random() * 0.2 - 0.1);
            }
            
            // Some windows are completely dark
            if (Math.random() < 0.1) brightness = 0;
            
            // Set color with cyan tint
            color.setRGB(0, brightness, brightness);
            position.set(x, y, z);
            matrix.compose(position, quaternion, scale);
            windowsSideA.setMatrixAt(instanceIndex, matrix);
            windowsSideA.setColorAt(instanceIndex, color);
            instanceIndex++;
        }
    }

    // Create windows for left and right (side B)
    instanceIndex = 0;
    
    // Right face (X+)
    quaternion.setFromEuler(new THREE.Euler(0, Math.PI/2, 0));
    
    for (let floor = 0; floor < numFloors; floor++) {
        const y = -buildingHeight/2 + padding + floor * (windowHeight + gutterSize) + windowHeight/2;
        
        for (let room = 0; room < roomsPerSideB; room++) {
            const z = -buildingWidthSideB/2 + padding + room * (windowWidth + gutterSize) + windowWidth/2;
            const x = buildingWidthSideA/2 + 0.1;
            
            // Window brightness based on building policy
            if (Math.random() > buildingPolicy.conformity) {
                const level = Math.floor(Math.random() * 4);  // 0-3 levels
                brightness = 0.3 + (level * 0.3);  // 0.3 to 1.2
            } else {
                brightness = 0.3 + (buildingPolicy.baseLevel * 0.3) + (Math.random() * 0.2 - 0.1);
            }
            
            // Some windows are completely dark
            if (Math.random() < 0.1) brightness = 0;
            
            // Set color with cyan tint
            color.setRGB(0, brightness, brightness);
            position.set(x, y, z);
            matrix.compose(position, quaternion, scale);
            windowsSideB.setMatrixAt(instanceIndex, matrix);
            windowsSideB.setColorAt(instanceIndex, color);
            instanceIndex++;
        }
    }
    
    // Left face (X-)
    quaternion.setFromEuler(new THREE.Euler(0, -Math.PI/2, 0));
    
    for (let floor = 0; floor < numFloors; floor++) {
        const y = -buildingHeight/2 + padding + floor * (windowHeight + gutterSize) + windowHeight/2;
        
        for (let room = 0; room < roomsPerSideB; room++) {
            const z = -buildingWidthSideB/2 + padding + room * (windowWidth + gutterSize) + windowWidth/2;
            const x = -buildingWidthSideA/2 - 0.1;
            
            // Window brightness based on building policy
            if (Math.random() > buildingPolicy.conformity) {
                const level = Math.floor(Math.random() * 4);  // 0-3 levels
                brightness = 0.3 + (level * 0.3);  // 0.3 to 1.2
            } else {
                brightness = 0.3 + (buildingPolicy.baseLevel * 0.3) + (Math.random() * 0.2 - 0.1);
            }
            
            // Some windows are completely dark
            if (Math.random() < 0.1) brightness = 0;
            
            // Set color with cyan tint
            color.setRGB(0, brightness, brightness);
            position.set(x, y, z);
            matrix.compose(position, quaternion, scale);
            windowsSideB.setMatrixAt(instanceIndex, matrix);
            windowsSideB.setColorAt(instanceIndex, color);
            instanceIndex++;
        }
    }
    
    building.add(windowsSideA);
    building.add(windowsSideB);

    // Neon Cyberpunk Roof
    const roofGeometry = new THREE.BoxGeometry(buildingWidthSideA + 2, 2, buildingWidthSideB + 2);
    const roofMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffcc,
        emissive: 0x00ffcc,
        emissiveIntensity: isModernBuilding ? 2 : 0.5
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = buildingHeight/2;
    building.add(roof);

    return building;
}