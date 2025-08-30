// Image processing functions

// Convert image to grayscale with increased brightness
function toGrayBright(srcImg) {
  let img = srcImg.get();
  img.loadPixels();
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let i = (y * img.width + x) * 4;
      let gray = (img.pixels[i] + img.pixels[i + 1] + img.pixels[i + 2]) / 3;
      gray = min(gray * 1.2, 255);
      img.pixels[i] = img.pixels[i + 1] = img.pixels[i + 2] = gray;
    }
  }
  img.updatePixels();
  return img;
}

// Extract single color channel from image
function channelImg(srcImg, channelIndex) {
  let img = srcImg.get();
  img.loadPixels();
  for (let i = 0; i < img.pixels.length; i += 4) {
    img.pixels[i] = (channelIndex === 0 ? img.pixels[i] : 0);
    img.pixels[i + 1] = (channelIndex === 1 ? img.pixels[i + 1] : 0);
    img.pixels[i + 2] = (channelIndex === 2 ? img.pixels[i + 2] : 0);
  }
  img.updatePixels();
  return img;
}

// Apply threshold to specific color channel
function thresholdChannel(srcImg, channelIndex, t) {
  let img = srcImg.get();
  img.loadPixels();
  for (let i = 0; i < img.pixels.length; i += 4) {
    let val = img.pixels[i + channelIndex];
    let out = val > t ? 255 : 0;
    img.pixels[i] = img.pixels[i + 1] = img.pixels[i + 2] = out;
  }
  img.updatePixels();
  return img;
}

// Convert RGB to HSV color space
function convertColorSpace1(srcImg) {
  let img = srcImg.get();
  img.loadPixels();
  for (let i = 0; i < img.pixels.length; i += 4) {
    let r = img.pixels[i] / 255;
    let g = img.pixels[i + 1] / 255;
    let b = img.pixels[i + 2] / 255;
    let cmax = max(r, g, b);
    let cmin = min(r, g, b);
    let diff = cmax - cmin;
    let h = 0, s = 0, v = cmax;
    if (diff !== 0) {
      if (cmax === r) h = (60 * ((g - b) / diff) + 360) % 360;
      else if (cmax === g) h = (60 * ((b - r) / diff) + 120) % 360;
      else h = (60 * ((r - g) / diff) + 240) % 360;
      s = (cmax === 0 ? 0 : diff / cmax);
    }
    img.pixels[i] = h / 360 * 255;
    img.pixels[i + 1] = s * 255;
    img.pixels[i + 2] = v * 255;
  }
  img.updatePixels();
  return img;
}

// Convert RGB to YCrCb color space
function convertColorSpace2(srcImg) {
  let img = srcImg.get();
  img.loadPixels();
  for (let i = 0; i < img.pixels.length; i += 4) {
    let r = img.pixels[i];
    let g = img.pixels[i + 1];
    let b = img.pixels[i + 2];
    let y = 0.299 * r + 0.587 * g + 0.114 * b;
    let cr = (r - y) * 0.713 + 128;
    let cb = (b - y) * 0.564 + 128;
    img.pixels[i] = y;
    img.pixels[i + 1] = cr;
    img.pixels[i + 2] = cb;
  }
  img.updatePixels();
  return img;
}

// Apply threshold to entire image
function thresholdImage(srcImg, t) {
  let img = srcImg.get();
  img.loadPixels();
  for (let i = 0; i < img.pixels.length; i += 4) {
    let avg = (img.pixels[i] + img.pixels[i + 1] + img.pixels[i + 2]) / 3;
    let out = avg > t ? 255 : 0;
    img.pixels[i] = img.pixels[i + 1] = img.pixels[i + 2] = out;
  }
  img.updatePixels();
  return img;
}

// Pixelate image by reducing resolution and scaling up
function pixelateImage(img, blocksX = 25) {
  let w = img.width;
  let h = img.height;
  let pixelSize = w / blocksX;
  let blocksY = Math.max(1, Math.floor(h / pixelSize));

  let temp = createImage(w, h);
  temp.copy(img, 0, 0, w, h, 0, 0, w, h);
  temp.resize(blocksX, blocksY);

  let result = createImage(w, h);
  result.drawingContext.imageSmoothingEnabled = false;
  result.copy(temp, 0, 0, blocksX, blocksY, 0, 0, w, h);

  return result;
}

