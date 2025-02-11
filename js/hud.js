// Create and manage the HUD elements
export function createHUD(milestones) {
    const hudElements = {
        milestoneElement: document.getElementById('milestone-value'),
        milestoneNameElement: document.getElementById('milestone-name'),
        arrows: document.querySelectorAll('.arrow')
    };

    function updateHUD(wrappedProgress) {
        const { milestoneElement, milestoneNameElement, arrows } = hudElements;
        
        if (milestoneElement && milestoneNameElement && arrows.length > 0) {
            // Find next milestone with safety check
            const nextMilestoneIndex = milestones.findIndex(m => m.position > wrappedProgress);
            const safeIndex = nextMilestoneIndex === -1 ? 0 : nextMilestoneIndex;
            let distance = Math.abs(milestones[safeIndex].position - wrappedProgress);
            if (distance > 0.5) distance = 1 - distance;  // Use same wraparound logic as rings
            milestoneElement.textContent = (distance * 100).toFixed(2);
            milestoneNameElement.textContent = milestones[safeIndex].name;

            // Update arrows
            const currentPosition = Math.floor(wrappedProgress * 20);
            arrows.forEach((arrow, i) => {
                arrow.className = 'arrow';  // Reset classes
                if (i <= currentPosition) {
                    arrow.classList.add('active');
                }
                // If we're exactly at this arrow's position and it's a milestone
                if (i === currentPosition && arrow.classList.contains('milestone')) {
                    arrow.classList.add('current-milestone');
                }
            });
        }
    }

    return { updateHUD };
}
