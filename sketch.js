// ===== COMMENTARY =====
/*
Extension: FNaF-Style Security Horror System

My extension transforms the basic image processing application into a complete Five Nights at Freddy's-inspired security horror experience. This goes significantly beyond the core requirements by implementing:

1. Game System with Time Pressure: A 6-hour in-game timer (12 AM - 6 AM) with accelerated time progression
2. Dynamic Failure System: Cameras randomly go offline, creating urgency and strategic gameplay
3. Power Management: Limited power resource that drains over time, requiring active management
4. Reboot Mechanics: Two-tier reboot system (camera-only or full system) with different durations
5. Horror Elements: Jump scares, audio cues, and visual effects when systems fail
6. Complete UI/UX: Thematic interface with CRT effects, glitches, and retro styling

Technical Challenges Overcome:
- Synchronizing multiple game systems (time, power, failures, audio)
- Creating fallback systems for missing assets (programmatic sounds and visuals)
- Implementing non-blocking UI during critical game events
- Balancing game difficulty through tunable parameters

Unique Aspects:
The extension stands out by creating an immersive horror experience rather than just demonstrating image processing techniques. The FNaF-style gameplay requires constant attention to multiple systems simultaneously, creating genuine tension. The power management mechanic adds strategic depth - players must choose between conserving power or maintaining security.

Image Processing Insights:
Through implementing the required filters, I discovered that:
- HSV thresholding provides better object separation than RGB for certain scenarios
- YCrCb conversion is particularly effective for skin detection
- Channel-specific thresholding allows for targeted feature extraction
- The grayscale conversion with brightness boost helps with low-light image analysis

Problems Solved:
- Asset loading issues were resolved through comprehensive fallback systems
- Performance optimization was needed for real-time face detection + game logic
- State management complexity was handled through clear separation of concerns

Control System Design:
The application features an intuitive control scheme that balances accessibility with functionality:

Keyboard Controls:
- S key: Capture snapshot from webcam
- C key: Clear current snapshot
- P key: Restore power to 100% (debug feature)
- 0-4 keys: Apply different face processing filters
- R key: Restart game after failure/victory

Mouse Controls:
- Click on camera grid cells to select specific cameras
- Interactive sliders for RGB and color space threshold adjustment
- Power circle click-and-hold for manual charging

Interface Design Principles:
- Modal interface showing either camera view or control panel
- Visual feedback for all interactions (button states, selection highlights)
- Non-blocking UI during critical operations
- Consistent horror-themed aesthetic throughout

The control system was designed to be discoverable while maintaining the tense atmosphere of the security horror theme. All interactive elements provide immediate visual feedback, and the layout follows natural eye movement patterns for efficient monitoring of multiple systems simultaneously.

Accessibility Considerations:
- High contrast text and controls
- Clear state indicators for all interactive elements
- Keyboard alternatives for mouse actions
- Visual and audio feedback for important events

This extension demonstrates how academic image processing techniques can be transformed into an engaging interactive experience while maintaining all the required technical functionality.
*/
// ===== END OF COMMENTARY =====

// Main variables for video, snapshot, and face detection
let video;
let snapshot;
let predictions = [];

// Grid configuration for camera display
const cellW = 160;
const cellH = 120;
const cols = 3;
const rows = 5;

// UI sliders for image processing
let rSlider, gSlider, bSlider;
let cs1Slider, cs2Slider;

// System status variables
let powerLevel = 100;
let systemUsage = 30;
let currentTime = "23:59:42";
let isRecording = true;
let glitchEffect = false;
let isCapturing = false;
let captureButton;

// Face detection variables
let detector;
let classifier = objectdetect.frontalface;
let faces = [];
let faceEffect = 0;

// Interface control variables
let showCameras = false;
let showInfo = false;
let bgImage;


let interfaceBlocked = false;

// Camera failure tracking
let screamerImage;
let screamerSound;

// Game state management functions exposed to HTML
window.resetGameFromHTML = resetGame;
window.completeGameReset = completeGameReset;

// Asset loading management
let assetsLoaded = false;
let assetsLoadAttempted = false;

// Animation variables
let gifFrames = [];
let currentGifFrame = 0;
let gifFrameRate = 10; // frames per second
let lastGifFrameTime = 0;

// Time management
let lastTime = 0;
let deltaTime = 0;
let screamerGif;
let gifPlaying = false;
let victorySound;

