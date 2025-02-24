// Initialize your game here
window.addEventListener('load', () => {
    console.log('Game initialized');
    // Add your game logic here
});

class AppleGame {
    constructor() {
        // Move these initializations to the top, right after canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize collections first
        this.animations = [];
        this.particles = [];
        this.fallingApples = [];
        this.scorePopups = [];
        this.touchPoints = new Map();
        this.activeSelections = new Map(); // Move this up with other collections
        
        // Add confirmation dialog properties
        this.confirmDialog = {
            isVisible: false,
            message: '',
            onConfirm: null,
            width: 300,
            height: 150,
            buttons: {
                yes: {
                    text: 'Yes',
                    isHovered: false
                },
                no: {
                    text: 'No',
                    isHovered: false
                }
            }
        };
        
        // Add reset button properties
        this.resetButton = {
            x: 0,
            y: 10,
            width: 80,
            height: 30,
            text: '↺ Reset',
            isHovered: false
        };
        
        // Initialize other properties
        this.score = 0;
        this.timeLeft = 60*2;
        this.isDrawing = false;
        this.selectionStart = { x: 0, y: 0 };
        this.selectionEnd = { x: 0, y: 0 };
        this.currentSum = 0;
        this.tipsLeft = 999;
        this.tipTimeout = null;
        
        // Grid configuration
        this.gridWidth = 17;
        this.gridHeight = 10;
        this.minCellSize = 30;
        this.maxCellSize = 60;
        this.cellSize = this.maxCellSize;
        this.timerHeight = 24;
        
        // Initialize grid
        this.grid = this.createGrid();
        
        // Handle resize to set initial dimensions
        this.handleResize();
        
        // Add event listeners
        this.bindEvents();
        window.addEventListener('resize', () => this.handleResize());
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Initialize high score from localStorage
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
        
        // Add page navigation handlers
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('playAgainButton').addEventListener('click', () => this.resetGame());
        
        // Show start page initially
        this.showPage('start-page');
        
        // Add tip button handler
        document.getElementById('tipButton').addEventListener('click', () => this.showTip());
        
        // Add continuous auto-solve button handler
        document.getElementById('continuousAutoButton').addEventListener('click', () => this.toggleContinuousAutoSolve());
        
        // Add continuous auto-solve state
        this.isAutoSolving = false;
        this.autoSolveInterval = null;
        
        // Add fruit type
        this.fruitType = localStorage.getItem('fruitType') || 'apple';
        
        // Load fruit images
        this.fruitImages = {
            apple: 'images/apple.svg',
            orange: 'images/orange.svg',
            pear: 'images/pear.svg',
            melon: 'images/melon.svg',
            grape: 'images/grape.svg',
            mango: 'images/mango.svg'
        };
        
        // Initialize fruit selector
        this.initFruitSelector();
        
        // Load current fruit image
        this.loadFruitImage(this.fruitType);
        
        // Add touch event handling
        this.bindTouchEvents();
        
        // Keep these timer-related properties
        this.initialTime = 60 * 2;
        this.timeLeft = this.initialTime;
        this.lastUpdate = 0;
        this.msLeft = 0;
        
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 100); // Small delay to let the browser update
        });

        // Check for debug mode
        const isDebugMode = window.location.search.includes('?debug');
        if (isDebugMode) {
            // Show debug controls
            const debugControls = document.getElementById('debug-controls');
            debugControls.style.display = 'flex';
            
            // Create debug buttons with consistent styling
            const debugButtons = [
                {
                    text: 'Show Tip',
                    subText: `(${this.tipsLeft})`,
                    id: 'tipButton',
                    onClick: () => {
                        this.showTip();
                        // Update button text after using tip
                        const btn = document.getElementById('tipButton');
                        if (btn) {
                            btn.querySelector('.main-text').textContent = 'Show Tip';
                            btn.querySelector('.sub-text').textContent = `(${this.tipsLeft})`;
                        }
                    }
                },
                {
                    text: 'Auto Solve',
                    subText: `(${this.tipsLeft})`,
                    id: 'autoTipButton',
                    onClick: () => {
                        this.showAutoTip();
                        // Update button text after auto solve
                        const btn = document.getElementById('autoTipButton');
                        if (btn) {
                            btn.querySelector('.main-text').textContent = 'Auto Solve';
                            btn.querySelector('.sub-text').textContent = `(${this.tipsLeft})`;
                        }
                    }
                },
                {
                    text: 'Auto Run',
                    id: 'continuousAutoButton',
                    onClick: () => {
                        this.toggleContinuousAutoSolve();
                        // Update button text based on auto-solve state
                        const btn = document.getElementById('continuousAutoButton');
                        if (btn) {
                            btn.querySelector('.main-text').textContent = this.isAutoSolving ? 'Stop Auto' : 'Auto Run';
                            btn.style.backgroundColor = this.isAutoSolving ? '#f44336' : '#4CAF50';
                        }
                    }
                },
                {
                    text: 'Regen Grid',
                    id: 'regenButton',
                    onClick: () => {
                        const originalHasValidMoves = this.hasValidMoves;
                        this.hasValidMoves = () => false;
                        this.regenerateGrid();
                        this.hasValidMoves = originalHasValidMoves;
                    }
                }
            ];

            // Remove existing buttons
            debugControls.innerHTML = '';

            // Add styled buttons
            debugButtons.forEach(button => {
                const btnElement = document.createElement('button');
                btnElement.className = 'debug-button';
                btnElement.id = button.id;
                
                // Create text container
                const textContainer = document.createElement('div');
                textContainer.className = 'button-text-container';
                
                // Add main text
                const mainText = document.createElement('span');
                mainText.className = 'main-text';
                mainText.textContent = button.text;
                textContainer.appendChild(mainText);
                
                // Add sub text if exists
                if (button.subText) {
                    const subText = document.createElement('span');
                    subText.className = 'sub-text';
                    subText.textContent = button.subText;
                    textContainer.appendChild(subText);
                }
                
                btnElement.appendChild(textContainer);
                btnElement.addEventListener('click', button.onClick);
                debugControls.appendChild(btnElement);
            });

            // Add CSS styles for debug controls and buttons
            const style = document.createElement('style');
            style.textContent = `
                #debug-controls {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    z-index: 1000;
                    background: rgba(0, 0, 0, 0.8);
                    padding: 10px;
                    border-radius: 8px;
                    min-width: 160px;
                }

                .debug-button {
                    width: 160px;
                    height: 40px;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-weight: bold;
                    text-transform: uppercase;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                }

                .button-text-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    white-space: nowrap;
                    padding: 0 10px;
                    box-sizing: border-box;
                }

                .main-text {
                    flex: 1;
                    text-align: center;
                }

                .sub-text {
                    font-size: 12px;
                    opacity: 0.8;
                    min-width: 45px;
                    text-align: right;
                }

                .debug-button:hover {
                    background-color: #45a049;
                    transform: scale(1.02);
                }

                .debug-button:active {
                    background-color: #3d8b40;
                    transform: scale(0.98);
                }
            `;
            document.head.appendChild(style);
        }
        
        // Initialize audio manager
        this.audio = new AudioManager();
        
        // Add timer interval property
        this.timerInterval = null;
        
        // Add clear high score button handler
        document.getElementById('clearHighScoreButton').addEventListener('click', () => this.clearHighScore());
        
        // Add fruit colors
        this.fruitColors = {
            apple: '#ff0000',
            orange: '#FFA500',
            pear: '#D4E157',
            melon: '#4CAF50',
            grape: '#9C27B0',
            mango: '#FFB300'
        };
        
        // Initialize theme
        this.initTheme();
        
        // Add home button handler
        document.getElementById('homeButton').addEventListener('click', () => {
            this.showPage('start-page');
            // Reset game state
            this.score = 0;
            this.timeLeft = this.initialTime;
            this.grid = this.createGrid();
        });

        // Add touch event listeners
        this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd);
        this.canvas.addEventListener('touchcancel', this.handleTouchEnd);

        // Add timer animation properties
        this.lastTimerUpdate = 0;
        this.targetTimeLeft = this.initialTime;
        this.currentTimeLeft = this.initialTime;
        this.timerAnimationFrame = null;
    }
    
    createGrid() {
        const grid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            const row = [];
            for (let x = 0; x < this.gridWidth; x++) {
                row.push({
                    value: Math.floor(Math.random() * 9) + 1,
                    selected: false,
                    hint: false
                });
            }
            grid.push(row);
        }
        return grid;
    }
    
    bindEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Add global mouseup handler to catch releases outside canvas
        document.addEventListener('mouseup', (e) => {
            if (this.isDrawing) {
                this.handleMouseUp(null);
            }
        });
        
        // Optional: handle mouse leaving the window
        window.addEventListener('blur', () => {
            if (this.isDrawing) {
                this.handleMouseUp(null);
            }
        });
    }
    
    bindTouchEvents() {
        // Bind the handlers to preserve 'this' context
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);

        this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd);
        this.canvas.addEventListener('touchcancel', this.handleTouchEnd);
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scoreMargin = 40;
        
        // Get the coordinates
        let clientX, clientY;
        if (e.touches) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        // Calculate the scale of the canvas
        const scaleX = this.canvas.width / rect.width;
        const scaleY = (this.canvas.height - this.timerHeight) / rect.height;
        
        // Get position within the canvas and adjust for score margin
        const x = (clientX - rect.left) * scaleX;
        const y = ((clientY - rect.top) * scaleY) - scoreMargin;
        
        // Convert to grid coordinates
        const gridX = Math.max(0, Math.min(this.gridWidth - 1, Math.floor(x / this.cellSize)));
        const gridY = Math.max(0, Math.min(this.gridHeight - 1, Math.floor(y / this.cellSize)));
        
        return { x: gridX, y: gridY };
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        
        if (this.isCountingDown) return;

        // Handle each new touch
        Array.from(e.changedTouches).forEach(touch => {
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            // Check for UI interactions first
            if (this.handleUITouchInteraction(x, y)) {
                return;
            }

            // Start a new selection for this touch
            const pos = this.getMousePos(touch);
            this.activeSelections.set(touch.identifier, {
                start: pos,
                end: { ...pos },
                sum: 0,
                selectedCells: new Set()
            });
            
            // Store touch point
            this.touchPoints.set(touch.identifier, { x, y });
            
            this.audio.play('select');
            this.updateAllSelections();
            this.draw();
        });
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        
        // Update each changed touch
        Array.from(e.changedTouches).forEach(touch => {
            const selection = this.activeSelections.get(touch.identifier);
            if (selection) {
                selection.end = this.getMousePos(touch);
                this.updateAllSelections();
                this.draw();
            }
        });
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        
        // Process each ended touch
        Array.from(e.changedTouches).forEach(touch => {
            const selection = this.activeSelections.get(touch.identifier);
            if (selection) {
                // Process the selection if it sums to 10
                if (selection.sum === 10) {
                    this.audio.play('match');
                    let selectedCount = 0;
                    
                    // Process selected cells
                    selection.selectedCells.forEach(cellKey => {
                        const [x, y] = cellKey.split(',').map(Number);
                        if (this.grid[y][x].selected) {
                            selectedCount++;
                            this.startDestroyAnimation(x, y, this.grid[y][x].value);
                            this.grid[y][x].value = null;
                        }
                    });
                    
                    this.updateScore(selectedCount);
                    
                    if (!this.hasValidMoves()) {
                        this.regenerateGrid();
                    }
                } else if (selection.sum > 0) {
                    this.audio.play('wrong');
                }
                
                // Remove this selection
                this.activeSelections.delete(touch.identifier);
                this.touchPoints.delete(touch.identifier);
            }
        });
        
        // Update remaining selections
        this.updateAllSelections();
        this.draw();
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Block all interactions during countdown
        if (this.isCountingDown) {
            return;
        }

        if (this.confirmDialog.isVisible) {
            Object.entries(this.confirmDialog.buttons).forEach(([type, button]) => {
                if (button.bounds &&
                    x >= button.bounds.x &&
                    x <= button.bounds.x + button.bounds.width &&
                    y >= button.bounds.y &&
                    y <= button.bounds.y + button.bounds.height
                ) {
                    if (type === 'yes' && this.confirmDialog.onConfirm) {
                        this.confirmDialog.onConfirm();
                    }
                    this.confirmDialog.isVisible = false;
                    this.draw();
                }
            });
            return;
        }

        // Check if click is on reset button
        if (
            x >= this.resetButton.x &&
            x <= this.resetButton.x + this.resetButton.width &&
            y >= this.resetButton.y &&
            y <= this.resetButton.y + this.resetButton.height
        ) {
            this.showConfirmDialog(
                'Reset current game?',
                () => this.resetCurrentGame()
            );
            return;
        }

        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.selectionStart = pos;
        this.selectionEnd = { ...pos };
        this.clearSelection();
        this.updateSelection();
        this.draw();
        this.audio.play('select');
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Block selection during countdown
        if (this.isCountingDown) {
            return;
        }

        if (this.confirmDialog.isVisible) {
            // Check hover state for dialog buttons
            Object.values(this.confirmDialog.buttons).forEach(button => {
                if (button.bounds) {
                    const wasHovered = button.isHovered;
                    button.isHovered = (
                        x >= button.bounds.x &&
                        x <= button.bounds.x + button.bounds.width &&
                        y >= button.bounds.y &&
                        y <= button.bounds.y + button.bounds.height
                    );
                    if (wasHovered !== button.isHovered) {
                        this.draw(); // Redraw if hover state changed
                    }
                }
            });
            return;
        }

        // Check if mouse is over reset button
        this.resetButton.isHovered = (
            x >= this.resetButton.x &&
            x <= this.resetButton.x + this.resetButton.width &&
            y >= this.resetButton.y &&
            y <= this.resetButton.y + this.resetButton.height
        );

        if (!this.isDrawing) return;
        
        this.selectionEnd = this.getMousePos(e);
        this.updateSelection();
        this.draw();
    }
    
    handleMouseUp(e) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        
        // Check if we have a valid selection
        if (this.currentSum === 10) {
            this.audio.play('match');
            
            // Count selected apples
            let selectedCount = 0;
            
            // Animate and destroy selected cells
            this.grid.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell.selected) {
                        selectedCount++;
                        this.startDestroyAnimation(x, y, cell.value);
                        cell.value = null;
                    }
                });
            });
            
            // Add 1 point per apple
            this.updateScore(selectedCount);
            
            // Check if we need to regenerate the grid
            if (!this.hasValidMoves()) {
                this.regenerateGrid();
            }
        } else if (this.currentSum > 0) {
            this.audio.play('wrong');
        }
        
        // Clear selection
        this.clearSelection();
        this.selectionStart = { x: 0, y: 0 };
        this.selectionEnd = { x: 0, y: 0 };
        this.currentSum = 0;
        
        // Force redraw to clear selection rectangle
        this.draw();
    }
    
    clearSelection() {
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x].selected = false;
            }
        }
    }
    
    updateSelection() {
        this.clearSelection();
        this.currentSum = 0;
        
        const startX = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const endX = Math.max(this.selectionStart.x, this.selectionEnd.x);
        const startY = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const endY = Math.max(this.selectionStart.y, this.selectionEnd.y);
        
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (y >= 0 && y < this.gridHeight && x >= 0 && x < this.gridWidth) {
                    if (this.grid[y][x].value !== null) {
                        this.grid[y][x].selected = true;
                        this.currentSum += this.grid[y][x].value;
                    }
                }
            }
        }
    }
    
    checkSelection() {
        let sum = 0;
        let selectedCells = [];
        
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x].selected && this.grid[y][x].value !== null) {
                    sum += this.grid[y][x].value;
                    selectedCells.push({x, y});
                }
            }
        }
        
        if (sum === 10) {
            this.audio.play('match');
            // Update score once with total number of apples
            this.updateScore(selectedCells.length);
            
            // Animate and destroy selected cells
            selectedCells.forEach(({x, y}) => {
                this.startDestroyAnimation(x, y, this.grid[y][x].value);
                this.grid[y][x].value = null;
            });
            
            // Check if we need to regenerate the grid
            if (!this.hasValidMoves()) {
                this.regenerateGrid();
            }
        } else if (selectedCells.length > 0) {
            this.audio.play('wrong');
        }
        
        this.clearSelection();
    }
    
    hasValidMoves() {
        // Check if there are any remaining apples
        let hasApples = false;
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x].value !== null) {
                    hasApples = true;
                    break;
                }
            }
            if (hasApples) break;
        }
        
        if (!hasApples) return false;
        
        // Check all possible rectangular selections
        for (let startY = 0; startY < this.gridHeight; startY++) {
            for (let startX = 0; startX < this.gridWidth; startX++) {
                if (this.grid[startY][startX].value === null) continue;

                for (let height = 1; height <= 4 && startY + height <= this.gridHeight; height++) {
                    for (let width = 1; width <= 4 && startX + width <= this.gridWidth; width++) {
                        let sum = 0;
                        let hasNonNull = false;

                        // Calculate sum for current rectangle
                        for (let y = startY; y < startY + height; y++) {
                            for (let x = startX; x < startX + width; x++) {
                                if (this.grid[y][x].value !== null) {
                                    sum += this.grid[y][x].value;
                                    hasNonNull = true;
                                }
                            }
                        }

                        if (hasNonNull && sum === 10) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw score display at the top
        const scoreText = `Score: ${this.score}`;
        this.ctx.font = 'bold 24px Arial';
        const scoreWidth = this.ctx.measureText(scoreText).width;
        const scorePadding = 15;
        const scoreHeight = 36;
        const scoreX = (this.canvas.width - (scoreWidth + scorePadding * 2)) / 2;
        const scoreY = 5;

        // Draw semi-transparent background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.beginPath();
        this.ctx.roundRect(
            scoreX, 
            scoreY, 
            scoreWidth + scorePadding * 2,
            scoreHeight,
            8  // border radius
        );
        this.ctx.fill();

        // Draw score text with shadow
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        
        // Draw text shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillText(scoreText, scoreX + scorePadding + 1, scoreY + scoreHeight/2 + 1);
        
        // Draw main text
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(scoreText, scoreX + scorePadding, scoreY + scoreHeight/2);

        // Save context for grid drawing
        this.ctx.save();
        
        // Translate for grid
        const scoreMargin = 40;
        this.ctx.translate(0, scoreMargin);

        // Draw grid and rest of game elements
        // Keep track of cells being animated
        const animatingCells = new Set();
        this.animations.forEach(anim => {
            animatingCells.add(`${anim.x},${anim.y}`);
        });
        
        // Draw grid (skip cells that are being animated)
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const cell = this.grid[y][x];
                if (cell.value !== null && !animatingCells.has(`${x},${y}`)) {
                    this.drawApple(x, y, cell.value, cell.selected, cell.hint);
                }
            }
        }
        
        // Draw animations
        this.animations.forEach(anim => {
            const progress = (performance.now() - anim.startTime) / anim.duration;
            
            if (anim.type === 'fade-out') {
                const alpha = 1 - progress;
                this.drawApple(anim.x, anim.y, anim.value, false, false, 1, alpha);
            } else if (anim.type === 'fade-in') {
                // Use elastic easing for scale
                const scale = this.easeElastic(progress);
                const alpha = Math.min(1, progress * 2); // Fade in faster than the bounce
                this.drawApple(anim.x, anim.y, anim.value, false, false, scale, alpha);
            }
        });
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = 1; // Ensure full opacity for particles
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1; // Reset opacity
        });
        
        // Draw selection rectangles for all active selections
        if (this.activeSelections) { // Add safety check
            this.activeSelections.forEach(selection => {
                const startX = Math.min(selection.start.x, selection.end.x) * this.cellSize;
                const endX = (Math.max(selection.start.x, selection.end.x) + 1) * this.cellSize;
                const startY = Math.min(selection.start.y, selection.end.y) * this.cellSize;
                const endY = (Math.max(selection.start.y, selection.end.y) + 1) * this.cellSize;
                
                this.ctx.fillStyle = selection.sum === 10 ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 255, 0, 0.3)';
                this.ctx.fillRect(startX, startY, endX - startX, endY - startY);
                
                this.ctx.strokeStyle = selection.sum === 10 ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 255, 0, 0.8)';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(startX, startY, endX - startX, endY - startY);
            });
        }

        // Also draw the single mouse selection if active
        if (this.isDrawing) {
            const startX = Math.min(this.selectionStart.x, this.selectionEnd.x) * this.cellSize;
            const endX = (Math.max(this.selectionStart.x, this.selectionEnd.x) + 1) * this.cellSize;
            const startY = Math.min(this.selectionStart.y, this.selectionEnd.y) * this.cellSize;
            const endY = (Math.max(this.selectionStart.y, this.selectionEnd.y) + 1) * this.cellSize;
            
            this.ctx.fillStyle = this.currentSum === 10 ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 255, 0, 0.3)';
            this.ctx.fillRect(startX, startY, endX - startX, endY - startY);
            
            this.ctx.strokeStyle = this.currentSum === 10 ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 255, 0, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(startX, startY, endX - startX, endY - startY);
        }
        
        // Restore context
        this.ctx.restore();
        
        // Draw timer bar at the bottom
        const padding = 2;
        const progress = (this.currentTimeLeft / this.initialTime);
        
        // Draw timer background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, this.canvas.height - this.timerHeight, this.canvas.width, this.timerHeight);
        
        // Draw progress bar
        let barColor = '#4CAF50';
        if (this.currentTimeLeft < 10) {
            barColor = '#f44336';
        } else if (this.currentTimeLeft < 30) {
            barColor = '#ff9800';
        }
        this.ctx.fillStyle = barColor;
        this.ctx.fillRect(
            padding, 
            this.canvas.height - this.timerHeight + padding, 
            (this.canvas.width - padding * 2) * progress, 
            this.timerHeight - padding * 2
        );
        
        // Draw timer text
        const minutes = Math.floor(this.currentTimeLeft / 60);
        const seconds = Math.floor(this.currentTimeLeft % 60);
        const ms = Math.floor((this.currentTimeLeft * 1000) % 1000 / 10);
        const timeText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
        
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Draw text shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillText(timeText, this.canvas.width / 2 + 1, this.canvas.height - this.timerHeight / 2 + 1);
        
        // Draw text
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(timeText, this.canvas.width / 2, this.canvas.height - this.timerHeight / 2);

        // Draw score popups
        if (this.scorePopups) {
            this.scorePopups = this.scorePopups.filter(popup => {
                const progress = (performance.now() - popup.startTime) / popup.duration;
                if (progress >= 1) return false;

                // Move up from the score display
                const y = popup.y - (progress * 30); // Reduced movement distance
                const alpha = 1 - progress; // Fade out

                this.ctx.save();
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.font = 'bold 24px Arial';
                
                // Draw shadow
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.globalAlpha = alpha;
                this.ctx.fillText(`+${popup.points}`, popup.x + 1, y + 1);
                
                // Draw text
                this.ctx.fillStyle = '#4CAF50';
                this.ctx.globalAlpha = alpha;
                this.ctx.fillText(`+${popup.points}`, popup.x, y);
                
                this.ctx.restore();
                return true;
            });
        }

        // If countdown is active, draw the semi-transparent overlay and countdown
        if (this.isCountingDown) {
            // Draw semi-transparent overlay
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Changed from 0.7 to 0.5 for more transparency
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw countdown text
            this.ctx.save();
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Make the countdown text larger and bolder
            this.ctx.font = 'bold 120px Arial';
            
            // Draw text shadow for better visibility
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillText(
                this.countdownValue === 0 ? 'GO!' : this.countdownValue,
                this.canvas.width / 2 + 4,
                this.canvas.height / 2 + 4
            );
            
            // Draw main text with a white stroke for better visibility
            this.ctx.fillStyle = 'white';
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.lineWidth = 3;
            const text = this.countdownValue === 0 ? 'GO!' : this.countdownValue;
            this.ctx.strokeText(text, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
            
            this.ctx.restore();
        }

        // Draw reset button only if not counting down
        if (!this.isCountingDown) {
            this.drawResetButton();
        }

        // Draw confirmation dialog on top if visible
        this.drawConfirmDialog();
    }
    
    drawApple(x, y, value, selected, hint, scale = 1, alpha = 1) {
        const centerX = x * this.cellSize + this.cellSize/2;
        const centerY = y * this.cellSize + this.cellSize/2;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        // Apply global alpha
        this.ctx.globalAlpha = alpha;
        
        // Draw apple image or fallback circle
        if (this.appleImageLoaded) {
            const size = this.cellSize * 0.8 * scale;
            
            if (hint) {
                // Create a temporary canvas for tinting
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = this.appleImage.width;
                tempCanvas.height = this.appleImage.height;
                
                // Draw the original image
                tempCtx.drawImage(this.appleImage, 0, 0);
                
                // Apply lighter green tint
                tempCtx.globalCompositeOperation = 'source-atop';
                tempCtx.fillStyle = '#7FFF00'; // Changed to Chartreuse for brighter green
                tempCtx.globalAlpha = 0.7; // Increased opacity
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                
                // Draw the tinted image
                this.ctx.drawImage(
                    tempCanvas,
                    -size/2,
                    -size/2,
                    size,
                    size
                );
            } else {
                // Draw normal apple
                this.ctx.drawImage(
                    this.appleImage,
                    -size/2,
                    -size/2,
                    size,
                    size
                );
            }
        } else {
            this.ctx.beginPath();
            this.ctx.scale(scale, scale);
            this.ctx.arc(0, 0, this.cellSize * 0.4, 0, Math.PI * 2);
            this.ctx.fillStyle = selected ? '#ff6666' : (hint ? '#7FFF00' : '#ff0000');
            this.ctx.fill();
        }
        
        // Reset transform for text to apply scale separately
        this.ctx.restore();
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(scale, scale);
        
        // Keep alpha for text
        this.ctx.globalAlpha = alpha;
        
        // Draw number
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = `bold ${this.cellSize * 0.4}px Arial`;
        
        // Draw shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillText(value, 2, 2);
        
        // Draw main text (always white)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(value, 0, 0);
        
        this.ctx.restore();
    }
    
    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show the requested page
        document.getElementById(pageId).classList.add('active');
        
        // Call handleResize when game page is shown
        if (pageId === 'game-page') {
            setTimeout(() => {
                this.handleResize();
            }, 100); // Small delay to ensure page transition is complete
        }
    }
    
    resetGame() {
        // Clear the timer interval
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Reset game state
        this.score = 0;
        this.timeLeft = this.initialTime;
        this.grid = this.createGrid();
        
        // Reset tip button texts
        document.getElementById('tipButton').textContent = `Show Tip (${this.tipsLeft} left)`;
        document.getElementById('autoTipButton').textContent = `Auto Solve (${this.tipsLeft} left)`;
        
        // Reset cell size to default
        this.cellSize = this.maxCellSize;
        this.canvas.width = this.gridWidth * this.cellSize;
        this.canvas.height = this.gridHeight * this.cellSize + this.timerHeight;
        
        this.stopAutoSolve();
        
        // Start new game
        this.startGame();
    }
    
    startGame() {
        // Reset game state
        this.score = 0;
        this.grid = this.createGrid();
        
        // Show game page
        this.showPage('game-page');
        
        // Reset timer values
        this.timeLeft = this.initialTime;
        this.msLeft = this.timeLeft * 1000;
        this.currentTimeLeft = this.initialTime;
        this.targetTimeLeft = this.initialTime;
        
        // Start countdown
        this.isCountingDown = true;
        this.countdownValue = 3;
        this.audio.play('countdown');
        
        const countdownInterval = setInterval(() => {
            this.countdownValue--;
            if (this.countdownValue >= 0) {
                if (this.countdownValue > 0) {
                    this.audio.play('countdown');
                } else {
                    this.audio.play('match');
                }
                this.draw();
            }
            if (this.countdownValue < 0) {
                clearInterval(countdownInterval);
                this.isCountingDown = false;
                this.startGameTimer();
                this.draw();
            }
        }, 1000);
        
        // Force initial draw
        this.draw();
    }
    
    // New method to start the game timer
    startGameTimer() {
        // Clear any existing timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.lastUpdate = performance.now();
        this.msLeft = this.timeLeft * 1000;
        
        // Update more frequently for smooth ms display
        this.timerInterval = setInterval(() => {
            const now = performance.now();
            const delta = now - this.lastUpdate;
            this.lastUpdate = now;
            
            this.msLeft = Math.max(0, this.msLeft - delta);
            this.timeLeft = Math.ceil(this.msLeft / 1000);
            this.updateTimer();
        }, 16); // ~60fps update
    }
    
    gameOver() {
        // Clear the timer interval
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.audio.play('gameOver');
        // Update high score if needed
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }
        
        // Update game over screen
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('high-score').textContent = this.highScore;
        
        // Show game over page
        this.showPage('gameover-page');
        
        this.stopAutoSolve();

        if (this.timerAnimationFrame) {
            cancelAnimationFrame(this.timerAnimationFrame);
            this.timerAnimationFrame = null;
        }
    }
    
    showTip() {
        if (this.tipsLeft <= 0) {
            this.showPopup('No tips left!');
            return;
        }
        
        const combination = this.findCombination();
        if (combination) {
            this.tipsLeft--;
            document.getElementById('tipButton').textContent = `Show Tip (${this.tipsLeft} left)`;
            
            // Highlight the combination
            combination.forEach(({x, y}) => {
                this.grid[y][x].hint = true;
            });
            
            // Draw the hint
            this.draw();
            
            // Clear the hint after 2 seconds
            if (this.tipTimeout) clearTimeout(this.tipTimeout);
            this.tipTimeout = setTimeout(() => {
                combination.forEach(({x, y}) => {
                    this.grid[y][x].hint = false;
                });
                this.draw();
            }, 2000);
        } else {
            this.showPopup('No valid combinations found!');
        }
    }
    
    findCombination(gridToUse = null) {
        const grid = gridToUse || this.grid;
        
        // Check rectangular areas
        for (let startY = 0; startY < this.gridHeight; startY++) {
            for (let startX = 0; startX < this.gridWidth; startX++) {
                // Skip if starting cell is empty
                if (grid[startY][startX].value === null) continue;
                
                // Check rectangles up to 4x4 size
                for (let height = 1; height <= 4 && startY + height <= this.gridHeight; height++) {
                    for (let width = 1; width <= 4 && startX + width <= this.gridWidth; width++) {
                        let sum = 0;
                        const combination = [];
                        
                        // Calculate sum for current rectangle
                        for (let y = startY; y < startY + height; y++) {
                            for (let x = startX; x < startX + width; x++) {
                                if (grid[y][x].value !== null) {
                                    sum += grid[y][x].value;
                                    combination.push({x, y});
                                }
                            }
                        }
                        
                        // Return first found valid combination
                        if (sum === 10) {
                            return combination;
                        }
                    }
                }
            }
        }
        
        return null;
    }
    
    startDestroyAnimation(x, y, value) {
        const startTime = performance.now();
        const duration = 400;
        
        // Create particles
        const numParticles = 8;
        const particles = [];
        
        // Get current fruit color
        const fruitColor = this.fruitColors[this.fruitType];
        
        // Calculate apple center position
        const appleCenterX = x * this.cellSize + this.cellSize/2;
        const appleCenterY = y * this.cellSize + this.cellSize/2;
        
        for (let i = 0; i < numParticles; i++) {
            const angle = (i / numParticles) * Math.PI * 2;
            const speed = 4;
            particles.push({
                x: appleCenterX,
                y: appleCenterY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                gravity: 0.2,
                size: 5,
                startTime,
                duration,
                color: fruitColor
            });
        }
        
        this.particles.push(...particles);
        
        // Add animation
        this.animations.push({
            x, y, value,
            startTime,
            duration,
            type: 'pop-out',
            update: (currentTime) => {
                const progress = (currentTime - startTime) / duration;
                return progress < 1;
            }
        });
        
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animationLoop();
        }
    }
    
    animationLoop() {
        const currentTime = performance.now();
        
        // Update animations
        this.animations = this.animations.filter(anim => {
            const progress = (currentTime - anim.startTime) / anim.duration;
            if (progress >= 1) {
                if (anim.type === 'fade-in') {
                    this.grid[anim.y][anim.x].value = anim.value;
                }
                return false;
            }
            return true;
        });
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            const progress = (currentTime - particle.startTime) / particle.duration;
            if (progress >= 1) return false;
            
            // Update velocity with gravity
            particle.vy += particle.gravity || 0.2;
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Shrink size
            particle.size *= 0.97;
            
            return particle.size > 0.5;
        });
        
        this.draw();
        
        if (this.animations.length > 0 || this.particles.length > 0) {
            requestAnimationFrame(() => this.animationLoop());
        } else {
            this.isAnimating = false;
        }
    }
    
    showPopup(message, autoDismiss = false) {
        document.getElementById('popup-message').textContent = message;
        const popup = document.getElementById('popup');
        const closeButton = document.getElementById('popup-close');
        
        // Hide close button for auto-dismiss popups
        closeButton.style.display = autoDismiss ? 'none' : 'block';
        
        popup.classList.add('active');
        
        if (autoDismiss) {
            setTimeout(() => {
                this.hidePopup();
            }, 1500); // Auto dismiss after 1.5 seconds
        }
    }
    
    hidePopup() {
        document.getElementById('popup').classList.remove('active');
    }
    
    regenerateGrid() {
        if (this.hasValidMoves()) {
            return;
        }

        // Store old grid values but don't clear the grid yet
        const oldGrid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            oldGrid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                oldGrid[y][x] = this.grid[y][x].value;
                // Don't clear the grid values yet
            }
        }

        // Clear any ongoing animations
        this.animations = [];
        if (this.tipTimeout) {
            clearTimeout(this.tipTimeout);
            this.tipTimeout = null;
        }

        // Calculate center point for ripple
        const centerX = Math.floor(this.gridWidth / 2);
        const centerY = Math.floor(this.gridHeight / 2);

        // Calculate max distance for delay normalization
        const maxDistance = Math.sqrt(
            Math.pow(Math.max(centerX, this.gridWidth - centerX), 2) +
            Math.pow(Math.max(centerY, this.gridHeight - centerY), 2)
        );

        // Generate new grid values but don't set them yet
        const generateValidGrid = () => {
            const newGrid = [];
            for (let y = 0; y < this.gridHeight; y++) {
                newGrid[y] = [];
                for (let x = 0; x < this.gridWidth; x++) {
                    newGrid[y][x] = {
                        value: Math.floor(Math.random() * 9) + 1,
                        selected: false,
                        hint: false
                    };
                }
            }
            return this.findCombination(newGrid) !== null ? newGrid : generateValidGrid();
        };

        const newGrid = generateValidGrid();

        // Start fade out animations with ripple effect
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (oldGrid[y][x] !== null) {
                    const distance = Math.sqrt(
                        Math.pow(x - centerX, 2) + 
                        Math.pow(y - centerY, 2)
                    );
                    const delay = (distance / maxDistance) * 200;
                    
                    // Set grid value to null only when starting the fade-out animation
                    setTimeout(() => {
                        const value = this.grid[y][x].value; // Store the current value
                        this.grid[y][x].value = null; // Clear the grid value
                        this.startFadeOutAnimation(x, y, value); // Use the stored value
                    }, delay);
                }
            }
        }

        // After fade out, start fade in animations
        setTimeout(() => {
            for (let y = 0; y < this.gridHeight; y++) {
                for (let x = 0; x < this.gridWidth; x++) {
                    const distance = Math.sqrt(
                        Math.pow(x - centerX, 2) + 
                        Math.pow(y - centerY, 2)
                    );
                    const delay = (distance / maxDistance) * 300;
                    
                    setTimeout(() => {
                        this.grid[y][x].value = newGrid[y][x].value;
                        this.startFadeInAnimation(x, y, newGrid[y][x].value);
                    }, delay);
                }
            }
        }, 500);
    }
    
    startFadeOutAnimation(x, y, value) {
        const startTime = performance.now();
        const duration = 300;
        
        this.animations.push({
            x, y, value,
            startTime,
            duration,
            type: 'fade-out'
        });
        
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animationLoop();
        }
    }
    
    startFadeInAnimation(x, y, value) {
        const startTime = performance.now();
        const duration = 1200; // Increased duration for elastic effect
        
        // Start with null value
        this.grid[y][x].value = null;
        
        this.animations.push({
            x, y, value,
            startTime,
            duration,
            type: 'fade-in',
            onComplete: () => {
                // Set the actual value when animation completes
                this.grid[y][x].value = value;
            }
        });
        
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animationLoop();
        }
    }
    
    showAutoTip() {
        if (this.tipsLeft <= 0) {
            this.showPopup('No tips left!');
            return;
        }
        
        const combination = this.findCombination();
        if (combination) {
            this.tipsLeft--;
            document.getElementById('tipButton').textContent = `Show Tip (${this.tipsLeft} left)`;
            document.getElementById('autoTipButton').textContent = `Auto Solve (${this.tipsLeft} left)`;
            
            // Highlight the combination
            combination.forEach(({x, y}) => {
                this.grid[y][x].hint = true;
            });
            
            this.draw();
            
            // Auto destroy after 0.5 seconds
            setTimeout(() => {
                // Calculate sum to verify it's still valid
                let sum = 0;
                let validCount = 0;
                combination.forEach(({x, y}) => {
                    if (this.grid[y][x].value !== null) {
                        sum += this.grid[y][x].value;
                        validCount++;
                    }
                });
                
                if (sum === 10) {
                    // Add 1 point per apple
                    this.updateScore(validCount);
                    
                    // Destroy the apples
                    combination.forEach(({x, y}) => {
                        this.startDestroyAnimation(x, y, this.grid[y][x].value);
                        this.grid[y][x].value = null;
                        this.grid[y][x].hint = false;
                    });
                    
                    // Check if we need to regenerate the grid
                    if (!this.hasValidMoves()) {
                        this.regenerateGrid();
                    }
                } else {
                    // Just clear hints if combination is no longer valid
                    combination.forEach(({x, y}) => {
                        this.grid[y][x].hint = false;
                    });
                }
                
                this.draw();
            }, 500);
        } else {
            this.showPopup('No valid combinations found!');
        }
    }
    
    toggleContinuousAutoSolve() {
        if (this.isAutoSolving) {
            this.stopAutoSolve();
        } else {
            this.startAutoSolve();
        }
    }
    
    startAutoSolve() {
        if (this.tipsLeft <= 0) {
            this.showPopup('No tips left!');
            return;
        }
        
        this.isAutoSolving = true;
        document.getElementById('continuousAutoButton').textContent = 'Stop Auto';
        document.getElementById('continuousAutoButton').style.backgroundColor = '#f44336';
        
        // Start the auto-solve loop immediately
        this.performAutoSolve();
    }
    
    stopAutoSolve() {
        this.isAutoSolving = false;
        if (this.autoSolveInterval) {
            clearTimeout(this.autoSolveInterval);
            this.autoSolveInterval = null;
        }
        document.getElementById('continuousAutoButton').textContent = 'Auto Run';
        document.getElementById('continuousAutoButton').style.backgroundColor = '#9C27B0';
    }
    
    performAutoSolve() {
        if (!this.isAutoSolving) return;
        
        // Find all possible combinations first
        let combinations = [];
        let tempGrid = JSON.parse(JSON.stringify(this.grid));
        
        let combination = this.findCombination(tempGrid);
        while (combination) {
            combinations.push(combination);
            // Mark these positions as used in tempGrid
            combination.forEach(({x, y}) => {
                tempGrid[y][x].value = null;
            });
            // Find next combination using tempGrid
            combination = this.findCombination(tempGrid);
        }
        
        if (combinations.length > 0) {
            // Process combinations one by one with delay
            const processCombination = (index) => {
                if (!this.isAutoSolving || index >= combinations.length) {
                    // If no more combinations, check if we need to regenerate
                    if (!this.hasValidMoves()) {
                        this.regenerateGrid();
                        setTimeout(() => {
                            if (this.isAutoSolving) {
                                this.performAutoSolve();
                            }
                        }, 1000);
                    } else {
                        // Start next round of combinations
                        this.performAutoSolve();
                    }
                    return;
                }
                
                const currentCombination = combinations[index];
                this.tipsLeft--;
                document.getElementById('tipButton').textContent = `Show Tip (${this.tipsLeft} left)`;
                document.getElementById('autoTipButton').textContent = `Auto Solve (${this.tipsLeft} left)`;
                
                // Update score once with total number of apples
                this.updateScore(currentCombination.length);
                
                // Destroy the apples
                currentCombination.forEach(({x, y}) => {
                    this.startDestroyAnimation(x, y, this.grid[y][x].value);
                    this.grid[y][x].value = null;
                });
                
                // Process next combination after delay
                this.autoSolveInterval = setTimeout(() => {
                    processCombination(index + 1);
                }, 300);
            };
            
            // Start processing combinations
            processCombination(0);
            
        } else {
            // No combinations found, regenerate grid
            this.regenerateGrid();
            setTimeout(() => {
                if (this.isAutoSolving) {
                    this.performAutoSolve();
                }
            }, 1000);
        }
    }
    
    handleResize() {
        // Get the container dimensions
        const container = document.querySelector('.canvas-container');
        
        // Get viewport dimensions
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Calculate the total grid height including timer and score area
        const scoreAndTimerSpace = this.timerHeight + 40; // 40px for score
        
        // Calculate the maximum cell size that fits the viewport
        const maxCellByWidth = Math.floor(viewportWidth / this.gridWidth);
        const maxCellByHeight = Math.floor((viewportHeight - scoreAndTimerSpace) / this.gridHeight);
        
        // Choose the cell size that maximizes screen usage
        let newCellSize = Math.min(
            this.maxCellSize * 3, // Increased maximum size even more
            Math.max(
                this.minCellSize,
                Math.min(maxCellByWidth, maxCellByHeight) // Use Math.min to maintain aspect ratio
            )
        );
        
        // Update dimensions
        this.cellSize = newCellSize;
        
        // Calculate canvas dimensions to fill viewport
        const canvasWidth = this.gridWidth * this.cellSize;
        const canvasHeight = (this.gridHeight * this.cellSize) + scoreAndTimerSpace;
        
        // Update canvas size
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        // Update container style to fill viewport
        container.style.width = '100%';
        container.style.height = '100%';
        
        // Update reset button position
        this.resetButton.x = this.canvas.width - this.resetButton.width - 10;
        this.resetButton.y = 20;
        
        // Always redraw
        this.draw();
    }
    
    updateTimer(deltaTime) {
        if (this.msLeft > 0) {
            this.targetTimeLeft = this.msLeft / 1000;
            
            // Start timer animation if not already running
            if (!this.timerAnimationFrame) {
                this.animateTimer();
            }
        }
        
        if (this.msLeft <= 0) {
            this.gameOver();
        }
    }
    
    animateTimer() {
        const now = performance.now();
        const deltaTime = (now - this.lastTimerUpdate) / 1000;
        this.lastTimerUpdate = now;
        
        // Smoothly interpolate current time towards target time
        const smoothFactor = 0.3;
        this.currentTimeLeft += (this.targetTimeLeft - this.currentTimeLeft) * smoothFactor;
        
        // Force redraw with current interpolated time
        this.draw();
        
        // Continue animation
        this.timerAnimationFrame = requestAnimationFrame(() => this.animateTimer());
    }
    
    updateScore(points) {
        this.score += points;
        
        // Create and animate score popup near the score display
        const startTime = performance.now();
        const duration = 800;
        
        // Calculate position near the score display
        const scoreText = `Score: ${this.score}`;
        this.ctx.font = 'bold 24px Arial';
        const scoreWidth = this.ctx.measureText(scoreText).width;
        const scorePadding = 15;
        const scoreHeight = 36;
        const scoreX = (this.canvas.width - (scoreWidth + scorePadding * 2)) / 2;
        const scoreY = 5;
        
        // Position popup near the score display
        const popupAnimation = {
            points,
            startTime,
            duration,
            x: this.canvas.width / 2,  // Center horizontally
            y: scoreY + scoreHeight + 10  // Just below the score display
        };
        
        this.scorePopups = this.scorePopups || [];
        this.scorePopups.push(popupAnimation);
        
        // Start animation loop if not already running
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animationLoop();
        }
    }
    
    clearHighScore() {
        this.highScore = 0;
        localStorage.removeItem('highScore');
        document.getElementById('high-score').textContent = '0';
        
        // Show confirmation popup
        this.showPopup('High score cleared!', true);
    }
    
    initFruitSelector() {
        const buttons = document.querySelectorAll('.fruit-button');
        
        // First, remove active class from all buttons
        buttons.forEach(button => {
            button.classList.remove('active');
        });
        
        // Find and activate the current fruit button
        const currentFruitButton = Array.from(buttons).find(button => button.dataset.fruit === this.fruitType);
        if (currentFruitButton) {
            currentFruitButton.classList.add('active');
        } else {
            // If no matching button found, default to apple
            const appleButton = Array.from(buttons).find(button => button.dataset.fruit === 'apple');
            if (appleButton) {
                appleButton.classList.add('active');
                this.fruitType = 'apple';
                localStorage.setItem('fruitType', 'apple');
            }
        }
        
        // Add click handlers
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                buttons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                button.classList.add('active');
                
                // Update fruit type
                this.fruitType = button.dataset.fruit;
                localStorage.setItem('fruitType', this.fruitType);
                
                // Load new fruit image
                this.loadFruitImage(this.fruitType);
            });
        });
    }
    
    loadFruitImage(type) {
        this.appleImage = new Image();
        this.appleImageLoaded = false;
        
        this.appleImage.onload = () => {
            this.appleImageLoaded = true;
            this.draw();
        };
        
        this.appleImage.onerror = () => {
            console.error('Failed to load fruit image');
            this.appleImageLoaded = false;
            this.draw();
        };
        
        this.appleImage.src = this.fruitImages[type];
    }
    
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const themeButton = document.getElementById('themeButton');
        themeButton.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // Touch event handlers
    handleTouchStart(e) {
        e.preventDefault();
        
        if (this.isCountingDown) return;

        // Handle each new touch
        Array.from(e.changedTouches).forEach(touch => {
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            // Check for UI interactions first
            if (this.handleUITouchInteraction(x, y)) {
                return;
            }

            // Start a new selection for this touch
            const pos = this.getMousePos(touch);
            this.activeSelections.set(touch.identifier, {
                start: pos,
                end: { ...pos },
                sum: 0,
                selectedCells: new Set()
            });
            
            // Store touch point
            this.touchPoints.set(touch.identifier, { x, y });
            
            this.audio.play('select');
            this.updateAllSelections();
            this.draw();
        });
    }

    handleTouchMove(e) {
        e.preventDefault();
        
        // Update each changed touch
        Array.from(e.changedTouches).forEach(touch => {
            const selection = this.activeSelections.get(touch.identifier);
            if (selection) {
                selection.end = this.getMousePos(touch);
                this.updateAllSelections();
                this.draw();
            }
        });
    }

    handleTouchEnd(e) {
        e.preventDefault();
        
        // Process each ended touch
        Array.from(e.changedTouches).forEach(touch => {
            const selection = this.activeSelections.get(touch.identifier);
            if (selection) {
                // Process the selection if it sums to 10
                if (selection.sum === 10) {
                    this.audio.play('match');
                    let selectedCount = 0;
                    
                    // Process selected cells
                    selection.selectedCells.forEach(cellKey => {
                        const [x, y] = cellKey.split(',').map(Number);
                        if (this.grid[y][x].selected) {
                            selectedCount++;
                            this.startDestroyAnimation(x, y, this.grid[y][x].value);
                            this.grid[y][x].value = null;
                        }
                    });
                    
                    this.updateScore(selectedCount);
                    
                    if (!this.hasValidMoves()) {
                        this.regenerateGrid();
                    }
                } else if (selection.sum > 0) {
                    this.audio.play('wrong');
                }
                
                // Remove this selection
                this.activeSelections.delete(touch.identifier);
                this.touchPoints.delete(touch.identifier);
            }
        });
        
        // Update remaining selections
        this.updateAllSelections();
        this.draw();
    }

    // Update the resetCurrentGame method
    resetCurrentGame() {
        // Stop auto-solve if it's running
        this.stopAutoSolve();
        
        // Reset the grid
        this.grid = this.createGrid();
        
        // Reset the score for current game only
        this.score = 0;
        
        // Clear any ongoing timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Reset timer values
        this.timeLeft = this.initialTime;
        this.msLeft = this.timeLeft * 1000;
        
        // Start countdown
        this.isCountingDown = true;
        this.countdownValue = 3;
        this.audio.play('countdown');
        
        const countdownInterval = setInterval(() => {
            this.countdownValue--;
            if (this.countdownValue >= 0) {
                if (this.countdownValue > 0) {
                    this.audio.play('countdown');
                } else {
                    this.audio.play('match');
                }
                this.draw();
            }
            if (this.countdownValue < 0) {
                clearInterval(countdownInterval);
                this.isCountingDown = false;
                this.startGameTimer();
                this.draw();
            }
        }, 1000);
        
        // Redraw the game
        this.draw();
    }

    // Add easeOutBack function
    easeOutBack(x) {
        const c1 = 3; // Increased bounce amount
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }

    // Add this new easing function
    easeElastic(x) {
        const c4 = (2 * Math.PI) / 3;
        
        if (x === 0) return 0;
        if (x === 1) return 1;
        
        return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }

    // Add new method to draw the reset button
    drawResetButton() {
        // Position button in top right corner
        this.resetButton.x = this.canvas.width - this.resetButton.width - 10;

        this.ctx.save();
        
        // Draw button background
        this.ctx.beginPath();
        this.ctx.roundRect(
            this.resetButton.x,
            this.resetButton.y,
            this.resetButton.width,
            this.resetButton.height,
            5 // border radius
        );

        // Change color based on hover state
        if (this.resetButton.isHovered) {
            this.ctx.fillStyle = '#e65100'; // darker orange for hover
        } else {
            this.ctx.fillStyle = '#ff9800'; // normal orange
        }
        this.ctx.fill();

        // Draw button text
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Draw text shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillText(
            this.resetButton.text,
            this.resetButton.x + this.resetButton.width/2 + 1,
            this.resetButton.y + this.resetButton.height/2 + 1
        );

        // Draw main text
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(
            this.resetButton.text,
            this.resetButton.x + this.resetButton.width/2,
            this.resetButton.y + this.resetButton.height/2
        );

        this.ctx.restore();
    }

    // Add new method to draw confirmation dialog
    drawConfirmDialog() {
        if (!this.confirmDialog.isVisible) return;

        // Save context
        this.ctx.save();

        // Draw semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate dialog position
        const x = (this.canvas.width - this.confirmDialog.width) / 2;
        const y = (this.canvas.height - this.confirmDialog.height) / 2;

        // Draw dialog background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; // Darker background
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; // Light border
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, this.confirmDialog.width, this.confirmDialog.height, 10);
        this.ctx.fill();
        this.ctx.stroke();

        // Draw message in white
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillStyle = 'white'; // Changed to white
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            this.confirmDialog.message,
            x + this.confirmDialog.width / 2,
            y + 50
        );

        // Draw buttons
        const buttonWidth = 100;
        const buttonHeight = 40;
        const buttonGap = 20;
        const buttonsY = y + this.confirmDialog.height - 60;

        // Yes button
        const yesX = x + (this.confirmDialog.width - buttonWidth * 2 - buttonGap) / 2;
        this.drawDialogButton(
            'yes',
            yesX,
            buttonsY,
            buttonWidth,
            buttonHeight,
            '#4CAF50',
            '#45a049'
        );

        // No button
        const noX = yesX + buttonWidth + buttonGap;
        this.drawDialogButton(
            'no',
            noX,
            buttonsY,
            buttonWidth,
            buttonHeight,
            '#f44336',
            '#d32f2f'
        );

        this.ctx.restore();
    }

    drawDialogButton(type, x, y, width, height, normalColor, hoverColor) {
        const button = this.confirmDialog.buttons[type];
        
        // Draw button background
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, 5);
        this.ctx.fillStyle = button.isHovered ? hoverColor : normalColor;
        this.ctx.fill();

        // Draw button text
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(button.text, x + width / 2, y + height / 2);

        // Store button bounds for hit detection
        button.bounds = { x, y, width, height };
    }

    // Add method to show confirmation dialog
    showConfirmDialog(message, onConfirm) {
        this.confirmDialog.isVisible = true;
        this.confirmDialog.message = message;
        this.confirmDialog.onConfirm = onConfirm;
        this.draw();
    }

    // Add new helper methods
    updateAllSelections() {
        // Clear all selections first
        this.clearSelection();
        
        // Process each active selection
        this.activeSelections.forEach(selection => {
            const startX = Math.min(selection.start.x, selection.end.x);
            const endX = Math.max(selection.start.x, selection.end.x);
            const startY = Math.min(selection.start.y, selection.end.y);
            const endY = Math.max(selection.start.y, selection.end.y);
            
            selection.sum = 0;
            selection.selectedCells.clear();
            
            // Mark cells in this selection
            for (let y = startY; y <= endY; y++) {
                for (let x = startX; x <= endX; x++) {
                    if (y >= 0 && y < this.gridHeight && x >= 0 && x < this.gridWidth) {
                        if (this.grid[y][x].value !== null) {
                            this.grid[y][x].selected = true;
                            selection.sum += this.grid[y][x].value;
                            selection.selectedCells.add(`${x},${y}`);
                        }
                    }
                }
            }
        });
    }

    handleUITouchInteraction(x, y) {
        // Handle confirmation dialog
        if (this.confirmDialog.isVisible) {
            Object.entries(this.confirmDialog.buttons).forEach(([type, button]) => {
                if (button.bounds &&
                    x >= button.bounds.x &&
                    x <= button.bounds.x + button.bounds.width &&
                    y >= button.bounds.y &&
                    y <= button.bounds.y + button.bounds.height
                ) {
                    if (type === 'yes' && this.confirmDialog.onConfirm) {
                        this.confirmDialog.onConfirm();
                    }
                    this.confirmDialog.isVisible = false;
                    this.draw();
                }
            });
            return true;
        }

        // Handle reset button
        if (
            x >= this.resetButton.x &&
            x <= this.resetButton.x + this.resetButton.width &&
            y >= this.resetButton.y &&
            y <= this.resetButton.y + this.resetButton.height
        ) {
            this.showConfirmDialog(
                'Reset current game?',
                () => this.resetCurrentGame()
            );
            return true;
        }

        return false;
    }
}

