/**
 * Dungeon Cartographer - App Controller
 * Side Stats Layout with Better Scrolling
 */

document.addEventListener('DOMContentLoaded', () => {
    const mapGenerator = new DungeonMapGenerator();
    let currentMap = new Map();

    const elements = {
        rollD8Btn: document.getElementById('rollD8Btn'),
        rollD20Btn: document.getElementById('rollD20Btn'),
        rollD4Btn: document.getElementById('rollD4Btn'),
        balanceBtn: document.getElementById('balanceBtn'),
        placeObjectiveBtn: document.getElementById('placeObjectiveBtn'),
        resetBtn: document.getElementById('resetBtn'),
        undoBtn: document.getElementById('undoBtn'),
        printBtn: document.getElementById('printBtn'),
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
        roomTypesContent: document.getElementById('roomTypesContent')
    };

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
        const diff = stats.difficulty;
        
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

    // ============================================
    // RENDER GRID
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

        // Add extra padding for better scrolling visibility
        const padding = 3;
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
                    if (room.type === 'objective') {
                        tooltip = '⭐ GOAL - The adventurers\' destination!';
                    }
                    if (room.featureType && room.type !== 'objective') {
                        tooltip += `\n🎯 ${room.featureType.toUpperCase()}`;
                        if (room.hasTreasure) {
                            tooltip += ' 💎 (has treasure)';
                        }
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

        // Scroll to center on current position
        scrollToCurrent();
    }

    function scrollToCurrent() {
        const container = elements.grid.parentElement;
        const grid = elements.grid;
        if (!container || !grid || currentMap.size === 0) return;

        // Find the current cell
        const cells = grid.querySelectorAll('.cell');
        let currentCell = null;
        let index = 0;
        for (const cell of cells) {
            if (cell.classList.contains('cell-current')) {
                currentCell = cell;
                break;
            }
            index++;
        }

        if (currentCell) {
            // Scroll to center the current cell
            const containerRect = container.getBoundingClientRect();
            const cellRect = currentCell.getBoundingClientRect();
            
            const scrollX = cellRect.left - containerRect.left - containerRect.width / 2 + cellRect.width / 2;
            const scrollY = cellRect.top - containerRect.top - containerRect.height / 2 + cellRect.height / 2;
            
            container.scrollTo({
                left: container.scrollLeft + scrollX,
                top: container.scrollTop + scrollY,
                behavior: 'smooth'
            });
        }
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
        if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            elements.placeObjectiveBtn.click();
        }
        if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            elements.undoBtn.click();
        }
        if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
            elements.resetBtn.click();
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
    addLogEntry('⚖️ Press "B" to balance', 'info');
    addLogEntry('💡 8=D8 | Enter=Roll | G=Goal | B=Balance | Ctrl+Z=Undo | R=Reset', 'info');
    
    const initialDiff = mapGenerator.setDifficulty(3);
    currentD8Roll = 3;
    elements.d8Display.textContent = '3';
    elements.difficultyDisplay.textContent = initialDiff.name;
    elements.difficultyDisplay.style.color = initialDiff.color;
    elements.difficultyDetail.textContent = initialDiff.description;
    
    currentMap = new Map(mapGenerator.rooms);
    updateUI();

    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            renderGrid();
        }, 200);
    });

    // Also scroll on any update
    const observer = new MutationObserver(() => {
        scrollToCurrent();
    });
    observer.observe(elements.grid, { childList: true, subtree: true });
});