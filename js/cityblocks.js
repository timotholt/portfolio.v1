import { createBuilding } from './buildings.js';

export function createCityGrid(THREE) {
    const BLOCK_SIZE = 100;        // Total block size (including roads)
    const BUILDING_MARGIN = 5;     // Margin between buildings and block edge
    const SIDEWALK_WIDTH = 5;      // Width of sidewalk around block
    const ROAD_WIDTH = 20;         // Width of roads between blocks

    const cityGrid = new THREE.Group();

    // Grid configuration
    const gridSize = 6;  // 13x13 grid of city blocks
    const blockVariations = [
        { widthMultiplier: 1, depthMultiplier: 1, probability: 0.7 },
        { widthMultiplier: 2, depthMultiplier: 1, probability: 0.1 },
        { widthMultiplier: 1, depthMultiplier: 2, probability: 0.1 },
        { widthMultiplier: 1.5, depthMultiplier: 1.5, probability: 0.05 },
        { widthMultiplier: 2, depthMultiplier: 2, probability: 0.05 }
    ];

    function selectBlockVariation() {
        const randomVal = Math.random();
        let cumulativeProbability = 0;
        
        for (const variation of blockVariations) {
            cumulativeProbability += variation.probability;
            if (randomVal <= cumulativeProbability) {
                return variation;
            }
        }
        
        return blockVariations[0]; // Default to standard block
    }

    function createSidewalk(width, depth) {
        const sidewalkGeometry = new THREE.BoxGeometry(
            width + 2 * SIDEWALK_WIDTH, 
            1, 
            depth + 2 * SIDEWALK_WIDTH
        );
        const sidewalkMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,  // Dark gray for sidewalk
            shininess: 10
        });
        const sidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
        sidewalk.position.y = -0.5; // Slightly below ground
        return sidewalk;
    }

    // Generate city grid
    for (let x = -gridSize; x <= gridSize; x++) {
        for (let z = -gridSize; z <= gridSize; z++) {
            // Determine block variation
            const blockVariation = selectBlockVariation();
            
            // Calculate block dimensions
            const blockWidth = BLOCK_SIZE * blockVariation.widthMultiplier;
            const blockDepth = BLOCK_SIZE * blockVariation.depthMultiplier;
            
            // Create block group
            const cityBlock = new THREE.Group();
            
            // Add sidewalk first
            const sidewalk = createSidewalk(blockWidth, blockDepth);
            cityBlock.add(sidewalk);

            // Building placement constraints
            const buildingConstraints = {
                maxWidth: blockWidth - 2 * (BUILDING_MARGIN + SIDEWALK_WIDTH),
                maxDepth: blockDepth - 2 * (BUILDING_MARGIN + SIDEWALK_WIDTH),
                minWidth: 10,
                minDepth: 10,
                maxHeight: 200,
                minHeight: 20
            };

            // Create buildings within the block
            const building = createBuilding(THREE, buildingConstraints);
            
            // Position building on block
            building.position.set(
                0, 
                building.children[0].geometry.parameters.height / 2, 
                0
            );
            cityBlock.add(building);

            // Position block in grid
            cityBlock.position.set(
                x * (BLOCK_SIZE + ROAD_WIDTH) + (Math.random() - 0.5) * 10,
                0,
                z * (BLOCK_SIZE + ROAD_WIDTH) + (Math.random() - 0.5) * 10
            );

            cityGrid.add(cityBlock);
        }
    }

    return cityGrid;
}
