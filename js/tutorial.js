/**
 * Dungeon Cartographer - Tutorial System
 * This file is optional and can be loaded last
 */

console.log('📖 tutorial.js loaded');

class TutorialManager {
    constructor() {
        console.log('🏗️ Creating TutorialManager instance');
        this.isActive = false;
        this.currentStep = 0;
        this.overlay = document.getElementById('tutorial-overlay');
        this.tooltip = document.getElementById('tutorial-tooltip');
        this.nextBtn = document.getElementById('tutorialNextBtn');
        this.skipBtn = document.getElementById('tutorialSkipBtn');
        this.tutorialBtn = document.getElementById('tutorialBtn');
        
        this.bindEvents();
        console.log('✅ TutorialManager ready');
    }

    bindEvents() {
        if (this.tutorialBtn) {
            this.tutorialBtn.addEventListener('click', () => {
                console.log('❓ Tutorial button clicked');
                this.start();
            });
        }

        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => {
                console.log('➡️ Next button clicked');
                this.next();
            });
        }

        if (this.skipBtn) {
            this.skipBtn.addEventListener('click', () => {
                console.log('⏭️ Skip button clicked');
                this.skip();
            });
        }

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
    }

    start() {
        console.log('▶️ Tutorial started');
        this.isActive = true;
        this.currentStep = 0;
        if (this.overlay) {
            this.overlay.classList.add('active');
        }
        this.updateOverlayContent('📖 Welcome!', 'Press <kbd>␣</kbd> or <kbd>Enter</kbd> to advance through the tutorial.', true);
    }

    next() {
        console.log('➡️ Tutorial step:', this.currentStep);
        if (this.currentStep < 5) {
            this.currentStep++;
            const messages = [
                '🎲 Step 1: Press <kbd>8</kbd> or click <strong>🎲 D8</strong> to set difficulty.',
                '🎲 Step 2: Press <kbd>Enter</kbd> or click <strong>🎲 D20</strong> to get charges.',
                '🎲 Step 3: Press <kbd>Enter</kbd> or click <strong>🎲 D4</strong> to place rooms.',
                '⭐ Step 4: Press <kbd>G</kbd> or click <strong>⭐</strong> to place your goal.',
                '⚖️ Step 5: Press <kbd>B</kbd> or click <strong>⚖️</strong> to balance (once per dungeon).'
            ];
            this.updateOverlayContent(`Step ${this.currentStep}/${messages.length}`, messages[this.currentStep - 1], false);
        } else {
            this.complete();
        }
    }

    skip() {
        this.complete();
    }

    complete() {
        console.log('✅ Tutorial completed');
        this.isActive = false;
        this.currentStep = 0;
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
        if (this.tooltip) {
            this.tooltip.classList.remove('active');
        }
    }

    updateOverlayContent(title, description, isStart) {
        if (!this.overlay) return;
        const h2 = this.overlay.querySelector('h2');
        const p = this.overlay.querySelector('p');
        if (h2) h2.innerHTML = title;
        if (p) p.innerHTML = description;
        
        const nextBtn = this.overlay.querySelector('#tutorialNextBtn');
        const skipBtn = this.overlay.querySelector('#tutorialSkipBtn');
        if (nextBtn) nextBtn.textContent = isStart ? 'Start Tutorial →' : 'Next →';
        if (skipBtn) skipBtn.style.display = isStart ? 'inline-block' : 'inline-block';
    }
}

// Initialize tutorial after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📖 Initializing TutorialManager...');
    // Use a small delay to ensure everything is loaded
    setTimeout(() => {
        if (typeof TutorialManager !== 'undefined') {
            window.tutorial = new TutorialManager();
            console.log('✅ TutorialManager initialized and available globally');
        } else {
            console.warn('⚠️ TutorialManager class not found');
        }
    }, 200);
});