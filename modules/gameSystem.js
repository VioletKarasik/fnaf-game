// Game state management
let gameModeActive = false;
let gameOver = false;
let gameWon = false;
let gameTime = 0; // in minutes (0 = 12:00 AM)
let gameDuration = 6 * 60; // 6 hours in minutes
let timeSpeed = 5.0; // time progression speed

// System failure management
let systemFailureTimer = 0;
let nextFailureTime = 0;
let failureInProgress = false;

// Reboot system variables
let rebootInProgress = false;
let rebootTimer = 0;
let rebootDuration = 0;
let rebootTarget = "";

let rebootInterfaceTimer = 0;
let showRebootInterfaceTimer = false;
let rebootInterfaceTarget = "";
let rebootInterfaceDuration = 0;

// Camera failure tracking
let cameraFailureTimers = {};
let attackThreshold = 12;

// Global attack system
let globalAttackTimer = 0;
let globalAttackActive = false;

// Screamer system
let screamerActive = false;
let screamerTimer = 0;
let screamerDuration = 3;
let screamerTriggered = false;

// Power system
let powerCircle = {
  charge: 100,        // current charge (0-100)
  drainRate: 4,       // discharge rate per second
  chargeRate: 3.0,    // charging rate per second
  isCharging: false,  // player is currently charging
  warningThreshold: 30, // warning level
  criticalThreshold: 15 // critical level
};

// Initialize game systems
function initGameSystem() {
  // Initialize camera failure timers
  const cameraNames = [
    "CAM 1", "CAM 2", "CAM 3", "CAM 4", "CAM 5", 
    "CAM 6", "CAM 7", "CAM 8", "CAM 9", "CAM 10", 
    "CAM 11", "CAM 12", "CAM 13", "CAM 14"
  ];
  
  for (let camName of cameraNames) {
    cameraFailureTimers[camName] = 0;
  }

  // Set first failure time
  nextFailureTime = random(10, 20);
}

// Update game systems
function updateGameSystems() {
  if (!gameModeActive || gameOver || screamerActive) return;
  
  updatePowerSystem();
  updateGameTime();
  updateReboot();
  updateSystemFailures();
  
  if (gameTime >= gameDuration && !gameWon) {
    winGame();
  }
}

// Update in-game time
function updateGameTime() {
  if (!gameModeActive) return;
  
  gameTime += (deltaTime / 1000) * timeSpeed;
  updateClockDisplay();
}

// Format game time to 12-hour format
function formatGameTime() {
  let totalHours = floor(gameTime / 60);
  let hours = totalHours % 12;
  hours = hours === 0 ? 12 : hours; // Convert 0 to 12
  let minutes = floor(gameTime % 60);
  let period = totalHours >= 12 ? "PM" : "AM";
  
  return `${nf(hours, 2)}:${nf(minutes, 2)} ${period}`;
}

// Update game clock display
function updateClockDisplay() {
  const clockElement = document.getElementById('gameClock');
  if (clockElement) {
    clockElement.innerHTML = formatGameTime();
    
    // Add blinking effect every second
    if (floor(gameTime) % 2 === 0) {
      clockElement.style.textShadow = '0 0 15px #00ff00, 0 0 30px #00ff00';
    } else {
      clockElement.style.textShadow = '0 0 5px #00ff00';
    }
  }
}

// Update power system (charging/draining)
function updatePowerSystem() {
  if (!gameModeActive || gameOver || screamerActive) return;

  if (powerCircle.isCharging) {
    powerCircle.charge += powerCircle.chargeRate * (deltaTime / 1000);
    powerCircle.charge = min(powerCircle.charge, 100);
  } else {
    powerCircle.charge -= powerCircle.drainRate * (deltaTime / 1000);
    powerCircle.charge = max(powerCircle.charge, 0);
  }
  
  // Effects at low charge
  if (powerCircle.charge < powerCircle.criticalThreshold) {
    // Random screen flickers
    if (random() > 0.95) {
      push();
      blendMode(SCREEN);
      fill(255, 0, 0, 50);
      rect(0, 0, width, height);
      blendMode(BLEND);
      pop();
    }
    
    // Increased chance of glitches
    if (random() > 0.98) {
      glitchEffect = true;
    }
  }
  
  // Complete shutdown at zero charge
  if (powerCircle.charge <= 0 && !gameOver) {
    triggerPowerFailure();
  }
}

