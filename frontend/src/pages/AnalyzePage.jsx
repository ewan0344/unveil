import React, { useState } from 'react';
import DropZone from '../components/DropZone';
import AnalysisProgress from '../components/AnalysisProgress';
import {
  analyzeImageFile,
  analyzeAudioFile,
  analyzeVideoFile,
  analyzeMediaUrl,
  analyzeSampleCase
} from '../services/api';
import { saveReportToHistory } from '../services/sampleCases';
import { ArrowLeft, Shield } from 'lucide-react';

export default function AnalyzePage({ onAnalysisComplete, onBack }) {
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'audio' | 'video'
  const [selectedFile, setSelectedFile] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(1);
  const [error, setError] = useState(null);

  const simulateProgress = async () => {
    setAnalysisStage(1);
    await new Promise(r => setTimeout(r, 300));
    setAnalysisStage(2);
    await new Promise(r => setTimeout(r, 450));
    setAnalysisStage(3);
    await new Promise(r => setTimeout(r, 600));
    setAnalysisStage(4);
    await new Promise(r => setTimeout(r, 450));
    setAnalysisStage(5);
    await new Promise(r => setTimeout(r, 300));
  };

  const handleStartAnalysis = async (mode) => {
    setError(null);
    setIsAnalyzing(true);

    try {
      // Start stepper progression concurrently
      const progressPromise = simulateProgress();

      let result = null;
      if (mode === 'upload' && selectedFile) {
        if (mediaType === 'image') {
          result = await analyzeImageFile(selectedFile);
        } else if (mediaType === 'audio') {
          result = await analyzeAudioFile(selectedFile);
        } else if (mediaType === 'video') {
          result = await analyzeVideoFile(selectedFile);
        }
      } else if (mode === 'url' && urlInput) {
        result = await analyzeMediaUrl(urlInput);
      }

      await progressPromise;

      if (result) {
        // Create local object URL for preview if file uploaded
        if (selectedFile) {
          result.preview_object_url = URL.createObjectURL(selectedFile);
        }
        saveReportToHistory(result);
        onAnalysisComplete(result);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'An unexpected error occurred during media inspection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadSample = async (category) => {
    setError(null);
    setIsAnalyzing(true);
    const sampleMap = {
      image: 'sample-ai-portrait',
      audio: 'sample-synthetic-voice',
      video: 'sample-synthetic-clip'
    };

    const targetId = sampleMap[category] || 'sample-ai-portrait';

    try {
      const progressPromise = simulateProgress();
      const result = await analyzeSampleCase(targetId);
      
      // Provide bundled sample url
      if (category === 'image') result.preview_object_url = '/samples/ai_portrait.jpg';
      if (category === 'audio') result.preview_object_url = '/samples/synthetic_voice.wav';
      if (category === 'video') result.preview_object_url = '/samples/synthetic_clip.mp4';

      await progressPromise;
      saveReportToHistory(result);
      onAnalysisComplete(result);
    } catch (err) {
      console.error('Sample error:', err);
      setError(err.message || 'Failed to load benchmark case from backend.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b0e] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 font-mono text-xs text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Overview</span>
          </button>
          
          <div className="flex items-center gap-2 text-xs font-mono text-white/50">
            <Shield className="w-3.5 h-3.5 text-orange-400" />
            <span>Zero Persistence Verification Workspace</span>
          </div>
        </div>

        {/* Page Title */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-orange-400">
            <span>Forensic Laboratory</span>
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-white tracking-tight">
            Verify Digital Media
          </h1>
          <p className="text-base text-white/60 font-body">
            Upload raw media or a public direct link. The backend runs multi-domain forensic heuristics across container headers, compression tables, noise variance, and frequency spectra.
          </p>
        </div>

        {/* Main Content: Progress or Upload Box */}
        {isAnalyzing ? (
          <div className="py-8">
            <AnalysisProgress currentStage={analysisStage} mediaType={mediaType} />
          </div>
        ) : (
          <DropZone
            mediaType={mediaType}
            setMediaType={setMediaType}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            urlInput={urlInput}
            setUrlInput={setUrlInput}
            onAnalyze={handleStartAnalysis}
            onLoadSample={handleLoadSample}
            isAnalyzing={isAnalyzing}
            error={error}
          />
        )}

      </div>
    </div>
  );
}
