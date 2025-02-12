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

    // Determine building type based on physical characteristics
    const isModernBuilding = gutterSize < 0.3 && padding < 0.5;
    
    // Window generation
    const windowGeometry = new THREE.PlaneGeometry(windowWidth, windowHeight, 2, 2);
    
    // Create window materials
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
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            side: THREE.DoubleSide
        }),
        low: new THREE.MeshPhongMaterial({
            color: 0x00ffcc,
            emissive: 0x00ffcc,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            side: THREE.DoubleSide
        }),
        medium: new THREE.MeshPhongMaterial({
            color: 0x00ffcc,
            emissive: 0x00ffcc,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            side: THREE.DoubleSide
        }),
        bright: new THREE.MeshPhongMaterial({
            color: 0x00ffcc,
            emissive: 0x00ffcc,
            emissiveIntensity: 1.2,
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

    // Create materials in order of brightness for easy level shifts
    const materialLevels = [
        windowMaterials.dim,      // 0: Dimmest
        windowMaterials.low,      // 1
        windowMaterials.medium,   // 2
        windowMaterials.bright,   // 3
        windowMaterials.veryBright// 4: Brightest
    ];

    // For all buildings, decide building-wide lighting policy
    const buildingPolicy = {
        baseLevel: isModernBuilding 
            ? (Math.random() < 0.5 ? 2 : 1)  // Modern: medium (2) or low (1)
            : (Math.random() < 0.5 ? 3 : 2), // Older: bright (3) or medium (2)
        conformity: isModernBuilding ? 0.95 : 0.7  // Modern: 95% conform, Older: 70% conform
    };

    console.log(`Building Details:
    Modern: ${isModernBuilding}
    Policy: Level ${buildingPolicy.baseLevel} (${buildingPolicy.conformity * 100}% conformity)
    Height: ${buildingHeight}
    Width Side A: ${buildingWidthSideA}
    Width Side B: ${buildingWidthSideB}
    Rooms Side A: ${roomsSideA}
    Rooms Side B: ${roomsSideB}
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

                // Calculate window intensity based on building type
                let material;
                if (isModernBuilding) {
                    // Modern office buildings: 90% consistent lighting
                    const isStandardWindow = Math.random() < buildingPolicy.conformity;  // 95% follow building policy
                    
                    if (isStandardWindow) {
                        // Follow building policy
                        material = materialLevels[buildingPolicy.baseLevel];
                    } else {
                        // 10% random variation - go 1-2 levels down from base
                        const variation = Math.floor(Math.random() * 2);  // 1 or 2 levels
                        const newLevel = Math.max(0, buildingPolicy.baseLevel - variation);
                        material = materialLevels[newLevel];
                    }
                } else {
                    // Older buildings: More random distribution
                    const isStandardWindow = Math.random() < buildingPolicy.conformity;  // 70% follow building policy
                    
                    if (isStandardWindow) {
                        // Follow building policy
                        material = materialLevels[buildingPolicy.baseLevel];
                    } else {
                        // 30% random variation - go 1-2 levels down from base
                        const variation = Math.floor(Math.random() * 3);  // 1 or 2 levels
                        const newLevel = Math.max(0, buildingPolicy.baseLevel - variation);
                        material = materialLevels[newLevel];
                    }
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
        emissiveIntensity: isModernBuilding ? 2 : 0 // Extra bright for that cyberpunk glow
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = buildingHeight/2 + 1;  // Slightly above building top
    building.add(roof);

    return building;
}