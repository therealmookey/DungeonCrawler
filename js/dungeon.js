/**
 * Dungeon Cartographer - Core Generator
 * This class should ONLY exist in dungeon.js
 */

console.log('✅ dungeon.js loaded - Defining DungeonMapGenerator');

class DungeonMapGenerator {
    constructor() {
        console.log('🏗️ Creating new DungeonMapGenerator instance');
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
        this.featureStats = { treasure: 0, trap: 0, monster: 0, puzzle: 0, shop: 0, boss: 0, monsterTreasure: 0, objective: 0 };
        this.roomDistanceCache = new Map();
        this.backupAttempts = 0;
        this.newDirectionAttempts = 0;
        this.objectivePlaced = false;
        this.objectivePosition = null;
        
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

    getSmartDirection() {
        return this.rollDice(4);
    }

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
        this.difficulty = d8;
        this.d8Roll = d8;
        return {
            roll: d8,
            name: this.getDifficultyName(d8)
        };
    }

    getDifficultyName(d8) {
        const names = {
            1: 'Very Easy',
            2: 'Easy',
            3: 'Normal',
            4: 'Normal+',
            5: 'Hard',
            6: 'Hard+',
            7: 'Very Hard',
            8: '💀 Deadly'
        };
        return names[d8] || 'Normal';
    }

    getCurrentDifficulty() {
        return {
            name: this.getDifficultyName(this.difficulty),
            color: '#ffff44',
            description: 'Balanced dungeon'
        };
    }

    addRoom(x, y, type = 'room', icon = '⬜', label = '') {
        const key = `${x},${y}`;
        if (!this.rooms.has(key)) {
            this.roomCounter++;
        }
        this.rooms.set(key, {
            x, y, type, icon, label,
            id: this.roomCounter,
            placed: true,
            featureType: null,
            color: '',
            description: '',
            hasTreasure: false
        });
    }

    addHistory(action, data) {
        this.history.push({ action, data, timestamp: Date.now() });
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

        this.addRoom(newX, newY, 'room', '⬜', '');
        const room = this.rooms.get(key);
        this.roomDistanceCache.set(key, this.calculateDistance(newX, newY));
        
        this.currentPos = { x: newX, y: newY };
        this.depth++;
        this.charges--;
        this.addHistory('place', { x: newX, y: newY, direction: dir.name });

        return {
            success: true,
            message: `Placed room (${dir.emoji} ${dir.name})`,
            room: room,
            chargesLeft: this.charges,
            isMove: false
        };
    }

    placeObjective() {
        if (this.objectivePlaced) {
            return { success: false, message: 'Objective already placed!' };
        }

        let farthestRoom = null;
        let farthestDist = 0;
        
        for (const [key, room] of this.rooms) {
            if (room.type === 'start' || room.type === 'objective') continue;
            const dist = this.roomDistanceCache.get(key) || 0;
            if (dist > farthestDist) {
                farthestDist = dist;
                farthestRoom = { key, room, distance: dist };
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
        room.featureType = 'objective';
        this.objectivePlaced = true;
        this.objectivePosition = { x: room.x, y: room.y };
        this.featureStats.objective = 1;
        
        this.addHistory('objective', { x: room.x, y: room.y, distance: farthestDist });

        return {
            success: true,
            message: `⭐ Objective placed ${farthestDist} rooms from start!`,
            position: { x: room.x, y: room.y },
            distance: farthestDist
        };
    }

    balanceDungeon() {
        if (this.balanceUsed) {
            return { 
                success: false, 
                message: '⚠️ Balance already used! Reset the dungeon to balance again.',
                alreadyUsed: true
            };
        }

        const totalRooms = this.rooms.size - 1;
        if (totalRooms < 5) {
            return { 
                success: false, 
                message: 'Too few rooms to balance (need at least 5)' 
            };
        }

        this.balanceUsed = true;

        return {
            success: true,
            message: `Balanced dungeon: added features`,
            added: 0,
            alreadyUsed: false
        };
    }

    isBalanceUsed() {
        return this.balanceUsed;
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
                this.rooms.delete(key);
                this.roomDistanceCache.delete(key);
                const prev = this.history[this.history.length - 1];
                if (prev) {
                    this.currentPos = { x: prev.data.x || 0, y: prev.data.y || 0 };
                }
                this.charges++;
                return { success: true, message: 'Undid room placement' };
            }
        }
        
        if (lastAction.action === 'move') {
            const prev = this.history[this.history.length - 1];
            if (prev) {
                this.currentPos = { x: prev.data.x || 0, y: prev.data.y || 0 };
                this.charges++;
                return { success: true, message: 'Undid movement' };
            }
        }

        this.history.push(lastAction);
        return { success: false, message: 'Could not undo this action' };
    }

    getFeatureStats() {
        return this.featureStats;
    }

    getRoomDistance(key) {
        return this.roomDistanceCache.get(key) || 0;
    }

    isObjectivePlaced() {
        return this.objectivePlaced;
    }

    getDungeonStats() {
        const totalRooms = this.rooms.size;
        return {
            totalRooms: totalRooms,
            depth: this.depth,
            featureStats: { ...this.featureStats },
            objectivePlaced: this.objectivePlaced,
            balanceUsed: this.balanceUsed,
            directionStats: {
                newDirections: this.newDirectionAttempts,
                backupDirections: this.backupAttempts,
                totalMoves: this.newDirectionAttempts + this.backupAttempts
            },
            farthestRoom: null,
            roomTypes: {},
            percentages: {}
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
        this.d8Roll = this.difficulty;
        this.currentD20 = null;
        this.currentD4 = null;
        this.featureStats = { treasure: 0, trap: 0, monster: 0, puzzle: 0, shop: 0, boss: 0, monsterTreasure: 0, objective: 0 };
        this.roomDistanceCache = new Map();
        this.backupAttempts = 0;
        this.newDirectionAttempts = 0;
        this.objectivePlaced = false;
        this.objectivePosition = null;
        this.balanceUsed = false;
        
        this.addRoom(0, 0, 'start', '🏠', 'START');
        this.currentPos = { x: 0, y: 0 };
        this.addHistory('start', { x: 0, y: 0 });
        this.calculateAllDistances();
    }
}

console.log('✅ DungeonMapGenerator class defined successfully');
console.log('   Type: ' + typeof DungeonMapGenerator);