class AudioManager {
    constructor() {
        // Create audio pools for each sound type
        this.audioPool = {
            select: this.createAudioPool('sounds/select.wav', 3),
            match: this.createAudioPool('sounds/match.wav', 3),
            wrong: this.createAudioPool('sounds/wrong.wav', 3),
            countdown: this.createAudioPool('sounds/countdown.mp3', 3),
            gameOver: this.createAudioPool('sounds/gameover.wav', 2)
        };
        
        // Set default volume for all sounds
        Object.values(this.audioPool).forEach(pool => {
            pool.forEach(audio => {
                audio.volume = 0.5;
            });
        });
    }
    
    createAudioPool(src, size) {
        return Array.from({ length: size }, () => {
            const audio = new Audio(src);
            audio.load();
            return audio;
        });
    }
    
    play(soundName) {
        if (!this.audioPool[soundName]) return;
        
        // Find an audio instance that's not playing
        const audioPool = this.audioPool[soundName];
        const availableAudio = audioPool.find(audio => audio.paused || audio.ended);
        
        if (availableAudio) {
            availableAudio.currentTime = 0;
            availableAudio.play().catch(e => console.log('Sound play prevented:', e));
        } else {
            // If all instances are playing, create a new temporary instance
            const tempAudio = new Audio(audioPool[0].src);
            tempAudio.volume = 0.5;
            tempAudio.play().catch(e => console.log('Sound play prevented:', e));
        }
    }
}

// Initialize game when window loads
window.addEventListener('load', () => {
    new AppleGame();
}); 