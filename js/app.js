/**
 * Dungeon Cartographer - App Controller
 * Three Column Layout with Tutorial System & Balance Lock
 */

document.addEventListener('DOMContentLoaded', () => {
    const mapGenerator = new DungeonMapGenerator();
    let currentMap = new Map();

    // DOM Elements
    const elements = {
        rollD8Btn: document.getElementById('rollD8Btn'),
        rollD20Btn: document.getElementById('rollD20Btn'),
        rollD4Btn: document.getElementById('rollD4Btn'),
        balanceBtn: document.getElementById('balanceBtn'),
        placeObjectiveBtn: document.getElementById('placeObjectiveBtn'),
        resetBtn: document.getElementById('resetBtn'),
        undoBtn: document.getElementById('undoBtn'),
        printBtn: document.getElementById('printBtn'),
        tutorialBtn: document.getElementById('tutorialBtn'),
        d8Display: document.getElementById('d8Display'),
        d20Display: document.getElementById('d20Display'),
        d4Display: document.getElementById('d4Display'),
        chargesDisplay: document.getElementById('chargesDisplay'),
        difficultyDisplay: document.getElementById('difficultyDisplay'),
        difficultyDetail: document.getElementById('difficultyDetail'),
        position: document.getElementById('position'),
        direction: document.getElementById('direction'),
        diceStatus: document.getElementById('diceStatus'),
        grid: document.getElementById('dungeon-grid'),
        log: document.getElementById('log'),
        statsContent: document.getElementById('statsContent'),
        roomTypesContent: document.getElementById('roomTypesContent'),
        featureStats: document.getElementById('featureStats')
    };

    // State
    let currentD20Roll = null;
    let currentD4Roll = null;
    let currentD8Roll = 3;
    let chargesRemaining = 0;

    // ============================================
    // UPDATE UI
    // ============================================
    function updateUI() {
        // Position
        elements.position.textContent = `(${mapGenerator.currentPos.x}, ${mapGenerator.currentPos.y})`;
        
        // Dice displays
        if (currentD20Roll !== null) {
            elements.d20Display.textContent = currentD20Roll;
        }
        if (currentD4Roll !== null) {
            elements.d4Display.textContent = currentD4Roll;
        }
        elements.d8Display.textContent = currentD8Roll;
        elements.chargesDisplay.textContent = chargesRemaining;

        // Difficulty
        const diff = mapGenerator.getCurrentDifficulty();
        elements.difficultyDisplay.textContent = diff.name;
        elements.difficultyDisplay.style.color = diff.color;
        elements.difficultyDetail.textContent = diff.description;

        // Update status
        updateStatus();

        // Update stats
        updateDungeonStats();
        updateRoomTypes();
        updateFeatureStats();

        // Update balance button
        updateBalanceButton();

        renderGrid();
        renderLog();
    }

    function updateStatus() {
        if (chargesRemaining > 0) {
            elements.diceStatus.textContent = `✅ ${chargesRemaining} charges remaining - Roll D4!`;
            elements.diceStatus.className = 'dice-status active';
            elements.rollD4Btn.disabled = false;
        } else if (chargesRemaining === 0 && currentD20Roll !== null) {
            elements.diceStatus.textContent = '⏳ No charges - Roll D20 again!';
            elements.diceStatus.className = 'dice-status waiting';
            elements.rollD4Btn.disabled = true;
        } else {
            elements.diceStatus.textContent = '🎲 Roll D20 to get charges!';
            elements.diceStatus.className = 'dice-status waiting';
            elements.rollD4Btn.disabled = true;
        }
    }

    // ============================================
    // UPDATE BALANCE BUTTON
    // ============================================
    function updateBalanceButton() {
        const balanceBtn = elements.balanceBtn;
        if (!balanceBtn) return;

        if (mapGenerator.isBalanceUsed()) {
            balanceBtn.disabled = true;
            balanceBtn.textContent = '✅ Balanced';
            balanceBtn.style.opacity = '0.7';
            balanceBtn.title = 'Balance already used. Reset to balance again.';
            balanceBtn.classList.add('balance-used');
        } else {
            balanceBtn.disabled = false;
            balanceBtn.textContent = '⚖️';
            balanceBtn.style.opacity = '1';
            balanceBtn.title = 'Balance Features (once per dungeon)';
            balanceBtn.classList.remove('balance-used');
        }
    }

    // ============================================
    // DUNGEON STATS
    // ============================================
    function updateDungeonStats() {
        const statsDiv = elements.statsContent;
        if (!statsDiv) return;

        if (currentMap.size === 0) {
            statsDiv.innerHTML = '<span style="color: #666; grid-column: 1/-1;">Build a dungeon to see stats</span>';
            return;
        }

        const stats = mapGenerator.getDungeonStats();
        
        let html = '';
        
        // Rooms
        html += `<div class="stat-item">
                    <span class="stat-label">🏠 Rooms</span>
                    <span class="stat-value">${stats.totalRooms}</span>
                </div>`;
        
        // Depth
        html += `<div class="stat-item">
                    <span class="stat-label">📏 Depth</span>
                    <span class="stat-value">${stats.depth}</span>
                </div>`;
        
        // Features total
        let totalFeatures = 0;
        for (const [type, count] of Object.entries(stats.featureStats)) {
            if (type !== 'monsterTreasure' && type !== 'objective') {
                totalFeatures += count;
            }
        }
        html += `<div class="stat-item">
                    <span class="stat-label">🎯 Features</span>
                    <span class="stat-value">${totalFeatures}</span>
                </div>`;
        
        // Farthest room
        if (stats.farthestRoom) {
            html += `<div class="stat-item">
                        <span class="stat-label">📍 Farthest</span>
                        <span class="stat-value">${stats.farthestRoom.distance}</span>
                    </div>`;
        }
        
        // Goal
        if (stats.objectivePlaced) {
            html += `<div class="stat-item">
                        <span class="stat-label">⭐ Goal</span>
                        <span class="stat-value">✅ Placed</span>
                    </div>`;
        } else {
            html += `<div class="stat-item">
                        <span class="stat-label">⭐ Goal</span>
                        <span class="stat-value" style="color: #666;">Not set</span>
                    </div>`;
        }
        
        // Balance status
        html += `<div class="stat-item">
                    <span class="stat-label">⚖️ Balance</span>
                    <span class="stat-value" style="color: ${stats.balanceUsed ? '#88ff88' : '#ffaa44'};">${stats.balanceUsed ? '✅ Used' : '⏳ Ready'}</span>
                </div>`;
        
        // Direction stats
        const totalMoves = stats.directionStats.totalMoves || 0;
        if (totalMoves > 0) {
            const newPct = ((stats.directionStats.newDirections / totalMoves) * 100).toFixed(0);
            html += `<div class="stat-item">
                        <span class="stat-label">🧭 New</span>
                        <span class="stat-value">${newPct}%</span>
                    </div>`;
            html += `<div class="stat-item">
                        <span class="stat-label">↩️ Backup</span>
                        <span class="stat-value">${100 - newPct}%</span>
                    </div>`;
        }
        
        statsDiv.innerHTML = html;
    }

    function updateRoomTypes() {
        const typesDiv = elements.roomTypesContent;
        if (!typesDiv) return;

        if (currentMap.size === 0) {
            typesDiv.innerHTML = '<span style="color: #666;">No rooms yet</span>';
            return;
        }

        const stats = mapGenerator.getDungeonStats();
        const typeIcons = {
            start: '🏠',
            monster: '👹',
            treasure: '💰',
            trap: '⚠️',
            boss: '👑',
            puzzle: '🧩',
            shop: '🏪',
            objective: '⭐',
            empty: '⬜'
        };
        
        let html = '';
        const sortedTypes = Object.entries(stats.percentages).sort((a, b) => b[1] - a[1]);
        
        for (const [type, pct] of sortedTypes) {
            const icon = typeIcons[type] || '📦';
            const count = stats.roomTypes[type] || 0;
            if (count > 0) {
                html += `<span class="room-type-item">
                            <span class="icon">${icon}</span>
                            <span class="count">${count}</span>
                            <span class="pct">(${pct}%)</span>
                        </span>`;
            }
        }
        
        typesDiv.innerHTML = html || '<span style="color: #666;">No rooms yet</span>';
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
            boss: '👑',
            monsterTreasure: '💎',
            objective: '⭐'
        };

        let html = '';
        let totalFeatures = 0;
        for (const [type, count] of Object.entries(stats)) {
            if (count > 0 && type !== 'monsterTreasure') {
                totalFeatures += count;
                const icon = featureIcons[type] || '📦';
                html += `<span class="feature-stat">${icon} ${count}</span>`;
            }
        }
        
        if (stats.monsterTreasure > 0) {
            html += `<span class="feature-stat" style="border-color: #ffd700;">💎 ${stats.monsterTreasure}</span>`;
        }
        
        if (stats.objective > 0) {
            html += `<span class="feature-stat" style="border-color: #ffd700; animation: pulse-objective 2s infinite;">⭐ ${stats.objective}</span>`;
        }
        
        if (totalFeatures === 0 && stats.monsterTreasure === 0 && stats.objective === 0) {
            html = '<span style="color: #666;">No features yet</span>';
        } else {
            html = `<span style="color: #888; margin-right: 8px;">🎯 Features:</span> ${html}`;
        }
        
        statDiv.innerHTML = html;
    }

    // ============================================
    // RENDER GRID - UPDATED WITH FIXED WIDTH
    // ============================================
    function renderGrid() {
    const grid = elements.grid;
    if (currentMap.size === 0) {
        grid.innerHTML = '<div style="padding: 50px; color: #666; text-align: center;">🎲 Roll D8 for difficulty, then D20 to start!</div>';
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

    const padding = 3;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    
    const container = elements.grid.parentElement;
    const containerWidth = container.clientWidth - 4;
    const containerHeight = container.clientHeight - 4;
    
    let cellSize = Math.min(
        Math.floor(containerWidth / width),
        Math.floor(containerHeight / height),
        65
    );
    cellSize = Math.max(cellSize, 20);

    grid.style.gridTemplateColumns = `repeat(${width}, ${cellSize}px)`;
    grid.innerHTML = '';

    // Define clear, readable labels and icons
    const roomDisplay = {
        start: { icon: '🏠', label: 'START' },
        treasure: { icon: '💰', label: 'TREASURE' },
        trap: { icon: '⚔️', label: 'TRAP' },
        monster: { icon: '👹', label: 'MONSTER' },
        puzzle: { icon: '🧩', label: 'PUZZLE' },
        shop: { icon: '🏪', label: 'SHOP' },
        boss: { icon: '👑', label: 'BOSS' },
        objective: { icon: '⭐', label: 'GOAL' },
        room: { icon: '⬜', label: '' },
        empty: { icon: '⬜', label: '' }
    };

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            cell.style.width = cellSize + 'px';
            cell.style.height = cellSize + 'px';
            cell.style.minWidth = cellSize + 'px';
            cell.style.maxWidth = cellSize + 'px';
            cell.style.minHeight = cellSize + 'px';
            cell.style.maxHeight = cellSize + 'px';
            
            const key = `${x},${y}`;
            const room = currentMap.get(key);
            const isCurrent = mapGenerator.currentPos.x === x && mapGenerator.currentPos.y === y;

            if (room) {
                cell.classList.add('cell-room');
                if (room.type === 'start') cell.classList.add('cell-start');
                if (room.color) cell.classList.add(room.color);
                if (isCurrent) cell.classList.add('cell-current');

                // Determine display info
                let displayIcon = '⬜';
                let displayLabel = '';
                let displayType = room.type;

                if (room.type === 'objective') {
                    displayIcon = '⭐';
                    displayLabel = 'GOAL';
                } else if (room.type === 'start') {
                    displayIcon = '🏠';
                    displayLabel = 'START';
                } else if (room.featureType) {
                    const feature = roomDisplay[room.featureType];
                    displayIcon = feature ? feature.icon : '⬜';
                    displayLabel = feature ? feature.label : '';
                    
                    // If monster has treasure, show it
                    if (room.featureType === 'monster' && room.hasTreasure) {
                        displayIcon = '👹💎';
                        displayLabel = 'MONSTER';
                    }
                }

                const iconSpan = document.createElement('span');
                iconSpan.className = 'icon';
                iconSpan.textContent = displayIcon;
                iconSpan.style.fontSize = Math.min(cellSize * 0.4, 32) + 'px';

                const labelSpan = document.createElement('span');
                labelSpan.className = 'label';
                labelSpan.textContent = displayLabel;
                labelSpan.style.fontSize = Math.max(cellSize * 0.12, 7) + 'px';

                cell.appendChild(iconSpan);
                cell.appendChild(labelSpan);
                
                // Tooltip with room info
                let tooltip = `Room ${room.id}`;
                if (room.type === 'start') tooltip = '🏠 START - The beginning';
                if (room.type === 'objective') tooltip = '⭐ GOAL - The destination!';
                if (room.featureType && room.type !== 'objective' && room.type !== 'start') {
                    tooltip += `\n🎯 ${room.featureType.toUpperCase()}`;
                    if (room.hasTreasure) tooltip += ' 💎 (has treasure)';
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

    setTimeout(scrollToCurrent, 50);
}

    // ============================================
    // LOG
    // ============================================
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
        
        while (logDiv.children.length > 30) {
            logDiv.removeChild(logDiv.firstChild);
        }
    }

    // ============================================
    // ACTIONS
    // ============================================
    function handleD8Roll() {
        const result = mapGenerator.rollForDifficulty();
        currentD8Roll = result.roll;
        const config = result.config;
        
        addLogEntry(`🎲 D8 = ${result.roll} → ${config.name} difficulty!`, 'd20-roll');
        addLogEntry(`📊 ${config.description}`, 'info');
        addLogEntry(`📊 Max Monsters: ${config.maxMonsters} | Bosses: ${config.bossCount}`, 'info');
        addLogEntry(`💎 Monsters have ${config.monsterTreasureChance}% chance to drop treasure`, 'info');
        
        elements.d8Display.textContent = result.roll;
        updateUI();
    }

    function handleD20Roll() {
        const result = mapGenerator.rollForCharges();
        currentD20Roll = result.finalRoll;
        chargesRemaining = result.charges;
        currentMap = new Map(mapGenerator.rooms);
        
        addLogEntry(`🎲 D20: ${result.rolls.join(', ')} → ${result.charges} charges!`, 'd20-roll');
        addLogEntry(`⭐ START room at (0, 0)`, 'start');
        
        elements.d20Display.textContent = result.finalRoll;
        updateUI();
    }

    function handleD4Roll() {
        if (chargesRemaining <= 0) {
            addLogEntry('⚠️ No charges! Roll D20 again.', 'danger');
            return;
        }

        const direction = mapGenerator.rollForDirection();
        currentD4Roll = direction;
        
        const result = mapGenerator.placeRoom(direction);
        
        if (result.success) {
            currentMap = new Map(mapGenerator.rooms);
            chargesRemaining = result.chargesLeft;
            
            const dir = mapGenerator.getDirection(direction);
            const directionType = result.isMove ? '↩️ Backup' : '➡️ New';
            
            if (result.feature) {
                const treasureNote = result.feature.hasTreasure ? ' 💎' : '';
                addLogEntry(`D4=${direction} ${dir.emoji} ${directionType} → ${result.message}${treasureNote}`, 'feature');
            } else if (result.isMove) {
                addLogEntry(`D4=${direction} ${dir.emoji} ${directionType} → ${result.message}`, 'place');
            } else {
                addLogEntry(`D4=${direction} ${dir.emoji} ${directionType} → ${result.message}`, 'd4-roll');
            }
            
            elements.direction.textContent = `${dir.emoji} ${dir.name}`;
            elements.d4Display.textContent = direction;
            
            if (chargesRemaining === 0) {
                addLogEntry('🏁 No more charges! Roll D20 again.', 'info');
            }
            
            updateUI();
        } else {
            addLogEntry(`❌ ${result.message}`, 'danger');
        }
    }

    function handlePlaceObjective() {
        if (mapGenerator.isObjectivePlaced()) {
            addLogEntry('⚠️ Objective already placed!', 'danger');
            return;
        }

        const result = mapGenerator.placeObjective();
        if (result.success) {
            currentMap = new Map(mapGenerator.rooms);
            addLogEntry(`⭐ ${result.message}`, 'feature');
            updateUI();
        } else {
            addLogEntry(`⚠️ ${result.message}`, 'danger');
        }
    }

    function handleBalance() {
        if (mapGenerator.isBalanceUsed()) {
            addLogEntry('⚠️ Balance already used! Reset the dungeon to balance again.', 'danger');
            updateBalanceButton();
            return;
        }

        if (currentMap.size < 4) {
            addLogEntry('⚠️ Need at least 3 rooms to balance', 'danger');
            return;
        }

        const result = mapGenerator.balanceDungeon();
        if (result.success) {
            currentMap = new Map(mapGenerator.rooms);
            addLogEntry(`⚖️ ${result.message}`, 'balance');
            if (result.objectivePlaced) {
                addLogEntry(`⭐ Objective auto-placed!`, 'feature');
            }
            updateUI();
        } else if (result.alreadyUsed) {
            addLogEntry(`⚠️ ${result.message}`, 'danger');
            updateBalanceButton();
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
        if (currentMap.size > 1 && !confirm('Reset the dungeon?')) {
            return;
        }
        
        mapGenerator.reset();
        currentMap = new Map(mapGenerator.rooms);
        currentD20Roll = null;
        currentD4Roll = null;
        chargesRemaining = 0;
        elements.direction.textContent = '-';
        elements.d4Display.textContent = '-';
        elements.d20Display.textContent = '-';
        elements.d8Display.textContent = currentD8Roll;
        addLogEntry('🔄 Dungeon reset!', 'info');
        updateUI();
    }

    function handlePrint() {
        window.print();
    }

    // ============================================
    // TUTORIAL INTEGRATION
    // ============================================
    let tutorial = null;

    function initTutorial() {
        if (typeof TutorialManager !== 'undefined') {
            tutorial = new TutorialManager();
        }
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================
    elements.rollD8Btn.addEventListener('click', handleD8Roll);
    elements.rollD20Btn.addEventListener('click', handleD20Roll);
    elements.rollD4Btn.addEventListener('click', handleD4Roll);
    elements.balanceBtn.addEventListener('click', handleBalance);
    elements.placeObjectiveBtn.addEventListener('click', handlePlaceObjective);
    elements.undoBtn.addEventListener('click', handleUndo);
    elements.resetBtn.addEventListener('click', handleReset);
    elements.printBtn.addEventListener('click', handlePrint);

    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================
    document.addEventListener('keydown', (e) => {
        if (tutorial && tutorial.isActive) return;

        const tag = e.target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;

        if (e.key === '8' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            elements.rollD8Btn.click();
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!elements.rollD4Btn.disabled) {
                elements.rollD4Btn.click();
            } else if (!elements.rollD20Btn.disabled) {
                elements.rollD20Btn.click();
            }
            return;
        }

        if (e.key === 'g' || e.key === 'G') {
            if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                elements.placeObjectiveBtn.click();
            }
            return;
        }

        if (e.key === 'b' || e.key === 'B') {
            if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                elements.balanceBtn.click();
            }
            return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            elements.undoBtn.click();
            return;
        }

        if (e.key === 'r' || e.key === 'R') {
            if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                elements.resetBtn.click();
            }
            return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            return;
        }

        if (e.key === 't' || e.key === 'T') {
            if (!e.ctrlKey && !e.metaKey && tutorial) {
                e.preventDefault();
                tutorial.start();
            }
            return;
        }
    });

    // ============================================
    // INITIALIZATION
    // ============================================
    addLogEntry('🎲 Welcome to the Dungeon Cartographer!', 'info');
    addLogEntry('📖 Press "8" → Set difficulty', 'info');
    addLogEntry('📖 Then D20 → get charges → D4 → place rooms', 'info');
    addLogEntry('🎯 70% new directions, 30% backup', 'info');
    addLogEntry('⭐ Press "G" to place the Goal', 'info');
    addLogEntry('⚖️ Press "B" to balance (once per dungeon)', 'info');
    addLogEntry('❓ Press "T" for tutorial', 'info');
    addLogEntry('💡 8=D8 | Enter=Roll | G=Goal | B=Balance | Ctrl+Z=Undo | R=Reset', 'info');
    
    const initialDiff = mapGenerator.setDifficulty(3);
    currentD8Roll = 3;
    elements.d8Display.textContent = '3';
    elements.difficultyDisplay.textContent = initialDiff.name;
    elements.difficultyDisplay.style.color = initialDiff.color;
    elements.difficultyDetail.textContent = initialDiff.description;
    
    currentMap = new Map(mapGenerator.rooms);
    updateUI();

    setTimeout(initTutorial, 100);

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            renderGrid();
        }, 200);
    });

    const observer = new MutationObserver(() => {
        scrollToCurrent();
    });
    observer.observe(elements.grid, { childList: true, subtree: true });

    window.appFunctions = {
        handleD8Roll,
        handleD20Roll,
        handleD4Roll,
        handlePlaceObjective,
        handleBalance,
        handleUndo,
        handleReset,
        handlePrint,
        updateUI,
        addLogEntry
    };
});