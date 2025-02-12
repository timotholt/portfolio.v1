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
    const windowGeometry = new THREE.PlaneGeometry(windowWidth, windowHeight, 2, 2);
    
    // Create material pool for this building
    const windowMaterials = {
        dark: new THREE.MeshPhongMaterial({
            color: 0x000000,
            emissive: 0x000000,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            side: THREE.DoubleSide
        }),
        dim: new THREE.MeshPhongMaterial({
            color: 0x00ffcc,
            emissive: 0x00ffcc,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            side: THREE.DoubleSide
        }),
        low: new THREE.MeshPhongMaterial({
            color: 0x00ffcc,
            emissive: 0x00ffcc,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            side: THREE.DoubleSide
        }),
        medium: new THREE.MeshPhongMaterial({
            color: 0x00ffcc,
            emissive: 0x00ffcc,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            side: THREE.DoubleSide
        }),
        bright: new THREE.MeshPhongMaterial({
            color: 0x00ffcc,
            emissive: 0x00ffcc,
            emissiveIntensity: 1.5,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            side: THREE.DoubleSide
        }),
        veryBright: new THREE.MeshPhongMaterial({
            color: 0x00ffcc,
            emissive: 0x00ffcc,
            emissiveIntensity: 2.0,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            side: THREE.DoubleSide
        })
    };

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
        const sideGroup = new THREE.Group();
        sideGroup.rotation.set(...side.rotation);
        sideGroup.position.set(...side.offset);
        building.add(sideGroup);

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

                // Determine building type based on physical characteristics
                const isModernBuilding = gutterSize < 0.3 && padding < 0.5;
                
                // Calculate window intensity based on building type
                let material;
                if (isModernBuilding) {
                    // Modern office buildings: 90% consistent lighting
                    const buildingPolicy = Math.random() < 0.5;  // 50% chance lights are mostly on/off
                    const isStandardWindow = Math.random() < 0.9;  // 90% follow building policy
                    
                    if (isStandardWindow) {
                        // Follow building policy
                        material = buildingPolicy ? windowMaterials.medium : windowMaterials.dark;
                    } else {
                        // 10% random variation
                        const rand = Math.random();
                        material = rand < 0.2 ? windowMaterials.dark :
                                 rand < 0.4 ? windowMaterials.dim :
                                 rand < 0.6 ? windowMaterials.low :
                                 rand < 0.8 ? windowMaterials.medium :
                                 rand < 0.9 ? windowMaterials.bright :
                                            windowMaterials.veryBright;
                    }
                } else {
                    // Older buildings: More random distribution
                    const rand = Math.random();
                    material = rand < 0.05 ? windowMaterials.dark :      // 5% dark
                             rand < 0.2 ? windowMaterials.dim :          // 15% dim
                             rand < 0.4 ? windowMaterials.low :          // 20% low
                             rand < 0.6 ? windowMaterials.medium :       // 20% medium
                             rand < 0.8 ? windowMaterials.bright :       // 20% bright
                                        windowMaterials.veryBright;      // 20% very bright
                }

                const windowMesh = new THREE.Mesh(windowGeometry, material);
                windowMesh.position.set(xPos, yPos, 0.01);
                windowMesh.updateMatrix();
                
                // Add to side group
                sideGroup.add(windowMesh);
            }
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