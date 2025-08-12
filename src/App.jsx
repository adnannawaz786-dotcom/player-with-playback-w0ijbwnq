import React, { useState } from 'react';
import { Home, Library, Upload, Music, Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import AudioPlayer from './components/AudioPlayer';
import AudioUploader from './components/AudioUploader';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { getStoredTracks, deleteTrack } from './services/audioStorage';

const HomePage = ({ tracks, currentTrack, onTrackSelect }) => (
  <div className="flex flex-col h-full text-white p-6">
    <div className="text-center mb-8">
      <Music className="w-16 h-16 mx-auto mb-4 text-white/70" />
      <h1 className="text-3xl font-bold mb-2">Music Player</h1>
      <p className="text-white/70">Upload and play your favorite tracks</p>
    </div>
    
    {tracks.length === 0 ? (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Music className="w-12 h-12 text-white/50" />
          </div>
          <p className="text-white/70 text-lg">No tracks uploaded yet</p>
          <p className="text-white/50 text-sm mt-2">Go to Upload to add your music</p>
        </div>
      </div>
    ) : (
      <div className="flex-1">
        <h2 className="text-xl font-semibold mb-4">Recently Added</h2>
        <div className="space-y-3">
          {tracks.slice(0, 5).map((track) => (
            <div
              key={track.id}
              onClick={() => onTrackSelect(track)}
              className={`p-4 rounded-lg backdrop-blur-sm border cursor-pointer transition-all duration-300 hover:bg-white/10 ${
                currentTrack?.id === track.id
                  ? 'bg-white/20 border-white/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium truncate">{track.name}</h3>
                  <p className="text-white/70 text-sm">
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </p>
                </div>
                {currentTrack?.id === track.id ? (
                  <Play className="w-5 h-5 text-white/70" />
                ) : (
                  <Music className="w-5 h-5 text-white/50" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const LibraryPage = ({ tracks, currentTrack, onTrackSelect, onTrackDelete }) => (
  <div className="flex flex-col h-full text-white p-6">
    <div className="flex items-center mb-6">
      <Library className="w-8 h-8 mr-3 text-white/70" />
      <h1 className="text-2xl font-bold">Your Library</h1>
    </div>
    
    {tracks.length === 0 ? (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Library className="w-16 h-16 mx-auto mb-4 text-white/50" />
          <p className="text-white/70 text-lg">Your library is empty</p>
        </div>
      </div>
    ) : (
      <div className="flex-1">
        <p className="text-white/70 mb-4">{tracks.length} track{tracks.length !== 1 ? 's' : ''}</p>
        <div className="space-y-3">
          {tracks.map((track) => (
            <div
              key={track.id}
              className={`p-4 rounded-lg backdrop-blur-sm border transition-all duration-300 ${
                currentTrack?.id === track.id
                  ? 'bg-white/20 border-white/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onTrackSelect(track)}
                >
                  <h3 className="font-medium truncate">{track.name}</h3>
                  <p className="text-white/70 text-sm">
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')} • 
                    {new Date(track.uploadDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onTrackSelect(track)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    {currentTrack?.id === track.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => onTrackDelete(track.id)}
                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const UploadPage = ({ onUploadComplete }) => (
  <div className="flex flex-col h-full text-white p-6">
    <div className="flex items-center mb-6">
      <Upload className="w-8 h-8 mr-3 text-white/70" />
      <h1 className="text-2xl font-bold">Upload Music</h1>
    </div>
    
    <div className="flex-1">
      <AudioUploader onUploadComplete={onUploadComplete} />
    </div>
  </div>
);

const NavItem = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-300 ${
        isActive ? 'text-white' : 'text-white/70 hover:text-white'
      }`}
    >
      {React.cloneElement(icon, { className: 'w-6 h-6 mb-1' })}
      <span className="text-xs">{label}</span>
    </button>
  );
};

export default function App() {
  const [activeView, setActiveView] = useState('Home');
  const [tracks, setTracks] = useState(() => getStoredTracks());
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    play,
    pause,
    stop,
    seek,
    setVolume: updateVolume,
    loadTrack
  } = useAudioPlayer();

  const handleTrackSelect = (track) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    } else {
      loadTrack(track);
      play();
    }
  };

  const handleUploadComplete = () => {
    setTracks(getStoredTracks());
  };

  const handleTrackDelete = (trackId) => {
    if (currentTrack?.id === trackId) {
      stop();
    }
    deleteTrack(trackId);
    setTracks(getStoredTracks());
  };

  const renderContent = () => {
    switch (activeView) {
      case 'Home':
        return (
          <HomePage
            tracks={tracks}
            currentTrack={currentTrack}
            onTrackSelect={handleTrackSelect}
          />
        );
      case 'Library':
        return (
          <LibraryPage
            tracks={tracks}
            currentTrack={currentTrack}
            onTrackSelect={handleTrackSelect}
            onTrackDelete={handleTrackDelete}
          />
        );
      case 'Upload':
        return <UploadPage onUploadComplete={handleUploadComplete} />;
      default:
        return (
          <HomePage
            tracks={tracks}
            currentTrack={currentTrack}
            onTrackSelect={handleTrackSelect}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 relative">
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 pb-32">
          {renderContent()}
        </main>

        {currentTrack && (
          <div className="fixed bottom-20 left-0 right-0 z-40">
            <div className="mx-4 mb-4">
              <AudioPlayer
                track={currentTrack}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                volume={volume}
                onPlay={play}
                onPause={pause}
                onSeek={seek}
                onVolumeChange={updateVolume}
              />
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="backdrop-blur-xl bg-black/40 border-t border-white/20">
            <nav className="flex justify-around items-center py-4 px-4 pb-8">
              <NavItem
                icon={<Home />}
                label="Home"
                isActive={activeView === 'Home'}
                onClick={() => setActiveView('Home')}
              />
              <NavItem
                icon={<Library />}
                label="Library"
                isActive={activeView === 'Library'}
                onClick={() => setActiveView('Library')}
              />
              <NavItem
                icon={<Upload />}
                label="Upload"
                isActive={activeView === 'Upload'}
                onClick={() => setActiveView('Upload')}
              />
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}