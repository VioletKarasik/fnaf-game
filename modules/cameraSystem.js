// Camera system management and utilities

// Camera data and state
let cameraData = {};
let selectedCamera = null;

// Initialize camera data with default values
function initCameraData() {
  const cameraNames = [
    "CAM 1", "CAM 2",        // First row: 2 cameras
    "CAM 3", "CAM 4", "CAM 5", // Second row: 3 cameras  
    "CAM 6", "CAM 7", "CAM 8", // Third row: 3 cameras
    "CAM 9", "CAM 10", "CAM 11", // Fourth row: 3 cameras
    "CAM 12", "CAM 13", "CAM 14"  // Fifth row: 3 cameras
  ];
  
  // All cameras start as ONLINE
  for (let camName of cameraNames) {
    cameraData[camName] = {
      status: "ONLINE",
      alerts: floor(random(0, 5)),
      lastActive: `${nf(floor(random(0, 24)), 2)}:${nf(floor(random(0, 60)), 2)}`,
      signal: nf(random(65, 99), 2, 0)
    };
  }
}

// Initialize camera failure timers
function initCameraFailureTimers() {
  const cameraNames = [
    "CAM 1", "CAM 2", "CAM 3", "CAM 4", "CAM 5", 
    "CAM 6", "CAM 7", "CAM 8", "CAM 9", "CAM 10", 
    "CAM 11", "CAM 12", "CAM 13", "CAM 14"
  ];
  
  for (let camName of cameraNames) {
    cameraFailureTimers[camName] = 0;
  }
}

// Handle camera selection
function handleCameraSelection() {
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
              audioSystem.playCameraSelectSound();
            }
            return;
          }
        }
      }
    }
    selectedCamera = null;
  }
}

// Get camera grid position
function getCameraGrid() {
  return [
    ["CAM 1", "CAM 2", null],
    ["CAM 3", "CAM 4", "CAM 5"], 
    ["CAM 6", "CAM 7", "CAM 8"],
    ["CAM 9", "CAM 10", "CAM 11"],
    ["CAM 12", "CAM 13", "CAM 14"]
  ];
}

// Get camera status
function getCameraStatus(cameraName) {
  return cameraData[cameraName]?.status || "ONLINE";
}

// Set camera status
function setCameraStatus(cameraName, status) {
  if (cameraData[cameraName]) {
    cameraData[cameraName].status = status;
  }
}

// Get all offline cameras
function getOfflineCameras() {
  let offlineCameras = [];
  for (let camName in cameraData) {
    if (cameraData[camName].status === "OFFLINE") {
      offlineCameras.push(camName);
    }
  }
  return offlineCameras;
}

// Get online cameras count
function getOnlineCamerasCount() {
  let count = 0;
  for (let camName in cameraData) {
    if (cameraData[camName].status === "ONLINE") {
      count++;
    }
  }
  return count;
}

// Get offline cameras count
function getOfflineCamerasCount() {
  let count = 0;
  for (let camName in cameraData) {
    if (cameraData[camName].status === "OFFLINE") {
      count++;
    }
  }
  return count;
}

// Get most critical camera (longest offline)
function getMostCriticalCamera() {
  let mostCritical = {name: "", time: 0};
  for (let camName in cameraData) {
    if (cameraData[camName].status === "OFFLINE" && 
        cameraFailureTimers[camName] > mostCritical.time) {
      mostCritical = {name: camName, time: cameraFailureTimers[camName]};
    }
  }
  return mostCritical;
}

// Update camera failure timers
function updateCameraFailureTimers() {
  for (let camName in cameraData) {
    if (cameraData[camName].status === "OFFLINE") {
      cameraFailureTimers[camName] += deltaTime / 1000;
    } else {
      cameraFailureTimers[camName] = 0;
    }
  }
}

// Reset all cameras to online
function resetAllCameras() {
  for (let camName in cameraData) {
    cameraData[camName].status = "ONLINE";
    cameraFailureTimers[camName] = 0;
  }
}

// Randomly disable a camera
function disableRandomCamera() {
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
    return cameraToBreak;
  }
  return null;
}

// Check if camera exists in grid
function isCameraInGrid(cameraName) {
  const cameraGrid = getCameraGrid();
  for (let row of cameraGrid) {
    if (row.includes(cameraName)) {
      return true;
    }
  }
  return false;
}

// Get camera position in grid
function getCameraPosition(cameraName) {
  const cameraGrid = getCameraGrid();
  for (let row = 0; row < cameraGrid.length; row++) {
    for (let col = 0; col < cameraGrid[row].length; col++) {
      if (cameraGrid[row][col] === cameraName) {
        return { row, col };
      }
    }
  }
  return null;
}

// Update camera activity timestamp
function updateCameraActivity(cameraName) {
  if (cameraData[cameraName]) {
    const now = new Date();
    cameraData[cameraName].lastActive = `${nf(now.getHours(), 2)}:${nf(now.getMinutes(), 2)}`;
  }
}

// Update camera signal strength
function updateCameraSignal(cameraName) {
  if (cameraData[cameraName]) {
    // Random signal fluctuation with some logic
    let currentSignal = parseInt(cameraData[cameraName].signal);
    let newSignal = constrain(currentSignal + random(-5, 5), 50, 99);
    cameraData[cameraName].signal = nf(newSignal, 2, 0);
  }
}

// Increment camera alerts
function incrementCameraAlerts(cameraName) {
  if (cameraData[cameraName]) {
    cameraData[cameraName].alerts = min(cameraData[cameraName].alerts + 1, 99);
  }
}

// Reset camera alerts
function resetCameraAlerts(cameraName) {
  if (cameraData[cameraName]) {
    cameraData[cameraName].alerts = 0;
  }
}

// Get camera info for display
function getCameraInfo(cameraName) {
  if (cameraData[cameraName]) {
    return {
      status: cameraData[cameraName].status,
      alerts: cameraData[cameraName].alerts,
      lastActive: cameraData[cameraName].lastActive,
      signal: cameraData[cameraName].signal
    };
  }
  return null;
}

// Check if any camera is in critical state
function hasCriticalCameras() {
  for (let camName in cameraData) {
    if (cameraData[camName].status === "OFFLINE" && 
        cameraFailureTimers[camName] > attackThreshold * 0.7) {
      return true;
    }
  }
  return false;
}

// Get critical cameras count
function getCriticalCamerasCount() {
  let count = 0;
  for (let camName in cameraData) {
    if (cameraData[camName].status === "OFFLINE" && 
        cameraFailureTimers[camName] > attackThreshold * 0.7) {
      count++;
    }
  }
  return count;
}