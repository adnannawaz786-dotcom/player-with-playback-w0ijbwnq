// Web Audio API wrapper and utilities for audio processing
class AudioContextManager {
  constructor() {
    this.audioContext = null;
    this.analyserNode = null;
    this.gainNode = null;
    this.sourceNode = null;
    this.isInitialized = false;
  }

  // Initialize audio context (must be called after user interaction)
  async initialize() {
    try {
      if (this.audioContext && this.audioContext.state !== 'closed') {
        return this.audioContext;
      }

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create analyser node for visualizations
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      
      // Connect nodes
      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);

      this.isInitialized = true;
      return this.audioContext;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw new Error('Audio context initialization failed');
    }
  }

  // Resume audio context if suspended
  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.error('Failed to resume audio context:', error);
      }
    }
  }

  // Connect audio element to Web Audio API
  connectAudioElement(audioElement) {
    if (!this.isInitialized || !audioElement) return null;

    try {
      // Disconnect previous source if exists
      if (this.sourceNode) {
        this.sourceNode.disconnect();
      }

      // Create media element source
      this.sourceNode = this.audioContext.createMediaElementSource(audioElement);
      this.sourceNode.connect(this.gainNode);

      return this.sourceNode;
    } catch (error) {
      console.error('Failed to connect audio element:', error);
      return null;
    }
  }

  // Set volume (0 to 1)
  setVolume(volume) {
    if (this.gainNode) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      this.gainNode.gain.setValueAtTime(clampedVolume, this.audioContext.currentTime);
    }
  }

  // Get frequency data for visualizations
  getFrequencyData() {
    if (!this.analyserNode) return new Uint8Array(0);

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  // Get time domain data for waveform
  getTimeDomainData() {
    if (!this.analyserNode) return new Uint8Array(0);

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  // Apply fade in effect
  fadeIn(duration = 1) {
    if (!this.gainNode) return;

    const currentTime = this.audioContext.currentTime;
    this.gainNode.gain.setValueAtTime(0, currentTime);
    this.gainNode.gain.linearRampToValueAtTime(1, currentTime + duration);
  }

  // Apply fade out effect
  fadeOut(duration = 1) {
    if (!this.gainNode) return;

    const currentTime = this.audioContext.currentTime;
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);
  }

  // Crossfade between two audio elements
  crossfade(fromElement, toElement, duration = 2) {
    if (!this.isInitialized) return;

    try {
      // Create separate gain nodes for crossfade
      const fromGain = this.audioContext.createGain();
      const toGain = this.audioContext.createGain();

      // Connect audio elements
      const fromSource = this.audioContext.createMediaElementSource(fromElement);
      const toSource = this.audioContext.createMediaElementSource(toElement);

      fromSource.connect(fromGain);
      toSource.connect(toGain);

      fromGain.connect(this.analyserNode);
      toGain.connect(this.analyserNode);

      // Set initial gain values
      const currentTime = this.audioContext.currentTime;
      fromGain.gain.setValueAtTime(1, currentTime);
      toGain.gain.setValueAtTime(0, currentTime);

      // Crossfade
      fromGain.gain.linearRampToValueAtTime(0, currentTime + duration);
      toGain.gain.linearRampToValueAtTime(1, currentTime + duration);

      return { fromGain, toGain };
    } catch (error) {
      console.error('Crossfade failed:', error);
      return null;
    }
  }

  // Get audio context state
  getState() {
    return {
      state: this.audioContext?.state || 'closed',
      sampleRate: this.audioContext?.sampleRate || 0,
      currentTime: this.audioContext?.currentTime || 0,
      isInitialized: this.isInitialized
    };
  }

  // Cleanup and close audio context
  dispose() {
    try {
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }

      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }

      if (this.analyserNode) {
        this.analyserNode.disconnect();
        this.analyserNode = null;
      }

      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
      }

      this.audioContext = null;
      this.isInitialized = false;
    } catch (error) {
      console.error('Error disposing audio context:', error);
    }
  }
}

// Create singleton instance
const audioContextManager = new AudioContextManager();

// Audio processing utilities
export const audioUtils = {
  // Convert frequency to note
  frequencyToNote(frequency) {
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    if (frequency > 0) {
      const h = Math.round(12 * Math.log2(frequency / C0));
      const octave = Math.floor(h / 12);
      const n = h % 12;
      return noteNames[n] + octave;
    }
    return '';
  },

  // Calculate RMS (Root Mean Square) for volume level
  calculateRMS(dataArray) {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    return Math.sqrt(sum / dataArray.length);
  },

  // Get dominant frequency
  getDominantFrequency(frequencyData, sampleRate) {
    let maxIndex = 0;
    let maxValue = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      if (frequencyData[i] > maxValue) {
        maxValue = frequencyData[i];
        maxIndex = i;
      }
    }

    return (maxIndex * sampleRate) / (frequencyData.length * 2);
  },

  // Smooth frequency data for better visualization
  smoothFrequencyData(frequencyData, smoothingFactor = 0.8) {
    const smoothed = new Uint8Array(frequencyData.length);
    let prev = frequencyData[0];

    for (let i = 0; i < frequencyData.length; i++) {
      smoothed[i] = prev * smoothingFactor + frequencyData[i] * (1 - smoothingFactor);
      prev = smoothed[i];
    }

    return smoothed;
  }
};

// Export the singleton instance and utilities
export default audioContextManager;