// Handle complete power failure
function triggerPowerFailure() {
  // Disable all systems
  for (let camName in cameraData) {
    cameraData[camName].status = "OFFLINE";
  }
  
  // Trigger screamer after short delay
  setTimeout(() => {
    if (!gameOver) {
      screamerTriggered = true;
      triggerScreamer("POWER SYSTEM");
    }
  }, 2000);
}

// Update reboot system progress
function updateReboot() {
  if (!gameModeActive && rebootInProgress) {
    rebootInProgress = false;
    interfaceBlocked = false;
    return;
  }
  
  if (rebootInProgress) {
    interfaceBlocked = true;
    
    rebootTimer += deltaTime / 2000;
    rebootInterfaceTimer = ceil(rebootDuration - rebootTimer);
    showRebootInterfaceTimer = true;
    rebootInterfaceTarget = rebootTarget;
    rebootInterfaceDuration = rebootDuration;
    
    if (rebootTimer >= rebootDuration) {
      rebootInProgress = false;
      rebootTimer = 0;
      showRebootInterfaceTimer = false;
      interfaceBlocked = false;
      
      // Restore systems and RESET ATTACK TIMERS
      if (rebootTarget === "CAMERA") {
        for (let camName in cameraData) {
          if (cameraData[camName].status === "OFFLINE") {
            cameraData[camName].status = "ONLINE";
            cameraFailureTimers[camName] = 0;
          }
        }
      } else if (rebootTarget === "ALL") {
        for (let camName in cameraData) {
          cameraData[camName].status = "ONLINE";
          cameraFailureTimers[camName] = 0;
        }
        // ADD POWER INDICATOR RESET ON FULL REBOOT
        powerCircle.charge = 100; // Restore charge to 100%
        powerCircle.isCharging = false;
      }

      rebootTarget = "";
      blockCameraControl(false);
    }
  }
}

// Update reboot button text with progress indicators
function updateRebootButtons() {
  const rebootAllButton = document.querySelector('.control-menu .clickable');
  const rebootCameraButton = document.querySelector('.movable:nth-child(4)');

  if (showRebootInterfaceTimer) {
    // Calculate dots for loading animation
    let dots = ".".repeat((floor(millis() / 700) % 3) + 1);

    if (rebootInterfaceTarget === "ALL" && rebootAllButton) {
      rebootAllButton.textContent = `REBOOT ALL ${rebootInterfaceTimer}${dots}`;
    } 
    else if (rebootInterfaceTarget === "CAMERA" && rebootCameraButton) {
      rebootCameraButton.textContent = `CAMERA SYSTEM ${rebootInterfaceTimer}${dots}`;
    }
  } else {
    if (rebootAllButton) rebootAllButton.textContent = 'REBOOT ALL';
    if (rebootCameraButton) rebootCameraButton.textContent = 'CAMERA SYSTEM';
  }
}

// System failure management - randomly disable cameras
function updateSystemFailures() {
  if (!gameModeActive || gameOver || screamerActive || screamerTriggered) {
    return;
  }
  
  systemFailureTimer += deltaTime / 1000;
  
  // Count offline cameras
  let offlineCount = 0;
  for (let camName in cameraData) {
    if (cameraData[camName].status === "OFFLINE") {
      offlineCount++;
    }
  }
  
  // If 3+ cameras offline - start global attack timer
  if (offlineCount >= 3 && !globalAttackActive) {
    globalAttackActive = true;
    globalAttackTimer = 0;
    console.log("CRITICAL: 3+ CAMERAS OFFLINE - ATTACK IMMINENT");
  }
  
  // Update global attack timer if active
  if (globalAttackActive) {
    globalAttackTimer += deltaTime / 1000;
    
    // Check if global timer exceeds limit
    if (globalAttackTimer >= attackThreshold && !screamerTriggered) {
      screamerTriggered = true;
      // Select random offline camera for screamer
      let offlineCameras = [];
      for (let camName in cameraData) {
        if (cameraData[camName].status === "OFFLINE") {
          offlineCameras.push(camName);
        }
      }
      let randomCam = offlineCameras[floor(random(offlineCameras.length))];
      triggerScreamer(randomCam);
      return;
    }
  }
  
  // Reset global attack if fewer than 3 cameras offline
  if (offlineCount < 3 && globalAttackActive) {
    globalAttackActive = false;
    globalAttackTimer = 0;
    console.log("CRITICAL STATUS CLEARED - CAMERAS RESTORED");
  }
  
  // Create new failures only if fewer than 3 cameras offline
  if (systemFailureTimer >= nextFailureTime && !failureInProgress && offlineCount < 3) {
    failureInProgress = true;
    
    let onlineCameras = [];
    for (let camName in cameraData) {
      if (cameraData[camName].status === "ONLINE") {
        onlineCameras.push(camName);
      }
    }
    
    if (onlineCameras.length > 0) {
      let randomIndex = floor(random(onlineCameras.length));
      let cameraToBreak = onlineCameras[randomIndex];
      
      cameraData[cameraToBreak].status = "OFFLINE";
      
      if (audioActive) {
        osc.freq(200);
        setTimeout(() => osc.freq(60), 200);
      }
      
      console.log(`SYSTEM FAILURE: ${cameraToBreak} OFFLINE`);
    }
    
    systemFailureTimer = 0;
    nextFailureTime = random(10, 20);
    failureInProgress = false;
  }
}

