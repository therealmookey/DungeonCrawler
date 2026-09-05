/**
 * Dungeon Cartographer - Core Generator
 * Full version with room features, traps, treasures, and bosses
 */

console.log('✅ dungeon.js loaded - Defining DungeonMapGenerator');

class DungeonMapGenerator {
    constructor() {
        console.log('🏗️ Creating new DungeonMapGenerator instance');
        this.difficultyConfig = {
            1: {
                name: 'Very Easy',
                color: '#44ff44',
                maxMonsters: 2,
                bossCount: 0,
                treasureMin: 0,
                treasureMax: 1,
                trapMin: 0,
                trapMax: 1,
                bossMinDistance: 8,
                shopChance: 0,
                emptyRoomChance: 60,
                monsterTreasureChance: 25,
                objectiveDistance: 5,
                description: 'Ideal for beginners, mostly empty rooms'
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
                emptyRoomChance: 45,
                monsterTreasureChance: 30,
                objectiveDistance: 6,
                description: 'Light challenge, some monsters and traps'
            },
            3: {
                name: 'Normal',
                color: '#ffff44',
                maxMonsters: 3,
                bossCount: 1,
                treasureMin: 1,
                treasureMax: 2,
                trapMin: 1,
                trapMax: 2,
                bossMinDistance: 6,
                shopChance: 8,
                emptyRoomChance: 35,
                monsterTreasureChance: 35,
                objectiveDistance: 7,
                description: 'Balanced dungeon with a boss encounter'
            },
            4: {
                name: 'Normal+',
                color: '#ffaa44',
                maxMonsters: 4,
                bossCount: 1,
                treasureMin: 2,
                treasureMax: 3,
                trapMin: 2,
                trapMax: 3,
                bossMinDistance: 6,
                shopChance: 8,
                emptyRoomChance: 28,
                monsterTreasureChance: 40,
                objectiveDistance: 8,
                description: 'Moderate challenge with more enemies'
            },
            5: {
                name: 'Hard',
                color: '#ff6644',
                maxMonsters: 4,
                bossCount: 1,
                treasureMin: 2,
                treasureMax: 3,
                trapMin: 2,
                trapMax: 3,
                bossMinDistance: 5,
                shopChance: 5,
                emptyRoomChance: 22,
                monsterTreasureChance: 40,
                objectiveDistance: 9,
                description: 'Significant challenge, many enemies and traps'
            },
            6: {
                name: 'Hard+',
                color: '#ff4444',
                maxMonsters: 5,
                bossCount: 1,
                treasureMin: 2,
                treasureMax: 3,
                trapMin: 3,
                trapMax: 4,
                bossMinDistance: 5,
                shopChance: 5,
                emptyRoomChance: 18,
                monsterTreasureChance: 45,
                objectiveDistance: 10,
                description: 'Dangerous, prepare for tough fights'
            },
            7: {
                name: 'Very Hard',
                color: '#cc2244',
                maxMonsters: 5,
                bossCount: 2,
                treasureMin: 3,
                treasureMax: 4,
                trapMin: 3,
                trapMax: 4,
                bossMinDistance: 4,
                shopChance: 3,
                emptyRoomChance: 15,
                monsterTreasureChance: 50,
                objectiveDistance: 11,
                description: 'Extremely dangerous, multiple bosses'
            },
            8: {
                name: '💀 Deadly',
                color: '#ff0044',
                maxMonsters: 6,
                bossCount: 3,
                treasureMin: 3,
                treasureMax: 4,
                trapMin: 4,
                trapMax: 5,
                bossMinDistance: 3,
                shopChance: 3,
                emptyRoomChance: 12,
                monsterTreasureChance: 55,
                objectiveDistance: 12,
                description: 'Near impossible, maximum challenge!'
            }
        };
        
        this.difficulty = 3;
        this.balanceUsed = false;
        this.rooms = new Map();
        this.currentPos = { x: 0, y: 0 };
        this.depth = 0;
        this.roomCounter = 0;
        this.history = [];
        this.charges = 0;
        this.d20Rolls = [];
        this.d4Rolls = [];
        this.d8Roll = 3;
        this.currentD20 = null;
        this.currentD4 = null;
        this.featuresApplied = [];
        this.roomDirectionMemory = new Map();
        this.objectivePlaced = false;
        this.objectivePosition = null;
        this.featureStats = {
            treasure: 0,
            trap: 0,
            monster: 0,
            puzzle: 0,
            shop: 0,
            boss: 0,
            monsterTreasure: 0,
            objective: 0
        };
        this.roomDistanceCache = new Map();
        this.backupAttempts = 0;
        this.newDirectionAttempts = 0;
        this.totalRoomsPlaced = 0;
        
        this.addRoom(0, 0, 'start', '🏠', 'START');
        this.currentPos = { x: 0, y: 0 };
        this.addHistory('start', { x: 0, y: 0 });
        this.calculateAllDistances();
        this.roomDirectionMemory.set('0,0', new Set());
    }

