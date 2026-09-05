/**
 * Dungeon Cartographer - Core Generator
 * Generates complete printable dungeon maps
 */

class DungeonMapGenerator {
    constructor() {
        this.reset();
    }

    reset() {
        this.rooms = new Map();
        this.currentPos = { x: 0, y: 0 };
        this.depth = 0;
        this.isComplete = false;
        this.roomCounter = 0;
        this.stats = {
            total: 0,
            monsters: 0,
            treasures: 0,
            traps: 0,
            bosses: 0,
            shops: 0,
            puzzles: 0,
            empty: 0,
        };
        this.addRoom(0, 0, 'start');
        this.currentPos = { x: 0, y: 0 };
    }

    rollDice(sides) {
        return Math.floor(Math.random() * sides) + 1;
    }

    getDirection(d4) {
        const directions = {
            1: { dx: 0, dy: -1, name: 'North' },
            2: { dx: 1, dy: 0, name: 'East' },
            3: { dx: 0, dy: 1, name: 'South' },
            4: { dx: -1, dy: 0, name: 'West' }
        };
        return directions[d4] || directions[1];
    }

    generateRoomType(d20) {
        // Rich room descriptions for printable maps
        if (d20 === 1) return { 
            type: 'boss', 
            icon: '👑', 
            label: 'Boss', 
            description: 'Boss Chamber', 
            color: 'has-boss' 
        };
        if (d20 <= 4) return { 
            type: 'treasure', 
            icon: '💰', 
            label: 'Treasure', 
            description: 'Treasure Hoard', 
            color: 'has-treasure' 
        };
        if (d20 <= 8) return { 
            type: 'trap', 
            icon: '⚠️', 
            label: 'Trap', 
            description: 'Pit Trap', 
            color: 'has-trap' 
        };
        if (d20 <= 11) return { 
            type: 'shop', 
            icon: '🏪', 
            label: 'Shop', 
            description: 'Merchant', 
            color: 'has-shop' 
        };
        if (d20 <= 15) return { 
            type: 'monster', 
            icon: '👹', 
            label: 'Monster', 
            description: 'Monster Lair', 
            color: '' 
        };
        if (d20 <= 18) return { 
            type: 'puzzle', 
            icon: '🧩', 
            label: 'Puzzle', 
            description: 'Puzzle Room', 
            color: '' 
        };
        return { 
            type: 'empty', 
            icon: '⬜', 
            label: 'Empty', 
            description: 'Empty Chamber', 
            color: '' 
        };
    }

    addRoom(x, y, type = 'empty', icon = '⬜', label = 'Room', description = '', color = '') {
        const key = `${x},${y}`;
        if (!this.rooms.has(key)) {
            this.roomCounter++;
        }
        this.rooms.set(key, {
            x,
            y,
            type: type,
            icon: icon,
            label: label,
            description: description,
            color: color,
            id: this.roomCounter,
        });

        if (type !== 'start') {
            this.stats.total++;
            if (this.stats.hasOwnProperty(type + 's')) {
                this.stats[type + 's']++;
            }
        }
    }

    generateFullMap() {
        this.reset();
        console.log('🔄 Generating new dungeon map...');

        let steps = 0;
        const maxSteps = 80;

        while (!this.isComplete && steps < maxSteps) {
            this.generateStep();
            steps++;
        }

        if (steps >= maxSteps) {
            this.isComplete = true;
        }
        console.log(`✅ Map complete! ${this.rooms.size} rooms generated.`);
        return this.rooms;
    }

    generateStep() {
        if (this.isComplete) return false;

        const d4 = this.rollDice(4);
        const dir = this.getDirection(d4);
        const newX = this.currentPos.x + dir.dx;
        const newY = this.currentPos.y + dir.dy;
        const key = `${newX},${newY}`;

        const d20 = this.rollDice(20);
        if (d20 === 1) {
            this.isComplete = true;
            return true;
        }

        if (!this.rooms.has(key)) {
            const roomData = this.generateRoomType(d20);
            this.addRoom(newX, newY, roomData.type, roomData.icon, roomData.label, roomData.description, roomData.color);
            this.currentPos = { x: newX, y: newY };
            this.depth++;
        }
        return true;
    }

    exportMapData() {
        return {
            rooms: Array.from(this.rooms.entries()).map(([key, room]) => ({ key, ...room })),
            stats: this.stats,
            totalRooms: this.rooms.size,
            depth: this.depth
        };
    }
}