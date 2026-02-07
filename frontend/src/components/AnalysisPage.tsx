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

  const fetchLatest = async (limit = 24) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/facebook/analysis/history?limit=${limit}`);
      if (!res.ok) throw new Error('No analysis available');
      const json = await res.json();
      if (json.success) {
        const entries: AnalysisResult[] = (json.entries || []).map((e: any) => ({ ts: (e.ts || Date.now()) * 1000, data: e.data }));
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
    fetchLatest(24);
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
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Analysis</h2>
        <div style={{ marginLeft: 12, display: 'flex', gap: 8 }}>
          <button className="btn" onClick={runAnalysisNow} disabled={loading}>Pull</button>
          <button className="btn" onClick={() => fetchLatest(24)} disabled={loading}>Refresh</button>
        </div>
      </div>
      {loading && <div>Loading…</div>}
      {!analysis && !loading && <div>No analysis available yet.</div>}
      {analysis && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
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
                    <div key={label} style={{ background: '#23241a', padding: 12, borderRadius: 6, minWidth: 160, boxShadow: '0 1px 6px rgba(0,0,0,0.4)', color: '#ffe066' }}>
                      <div style={{ fontSize: 12, color: '#ffd' }}>{label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{value}</div>
                      {pct !== null && pct !== undefined && !Number.isNaN(pct) && (
                        <div style={{ fontSize: 12, color: pct >= 0 ? '#7fff7f' : '#ff7b7b' }}>{pct >= 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%</div>
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

              // Aggregate reactions/comments/shares across recent posts
              const sumField = (arr: any[] | undefined, getter: (p: any)=>number) => {
                if (!Array.isArray(arr)) return 0;
                return arr.reduce((s, p) => s + (getter(p) || 0), 0);
              };

              const postsArr = Array.isArray(analysis.data?.posts?.data) ? analysis.data.posts.data : [];
              const postsArrPrev = history[1] && Array.isArray(history[1].data?.posts?.data) ? history[1].data.posts.data : [];

              const likesCur = sumField(postsArr, (p) => Number(p?.reactions?.summary?.total_count || 0));
              const likesPrev = postsArrPrev.length ? sumField(postsArrPrev, (p) => Number(p?.reactions?.summary?.total_count || 0)) : undefined;
              const commentsCur = sumField(postsArr, (p) => Number(p?.comments?.summary?.total_count || 0));
              const commentsPrev = postsArrPrev.length ? sumField(postsArrPrev, (p) => Number(p?.comments?.summary?.total_count || 0)) : undefined;
              const sharesCur = sumField(postsArr, (p) => Number(p?.shares?.count || 0));
              const sharesPrev = postsArrPrev.length ? sumField(postsArrPrev, (p) => Number(p?.shares?.count || 0)) : undefined;

              return (
                <>
                  {makeCard('Followers', followersCur, followersPrev)}
                  {makeCard('Fans', fansCur, fansPrev)}
                  {makeCard('Recent posts', postsCur, postsPrev)}
                  {makeCard('Likes', likesCur, likesPrev)}
                  {makeCard('Comments', commentsCur, commentsPrev)}
                  {makeCard('Shares', sharesCur, sharesPrev)}
                </>
              );
            })()}
          </div>
          {/** Charts area: followers sparkline and posts bar chart */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ background: '#23241a', padding: 12, borderRadius: 6, minWidth: 220, flex: '1 1 320px', color: '#ffe066' }}>
                <div style={{ fontSize: 14, color: '#ffd', marginBottom: 8 }}>Trends (last {history.length} points)</div>
                  <MultiMetricChart history={history} />
            </div>
            <div style={{ background: '#23241a', padding: 12, borderRadius: 6, minWidth: 220, flex: '1 1 320px', color: '#ffe066' }}>
              <div style={{ fontSize: 14, color: '#ffd', marginBottom: 8 }}>Recent Posts Count</div>
              <PostsBarChart history={history} />
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 6, background: 'rgba(255,224,102,0.04)', color: '#ffe066' }}>
            <div><strong style={{ color: '#fff' }}>{analysis.data?.page?.name || 'Page'}</strong> — fetched: {new Date(analysis.ts).toLocaleString()}</div>
            {analysis.data?.page?.about && <div style={{ marginTop: 6, color: '#ddd' }}>{analysis.data.page.about}</div>}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <div>Fans: <strong style={{ color: '#fff' }}>{analysis.data?.page?.fan_count ?? '—'}</strong></div>
              <div>Followers: <strong style={{ color: '#fff' }}>{analysis.data?.page?.followers_count ?? '—'}</strong></div>
              <div>Posts: <strong style={{ color: '#fff' }}>{Array.isArray(analysis.data?.posts?.data) ? analysis.data.posts.data.length : 0}</strong></div>
            </div>
          </div>

          {/* Recent posts list */}
          <div style={{ marginTop: 12 }}>
            <h3 style={{ margin: '8px 0', color: '#ffe066' }}>Recent Posts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(Array.isArray(analysis.data?.posts?.data) ? analysis.data.posts.data : []).map((p: any) => {
                const id = String(p.id || '');
                const created = p.created_time ? new Date(p.created_time).toLocaleString() : '';
                const msg = (p.message || '').slice(0, 400);
                const likes = Number(p?.reactions?.summary?.total_count || 0);
                const comments = Number(p?.comments?.summary?.total_count || 0);
                const shares = Number(p?.shares?.count || 0);
                const thumb = p.full_picture || p.picture || p.attachments?.data?.[0]?.media?.image?.src || p.attachments?.data?.[0]?.media?.image?.url || null;
                return (
                  <div key={id} style={{ background: '#1e2018', padding: 10, borderRadius: 8, color: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      {thumb ? (
                        <img src={thumb} alt="thumb" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, flex: '0 0 80px' }} />
                      ) : (
                        <div style={{ width: 80, height: 80, background: '#111307', borderRadius: 6, flex: '0 0 80px' }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontSize: 13, color: '#ffd' }}>{created}</div>
                          <a href={`https://www.facebook.com/${id}`} target="_blank" rel="noreferrer" style={{ color: '#7fb3ff', textDecoration: 'underline', fontSize: 13 }}>View on Facebook</a>
                        </div>
                        <div style={{ marginTop: 6, color: '#ddd', fontSize: 15 }}>{msg}</div>
                        <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 13, color: '#ffe066' }}>
                          <div>👍 <strong style={{ color: '#fff' }}>{likes}</strong></div>
                          <div>💬 <strong style={{ color: '#fff' }}>{comments}</strong></div>
                          <div>🔁 <strong style={{ color: '#fff' }}>{shares}</strong></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Multi-metric line chart for trends: followers, fans, likes, comments, shares
