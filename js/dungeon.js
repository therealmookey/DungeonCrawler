/**
 * Dungeon Cartographer - Hybrid System with Custom Rules
 * - No shops (or <1% chance)
 * - Bosses far from entrance (minimum 5 rooms away)
 */

class DungeonMapGenerator {
    constructor() {
        this.featureConfig = {
            placementChances: {
                treasure: { min: 2, max: 5, icon: '💰', label: 'TREASURE' },
                trap: { min: 6, max: 9, icon: '⚠️', label: 'TRAP' },
                monster: { min: 10, max: 13, icon: '👹', label: 'MONSTER' },
                puzzle: { min: 14, max: 16, icon: '🧩', label: 'PUZZLE' },
                // Shop is now extremely rare - only on D20 = 18
                shop: { min: 18, max: 18, icon: '🏪', label: 'SHOP' },
                // Boss is more rare and will be placed by distance check
                boss: { min: 19, max: 19, icon: '👑', label: 'BOSS' }
            },
            balancing: {
                treasure: 20,
                trap: 18,
                monster: 25,
                puzzle: 15,
                shop: 0,      // No shops in balancing
                boss: 5       // 5% boss rooms
            },
            bossMinDistance: 5 // Minimum rooms from start for boss
        };
        this.reset();
        this.roomDistanceCache = new Map();
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
        this.roomDistanceCache = new Map();
        
        this.addRoom(0, 0, 'start', '🏠', 'START');
        this.currentPos = { x: 0, y: 0 };
        this.addHistory('start', { x: 0, y: 0 });
        this.calculateAllDistances();
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

    // Calculate Manhattan distance from start (0,0)
    calculateDistance(x, y) {
        return Math.abs(x) + Math.abs(y);
    }

    calculateAllDistances() {
        this.roomDistanceCache.clear();
        for (const [key, room] of this.rooms) {
            const dist = this.calculateDistance(room.x, room.y);
            this.roomDistanceCache.set(key, dist);
        }
    }

    // Check if a position is valid for boss placement
    isValidBossPosition(key) {
        const distance = this.roomDistanceCache.get(key) || 0;
        return distance >= this.featureConfig.bossMinDistance;
    }

    // Get rooms that are far enough from start
    getDistantRooms(minDistance) {
        const result = [];
        for (const [key, room] of this.rooms) {
            if (room.type === 'start') continue;
            const dist = this.calculateDistance(room.x, room.y);
            if (dist >= minDistance && !room.featureType) {
                result.push({ key, room, distance: dist });
            }
        }
        return result.sort((a, b) => b.distance - a.distance);
    }

    checkForFeature(x, y) {
        const roll = this.rollDice(20);
        const config = this.featureConfig.placementChances;
        const key = `${x},${y}`;
        const distance = this.calculateDistance(x, y);
        
        // Boss check - only if far enough from start
        if (roll >= config.boss.min && roll <= config.boss.max) {
            if (distance >= this.featureConfig.bossMinDistance) {
                return {
                    type: 'boss',
                    icon: config.boss.icon,
                    label: config.boss.label.toUpperCase()
                };
            }
            // Boss roll but too close - convert to monster instead
            return {
                type: 'monster',
                icon: '👹',
                label: 'MONSTER'
            };
        }
        
        // Shop check - extremely rare (only on exact roll 18)
        // But if shop is rolled, 90% chance it becomes a treasure instead
        if (roll >= config.shop.min && roll <= config.shop.max) {
            if (this.rollDice(100) <= 90) {
                // Convert to treasure (90% chance)
                return {
                    type: 'treasure',
                    icon: '💰',
                    label: 'TREASURE'
                };
            }
            return {
                type: 'shop',
                icon: config.shop.icon,
                label: config.shop.label.toUpperCase()
            };
        }
        
        // Other features
        for (const [type, range] of Object.entries(config)) {
            if (type === 'boss' || type === 'shop') continue;
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
                chargesLeft: this.charges,
                isMove: true
            };
        }

        // Create new room
        this.addRoom(newX, newY, 'room', '⬜', '');
        const room = this.rooms.get(key);
        
        // Update distance cache
        this.roomDistanceCache.set(key, this.calculateDistance(newX, newY));
        
        // Check for feature
        const feature = this.checkForFeature(newX, newY);
        let featureMessage = '';
        if (feature) {
            room.icon = feature.icon;
            room.label = feature.label;
            room.featureType = feature.type;
            room.color = `has-${feature.type}`;
            this.featureStats[feature.type] = (this.featureStats[feature.type] || 0) + 1;
            this.featuresApplied.push({ key, ...feature });
            featureMessage = ` 🎯 ${feature.label}`;
            
            // Extra message for boss placement
            if (feature.type === 'boss') {
                const dist = this.roomDistanceCache.get(key);
                featureMessage += ` (${dist} rooms from start)`;
            }
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

        const message = `Placed room (${dir.emoji} ${dir.name})${featureMessage}`;

        return {
            success: true,
            message: message,
            room: room,
            chargesLeft: this.charges,
            feature: feature,
            isMove: false
        };
    }

    balanceDungeon() {
        const totalRooms = this.rooms.size - 1;
        if (totalRooms < 5) {
            return { 
                success: false, 
                message: 'Too few rooms to balance (need at least 5)' 
            };
        }

        const config = this.featureConfig.balancing;
        const targetCounts = {};
        let totalTarget = 0;
        
        // Calculate targets (excluding shop)
        for (const [type, percentage] of Object.entries(config)) {
            if (percentage === 0) continue;
            targetCounts[type] = Math.max(1, Math.floor((percentage / 100) * totalRooms));
            totalTarget += targetCounts[type];
        }

        // Get rooms without features that are far enough from start
        const availableRooms = [];
        for (const [key, room] of this.rooms) {
            if (room.type !== 'start' && !room.featureType) {
                const dist = this.roomDistanceCache.get(key) || 0;
                availableRooms.push({ key, room, distance: dist });
            }
        }

        // Sort by distance from start (farthest first for bosses)
        availableRooms.sort((a, b) => b.distance - a.distance);

        let added = 0;
        const addedFeatures = [];
        const featureTypes = ['treasure', 'trap', 'monster', 'puzzle', 'boss'];
        
        // First, try to place bosses in farthest rooms
        const bossTarget = targetCounts.boss || 0;
        let bossPlaced = 0;
        const bossCandidates = availableRooms.filter(r => r.distance >= this.featureConfig.bossMinDistance);
        
        for (let i = 0; i < Math.min(bossTarget, bossCandidates.length); i++) {
            const candidate = bossCandidates[i];
            const room = this.rooms.get(candidate.key);
            if (room && !room.featureType) {
                const featureData = this.getFeatureData('boss');
                room.icon = featureData.icon;
                room.label = featureData.label;
                room.featureType = 'boss';
                room.color = 'has-boss';
                this.featureStats.boss = (this.featureStats.boss || 0) + 1;
                added++;
                bossPlaced++;
                addedFeatures.push({ key: candidate.key, type: 'boss', ...featureData, distance: candidate.distance });
            }
        }

        // Then place other features
        const remainingRooms = availableRooms.filter(r => {
            const room = this.rooms.get(r.key);
            return room && !room.featureType;
        });

        for (const type of featureTypes) {
            if (type === 'boss') continue; // Already handled
            const target = targetCounts[type] || 0;
            const current = this.featureStats[type] || 0;
            const needed = Math.max(0, target - current);
            
            for (let i = 0; i < needed && i < remainingRooms.length; i++) {
                const candidate = remainingRooms[i];
                const room = this.rooms.get(candidate.key);
                if (room && !room.featureType) {
                    const featureData = this.getFeatureData(type);
                    room.icon = featureData.icon;
                    room.label = featureData.label;
                    room.featureType = type;
                    room.color = `has-${type}`;
                    this.featureStats[type] = (this.featureStats[type] || 0) + 1;
                    added++;
                    addedFeatures.push({ key: candidate.key, type, ...featureData });
                }
            }
        }

        // If we still have rooms left, place random features
        const stillEmpty = [];
        for (const [key, room] of this.rooms) {
            if (room.type !== 'start' && !room.featureType) {
                stillEmpty.push(key);
            }
        }

        if (stillEmpty.length > 0 && added < 3) {
            const shuffled = this.shuffleArray(stillEmpty);
            const types = ['treasure', 'trap', 'monster'];
            for (let i = 0; i < Math.min(3, shuffled.length); i++) {
                const roomKey = shuffled[i];
                const room = this.rooms.get(roomKey);
                if (room) {
                    const type = types[i % types.length];
                    const featureData = this.getFeatureData(type);
                    room.icon = featureData.icon;
                    room.label = featureData.label;
                    room.featureType = type;
                    room.color = `has-${type}`;
                    this.featureStats[type] = (this.featureStats[type] || 0) + 1;
                    added++;
                    addedFeatures.push({ key: roomKey, type, ...featureData });
                }
            }
        }

        return {
            success: true,
            message: `Balanced dungeon: added ${added} features${bossPlaced > 0 ? ` (${bossPlaced} bosses in distant rooms)` : ''}`,
            added: added,
            bossPlaced: bossPlaced,
            addedFeatures: addedFeatures,
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
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
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
                if (room.featureType) {
                    this.featureStats[room.featureType] = Math.max(0, (this.featureStats[room.featureType] || 1) - 1);
                    this.featuresApplied = this.featuresApplied.filter(f => f.key !== key);
                }
                this.rooms.delete(key);
                this.roomDistanceCache.delete(key);
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

    getFeaturesApplied() {
        return this.featuresApplied;
    }

    getRoomDistance(key) {
        return this.roomDistanceCache.get(key) || 0;
    }

    exportMapData() {
        return {
            rooms: Array.from(this.rooms.entries()).map(([key, room]) => ({ 
                key, 
                ...room,
                distanceFromStart: this.roomDistanceCache.get(key) || 0
            })),
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