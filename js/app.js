/**
 * Dungeon Cartographer - App Controller
 * Full map view with bottom controls
 */

document.addEventListener('DOMContentLoaded', () => {
    const mapGenerator = new DungeonMapGenerator();
    let currentMap = new Map();

    // DOM Elements
    const elements = {
        rollD20Btn: document.getElementById('rollD20Btn'),
        rollD4Btn: document.getElementById('rollD4Btn'),
        resetBtn: document.getElementById('resetBtn'),
        undoBtn: document.getElementById('undoBtn'),
        printBtn: document.getElementById('printBtn'),
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
        log: document.getElementById('log')
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

    function renderGrid() {
        const grid = elements.grid;
        if (currentMap.size === 0) {
            grid.innerHTML = '<div style="padding: 50px; color: #666;">Roll D20 to start building!</div>';
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
                    
                    // Start room gets special styling
                    if (room.type === 'start') {
                        cell.classList.add('cell-start');
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
                    
                    // Tooltip with more info
                    if (room.type === 'start') {
                        cell.title = '⭐ START - The beginning of your dungeon';
                    } else {
                        cell.title = `Room ${room.id}`;
                    }
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
            logDiv.innerHTML = '<div class="log-entry info">🎲 Roll D20 to start!</div>';
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
        
        while (logDiv.children.length > 20) {
            logDiv.removeChild(logDiv.firstChild);
        }
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
            addLogEntry(`🎲 D4 = ${d4} (${dir.emoji}) → ${result.message}`, 'd4-roll');
            
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
            addLogEntry('🔄 Dungeon reset!', 'info');
            addLogEntry('⭐ START room ready at (0, 0)', 'start');
            updateUI();
        }
    }

    // Event Listeners
    elements.rollD20Btn.addEventListener('click', handleD20Roll);
    elements.rollD4Btn.addEventListener('click', handleD4Roll);
    elements.undoBtn.addEventListener('click', handleUndo);
    elements.resetBtn.addEventListener('click', handleReset);
    
    elements.printBtn.addEventListener('click', () => {
        window.print();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!elements.rollD4Btn.disabled) {
                elements.rollD4Btn.click();
            } else {
                elements.rollD20Btn.click();
            }
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
    addLogEntry('⭐ START room at (0, 0) - Always visible!', 'start');
    addLogEntry('📖 Roll D20 → get charges → roll D4 → place rooms', 'info');
    addLogEntry('💡 Enter = Roll | Ctrl+Z = Undo | R = Reset', 'info');
    
    currentMap = new Map(mapGenerator.rooms);
    updateUI();

    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(renderGrid, 200);
    });
});