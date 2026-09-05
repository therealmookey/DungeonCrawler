/**
 * Dungeon Cartographer - Interactive Tutorial
 * With Spacebar/Enter indicator
 */

class TutorialManager {
    constructor() {
        this.steps = [];
        this.currentStep = 0;
        this.isActive = false;
        this.stepCallbacks = {};
        
        this.defineSteps();
        
        this.overlay = document.getElementById('tutorial-overlay');
        this.tooltip = document.getElementById('tutorial-tooltip');
        this.nextBtn = document.getElementById('tutorialNextBtn');
        this.skipBtn = document.getElementById('tutorialSkipBtn');
        this.tutorialBtn = document.getElementById('tutorialBtn');
        
        this.bindEvents();
    }

    defineSteps() {
        this.steps = [
            {
                id: 'intro',
                title: '📖 Welcome!',
                description: 'Dungeon Cartographer helps you build printable dungeon maps for your D&D campaigns.',
                highlight: null,
                nextText: 'Next →',
                skipable: true,
                onEnter: () => {
                    this.showOverlay(true);
                    this.hideTooltip();
                    this.updateProgress();
                }
            },
            {
                id: 'difficulty',
                title: '🎲 Step 1: Set Difficulty',
                description: 'Press <kbd>8</kbd> or click <strong>🎲 D8</strong> to set the dungeon difficulty.<br><br>This determines how many monsters, traps, and bosses your dungeon will have.',
                highlight: '#rollD8Btn',
                nextText: 'Next →',
                skipable: true,
                onEnter: () => {
                    this.highlightElement('#rollD8Btn');
                    this.showTooltip('#rollD8Btn', '🎲 D8', 'Press <kbd>8</kbd> or click this button to roll for difficulty.', '8');
                    this.updateProgress();
                }
            },
            {
                id: 'd20',
                title: '🎲 Step 2: Get Charges',
                description: 'Press <kbd>Enter</kbd> or click <strong>🎲 D20</strong> to roll for charges.<br><br>The D20 keeps rolling until it hits 1. Each roll gives you one charge to place a room.',
                highlight: '#rollD20Btn',
                nextText: 'Next →',
                skipable: true,
                onEnter: () => {
                    this.highlightElement('#rollD20Btn');
                    this.showTooltip('#rollD20Btn', '🎲 D20', 'Press <kbd>Enter</kbd> or click to roll for charges.', 'Enter');
                    this.updateProgress();
                }
            },
            {
                id: 'd4',
                title: '🎲 Step 3: Place Rooms',
                description: 'Press <kbd>Enter</kbd> or click <strong>🎲 D4</strong> to place a room.<br><br>Each roll goes in a direction (⬆️ North, ➡️ East, ⬇️ South, ⬅️ West).<br>70% chance to explore new areas, 30% to backup into existing rooms.',
                highlight: '#rollD4Btn',
                nextText: 'Next →',
                skipable: true,
                onEnter: () => {
                    this.highlightElement('#rollD4Btn');
                    this.showTooltip('#rollD4Btn', '🎲 D4', 'Press <kbd>Enter</kbd> or click to place a room.', 'Enter');
                    this.updateProgress();
                }
            },
            {
                id: 'features',
                title: '🎯 Room Features',
                description: 'Rooms can contain features:<br>👹 Monsters (may drop 💎 treasure)<br>💰 Treasure<br>⚠️ Traps<br>🧩 Puzzles<br>👑 Bosses<br>🏪 Shops (very rare)',
                highlight: '#featureStats',
                nextText: 'Next →',
                skipable: true,
                onEnter: () => {
                    this.highlightElement('#featureStats');
                    this.showTooltip('#featureStats', '🎯 Features', 'Room features appear randomly based on difficulty and dice rolls.');
                    this.updateProgress();
                }
            },
            {
                id: 'objective',
                title: '⭐ Place Your Goal',
                description: 'Press <kbd>G</kbd> or click <strong>⭐</strong> to place the dungeon goal.<br><br>This marks where your adventurers need to reach.<br>The goal is placed in the farthest room from the start.',
                highlight: '#placeObjectiveBtn',
                nextText: 'Next →',
                skipable: true,
                onEnter: () => {
                    this.highlightElement('#placeObjectiveBtn');
                    this.showTooltip('#placeObjectiveBtn', '⭐ Goal', 'Press <kbd>G</kbd> or click to place the dungeon goal.', 'G');
                    this.updateProgress();
                }
            },
            {
                id: 'balance',
                title: '⚖️ Balance Your Dungeon (Once!)',
                description: 'Press <kbd>B</kbd> or click <strong>⚖️</strong> to balance your dungeon.<br><br>This ensures the right number of monsters, traps, and treasures based on your difficulty setting.<br><br><strong>⚠️ Balance can only be used once per dungeon!</strong>',
                highlight: '#balanceBtn',
                nextText: 'Next →',
                skipable: true,
                onEnter: () => {
                    this.highlightElement('#balanceBtn');
                    this.showTooltip('#balanceBtn', '⚖️ Balance (Once!)', 'Press <kbd>B</kbd> or click to balance dungeon features.<br><br>⚠️ Can only be used once per dungeon!', 'B');
                    this.updateProgress();
                }
            },
            {
                id: 'undo',
                title: '↩️ Undo Mistakes',
                description: 'Press <kbd>Ctrl+Z</kbd> or click <strong>↩️</strong> to undo your last action.<br><br>You can undo room placements and movements.',
                highlight: '#undoBtn',
                nextText: 'Next →',
                skipable: true,
                onEnter: () => {
                    this.highlightElement('#undoBtn');
                    this.showTooltip('#undoBtn', '↩️ Undo', 'Press <kbd>Ctrl+Z</kbd> or click to undo.', 'Ctrl+Z');
                    this.updateProgress();
                }
            },
            {
                id: 'print',
                title: '🖨️ Print Your Map',
                description: 'Click <strong>🖨️</strong> to print your dungeon map.<br><br>Perfect for your D&D sessions!',
                highlight: '#printBtn',
                nextText: 'Done! 🎉',
                skipable: false,
                onEnter: () => {
                    this.highlightElement('#printBtn');
                    this.showTooltip('#printBtn', '🖨️ Print', 'Click to print your dungeon map.');
                    this.updateProgress();
                }
            },
            {
                id: 'complete',
                title: '🎉 Tutorial Complete!',
                description: 'You now know how to use the Dungeon Cartographer!<br><br>🎲 Roll D8 → Roll D20 → Roll D4 → Build your dungeon!<br><br>Good luck, Dungeon Master!',
                highlight: null,
                nextText: 'Close',
                skipable: false,
                onEnter: () => {
                    this.showOverlay(true);
                    this.hideTooltip();
                    this.clearHighlights();
                    this.updateProgress();
                }
            }
        ];
    }

