// LocalStorage management for audio files and metadata
const STORAGE_KEYS = {
  AUDIO_FILES: 'player_audio_files',
  CURRENT_PLAYLIST: 'player_current_playlist',
  PLAYBACK_STATE: 'player_playback_state',
  USER_PREFERENCES: 'player_user_preferences'
};

// Convert file to base64 for storage
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// Generate unique ID for audio files
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Extract metadata from audio file
const extractMetadata = async (file) => {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
      const metadata = {
        duration: audio.duration,
        name: file.name.replace(/\.[^/.]+$/, ""),
        fileName: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      };
      URL.revokeObjectURL(url);
      resolve(metadata);
    });

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve({
        duration: 0,
        name: file.name.replace(/\.[^/.]+$/, ""),
        fileName: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
    });

    audio.src = url;
  });
};

// Check if localStorage is available and has space
const checkStorageAvailability = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

// Get storage usage information
const getStorageInfo = () => {
  if (!checkStorageAvailability()) {
    return { used: 0, available: 0, total: 0 };
  }

  let used = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length;
    }
  }

  // Rough estimate of localStorage limit (usually 5-10MB)
  const total = 10 * 1024 * 1024; // 10MB estimate
  const available = total - used;

  return {
    used: used,
    available: available,
    total: total,
    usedMB: (used / (1024 * 1024)).toFixed(2),
    availableMB: (available / (1024 * 1024)).toFixed(2)
  };
};

// Save audio file to localStorage
export const saveAudioFile = async (file) => {
  if (!checkStorageAvailability()) {
    throw new Error('LocalStorage is not available');
  }

  try {
    const base64Data = await fileToBase64(file);
    const metadata = await extractMetadata(file);
    const id = generateId();

    const audioFile = {
      id,
      data: base64Data,
      metadata,
      createdAt: new Date().toISOString(),
      playCount: 0,
      lastPlayed: null
    };

    const existingFiles = getAudioFiles();
    const updatedFiles = [...existingFiles, audioFile];

    localStorage.setItem(STORAGE_KEYS.AUDIO_FILES, JSON.stringify(updatedFiles));
    
    return audioFile;
  } catch (error) {
    throw new Error(`Failed to save audio file: ${error.message}`);
  }
};

// Get all audio files from localStorage
export const getAudioFiles = () => {
  if (!checkStorageAvailability()) {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.AUDIO_FILES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load audio files:', error);
    return [];
  }
};

// Get single audio file by ID
export const getAudioFile = (id) => {
  const files = getAudioFiles();
  return files.find(file => file.id === id) || null;
};

// Delete audio file by ID
export const deleteAudioFile = (id) => {
  try {
    const files = getAudioFiles();
    const updatedFiles = files.filter(file => file.id !== id);
    localStorage.setItem(STORAGE_KEYS.AUDIO_FILES, JSON.stringify(updatedFiles));
    return true;
  } catch (error) {
    console.error('Failed to delete audio file:', error);
    return false;
  }
};

// Update audio file metadata (play count, last played, etc.)
export const updateAudioFile = (id, updates) => {
  try {
    const files = getAudioFiles();
    const fileIndex = files.findIndex(file => file.id === id);
    
    if (fileIndex === -1) {
      return false;
    }

    files[fileIndex] = { ...files[fileIndex], ...updates };
    localStorage.setItem(STORAGE_KEYS.AUDIO_FILES, JSON.stringify(files));
    return true;
  } catch (error) {
    console.error('Failed to update audio file:', error);
    return false;
  }
};

// Save current playlist state
export const savePlaylistState = (playlist) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PLAYLIST, JSON.stringify(playlist));
    return true;
  } catch (error) {
    console.error('Failed to save playlist state:', error);
    return false;
  }
};

// Get current playlist state
export const getPlaylistState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_PLAYLIST);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load playlist state:', error);
    return [];
  }
};

// Save playback state (current song, position, etc.)
export const savePlaybackState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYBACK_STATE, JSON.stringify({
      ...state,
      timestamp: new Date().toISOString()
    }));
    return true;
  } catch (error) {
    console.error('Failed to save playback state:', error);
    return false;
  }
};

// Get playback state
export const getPlaybackState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PLAYBACK_STATE);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load playback state:', error);
    return null;
  }
};

// Save user preferences
export const saveUserPreferences = (preferences) => {
  try {
    const existing = getUserPreferences();
    const updated = { ...existing, ...preferences };
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Failed to save user preferences:', error);
    return false;
  }
};

// Get user preferences
export const getUserPreferences = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return stored ? JSON.parse(stored) : {
      volume: 1,
      shuffle: false,
      repeat: 'none', // 'none', 'one', 'all'
      theme: 'dark'
    };
  } catch (error) {
    console.error('Failed to load user preferences:', error);
    return {
      volume: 1,
      shuffle: false,
      repeat: 'none',
      theme: 'dark'
    };
  }
};

// Clear all stored data
export const clearAllData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Failed to clear all data:', error);
    return false;
  }
};

// Export storage info for UI
export const getStorageStats = () => {
  const files = getAudioFiles();
  const storageInfo = getStorageInfo();
  
  return {
    totalFiles: files.length,
    totalDuration: files.reduce((total, file) => total + (file.metadata.duration || 0), 0),
    totalSize: files.reduce((total, file) => total + (file.metadata.size || 0), 0),
    storage: storageInfo
  };
};

// Validate audio file before saving
export const validateAudioFile = (file) => {
  const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a'];
  const maxSize = 50 * 1024 * 1024; // 50MB limit
  
  if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|aac|m4a)$/i)) {
    return { valid: false, error: 'Invalid audio file type' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large (max 50MB)' };
  }
  
  const storageInfo = getStorageInfo();
  if (file.size > storageInfo.available) {
    return { valid: false, error: 'Not enough storage space available' };
  }
  
  return { valid: true };
};