    // ============================================
    // DICE FUNCTIONS
    // ============================================
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

    // ============================================
    // SMART DIRECTION SYSTEM
    // ============================================
    getUnexploredDirections() {
        const key = `${this.currentPos.x},${this.currentPos.y}`;
        const used = this.roomDirectionMemory.get(key) || new Set();
        const allDirections = [1, 2, 3, 4];
        return allDirections.filter(d => !used.has(d));
    }

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

    getSmartDirection() {
        const unexplored = this.getUnexploredDirections();
        const available = this.getAvailableDirections();
        
        if (available.length === 0) {
            return this.rollDice(4);
        }

        if (unexplored.length > 0) {
            if (this.rollDice(100) <= 70) {
                this.newDirectionAttempts++;
                const index = this.rollDice(unexplored.length) - 1;
                return unexplored[index];
            }
        }

        this.backupAttempts++;
        const availableDirections = this.getAvailableDirections();
        const existingDirections = [1, 2, 3, 4].filter(d => {
            const dir = this.getDirection(d);
            const newX = this.currentPos.x + dir.dx;
            const newY = this.currentPos.y + dir.dy;
            const key = `${newX},${newY}`;
            return this.rooms.has(key) && key !== `${this.currentPos.x},${this.currentPos.y}`;
        });

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

        return this.rollDice(4);
    }

    rollForDirection() {
        return this.getSmartDirection();
    }

    // ============================================
    // DISTANCE CALCULATIONS
    // ============================================
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

    getDistantRooms(minDistance) {
        const result = [];
        for (const [key, room] of this.rooms) {
            if (room.type === 'start' || room.type === 'objective') continue;
            const dist = this.calculateDistance(room.x, room.y);
            if (dist >= minDistance && !room.featureType) {
                result.push({ key, room, distance: dist });
            }
        }
        return result.sort((a, b) => b.distance - a.distance);
    }

