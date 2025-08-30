// Audio system management and fallback sounds

// Audio variables
let osc;
let audioActive = false;

// Initialize audio system
function initAudioSystem() {
  // Audio oscillator for system sounds
  osc = new p5.Oscillator('sine');
  osc.freq(60);
  osc.amp(0);
  osc.start();
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

// Try alternative file paths if primary sound loading fails
function tryAlternativeSoundPaths() {
  const alternativePaths = [
    './assets/screamer.mp3',
    'screamer.mp3',
    './screamer.mp3',
    'assets/screamer.wav',
    './assets/screamer.wav'
  ];
  
  let currentIndex = 0;
  
  // Recursive function to try each path sequentially
  function tryNextPath() {
    if (currentIndex >= alternativePaths.length) {
      console.log('All alternative paths failed, using fallback sound');
      screamerSound = createFallbackScreamerSound();
      assetsLoaded = true;
      return;
    }
    
    const path = alternativePaths[currentIndex];
    console.log('Trying sound path:', path);
    
    try {
      screamerSound = loadSound(path,
        () => {
          console.log('Screamer sound loaded from alternative path:', path);
          assetsLoaded = true;
        },
        (err) => {
          console.error('Error loading from', path, err);
          currentIndex++;
          tryNextPath();
        }
      );
    } catch (e) {
      console.error('Error trying path', path, e);
      currentIndex++;
      tryNextPath();
    }
  }
  
  tryNextPath();
}

// Load victory sound with fallback
function loadVictorySound() {
  try {
    victorySound = loadSound('assets/victory.mp3',
      () => {
        console.log('Victory sound loaded successfully');
      },
      (err) => {
        console.error('Error loading victory sound:', err);
        victorySound = createFallbackVictorySound();
      }
    );
  } catch (e) {
    console.error('Error loading victory sound:', e);
    victorySound = createFallbackVictorySound();
  }
}

// Create programmatic fallback sound effect
function createFallbackScreamerSound() {
  console.log('Creating fallback screamer sound');
  return {
    play: function() {
      try {
        // Handle audio context state
        let context = getAudioContext();
        if (context.state !== 'running') {
          context.resume().then(() => {
            this.playRealSound();
          });
        } else {
          this.playRealSound();
        }
      } catch (e) {
        console.error('Error in fallback sound:', e);
      }
    },
    
    // Create realistic screamer sound using Web Audio API
    playRealSound: function() {
      try {
        let osc1 = new p5.Oscillator('sawtooth');
        let osc2 = new p5.Oscillator('square');
        let filter = new p5.LowPass();
        let reverb = new p5.Reverb();
        
        // Set initial frequencies
        osc1.freq(150);
        osc2.freq(300);
        osc1.amp(0.6);
        osc2.amp(0.4);
        
        osc1.start();
        osc2.start();
        
        // Apply audio processing
        filter.freq(1000);
        filter.res(10);
        
        // Create effect chain
        osc1.disconnect();
        osc2.disconnect();
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(reverb);
        reverb.connect();
        
        // Build-up effect
        osc1.freq(600, 0.3);
        osc2.freq(800, 0.3);
        filter.freq(2000, 0.2);
        
        // Fade out and stop after 1 second
        setTimeout(() => {
          osc1.amp(0, 0.3);
          osc2.amp(0, 0.3);
          setTimeout(() => {
            osc1.stop();
            osc2.stop();
          }, 300);
        }, 1000);
        
      } catch (e) {
        console.error('Error creating fallback sound effect:', e);
      }
    },
    
    // Volume control compatibility stub
    setVolume: function(vol) {
      // Placeholder for compatibility
    }
  };
}

// Creating fallback victory sound using Web Audio API
function createFallbackVictorySound() {
  console.log('Creating fallback victory sound');
  return {
    play: function() {
      try {
        let context = getAudioContext();
        if (context.state !== 'running') {
          context.resume().then(() => {
            this.playRealSound();
          });
        } else {
          this.playRealSound();
        }
      } catch (e) {
        console.error('Error in fallback victory sound:', e);
      }
    },
    
    playRealSound: function() {
      try {
        // Create positive victory sound using major chord (C-E-G)
        let osc1 = new p5.Oscillator('sine');
        let osc2 = new p5.Oscillator('sine');
        let osc3 = new p5.Oscillator('sine');
        
        osc1.freq(261.63); // C4
        osc2.freq(329.63); // E4
        osc3.freq(392.00); // G4
        
        osc1.amp(0.3);
        osc2.amp(0.2);
        osc3.amp(0.2);
        
        osc1.start();
        osc2.start();
        osc3.start();
        
        // Fade out effect
        osc1.amp(0, 2.0);
        osc2.amp(0, 1.8);
        osc3.amp(0, 1.6);
        
        // Stop oscillators after fadeout
        setTimeout(() => {
          osc1.stop();
          osc2.stop();
          osc3.stop();
        }, 2000);
        
      } catch (e) {
        console.error('Error creating fallback victory sound effect:', e);
      }
    },
    
    setVolume: function(vol) {
      // Compatibility stub
    }
  };
}

// Play fallback sound if audio file fails
function playFallbackSound() {
  if (screamerSound && typeof screamerSound.play === 'function') {
    screamerSound.play();
  } else {
    const fallback = createFallbackScreamerSound();
    fallback.play();
  }
}

// Play victory sound with audio context handling
function playVictorySound() {
  if (victorySound && typeof victorySound.play === 'function') {
    // Wake audio context if needed
    if (typeof getAudioContext().resume === 'function') {
      getAudioContext().resume().then(() => {
        victorySound.play();
      });
    } else {
      victorySound.play();
    }
  } else {
    // Fallback if sound failed to load
    const fallback = createFallbackVictorySound();
    fallback.play();
  }
}

// Audio context initialization
let audioContextInitialized = false;

// Initialize audio context for screamer sound
function initializeAudioContext() {
    if (!audioContextInitialized) {
        const audio = document.getElementById('screamerAudio');
        if (audio) {
            audio.play().then(() => {
                audio.pause();
                audio.currentTime = 0;
                audioContextInitialized = true;
                console.log('Audio context initialized');
            }).catch((e) => {
                console.log('Audio context initialization failed:', e);
            });
        }
    }
}

// Toggle audio feed
function toggleAudioFeed() {
  if (interfaceBlocked) return;
  
  // Resume AudioContext on first click
  if (typeof getAudioContext().resume === 'function') {
    getAudioContext().resume().then(() => {
      console.log('AudioContext resumed successfully');
      userStartAudio();
      
      if (!audioActive) {
        osc.amp(0.05, 0.05);        
        return "🔊 AUDIO ACTIVE";
      } else {
        osc.amp(0, 0.05);           
        return "🔇 ENABLE AUDIO FEED";
      }
      audioActive = !audioActive;
    });
  } else {
    userStartAudio();
  }
}

// Play system sound effect
function playSystemSound(frequency, duration = 100) {
  if (audioActive) {
    osc.freq(frequency);
    setTimeout(() => osc.freq(60), duration);
  }
}

// Play camera selection sound
function playCameraSelectSound() {
  playSystemSound(400, 50);
}

// Play reboot sound
function playRebootSound() {
  playSystemSound(300, 100);
}

// Play camera system sound
function playCameraSystemSound() {
  playSystemSound(250, 100);
}

// Play failure sound
function playFailureSound() {
  playSystemSound(200, 200);
}

// Play charging sound
function playChargingSound() {
  playSystemSound(300, 100);
}