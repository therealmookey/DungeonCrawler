/**
 * Dungeon Cartographer - App Controller
 * This file uses the DungeonMapGenerator class from dungeon.js
 */

console.log('📱 app.js loaded - Checking for DungeonMapGenerator...');
console.log('   DungeonMapGenerator exists?', typeof DungeonMapGenerator !== 'undefined');

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 DOMContentLoaded fired');
    
    // Check if class exists
    if (typeof DungeonMapGenerator === 'undefined') {
        console.error('❌ DungeonMapGenerator class not found! Make sure dungeon.js loads first.');
        document.body.innerHTML = `
            <div style="padding: 50px; color: #ff4444; text-align: center;">
                <h1>⚠️ Error Loading Application</h1>
                <p>DungeonMapGenerator class not found.</p>
                <p>Make sure <code>js/dungeon.js</code> is loaded before <code>js/app.js</code></p>
                <p style="color: #888; font-size: 0.8em;">Check the console (F12) for more details.</p>
            </div>
        `;
        return;
    }

    console.log('✅ DungeonMapGenerator found! Creating instance...');
    const mapGenerator = new DungeonMapGenerator();
    console.log('✅ mapGenerator instance created');

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

    console.log('📊 Elements found:', Object.keys(elements).length);

    // ============================================
    // UPDATE UI
    // ============================================
    function updateUI() {
        console.log('🔄 updateUI called');
        
        elements.position.textContent = `(${mapGenerator.currentPos.x}, ${mapGenerator.currentPos.y})`;
        
        if (currentD20Roll !== null) {
            elements.d20Display.textContent = currentD20Roll;
        }
        if (currentD4Roll !== null) {
            elements.d4Display.textContent = currentD4Roll;
        }
        elements.d8Display.textContent = currentD8Roll;
        elements.chargesDisplay.textContent = chargesRemaining;

        const diff = mapGenerator.getCurrentDifficulty();
        elements.difficultyDisplay.textContent = diff.name;
        elements.difficultyDisplay.style.color = diff.color;
        elements.difficultyDetail.textContent = diff.description;

        updateStatus();
        updateDungeonStats();
        updateRoomTypes();
        updateFeatureStats();
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

    function updateBalanceButton() {
        const balanceBtn = elements.balanceBtn;
        if (!balanceBtn) return;

        if (mapGenerator.isBalanceUsed()) {
            balanceBtn.disabled = true;
            balanceBtn.textContent = '✅ Used';
            balanceBtn.style.opacity = '0.6';
            balanceBtn.title = 'Balance already used. Reset to balance again.';
        } else {
            balanceBtn.disabled = false;
            balanceBtn.textContent = '⚖️';
            balanceBtn.style.opacity = '1';
            balanceBtn.title = 'Balance Features (once per dungeon)';
        }
    }

    function updateDungeonStats() {
        const statsDiv = elements.statsContent;
        if (!statsDiv) return;

        if (currentMap.size === 0) {
            statsDiv.innerHTML = '<span style="color: #666; grid-column: 1/-1;">Build a dungeon to see stats</span>';
            return;
        }

        const stats = mapGenerator.getDungeonStats();
        let html = '';
        html += `<div class="stat-item"><span class="stat-label">🏠 Rooms</span><span class="stat-value">${stats.totalRooms}</span></div>`;
        html += `<div class="stat-item"><span class="stat-label">📏 Depth</span><span class="stat-value">${stats.depth}</span></div>`;
        html += `<div class="stat-item"><span class="stat-label">⭐ Goal</span><span class="stat-value">${stats.objectivePlaced ? '✅ Placed' : '❌ Not set'}</span></div>`;
        html += `<div class="stat-item"><span class="stat-label">⚖️ Balance</span><span class="stat-value" style="color: ${stats.balanceUsed ? '#88ff88' : '#ffaa44'};">${stats.balanceUsed ? '✅ Used' : '⏳ Ready'}</span></div>`;
        statsDiv.innerHTML = html;
    }

    function updateRoomTypes() {
        const typesDiv = elements.roomTypesContent;
        if (!typesDiv) return;

        if (currentMap.size === 0) {
            typesDiv.innerHTML = '<span style="color: #666;">No rooms yet</span>';
            return;
        }

        // Simple room type count
        const counts = { start: 0, room: 0, objective: 0 };
        for (const [key, room] of currentMap) {
            counts[room.type] = (counts[room.type] || 0) + 1;
        }

        let html = '';
        for (const [type, count] of Object.entries(counts)) {
            if (count > 0) {
                const icon = type === 'start' ? '🏠' : type === 'objective' ? '⭐' : '⬜';
                html += `<span class="room-type-item"><span class="icon">${icon}</span><span class="count">${count}</span></span>`;
            }
        }
        typesDiv.innerHTML = html || '<span style="color: #666;">No rooms yet</span>';
    }

    function updateFeatureStats() {
        const stats = mapGenerator.getFeatureStats();
        const statDiv = elements.featureStats;
        if (!statDiv) return;

        let html = '';
        let total = 0;
        for (const [type, count] of Object.entries(stats)) {
            if (count > 0) {
                total += count;
                const icons = { treasure: '💰', trap: '⚠️', monster: '👹', puzzle: '🧩', shop: '🏪', boss: '👑', monsterTreasure: '💎', objective: '⭐' };
                html += `<span class="feature-stat">${icons[type] || '📦'} ${count}</span>`;
            }
        }
        statDiv.innerHTML = total > 0 ? html : '<span style="color: #666;">No features yet</span>';
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
                    if (room.type === 'start') cell.classList.add('cell-start');
                    if (room.color) cell.classList.add(room.color);
                    if (isCurrent) cell.classList.add('cell-current');

                    const iconSpan = document.createElement('span');
                    iconSpan.className = 'icon';
                    iconSpan.textContent = room.icon || '⬜';

                    const labelSpan = document.createElement('span');
                    labelSpan.className = 'label';
                    labelSpan.textContent = room.label || '';

                    cell.appendChild(iconSpan);
                    cell.appendChild(labelSpan);
                } else {
                    cell.classList.add('cell-wall');
                }
                grid.appendChild(cell);
            }
        }
    }

    // ============================================
    // LOG
    // ============================================
    function renderLog() {
        // Keep existing log entries
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
        console.log('🎲 handleD8Roll called');
        const result = mapGenerator.rollForDifficulty();
        currentD8Roll = result.roll;
        addLogEntry(`🎲 D8 = ${result.roll} → ${result.name} difficulty!`, 'd20-roll');
        elements.d8Display.textContent = result.roll;
        updateUI();
    }

    function handleD20Roll() {
        console.log('🎲 handleD20Roll called');
        const result = mapGenerator.rollForCharges();
        currentD20Roll = result.finalRoll;
        chargesRemaining = result.charges;
        currentMap = new Map(mapGenerator.rooms);
        addLogEntry(`🎲 D20: ${result.rolls.join(', ')} → ${result.charges} charges!`, 'd20-roll');
        elements.d20Display.textContent = result.finalRoll;
        updateUI();
    }

    function handleD4Roll() {
        console.log('🎲 handleD4Roll called');
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
            addLogEntry(`D4=${direction} ${dir.emoji} → ${result.message}`, 'd4-roll');
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
        console.log('⭐ handlePlaceObjective called');
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
        console.log('⚖️ handleBalance called');
        if (mapGenerator.isBalanceUsed()) {
            addLogEntry('⚠️ Balance already used! Reset to balance again.', 'danger');
            return;
        }

        const result = mapGenerator.balanceDungeon();
        if (result.success) {
            currentMap = new Map(mapGenerator.rooms);
            addLogEntry(`⚖️ ${result.message}`, 'balance');
            updateUI();
        } else if (result.alreadyUsed) {
            addLogEntry(`⚠️ ${result.message}`, 'danger');
        } else {
            addLogEntry(`⚠️ ${result.message}`, 'danger');
        }
    }

    function handleUndo() {
        console.log('↩️ handleUndo called');
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
        console.log('🔄 handleReset called');
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
        console.log('🖨️ handlePrint called');
        window.print();
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================
    console.log('🔗 Attaching event listeners...');
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
    });

    // ============================================
    // INITIALIZATION
    // ============================================
    console.log('🚀 Initializing application...');
    addLogEntry('🎲 Welcome to the Dungeon Cartographer!', 'info');
    addLogEntry('📖 Press "8" → Set difficulty', 'info');
    addLogEntry('📖 Then D20 → get charges → D4 → place rooms', 'info');
    addLogEntry('💡 8=D8 | Enter=Roll | G=Goal | B=Balance | Ctrl+Z=Undo | R=Reset', 'info');
    
    currentMap = new Map(mapGenerator.rooms);
    updateUI();
    console.log('✅ Application initialized successfully!');
});