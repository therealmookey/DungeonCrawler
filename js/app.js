/**
 * Dungeon Cartographer - App Controller
 * Connects the dungeon generator to the UI
 */

document.addEventListener('DOMContentLoaded', () => {
    const mapGenerator = new DungeonMapGenerator();
    let currentMap = new Map();

    const elements = {
        generateBtn: document.getElementById('generateBtn'),
        exportBtn: document.getElementById('exportBtn'),
        printBtn: document.getElementById('printBtn'),
        resetBtn: document.getElementById('resetBtn'),
        roomCount: document.getElementById('roomCount'),
        depth: document.getElementById('depth'),
        monsterCount: document.getElementById('monsterCount'),
        treasureCount: document.getElementById('treasureCount'),
        trapCount: document.getElementById('trapCount'),
        bossCount: document.getElementById('bossCount'),
        grid: document.getElementById('dungeon-grid'),
        log: document.getElementById('log'),
        legendContainer: document.getElementById('legend-container')
    };

    function updateUI() {
        elements.roomCount.textContent = currentMap.size;
        elements.depth.textContent = mapGenerator.depth;
        elements.monsterCount.textContent = mapGenerator.stats.monsters || 0;
        elements.treasureCount.textContent = mapGenerator.stats.treasures || 0;
        elements.trapCount.textContent = mapGenerator.stats.traps || 0;
        elements.bossCount.textContent = mapGenerator.stats.bosses || 0;

        renderGrid();
        renderLegend();
        renderLog();
    }

    function renderGrid() {
        const grid = elements.grid;
        if (currentMap.size === 0) {
            grid.innerHTML = '<div style="padding: 50px; color: #666;">Click "Generate Dungeon" to create a map.</div>';
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

                if (room) {
                    cell.classList.add('cell-room');
                    if (room.color) cell.classList.add(room.color);
                    if (room.type === 'start') cell.classList.add('cell-start');

                    const iconSpan = document.createElement('span');
                    iconSpan.className = 'icon';
                    iconSpan.textContent = room.icon || '⬜';

                    const labelSpan = document.createElement('span');
                    labelSpan.className = 'label';
                    labelSpan.textContent = room.description || room.label || 'Room';

                    cell.appendChild(iconSpan);
                    cell.appendChild(labelSpan);
                    cell.title = `Room ${room.id}: ${room.label} - ${room.description}`;
                } else {
                    cell.classList.add('cell-wall');
                }
                grid.appendChild(cell);
            }
        }
    }

    function renderLegend() {
        const legendDiv = elements.legendContainer;
        if (!legendDiv) return;

        if (currentMap.size === 0) {
            legendDiv.innerHTML = '<p>Generate a map to see the legend.</p>';
            return;
        }

        const legendItems = [
            { type: 'start', icon: '🏠', label: 'Start' },
            { type: 'boss', icon: '👑', label: 'Boss' },
            { type: 'treasure', icon: '💰', label: 'Treasure' },
            { type: 'trap', icon: '⚠️', label: 'Trap' },
            { type: 'shop', icon: '🏪', label: 'Shop' },
            { type: 'monster', icon: '👹', label: 'Monster' },
            { type: 'puzzle', icon: '🧩', label: 'Puzzle' },
            { type: 'empty', icon: '⬜', label: 'Empty' },
        ];

        let html = '<h3>📖 Legend</h3><ul>';
        legendItems.forEach(item => {
            html += `<li>
                        <span style="font-size: 1.2em;">${item.icon}</span>
                        <span>${item.label}</span>
                     </li>`;
        });
        html += '</ul>';
        legendDiv.innerHTML = html;
    }

    function renderLog() {
        const logDiv = elements.log;
        if (currentMap.size === 0) {
            logDiv.innerHTML = '<div class="log-entry">🎲 Ready to generate a dungeon map.</div>';
            return;
        }
        const logMessage = `✅ Map generated with ${currentMap.size} rooms. Depth: ${mapGenerator.depth}`;
        logDiv.innerHTML = `<div class="log-entry">${logMessage}</div>`;
    }

    // Event Listeners
    elements.generateBtn.addEventListener('click', () => {
        mapGenerator.generateFullMap();
        currentMap = new Map(mapGenerator.rooms);
        updateUI();
    });

    elements.exportBtn.addEventListener('click', () => {
        const data = mapGenerator.exportMapData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dungeon_map_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    elements.printBtn.addEventListener('click', () => {
        window.print();
    });

    elements.resetBtn.addEventListener('click', () => {
        if (currentMap.size > 0) {
            if (confirm('Are you sure you want to reset the map?')) {
                mapGenerator.reset();
                currentMap = new Map();
                updateUI();
            }
        } else {
            mapGenerator.reset();
            currentMap = new Map();
            updateUI();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            elements.generateBtn.click();
        }
        if (e.key === 'r' || e.key === 'R') {
            elements.resetBtn.click();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            // Let the browser handle print
        }
    });

    // Initial state
    elements.log.innerHTML = '<div class="log-entry">🎲 Welcome to the Dungeon Cartographer! Press Enter or click "Generate Dungeon" to start.</div>';
    updateUI();

    // Handle resize for responsive grid
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(renderGrid, 200);
    });
});