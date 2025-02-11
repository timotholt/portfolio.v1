// Create and manage the milestone rings in the scene
export function createRings(THREE, scene, curve, camera) {
    // Create text label
    function createTextSprite(text) {
        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = text;
        return new THREE.CSS2DObject(label);
    }

    // Create rings array to store references
    const rings = [];
    const milestones = [
        { position: 0.15, name: "EDUCATION" },
        { position: 0.35, name: "EXPERIENCE" },
        { position: 0.67, name: "PROJECTS" },
        { position: 0.85, name: "CONTACT" }
    ];

    const ringGeometry = new THREE.TorusGeometry(0.5, 0.02, 16, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffd700,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });

    // Line material for connectors
    const connectorMaterial = new THREE.LineBasicMaterial({
        color: 0x4dfff3,
        transparent: true,
        opacity: 0.6,
        depthTest: false,
        blending: THREE.NormalBlending
    });

    // Create rings at milestone positions
    milestones.forEach((milestone, index) => {
        const point = curve.getPointAt(milestone.position);
        const tangent = curve.getTangentAt(milestone.position);
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial.clone());
        ring.position.copy(point);
        ring.lookAt(point.clone().add(tangent));
        scene.add(ring);
        
        // Add text label
        const label = createTextSprite(milestone.name);
        label.position.copy(point);
        rings.push({ ring, label });
        scene.add(label);
        
        // Create connector line
        const linePositions = new Float32Array(6);
        const connectorGeometry = new THREE.BufferGeometry();
        connectorGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        const connector = new THREE.Line(connectorGeometry, connectorMaterial);
        connector.renderOrder = 1;
        rings[index].connector = connector;
        scene.add(connector);
    });

    // Update rings opacity based on track distance
    function updateRingsOpacity(progress) {
        const wrappedProgress = ((progress % 1.0) + 1.0) % 1.0;
        const minOpacity = 0.05;
        const maxOpacity = 0.7;
        const startFade = 0.08;
        const fadeRange = 0.15;
        
        milestones.forEach((milestone, index) => {
            let trackDistance = Math.abs(milestone.position - wrappedProgress);
            if (trackDistance > 0.5) {
                trackDistance = 1 - trackDistance;
            }
            
            // Update ring opacity and color
            if (trackDistance <= startFade) {
                const ring = rings[index].ring;
                ring.material.opacity = maxOpacity;
                const whiteBlend = 1 - (trackDistance / startFade);
                const color = new THREE.Color(0xffd700);
                color.lerp(new THREE.Color(0xffffff), whiteBlend * 0.5);
                ring.material.color = color;
            } else if (trackDistance <= startFade + fadeRange) {
                const fadeValue = Math.pow(1 - ((trackDistance - startFade) / fadeRange), 3);
                const ring = rings[index].ring;
                ring.material.opacity = minOpacity + (maxOpacity - minOpacity) * fadeValue;
                ring.material.color.setHex(0xffd700);
            } else {
                const ring = rings[index].ring;
                ring.material.opacity = minOpacity;
                ring.material.color.setHex(0xffd700);
            }
            
            // Project ring center and edge to screen space
            const ringCenter = rings[index].ring.position.clone();
            const screenCenter = ringCenter.clone().project(camera);
            
            // Check if ring is visible
            const isVisible = screenCenter.z < 1 && 
                             Math.abs(screenCenter.x) <= 1 && 
                             Math.abs(screenCenter.y) <= 1;
            
            // Update label and connector visibility
            const label = rings[index].label;
            const connector = rings[index].connector;
            label.element.style.display = isVisible ? '' : 'none';
            connector.visible = isVisible;
            
            if (!isVisible) return;
            
            // Project ring edge point
            const edgePoint = ringCenter.clone().add(new THREE.Vector3(0.5, 0, 0));
            const screenEdge = edgePoint.clone().project(camera);
            
            // Calculate ring radius in screen space
            const ringScreenRadius = new THREE.Vector2(
                screenEdge.x - screenCenter.x,
                screenEdge.y - screenCenter.y
            ).length();
            
            // Calculate distance-based damping
            const cameraDistance = camera.position.distanceTo(ringCenter);
            const damping = Math.min(cameraDistance / 5, 1);
            
            // Calculate offsets
            const minOffset = Math.max(ringScreenRadius * (1.2 + damping * 0.8), 0.05);
            const rightOffset = minOffset * 2;
            const upOffset = minOffset;
            
            // Get camera vectors
            const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
            const cameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
            
            // Project points
            const rightPoint = ringCenter.clone().add(cameraRight);
            const upPoint = ringCenter.clone().add(cameraUp);
            const screenRight = rightPoint.clone().project(camera);
            const screenUp = upPoint.clone().project(camera);
            
            // Calculate screen-space vectors
            const rightVector = new THREE.Vector2(
                screenRight.x - screenCenter.x,
                screenRight.y - screenCenter.y
            ).normalize();
            
            const upVector = new THREE.Vector2(
                screenUp.x - screenCenter.x,
                screenUp.y - screenCenter.y
            ).normalize();
            
            // Calculate offsets
            const offsetX = rightVector.x * rightOffset + upVector.x * upOffset;
            const offsetY = rightVector.y * rightOffset + upVector.y * upOffset;
            
            // Get label dimensions
            const labelRect = label.element.getBoundingClientRect();
            const labelWidth = (labelRect.width / window.innerWidth) * 2;
            const labelHeight = (labelRect.height / window.innerHeight) * 2;
            
            // Calculate screen position
            const margin = 0.05;
            const screenX = Math.max(
                -1 + labelWidth/2 + margin, 
                Math.min(1 - labelWidth/2 - margin, 
                screenCenter.x + offsetX)
            );
            const screenY = Math.max(
                -1 + labelHeight/2 + margin, 
                Math.min(1 - labelHeight/2 - margin, 
                screenCenter.y + offsetY)
            );
            
            // Update label position
            const labelPos = new THREE.Vector3(
                screenX,
                screenY,
                screenCenter.z
            ).unproject(camera);
            
            label.position.copy(labelPos);
            
            // Update connector line
            const positions = connector.geometry.attributes.position.array;
            positions[0] = ringCenter.x;
            positions[1] = ringCenter.y;
            positions[2] = ringCenter.z;
            positions[3] = labelPos.x;
            positions[4] = labelPos.y;
            positions[5] = labelPos.z;
            
            connector.geometry.attributes.position.needsUpdate = true;
        });
    }

    return {
        rings,
        milestones,
        updateRingsOpacity
    };
}
