// UI Components and drawing functions

// Draw system status panel at bottom of screen
function drawSystemStatusPanel() {
  let panelY = cellH * rows + 10;
  let panelHeight = 60;
  
  push();
  // Panel background
  fill(10, 15, 10, 200);
  stroke(50, 80, 50);
  strokeWeight(1);
  rect(0, panelY, width, panelHeight);
  
  // Divider lines
  stroke(40, 60, 40);
  line(width/3, panelY + 5, width/3, panelY + panelHeight - 5);
  line(2*width/3, panelY + 5, 2*width/3, panelY + panelHeight - 5);

  // Left section: System metrics
  textFont('VT323');
  textSize(18);
  textAlign(LEFT);
  
  // Ecto level timer (pseudo-random system metric)
  let ectoLevel = nf((sin(frameCount * 0.01) + 1) * 4 + 1, 1, 0);
  let ectoSymbol = ["∿", "Ø", "Æ", "∞", "∆"][floor(ectoLevel / 2)];
  let ectoColor = color(100 + ectoLevel * 20, 200 - ectoLevel * 15, 50 + ectoLevel * 10);
  drawSystemIndicator(25, panelY + 20, `${ectoSymbol} ECTO: ${ectoLevel}`, ectoColor);
  
  // Offline systems count
  let offlineCount = 0;
  for (let camName in cameraData) {
    if (cameraData[camName].status === "OFFLINE") offlineCount++;
  }
  drawSystemIndicator(25, panelY + 40, `OFFLINE: ${offlineCount}`, offlineCount > 0 ? '#ff4444' : '#55ff55');

  // Center section: Selected camera info
  textAlign(CENTER);
  fill(150, 200, 150);
  
  if (selectedCamera && cameraData[selectedCamera]) {
    let cam = cameraData[selectedCamera];
    text(`${selectedCamera}: ${cam.status}`, width/2, panelY + 20);
    text(`ALERTS: ${cam.alerts}`, width/2, panelY + 40);
  } else {
    text("SELECT CAMERA", width/2, panelY + 20);
    text("CLICK ON FEED", width/2, panelY + 40);
  }

  // Right section: Additional camera info
  textAlign(RIGHT);
  
  if (selectedCamera && cameraData[selectedCamera]) {
    let cam = cameraData[selectedCamera];
    text(`SIG: ${cam.signal}%`, width - 10, panelY + 20);
    text(`LAST: ${cam.lastActive}`, width - 10, panelY + 40);
  } else {
    drawPulseIndicator(width - 20, panelY + 20, "READY");
    drawScanningRadar(width - 10, panelY + 40);
    drawProgressBar(width - 140, panelY + 40, 120, 8, random(0, 1), '#0f0', '#030');
  }

  // Highlight selected camera
  if (selectedCamera) {
    const cameraGrid = [
      ["CAM 1", "CAM 2", null],
      ["CAM 3", "CAM 4", "CAM 5"], 
      ["CAM 6", "CAM 7", "CAM 8"],
      ["CAM 9", "CAM 10", "CAM 11"],
      ["CAM 12", "CAM 13", "CAM 14"]
    ];
    
    let found = false;
    for (let row = 0; row < cameraGrid.length; row++) {
      for (let col = 0; col < cameraGrid[row].length; col++) {
        if (cameraGrid[row][col] === selectedCamera) {
          stroke(255, 0, 0);
          strokeWeight(2);
          noFill();
          rect(col * cellW, row * cellH, cellW, cellH);
          found = true;
          break;
        }
      }
      if (found) break;
    }
  }

  pop();
}

// Draw system status indicator with blinking effect
function drawSystemIndicator(x, y, label, colorVal) {
  push();
  if (frameCount % 60 < 30) {
    fill(colorVal);
    ellipse(x - 15, y - 4, 6, 6);
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = colorVal;
  }
  fill(180, 220, 180);
  noStroke();
  text(label, x, y);
  pop();
}

