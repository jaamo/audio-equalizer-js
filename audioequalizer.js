

/********************* EQUALIZER *******************************/
// Based on great tutorial found from:
// https://dzone.com/articles/exploring-html5-web-audio


/**
 * Class for generating audio spectrum.
 */
var Equalizer = new Function();


/**
 * Variables.
 */
Equalizer.prototype.context = new AudioContext();
Equalizer.prototype.audioBuffer = [];
Equalizer.prototype.sourceNode = {};
Equalizer.prototype.analyser = {};
Equalizer.prototype.javascriptNode = {};
Equalizer.prototype.audioData = [];
Equalizer.prototype.fftSize = 512;


/**
 * Load audio file and start playing it. 
 */
Equalizer.prototype.play = function(url, loadCallback) {

  var self = this;
  
  // If AudioContext is not set (which is most probably the case)
  // try to use webkit specific context.
  if (! window.AudioContext) {
    if (! window.webkitAudioContext) {
      alert('no audiocontext found');
    }
    window.AudioContext = window.webkitAudioContext;
  }
  
  // Create a javascriptnode that is called whenever 
  // the 2048 frames have been sampled.
  this.javascriptNode = this.context.createScriptProcessor(2048, 1, 1);

  // Connect to destination.
  this.javascriptNode.connect(this.context.destination);

  // Bind audio processor.
  this.javascriptNode.onaudioprocess = function() {
    self.processAudio();
  };
  
  // Setup an analyzer.
  this.analyser = this.context.createAnalyser();
  this.analyser.smoothingTimeConstant = 0.2;

  // The fftSize determine how many buckets we get containing 
  // frequency information. If we have a fftSize of 1024 we get 512 buckets.   
  this.analyser.fftSize = this.fftSize;

  // Create a buffer source node and connect analyzer to it.
  this.sourceNode = this.context.createBufferSource();
  this.sourceNode.connect(this.analyser);
  
  // Connect analyser to javascriptNode.
  this.analyser.connect(this.javascriptNode);

  // Aaaaand connect sourceNode to destination.
  this.sourceNode.connect(this.context.destination);  

  // Then start loading the sound file.
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  // On load callback.
  request.onload = function() {

    // Decode the data.
    self.context.decodeAudioData(request.response, function(buffer) {

      // Play sound when it's completely decoded.
      self.playSound(buffer);

      if (typeof(loadCallback) !== "unefined") {
        loadCallback();
      }
      
    }, self.onLoadError);
  }

  // Fire request.
  request.send();
  
}


/**
 * Start playing sound.
 */
Equalizer.prototype.playSound = function(buffer) {

  this.sourceNode.buffer = buffer;
  this.sourceNode.start(0);

}


/**
 * Audio file couldn't load.
 */
Equalizer.prototype.onLoadError = function(e) {
  console.log(e);
}


/** 
 * Process audio samples and save values to an array.
 */
Equalizer.prototype.processAudio = function() {

  // Get the average for the first channel.
  this.audioData =  new Uint8Array(this.analyser.frequencyBinCount);
  this.analyser.getByteFrequencyData(this.audioData);

}


/** 
 * Return the current spectrum.
 */
Equalizer.prototype.getSpectrum = function() {
  return this.audioData;
}

/** 
 * Return the current spectrum at given bucket.
 */
Equalizer.prototype.getSpectrumAt = function(i) {
  return typeof(this.audioData[i]) !== "undefined" ? this.audioData[i] : 0;
}

/**
 * Get bucket value by giving "frequency percentage" or something.
 * I'm too tired to truly explain what the fuck this method does... 
 * just read the source and cry.
 * 
 * @param {Number} p Float between 0-1. 
 */
Equalizer.prototype.getSpectrumByPercentage = function(p) {
  var i = Math.floor(p * this.audioData.length);
  
  return typeof(this.audioData[i]) !== "undefined" ? this.audioData[i] : 0;
}