// Controls and camera movement
export function createControls(THREE, camera, curve, milestones) {
    // Camera offset and rotation
    const cameraOffset = new THREE.Vector3(0, 0.5, 0);
    let cameraRotationOffset = 0;
    
    // Movement constants
    const ROTATION_SPEED = 0.05;
    const ROTATION_RETURN_SPEED = 0.1;
    const MOVEMENT_SPEED = 0.005;
    
    // Control state
    let progress = 0;
    let targetProgress = 0;
    let isRotatingLeft = false;
    let isRotatingRight = false;
    let isMovingForward = false;
    let isMovingBackward = false;

    function handleKeyDown(event) {
        switch(event.code) {
            case 'KeyA':
            case 'ArrowLeft':
                isRotatingLeft = true;
                document.querySelector('.key-a')?.classList.add('active');
                break;
            case 'KeyD':
            case 'ArrowRight':
                isRotatingRight = true;
                document.querySelector('.key-d')?.classList.add('active');
                break;
            case 'KeyW':
            case 'ArrowUp':
                isMovingForward = true;
                document.querySelector('.key-w')?.classList.add('active');
                break;
            case 'KeyS':
            case 'ArrowDown':
                isMovingBackward = true;
                document.querySelector('.key-s')?.classList.add('active');
                break;
            case 'Space':
                handleSpacebarPress();
                document.querySelector('.key-spacebar')?.classList.add('active');
                break;
        }
    }

    function handleKeyUp(event) {
        switch(event.code) {
            case 'KeyA':
            case 'ArrowLeft':
                isRotatingLeft = false;
                document.querySelector('.key-a')?.classList.remove('active');
                break;
            case 'KeyD':
            case 'ArrowRight':
                isRotatingRight = false;
                document.querySelector('.key-d')?.classList.remove('active');
                break;
            case 'KeyW':
            case 'ArrowUp':
                isMovingForward = false;
                document.querySelector('.key-w')?.classList.remove('active');
                break;
            case 'KeyS':
            case 'ArrowDown':
                isMovingBackward = false;
                document.querySelector('.key-s')?.classList.remove('active');
                break;
            case 'Space':
                document.querySelector('.key-spacebar')?.classList.remove('active');
                break;
        }
    }

    function handleKeyState() {
        if (isMovingForward) {
            targetProgress += 0.01;
        }
        if (isMovingBackward) {
            targetProgress -= 0.01;
        }
    }

    function handleSpacebarPress() {
        const currentPos = progress % 1.0;
        const epsilon = 0.01;
        const nextMilestoneIndex = milestones.findIndex(m => Math.abs(m.position - currentPos) < epsilon);
        
        // Get next milestone index
        const nextIndex = (nextMilestoneIndex === -1) 
            ? milestones.findIndex(m => m.position > currentPos)
            : (nextMilestoneIndex + 1) % milestones.length;
        
        // Get next milestone value
        const nextMilestone = milestones[nextIndex].position;
        
        // If we're wrapping around to the beginning
        if (nextIndex === 0) {
            targetProgress = Math.ceil(progress) + nextMilestone;
        } else {
            targetProgress = Math.floor(progress) + nextMilestone;
        }
    }

    function handleMouseWheel(event) {
        targetProgress += event.deltaY * 0.0002;
    }

    function updateCamera() {
        progress += (targetProgress - progress) * 0.03;
        const wrappedProgress = ((progress % 1.0) + 1.0) % 1.0;  // Always positive
        const point = curve.getPointAt(wrappedProgress);
        const lookAhead = curve.getPointAt((wrappedProgress + 0.01) % 1.0);
        
        // Update camera rotation
        if (isRotatingLeft) {
            cameraRotationOffset += ROTATION_SPEED;
        } else if (isRotatingRight) {
            cameraRotationOffset -= ROTATION_SPEED;
        } else if (cameraRotationOffset !== 0) {
            // Smoothly return to center when not rotating
            cameraRotationOffset *= (1 - ROTATION_RETURN_SPEED);
            if (Math.abs(cameraRotationOffset) < 0.001) cameraRotationOffset = 0;
        }
        
        // Apply camera position and rotation
        camera.position.copy(point).add(cameraOffset);
        
        // Create a look target that's offset by our rotation
        const forward = new THREE.Vector3().subVectors(lookAhead, point);
        const right = new THREE.Vector3(forward.z, 0, -forward.x).normalize();
        const rotatedTarget = new THREE.Vector3().copy(lookAhead);
        rotatedTarget.add(right.multiplyScalar(cameraRotationOffset));
        rotatedTarget.y += 0.1;
        
        camera.lookAt(rotatedTarget);
        
        return wrappedProgress;
    }

    // Setup click handlers for on-screen buttons
    function setupButtonHandlers() {
        // WASD handlers
        const buttons = {
            'W': { down: () => handleKeyDown({ code: 'KeyW' }), up: () => handleKeyUp({ code: 'KeyW' }) },
            'A': { down: () => handleKeyDown({ code: 'KeyA' }), up: () => handleKeyUp({ code: 'KeyA' }) },
            'S': { down: () => handleKeyDown({ code: 'KeyS' }), up: () => handleKeyUp({ code: 'KeyS' }) },
            'D': { down: () => handleKeyDown({ code: 'KeyD' }), up: () => handleKeyUp({ code: 'KeyD' }) }
        };

        // Set up WASD buttons
        document.querySelectorAll('.key:not(.key-spacebar)').forEach(button => {
            const key = button.textContent;
            if (buttons[key]) {
                button.addEventListener('mousedown', buttons[key].down);
                button.addEventListener('mouseup', buttons[key].up);
                button.addEventListener('mouseleave', buttons[key].up);
            }
        });

        // Set up spacebar button
        const spaceButton = document.querySelector('.key-spacebar');
        if (spaceButton) {
            spaceButton.addEventListener('mousedown', () => handleKeyDown({ code: 'Space' }));
            spaceButton.addEventListener('mouseup', () => handleKeyUp({ code: 'Space' }));
            spaceButton.addEventListener('mouseleave', () => handleKeyUp({ code: 'Space' }));
        }
    }

    // Set up event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleMouseWheel);

    // Initialize button handlers
    setupButtonHandlers();

    return {
        handleKeyState,
        updateCamera,
        getProgress: () => progress
    };
}