// Draw pulsing indicator for system status
function drawPulseIndicator(x, y, label) {
  push();
  let pulseSize = map(sin(frameCount * 0.1), -1, 1, 3, 8);
  fill(255, 0, 0, map(sin(frameCount * 0.2), -1, 1, 100, 200));
  ellipse(x - 60, y - 4, pulseSize, pulseSize);
  fill(180, 220, 180);
  noStroke();
  text(label, x, y);
  pop();
}

// Draw scanning radar animation
function drawScanningRadar(x, y) { 
  push(); 
  let angle = frameCount * 0.05; 
  let radarSize = 12; 
  noFill(); 
  stroke(0, 200, 0); 
  ellipse(x - 90, y - 24, radarSize, radarSize); 
  push();
  translate(x - 90, y - 24); 
  rotate(angle); 
  stroke(0, 255, 0, 150); 
  line(0, 0, radarSize/2, 0); 
  pop(); 
  pop();
}

// Draw Matrix-style raining code effect
function drawMatrixRain() {
  push();
  textFont('Share Tech Mono');
  textSize(14);
  fill(0, 255, 0, 80);
  
  for (let i = 0; i < 3; i++) {
    let x = random(width);
    let y = random(cellH * rows + 5, height);
    let chars = "ERR0x1A2B!SIG!ALERT!";
    let randomChar = chars.charAt(floor(random(chars.length)));
    text(randomChar, x, y);
  }
  pop();
}

// Draw progress bar UI element
function drawProgressBar(x, y, w, h, progress, color, bgColor) {
  push();
  fill(bgColor);
  noStroke();
  rect(x, y, w, h);
  fill(color);
  rect(x, y, w * progress, h);
  pop();
}

// Draw individual security camera cell
function drawSecurityCell(img, col, row, label, borderColor) {
  push();
  let x = col * cellW + random(-0.15,0.15);
  let y = row * cellH + random(-0.15,0.15);

  const cameraGrid = [
    ["CAM 1", "CAM 2", null],
    ["CAM 3", "CAM 4", "CAM 5"], 
    ["CAM 6", "CAM 7", "CAM 8"],
    ["CAM 9", "CAM 10", "CAM 11"],
    ["CAM 12", "CAM 13", "CAM 14"]
  ];
  
  let camName = cameraGrid[row][col];
  let camStatus = cameraData[camName]?.status || "ONLINE";
  
  // If camera offline - black screen
  if (camStatus === "OFFLINE") {
    fill(0);
    noStroke();
    rect(x + 4, y + 4, cellW - 8, cellH - 8);
    
    // "NO SIGNAL" effect
    textFont('VT323');
    textSize(16);
    fill('#ff4444');
    textAlign(CENTER, CENTER);
    text("NO SIGNAL", x + cellW/2, y + cellH/2);
  } else {
    // Normal display for online cameras
    drawingContext.globalAlpha = 0.9;
    image(img, x + 4, y + 4, cellW - 8, cellH - 8);
    drawingContext.globalAlpha = 1.0;
  }

  stroke(borderColor);
  strokeWeight(1);
  noFill();
  rect(x + 2, y + 2, cellW - 4, cellH - 4);

  // Camera label with status color
  textFont('VT323');
  textSize(16);
  fill(0, 120);
  noStroke();
  rect(x + 4, y + cellH - 14, cellW - 8, 10);

  let statusColor = camStatus === "OFFLINE" ? '#ff4444' : borderColor;
  fill(statusColor);
  textAlign(CENTER, CENTER);
  text(label, x + cellW / 2, y + cellH - 9);

  // Activity indicator ONLY for selected camera
  if (selectedCamera === camName && frameCount % 60 < 30 && camStatus !== "OFFLINE") {
    fill('#00d636');
    ellipse(x + 12, y + 12, 9 + random(1), 9 + random(1));
  }

  pop();
}