// Preload assets before setup
function preload() {
  console.log('Starting assets loading...');
  assetsLoadAttempted = true;
  
  // Load GIF file for jump scare effect
  try {
    screamerGif = createImg('assets/jumpscare.gif', 'jumpscare');
    screamerGif.hide();
    console.log('GIF image loaded successfully');
  } catch (e) {
    console.error('Error loading GIF:', e);
    createFallbackScreamerImage();
  }
  
  // Load audio assets
  loadScreamerSound();
  loadVictorySound();
}

// Load GIF frames for animation (fallback if file loading fails)
function loadGifFrames() {
  createAnimatedScreamer();
}

// Create programmatic animation as fallback for missing GIF
function createAnimatedScreamer() {
  // Simple test animation with 5 frames
  for (let i = 0; i < 5; i++) {
    let frame = createGraphics(400, 300);
    
    // Color-changing effect for visibility
    let hue = map(i, 0, 4, 0, 255);
    frame.background(hue, 255, 255); // Bright colors for testing
    
    frame.fill(255);
    frame.textSize(32);
    frame.textAlign(CENTER, CENTER);
    frame.text("FRAME " + i, 200, 150);
    
    gifFrames.push(frame);
    console.log("Created frame", i);
  }
  
  screamerImage = gifFrames[0];
  console.log('Created test animation with', gifFrames.length, 'frames');
}


// Load screamer sound with fallback handling
function loadScreamerSound() {
  try {
    screamerSound = loadSound('assets/screamer.mp3',
      () => {
        console.log('Screamer sound loaded successfully');
        assetsLoaded = true;
      },
      (err) => {
        console.error('Error loading sound from assets/screamer.mp3:', err);
        console.log('Trying alternative paths...');
        tryAlternativeSoundPaths();
      }
    );
  } catch (e) {
    console.error('Error loading sound:', e);
    tryAlternativeSoundPaths();
  }
}

// Check if all required assets are loaded
function checkAssetsLoaded() {
  if ((screamerImage !== undefined && screamerSound !== undefined) || 
      (screamerImage && screamerSound)) {
    assetsLoaded = true;
    console.log('All assets loaded or fallbacks created');
  }
}

// Create fallback image for when GIF fails to load
function createFallbackScreamerImage() {
  screamerImage = createGraphics(400, 300);
  screamerImage.background(255, 0, 0); // Red background
  screamerImage.textSize(48);
  screamerImage.textAlign(CENTER, CENTER);
  screamerImage.fill(255); // White text
  screamerImage.text("GAME OVER", 200, 150);
  screamerImage.textSize(24);
  screamerImage.text("SECURITY BREACH", 200, 200);
}

// Check if asset files exist on server
function checkAssetFiles() {
  // Check screamer MP3 file
  fetch('assets/screamer.mp3', { method: 'HEAD' })
    .then(response => {
      console.log('screamer.mp3 exists:', response.ok);
      if (!response.ok) {
        console.log('Trying to find sound file...');
        findSoundFile();
      }
    })
    .catch(() => {
      console.log('screamer.mp3 not found');
      findSoundFile();
    });
    
  // Check jumpscare GIF file
  fetch('assets/jumpscare.gif', { method: 'HEAD' })
    .then(response => {
      console.log('jumpscare.gif exists:', response.ok);
    })
    .catch(() => {
      console.log('jumpscare.gif not found');
    });
}

// Search for sound files with different names and extensions
function findSoundFile() {
  const extensions = ['.mp3', '.wav', '.ogg'];
  const prefixes = ['', 'screamer', 'jumpscare', 'scare'];
  
  // Try all combinations of prefixes and extensions
  extensions.forEach(ext => {
    prefixes.forEach(prefix => {
      const filename = prefix ? `${prefix}${ext}` : `screamer${ext}`;
      fetch(`assets/${filename}`, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            console.log(`Found sound file: assets/${filename}`);
          }
        })
        .catch(() => {});
    });
  });
}

