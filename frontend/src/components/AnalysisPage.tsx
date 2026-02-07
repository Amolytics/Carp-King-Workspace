import React from 'react';

const AnalysisPage: React.FC = () => {
  const runAnalysis = () => {
    // Placeholder: in future call backend analysis API
    alert('Running analysis (placeholder)');
  };

  const downloadReport = () => {
    // Placeholder download action
    const blob = new Blob([JSON.stringify({ report: 'sample' }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analysis-report.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Analysis</h2>
      <p>This page provides basic analysis tools and report download.</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn" onClick={runAnalysis}>Run Analysis</button>
        <button className="btn" onClick={downloadReport}>Download Report</button>
      </div>
    </div>
  );
};

export default AnalysisPage;
