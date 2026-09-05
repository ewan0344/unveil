import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Music, Video as VideoIcon, UploadCloud, Link as LinkIcon, AlertCircle, File, Sparkles, CheckCircle } from 'lucide-react';

export default function DropZone({
  mediaType,
  setMediaType,
  selectedFile,
  setSelectedFile,
  urlInput,
  setUrlInput,
  onAnalyze,
  onLoadSample,
  isAnalyzing,
  error
}) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'url'
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    if (!file) return;
    // Basic client size check (50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert("File exceeds maximum allowed upload size of 50MB.");
      return;
    }
    
    // Auto-detect media type if possible
    if (file.type.startsWith('image/')) setMediaType('image');
    else if (file.type.startsWith('audio/')) setMediaType('audio');
    else if (file.type.startsWith('video/')) setMediaType('video');
    
    setSelectedFile(file);
  };

  const getAcceptedExtensions = () => {
    if (mediaType === 'image') return '.jpg,.jpeg,.png,.webp';
    if (mediaType === 'audio') return '.wav,.mp3,.ogg';
    if (mediaType === 'video') return '.mp4,.webm,.mov';
    return '*';
  };

  return (
    <div className="w-full max-w-3xl mx-auto editorial-card p-6 sm:p-8 bg-[#111216] border border-white/15 shadow-2xl">
      
      {/* 1. Modality Switcher (Image / Audio / Video) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-white/50 block">Step 01</span>
          <h3 className="font-display font-bold text-xl text-white">Select Media Mode</h3>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-black/60 rounded-full border border-white/10" role="tablist">
          <button
            onClick={() => { setMediaType('image'); setSelectedFile(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs font-bold transition-all ${
              mediaType === 'image'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
            role="tab"
            aria-selected={mediaType === 'image'}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            IMAGE
          </button>

          <button
            onClick={() => { setMediaType('audio'); setSelectedFile(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs font-bold transition-all ${
              mediaType === 'audio'
                ? 'bg-[#2ED573] text-black shadow-lg font-black'
                : 'text-white/60 hover:text-white'
            }`}
            role="tab"
            aria-selected={mediaType === 'audio'}
          >
            <Music className="w-3.5 h-3.5" />
            AUDIO
          </button>

          <button
            onClick={() => { setMediaType('video'); setSelectedFile(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs font-bold transition-all ${
              mediaType === 'video'
                ? 'bg-[#82B1FF] text-black shadow-lg font-black'
                : 'text-white/60 hover:text-white'
            }`}
            role="tab"
            aria-selected={mediaType === 'video'}
          >
            <VideoIcon className="w-3.5 h-3.5" />
            VIDEO
          </button>
        </div>
      </div>

      {/* 2. Upload Method Toggle (File vs URL) */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <div className="flex items-center gap-4 text-xs font-mono">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-1 border-b-2 font-bold transition-colors ${
              activeTab === 'upload' ? 'border-orange-500 text-white' : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            LOCAL FILE
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`pb-1 border-b-2 font-bold transition-colors ${
              activeTab === 'url' ? 'border-orange-500 text-white' : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            PUBLIC MEDIA URL
          </button>
        </div>

        {/* 1-Click Quick Demo Load Button */}
        <button
          onClick={() => onLoadSample(mediaType)}
          disabled={isAnalyzing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white/80 transition-all hover:text-white"
          title="Load pre-configured benchmark case for this modality"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Load Demo Sample</span>
        </button>
      </div>

      {/* 3. Drop Zone or URL Input */}
      {activeTab === 'upload' ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-orange-500 bg-orange-500/10 scale-[1.01]'
              : selectedFile
              ? 'border-emerald-500/50 bg-emerald-950/20'
              : 'border-white/15 bg-black/40 hover:border-white/30 hover:bg-black/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptedExtensions()}
            onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
            className="hidden"
          />

          {selectedFile ? (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-mono text-sm font-bold text-white break-all">{selectedFile.name}</h4>
                <p className="font-mono text-xs text-white/50 mt-1">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'Custom File'}
                </p>
              </div>
              <span className="inline-block font-mono text-[11px] text-emerald-400 underline underline-offset-4">
                Click or drop another file to replace
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white/70 mx-auto flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="font-display font-bold text-base text-white">
                  Drag & drop your {mediaType.toUpperCase()} here
                </p>
                <p className="font-mono text-xs text-white/50 mt-1">
                  or click to browse local filesystem
                </p>
              </div>
              <div className="pt-2 font-mono text-[11px] text-white/40">
                Supported: {getAcceptedExtensions().replace(/,/g, '  ')} • Max 50MB
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 py-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
              <LinkIcon className="w-4 h-4" />
            </div>
            <input
              type="url"
              placeholder={`https://example.com/media.${mediaType === 'image' ? 'jpg' : mediaType === 'audio' ? 'wav' : 'mp4'}`}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full bg-black/60 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-sm text-white font-mono placeholder:text-white/30 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <p className="font-mono text-xs text-white/40 leading-relaxed">
            UNVEIL verifies public direct links with SSRF isolation. Ensure the URL points directly to an unauthenticated media file.
          </p>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="mt-4 p-3.5 rounded-lg bg-red-950/40 border border-red-500/40 flex items-start gap-3 text-red-200 text-xs font-mono">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Analysis Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 4. Action Button */}
      <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs font-mono text-white/40">
          Strict Privacy: Files are processed in ephemeral memory and discarded immediately.
        </div>

        <button
          onClick={() => onAnalyze(activeTab)}
          disabled={isAnalyzing || (activeTab === 'upload' && !selectedFile) || (activeTab === 'url' && !urlInput.trim())}
          className={`w-full sm:w-auto px-8 py-3 rounded-full font-display font-black text-sm tracking-wider uppercase transition-all shadow-xl ${
            isAnalyzing || (activeTab === 'upload' && !selectedFile) || (activeTab === 'url' && !urlInput.trim())
              ? 'bg-white/10 text-white/30 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600 text-white hover:scale-105 active:scale-95'
          }`}
        >
          {isAnalyzing ? 'ANALYZING MEDIA...' : 'ANALYZE MEDIA'}
        </button>
      </div>

    </div>
  );
}
