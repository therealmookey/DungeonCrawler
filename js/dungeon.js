/**
 * Dungeon Cartographer - Manual Mode
 * User controls the dungeon building with dice rolls
 */

class DungeonMapGenerator {
    constructor() {
        this.reset();
    }

    reset() {
        this.rooms = new Map();
        this.currentPos = { x: 0, y: 0 };
        this.depth = 0;
        this.roomCounter = 0;
        this.history = []; // For undo functionality
        this.isComplete = false;
        this.charges = 0;
        this.d20Rolls = [];
        this.d4Rolls = [];
        this.currentD20 = null;
        this.currentD4 = null;
        
        // Stats
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
        
        // Start room
        this.addRoom(0, 0, 'start');
        this.currentPos = { x: 0, y: 0 };
        this.addHistory('start', { x: 0, y: 0 });
    }

    rollDice(sides) {
        return Math.floor(Math.random() * sides) + 1;
    }

    getDirection(d4) {
        const directions = {
            1: { dx: 0, dy: -1, name: 'North', emoji: '⬆️' },
            2: { dx: 1, dy: 0, name: 'East', emoji: '➡️' },
            3: { dx: 0, dy: 1, name: 'South', emoji: '⬇️' },
            4: { dx: -1, dy: 0, name: 'West', emoji: '⬅️' }
        };
        return directions[d4] || directions[1];
    }

    // Roll D20 until it hits 1 - determines number of charges
    rollForCharges() {
        this.d20Rolls = [];
        let roll = 0;
        let count = 0;
        
        // Roll until we get a 1
        do {
            roll = this.rollDice(20);
            this.d20Rolls.push(roll);
            count++;
        } while (roll !== 1 && count < 100);
        
        this.charges = this.d20Rolls.length;
        this.currentD20 = roll;
        this.isComplete = false;
        
        return {
            rolls: this.d20Rolls,
            charges: this.charges,
            finalRoll: roll
        };
    }

    // Place a room in the current direction
    placeRoom(direction) {
        if (this.charges <= 0) {
            return { success: false, message: 'No charges remaining! Roll D20 first.' };
        }

        const dir = this.getDirection(direction);
        const newX = this.currentPos.x + dir.dx;
        const newY = this.currentPos.y + dir.dy;
        const key = `${newX},${newY}`;

        // Check if room already exists
        if (this.rooms.has(key)) {
            this.currentPos = { x: newX, y: newY };
            this.addHistory('move', { x: newX, y: newY, direction: dir.name });
            this.charges--;
            return { 
                success: true, 
                message: `Moved to existing room (${dir.emoji} ${dir.name})`,
                room: this.rooms.get(key),
                chargesLeft: this.charges
            };
        }

        // Create new room - randomize type based on D6 for variety
        const roomType = this.generateRoomType(this.rollDice(20));
        this.addRoom(newX, newY, roomType.type, roomType.icon, roomType.label, roomType.description, roomType.color);
        this.currentPos = { x: newX, y: newY };
        this.depth++;
        this.charges--;
        this.addHistory('place', { 
            x: newX, 
            y: newY, 
            direction: dir.name, 
            roomType: roomType.type 
        });

        return {
            success: true,
            message: `Placed ${roomType.description} (${dir.emoji} ${dir.name})`,
            room: this.rooms.get(key),
            chargesLeft: this.charges,
            roomType: roomType
        };
    }

    generateRoomType(d20) {
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
            placed: true
        });

        if (type !== 'start') {
            this.stats.total++;
            const statKey = type + 's';
            if (this.stats.hasOwnProperty(statKey)) {
                this.stats[statKey]++;
            }
        }
    }

    addHistory(action, data) {
        this.history.push({ action, data, timestamp: Date.now() });
    }

    undo() {
        if (this.history.length <= 1) {
            return { success: false, message: 'Nothing to undo' };
        }

        const lastAction = this.history.pop();
        
        if (lastAction.action === 'place') {
            const key = `${lastAction.data.x},${lastAction.data.y}`;
            const room = this.rooms.get(key);
            if (room && room.type !== 'start') {
                // Remove the room
                this.rooms.delete(key);
                this.stats.total--;
                const statKey = room.type + 's';
                if (this.stats.hasOwnProperty(statKey)) {
                    this.stats[statKey]--;
                }
                // Move back to previous position
                const prev = this.history[this.history.length - 1];
                if (prev) {
                    this.currentPos = { x: prev.data.x || 0, y: prev.data.y || 0 };
                }
                // Restore charge
                this.charges++;
                return { 
                    success: true, 
                    message: `Undid room placement (${room.description})`,
                    roomRemoved: room
                };
            }
        }
        
        if (lastAction.action === 'move') {
            const prev = this.history[this.history.length - 1];
            if (prev) {
                this.currentPos = { x: prev.data.x || 0, y: prev.data.y || 0 };
                this.charges++;
                return { 
                    success: true, 
                    message: `Undid movement`,
                    chargesLeft: this.charges
                };
            }
        }

        // If we couldn't undo, push it back
        this.history.push(lastAction);
        return { success: false, message: 'Could not undo this action' };
    }

    exportMapData() {
        return {
            rooms: Array.from(this.rooms.entries()).map(([key, room]) => ({ key, ...room })),
            stats: this.stats,
            totalRooms: this.rooms.size,
            depth: this.depth,
            charges: this.charges,
            d20Rolls: this.d20Rolls,
            d4Rolls: this.d4Rolls,
            currentPos: this.currentPos
        };
    }
}