const MultiMetricChart: React.FC<{ history: AnalysisResult[] }> = ({ history }) => {
  if (!history || history.length === 0) return <div>No data</div>;

  // Build series
  const followers = history.map(h => Number(h.data?.page?.followers_count || h.data?.page?.followers || h.data?.page?.fan_count || 0));
  const fans = history.map(h => Number(h.data?.page?.fan_count || 0));
  const likes = history.map(h => {
    const arr = Array.isArray(h.data?.posts?.data) ? h.data.posts.data : [];
    return arr.reduce((s: number, p: any) => s + (Number(p?.reactions?.summary?.total_count || 0)), 0);
  });
  const comments = history.map(h => {
    const arr = Array.isArray(h.data?.posts?.data) ? h.data.posts.data : [];
    return arr.reduce((s: number, p: any) => s + (Number(p?.comments?.summary?.total_count || 0)), 0);
  });
  const shares = history.map(h => {
    const arr = Array.isArray(h.data?.posts?.data) ? h.data.posts.data : [];
    return arr.reduce((s: number, p: any) => s + (Number(p?.shares?.count || 0)), 0);
  });

  const series = [
    { key: 'Followers', data: followers, color: '#7fb3ff' },
    { key: 'Fans', data: fans, color: '#ffd76b' },
    { key: 'Likes', data: likes, color: '#7fff7f' },
    { key: 'Comments', data: comments, color: '#ff7b7b' },
    { key: 'Shares', data: shares, color: '#c48cff' },
  ];

  const allValues = series.flatMap(s => s.data);
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const viewW = 360, viewH = 120, padding = 10;
  const step = (viewW - padding * 2) / Math.max(1, history.length - 1);

  const makePath = (data: number[]) => data.map((v, i) => {
    const x = padding + i * step;
    const y = viewH - padding - ((v - min) / (max - min || 1)) * (viewH - padding * 2);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${viewW} ${viewH}`} width="100%" height={viewH} preserveAspectRatio="none">
        <rect x={0} y={0} width={viewW} height={viewH} fill="#23241a" rx={6} />
        {series.map(s => (
          <path key={s.key} d={makePath(s.data)} stroke={s.color} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        {series.map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ffd' }}>
            <div style={{ width: 12, height: 8, background: s.color, borderRadius: 2 }} />
            <div style={{ fontSize: 12 }}>{s.key}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Thin line chart for recent posts counts
const PostsBarChart: React.FC<{ history: AnalysisResult[] }> = ({ history }) => {
  if (!history || history.length === 0) return <div>No data</div>;
  const counts = history.map(h => Array.isArray(h.data?.posts?.data) ? h.data.posts.data.length : 0);
  const viewW = 300, viewH = 60, padding = 6;
  const max = Math.max(...counts, 1);
  const min = Math.min(...counts, 0);
  const step = (viewW - padding * 2) / Math.max(1, counts.length - 1);
  const path = counts.map((v, i) => {
    const x = padding + i * step;
    const y = viewH - padding - ((v - min) / (max - min || 1)) * (viewH - padding * 2);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  const circles = counts.map((v, i) => {
    const x = padding + i * step;
    const y = viewH - padding - ((v - min) / (max - min || 1)) * (viewH - padding * 2);
    return <circle key={i} cx={x} cy={y} r={2} fill="#7fb3ff" />;
  });
  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} width="100%" height={viewH} preserveAspectRatio="none">
      <rect x={0} y={0} width={viewW} height={viewH} fill="#23241a" rx={4} />
      <path d={path} stroke="#7fb3ff" strokeWidth={1} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {circles}
    </svg>
  );
};

export default AnalysisPage;