    // ============================================
    // DIFFICULTY & CHARGES
    // ============================================
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
        this.d8Roll = d8Value;
        return this.difficultyConfig[d8Value];
    }

    getCurrentDifficulty() {
        return this.difficultyConfig[this.difficulty] || this.difficultyConfig[3];
    }

    // ============================================
    // FEATURE CHECK - THIS IS WHAT CREATES ROOM TYPES!
    // ============================================
    checkForFeature(x, y) {
        const diffConfig = this.difficultyConfig[this.difficulty];
        const roll = this.rollDice(20);
        const key = `${x},${y}`;
        const distance = this.calculateDistance(x, y);
        
        // Empty room check based on difficulty
        if (this.rollDice(100) <= diffConfig.emptyRoomChance) {
            return null; // Empty room
        }
        
        // Boss check (very rare - only on 20)
        if (roll === 20) {
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
            const hasTreasure = this.rollDice(100) <= diffConfig.monsterTreasureChance;
            return {
                type: 'monster',
                icon: hasTreasure ? '👹💎' : '👹',
                label: hasTreasure ? 'MONSTER+' : 'MONSTER',
                description: 'Monster Lair',
                hasTreasure: hasTreasure
            };
        }
        
        // Shop check (very rare - 18-19)
        if (roll === 18 || roll === 19) {
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
        
        // Monster check (11-15)
        if (roll >= 11 && roll <= 15) {
            const currentMonsters = this.featureStats.monster || 0;
            if (currentMonsters < diffConfig.maxMonsters) {
                const hasTreasure = this.rollDice(100) <= diffConfig.monsterTreasureChance;
                return {
                    type: 'monster',
                    icon: hasTreasure ? '👹💎' : '👹',
                    label: hasTreasure ? 'MONSTER+' : 'MONSTER',
                    description: 'Monster Lair',
                    hasTreasure: hasTreasure
                };
            }
            // Too many monsters - become empty
            return null;
        }
        
        // Trap check (8-10)
        if (roll >= 8 && roll <= 10) {
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
        
        // Puzzle check (16-17)
        if (roll >= 16 && roll <= 17) {
            return {
                type: 'puzzle',
                icon: '🧩',
                label: 'PUZZLE',
                description: 'Puzzle Room'
            };
        }
        
        // Treasure check (2-4 - scarce)
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

    // ============================================
    // PLACE ROOM
    // ============================================
    placeRoom(direction) {
        if (this.charges <= 0) {
            return { success: false, message: 'No charges remaining!' };
        }

        const dir = this.getDirection(direction);
        const newX = this.currentPos.x + dir.dx;
        const newY = this.currentPos.y + dir.dy;
        const key = `${newX},${newY}`;

        const currentKey = `${this.currentPos.x},${this.currentPos.y}`;
        if (!this.roomDirectionMemory.has(currentKey)) {
            this.roomDirectionMemory.set(currentKey, new Set());
        }
        this.roomDirectionMemory.get(currentKey).add(direction);

        if (this.rooms.has(key)) {
            this.currentPos = { x: newX, y: newY };
            this.addHistory('move', { x: newX, y: newY, direction: dir.name });
            this.charges--;
            
            const newKey = `${newX},${newY}`;
            if (!this.roomDirectionMemory.has(newKey)) {
                this.roomDirectionMemory.set(newKey, new Set());
            }
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
        this.totalRoomsPlaced++;
        
        this.roomDistanceCache.set(key, this.calculateDistance(newX, newY));
        
        const newKey = `${newX},${newY}`;
        if (!this.roomDirectionMemory.has(newKey)) {
            this.roomDirectionMemory.set(newKey, new Set());
        }
        const oppositeDir = ((direction + 1) % 4) + 1;
        this.roomDirectionMemory.get(newKey).add(oppositeDir);
        
        // CHECK FOR FEATURE - THIS ADDS ROOM TYPES!
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
            
            if (feature.type === 'monster' && feature.hasTreasure) {
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

    // ============================================
    // PLACE OBJECTIVE
    // ============================================
    placeObjective() {
        if (this.objectivePlaced) {
            return { success: false, message: 'Objective already placed!' };
        }

        const diffConfig = this.difficultyConfig[this.difficulty];
        const minDistance = diffConfig.objectiveDistance || 5;
        
        let farthestRoom = null;
        let farthestDist = 0;
        
        for (const [key, room] of this.rooms) {
            if (room.type === 'start' || room.type === 'objective') continue;
            if (room.featureType) continue;
            const dist = this.roomDistanceCache.get(key) || 0;
            if (dist >= minDistance && dist > farthestDist) {
                farthestDist = dist;
                farthestRoom = { key, room, distance: dist };
            }
        }

        if (!farthestRoom) {
            for (const [key, room] of this.rooms) {
                if (room.type === 'start' || room.type === 'objective') continue;
                const dist = this.roomDistanceCache.get(key) || 0;
                if (dist > farthestDist) {
                    farthestDist = dist;
                    farthestRoom = { key, room, distance: dist };
                }
            }
        }

        if (!farthestRoom) {
            return { success: false, message: 'No valid room for objective!' };
        }

        const room = farthestRoom.room;
        room.icon = '⭐';
        room.label = 'GOAL';
        room.type = 'objective';
        room.color = 'has-objective';
        room.description = 'Adventurer Goal';
        room.featureType = 'objective';
        this.objectivePlaced = true;
        this.objectivePosition = { x: room.x, y: room.y };
        this.featureStats.objective = 1;
        
        this.addHistory('objective', { 
            x: room.x, 
            y: room.y, 
            distance: farthestDist 
        });

        return {
            success: true,
            message: `⭐ Objective placed ${farthestDist} rooms from start!`,
            position: { x: room.x, y: room.y },
            distance: farthestDist
        };
    }

    // ============================================
    // BALANCE DUNGEON - One-time use
    // ============================================
    balanceDungeon() {
        if (this.balanceUsed) {
            return { 
                success: false, 
                message: '⚠️ Balance already used! Reset the dungeon to balance again.',
                alreadyUsed: true
            };
        }

        const diffConfig = this.difficultyConfig[this.difficulty];
        const totalRooms = this.rooms.size - 1;
        if (totalRooms < 5) {
            return { 
                success: false, 
                message: 'Too few rooms to balance (need at least 5)' 
            };
        }

        const targetCounts = {
            treasure: Math.min(
                Math.max(diffConfig.treasureMin, Math.floor(totalRooms * 0.08)),
                diffConfig.treasureMax
            ),
            trap: Math.min(
                Math.max(diffConfig.trapMin, Math.floor(totalRooms * 0.12)),
                diffConfig.trapMax
            ),
            monster: Math.min(
                Math.max(1, Math.floor(totalRooms * 0.15)),
                diffConfig.maxMonsters
            ),
            puzzle: Math.floor(totalRooms * 0.06),
            boss: diffConfig.bossCount,
            shop: 0
        };

        const availableRooms = [];
        for (const [key, room] of this.rooms) {
            if (room.type !== 'start' && room.type !== 'objective' && !room.featureType) {
                const dist = this.roomDistanceCache.get(key) || 0;
                availableRooms.push({ key, room, distance: dist });
            }
        }

        availableRooms.sort((a, b) => b.distance - a.distance);

        let added = 0;
        const addedFeatures = [];
        const usedKeys = new Set();
        
        const bossTarget = targetCounts.boss || 0;
        const bossCandidates = availableRooms.filter(r => r.distance >= diffConfig.bossMinDistance);
        
        for (let i = 0; i < Math.min(bossTarget, bossCandidates.length); i++) {
            const candidate = bossCandidates[i];
            if (!usedKeys.has(candidate.key)) {
                const room = this.rooms.get(candidate.key);
                if (room && !room.featureType && room.type !== 'objective') {
                    room.icon = '👑';
                    room.label = 'BOSS';
                    room.featureType = 'boss';
                    room.color = 'has-boss';
                    room.description = 'Boss Chamber';
                    this.featureStats.boss = (this.featureStats.boss || 0) + 1;
                    added++;
                    usedKeys.add(candidate.key);
                    addedFeatures.push({ 
                        key: candidate.key, 
                        type: 'boss',
                        distance: candidate.distance 
                    });
                }
            }
        }

        const monsterTarget = targetCounts.monster || 0;
        const currentMonsters = this.featureStats.monster || 0;
        const monsterNeeded = Math.max(0, monsterTarget - currentMonsters);
        
        let monsterPlaced = 0;
        for (const candidate of availableRooms) {
            if (monsterPlaced >= monsterNeeded) break;
            if (usedKeys.has(candidate.key)) continue;
            const room = this.rooms.get(candidate.key);
            if (room && !room.featureType && room.type !== 'objective') {
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
                usedKeys.add(candidate.key);
                addedFeatures.push({ key: candidate.key, type: 'monster', hasTreasure });
                monsterPlaced++;
            }
        }

        const trapTarget = targetCounts.trap || 0;
        const currentTraps = this.featureStats.trap || 0;
        const trapNeeded = Math.max(0, trapTarget - currentTraps);
        
        let trapPlaced = 0;
        for (const candidate of availableRooms) {
            if (trapPlaced >= trapNeeded) break;
            if (usedKeys.has(candidate.key)) continue;
            const room = this.rooms.get(candidate.key);
            if (room && !room.featureType && room.type !== 'objective') {
                room.icon = '⚠️';
                room.label = 'TRAP';
                room.featureType = 'trap';
                room.color = 'has-trap';
                room.description = 'Dangerous Trap';
                this.featureStats.trap = (this.featureStats.trap || 0) + 1;
                added++;
                usedKeys.add(candidate.key);
                addedFeatures.push({ key: candidate.key, type: 'trap' });
                trapPlaced++;
            }
        }

        const treasureTarget = targetCounts.treasure || 0;
        const currentTreasure = this.featureStats.treasure || 0;
        const treasureNeeded = Math.max(0, treasureTarget - currentTreasure);
        
        let treasurePlaced = 0;
        for (const candidate of availableRooms) {
            if (treasurePlaced >= treasureNeeded) break;
            if (usedKeys.has(candidate.key)) continue;
            const room = this.rooms.get(candidate.key);
            if (room && !room.featureType && room.type !== 'objective') {
                room.icon = '💰';
                room.label = 'TREASURE';
                room.featureType = 'treasure';
                room.color = 'has-treasure';
                room.description = 'Treasure Hoard';
                this.featureStats.treasure = (this.featureStats.treasure || 0) + 1;
                added++;
                usedKeys.add(candidate.key);
                addedFeatures.push({ key: candidate.key, type: 'treasure' });
                treasurePlaced++;
            }
        }

        const puzzleTarget = targetCounts.puzzle || 0;
        const currentPuzzle = this.featureStats.puzzle || 0;
        const puzzleNeeded = Math.max(0, puzzleTarget - currentPuzzle);
        
        let puzzlePlaced = 0;
        for (const candidate of availableRooms) {
            if (puzzlePlaced >= puzzleNeeded) break;
            if (usedKeys.has(candidate.key)) continue;
            const room = this.rooms.get(candidate.key);
            if (room && !room.featureType && room.type !== 'objective') {
                room.icon = '🧩';
                room.label = 'PUZZLE';
                room.featureType = 'puzzle';
                room.color = 'has-puzzle';
                room.description = 'Puzzle Room';
                this.featureStats.puzzle = (this.featureStats.puzzle || 0) + 1;
                added++;
                usedKeys.add(candidate.key);
                addedFeatures.push({ key: candidate.key, type: 'puzzle' });
                puzzlePlaced++;
            }
        }

        if (!this.objectivePlaced && this.rooms.size > 5) {
            this.placeObjective();
        }

        this.balanceUsed = true;

        return {
            success: true,
            message: `Balanced ${diffConfig.name} dungeon: added ${added} features`,
            added: added,
            addedFeatures: addedFeatures,
            stats: this.featureStats,
            targets: targetCounts,
            difficulty: diffConfig,
            backupAttempts: this.backupAttempts,
            newDirectionAttempts: this.newDirectionAttempts,
            objectivePlaced: this.objectivePlaced,
            alreadyUsed: false
        };
    }

    // ============================================
    // CHECK IF BALANCE USED
    // ============================================
    isBalanceUsed() {
        return this.balanceUsed;
    }

    // ============================================
    // GET DUNGEON STATS
    // ============================================
    getDungeonStats() {
        const diffConfig = this.difficultyConfig[this.difficulty];
        const totalRooms = this.rooms.size;
        const nonStartRooms = totalRooms - 1;
        
        const stats = {
            difficulty: diffConfig,
            totalRooms: totalRooms,
            nonStartRooms: nonStartRooms,
            depth: this.depth,
            featureStats: { ...this.featureStats },
            objectivePlaced: this.objectivePlaced,
            objectivePosition: this.objectivePosition,
            roomTypes: {},
            percentages: {},
            directionStats: {
                newDirections: this.newDirectionAttempts,
                backupDirections: this.backupAttempts,
                totalMoves: this.newDirectionAttempts + this.backupAttempts
            },
            farthestRoom: null,
            averageDistance: 0,
            balanceUsed: this.balanceUsed
        };

        const typeCounts = {};
        for (const [key, room] of this.rooms) {
            const type = room.featureType || 'empty';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        }
        typeCounts.start = 1;
        stats.roomTypes = typeCounts;

        for (const [type, count] of Object.entries(typeCounts)) {
            stats.percentages[type] = ((count / totalRooms) * 100).toFixed(1);
        }

        let maxDist = 0;
        let farthestKey = null;
        for (const [key, room] of this.rooms) {
            const dist = this.roomDistanceCache.get(key) || 0;
            if (dist > maxDist) {
                maxDist = dist;
                farthestKey = key;
            }
        }
        if (farthestKey) {
            const room = this.rooms.get(farthestKey);
            stats.farthestRoom = {
                key: farthestKey,
                ...room,
                distance: maxDist
            };
        }

        let totalDist = 0;
        let count = 0;
        for (const [key, room] of this.rooms) {
            const dist = this.roomDistanceCache.get(key) || 0;
            totalDist += dist;
            count++;
        }
        stats.averageDistance = count > 0 ? (totalDist / count).toFixed(1) : 0;

        return stats;
    }

    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    getFeatureData(type) {
        const features = {
            treasure: { icon: '💰', label: 'TREASURE' },
            trap: { icon: '⚠️', label: 'TRAP' },
            monster: { icon: '👹', label: 'MONSTER' },
            puzzle: { icon: '🧩', label: 'PUZZLE' },
            shop: { icon: '🏪', label: 'SHOP' },
            boss: { icon: '👑', label: 'BOSS' },
            objective: { icon: '⭐', label: 'GOAL' },
            start: { icon: '🏠', label: 'START' },
            empty: { icon: '⬜', label: 'EMPTY' }
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
            if (room && room.type !== 'start' && room.type !== 'objective') {
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

    // ============================================
    // GETTERS
    // ============================================
    getStartRoom() {
        for (const [key, room] of this.rooms) {
            if (room.type === 'start') {
                return { key, ...room };
            }
        }
        return null;
    }

    getObjectiveRoom() {
        for (const [key, room] of this.rooms) {
            if (room.type === 'objective') {
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

    isObjectivePlaced() {
        return this.objectivePlaced;
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
        this.objectivePlaced = false;
        this.objectivePosition = null;
        this.balanceUsed = false;
        this.featureStats = {
            treasure: 0,
            trap: 0,
            monster: 0,
            puzzle: 0,
            shop: 0,
            boss: 0,
            monsterTreasure: 0,
            objective: 0
        };
        this.roomDistanceCache = new Map();
        this.backupAttempts = 0;
        this.newDirectionAttempts = 0;
        this.totalRoomsPlaced = 0;
        
        this.addRoom(0, 0, 'start', '🏠', 'START');
        this.currentPos = { x: 0, y: 0 };
        this.addHistory('start', { x: 0, y: 0 });
        this.calculateAllDistances();
        this.roomDirectionMemory.set('0,0', new Set());
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
            objectiveRoom: this.getObjectiveRoom(),
            features: this.featuresApplied,
            featureStats: this.featureStats,
            objectivePlaced: this.objectivePlaced,
            balanceUsed: this.balanceUsed,
            directionStats: {
                backupAttempts: this.backupAttempts,
                newDirectionAttempts: this.newDirectionAttempts
            },
            dungeonStats: this.getDungeonStats()
        };
    }
}

console.log('✅ DungeonMapGenerator class defined successfully');