// Setup function - initializes the application
function setup() {
  createCanvas(cellW * cols, cellH * rows + 80);
  
  // Create separate canvas for UI elements
  uiCanvas = createGraphics(width, height);
  uiCanvas.clear();
  
  // Position indicator outside main canvas
  circleX = width + 40;
  circleY = 40;
    
  checkAssetFiles();
  
  // Create fallbacks if assets fail to load
  if (!screamerImage) {
    createFallbackScreamerImage();
  }
  if (!screamerSound) {
    screamerSound = createFallbackScreamerSound();
  }
  
  // Add horror-themed styling
  document.head.innerHTML += `
    <link href="https://fonts.googleapis.com/css2?family=VT323&family=Share+Tech+Mono&display=swap" rel="stylesheet">
    <style>
      body { 
        margin: 0; 
        padding: 20px; 
        background: #0a0a0a; 
        overflow: hidden; 
        font-family: 'VT323', monospace;
        font-size: 22px; 
      }
      canvas { 
        border: 1px solid #333; 
        box-shadow: 0 0 20px #000000; 
      }
      .slider-container { 
        background: #111; 
        border: 1px solid #333; 
        padding: 8px; 
        border-radius: 3px;
        margin: 8px 0;
      }
      .slider-label { 
        color: #ccc; 
        font-size: 18px; 
        margin-bottom: 4px;
      }
      .fnaf-control-button {
        font-family: 'VT323';
        font-size: 16px;
        background-color: #111;
        color: #ccc;
        border: 1px solid #333;
        padding: 8px 12px;
        cursor: pointer;
        margin: 5px;
        border-radius: 3px;
        transition: all 0.3s ease;
      }
      .fnaf-control-button:hover {
        background-color: #222;
        color: #fff;
        border: 1px solid #666;
        box-shadow: 0 0 10px #333;
      }
    </style>
  `;

  select('canvas').hide();

  // Setup control buttons
  setupButtons();

  // Initialize webcam capture
  video = createCapture(VIDEO);
  video.size(cellW, cellH);
  video.hide();

  // Initialize camera failure timers
  const cameraNames = [
    "CAM 1", "CAM 2", "CAM 3", "CAM 4", "CAM 5", 
    "CAM 6", "CAM 7", "CAM 8", "CAM 9", "CAM 10", 
    "CAM 11", "CAM 12", "CAM 13", "CAM 14"
  ];
  
  for (let camName of cameraNames) {
    cameraFailureTimers[camName] = 0;
  }

  // Create controls container
  let controls = select('#controlsContainer');

  // Snapshot capture button
  captureButton = createButton("📷 CAPTURE SNAPSHOT");
  captureButton.parent(controls);
  captureButton.class("fnaf-control-button");
  captureButton.mousePressed(() => {
    if (interfaceBlocked) return;
    takeSnapshot();
  });

  // Audio feed toggle button
  let btn = createButton("🔇 ENABLE AUDIO FEED");
  btn.parent(controls);
  btn.class("fnaf-control-button");
  btn.mousePressed(() => {
    if (interfaceBlocked) return;
    
    // Resume AudioContext on first click
    if (typeof getAudioContext().resume === 'function') {
      getAudioContext().resume().then(() => {
        console.log('AudioContext resumed successfully');
        userStartAudio();
        
        if (!audioActive) {
          osc.amp(0.05, 0.05);        
          btn.html("🔊 AUDIO ACTIVE");
          btn.style('color', '#ff4444');
          btn.style('border', '1px solid #ff4444');
        } else {
          osc.amp(0, 0.05);           
          btn.html("🔇 ENABLE AUDIO FEED");
          btn.style('color', '#ccc');
          btn.style('border', '1px solid #333');
        }
        audioActive = !audioActive;
      });
    } else {
      userStartAudio();
    }
  });

  // Create image processing controls
  createHorrorInterface(controls);

  // System status updates
  setInterval(updateSystemStats, 1000);

  // Audio oscillator for system sounds
  osc = new p5.Oscillator('sine');
  osc.freq(60);
  osc.amp(0);
  osc.start();

  // Initialize camera data and face detector
  initCameraData();
  let scaleFactor = 1.2;
  detector = new objectdetect.detector(160, 120, scaleFactor, classifier);
  
  // Set first failure time
  nextFailureTime = random(10, 20);
    
  // Reboot system event listeners
  document.querySelector('.control-menu .clickable').addEventListener('click', function() {
    if (!rebootInProgress) {
      rebootInProgress = true;
      rebootTarget = "ALL";
      rebootDuration = 8;
      blockCameraControl(true);
      rebootTimer = 0;
      
      if (audioActive) {
        osc.freq(300);
        setTimeout(() => osc.freq(60), 100);
      }
    }
  });

  document.querySelector('.movable:nth-child(4)').addEventListener('click', function() {
    if (!rebootInProgress) {
      rebootInProgress = true;
      rebootTarget = "CAMERA";
      rebootDuration = 4;
      blockCameraControl(true);
      rebootTimer = 0;
      
      if (audioActive) {
        osc.freq(250);
        setTimeout(() => osc.freq(60), 100);
      }
    }
  });

  assetsLoaded = true;
  createPowerIndicator();
}

