// Building generation and management
// Shared geometries and materials for performance
const sharedGeometries = new Map();
const sharedMaterials = new Map();

export function createBuilding(THREE, params = {}) {
    // Default parameters
    const {
        width = 20,
        height = 100,
        depth = 20,
        windowRows = 20,
        windowCols = 4,
        color = 0x001133,
        emissiveColor = 0x00ffcc,
        emissiveIntensity = 0.5
    } = params;

    // Create building group
    const building = new THREE.Group();

    // Get or create building geometry
    const geometryKey = `${width}-${height}-${depth}`;
    let buildingGeometry = sharedGeometries.get(geometryKey);
    if (!buildingGeometry) {
        buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        sharedGeometries.set(geometryKey, buildingGeometry);
    }

    // Get or create building material
    const materialKey = `${color}-${emissiveIntensity}`;
    let buildingMaterial = sharedMaterials.get(materialKey);
    if (!buildingMaterial) {
        buildingMaterial = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.1,
            shininess: 50
        });
        sharedMaterials.set(materialKey, buildingMaterial);
    }

    const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.add(buildingMesh);

    // Create window grid with instancing for better performance
    const windowSize = 1;
    const windowGeometry = new THREE.PlaneGeometry(windowSize, windowSize);
    const windowMaterial = new THREE.MeshPhongMaterial({
        color: emissiveColor,
        emissive: emissiveColor,
        emissiveIntensity: emissiveIntensity,
        transparent: true,
        opacity: 0.8
    });

    // Add windows to each side using fewer draw calls
    const sides = [
        { rotation: [0, 0, 0], offset: [0, 0, depth/2 + 0.1] },
        { rotation: [0, Math.PI, 0], offset: [0, 0, -depth/2 - 0.1] }
    ];

    // Only add windows to front and back for performance
    sides.forEach(side => {
        const windowGroup = new THREE.Group();
        windowGroup.rotation.set(...side.rotation);
        windowGroup.position.set(...side.offset);

        // Create windows in a more efficient pattern
        const windowsPerSide = windowRows * windowCols;
        if (windowsPerSide > 0) {
            const windowSpacingX = (width - windowSize) / (windowCols + 1);
            const windowSpacingY = (height - windowSize) / (windowRows + 1);

            for(let row = 0; row < windowRows; row += 2) {  // Skip every other row
                for(let col = 0; col < windowCols; col++) {
                    const window = new THREE.Mesh(windowGeometry, windowMaterial);
                    window.position.set(
                        -width/2 + windowSpacingX * (col + 1),
                        -height/2 + windowSpacingY * (row + 1),
                        0
                    );
                    windowGroup.add(window);
                }
            }
        }
        building.add(windowGroup);
    });

    // Add neon trim at the top
    const trimGeometry = new THREE.BoxGeometry(width + 1, 1, depth + 1);
    const trimMaterial = new THREE.MeshPhongMaterial({
        color: emissiveColor,
        emissive: emissiveColor,
        emissiveIntensity: 1
    });
    const trim = new THREE.Mesh(trimGeometry, trimMaterial);
    trim.position.y = height/2 + 0.5;
    building.add(trim);

    return building;
}