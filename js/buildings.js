// Building generation and management
// Shared geometries and materials for performance
const sharedGeometries = new Map();
const sharedMaterials = new Map();

export function createBuilding(THREE) {
    // 1) Generate window dimensions
    const windowWidth = 2 + Math.random() * 4;  // 2-6 units wide
    const windowHeight = 4 + Math.random() * 6;  // 4-10 units tall

    // 2) Generate gutter size
    const gutterSize = ((windowWidth + windowHeight) / 2) * (0.5 * Math.random());

    // 3) Padding equals gutter
    const padding = gutterSize;

    // 4) Generate number of floors
    const numFloors = Math.floor(Math.random() * 30) + 1;  // 1-30 floors

    // 5 & 6) Generate rooms for side A and B
    const roomsSideA = Math.max(Math.floor(Math.random() * 10), 4);
    const roomsSideB = Math.max(Math.floor(Math.random() * 10), 4);

    // 7) Calculate building height
    const buildingHeight = 
        padding + 
        (numFloors * windowHeight) + 
        (gutterSize * (numFloors - 1)) + 
        padding;

    // 8 & 9) Calculate building width for sides A and B
    const buildingWidthSideA = 
        padding + 
        (roomsSideA * windowWidth) + 
        (gutterSize * (roomsSideA - 1)) + 
        padding;

    const buildingWidthSideB = 
        padding + 
        (roomsSideB * windowWidth) + 
        (gutterSize * (roomsSideB - 1)) + 
        padding;

    console.log(`Building Details:
    Height: ${buildingHeight}
    Width Side A: ${buildingWidthSideA}
    Width Side B: ${buildingWidthSideB}
    Floors: ${numFloors}
    Window Height: ${windowHeight}
    Gutter Size: ${gutterSize}`);

    // Create building group
    const building = new THREE.Group();

    // Building base geometry (use the larger width)
    const buildingWidth = Math.max(buildingWidthSideA, buildingWidthSideB);
    const buildingDepth = Math.min(buildingWidth, 40);  // Limit depth
    const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
    
    // Cyberpunk-style building material
    const buildingMaterial = new THREE.MeshPhongMaterial({
        color: 0x001133 + Math.floor(Math.random() * 0x111111),
        emissive: 0x001133,
        emissiveIntensity: 0.1
    });

    const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.add(buildingMesh);

    // Window generation
    const windowGeometry = new THREE.PlaneGeometry(windowWidth, windowHeight);
    const windowMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffcc,
        emissive: 0x00ffcc,
        transparent: true,
        opacity: 0.6,
        polygonOffset: true,  // Enable polygon offset
        polygonOffsetFactor: 1,  // Slight offset factor
        polygonOffsetUnits: 1   // Slight offset units
    });

    // Sides to add windows
    const sides = [
        { rotation: [0, 0, 0], offset: [0, 0, buildingDepth/2 + 0.5], length: buildingWidth },
        { rotation: [0, Math.PI, 0], offset: [0, 0, -buildingDepth/2 - 0.5], length: buildingWidth }
    ];

    sides.forEach(side => {
        const roomsOnSide = side.length === buildingWidthSideA ? roomsSideA : roomsSideB;
        
        const windowInstances = new THREE.InstancedMesh(
            windowGeometry, 
            windowMaterial, 
            numFloors * roomsOnSide
        );
        windowInstances.rotation.set(...side.rotation);
        windowInstances.position.set(...side.offset);

        const dummy = new THREE.Object3D();
        let instanceCount = 0;
        
        for (let floor = 0; floor < numFloors; floor++) {
            for (let room = 0; room < roomsOnSide; room++) {
                // Position windows with padding and gutters
                const xPos = -side.length/2 + 
                    padding + 
                    room * (windowWidth + gutterSize) + 
                    windowWidth/2;
                
                const yPos = -buildingHeight/2 + 
                    padding + 
                    floor * (windowHeight + gutterSize) + 
                    windowHeight/2;

                // Window intensity variation with more predictable randomness
                const windowIntensity = Math.random() > 0.5 ? 
                    0.1 :  // Brightly lit windows
                    0.02;  // Dimly lit windows

                dummy.position.set(xPos, yPos, 0);
                dummy.updateMatrix();

                windowInstances.setMatrixAt(instanceCount, dummy.matrix);
                windowInstances.setColorAt(instanceCount, 
                    new THREE.Color(0x00ffcc).multiplyScalar(windowIntensity)
                );

                instanceCount++;
            }
        }

        windowInstances.instanceMatrix.needsUpdate = true;
        windowInstances.instanceColor.needsUpdate = true;
        
        if (instanceCount > 0) {
            windowInstances.count = instanceCount;
            building.add(windowInstances);
        }
    });

    // Neon Cyberpunk Roof
    const roofGeometry = new THREE.BoxGeometry(buildingWidth + 2, 2, buildingDepth + 2);
    const roofMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffcc,
        emissive: 0x00ffcc,
        emissiveIntensity: 2  // Extra bright for that cyberpunk glow
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = buildingHeight/2 + 1;  // Slightly above building top
    building.add(roof);

    return building;
}