// Create power indicator UI element with SVG circle
function createPowerIndicator() {
  let powerContainer = createDiv('');
  powerContainer.id('power-container');
  powerContainer.style('position', 'absolute');
  powerContainer.style('top', '20%');
  powerContainer.style('left', '50%');
  powerContainer.style('transform', 'translate(-50%, -50%)');
  powerContainer.style('z-index', '1000');
  powerContainer.style('cursor', 'pointer');
  
  // Click handler for charging
  powerContainer.mousePressed(() => {
    if (interfaceBlocked) return;
    powerCircle.isCharging = true;
    if (audioActive) {
      osc.freq(300);
      setTimeout(() => osc.freq(60), 100);
    }
  });
  
  powerContainer.mouseReleased(() => {
    powerCircle.isCharging = false;
  });

  // Container for the circle - medium size
  let circleContainer = createDiv('');
  circleContainer.parent(powerContainer);
  circleContainer.style('position', 'relative');
  circleContainer.style('width', '80px');   // Medium size
  circleContainer.style('height', '80px');  // Medium size
  
  // SVG for circular power indicator
  let svg = `
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle id="power-circle-bg" cx="40" cy="40" r="36" fill="none" stroke="#333" stroke-width="4"/>
      <circle id="power-circle-fill" cx="40" cy="40" r="36" fill="none" stroke="#0f0" stroke-width="4" 
              stroke-dasharray="226.195" stroke-dashoffset="226.195" transform="rotate(-90 40 40)"/>
      <text id="power-text" x="40" y="40" text-anchor="middle" dominant-baseline="middle" 
            font-family="VT323" font-size="16" fill="#ccc">100%</text>
    </svg>
  `;
  circleContainer.html(svg);
  
  // Power label
  let powerLabel = createDiv('POWER');
  powerLabel.parent(powerContainer);
  powerLabel.style('text-align', 'center');
  powerLabel.style('font-family', 'VT323, monospace');
  powerLabel.style('font-size', '14px');
  powerLabel.style('color', '#666');
  powerLabel.style('margin-top', '8px');
}

// Setup button event handlers for UI controls
function setupButtons() {
  select('#leftButton').mousePressed(() => {
    if (interfaceBlocked) return;
    showInfo = !showInfo;
    select('#infoModal').style('display', showInfo ? 'block' : 'none');
    if (showInfo && showCameras) {
      showCameras = false;
      select('#cameraModal').style('display', 'none');
      select('canvas').hide();
      select('#controlsContainer').hide();
    }
  });

  select('#rightButton').mousePressed(() => {
    if (interfaceBlocked) return;
    showCameras = !showCameras;
    if (showCameras) {
      select('canvas').show();
      select('#cameraModal').style('display', 'block');
      select('#controlsContainer').show();
      if (showInfo) {
        showInfo = false;
        select('#infoModal').style('display', 'none');
      }
    } else {
      select('canvas').hide();
      select('#cameraModal').style('display', 'none');
      select('#controlsContainer').hide();
    }
  });
}

// Capture snapshot from webcam
function takeSnapshot() {
  snapshot = video.get();
  cameraFlash();
  isCapturing = true;
  
  // Button flash for capture confirmation
  captureButton.style('background-color', '#00ff00');
  captureButton.style('color', '#000');
  captureButton.style('border-radius', '3px');
  setTimeout(() => {
    captureButton.style('background-color', '#111');
    captureButton.style('color', '#ccc');
    captureButton.style('border-radius', '3px');
  }, 300);
}

// Camera flash visual effect
function cameraFlash() {
  push();
  blendMode(SCREEN);
  fill(255, 100);
  rect(0, 0, width, height);
  blendMode(BLEND);
  pop();
}

