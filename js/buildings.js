// Building generation and management
// Shared geometries and materials for performance
const sharedGeometries = new Map();
const sharedMaterials = new Map();

// Create shared window geometry with insets
let sharedWindowGeometry = null;

export function createBuilding(THREE) {
    // Initialize shared window geometry if not already done
    if (!sharedWindowGeometry) {
        function createWindowGeometry(isModern) {
            const geometry = new THREE.BufferGeometry();
            const insetDepth = isModern ? 0.2 : 0.5;  // Modern windows less inset
            const sillDepth = isModern ? 0 : 0.2;     // Only old buildings have sills
            
            // Vertices for inset window (counter-clockwise order)
            const vertices = [
                // Main window (recessed)
                -0.45, -0.45, -insetDepth,  // bottom left
                0.45, -0.45, -insetDepth,   // bottom right
                0.45, 0.45, -insetDepth,    // top right
                -0.45, -0.45, -insetDepth,  // bottom left
                0.45, 0.45, -insetDepth,    // top right
                -0.45, 0.45, -insetDepth,   // top left

                // Left side
                -0.5, -0.5, 0,
                -0.45, -0.45, -insetDepth,
                -0.45, 0.45, -insetDepth,
                -0.5, -0.5, 0,
                -0.45, 0.45, -insetDepth,
                -0.5, 0.5, 0,

                // Right side
                0.45, -0.45, -insetDepth,
                0.5, -0.5, 0,
                0.5, 0.5, 0,
                0.45, -0.45, -insetDepth,
                0.5, 0.5, 0,
                0.45, 0.45, -insetDepth,

                // Top
                -0.5, 0.5, 0,
                0.5, 0.5, 0,
                0.45, 0.45, -insetDepth,
                -0.5, 0.5, 0,
                0.45, 0.45, -insetDepth,
                -0.45, 0.45, -insetDepth,

                // Bottom (with optional sill)
                -0.5, -0.5, 0,
                0.45, -0.45, -insetDepth,
                -0.45, -0.45, -insetDepth,
                -0.5, -0.5, 0,
                0.5, -0.5, 0,
                0.45, -0.45, -insetDepth
            ];

            // Add sill for old buildings
            if (!isModern) {
                vertices.push(
                    // Sill (protruding part)
                    -0.6, -0.5, 0,      // Extended sill
                    0.6, -0.5, 0,
                    0.6, -0.5, -0.1,
                    -0.6, -0.5, 0,
                    0.6, -0.5, -0.1,
                    -0.6, -0.5, -0.1
                );
            }

            // Add vertex colors (all vertices same color)
            const numVertices = vertices.length / 3;
            const colors = new Float32Array(numVertices * 3);
            for (let i = 0; i < numVertices; i++) {
                colors[i * 3] = 1;     // R
                colors[i * 3 + 1] = 1; // G
                colors[i * 3 + 2] = 1; // B
            }

            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            geometry.computeVertexNormals(); // Important for lighting

            return geometry;
        }

        // Create two versions of the window
        const modernGeometry = createWindowGeometry(true);
        const oldGeometry = createWindowGeometry(false);
        sharedWindowGeometry = { modern: modernGeometry, old: oldGeometry };
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
    
    // Building policy
    const buildingPolicy = {
        baseLevel: isModernBuilding ? 1 : 2,  // Modern buildings dimmer
        conformity: isModernBuilding ? 0.95 : 0.7
    };

    // Create building group and main mesh first
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
    const windowGeometry = isModernBuilding ? sharedWindowGeometry.modern : sharedWindowGeometry.old;
    const windowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffcc,
        vertexColors: true,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1.0,
        depthWrite: false  // Try disabling depth write
    });

    const windowsSideA = new THREE.InstancedMesh(
        windowGeometry,
        windowMaterial,
        roomsPerSideA * numFloors * 2  // *2 for front and back
    );

    const windowsSideB = new THREE.InstancedMesh(
        windowGeometry,
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
            color.setRGB(brightness, brightness, brightness);  
            position.set(x, y, z);
            matrix.compose(position, quaternion, scale);
            windowsSideA.setMatrixAt(instanceIndex, matrix);
            windowsSideA.setColorAt(instanceIndex, color);
            instanceIndex++;
        }
    }
    
    // Back face (Z-)
    quaternion.setFromEuler(new THREE.Euler(0, Math.PI, 0));  // Rotate 180 degrees for back face

    for (let floor = 0; floor < numFloors; floor++) {
        const y = -buildingHeight/2 + padding + floor * (windowHeight + gutterSize) + windowHeight/2;
        
        for (let room = 0; room < roomsPerSideA; room++) {
            const x = -buildingWidthSideA/2 + padding + room * (windowWidth + gutterSize) + windowWidth/2;
            const z = -buildingWidthSideB/2 + 0.1;  // Changed from -0.1 to +0.1
            
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
            color.setRGB(brightness, brightness, brightness);  
            position.set(x, y, z);
            matrix.compose(position, quaternion, scale);
            windowsSideA.setMatrixAt(instanceIndex, matrix);
            windowsSideA.setColorAt(instanceIndex, color);
            instanceIndex++;
        }
    }
    
    // Reset instance counter for side B
    instanceIndex = 0;
    
    // Right face (X+)
    quaternion.setFromEuler(new THREE.Euler(0, Math.PI/2, 0));  // 90 degrees for right face

    for (let floor = 0; floor < numFloors; floor++) {
        const y = -buildingHeight/2 + padding + floor * (windowHeight + gutterSize) + windowHeight/2;
        
        for (let room = 0; room < roomsPerSideB; room++) {
            const x = buildingWidthSideA/2 + 0.1;
            const z = buildingWidthSideB/2 - padding - room * (windowWidth + gutterSize) - windowWidth/2;  // Reverse Z order
            
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
            color.setRGB(brightness, brightness, brightness);  
            position.set(x, y, z);
            matrix.compose(position, quaternion, scale);
            windowsSideB.setMatrixAt(instanceIndex, matrix);
            windowsSideB.setColorAt(instanceIndex, color);
            instanceIndex++;
        }
    }
    
    // Left face (X-)
    quaternion.setFromEuler(new THREE.Euler(0, -Math.PI/2, 0));  // -90 degrees for left face

    for (let floor = 0; floor < numFloors; floor++) {
        const y = -buildingHeight/2 + padding + floor * (windowHeight + gutterSize) + windowHeight/2;
        
        for (let room = 0; room < roomsPerSideB; room++) {
            const x = -buildingWidthSideA/2 - 0.1;
            const z = -buildingWidthSideB/2 + padding + room * (windowWidth + gutterSize) + windowWidth/2;
            
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
            color.setRGB(brightness, brightness, brightness);  
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

    return building;
}