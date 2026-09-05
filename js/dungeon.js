/**
 * Dungeon Cartographer - Difficulty System
 * D8 determines dungeon difficulty and monster density
 */

class DungeonMapGenerator {
    constructor() {
        this.difficultyConfig = {
            1: { // Very Easy
                name: 'Very Easy',
                color: '#44ff44',
                maxMonsters: 1,
                bossCount: 0,
                treasureMin: 1,
                treasureMax: 2,
                trapMin: 0,
                trapMax: 1,
                bossMinDistance: 8,
                shopChance: 0,
                emptyRoomChance: 60
            },
            2: { // Easy
                name: 'Easy',
                color: '#88ff88',
                maxMonsters: 2,
                bossCount: 0,
                treasureMin: 2,
                treasureMax: 3,
                trapMin: 1,
                trapMax: 2,
                bossMinDistance: 7,
                shopChance: 5,
                emptyRoomChance: 40
            },
            3: { // Normal
                name: 'Normal',
                color: '#ffff44',
                maxMonsters: 3,
                bossCount: 0,
                treasureMin: 2,
                treasureMax: 3,
                trapMin: 2,
                trapMax: 3,
                bossMinDistance: 6,
                shopChance: 10,
                emptyRoomChance: 30
            },
            4: { // Normal+
                name: 'Normal+',
                color: '#ffaa44',
                maxMonsters: 4,
                bossCount: 1,
                treasureMin: 3,
                treasureMax: 4,
                trapMin: 2,
                trapMax: 3,
                bossMinDistance: 6,
                shopChance: 10,
                emptyRoomChance: 25
            },
            5: { // Hard
                name: 'Hard',
                color: '#ff6644',
                maxMonsters: 4,
                bossCount: 1,
                treasureMin: 3,
                treasureMax: 4,
                trapMin: 3,
                trapMax: 4,
                bossMinDistance: 5,
                shopChance: 8,
                emptyRoomChance: 20
            },
            6: { // Hard+
                name: 'Hard+',
                color: '#ff4444',
                maxMonsters: 5,
                bossCount: 1,
                treasureMin: 4,
                treasureMax: 5,
                trapMin: 3,
                trapMax: 4,
                bossMinDistance: 5,
                shopChance: 8,
                emptyRoomChance: 15
            },
            7: { // Very Hard
                name: 'Very Hard',
                color: '#cc2244',
                maxMonsters: 5,
                bossCount: 2,
                treasureMin: 4,
                treasureMax: 5,
                trapMin: 4,
                trapMax: 5,
                bossMinDistance: 4,
                shopChance: 5,
                emptyRoomChance: 10
            },
            8: { // Deadly
                name: '💀 Deadly',
                color: '#ff0044',
                maxMonsters: 6,
                bossCount: 3,
                treasureMin: 5,
                treasureMax: 7,
                trapMin: 5,
                trapMax: 6,
                bossMinDistance: 3,
                shopChance: 5,
                emptyRoomChance: 5
            }
        };
        
        this.difficulty = 3; // Default: Normal
        this.featureConfig = {
            placementChances: {
                treasure: { min: 2, max: 5, icon: '💰', label: 'TREASURE' },
                trap: { min: 6, max: 9, icon: '⚠️', label: 'TRAP' },
                monster: { min: 10, max: 13, icon: '👹', label: 'MONSTER' },
                puzzle: { min: 14, max: 16, icon: '🧩', label: 'PUZZLE' },
                shop: { min: 18, max: 18, icon: '🏪', label: 'SHOP' },
                boss: { min: 19, max: 19, icon: '👑', label: 'BOSS' }
            },
            bossMinDistance: 5
        };
        this.reset();
        this.roomDistanceCache = new Map();
    }

    setDifficulty(d8Value) {
        const validValues = [1, 2, 3, 4, 5, 6, 7, 8];
        if (!validValues.includes(d8Value)) {
            d8Value = 3; // Default to Normal
        }
        this.difficulty = d8Value;
        const config = this.difficultyConfig[d8Value];
        this.featureConfig.bossMinDistance = config.bossMinDistance;
        return config;
    }

