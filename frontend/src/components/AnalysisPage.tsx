import React, { useEffect, useState, useRef } from 'react';

type AnalysisResult = {
  ts: number;
  data: any;
};

const AnalysisPage: React.FC = () => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const intervalRef = useRef<number | null>(null);

  const fetchLatest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/facebook/analysis/history?limit=2');
      if (!res.ok) throw new Error('No analysis available');
      const json = await res.json();
      if (json.success) {
        const entries: AnalysisResult[] = (json.entries || []).map((e: any) => ({ ts: e.ts * 1000 || Date.now(), data: e.data }));
        setHistory(entries);
        if (entries.length > 0) setAnalysis(entries[0]);
      }
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
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            {/** Compute metrics: followers, fans, posts count and percent change vs previous entry */}
            {(() => {
              const latest = analysis.data?.page || {};
              const prev = history[1]?.data?.page || {};
              const makeCard = (label: string, value: string | number, prevVal: number | undefined) => {
                let pct = null as null | number;
                if (prevVal !== undefined && prevVal !== null && typeof prevVal === 'number') {
                  const cur = Number(value) || 0;
                  pct = prevVal === 0 ? null : ((cur - prevVal) / Math.abs(prevVal)) * 100;
                }
                return (
                  <div key={label} style={{ background: '#fff', padding: 12, borderRadius: 6, minWidth: 160, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
                    {pct !== null && pct !== undefined && !Number.isNaN(pct) && (
                      <div style={{ fontSize: 12, color: pct >= 0 ? 'green' : 'red' }}>{pct >= 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%</div>
                    )}
                  </div>
                );
              };

              const followersCur = Number(latest.followers_count || latest.followers || latest.fan_count || latest.fanCount || 0);
              const followersPrev = history[1] ? Number(history[1].data?.page?.followers_count || history[1].data?.page?.followers || history[1].data?.page?.fan_count || 0) : undefined;
              const fansCur = Number(latest.fan_count || 0);
              const fansPrev = history[1] ? Number(history[1].data?.page?.fan_count || 0) : undefined;
              const postsCur = Array.isArray(analysis.data?.posts?.data) ? analysis.data.posts.data.length : (analysis.data?.posts?.data?.length || 0);
              const postsPrev = history[1] ? (Array.isArray(history[1].data?.posts?.data) ? history[1].data.posts.data.length : 0) : undefined;

              return (
                <>
                  {makeCard('Followers', followersCur, followersPrev)}
                  {makeCard('Fans', fansCur, fansPrev)}
                  {makeCard('Recent posts', postsCur, postsPrev)}
                </>
              );
            })()}
          </div>
          <div style={{ whiteSpace: 'pre-wrap', background: '#f7f7f7', padding: 12, borderRadius: 6 }}>
            <strong>Fetched:</strong> {new Date(analysis.ts).toLocaleString()}
            <pre style={{ marginTop: 8 }}>{JSON.stringify(analysis.data, null, 2)}</pre>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalysisPage;
