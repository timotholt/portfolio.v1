// Building generation and management
// Shared geometries and materials for performance
const sharedGeometries = new Map();
const sharedMaterials = new Map();

// Create shared window geometry
let sharedWindowGeometry = null;

export function createBuilding(THREE) {
    // Initialize shared window geometry if not already done
    if (!sharedWindowGeometry) {
        sharedWindowGeometry = new THREE.PlaneGeometry(1, 1);
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

    // Building base geometry using only side widths and height
    const buildingGeometry = new THREE.BoxGeometry(buildingWidthSideA, buildingHeight, buildingWidthSideB);
    
    // Cyberpunk-style building material
    const buildingMaterial = new THREE.MeshPhongMaterial({
        color: 0x001133 + Math.floor(Math.random() * 0x111111),
        emissive: 0x001133,
        emissiveIntensity: 0.1
    });

    const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.add(buildingMesh);

    // Create instanced meshes for front/back (A) and left/right (B) sides
    const windowsSideA = new THREE.InstancedMesh(
        sharedWindowGeometry,
        materialLevels[buildingPolicy.baseLevel].clone(),
        roomsPerSideA * numFloors * 2  // *2 for front and back
    );

    const windowsSideB = new THREE.InstancedMesh(
        sharedWindowGeometry,
        materialLevels[buildingPolicy.baseLevel].clone(),
        roomsPerSideB * numFloors * 2  // *2 for left and right
    );

    const color = new THREE.Color();
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(windowWidth, windowHeight, 1);

    // Create windows for front and back (side A)
    let instanceIndex = 0;
    
    // Front face (Z+)
    let brightness = 0.3 + Math.random() * 0.7;
    color.setRGB(brightness, brightness, brightness);
    quaternion.setFromEuler(new THREE.Euler(0, 0, 0));
    
    for (let floor = 0; floor < numFloors; floor++) {
        const y = -buildingHeight/2 + padding + floor * (windowHeight + gutterSize) + windowHeight/2;
        
        for (let room = 0; room < roomsPerSideA; room++) {
            const x = -buildingWidthSideA/2 + padding + room * (windowWidth + gutterSize) + windowWidth/2;
            const z = buildingWidthSideB/2;
            
            position.set(x, y, z);
            matrix.compose(position, quaternion, scale);
            windowsSideA.setMatrixAt(instanceIndex, matrix);
            windowsSideA.setColorAt(instanceIndex, color);
            instanceIndex++;
        }
    }
    
    // Back face (Z-)
    brightness = 0.3 + Math.random() * 0.7;
    color.setRGB(brightness, brightness, brightness);
    quaternion.setFromEuler(new THREE.Euler(0, Math.PI, 0));
    
    for (let floor = 0; floor < numFloors; floor++) {
        const y = -buildingHeight/2 + padding + floor * (windowHeight + gutterSize) + windowHeight/2;
        
        for (let room = 0; room < roomsPerSideA; room++) {
            const x = -buildingWidthSideA/2 + padding + room * (windowWidth + gutterSize) + windowWidth/2;
            const z = -buildingWidthSideB/2;
            
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
    brightness = 0.3 + Math.random() * 0.7;
    color.setRGB(brightness, brightness, brightness);
    quaternion.setFromEuler(new THREE.Euler(0, Math.PI/2, 0));
    
    for (let floor = 0; floor < numFloors; floor++) {
        const y = -buildingHeight/2 + padding + floor * (windowHeight + gutterSize) + windowHeight/2;
        
        for (let room = 0; room < roomsPerSideB; room++) {
            const z = -buildingWidthSideB/2 + padding + room * (windowWidth + gutterSize) + windowWidth/2;
            const x = buildingWidthSideA/2;
            
            position.set(x, y, z);
            matrix.compose(position, quaternion, scale);
            windowsSideB.setMatrixAt(instanceIndex, matrix);
            windowsSideB.setColorAt(instanceIndex, color);
            instanceIndex++;
        }
    }
    
    // Left face (X-)
    brightness = 0.3 + Math.random() * 0.7;
    color.setRGB(brightness, brightness, brightness);
    quaternion.setFromEuler(new THREE.Euler(0, -Math.PI/2, 0));
    
    for (let floor = 0; floor < numFloors; floor++) {
        const y = -buildingHeight/2 + padding + floor * (windowHeight + gutterSize) + windowHeight/2;
        
        for (let room = 0; room < roomsPerSideB; room++) {
            const z = -buildingWidthSideB/2 + padding + room * (windowWidth + gutterSize) + windowWidth/2;
            const x = -buildingWidthSideA/2;
            
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