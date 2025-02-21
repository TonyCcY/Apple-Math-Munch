// Initialize your game here
window.addEventListener('load', () => {
    console.log('Game initialized');
    // Add your game logic here
});

class AppleGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.timeLeft = 60*3;
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
        this.cellSize = this.maxCellSize; // Start with maximum size
        
        // Set canvas size
        this.canvas.width = this.gridWidth * this.cellSize;
        this.canvas.height = this.gridHeight * this.cellSize;
        
        // Initialize grid
        this.grid = this.createGrid();
        
        // Bind events
        this.bindEvents();
        
        // Initialize high score from localStorage
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
        
        // Add page navigation handlers
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('playAgainButton').addEventListener('click', () => this.resetGame());
        
        // Show start page initially
        this.showPage('start-page');
        
        // Add tip button handler
        document.getElementById('tipButton').addEventListener('click', () => this.showTip());
        
        this.animations = [];
        this.particles = [];  // Add this for particle effects
        
        // Add popup handler
        document.getElementById('popup-close').addEventListener('click', () => this.hidePopup());
        
        // Add auto tip button handler
        document.getElementById('autoTipButton').addEventListener('click', () => this.showAutoTip());
        
        this.fallingApples = []; // Add this for falling apple animations
        
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
            cherry: 'images/cherry.svg',
            grape: 'images/grape.svg'
        };
        
        // Initialize fruit selector
        this.initFruitSelector();
        
        // Load current fruit image
        this.loadFruitImage(this.fruitType);
        
        // Add touch event handling
        this.bindTouchEvents();
        
        // Add resize handler
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
        
        // Add timer progress elements
        this.timerProgress = document.querySelector('.timer-progress');
        this.initialTime = 60 * 3; // 3 minutes
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
            document.getElementById('debug-controls').style.display = 'flex';
            
            // Add debug event listeners
            document.getElementById('tipButton').addEventListener('click', () => this.showTip());
            document.getElementById('autoTipButton').addEventListener('click', () => this.showAutoTip());
            document.getElementById('continuousAutoButton').addEventListener('click', () => this.toggleContinuousAutoSolve());
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
            cherry: '#D32F2F',
            grape: '#9C27B0'
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
            document.getElementById('score').textContent = '0';
        });

        // Add touch event listeners
        this.canvas.addEventListener('touchstart', this.handleTouchStart, false);
        this.canvas.addEventListener('touchmove', this.handleTouchMove, false);
        this.canvas.addEventListener('touchend', this.handleTouchEnd, false);
        this.canvas.addEventListener('touchcancel', this.handleTouchEnd, false);

        // Touch event handlers
        this.touchPoints = {};

        // Add reset button handler
        document.getElementById('resetButton').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the current game? Your progress will be lost.')) {
                this.resetCurrentGame();
            }
        });
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
                this.isDrawing = false;
                this.clearSelection();
                this.draw();
            }
        });
        
        // Optional: handle mouse leaving the window
        window.addEventListener('blur', () => {
            if (this.isDrawing) {
                this.isDrawing = false;
                this.clearSelection();
                this.draw();
            }
        });
    }
    
    bindTouchEvents() {
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleMouseDown(touch);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleMouseMove(touch);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleMouseUp(e);
        });
        
        this.canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.isDrawing = false;
            this.clearSelection();
            this.draw();
        });
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Get the touch/mouse coordinates relative to the canvas
        const clientX = e.clientX || e.pageX || e.touches[0].clientX;
        const clientY = e.clientY || e.pageY || e.touches[0].clientY;
        
        // Calculate the scale of the canvas
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        // Get position within the canvas accounting for scaling
        const canvasX = (clientX - rect.left) * scaleX;
        const canvasY = (clientY - rect.top) * scaleY;
        
        // Convert to grid coordinates
        return {
            x: Math.floor(canvasX / this.cellSize),
            y: Math.floor(canvasY / this.cellSize)
        };
    }
    
    handleMouseDown(e) {
        this.isDrawing = true;
        this.selectionStart = this.getMousePos(e);
        this.clearSelection();
        this.audio.play('select');
    }
    
    handleMouseMove(e) {
        if (!this.isDrawing) return;
        
        this.selectionEnd = this.getMousePos(e);
        this.updateSelection();
        this.draw();
    }
    
    handleMouseUp(e) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        this.checkSelection();
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
        
        // Check rectangular areas
        for (let startY = 0; startY < this.gridHeight; startY++) {
            for (let startX = 0; startX < this.gridWidth; startX++) {
                // Skip if starting cell is empty
                if (this.grid[startY][startX].value === null) continue;
                
                // Check rectangles up to 4x4 size
                for (let height = 1; height <= 4 && startY + height <= this.gridHeight; height++) {
                    for (let width = 1; width <= 4 && startX + width <= this.gridWidth; width++) {
                        let sum = 0;
                        
                        // Calculate sum for current rectangle
                        for (let y = startY; y < startY + height; y++) {
                            for (let x = startX; x < startX + width; x++) {
                                if (this.grid[y][x].value !== null) {
                                    sum += this.grid[y][x].value;
                                    if (sum > 10) break; // Optimization: skip if sum exceeds 10
                                }
                            }
                            if (sum > 10) break;
                        }
                        
                        if (sum === 10) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }
    
    draw() {
        // Clear only the canvas area
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const cell = this.grid[y][x];
                
                // Skip drawing if cell is empty
                if (cell.value === null) continue;
                
                this.drawApple(x, y, cell.value, cell.selected, cell.hint);
            }
        }
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = 1; // Ensure full opacity for particles
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1; // Reset opacity
        });
        
        // Draw selection rectangle if currently drawing
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
    }
    
    drawApple(x, y, value, selected, hint, scale = 1, alpha = 1) {
        const centerX = x * this.cellSize + this.cellSize/2;
        const centerY = y * this.cellSize + this.cellSize/2;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(scale, scale);
        this.ctx.globalAlpha = alpha;
        
        // Draw apple image or fallback circle
        if (this.appleImageLoaded) {
            const size = this.cellSize * 0.8; // Slightly smaller than cell
            this.ctx.drawImage(
                this.appleImage,
                -size/2,
                -size/2,
                size,
                size
            );
        } else {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.cellSize * 0.4, 0, Math.PI * 2);
            this.ctx.fillStyle = selected ? '#ff6666' : (hint ? '#ffff00' : '#ff0000');
            this.ctx.fill();
        }
        
        // Draw number with drop shadow
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = `bold ${this.cellSize * 0.4}px Arial`;
        
        // Draw shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillText(value, 2, 2); // Offset for shadow
        
        // Draw main text
        this.ctx.fillStyle = selected ? '#ffffff' : (hint ? '#000000' : '#ffffff');
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
        document.getElementById('score').textContent = '0';
        
        // Reset tip button texts
        document.getElementById('tipButton').textContent = `Show Tip (${this.tipsLeft} left)`;
        document.getElementById('autoTipButton').textContent = `Auto Solve (${this.tipsLeft} left)`;
        
        // Reset cell size to default
        this.cellSize = this.maxCellSize;
        this.canvas.width = this.gridWidth * this.cellSize;
        this.canvas.height = this.gridHeight * this.cellSize;
        
        this.stopAutoSolve();
        
        // Start new game
        this.startGame();
    }
    
    startGame() {
        this.showPage('game-page');
        
        // Update initial timer display with padded minutes
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        document.getElementById('timer').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:00`;
        
        // Reset progress bar
        this.timerProgress.style.width = '100%';
        this.timerProgress.style.backgroundColor = '#4CAF50';
        
        this.draw();
        
        // Create and show countdown overlay
        const countdownOverlay = document.createElement('div');
        countdownOverlay.className = 'countdown-overlay';
        const countdownText = document.createElement('div');
        countdownText.className = 'countdown-text';
        countdownOverlay.appendChild(countdownText);
        document.getElementById('game-page').appendChild(countdownOverlay);
        
        // Start countdown
        let count = 3;
        countdownText.textContent = count;
        this.audio.play('countdown'); // Play initial countdown sound
        
        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownText.textContent = count;
                this.audio.play('countdown'); // Play countdown sound for each number
            } else if (count === 0) {
                countdownText.textContent = 'GO!';
                this.audio.play('match'); // Play a different sound for GO!
                setTimeout(() => {
                    countdownOverlay.remove();
                    clearInterval(countdownInterval);
                    this.startGameTimer();
                }, 500); // Give a little time to see "GO!"
            }
        }, 1000);
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
            scale: 1,
            alpha: 1
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
            const progress = Math.min(1, (currentTime - anim.startTime) / anim.duration);
            anim.scale = 1 + progress * 0.3;
            anim.alpha = 1 - progress;
            return progress < 1;
        });
        
        // Update particles with gravity
        this.particles = this.particles.filter(particle => {
            const progress = (currentTime - particle.startTime) / particle.duration;
            if (progress >= 1) return false;
            
            // Update velocity with gravity
            particle.vy += particle.gravity;
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Shrink size
            particle.size *= 0.97;
            
            // Add fade out effect with original color
            const [r, g, b] = this.hexToRgb(particle.color);
            particle.color = `rgba(${r}, ${g}, ${b}, ${1 - progress})`;
            
            return particle.size > 0.5;
        });
        
        this.draw();
        
        if (this.animations.length > 0 || this.particles.length > 0) {
            requestAnimationFrame(() => this.animationLoop());
        } else {
            this.isAnimating = false;
        }
    }
    
    // Helper function to convert hex color to RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [255, 0, 0]; // Default to red if conversion fails
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
        // Store old grid values for pop-out animation
        const oldGrid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            oldGrid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                oldGrid[y][x] = this.grid[y][x].value;
                // Clear the grid position
                this.grid[y][x] = {
                    value: null,
                    selected: false,
                    hint: false
                };
            }
        }
        
        // Clear any ongoing animations and timeouts
        this.animations = [];
        this.particles = [];
        if (this.tipTimeout) {
            clearTimeout(this.tipTimeout);
            this.tipTimeout = null;
        }
        
        // Start pop-out animations for all old apples
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (oldGrid[y][x] !== null) {
                    this.startPopOutAnimation(x, y, oldGrid[y][x]);
                }
            }
        }
        
        // After pop-out animation, start pop-in animation
        setTimeout(() => {
            // Generate new values and start pop-in animations
            for (let y = 0; y < this.gridHeight; y++) {
                for (let x = 0; x < this.gridWidth; x++) {
                    const value = Math.floor(Math.random() * 9) + 1;
                    this.startPopInAnimation(x, y, value);
                }
            }
        }, 500); // Wait for pop-out animation to complete
        
        this.showPopup("No more possible moves! Grid has been regenerated.", true);
    }
    
    startPopOutAnimation(x, y, value) {
        const startTime = performance.now();
        const duration = 300;
        
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
        
        // Create particles for pop effect
        const numParticles = 8;
        for (let i = 0; i < numParticles; i++) {
            const angle = (i / numParticles) * Math.PI * 2;
            this.particles.push({
                x: x * this.cellSize + this.cellSize/2,
                y: y * this.cellSize + this.cellSize/2,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                size: 6,
                startTime,
                duration: 500,
                color: '#ff0000'
            });
        }
        
        if (this.animations.length === 1) {
            this.animationLoop();
        }
    }
    
    startPopInAnimation(x, y, value) {
        const startTime = performance.now();
        const duration = 300;
        
        this.animations.push({
            x, y, value,
            startTime,
            duration,
            type: 'pop-in',
            update: (currentTime) => {
                const progress = (currentTime - startTime) / duration;
                if (progress >= 1) {
                    // Set the final value when animation completes
                    this.grid[y][x].value = value;
                    return false;
                }
                return true;
            }
        });
        
        if (this.animations.length === 1) {
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
                combination.forEach(({x, y}) => {
                    if (this.grid[y][x].value !== null) {
                        sum += this.grid[y][x].value;
                    }
                });
                
                if (sum === 10) {
                    // Update score once with total number of apples
                    this.updateScore(combination.length);
                    
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
        const containerStyle = window.getComputedStyle(container);
        const paddingX = parseFloat(containerStyle.paddingLeft) + parseFloat(containerStyle.paddingRight);
        const paddingY = parseFloat(containerStyle.paddingTop) + parseFloat(containerStyle.paddingBottom);
        
        // Get available space (excluding padding)
        const availableWidth = container.clientWidth - paddingX;
        const availableHeight = container.clientHeight - paddingY;
        
        // Calculate the maximum size that maintains the grid aspect ratio
        const gridAspectRatio = this.gridWidth / this.gridHeight;
        const containerAspectRatio = availableWidth / availableHeight;
        
        let newWidth, newHeight;
        if (containerAspectRatio > gridAspectRatio) {
            newHeight = availableHeight;
            newWidth = newHeight * gridAspectRatio;
        } else {
            newWidth = availableWidth;
            newHeight = newWidth / gridAspectRatio;
        }
        
        // Calculate the cell size
        const cellSizeByWidth = Math.floor(newWidth / this.gridWidth);
        const cellSizeByHeight = Math.floor(newHeight / this.gridHeight);
        const newCellSize = Math.min(
            this.maxCellSize,
            Math.max(this.minCellSize, Math.min(cellSizeByWidth, cellSizeByHeight))
        );
        
        if (newCellSize !== this.cellSize) {
            this.cellSize = newCellSize;
            this.canvas.width = this.gridWidth * this.cellSize;
            this.canvas.height = this.gridHeight * this.cellSize;
            this.draw();
        }
    }
    
    updateTimer() {
        if (this.msLeft > 0) {
            // Convert to mm:ss:ms format
            const totalSeconds = Math.floor(this.msLeft / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            const ms = Math.floor((this.msLeft % 1000) / 10); // Get centiseconds (2 digits)
            
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
            
            const timerElement = document.getElementById('timer');
            const timerTextElement = document.querySelector('.timer-text');
            timerElement.textContent = timeString;
            
            // Update progress bar
            const progress = (this.msLeft / (this.initialTime * 1000)) * 100;
            this.timerProgress.style.width = `${progress}%`;
            
            // Change color and add warning animation based on time remaining
            if (progress > 66) {
                this.timerProgress.style.backgroundColor = '#4CAF50';
                timerTextElement.classList.remove('warning');
            } else if (progress > 33) {
                this.timerProgress.style.backgroundColor = '#FFA000';
                timerTextElement.classList.remove('warning');
            } else {
                this.timerProgress.style.backgroundColor = '#f44336';
                timerTextElement.classList.add('warning');
                
                // Play warning sound at 10 seconds remaining
                if (Math.floor(this.msLeft / 1000) === 10 && (this.msLeft % 1000) > 980) {
                    this.audio.play('wrong');
                }
            }
        }
        
        // Check if time is up
        if (this.msLeft <= 0) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            this.gameOver();
        }
    }
    
    updateScore(points) {
        this.score += points;
        const scoreElement = document.getElementById('score');
        scoreElement.textContent = this.score;
        
        // Add pulse animation
        scoreElement.classList.remove('pulse');
        void scoreElement.offsetWidth; // Trigger reflow
        scoreElement.classList.add('pulse');
        
        // Create and animate score popup
        const scorePopup = document.createElement('div');
        scorePopup.className = 'score-popup';
        console.log(points);
        scorePopup.textContent = `+${points}`;
        
        const container = document.querySelector('.score-container');
        container.appendChild(scorePopup);
        
        // Remove popup after animation
        setTimeout(() => {
            scorePopup.remove();
        }, 800);
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
    handleTouchStart(event) {
        event.preventDefault();
        const touches = event.changedTouches;
        
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            // Convert touch coordinates to canvas coordinates
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // Store touch data using identifier as key
            this.touchPoints[touch.identifier] = {
                x: x,
                y: y,
                startX: x,
                startY: y
            };
        }
    }

    handleTouchMove(event) {
        event.preventDefault();
        const touches = event.changedTouches;
        
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            if (this.touchPoints[touch.identifier]) {
                const rect = this.canvas.getBoundingClientRect();
                this.touchPoints[touch.identifier].x = touch.clientX - rect.left;
                this.touchPoints[touch.identifier].y = touch.clientY - rect.top;
            }
        }
    }

    handleTouchEnd(event) {
        event.preventDefault();
        const touches = event.changedTouches;
        
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            // Clean up ended touch points
            delete this.touchPoints[touch.identifier];
        }
    }

    // In your game update function, you can now handle multiple touch points
    update() {
        // Handle all active touch points
        Object.values(this.touchPoints).forEach(touch => {
            // Handle each touch point here
            // Example: check collisions, trigger actions, etc.
            this.handleInteraction(touch.x, touch.y);
        });
    }

    // Helper function to handle interactions
    handleInteraction(x, y) {
        // Add your touch interaction logic here
        // Example: checking if touch coordinates intersect with game objects
    }

    // Update the resetCurrentGame method
    resetCurrentGame() {
        // Stop auto-solve if it's running
        this.stopAutoSolve();
        
        // Reset the grid
        this.grid = this.createGrid();
        
        // Reset the score for current game only
        this.score = 0;
        document.getElementById('score').textContent = '0';
        
        // Clear any ongoing timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Reset timer values
        this.timeLeft = this.initialTime;
        this.msLeft = this.timeLeft * 1000;
        
        // Reset timer display
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        document.getElementById('timer').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:00`;
        
        // Reset timer progress bar
        this.timerProgress.style.width = '100%';
        this.timerProgress.style.backgroundColor = '#4CAF50';
        
        // Clear any ongoing animations
        this.animations = [];
        this.particles = [];
        
        // Clear any ongoing tips
        if (this.tipTimeout) {
            clearTimeout(this.tipTimeout);
            this.tipTimeout = null;
        }
        
        // Create and show countdown overlay
        const countdownOverlay = document.createElement('div');
        countdownOverlay.className = 'countdown-overlay';
        const countdownText = document.createElement('div');
        countdownText.className = 'countdown-text';
        countdownOverlay.appendChild(countdownText);
        document.getElementById('game-page').appendChild(countdownOverlay);
        
        // Start countdown
        let count = 3;
        countdownText.textContent = count;
        this.audio.play('countdown');
        
        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownText.textContent = count;
                this.audio.play('countdown');
            } else if (count === 0) {
                countdownText.textContent = 'GO!';
                this.audio.play('match');
                setTimeout(() => {
                    countdownOverlay.remove();
                    clearInterval(countdownInterval);
                    this.startGameTimer();
                }, 500);
            }
        }, 1000);
        
        // Redraw the game
        this.draw();
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