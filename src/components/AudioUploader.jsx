import React, { useState, useRef } from 'react';
import { Upload, X, Music, AlertCircle, CheckCircle } from 'lucide-react';
import { saveAudioFile, getStoredAudioFiles } from '../services/audioStorage';

const AudioUploader = ({ onUploadComplete }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const supportedFormats = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];

  const validateFile = (file) => {
    if (!supportedFormats.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
      return { valid: false, error: 'Unsupported file format. Please upload MP3, WAV, OGG, or M4A files.' };
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      return { valid: false, error: 'File size too large. Please upload files smaller than 50MB.' };
    }

    return { valid: true };
  };

  const processAudioFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const audioData = e.target.result;
          const audio = new Audio();
          
          audio.onloadedmetadata = () => {
            const audioFile = {
              id: Date.now().toString(),
              name: file.name.replace(/\.[^/.]+$/, ""),
              file: file.name,
              duration: audio.duration,
              size: file.size,
              type: file.type,
              data: audioData,
              uploadedAt: new Date().toISOString()
            };
            
            resolve(audioFile);
          };
          
          audio.onerror = () => {
            reject(new Error('Invalid audio file or corrupted data.'));
          };
          
          audio.src = audioData;
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file.'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files) => {
    const fileList = Array.from(files);
    
    if (fileList.length === 0) return;

    setUploading(true);
    setUploadStatus(null);
    setUploadProgress(0);

    try {
      const totalFiles = fileList.length;
      const processedFiles = [];
      
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const validation = validateFile(file);
        
        if (!validation.valid) {
          setUploadStatus({ type: 'error', message: validation.error });
          setUploading(false);
          return;
        }

        try {
          const audioFile = await processAudioFile(file);
          await saveAudioFile(audioFile);
          processedFiles.push(audioFile);
          
          setUploadProgress(((i + 1) / totalFiles) * 100);
        } catch (error) {
          console.error('Error processing file:', file.name, error);
          setUploadStatus({ 
            type: 'error', 
            message: `Failed to process ${file.name}: ${error.message}` 
          });
          setUploading(false);
          return;
        }
      }

      setUploadStatus({ 
        type: 'success', 
        message: `Successfully uploaded ${processedFiles.length} file${processedFiles.length > 1 ? 's' : ''}` 
      });
      
      if (onUploadComplete) {
        onUploadComplete(processedFiles);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({ type: 'error', message: 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    handleFiles(files);
    // Reset input value to allow re-uploading the same file
    e.target.value = '';
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const clearStatus = () => {
    setUploadStatus(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-8">
        <div className="text-center mb-6">
          <Music className="w-12 h-12 mx-auto mb-4 text-white/70" />
          <h2 className="text-2xl font-bold text-white mb-2">Upload Audio Files</h2>
          <p className="text-white/70">Drag and drop your music files or click to browse</p>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer ${
            isDragOver 
              ? 'border-blue-400 bg-blue-500/20' 
              : 'border-white/30 hover:border-white/50'
          } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.wav,.ogg,.m4a"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="text-center">
            <Upload className={`w-16 h-16 mx-auto mb-4 transition-colors ${
              isDragOver ? 'text-blue-400' : 'text-white/50'
            }`} />
            
            {uploading ? (
              <div className="space-y-4">
                <p className="text-white font-medium">Uploading files...</p>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-white/70 text-sm">{Math.round(uploadProgress)}% complete</p>
              </div>
            ) : (
              <>
                <p className="text-white font-medium mb-2">
                  {isDragOver ? 'Drop your files here' : 'Choose files or drag them here'}
                </p>
                <p className="text-white/70 text-sm">
                  Supports MP3, WAV, OGG, M4A files up to 50MB
                </p>
              </>
            )}
          </div>
        </div>

        {uploadStatus && (
          <div className={`mt-6 p-4 rounded-lg flex items-center justify-between ${
            uploadStatus.type === 'error' 
              ? 'bg-red-500/20 border border-red-500/30' 
              : 'bg-green-500/20 border border-green-500/30'
          }`}>
            <div className="flex items-center space-x-3">
              {uploadStatus.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-400" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-400" />
              )}
              <p className={`text-sm font-medium ${
                uploadStatus.type === 'error' ? 'text-red-200' : 'text-green-200'
              }`}>
                {uploadStatus.message}
              </p>
            </div>
            <button
              onClick={clearStatus}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-white/50 text-xs">
            Files are stored locally in your browser. Clear browser data will remove uploaded files.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AudioUploader;