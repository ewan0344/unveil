import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import AnalyzePage from './pages/AnalyzePage';
import ReportPage from './pages/ReportPage';
import MethodologyPage from './pages/MethodologyPage';
import CasesPage from './pages/CasesPage';
import { checkBackendHealth, analyzeSampleCase } from './services/api';

export default function App() {
  const [activePage, setActivePage] = useState('landing'); // 'landing' | 'analyze' | 'report' | 'methodology' | 'cases'
  const [currentReport, setCurrentReport] = useState(null);
  const [backendStatus, setBackendStatus] = useState({ healthy: false });

  // Check backend health periodically
  useEffect(() => {
    const check = async () => {
      const status = await checkBackendHealth();
      setBackendStatus(status);
    };
    check();
    const interval = setInterval(check, 12000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to top when changing page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePage]);

  const handleAnalysisComplete = (reportData) => {
    setCurrentReport(reportData);
    setActivePage('report');
  };

  const handleLoadBenchmarkCase = async (caseId) => {
    try {
      const report = await analyzeSampleCase(caseId);
      // Attach local sample preview URL
      if (report.media_type === 'image') report.preview_object_url = '/samples/ai_portrait.jpg';
      if (report.media_type === 'audio') report.preview_object_url = '/samples/synthetic_voice.wav';
      if (report.media_type === 'video') report.preview_object_url = '/samples/synthetic_clip.mp4';
      
      setCurrentReport(report);
      setActivePage('report');
    } catch (err) {
      console.error('Error loading benchmark case:', err);
      alert('Could not load benchmark dossier: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0b0e] text-slate-100 selection:bg-orange-500 selection:text-white grain-overlay">
      
      {/* Top Navbar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        backendStatus={backendStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activePage === 'landing' && (
          <LandingPage
            setActivePage={setActivePage}
            onSelectBenchmark={handleLoadBenchmarkCase}
          />
        )}

        {activePage === 'analyze' && (
          <AnalyzePage
            onAnalysisComplete={handleAnalysisComplete}
            onBack={() => setActivePage('landing')}
          />
        )}

        {activePage === 'report' && (
          <ReportPage
            report={currentReport}
            onNewAnalysis={() => setActivePage('analyze')}
            onBack={() => setActivePage('analyze')}
          />
        )}

        {activePage === 'methodology' && (
          <MethodologyPage
            setActivePage={setActivePage}
          />
        )}

        {activePage === 'cases' && (
          <CasesPage
            onSelectReport={(report) => {
              setCurrentReport(report);
              setActivePage('report');
            }}
            onLoadBenchmarkCase={handleLoadBenchmarkCase}
          />
        )}
      </main>

      {/* Editorial Footer */}
      <Footer setActivePage={setActivePage} />

    </div>
  );
}
