import React, { useEffect, useState, useRef } from 'react';

type AnalysisResult = {
  ts: number;
  data: any;
};

const AnalysisPage: React.FC = () => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const fetchLatest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/facebook/analysis/latest');
      if (!res.ok) throw new Error('No analysis available');
      const json = await res.json();
      if (json.success) setAnalysis({ ts: json.ts, data: json.data });
    } catch (err) {
      console.warn('fetchLatest failed', err);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysisNow = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/facebook/analysis/refresh', { method: 'POST' });
      const json = await res.json();
      if (json.success && json.result) {
        setAnalysis({ ts: Date.now(), data: json.result });
      } else {
        console.warn('refresh returned', json);
      }
    } catch (err) {
      console.error('runAnalysisNow error', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!analysis) return;
    const text = JSON.stringify(analysis, null, 2);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analysis-report.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchLatest();
    // schedule hourly refresh in UI (in addition to backend scheduled job)
    intervalRef.current = window.setInterval(() => {
      runAnalysisNow();
    }, 1000 * 60 * 60);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Analysis</h2>
      <div style={{ marginBottom: 12 }}>
        <button className="btn" onClick={runAnalysisNow} disabled={loading}>Run Analysis</button>
        <button className="btn" onClick={fetchLatest} disabled={loading} style={{ marginLeft: 8 }}>Refresh</button>
        <button className="btn" onClick={downloadReport} disabled={!analysis} style={{ marginLeft: 8 }}>Download Report (.txt)</button>
      </div>
      {loading && <div>Loading…</div>}
      {!analysis && !loading && <div>No analysis available yet.</div>}
      {analysis && (
        <div style={{ whiteSpace: 'pre-wrap', background: '#f7f7f7', padding: 12, borderRadius: 6 }}>
          <strong>Fetched:</strong> {new Date(analysis.ts).toLocaleString()}
          <pre style={{ marginTop: 8 }}>{JSON.stringify(analysis.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;