// Draw system interface elements
function drawSystemInterface() {
  push();
  textFont('Share Tech Mono');
  textSize(16);
  fill('#888');
  textAlign(RIGHT);
  
  text("SYSTEM ACTIVE", width - 10, 40);

  // Power level indicator
  text(`PWR: ${nf(powerLevel, 2, 1)}%`, width - 10, 55);
  noFill();
  stroke('#666');
  rect(width - 60, 60, 50, 4);
  fill('#ccc');
  noStroke();
  rect(width - 60, 60, powerLevel / 2, 4);

  // CPU usage indicator
  text(`CPU: ${nf(systemUsage, 2, 1)}%`, width - 10, 80);
  noFill();
  stroke('#666');
  rect(width - 60, 85, 50, 4);
  fill('#999');
  noStroke();
  rect(width - 60, 85, systemUsage / 2, 4);

  // Recording indicator
  if (isRecording) {
    fill('#ff0000');
    text("● REC", width - 10, 105);
  }
  
  pop();
}

// Draw capture status indicator
function drawCaptureStatus() {
  push();
  textFont('VT323');
  textSize(14);
  fill(0, 255, 0);
  textAlign(CENTER);
  text("SNAPSHOT CAPTURED", width/2, height - 15);
  
  if (frameCount % 60 < 30) {
    fill(0, 255, 0);
    ellipse(width/2 - 80, height - 20, 4, 4);
  }
  pop();
}

// Draw dark background with subtle effects
function drawDarkBackground() {
  background(5, 10, 5);
  
  for (let i = 0; i < 5; i++) {
    let y = random(height);
    stroke(50 + random(50), 100 + random(50), 50 + random(50), 50 + random(30));
    line(0, y, width, y);
  }

  if (random() < 0.05) { 
    fill(50, 255, 50, random(20, 50));
    noStroke();
    rect(random(width), random(height), random(20, 50), random(2, 10));
  }
}

// Draw static noise effect
function drawStaticNoise() {
  push();
  blendMode(LIGHTEST);
  for (let i = 0; i < 50; i++) {
    let x = random(width);
    let y = random(height);
    let size = random(1, 2);
    let alpha = random(5, 15);
    fill(255, alpha);
    noStroke();
    rect(x, y, size, size);
  }
  blendMode(BLEND);
  pop();
}

// Draw security camera view when no snapshot
function drawSecurityCameraView() {
  push();
  
  tint(150, 150, 150);
  image(video, 0, 0, cellW, cellH);

  textFont('VT323'); 
  textSize(22);
  fill('#888');
  textAlign(CENTER, CENTER);
  text('CAMERA READY', width / 2, height / 2 - 20);

  textSize(20);
  fill('#666');
  text('[CLICK CAPTURE BUTTON OR PRESS S]', width / 2, height / 2 + 10);

  if (frameCount % 60 < 30) {
    fill('#ff0000');
    ellipse(width / 2 - 20, height / 2 + 30, 4, 4);
    fill('#888');
    textSize(18);
    text('REC', width / 2, height / 2 + 30);
  }
  
  textSize(16);
  fill('#555');
  text('Use captured image for processing', width / 2, height / 2 + 50);
  text('Press 0-4 to apply different filters', width / 2, height / 2 + 70);
  
  pop();
}

// Draw VHS tape distortion effects
function drawVHSEffects() {
  push();
  stroke(50, 255, 50, 50);
  strokeWeight(1);
  for (let y = 0; y < height; y += 3) {
    if (random() > 0.95) {
      line(0, y + random(-1,1), width, y + random(-1,1));
    }
  }
  translate(random(-1,1), random(-1,1));
  pop();
}

// Draw random glitch effects
function drawGlitchEffects() {
  push();
  translate(random(-2,2), random(-2,2));
  
  // Horizontal glitch lines
  for (let i = 0; i < 4; i++) {
    let y = random(height);
    let h = random(2, 6);
    fill(200, 200, 180, 80);
    noStroke();
    rect(0, y, width, h);
  }

  // Additive blending for bright pixels
  blendMode(ADD);
  for (let i = 0; i < 15; i++) {
    let x = random(width);
    let y = random(height);
    let size = random(1,3);
    fill(50, 255, 50, random(50,100));
    rect(x, y, size, size);
  }
  blendMode(BLEND);
  pop();
}

