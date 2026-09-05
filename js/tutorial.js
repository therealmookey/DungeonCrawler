/**
 * Dungeon Cartographer - Interactive Tutorial
 */

class TutorialManager {
    constructor() {
        this.steps = [];
        this.currentStep = 0;
        this.isActive = false;
        this.stepCallbacks = {};
        
        // Define tutorial steps
        this.defineSteps();
        
        // Setup DOM references
        this.overlay = document.getElementById('tutorial-overlay');
        this.tooltip = document.getElementById('tutorial-tooltip');
        this.nextBtn = document.getElementById('tutorialNextBtn');
        this.skipBtn = document.getElementById('tutorialSkipBtn');
        this.tutorialBtn = document.getElementById('tutorialBtn');
        
        // Bind events
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
                }
            },
            {
                id: 'balance',
                title: '⚖️ Balance Your Dungeon',
                description: 'Press <kbd>B</kbd> or click <strong>⚖️</strong> to balance your dungeon.<br><br>This ensures the right number of monsters, traps, and treasures based on your difficulty setting.',
                highlight: '#balanceBtn',
                nextText: 'Next →',
                skipable: true,
                onEnter: () => {
                    this.highlightElement('#balanceBtn');
                    this.showTooltip('#balanceBtn', '⚖️ Balance', 'Press <kbd>B</kbd> or click to balance dungeon features.', 'B');
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
                }
            }
        ];
    }

    bindEvents() {
        // Tutorial button
        this.tutorialBtn.addEventListener('click', () => {
            this.start();
        });

        // Next button
        this.nextBtn.addEventListener('click', () => {
            this.next();
        });

        // Skip button
        this.skipBtn.addEventListener('click', () => {
            this.skip();
        });

        // Keyboard shortcuts for tutorial
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.next();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                this.skip();
            }
        });

        // Click outside to skip (on overlay background)
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

        // Show overlay for intro/complete steps
        if (step.id === 'intro' || step.id === 'complete') {
            this.showOverlay(true);
            this.hideTooltip();
            this.clearHighlights();
        } else {
            this.showOverlay(false);
        }

        // Update overlay content
        if (step.id === 'intro' || step.id === 'complete') {
            document.querySelector('#tutorial-content h2').innerHTML = step.title;
            document.querySelector('#tutorial-content p').innerHTML = step.description;
            this.nextBtn.textContent = step.nextText || 'Next →';
            this.skipBtn.style.display = step.skipable ? 'inline-block' : 'none';
        }

        // Call onEnter
        if (step.onEnter) {
            step.onEnter();
        }

        // Store current step ID for reference
        this.currentStepId = step.id;
    }

    showOverlay(show) {
        this.overlay.classList.toggle('active', show);
    }

    showTooltip(selector, title, description, shortcut = null) {
        const element = document.querySelector(selector);
        if (!element) {
            this.hideTooltip();
            return;
        }

        const rect = element.getBoundingClientRect();
        const tooltip = this.tooltip;
        
        // Position tooltip below or above the element
        let top = rect.bottom + 12;
        let left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
        
        // If tooltip would go off screen, position above
        if (top + 200 > window.innerHeight) {
            top = rect.top - 200;
        }
        
        // Keep tooltip in viewport horizontally
        if (left < 10) left = 10;
        if (left + 350 > window.innerWidth) left = window.innerWidth - 360;
        
        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
        
        // Set content
        tooltip.innerHTML = `
            <div class="tooltip-title">${title}</div>
            <div class="tooltip-desc">${description}</div>
            ${shortcut ? `<div class="tooltip-shortcut">⌨️ Shortcut: <kbd>${shortcut}</kbd></div>` : ''}
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
            // Also scroll to element if needed
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

    // Method to check if a specific step is active (for conditional highlighting)
    isStepActive(stepId) {
        return this.isActive && this.currentStepId === stepId;
    }
}

// Initialize tutorial when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.tutorial = new TutorialManager();
});