/**
 * Dungeon Cartographer - App Controller
 * With D8 Difficulty System
 */

document.addEventListener('DOMContentLoaded', () => {
    const mapGenerator = new DungeonMapGenerator();
    let currentMap = new Map();

    // DOM Elements
    const elements = {
        rollD20Btn: document.getElementById('rollD20Btn'),
        rollD4Btn: document.getElementById('rollD4Btn'),
        rollD8Btn: document.getElementById('rollD8Btn'),
        balanceBtn: document.getElementById('balanceBtn'),
        resetBtn: document.getElementById('resetBtn'),
        undoBtn: document.getElementById('undoBtn'),
        printBtn: document.getElementById('printBtn'),
        d20Display: document.getElementById('d20Display'),
        d4Display: document.getElementById('d4Display'),
        d8Display: document.getElementById('d8Display'),
        chargesDisplay: document.getElementById('chargesDisplay'),
        d20Status: document.getElementById('d20Status'),
        d4Status: document.getElementById('d4Status'),
        d8Status: document.getElementById('d8Status'),
        chargesStatus: document.getElementById('chargesStatus'),
        difficultyDisplay: document.getElementById('difficultyDisplay'),
        roomCount: document.getElementById('roomCount'),
        position: document.getElementById('position'),
        direction: document.getElementById('direction'),
        grid: document.getElementById('dungeon-grid'),
        log: document.getElementById('log'),
        featureStats: document.getElementById('featureStats')
    };

    let currentD20Roll = null;
    let currentD4Roll = null;
    let currentD8Roll = 3;
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
        elements.d8Display.textContent = currentD8Roll;
        elements.chargesDisplay.textContent = chargesRemaining;

        // Update difficulty display
        const diff = mapGenerator.getCurrentDifficulty();
        const diffName = diff ? diff.name : 'Normal';
        elements.difficultyDisplay.textContent = diffName;
        elements.difficultyDisplay.style.color = diff ? diff.color : '#ffff44';

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
        } else {
            html = `<span style="color: #888; margin-right: 8px;">🎯 Features:</span> ${html}`;
        }
        
        statDiv.innerHTML = html;
    }

    function renderGrid() {
        const grid = elements.grid;
        if (currentMap.size === 0) {
            grid.innerHTML = '<div style="padding: 50px; color: #666;">Roll D8 for difficulty, then D20 to start!</div>';
            return;
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        for (const [key, room] of currentMap) {
            minX = Math.min(minX, room.x);
            maxX = Math.max(maxX, room.x);
            minY = Math.min(minY, room.y);
            maxY = Math.max(maxY, room.y);
        }

        const padding = 2;
        minX -= padding;
        maxX += padding;
        minY -= padding;
        maxY += padding;

        const width = maxX - minX + 1;
        const containerWidth = elements.grid.parentElement.clientWidth - 40;
        const cellSize = Math.min(65, Math.floor((containerWidth / width) - 2));

        grid.style.gridTemplateColumns = `repeat(${width}, ${cellSize}px)`;
        grid.innerHTML = '';

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                const key = `${x},${y}`;
                const room = currentMap.get(key);
                const isCurrent = mapGenerator.currentPos.x === x && mapGenerator.currentPos.y === y;

                if (room) {
                    cell.classList.add('cell-room');
                    
                    if (room.type === 'start') {
                        cell.classList.add('cell-start');
                    }
                    
                    if (room.color) {
                        cell.classList.add(room.color);
                    }
                    
                    if (isCurrent) {
                        cell.classList.add('cell-current');
                    }

                    const iconSpan = document.createElement('span');
                    iconSpan.className = 'icon';
                    iconSpan.textContent = room.icon || '⬜';

                    const labelSpan = document.createElement('span');
                    labelSpan.className = 'label';
                    labelSpan.textContent = room.label || '';

                    cell.appendChild(iconSpan);
                    cell.appendChild(labelSpan);
                    
                    let tooltip = `Room ${room.id}`;
                    if (room.type === 'start') {
                        tooltip = '⭐ START - The beginning of your dungeon';
                    }
                    if (room.featureType) {
                        tooltip += `\n🎯 ${room.featureType.toUpperCase()}`;
                        const dist = mapGenerator.getRoomDistance(key);
                        tooltip += `\n📍 ${dist} rooms from start`;
                    }
                    cell.title = tooltip;
                } else {
                    cell.classList.add('cell-wall');
                }
                grid.appendChild(cell);
            }
        }
    }

    function renderLog() {
        const logDiv = elements.log;
        if (logDiv.children.length === 0) {
            logDiv.innerHTML = '<div class="log-entry info">🎲 Roll D8 to set difficulty!</div>';
        }
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    function addLogEntry(message, className = 'info') {
        const logDiv = elements.log;
        const entry = document.createElement('div');
        entry.className = `log-entry ${className}`;
        entry.textContent = message;
        logDiv.appendChild(entry);
        logDiv.scrollTop = logDiv.scrollHeight;
        
        while (logDiv.children.length > 25) {
            logDiv.removeChild(logDiv.firstChild);
        }
    }

    function handleD8Roll() {
        const result = mapGenerator.rollForDifficulty();
        currentD8Roll = result.roll;
        const config = result.config;
        
        addLogEntry(`🎲 D8 = ${result.roll} → ${config.name} difficulty!`, 'd20-roll');
        addLogEntry(`📊 Max Monsters: ${config.maxMonsters} | Bosses: ${config.bossCount} | Traps: ${config.trapMin}-${config.trapMax}`, 'info');
        addLogEntry(`📍 Bosses must be at least ${config.bossMinDistance} rooms from start`, 'info');
        
        elements.d8Display.textContent = result.roll;
        updateUI();
    }

    function handleD20Roll() {
        const result = mapGenerator.rollForCharges();
        currentD20Roll = result.finalRoll;
        chargesRemaining = result.charges;
        currentMap = new Map(mapGenerator.rooms);
        
        addLogEntry(`🎲 D20: ${result.rolls.join(', ')} → ${result.charges} charges!`, 'd20-roll');
        addLogEntry(`⭐ START room at (0, 0) - The beginning!`, 'start');
        
        elements.d20Display.textContent = result.finalRoll;
        updateUI();
    }

    function handleD4Roll() {
        if (chargesRemaining <= 0) {
            addLogEntry('⚠️ No charges! Roll D20 again.', 'danger');
            return;
        }

        const d4 = mapGenerator.rollDice(4);
        currentD4Roll = d4;
        
        const result = mapGenerator.placeRoom(d4);
        
        if (result.success) {
            currentMap = new Map(mapGenerator.rooms);
            chargesRemaining = result.chargesLeft;
            
            const dir = mapGenerator.getDirection(d4);
            
            if (result.feature) {
                addLogEntry(`🎲 D4 = ${d4} (${dir.emoji}) → ${result.message}`, 'feature');
            } else if (result.isMove) {
                addLogEntry(`🎲 D4 = ${d4} (${dir.emoji}) → ${result.message}`, 'place');
            } else {
                addLogEntry(`🎲 D4 = ${d4} (${dir.emoji}) → ${result.message}`, 'd4-roll');
            }
            
            elements.direction.textContent = `${dir.emoji} ${dir.name}`;
            elements.d4Display.textContent = d4;
            
            if (chargesRemaining === 0) {
                addLogEntry('🏁 No more charges! Roll D20 again.', 'info');
            }
        } else {
            addLogEntry(`❌ ${result.message}`, 'danger');
        }
        
        updateUI();
    }

    function handleBalance() {
        if (currentMap.size < 4) {
            addLogEntry('⚠️ Need at least 3 rooms to balance (excluding start)', 'danger');
            return;
        }

        const result = mapGenerator.balanceDungeon();
        if (result.success) {
            currentMap = new Map(mapGenerator.rooms);
            addLogEntry(`⚖️ ${result.message}`, 'balance');
            if (result.addedFeatures && result.addedFeatures.length > 0) {
                const featureCounts = {};
                result.addedFeatures.forEach(f => {
                    featureCounts[f.type] = (featureCounts[f.type] || 0) + 1;
                });
                for (const [type, count] of Object.entries(featureCounts)) {
                    addLogEntry(`   ➕ Added ${count} ${type.toUpperCase()}${type === 'boss' ? ' (far from start)' : ''}`, 'feature');
                }
            }
            updateUI();
        } else {
            addLogEntry(`⚠️ ${result.message}`, 'danger');
        }
    }

    function handleUndo() {
        const result = mapGenerator.undo();
        if (result.success) {
            currentMap = new Map(mapGenerator.rooms);
            chargesRemaining = mapGenerator.charges;
            addLogEntry(`↩️ ${result.message}`, 'info');
            updateUI();
        } else {
            addLogEntry(`❌ ${result.message}`, 'danger');
        }
    }

    function handleReset() {
        if (currentMap.size > 1) {
            if (confirm('Reset the dungeon?')) {
                mapGenerator.reset();
                currentMap = new Map(mapGenerator.rooms);
                currentD20Roll = null;
                currentD4Roll = null;
                chargesRemaining = 0;
                elements.direction.textContent = '-';
                elements.d4Display.textContent = '-';
                elements.d20Display.textContent = '-';
                elements.d8Display.textContent = currentD8Roll;
                elements.featureStats.innerHTML = '<span style="color: #666;">No features yet</span>';
                addLogEntry('🔄 Dungeon reset!', 'info');
                addLogEntry('⭐ START room ready at (0, 0)', 'start');
                updateUI();
            }
        } else {
            mapGenerator.reset();
            currentMap = new Map(mapGenerator.rooms);
            currentD20Roll = null;
            currentD4Roll = null;
            chargesRemaining = 0;
            elements.direction.textContent = '-';
            elements.d4Display.textContent = '-';
            elements.d20Display.textContent = '-';
            elements.d8Display.textContent = currentD8Roll;
            elements.featureStats.innerHTML = '<span style="color: #666;">No features yet</span>';
            addLogEntry('🔄 Dungeon reset!', 'info');
            addLogEntry('⭐ START room ready at (0, 0)', 'start');
            updateUI();
        }
    }

    // Event Listeners
    elements.rollD8Btn.addEventListener('click', handleD8Roll);
    elements.rollD20Btn.addEventListener('click', handleD20Roll);
    elements.rollD4Btn.addEventListener('click', handleD4Roll);
    elements.balanceBtn.addEventListener('click', handleBalance);
    elements.undoBtn.addEventListener('click', handleUndo);
    elements.resetBtn.addEventListener('click', handleReset);
    
    elements.printBtn.addEventListener('click', () => {
        window.print();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === '8' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            elements.rollD8Btn.click();
        }
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!elements.rollD4Btn.disabled) {
                elements.rollD4Btn.click();
            } else if (!elements.rollD20Btn.disabled) {
                elements.rollD20Btn.click();
            }
        }
        if (e.key === 'b' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            elements.balanceBtn.click();
        }
        if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            elements.undoBtn.click();
        }
        if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
            elements.resetBtn.click();
        }
    });

    // Initialization
    addLogEntry('🎲 Welcome to the Dungeon Cartographer!', 'info');
    addLogEntry('📖 Press "8" or click "Roll D8" to set difficulty!', 'info');
    addLogEntry('⭐ START room at (0, 0) - Always visible!', 'start');
    addLogEntry('📖 Then roll D20 → get charges → roll D4 → place rooms', 'info');
    addLogEntry('🎯 Features appear based on difficulty level!', 'info');
    addLogEntry('⚖️ Press "Balance" or "B" to balance features', 'info');
    addLogEntry('💡 8 = Difficulty | Enter = Roll | Ctrl+Z = Undo | R = Reset', 'info');
    
    // Set initial difficulty
    const initialDiff = mapGenerator.setDifficulty(3);
    currentD8Roll = 3;
    elements.d8Display.textContent = '3';
    elements.difficultyDisplay.textContent = initialDiff.name;
    elements.difficultyDisplay.style.color = initialDiff.color;
    
    currentMap = new Map(mapGenerator.rooms);
    updateUI();

    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(renderGrid, 200);
    });
});