// Mouse press handler for camera selection
function mousePressed() {
  if (interfaceBlocked) return;
  
  // Camera selection logic...
  if (snapshot) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let x = col * cellW;
        let y = row * cellH;
        
        if (mouseX > x && mouseX < x + cellW && 
            mouseY > y && mouseY < y + cellH) {
          
          const cameraGrid = [
            ["CAM 1", "CAM 2", null],
            ["CAM 3", "CAM 4", "CAM 5"], 
            ["CAM 6", "CAM 7", "CAM 8"],
            ["CAM 9", "CAM 10", "CAM 11"],
            ["CAM 12", "CAM 13", "CAM 14"]
          ];
          
          if (row < cameraGrid.length && col < cameraGrid[0].length) {
            selectedCamera = cameraGrid[row][col];
            
            if (audioActive) {
              osc.freq(400);
              setTimeout(() => osc.freq(60), 50);
            }
            return;
          }
        }
      }
    }
    selectedCamera = null;
  }
}

// Mouse release handler - stop charging power
function mouseReleased() {
  powerCircle.isCharging = false;
}

// Check if file exists on server
function checkFileExists(url, callback) {
  fetch(url, { method: 'HEAD' })
    .then(response => callback(response.ok))
    .catch(() => callback(false));
}

// Check asset files in setup
checkFileExists('assets/jumpscare.gif', (exists) => {
  console.log('Jumpscare GIF exists:', exists);
});

checkFileExists('assets/screamer.mp3', (exists) => {
  console.log('Screamer MP3 exists:', exists);
});

// Global function to trigger screamer effect
window.triggerScreamer = function(cameraName) {
    console.log('Triggering screamer for camera:', cameraName);
    
    // Set game over flags
    gameOver = true;
    screamerActive = true;

    const screamerContainer = document.getElementById('screamerContainer');
    const screamerGif = document.getElementById('screamerGif');
    const screamerFallback = document.getElementById('screamerFallback');
    const audioElement = document.getElementById('screamerAudio');

    // Show container and GIF
    screamerContainer.style.display = 'block';
    screamerGif.style.display = 'block';
    if (screamerFallback) screamerFallback.style.display = 'none';

    // Reset src to replay GIF
    screamerGif.src = 'assets/jumpscare.gif?' + Date.now();

    // Play audio
    if (audioElement) {
        audioElement.currentTime = 0;
        audioElement.volume = 0.8;
        audioElement.play().catch(e => {
            console.error('Error playing audio:', e);
            createFallbackSound();
        });
    } else {
        createFallbackSound();
    }

    // Hide screamer and show game over screen after 2.5 seconds
    setTimeout(() => {
        hideScreamer();

        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'flex';
        }

        // Block interface (prevent button clicks)
        interfaceBlocked = true;
        screamerActive = false;
    }, 2500);
};

// Reset game state after screamer
function resetGame() {
    // Reset all systems but keep screamer flag
    interfaceBlocked = false;
    screamerActive = false;
    
    // Restore all cameras
    for (let camName in cameraData) {
        cameraData[camName].status = "ONLINE";
        cameraFailureTimers[camName] = 0;
    }
    
    // Reset audio
    if (audioActive) {
        osc.amp(0.05, 0.5);
    }
    
    // Restart failure system
    systemFailureTimer = 0;
    nextFailureTime = random(10, 20);
    failureInProgress = false;
    
    // Call global function to hide screamer
    if (typeof window.hideScreamer === 'function') {
        window.hideScreamer();
    }
}

// Update system statistics randomly
function updateSystemStats() {
  currentTime = new Date().toLocaleTimeString();
  powerLevel = max(0, powerLevel - random(0.1, 0.5));
  systemUsage = random(25, 45);
  glitchEffect = random() > 0.9;
}

// Main draw function - game loop
function draw() {
    let currentTime = millis();
    deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    updateGameSystems();
    // UPDATE POWER SYSTEM ONLY IN GAME MODE
    if (gameModeActive) {
        updatePowerSystem();
    }

    if (gameModeActive && !gameOver && !gameWon && !screamerActive) {
        updateGameTime();
    }

    background(0);

    // Main game logic - ONLY IN GAME MODE
    if (gameModeActive) {
        updateReboot();
        updateRebootButtons();
        updateScreamer();
        updateSystemFailures();
    }

    if (screamerActive) return;

    if (gameOver) {
        drawGameOverScreen();
    } else if (gameWon) {
        // victory screen
    } else {
        updateButtonStyles();

        if (showCameras) {
            drawStaticNoise();

            if (!snapshot) {
                drawSecurityCameraView();
            } else {
                drawGridCells();
                drawVHSEffects();
                drawSystemInterface();
                if (glitchEffect) drawGlitchEffects();
                drawSystemStatusPanel();
                drawMatrixRain();
                // ATTACK TIMERS ONLY IN GAME MODE
                if (gameModeActive) {
                    drawAttackTimers();
                }
                if (isCapturing) drawCaptureStatus();
            }
        } else {
            // CAMERA TIMERS ONLY IN GAME MODE
            if (gameModeActive) {
                drawHiddenCameraTimers();
            }
        }
    }

    updatePowerIndicator();
}