    getCurrentDifficulty() {
        return this.difficultyConfig[this.difficulty] || this.difficultyConfig[3];
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
        this.d8Roll = this.difficulty;
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

    // Roll D8 for difficulty
    rollForDifficulty() {
        const d8 = this.rollDice(8);
        const config = this.setDifficulty(d8);
        return {
            roll: d8,
            config: config,
            name: config.name
        };
    }

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

    isValidBossPosition(key) {
        const distance = this.roomDistanceCache.get(key) || 0;
        return distance >= this.featureConfig.bossMinDistance;
    }

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
        const diffConfig = this.difficultyConfig[this.difficulty];
        const roll = this.rollDice(20);
        const config = this.featureConfig.placementChances;
        const key = `${x},${y}`;
        const distance = this.calculateDistance(x, y);
        
        // Check empty room chance based on difficulty
        if (this.rollDice(100) <= diffConfig.emptyRoomChance) {
            return null; // Empty room
        }
        
        // Boss check - only if far enough from start
        if (roll >= config.boss.min && roll <= config.boss.max) {
            if (distance >= this.featureConfig.bossMinDistance) {
                // Check if we've reached max bosses for this difficulty
                const currentBosses = this.featureStats.boss || 0;
                if (currentBosses < diffConfig.bossCount) {
                    return {
                        type: 'boss',
                        icon: config.boss.icon,
                        label: config.boss.label.toUpperCase()
                    };
                }
            }
            // Boss roll but too close or max reached - convert to monster
            return {
                type: 'monster',
                icon: '👹',
                label: 'MONSTER'
            };
        }
        
        // Shop check - based on difficulty shop chance
        if (roll >= config.shop.min && roll <= config.shop.max) {
            const shopChance = diffConfig.shopChance;
            if (this.rollDice(100) <= shopChance) {
                return {
                    type: 'shop',
                    icon: config.shop.icon,
                    label: config.shop.label.toUpperCase()
                };
            }
            // Convert to treasure
            return {
                type: 'treasure',
                icon: '💰',
                label: 'TREASURE'
            };
        }
        
        // Monster check - limit based on difficulty
        if (roll >= config.monster.min && roll <= config.monster.max) {
            const currentMonsters = this.featureStats.monster || 0;
            if (currentMonsters < diffConfig.maxMonsters) {
                return {
                    type: 'monster',
                    icon: config.monster.icon,
                    label: config.monster.label.toUpperCase()
                };
            }
            // Too many monsters - become empty or treasure
            return this.rollDice(2) === 1 ? null : {
                type: 'treasure',
                icon: '💰',
                label: 'TREASURE'
            };
        }
        
        // Treasure check - limit based on difficulty
        if (roll >= config.treasure.min && roll <= config.treasure.max) {
            const currentTreasure = this.featureStats.treasure || 0;
            const maxTreasure = diffConfig.treasureMax;
            if (currentTreasure < maxTreasure) {
                return {
                    type: 'treasure',
                    icon: config.treasure.icon,
                    label: config.treasure.label.toUpperCase()
                };
            }
            return null;
        }
        
        // Trap check - limit based on difficulty
        if (roll >= config.trap.min && roll <= config.trap.max) {
            const currentTraps = this.featureStats.trap || 0;
            const maxTraps = diffConfig.trapMax;
            if (currentTraps < maxTraps) {
                return {
                    type: 'trap',
                    icon: config.trap.icon,
                    label: config.trap.label.toUpperCase()
                };
            }
            return null;
        }
        
        // Puzzle check
        if (roll >= config.puzzle.min && roll <= config.puzzle.max) {
            return {
                type: 'puzzle',
                icon: config.puzzle.icon,
                label: config.puzzle.label.toUpperCase()
            };
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
        const diffConfig = this.difficultyConfig[this.difficulty];
        const totalRooms = this.rooms.size - 1;
        if (totalRooms < 5) {
            return { 
                success: false, 
                message: 'Too few rooms to balance (need at least 5)' 
            };
        }

        // Calculate target counts based on difficulty
        const targetCounts = {
            treasure: Math.min(
                Math.floor(totalRooms * 0.2),
                diffConfig.treasureMax
            ),
            trap: Math.min(
                Math.floor(totalRooms * 0.18),
                diffConfig.trapMax
            ),
            monster: Math.min(
                Math.floor(totalRooms * 0.25),
                diffConfig.maxMonsters
            ),
            puzzle: Math.floor(totalRooms * 0.12),
            boss: diffConfig.bossCount,
            shop: 0
        };

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
        
        // First, try to place bosses in farthest rooms
        const bossTarget = targetCounts.boss || 0;
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
                addedFeatures.push({ 
                    key: candidate.key, 
                    type: 'boss', 
                    ...featureData, 
                    distance: candidate.distance 
                });
            }
        }

        // Remove used candidates
        const usedKeys = addedFeatures.map(f => f.key);
        const remainingRooms = availableRooms.filter(r => !usedKeys.includes(r.key));

        // Place other features
        const featureTypes = ['treasure', 'trap', 'monster', 'puzzle'];
        for (const type of featureTypes) {
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

        return {
            success: true,
            message: `Balanced ${diffConfig.name} dungeon: added ${added} features`,
            added: added,
            addedFeatures: addedFeatures,
            stats: this.featureStats,
            targets: targetCounts,
            difficulty: diffConfig
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
            d8Roll: this.d8Roll,
            difficulty: this.difficultyConfig[this.difficulty],
            currentPos: this.currentPos,
            startRoom: this.getStartRoom(),
            features: this.featuresApplied,
            featureStats: this.featureStats
        };
    }
}