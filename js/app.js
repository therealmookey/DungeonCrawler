/**
 * Dungeon Generator - App Controller
 * Verbindt de dungeon met de UI
 */

// DOMContentLoaded = wacht tot de hele pagina geladen is
document.addEventListener('DOMContentLoaded', () => {
    
    // ============================================
    // INITIALISATIE - Maak de dungeon en vind alle elementen
    // ============================================
    
    // Maak een nieuwe dungeon
    const dungeon = new DungeonGenerator();
    
    // Vind alle HTML elementen die we nodig hebben
    // document.getElementById('id') vindt een element met die id
    const elements = {
        generateBtn: document.getElementById('generateBtn'),
        stepBtn: document.getElementById('stepBtn'),
        resetBtn: document.getElementById('resetBtn'),
        exportBtn: document.getElementById('exportBtn'),
        roomCount: document.getElementById('roomCount'),
        depth: document.getElementById('depth'),
        treasureCount: document.getElementById('treasureCount'),
        trapCount: document.getElementById('trapCount'),
        health: document.getElementById('health'),
        status: document.getElementById('status'),
        grid: document.getElementById('dungeon-grid'),
        log: document.getElementById('log')
    };

    // ============================================
    // UPDATE UI - Vernieuw het scherm
    // ============================================
    function updateUI() {
        // 1. Update alle statistieken
        elements.roomCount.textContent = dungeon.rooms.size;
        elements.depth.textContent = dungeon.depth;
        elements.treasureCount.textContent = dungeon.treasureCount;
        elements.trapCount.textContent = dungeon.trapCount;
        elements.health.textContent = dungeon.health;

        // 2. Speciale kleur voor health
        const healthPercent = (dungeon.health / dungeon.maxHealth) * 100;
        if (healthPercent < 25) {
            elements.health.style.color = '#ff2222';  // Rood - gevaarlijk
        } else if (healthPercent < 50) {
            elements.health.style.color = '#ff8844';  // Oranje - voorzichtig
        } else {
            elements.health.style.color = '#44ff44';  // Groen - veilig
        }

        // 3. Update status
        let statusText = '⏸️ Gepauzeerd';
        if (dungeon.isComplete) {
            statusText = '✅ Voltooid';
        } else if (dungeon.isActive) {
            statusText = '🔄 Genereren...';
        }
        elements.status.textContent = statusText;

        // 4. Render het grid en de log
        renderGrid();
        renderLog();
    }

    // ============================================
    // RENDER GRID - Teken de kamers
    // ============================================
    function renderGrid() {
        const grid = elements.grid;
        
        // Check of er kamers zijn
        if (dungeon.rooms.size === 0) {
            grid.innerHTML = '<div style="padding: 50px; color: #666;">Geen kamers gevonden</div>';
            return;
        }

        // Bepaal de grenzen van de dungeon
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        // Loop door alle kamers om de grenzen te vinden
        for (const [key, room] of dungeon.rooms) {
            minX = Math.min(minX, room.x);
            maxX = Math.max(maxX, room.x);
            minY = Math.min(minY, room.y);
            maxY = Math.max(maxY, room.y);
        }

        // Bereken breedte en hoogte
        const width = maxX - minX + 1;
        const height = maxY - minY + 1;

        // Bepaal cel grootte (responsief)
        const containerWidth = elements.grid.parentElement.clientWidth - 40;
        const cellSize = Math.min(55, Math.floor((containerWidth / width) - 2));

        // Zet het grid klaar
        grid.style.gridTemplateColumns = `repeat(${width}, ${cellSize}px)`;
        grid.innerHTML = '';

        // Loop door alle rijen en kolommen
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';

                const key = `${x},${y}`;
                const room = dungeon.rooms.get(key);
                const isCurrent = dungeon.currentPos.x === x && dungeon.currentPos.y === y;

                if (room) {
                    // Dit is een kamer
                    cell.classList.add('cell-room');
                    
                    // Voeg speciale classes toe
                    if (room.color) {
                        cell.classList.add(room.color);
                    }
                    if (room.type === 'start') {
                        cell.classList.add('cell-start');
                    }
                    if (isCurrent) {
                        cell.classList.add('cell-current');
                    }

                    // Voeg icoon en label toe
                    const iconSpan = document.createElement('span');
                    iconSpan.className = 'icon';
                    iconSpan.textContent = room.icon || '⬜';

                    const labelSpan = document.createElement('span');
                    labelSpan.className = 'label';
                    labelSpan.textContent = room.label || 'Kamer';

                    cell.appendChild(iconSpan);
                    cell.appendChild(labelSpan);

                    // Tooltip (info bij hover)
                    if (room.hasBeenVisited) {
                        cell.title = `Kamer ${room.id}: ${room.label}\nType: ${room.type}`;
                    } else {
                        cell.title = 'Onontdekte kamer';
                    }

                } else {
                    // Dit is een muur (geen kamer)
                    cell.classList.add('cell-wall');
                }

                grid.appendChild(cell);
            }
        }
    }

    // ============================================
    // RENDER LOG - Toon de geschiedenis
    // ============================================
    function renderLog() {
        const logDiv = elements.log;
        
        // Zet elke log regel om in HTML
        logDiv.innerHTML = dungeon.logs.map(msg => {
            let className = 'log-entry';
            
            // Kleur toevoegen op basis van inhoud
            if (msg.includes('💰') || msg.includes('🎲') || msg.includes('🏁')) {
                className += ' highlight';  // Goudkleurig
            }
            if (msg.includes('⚠️') || msg.includes('💀') || msg.includes('⚔️')) {
                className += ' danger';     // Rood
            }
            if (msg.includes('✅') || msg.includes('🏪') || msg.includes('🧩')) {
                className += ' success';    // Groen
            }
            
            return `<div class="${className}">${msg}</div>`;
        }).join('');
        
        // Scroll naar onder
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    // ============================================
    // EVENT LISTENERS - Reageren op gebruikersacties
    // ============================================
    
    // Genereer knop
    elements.generateBtn.addEventListener('click', () => {
        dungeon.generateFull();
        updateUI();
    });

    // Volgende stap knop
    elements.stepBtn.addEventListener('click', () => {
        if (dungeon.isComplete) {
            dungeon.addLog('⚠️ Dungeon is al voltooid!');
            updateUI();
            return;
        }
        dungeon.generateStep();
        updateUI();
    });

    // Reset knop
    elements.resetBtn.addEventListener('click', () => {
        dungeon.reset();
        dungeon.addLog('🔄 Dungeon gereset!');
        updateUI();
    });

    // Export knop
    elements.exportBtn.addEventListener('click', () => {
        // Maak een JSON bestand van de dungeon
        const data = dungeon.exportDungeon();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Maak een download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `dungeon_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        
        // Opruimen
        URL.revokeObjectURL(url);
        dungeon.addLog('📤 Dungeon geëxporteerd!');
        updateUI();
    });

    // ============================================
    // KEYBOARD SHORTCUTS - Sneltoetsen
    // ============================================
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            elements.generateBtn.click();  // Enter = Genereer
        }
        if (e.key === ' ' && e.target === document.body) {
            e.preventDefault();
            elements.stepBtn.click();      // Spatie = Volgende stap
        }
        if (e.key === 'r' || e.key === 'R') {
            elements.resetBtn.click();      // R = Reset
        }
    });

    // ============================================
    // INITIAL RENDER - Toon de startstatus
    // ============================================
    dungeon.addLog('🎲 Welkom bij de Dungeon Generator!');
    dungeon.addLog('💡 Enter = Genereer, Spatie = Volgende, R = Reset');
    updateUI();

    // ============================================
    // WINDOW RESIZE - Pas aan bij schermverandering
    // ============================================
    let resizeTimeout;
    window.addEventListener('resize', () => {
        // Wacht even voordat we hertekenen (performance)
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(renderGrid, 200);
    });
});