// Update power indicator UI element
function updatePowerIndicator() {
  let powerCircleFill = select('#power-circle-fill');
  let powerText = select('#power-text');
  let powerCircleBg = select('#power-circle-bg');
  let powerContainer = select('#power-container');
  
  if (powerCircleFill && powerText && powerCircleBg && powerContainer) {
    let percent = powerCircle.charge;
    
    // Calculate dashoffset for circle (169.646 = 2 * π * 27)
    let circumference = 169.646;
    let offset = circumference - (percent / 100) * circumference;
    
    // Update circle
    powerCircleFill.attribute('stroke-dashoffset', offset);
    
    // Change color based on charge level
    let circleColor;
    if (percent > powerCircle.warningThreshold) {
      circleColor = '#0f0'; // green
    } else if (percent > powerCircle.criticalThreshold) {
      circleColor = '#ff0'; // yellow/orange
    } else {
      circleColor = '#f00'; // red
    }
    powerCircleFill.attribute('stroke', circleColor);
    
    // Update text
    powerText.html(`${nf(percent, 2, 0)}%`);
    
    // Blinking on low charge
    if (percent < powerCircle.warningThreshold && frameCount % 60 < 30) {
      powerText.attribute('fill', '#f00');
      if (percent < powerCircle.criticalThreshold) {
        powerCircleBg.attribute('stroke', '#f00');
      } else {
        powerCircleBg.attribute('stroke', '#333');
      }
    } else {
      powerText.attribute('fill', '#ccc');
      powerCircleBg.attribute('stroke', '#333');
    }
    
    // Charging effect
    if (powerCircle.isCharging) {
      powerText.html('CHARGING');
      powerText.attribute('fill', '#0f0');
      
    } else {
      powerContainer.style('box-shadow', 'none');
    }
  }
}

// Draw screamer effect (jump scare)
function drawScreamer() {
  console.log("Drawing screamer");
  
  // If GIF is available, use it
  if (screamerGif && gifPlaying) {
    // GIF is already displayed via CSS
    // Add additional effects on top
    drawScreamerStatic();
    
    // Blinking text
    if (frameCount % 15 < 10) {
      push();
      textSize(32);
      fill(255);
      textAlign(CENTER);
      text("PRESS ANY KEY TO RESTART", width/2, height - 100);
      pop();
    }
    return;
  }
  
  // Fallback if GIF failed to load
  push();
  background(0);
  
  try {
    // Fallback drawing
    background(255, 0, 0);
    textSize(64);
    textAlign(CENTER, CENTER);
    fill(255);
    text("GAME OVER", width/2, height/2);
    textSize(32);
    text("SECURITY BREACH", width/2, height/2 + 60);
    
  } catch (e) {
    // Ultimate fallback
    background(255, 0, 0);
    textSize(32);
    fill(255);
    textAlign(CENTER, CENTER);
    text("SECURITY BREACH DETECTED", width/2, height/2);
  }
  
  // Blinking text
  if (frameCount % 15 < 10) {
    textSize(32);
    fill(255);
    textAlign(CENTER);
    text("PRESS ANY KEY TO RESTART", width/2, height - 100);
  }
  
  // Add static noise effect over screamer
  drawScreamerStatic();
  
  pop();
}

// Draw TV static noise effect
function drawScreamerStatic() {
  // Add TV static noise effect over screamer
  push();
  blendMode(ADD);
  
  // White noise dots
  for (let i = 0; i < 100; i++) {
    let x = random(width);
    let y = random(height);
    let size = random(1, 3);
    let alpha = random(50, 200);
    fill(255, alpha);
    noStroke();
    rect(x, y, size, size);
  }
  
  // Horizontal interference lines
  for (let y = 0; y < height; y += 2) {
    if (random() > 0.98) {
      let alpha = random(50, 150);
      let stripHeight = random(1, 3);
      fill(255, alpha);
      rect(0, y, width, stripHeight);
    }
  }
  
  blendMode(BLEND);
  pop();
}

