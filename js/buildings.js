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

    // Window generation
    const windowGeometry = new THREE.PlaneGeometry(windowWidth, windowHeight);
    const windowMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffcc,
        emissive: 0x00ffcc,
        transparent: true,
        opacity: 0.6,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
    });

    // Sides to add windows
    const sides = [
        { 
            rotation: [0, 0, 0], 
            offset: [0, 0, buildingWidthSideB/2 + 0.5], 
            length: buildingWidthSideA,
            roomCount: roomsSideA
        },
        { 
            rotation: [0, Math.PI, 0], 
            offset: [0, 0, -buildingWidthSideB/2 - 0.5], 
            length: buildingWidthSideA,
            roomCount: roomsSideA
        },
        { 
            rotation: [0, Math.PI/2, 0], 
            offset: [buildingWidthSideA/2 + 0.5, 0, 0], 
            length: buildingWidthSideB,
            roomCount: roomsSideB
        },
        { 
            rotation: [0, -Math.PI/2, 0], 
            offset: [-buildingWidthSideA/2 - 0.5, 0, 0], 
            length: buildingWidthSideB,
            roomCount: roomsSideB
        }
    ];

    // Randomly decide which sides get windows
    let windowSides;
    if (Math.random() < 0.95) {
        // 95% of cases: all 4 sides get windows
        windowSides = sides;
    } else {
        // 5% of cases: randomly select 2-3 sides
        const numSidesToKeep = Math.floor(Math.random() * 2) + 2;  // 2 or 3 sides
        windowSides = sides
            .sort(() => 0.5 - Math.random())  // Shuffle sides
            .slice(0, numSidesToKeep);
    }

    windowSides.forEach(side => {
        const windowInstances = new THREE.InstancedMesh(
            windowGeometry, 
            windowMaterial, 
            Math.max(1, numFloors * side.roomCount)
        );
        windowInstances.rotation.set(...side.rotation);
        windowInstances.position.set(...side.offset);

        const dummy = new THREE.Object3D();
        let instanceCount = 0;
        
        // Calculate total width of windows and gutters
        const totalWindowsWidth = side.roomCount * windowWidth;
        const totalGuttersWidth = (side.roomCount - 1) * gutterSize;
        
        // Calculate starting x position from the left edge of the building
        const startX = -side.length/2 + padding + windowWidth/2;
        
        for (let floor = 0; floor < numFloors; floor++) {
            for (let room = 0; room < side.roomCount; room++) {
                const xPos = startX + 
                    room * (windowWidth + gutterSize);
                
                const yPos = -buildingHeight/2 + 
                    padding + 
                    floor * (windowHeight + gutterSize) + 
                    windowHeight/2;

                // New intensity calculation for more contrast
                const windowIntensity = Math.random() < 0.5 
                    ? Math.pow(Math.random(), 5) * 0.3  // Darker windows
                    : Math.pow(Math.random(), 2) * 0.8; // Brighter windows

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
    const roofGeometry = new THREE.BoxGeometry(buildingWidthSideA + 2, 2, buildingWidthSideB + 2);
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