// Update screamer timer and handle completion
function updateScreamer() {
  if (screamerActive) {
    screamerTimer += deltaTime / 1000;
    
    if (screamerTimer >= screamerDuration) {
      screamerActive = false;
      resetGame();
    }
  }
}

// Handle game victory condition
function winGame() {
  if (!gameModeActive) return;
  
  gameOver = true;
  gameWon = true;
  
  // Play victory sound
  playVictorySound();
  
  // Hide main interface
  select('canvas').hide();
  select('#controlsContainer').hide();
  
  // Show victory screen
  const victoryScreen = document.getElementById('victoryScreen');
  if (victoryScreen) {
    victoryScreen.style.display = 'flex';
  }
  
  console.log("YOU SURVIVED THE NIGHT!");
}

// Reset game state after screamer
function resetGame() {
  if (!gameModeActive) return;
  
  gameOver = false;
  interfaceBlocked = false;
  screamerActive = false;
  globalAttackActive = false;
  globalAttackTimer = 0;
  powerCircle.charge = 100;
  powerCircle.isCharging = false;
  
  // Restore all cameras
  for (let camName in cameraData) {
    cameraData[camName].status = "ONLINE";
    cameraFailureTimers[camName] = 0;
  }
  
  // Reset audio
  if (audioActive) {
    osc.amp(0.05, 0.5);
  }
  
  // Reset failure system
  systemFailureTimer = 0;
  nextFailureTime = random(10, 20);
  failureInProgress = false;
  
  // Show main interface
  select('canvas').show();
  select('#controlsContainer').show();
}

// Complete game reset function
function completeGameReset() {
  screamerTriggered = false;
  gameOver = false;
  gameWon = false;
  interfaceBlocked = false;
  screamerActive = false;
  globalAttackActive = false;
  globalAttackTimer = 0;
  powerCircle.charge = 100;
  powerCircle.isCharging = false;
  
  // Stop victory sound if playing
  if (victorySound && typeof victorySound.stop === 'function') {
    victorySound.stop();
  }
  
  // Restore all cameras
  for (let camName in cameraData) {
    cameraData[camName].status = "ONLINE";
    cameraFailureTimers[camName] = 0;
  }
  
  // Reset failure system
  systemFailureTimer = 0;
  nextFailureTime = random(10, 20);
  failureInProgress = false;
  
  // Reset clock
  resetGameClock();
  
  // Hide all end screens
  const victoryScreen = document.getElementById('victoryScreen');
  const gameOverScreen = document.getElementById('gameOverScreen');
  if (victoryScreen) victoryScreen.style.display = 'none';
  if (gameOverScreen) gameOverScreen.style.display = 'none';
  
  console.log("COMPLETE GAME RESET - Screamer can trigger again");
}

// Reset game clock to initial state
function resetGameClock() {
  gameTime = 0; // Reset game time
  updateClockDisplay(); // Update clock display
}

// Check if end screen (victory or game over) is visible
function isEndScreenVisible() {
  const gameOverScreen = document.getElementById('gameOverScreen');
  const victoryScreen = document.getElementById('victoryScreen');
  
  return (gameOverScreen && gameOverScreen.style.display === 'flex') || 
         (victoryScreen && victoryScreen.style.display === 'flex') ||
         gameOver || gameWon;
}

// Block camera selection during certain operations
function blockCameraControl(block) {
  if (block) selectedCamera = null;
}