    bindEvents() {
        this.tutorialBtn.addEventListener('click', () => {
            this.start();
        });

        this.nextBtn.addEventListener('click', () => {
            this.next();
        });

        this.skipBtn.addEventListener('click', () => {
            this.skip();
        });

        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            
            if (e.key === ' ' || e.key === 'Space' || e.key === 'Enter') {
                e.preventDefault();
                this.next();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                this.skip();
            }
        });

        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay && this.steps[this.currentStep]?.skipable) {
                this.skip();
            }
        });
    }

    start() {
        this.isActive = true;
        this.currentStep = 0;
        this.showStep(0);
    }

    next() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.showStep(this.currentStep);
        } else {
            this.complete();
        }
    }

    skip() {
        this.complete();
    }

    showStep(index) {
        const step = this.steps[index];
        if (!step) return;

        if (step.id === 'intro' || step.id === 'complete') {
            this.showOverlay(true);
            this.hideTooltip();
            this.clearHighlights();
        } else {
            this.showOverlay(false);
        }

        if (step.id === 'intro' || step.id === 'complete') {
            document.querySelector('#tutorial-content h2').innerHTML = step.title;
            document.querySelector('#tutorial-content p').innerHTML = step.description;
            this.nextBtn.textContent = step.nextText || 'Next →';
            this.skipBtn.style.display = step.skipable ? 'inline-block' : 'none';
            this.updateProgressIndicator();
        }

        if (step.onEnter) {
            step.onEnter();
        }

        this.currentStepId = step.id;
    }

    showOverlay(show) {
        this.overlay.classList.toggle('active', show);
        if (show) {
            this.updateProgressIndicator();
        }
    }

    updateProgress() {
        this.updateProgressIndicator();
    }

    updateProgressIndicator() {
        const content = document.querySelector('#tutorial-content');
        if (!content) return;

        const existing = content.querySelector('.tutorial-progress');
        if (existing) existing.remove();

        const progress = document.createElement('div');
        progress.className = 'tutorial-progress';
        
        const total = this.steps.length;
        const current = this.currentStep + 1;
        
        progress.innerHTML = `
            <span class="tutorial-step-indicator">Step ${current} of ${total}</span>
            <span class="tutorial-next-indicator">
                <kbd>␣</kbd> or <kbd>Enter</kbd> to continue
            </span>
        `;
        
        const btnContainer = content.querySelector('.tutorial-buttons');
        if (btnContainer) {
            content.insertBefore(progress, btnContainer);
        } else {
            const desc = content.querySelector('p');
            if (desc) {
                desc.after(progress);
            } else {
                content.appendChild(progress);
            }
        }
    }

    showTooltip(selector, title, description, shortcut = null) {
        const element = document.querySelector(selector);
        if (!element) {
            this.hideTooltip();
            return;
        }

        const rect = element.getBoundingClientRect();
        const tooltip = this.tooltip;
        
        let top = rect.bottom + 12;
        let left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
        
        if (top + 200 > window.innerHeight) {
            top = rect.top - 200;
        }
        
        if (left < 10) left = 10;
        if (left + 350 > window.innerWidth) left = window.innerWidth - 360;
        
        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
        
        tooltip.innerHTML = `
            <div class="tooltip-title">${title}</div>
            <div class="tooltip-desc">${description}</div>
            ${shortcut ? `<div class="tooltip-shortcut">⌨️ Shortcut: <kbd>${shortcut}</kbd></div>` : ''}
            <div class="tooltip-next">Press <kbd>␣</kbd> or <kbd>Enter</kbd> to continue</div>
        `;
        
        tooltip.classList.add('active');
    }

    hideTooltip() {
        this.tooltip.classList.remove('active');
    }

    highlightElement(selector) {
        this.clearHighlights();
        const element = document.querySelector(selector);
        if (element) {
            element.classList.add('tutorial-highlight');
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    clearHighlights() {
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
    }

    complete() {
        this.isActive = false;
        this.overlay.classList.remove('active');
        this.hideTooltip();
        this.clearHighlights();
        this.currentStep = 0;
    }

    isStepActive(stepId) {
        return this.isActive && this.currentStepId === stepId;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.tutorial = new TutorialManager();
});