// Apply custom blur effect with multiple iterations
function applyCustomBlur(img, intensity) {
  let blurred = createImage(img.width, img.height);
  blurred.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
  for (let i = 0; i < intensity; i++) {
    blurred.filter(BLUR, 1);
  }
  return blurred;
}

// Apply face effect based on selected filter
function applyFaceEffect(faceCrop) {
  let processed = faceCrop.get();

  if (faceEffect === 1) {
    // Grayscale conversion
    processed.loadPixels();
    for (let i = 0; i < processed.pixels.length; i += 4) {
      let r = processed.pixels[i];
      let g = processed.pixels[i + 1];
      let b = processed.pixels[i + 2];
      let bright = (0.3 * r + 0.59 * g + 0.11 * b);
      processed.pixels[i] = processed.pixels[i + 1] = processed.pixels[i + 2] = bright;
    }
    processed.updatePixels();
  } else if (faceEffect === 2) {
    // Blur effect
    processed = applyCustomBlur(processed, 6);
  } else if (faceEffect === 3) {
    // Color space conversion
    processed = convertColorSpace1(processed);
  } else if (faceEffect === 4) {
    // Pixelation effect
    processed = pixelateImage(processed, 20);
  }

  return processed;
}

// Draw face detection cell with processing
function drawFaceDetectionCell(col, row) {
  let faceImg = snapshot.get();
  faces = detector.detect(faceImg.canvas);

  let status = "NO SIGNAL";
  let validFace = null;

  for (let f of faces) {
    if (f[4] > 4 && f[2] > 20 && f[3] > 20) {
      validFace = f;
      break;
    }
  }

  if (validFace) status = "DETECTED";

  drawSecurityCell(faceImg, col, row, `CAM 12: ${status}`, "#ccc");

  if (validFace) {
    push();
    translate(col * cellW, row * cellH);

    let faceCrop = faceImg.get(validFace[0], validFace[1], validFace[2], validFace[3]);
    let processed = applyFaceEffect(faceCrop);

    image(processed, validFace[0], validFace[1], validFace[2], validFace[3]);

    stroke(255, 0, 0);
    noFill();
    strokeWeight(2);
    rect(validFace[0], validFace[1], validFace[2], validFace[3]);

    pop();
  }
}

// Draw grid of camera cells with processed images
function drawGridCells() {
  // Row 1: Original and grayscale
  drawSecurityCell(snapshot, 0, 0, "CAM 1", '#ccc');
  drawSecurityCell(toGrayBright(snapshot), 1, 0, "CAM 2", '#ccc');

  // Row 2: RGB Channels
  drawSecurityCell(channelImg(snapshot, 0), 0, 1, "CAM 3", '#ccc');
  drawSecurityCell(channelImg(snapshot, 1), 1, 1, "CAM 4", '#ccc');
  drawSecurityCell(channelImg(snapshot, 2), 2, 1, "CAM 5", '#ccc');

  // Row 3: Thresholds
  drawSecurityCell(thresholdChannel(snapshot, 0, rSlider.value()), 0, 2, `R ${rSlider.value()}`, '#ccc');
  drawSecurityCell(thresholdChannel(snapshot, 1, gSlider.value()), 1, 2, `G ${gSlider.value()}`, '#ccc');
  drawSecurityCell(thresholdChannel(snapshot, 2, bSlider.value()), 2, 2, `B ${bSlider.value()}`, '#ccc');

  // Row 4: Color Spaces
  let cs1 = convertColorSpace1(snapshot);
  let cs2 = convertColorSpace2(snapshot);
  drawSecurityCell(snapshot, 0, 3, "REF", '#ccc');
  drawSecurityCell(cs1, 1, 3, "HSV", '#ccc');
  drawSecurityCell(cs2, 2, 3, "YCC", '#ccc');

  // Row 5: Face detection and thresholds
  drawFaceDetectionCell(0, 4);
  drawSecurityCell(thresholdImage(cs1, cs1Slider.value()), 1, 4, `H ${cs1Slider.value()}`, '#ccc');
  drawSecurityCell(thresholdImage(cs2, cs2Slider.value()), 2, 4, `Y ${cs2Slider.value()}`, '#ccc');
}