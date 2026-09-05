/**
 * Dungeon Cartographer - With Special Features
 * Hybrid system: Dice during placement + balancing pass
 */

class DungeonMapGenerator {
    constructor() {
        this.reset();
        this.featureConfig = {
            // Chance during placement (D20 roll ranges)
            placementChances: {
                treasure: { min: 2, max: 4, icon: '💰', label: 'TREASURE' },
                trap: { min: 5, max: 7, icon: '⚠️', label: 'TRAP' },
                monster: { min: 8, max: 10, icon: '👹', label: 'MONSTER' },
                puzzle: { min: 11, max: 13, icon: '🧩', label: 'PUZZLE' },
                shop: { min: 14, max: 15, icon: '🏪', label: 'SHOP' },
                boss: { min: 16, max: 17, icon: '👑', label: 'BOSS' }
            },
            // Final balancing percentages
            balancing: {
                treasure: 20,
                trap: 15,
                monster: 25,
                puzzle: 12,
                shop: 8,
                boss: 5
            }
        };
    }

    reset() {
        this.rooms = new Map();
        this.currentPos = { x: 0, y: 0 };
        this.depth = 0;
        this.roomCounter = 0;
        this.history = [];
        this.charges = 0;
        this.d20Rolls = [];
        this.d4Rolls = [];
        this.currentD20 = null;
        this.currentD4 = null;
        this.featuresApplied = [];
        this.featureStats = {
            treasure: 0,
            trap: 0,
            monster: 0,
            puzzle: 0,
            shop: 0,
            boss: 0
        };
        
        this.addRoom(0, 0, 'start', '🏠', 'START');
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

    rollForCharges() {
        this.d20Rolls = [];
        let roll = 0;
        let count = 0;
        
        do {
            roll = this.rollDice(20);
            this.d20Rolls.push(roll);
            count++;
        } while (roll !== 1 && count < 100);
        
        this.charges = this.d20Rolls.length;
        this.currentD20 = roll;
        
        return {
            rolls: this.d20Rolls,
            charges: this.charges,
            finalRoll: roll
        };
    }

    // Check for feature during placement
    checkForFeature() {
        const roll = this.rollDice(20);
        const config = this.featureConfig.placementChances;
        
        for (const [type, range] of Object.entries(config)) {
            if (roll >= range.min && roll <= range.max) {
                return {
                    type: type,
                    icon: range.icon,
                    label: range.label.toUpperCase()
                };
            }
        }
        return null;
    }

    placeRoom(direction) {
        if (this.charges <= 0) {
            return { success: false, message: 'No charges remaining!' };
        }

        const dir = this.getDirection(direction);
        const newX = this.currentPos.x + dir.dx;
        const newY = this.currentPos.y + dir.dy;
        const key = `${newX},${newY}`;

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

        // Create new room
        this.addRoom(newX, newY, 'room', '⬜', '');
        const room = this.rooms.get(key);
        
        // Check for feature
        const feature = this.checkForFeature();
        if (feature) {
            room.icon = feature.icon;
            room.label = feature.label;
            room.featureType = feature.type;
            room.color = `has-${feature.type}`;
            this.featureStats[feature.type] = (this.featureStats[feature.type] || 0) + 1;
            this.featuresApplied.push({ key, ...feature });
        }

        this.currentPos = { x: newX, y: newY };
        this.depth++;
        this.charges--;
        this.addHistory('place', { 
            x: newX, 
            y: newY, 
            direction: dir.name,
            feature: feature
        });

        const message = feature ? 
            `Placed ${feature.label} (${dir.emoji} ${dir.name})` : 
            `Placed room (${dir.emoji} ${dir.name})`;

        return {
            success: true,
            message: message,
            room: room,
            chargesLeft: this.charges,
            feature: feature
        };
    }

    // Final balancing pass
    balanceDungeon() {
        const totalRooms = this.rooms.size - 1; // Exclude start room
        if (totalRooms < 3) return; // Too small to balance

        const config = this.featureConfig.balancing;
        const targetCounts = {};
        let totalTarget = 0;
        
        // Calculate target counts
        for (const [type, percentage] of Object.entries(config)) {
            targetCounts[type] = Math.floor((percentage / 100) * totalRooms);
            totalTarget += targetCounts[type];
        }

        // Get current features
        const currentFeatures = {};
        for (const [type] of Object.entries(config)) {
            currentFeatures[type] = this.featureStats[type] || 0;
        }

        // Find rooms without features
        const availableRooms = [];
        for (const [key, room] of this.rooms) {
            if (room.type !== 'start' && !room.featureType) {
                availableRooms.push(key);
            }
        }

        // Shuffle available rooms
        const shuffled = this.shuffleArray(availableRooms);
        let index = 0;

        // Add missing features
        const featureTypes = Object.keys(config);
        let added = 0;
        
        for (const type of featureTypes) {
            const needed = targetCounts[type] - currentFeatures[type];
            if (needed > 0 && index < shuffled.length) {
                const toAdd = Math.min(needed, shuffled.length - index);
                for (let i = 0; i < toAdd && i < shuffled.length; i++) {
                    const room = this.rooms.get(shuffled[index++]);
                    if (room && room.type !== 'start') {
                        const featureData = this.getFeatureData(type);
                        room.icon = featureData.icon;
                        room.label = featureData.label;
                        room.featureType = type;
                        room.color = `has-${type}`;
                        this.featureStats[type] = (this.featureStats[type] || 0) + 1;
                        added++;
                    }
                }
            }
        }

        return {
            added: added,
            stats: this.featureStats,
            targets: targetCounts
        };
    }

    getFeatureData(type) {
        const features = {
            treasure: { icon: '💰', label: 'TREASURE' },
            trap: { icon: '⚠️', label: 'TRAP' },
            monster: { icon: '👹', label: 'MONSTER' },
            puzzle: { icon: '🧩', label: 'PUZZLE' },
            shop: { icon: '🏪', label: 'SHOP' },
            boss: { icon: '👑', label: 'BOSS' }
        };
        return features[type] || { icon: '⬜', label: '' };
    }

    addRoom(x, y, type = 'room', icon = '⬜', label = '') {
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
            id: this.roomCounter,
            placed: true,
            featureType: null,
            color: ''
        });
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
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
                // Remove feature stats if it had one
                if (room.featureType) {
                    this.featureStats[room.featureType] = (this.featureStats[room.featureType] || 1) - 1;
                    this.featuresApplied = this.featuresApplied.filter(f => f.key !== key);
                }
                this.rooms.delete(key);
                const prev = this.history[this.history.length - 1];
                if (prev) {
                    this.currentPos = { x: prev.data.x || 0, y: prev.data.y || 0 };
                }
                this.charges++;
                return { 
                    success: true, 
                    message: 'Undid room placement',
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
                    message: 'Undid movement',
                    chargesLeft: this.charges
                };
            }
        }

        this.history.push(lastAction);
        return { success: false, message: 'Could not undo this action' };
    }

    getStartRoom() {
        for (const [key, room] of this.rooms) {
            if (room.type === 'start') {
                return { key, ...room };
            }
        }
        return null;
    }

    getFeatureStats() {
        return this.featureStats;
    }

    exportMapData() {
        return {
            rooms: Array.from(this.rooms.entries()).map(([key, room]) => ({ key, ...room })),
            totalRooms: this.rooms.size,
            depth: this.depth,
            charges: this.charges,
            d20Rolls: this.d20Rolls,
            d4Rolls: this.d4Rolls,
            currentPos: this.currentPos,
            startRoom: this.getStartRoom(),
            features: this.featuresApplied,
            featureStats: this.featureStats
        };
    }
}