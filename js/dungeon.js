/**
 * Dungeon Cartographer - Smart Direction System
 * - 70% chance to prefer new directions
 * - 30% chance to allow backing up
 * - Prevents dead-ends when possible
 */

class DungeonMapGenerator {
    constructor() {
        this.difficultyConfig = {
            1: {
                name: 'Very Easy',
                color: '#44ff44',
                maxMonsters: 2,
                bossCount: 0,
                treasureMin: 1,
                treasureMax: 2,
                trapMin: 0,
                trapMax: 1,
                bossMinDistance: 8,
                shopChance: 0,
                emptyRoomChance: 50,
                monsterTreasureChance: 30
            },
            2: {
                name: 'Easy',
                color: '#88ff88',
                maxMonsters: 3,
                bossCount: 0,
                treasureMin: 1,
                treasureMax: 2,
                trapMin: 1,
                trapMax: 2,
                bossMinDistance: 7,
                shopChance: 5,
                emptyRoomChance: 35,
                monsterTreasureChance: 40
            },
            3: {
                name: 'Normal',
                color: '#ffff44',
                maxMonsters: 4,
                bossCount: 1,
                treasureMin: 2,
                treasureMax: 3,
                trapMin: 2,
                trapMax: 3,
                bossMinDistance: 6,
                shopChance: 10,
                emptyRoomChance: 25,
                monsterTreasureChance: 50
            },
            4: {
                name: 'Normal+',
                color: '#ffaa44',
                maxMonsters: 5,
                bossCount: 1,
                treasureMin: 2,
                treasureMax: 3,
                trapMin: 2,
                trapMax: 3,
                bossMinDistance: 6,
                shopChance: 10,
                emptyRoomChance: 20,
                monsterTreasureChance: 55
            },
            5: {
                name: 'Hard',
                color: '#ff6644',
                maxMonsters: 5,
                bossCount: 1,
                treasureMin: 3,
                treasureMax: 4,
                trapMin: 3,
                trapMax: 4,
                bossMinDistance: 5,
                shopChance: 8,
                emptyRoomChance: 15,
                monsterTreasureChance: 60
            },
            6: {
                name: 'Hard+',
                color: '#ff4444',
                maxMonsters: 6,
                bossCount: 2,
                treasureMin: 3,
                treasureMax: 4,
                trapMin: 3,
                trapMax: 4,
                bossMinDistance: 5,
                shopChance: 8,
                emptyRoomChance: 12,
                monsterTreasureChance: 65
            },
            7: {
                name: 'Very Hard',
                color: '#cc2244',
                maxMonsters: 6,
                bossCount: 2,
                treasureMin: 4,
                treasureMax: 5,
                trapMin: 4,
                trapMax: 5,
                bossMinDistance: 4,
                shopChance: 5,
                emptyRoomChance: 10,
                monsterTreasureChance: 70
            },
            8: {
                name: '💀 Deadly',
                color: '#ff0044',
                maxMonsters: 7,
                bossCount: 3,
                treasureMin: 5,
                treasureMax: 6,
                trapMin: 5,
                trapMax: 6,
                bossMinDistance: 3,
                shopChance: 5,
                emptyRoomChance: 8,
                monsterTreasureChance: 75
            }
        };
        
        this.difficulty = 3;
        this.roomDirectionMemory = new Map();
        this.reset();
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
        this.roomDirectionMemory = new Map();
        this.featureStats = {
            treasure: 0,
            trap: 0,
            monster: 0,
            puzzle: 0,
            shop: 0,
            boss: 0,
            monsterTreasure: 0
        };
        this.roomDistanceCache = new Map();
        this.backupAttempts = 0;
        this.newDirectionAttempts = 0;
        
        this.addRoom(0, 0, 'start', '🏠', 'START');
        this.currentPos = { x: 0, y: 0 };
        this.addHistory('start', { x: 0, y: 0 });
        this.calculateAllDistances();
        this.roomDirectionMemory.set('0,0', new Set());
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

    // Get unexplored directions from current position
    getUnexploredDirections() {
        const key = `${this.currentPos.x},${this.currentPos.y}`;
        const used = this.roomDirectionMemory.get(key) || new Set();
        const allDirections = [1, 2, 3, 4];
        return allDirections.filter(d => !used.has(d));
    }

    // Get all directions that lead to empty positions
    getAvailableDirections() {
        const allDirections = [1, 2, 3, 4];
        const available = [];
        for (const d of allDirections) {
            const dir = this.getDirection(d);
            const newX = this.currentPos.x + dir.dx;
            const newY = this.currentPos.y + dir.dy;
            if (!this.rooms.has(`${newX},${newY}`)) {
                available.push(d);
            }
        }
        return available;
    }

    // Check if a position already has a room
    isPositionFree(x, y) {
        const key = `${x},${y}`;
        return !this.rooms.has(key);
    }

    // SMART DIRECTION SYSTEM
    // 70% chance to prefer new directions, 30% chance to allow backup
    getSmartDirection() {
        const unexplored = this.getUnexploredDirections();
        const available = this.getAvailableDirections();
        
        // If no directions available at all, we're stuck - force a random direction
        if (available.length === 0) {
            return this.rollDice(4);
        }

        // If there are unexplored directions available
        if (unexplored.length > 0) {
            // 70% chance to explore new territory
            if (this.rollDice(100) <= 70) {
                this.newDirectionAttempts++;
                // Pick random unexplored direction
                const index = this.rollDice(unexplored.length) - 1;
                return unexplored[index];
            }
        }

        // 30% chance to backup (or if no unexplored directions)
        this.backupAttempts++;
        
        // When backing up, prefer directions that lead to empty spaces
        // but can also go to existing rooms (creates loops)
        const availableDirections = this.getAvailableDirections();
        const existingDirections = [1, 2, 3, 4].filter(d => {
            const dir = this.getDirection(d);
            const newX = this.currentPos.x + dir.dx;
            const newY = this.currentPos.y + dir.dy;
            const key = `${newX},${newY}`;
            return this.rooms.has(key) && key !== `${this.currentPos.x},${this.currentPos.y}`;
        });

        // Weight: 60% chance to go to empty space, 40% to go to existing
        if (availableDirections.length > 0 && this.rollDice(100) <= 60) {
            const index = this.rollDice(availableDirections.length) - 1;
            return availableDirections[index];
        } else if (existingDirections.length > 0) {
            const index = this.rollDice(existingDirections.length) - 1;
            return existingDirections[index];
        } else if (availableDirections.length > 0) {
            const index = this.rollDice(availableDirections.length) - 1;
            return availableDirections[index];
        }

        // Fallback - any direction
        return this.rollDice(4);
    }

    // Legacy D4 roll with smart system
    rollForDirection() {
        return this.getSmartDirection();
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
        const diffConfig = this.difficultyConfig[this.difficulty];
        return distance >= diffConfig.bossMinDistance;
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

    rollForDifficulty() {
        const d8 = this.rollDice(8);
        const config = this.setDifficulty(d8);
        return {
            roll: d8,
            config: config,
            name: config.name
        };
    }

    setDifficulty(d8Value) {
        const validValues = [1, 2, 3, 4, 5, 6, 7, 8];
        if (!validValues.includes(d8Value)) {
            d8Value = 3;
        }
        this.difficulty = d8Value;
        return this.difficultyConfig[d8Value];
    }

    getCurrentDifficulty() {
        return this.difficultyConfig[this.difficulty] || this.difficultyConfig[3];
    }

    checkForFeature(x, y) {
        const diffConfig = this.difficultyConfig[this.difficulty];
        const roll = this.rollDice(20);
        const key = `${x},${y}`;
        const distance = this.calculateDistance(x, y);
        
        // Empty room check based on difficulty
        if (this.rollDice(100) <= diffConfig.emptyRoomChance) {
            return null;
        }
        
        // Boss check
        if (roll === 19 || roll === 20) {
            if (distance >= diffConfig.bossMinDistance) {
                const currentBosses = this.featureStats.boss || 0;
                if (currentBosses < diffConfig.bossCount) {
                    return {
                        type: 'boss',
                        icon: '👑',
                        label: 'BOSS',
                        description: 'Boss Chamber'
                    };
                }
            }
            // Convert to monster if too close or max reached
            return {
                type: 'monster',
                icon: '👹',
                label: 'MONSTER',
                description: 'Monster Lair',
                hasTreasure: this.rollDice(100) <= diffConfig.monsterTreasureChance
            };
        }
        
        // Shop check
        if (roll === 18) {
            if (this.rollDice(100) <= diffConfig.shopChance) {
                return {
                    type: 'shop',
                    icon: '🏪',
                    label: 'SHOP',
                    description: 'Merchant Shop'
                };
            }
            // Convert to treasure
            return {
                type: 'treasure',
                icon: '💰',
                label: 'TREASURE',
                description: 'Treasure Hoard'
            };
        }
        
        // Monster check
        if (roll >= 10 && roll <= 14) {
            const currentMonsters = this.featureStats.monster || 0;
            if (currentMonsters < diffConfig.maxMonsters) {
                const hasTreasure = this.rollDice(100) <= diffConfig.monsterTreasureChance;
                return {
                    type: 'monster',
                    icon: '👹',
                    label: 'MONSTER',
                    description: 'Monster Lair',
                    hasTreasure: hasTreasure
                };
            }
            // Too many monsters - become empty or treasure
            return this.rollDice(2) === 1 ? null : {
                type: 'treasure',
                icon: '💰',
                label: 'TREASURE',
                description: 'Treasure Hoard'
            };
        }
        
        // Trap check
        if (roll >= 6 && roll <= 9) {
            const currentTraps = this.featureStats.trap || 0;
            const maxTraps = diffConfig.trapMax;
            if (currentTraps < maxTraps) {
                return {
                    type: 'trap',
                    icon: '⚠️',
                    label: 'TRAP',
                    description: 'Dangerous Trap'
                };
            }
            return null;
        }
        
        // Puzzle check
        if (roll >= 15 && roll <= 17) {
            return {
                type: 'puzzle',
                icon: '🧩',
                label: 'PUZZLE',
                description: 'Puzzle Room'
            };
        }
        
        // Treasure check - limited occurrence
        if (roll >= 2 && roll <= 4) {
            const currentTreasure = this.featureStats.treasure || 0;
            const maxTreasure = diffConfig.treasureMax;
            if (currentTreasure < maxTreasure) {
                return {
                    type: 'treasure',
                    icon: '💰',
                    label: 'TREASURE',
                    description: 'Treasure Hoard'
                };
            }
            return null;
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

        // Track direction usage from current position
        const currentKey = `${this.currentPos.x},${this.currentPos.y}`;
        if (!this.roomDirectionMemory.has(currentKey)) {
            this.roomDirectionMemory.set(currentKey, new Set());
        }
        this.roomDirectionMemory.get(currentKey).add(direction);

        if (this.rooms.has(key)) {
            this.currentPos = { x: newX, y: newY };
            this.addHistory('move', { x: newX, y: newY, direction: dir.name });
            this.charges--;
            
            // Track this direction in the new room too
            const newKey = `${newX},${newY}`;
            if (!this.roomDirectionMemory.has(newKey)) {
                this.roomDirectionMemory.set(newKey, new Set());
            }
            // Add opposite direction (since we came from there)
            const oppositeDir = ((direction + 1) % 4) + 1;
            this.roomDirectionMemory.get(newKey).add(oppositeDir);
            
            return { 
                success: true, 
                message: `Moved to existing room (${dir.emoji} ${dir.name})`,
                room: this.rooms.get(key),
                chargesLeft: this.charges,
                isMove: true,
                direction: direction
            };
        }

        // Create new room
        this.addRoom(newX, newY, 'room', '⬜', '');
        const room = this.rooms.get(key);
        
        // Update distance cache
        this.roomDistanceCache.set(key, this.calculateDistance(newX, newY));
        
        // Track direction memory for new room
        const newKey = `${newX},${newY}`;
        if (!this.roomDirectionMemory.has(newKey)) {
            this.roomDirectionMemory.set(newKey, new Set());
        }
        // Add opposite direction (since we came from there)
        const oppositeDir = ((direction + 1) % 4) + 1;
        this.roomDirectionMemory.get(newKey).add(oppositeDir);
        
        // Check for feature
        const feature = this.checkForFeature(newX, newY);
        let featureMessage = '';
        let monsterTreasureMessage = '';
        
        if (feature) {
            room.icon = feature.icon;
            room.label = feature.label;
            room.featureType = feature.type;
            room.color = `has-${feature.type}`;
            room.description = feature.description || feature.type;
            
            this.featureStats[feature.type] = (this.featureStats[feature.type] || 0) + 1;
            this.featuresApplied.push({ key, ...feature });
            
            featureMessage = ` 🎯 ${feature.label}`;
            
            // Track monster treasure separately
            if (feature.type === 'monster' && feature.hasTreasure) {
                room.icon = '👹💎';
                room.label = 'MONSTER+';
                room.hasTreasure = true;
                this.featureStats.monsterTreasure = (this.featureStats.monsterTreasure || 0) + 1;
                monsterTreasureMessage = ' 💎 with treasure!';
                featureMessage += ' 💎';
            }
            
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
            feature: feature,
            directionValue: direction
        });

        const message = `Placed room (${dir.emoji} ${dir.name})${featureMessage}${monsterTreasureMessage}`;

        return {
            success: true,
            message: message,
            room: room,
            chargesLeft: this.charges,
            feature: feature,
            isMove: false,
            direction: direction
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

        // Calculate target counts
        const targetCounts = {
            treasure: Math.min(
                Math.floor(totalRooms * 0.15),
                diffConfig.treasureMax
            ),
            trap: Math.min(
                Math.floor(totalRooms * 0.18),
                diffConfig.trapMax
            ),
            monster: Math.min(
                Math.floor(totalRooms * 0.30),
                diffConfig.maxMonsters
            ),
            puzzle: Math.floor(totalRooms * 0.10),
            boss: diffConfig.bossCount,
            shop: 0
        };

        // Get rooms without features
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
        
        // Place bosses in farthest rooms
        const bossTarget = targetCounts.boss || 0;
        const bossCandidates = availableRooms.filter(r => r.distance >= diffConfig.bossMinDistance);
        
        for (let i = 0; i < Math.min(bossTarget, bossCandidates.length); i++) {
            const candidate = bossCandidates[i];
            const room = this.rooms.get(candidate.key);
            if (room && !room.featureType) {
                room.icon = '👑';
                room.label = 'BOSS';
                room.featureType = 'boss';
                room.color = 'has-boss';
                room.description = 'Boss Chamber';
                this.featureStats.boss = (this.featureStats.boss || 0) + 1;
                added++;
                addedFeatures.push({ 
                    key: candidate.key, 
                    type: 'boss',
                    distance: candidate.distance 
                });
            }
        }

        // Place other features
        const usedKeys = addedFeatures.map(f => f.key);
        const remainingRooms = availableRooms.filter(r => !usedKeys.includes(r.key));
        
        // Shuffle remaining rooms
        const shuffled = this.shuffleArray(remainingRooms);
        let index = 0;

        // Place monsters (with treasure chance)
        const monsterTarget = targetCounts.monster || 0;
        const currentMonsters = this.featureStats.monster || 0;
        const monsterNeeded = Math.max(0, monsterTarget - currentMonsters);
        
        for (let i = 0; i < monsterNeeded && index < shuffled.length; i++) {
            const candidate = shuffled[index++];
            const room = this.rooms.get(candidate.key);
            if (room && !room.featureType) {
                const hasTreasure = this.rollDice(100) <= diffConfig.monsterTreasureChance;
                room.icon = hasTreasure ? '👹💎' : '👹';
                room.label = hasTreasure ? 'MONSTER+' : 'MONSTER';
                room.featureType = 'monster';
                room.color = 'has-monster';
                room.description = 'Monster Lair';
                room.hasTreasure = hasTreasure;
                this.featureStats.monster = (this.featureStats.monster || 0) + 1;
                if (hasTreasure) {
                    this.featureStats.monsterTreasure = (this.featureStats.monsterTreasure || 0) + 1;
                }
                added++;
                addedFeatures.push({ key: candidate.key, type: 'monster', hasTreasure });
            }
        }

        // Place traps
        const trapTarget = targetCounts.trap || 0;
        const currentTraps = this.featureStats.trap || 0;
        const trapNeeded = Math.max(0, trapTarget - currentTraps);
        
        for (let i = 0; i < trapNeeded && index < shuffled.length; i++) {
            const candidate = shuffled[index++];
            const room = this.rooms.get(candidate.key);
            if (room && !room.featureType) {
                room.icon = '⚠️';
                room.label = 'TRAP';
                room.featureType = 'trap';
                room.color = 'has-trap';
                room.description = 'Dangerous Trap';
                this.featureStats.trap = (this.featureStats.trap || 0) + 1;
                added++;
                addedFeatures.push({ key: candidate.key, type: 'trap' });
            }
        }

        // Place treasures
        const treasureTarget = targetCounts.treasure || 0;
        const currentTreasure = this.featureStats.treasure || 0;
        const treasureNeeded = Math.max(0, treasureTarget - currentTreasure);
        
        for (let i = 0; i < treasureNeeded && index < shuffled.length; i++) {
            const candidate = shuffled[index++];
            const room = this.rooms.get(candidate.key);
            if (room && !room.featureType) {
                room.icon = '💰';
                room.label = 'TREASURE';
                room.featureType = 'treasure';
                room.color = 'has-treasure';
                room.description = 'Treasure Hoard';
                this.featureStats.treasure = (this.featureStats.treasure || 0) + 1;
                added++;
                addedFeatures.push({ key: candidate.key, type: 'treasure' });
            }
        }

        // Place puzzles if rooms remain
        const puzzleTarget = targetCounts.puzzle || 0;
        const currentPuzzle = this.featureStats.puzzle || 0;
        const puzzleNeeded = Math.max(0, puzzleTarget - currentPuzzle);
        
        for (let i = 0; i < puzzleNeeded && index < shuffled.length; i++) {
            const candidate = shuffled[index++];
            const room = this.rooms.get(candidate.key);
            if (room && !room.featureType) {
                room.icon = '🧩';
                room.label = 'PUZZLE';
                room.featureType = 'puzzle';
                room.color = 'has-puzzle';
                room.description = 'Puzzle Room';
                this.featureStats.puzzle = (this.featureStats.puzzle || 0) + 1;
                added++;
                addedFeatures.push({ key: candidate.key, type: 'puzzle' });
            }
        }

        return {
            success: true,
            message: `Balanced ${diffConfig.name} dungeon: added ${added} features`,
            added: added,
            addedFeatures: addedFeatures,
            stats: this.featureStats,
            targets: targetCounts,
            difficulty: diffConfig,
            backupAttempts: this.backupAttempts,
            newDirectionAttempts: this.newDirectionAttempts
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
            color: '',
            description: '',
            hasTreasure: false
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
                    if (room.hasTreasure) {
                        this.featureStats.monsterTreasure = Math.max(0, (this.featureStats.monsterTreasure || 1) - 1);
                    }
                    this.featuresApplied = this.featuresApplied.filter(f => f.key !== key);
                }
                this.rooms.delete(key);
                this.roomDistanceCache.delete(key);
                this.roomDirectionMemory.delete(key);
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
            featureStats: this.featureStats,
            directionStats: {
                backupAttempts: this.backupAttempts,
                newDirectionAttempts: this.newDirectionAttempts
            }
        };
    }
}