// Draw game over screen
function drawGameOverScreen() {
  push();
  background(0);
  textSize(48);
  textAlign(CENTER, CENTER);
  fill(255, 0, 0);
  text("SECURITY BREACH", width/2, height/2 - 50);
  
  textSize(24);
  fill(200);
  text("Systems compromised. Restarting...", width/2, height/2 + 20);
  
  // Reboot progress indicator
  let progress = (millis() % 2000) / 2000;
  stroke(255, 0, 0);
  strokeWeight(2);
  line(width/2 - 100, height/2 + 60, width/2 - 100 + progress * 200, height/2 + 60);
  pop();
}

// Draw global attack timers
function drawAttackTimers() {
    if (!globalAttackActive) return;
    
    push();
    textFont('VT323');
    textSize(16);
    textAlign(CENTER);
    fill(255, 0, 0);
    
    let timeLeft = max(0, attackThreshold - globalAttackTimer);
    let dangerLevel = map(timeLeft, 0, attackThreshold, 255, 0);
    
    // Big red timer in center of screen
    text(`CRITICAL: ${nf(timeLeft, 2, 1)}s`, width/2, 50);
    
    // Danger indicator
    stroke(255, dangerLevel, dangerLevel);
    strokeWeight(3);
    line(width/2 - 60, 60, width/2 - 60 + (attackThreshold - timeLeft) * 10, 60);
    
    // Blinking warning
    if (frameCount % 30 < 20) {
        textSize(14);
        text("REBOOT SYSTEMS IMMEDIATELY!", width/2, 80);
    }
    
    pop();
}


// Keyboard input handler
function keyPressed() {
    if (screamerActive) {
        // Restart game after screamer (without reload)
        resetGame();
        return;
    }

    // Reload with R when game ends (WIN/LOSE)
    if ((key === 'r' || key === 'R') && isEndScreenVisible()) {
        location.reload(); // Use reload instead of completeGameReset()
        return;
    }

    if (interfaceBlocked || gameOver) return;

    // Snapshot controls
    if (key === 's' || key === 'S') {
        takeSnapshot();
    }
    if (key === 'p' || key === 'P') {
        powerLevel = 100;
    }
    if (key === 'c' || key === 'C') {
        snapshot = null;
        isCapturing = false;
    }

    // Face effect selection
    if (key === '1') faceEffect = 1;
    else if (key === '2') faceEffect = 2;
    else if (key === '3') faceEffect = 3;
    else if (key === '4') faceEffect = 4;
    else if (key === '0') faceEffect = 0;
}

let screamerGifPreloaded = false;

// Preload screamer GIF for instant display
function preloadScreamerGif() {
    if (screamerGifPreloaded) return;
    const gif = document.getElementById('screamerGif');
    const img = new Image();
    img.onload = () => {
        screamerGifPreloaded = true;
        gif.src = img.src;
        console.log('GIF preloaded successfully');
    };
    img.onerror = () => {
        console.log('GIF preload failed');
    };
    img.src = 'assets/jumpscare.gif';
}

// Setup event listeners for UI interactions
function setupEventListeners() {
    // Initialize on first click
    document.addEventListener('click', () => {
        initializeAudioContext();
        preloadScreamerGif();
    }, { once: true });

    // Game Mode toggle button
    const gameModeButton = document.getElementById('gameModeButton');
    if (gameModeButton) {
        gameModeButton.addEventListener('click', function () {
            // Toggle game mode
            gameModeActive = !gameModeActive;
            
            if (gameModeActive) {
                // Activate game mode
                initializeAudioContext();
                preloadScreamerGif();
                alert("GAME MODE ACTIVATED!\nSurvive the office until dawn.\nMonitor systems.\nClick 'Reboot' to restore them in time. Or reboot only Camera system to save time.\nFail → jump scare → Game Over.");
                this.style.background = 'linear-gradient(45deg,#00ff00,#39ff14)';
                this.style.boxShadow = '0 0 25px #00ff00,0 0 40px rgba(0,255,0,0.7)';
                this.textContent = 'ACTIVE MODE';
            } else {
                // Deactivate game mode
                alert("GAME MODE DEACTIVATED");
                this.style.background = 'linear-gradient(45deg,#8b0000,#ff0000)';
                this.style.boxShadow = '0 0 15px #ff0000,0 0 30px rgba(255,0,0,0.5)';
                this.textContent = 'GAME MODE';
                
                // Reset game state on deactivation
                completeGameReset();
            }
        });
    }

    // Exit button handler
    const exitButton = document.querySelector('.control-menu .clickable:last-child');
    if (exitButton) {
        exitButton.addEventListener('click', () => {
            document.getElementById('infoModal').style.display = 'none';
        });
    }

    // Left button (controls) handler
    const leftButton = document.getElementById('leftButton');
    if (leftButton) {
        leftButton.addEventListener('click', () => {
            document.getElementById('infoModal').style.display = 'block';
        });
    }
}