// Draw hidden camera timers when cameras are offline
function drawHiddenCameraTimers() {
  if (gameOver || screamerActive) return;
  
  // Check for offline cameras
  let offlineCameras = [];
  for (let camName in cameraData) {
    if (cameraData[camName].status === "OFFLINE") {
      offlineCameras.push(camName);
    }
  }
  
  if (offlineCameras.length > 0) {
    push();
    background(0, 100);
    textFont('VT323');
    textSize(24);
    textAlign(CENTER, CENTER);
    fill(255, 0, 0);
    
    // Warning about offline cameras
    text("WARNING: CAMERAS OFFLINE", width/2, height/2 - 50);
    
    textSize(18);
    fill(200);
    text(`Offline cameras: ${offlineCameras.length}`, width/2, height/2);
    
    // Show most critical timer
    let mostCritical = {name: "", time: 0};
    for (let camName of offlineCameras) {
      if (cameraFailureTimers[camName] > mostCritical.time) {
        mostCritical = {name: camName, time: cameraFailureTimers[camName]};
      }
    }
    
    let timeLeft = max(0, attackThreshold - mostCritical.time);
    let dangerLevel = map(timeLeft, 0, attackThreshold, 255, 0);
    
    fill(255, dangerLevel, dangerLevel);
    text(`Most critical: ${mostCritical.name} - ${nf(timeLeft, 2, 1)}s`, width/2, height/2 + 30);
    
    // Blinking warning
    if (frameCount % 60 < 30) {
      fill(255, 0, 0);
      text("OPEN CAMERAS TO REBOOT", width/2, height/2 + 60);
    }
    
    pop();
  }
}

// Create horror-themed interface controls
function createHorrorInterface(controls) {
  let rgbContainer = createDiv().class('slider-container').parent(controls);
  createDiv('RED').parent(rgbContainer).class('slider-label');
  rSlider = createSlider(0, 255, 127).parent(rgbContainer).style('width', '120px').style('accent-color', '#666');
  
  createDiv('GREEN').parent(rgbContainer).class('slider-label');
  gSlider = createSlider(0, 255, 127).parent(rgbContainer).style('width', '120px').style('accent-color', '#666');
  
  createDiv('BLUE').parent(rgbContainer).class('slider-label');
  bSlider = createSlider(0, 255, 127).parent(rgbContainer).style('width', '120px').style('accent-color', '#666');

  let csContainer = createDiv().class('slider-container').parent(controls);
  createDiv('HSV').parent(csContainer).class('slider-label');
  cs1Slider = createSlider(0, 255, 127).parent(csContainer).style('width', '120px').style('accent-color', '#666');
  
  createDiv('YCrCb').parent(csContainer).class('slider-label');
  cs2Slider = createSlider(0, 255, 127).parent(csContainer).style('width', '120px').style('accent-color', '#666');
}

// Update button styles based on interface state
function updateButtonStyles() {
  const leftButton = select('#leftButton');
  const rightButton = select('#rightButton');
  
  if (interfaceBlocked) {
    // Styles for blocked state
    leftButton.style('opacity', '0.5');
    leftButton.style('cursor', 'not-allowed');
    rightButton.style('opacity', '0.5');
    rightButton.style('cursor', 'not-allowed');
    captureButton.style('opacity', '0.5');
    captureButton.style('cursor', 'not-allowed');
  } else {
    // Styles for unblocked state
    leftButton.style('opacity', '1');
    leftButton.style('cursor', 'pointer');
    rightButton.style('opacity', '1');
    rightButton.style('cursor', 'pointer');
    captureButton.style('opacity', '1');
    captureButton.style('cursor', 'pointer');
  }
}