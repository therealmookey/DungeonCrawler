/**
 * Dungeon Cartographer - App Controller with Features
 */

document.addEventListener('DOMContentLoaded', () => {
    const mapGenerator = new DungeonMapGenerator();
    let currentMap = new Map();

    const elements = {
        rollD20Btn: document.getElementById('rollD20Btn'),
        rollD4Btn: document.getElementById('rollD4Btn'),
        resetBtn: document.getElementById('resetBtn'),
        undoBtn: document.getElementById('undoBtn'),
        printBtn: document.getElementById('printBtn'),
        balanceBtn: document.getElementById('balanceBtn'),
        d20Display: document.getElementById('d20Display'),
        d4Display: document.getElementById('d4Display'),
        chargesDisplay: document.getElementById('chargesDisplay'),
        d20Status: document.getElementById('d20Status'),
        d4Status: document.getElementById('d4Status'),
        chargesStatus: document.getElementById('chargesStatus'),
        roomCount: document.getElementById('roomCount'),
        position: document.getElementById('position'),
        direction: document.getElementById('direction'),
        grid: document.getElementById('dungeon-grid'),
        log: document.getElementById('log'),
        featureStats: document.getElementById('featureStats')
    };

    let currentD20Roll = null;
    let currentD4Roll = null;
    let chargesRemaining = 0;

    function updateUI() {
        elements.roomCount.textContent = currentMap.size;
        elements.position.textContent = `(${mapGenerator.currentPos.x}, ${mapGenerator.currentPos.y})`;
        
        if (currentD20Roll !== null) {
            elements.d20Display.textContent = currentD20Roll;
        }
        if (currentD4Roll !== null) {
            elements.d4Display.textContent = currentD4Roll;
        }
        elements.chargesDisplay.textContent = chargesRemaining;

        // Update feature stats
        updateFeatureStats();

        if (chargesRemaining > 0) {
            elements.d20Status.textContent = '✅ Ready';
            elements.d20Status.className = 'dice-status active';
            elements.d4Status.textContent = '🎯 Roll D4!';
            elements.d4Status.className = 'dice-status active';
            elements.chargesStatus.textContent = `${chargesRemaining} left`;
            elements.chargesStatus.className = 'dice-status active';
            elements.rollD4Btn.disabled = false;
        } else if (chargesRemaining === 0 && currentD20Roll !== null) {
            elements.d20Status.textContent = '✅ Done';
            elements.d20Status.className = 'dice-status done';
            elements.d4Status.textContent = '⏳ No charges';
            elements.d4Status.className = 'dice-status waiting';
            elements.chargesStatus.textContent = 'Roll D20 again';
            elements.chargesStatus.className = 'dice-status waiting';
            elements.rollD4Btn.disabled = true;
        } else {
            elements.d20Status.textContent = '⏳ Ready';
            elements.d20Status.className = 'dice-status waiting';
            elements.d4Status.textContent = '⏳ Waiting...';
            elements.d4Status.className = 'dice-status waiting';
            elements.chargesStatus.textContent = 'Roll D20 first';
            elements.chargesStatus.className = 'dice-status waiting';
            elements.rollD4Btn.disabled = true;
        }

        renderGrid();
        renderLog();
    }

    function updateFeatureStats() {
        const stats = mapGenerator.getFeatureStats();
        const statDiv = elements.featureStats;
        if (!statDiv) return;

        const featureIcons = {
            treasure: '💰',
            trap: '⚠️',
            monster: '👹',
            puzzle: '🧩',
            shop: '🏪',
            boss: '👑'
        };

        let html = '';
        let totalFeatures = 0;
        for (const [type, count] of Object.entries(stats)) {
            if (count > 0) {
                totalFeatures += count;
                html += `<span class="feature-stat">
                            ${featureIcons[type] || '📦'} ${count}
                        </span>`;
            }
        }
        
        if (totalFeatures === 0) {
            html = '<span style="color: #666;">No features yet</span>';
        }
        
        statDiv.innerHTML = html;
    }

    // ... (rest of the app.js is the same as before)
    // Include all the render functions, event listeners, etc.
});