// Global screamer trigger function
window.triggerScreamer = function () {
     if (!gameModeActive) {
        return;
    }
    const screamerContainer = document.getElementById('screamerContainer');
    const screamerGif = document.getElementById('screamerGif');
    const audioElement = document.getElementById('screamerAudio');
    const gameOverScreen = document.getElementById('gameOverScreen');

    screamerContainer.style.display = 'block';
    if (screamerGifPreloaded) screamerGif.style.display = 'block';

    if (audioElement) {
        audioElement.loop = false;
        audioElement.currentTime = 0;
        audioElement.volume = 0.8;
        audioElement.play().catch(() => {});
    }

    setTimeout(() => {
        screamerContainer.style.display = 'none';
        screamerGif.style.display = 'none';
        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
            audioElement.src = audioElement.src; // reset
        }
        gameOverScreen.style.display = 'flex';
    }, 2000);
}

// Preload assets on window load
window.addEventListener('load', () => {
    preloadScreamerGif();
    initializeAudioContext();
    setupEventListeners();
    document.getElementById('gameOverScreen').style.display = 'none';
});

// Draw power circle indicator on UI canvas
function drawPowerCircle() {
  uiCanvas.push();
  
  let radius = 25;
  let thickness = 5;
  
  // === BASE CIRCLE (gray background) ===
  uiCanvas.noFill();
  uiCanvas.stroke(50, 50, 50);
  uiCanvas.strokeWeight(thickness);
  uiCanvas.ellipse(circleX, circleY, radius * 2);
  
  // === ARC COLOR SELECTION ===
  let circleColor;
  if (powerCircle.charge > powerCircle.warningThreshold) {
    circleColor = [0, 255, 0];      // green
  } else if (powerCircle.charge > powerCircle.criticalThreshold) {
    circleColor = [255, 165, 0];    // orange
  } else {
    circleColor = [255, 0, 0];      // red
  }
  
  // === ARC ===
  let angle = map(powerCircle.charge, 0, 100, 0, 360);
  uiCanvas.stroke(...circleColor);
  uiCanvas.noFill();
  uiCanvas.strokeWeight(thickness);
  uiCanvas.arc(circleX, circleY, radius * 2, radius * 2, 
      -HALF_PI, 
      -HALF_PI + radians(angle), 
      OPEN);
  
  // === PERCENTAGE TEXT ===
  uiCanvas.textFont('VT323');
  uiCanvas.textSize(11);
  uiCanvas.textAlign(CENTER, CENTER);
  
  if (powerCircle.isCharging && frameCount % 10 < 5) {
    uiCanvas.fill(0, 255, 0);   // blinking green
  } else {
    uiCanvas.fill(180, 220, 180); // calm gray-green
  }
  uiCanvas.noStroke();
  uiCanvas.text(`${nf(powerCircle.charge, 2, 0)}%`, circleX, circleY);
  
  // === BLINKING WARNING DOT ===
  if (powerCircle.charge < powerCircle.warningThreshold && frameCount % 60 < 30) {
    uiCanvas.fill(255, 0, 0);
    uiCanvas.ellipse(circleX, circleY - radius - 3, 3, 3);
  }
  
  // === "POWER" LABEL ===
  uiCanvas.textSize(9);
  uiCanvas.fill(150, 150, 150);
  uiCanvas.text("POWER", circleX, circleY + radius + 8);
  
  // === "CHARGING" LABEL ===
  if (powerCircle.isCharging) {
    uiCanvas.textSize(8);
    uiCanvas.fill(0, 255, 0);
    uiCanvas.text("CHARGING", circleX, circleY + radius + 18);
  }
  
  uiCanvas.pop();
}
