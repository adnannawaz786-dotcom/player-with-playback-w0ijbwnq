import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

const AudioPlayer = ({ playlist = [], currentIndex = 0, onTrackChange }) => {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    isLoading,
    play,
    pause,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    seek
  } = useAudioPlayer(audioRef);

  const currentTrack = playlist[currentIndex];

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.url;
      audioRef.current.load();
    }
  }, [currentTrack]);

  const handlePlayPause = () => {
    if (!currentTrack) return;
    isPlaying ? pause() : play();
  };

  const handlePrevious = () => {
    if (!playlist.length) return;
    const newIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
    onTrackChange?.(newIndex);
  };

  const handleNext = () => {
    if (!playlist.length) return;
    const newIndex = currentIndex < playlist.length - 1 ? currentIndex + 1 : 0;
    onTrackChange?.(newIndex);
  };

  const handleProgressClick = (e) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    seek(newTime);
  };

  const handleProgressDrag = (e) => {
    if (!isDragging || !progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    seek(newTime);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  if (!currentTrack) {
    return (
      <div className="backdrop-blur-xl bg-black/40 border-t border-white/20 p-4">
        <div className="flex items-center justify-center text-white/70">
          <span>No track selected</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="backdrop-blur-xl bg-black/40 border-t border-white/20 p-4"
    >
      <audio
        ref={audioRef}
        onLoadStart={() => {}}
        onCanPlay={() => {}}
        onEnded={handleNext}
        preload="metadata"
      />

      {/* Track Info */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
          {currentTrack.artwork ? (
            <img 
              src={currentTrack.artwork} 
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Volume2 className="w-6 h-6 text-white/70" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">{currentTrack.title}</h3>
          <p className="text-white/70 text-sm truncate">{currentTrack.artist || 'Unknown Artist'}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div
          ref={progressRef}
          className="relative h-2 bg-white/20 rounded-full cursor-pointer group"
          onClick={handleProgressClick}
          onMouseDown={() => setIsDragging(true)}
          onMouseMove={handleProgressDrag}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          <div
            className="absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="absolute top-1/2 w-4 h-4 bg-white rounded-full transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            style={{ left: `calc(${progressPercent}% - 8px)` }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/70 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isShuffled ? 'text-white bg-white/20' : 'text-white/70 hover:text-white'
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            onClick={toggleRepeat}
            className={`p-2 rounded-lg transition-all duration-200 ${
              repeatMode !== 'off' ? 'text-white bg-white/20' : 'text-white/70 hover:text-white'
            }`}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrevious}
            className="text-white/70 hover:text-white transition-colors duration-200"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayPause}
            disabled={isLoading}
            className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:bg-white/90 transition-all duration-200 disabled:opacity-50"
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"
                />
              ) : isPlaying ? (
                <motion.div
                  key="pause"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Pause className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="play"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Play className="w-5 h-5 ml-0.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <button
            onClick={handleNext}
            className="text-white/70 hover:text-white transition-colors duration-200"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="text-white/70 hover:text-white transition-colors duration-200"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-150"
              style={{ width: `${isMuted ? 0 : volume * 100}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AudioPlayer;