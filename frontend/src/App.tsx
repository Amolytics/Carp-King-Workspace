import React, { useEffect, useRef, useState } from 'react';
import SlotList from './components/SlotList';
import MeetingList from './components/MeetingList';
import ImageUpload from './components/ImageUpload';
import { AuthProvider, useAuth } from './components/AuthContext';
import Login from './components/Login';


import FacebookSettings from './components/FacebookSettings';
import FacebookPost from './components/FacebookPost';
import GlobalChat from './components/GlobalChat';
import PlannerLayout from './PlannerLayout';
import SlotPlanner from './components/SlotPlanner';


import MeetingsPage from './MeetingsPage';
import LogoutButton from './components/LogoutButton';
import AdminPanel from './components/AdminPanel';
import { socket } from './realtime';

const PAGES = [
  { key: 'welcome', label: 'Welcome' },
  { key: 'slots', label: 'Slot Planner' },
  { key: 'meetings', label: 'Meetings' },
  { key: 'chat', label: 'Global Chat' },
  { key: 'facebook', label: 'Facebook' },
];

const PAGE_STORAGE_KEY = 'ck.page';
const ALLOWED_PAGES = new Set(['welcome', 'slots', 'meetings', 'chat', 'facebook', 'upload']);
const UNREAD_KEY_PREFIX = 'ck.unread.';

const FB_MOBILE_URL = 'https://m.facebook.com/profile.php?id=61586021865588';
const FB_DESKTOP_URL = 'https://www.facebook.com/profile.php?id=61586021865588';

function getFacebookUrl() {
  if (typeof window === 'undefined') return FB_DESKTOP_URL;
  return window.innerWidth <= 900 ? FB_MOBILE_URL : FB_DESKTOP_URL;
}

const WelcomePage: React.FC<{ user: any; onNavigate: (page: string) => void; unreadCount: number }> = ({ user, onNavigate, unreadCount }) => (
  <div className="welcome">
    <img src="/carp_king_logo.png" alt="Carp King Logo" className="welcome-logo" />
    <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Welcome, {user.name}!</h1>
    <div style={{ color: '#ffe066cc', fontSize: 14, marginBottom: 12 }}>What would you like to do?</div>
    <div className="welcome-actions">
      <button onClick={() => onNavigate('slots')} className="btn btn-nav">Slot Planner</button>
      <button onClick={() => onNavigate('meetings')} className="btn btn-nav">Meetings</button>
      <button onClick={() => onNavigate('chat')} className="btn btn-nav btn-badge">
        <span>Global Chat</span>
        {unreadCount > 0 && <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      <button onClick={() => onNavigate('facebook')} className="btn btn-nav">Facebook</button>
    </div>
    <LogoutButton onNavigate={onNavigate} />
  </div>
);

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    // Log error if needed
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ color: 'red', padding: 32, fontSize: 24 }}>Something went wrong. Please reload or contact support.</div>;
    }
    return this.props.children;
  }
}

const MainApp: React.FC = () => {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [page, setPage] = useState<string>(() => {
    const stored = localStorage.getItem(PAGE_STORAGE_KEY) || 'welcome';
    return ALLOWED_PAGES.has(stored) ? stored : 'welcome';
  });
  const [navOpen, setNavOpen] = useState(false);
  const [facebookUrl, setFacebookUrl] = useState(getFacebookUrl());
  const [chatUnread, setChatUnread] = useState(0);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const { user } = useAuth();
  if (!user) return <Login />;

  useEffect(() => {
    const key = `${UNREAD_KEY_PREFIX}${user.id}`;
    const stored = localStorage.getItem(key);
    setChatUnread(stored ? Number(stored) || 0 : 0);
    seenMessageIdsRef.current = new Set();
  }, [user.id]);

  useEffect(() => {
    const key = `${UNREAD_KEY_PREFIX}${user.id}`;
    localStorage.setItem(key, String(chatUnread));
  }, [chatUnread, user.id]);

  useEffect(() => {
    localStorage.setItem(PAGE_STORAGE_KEY, page);
  }, [page]);

  useEffect(() => {
    if (page === 'chat') {
      setChatUnread(0);
    }
  }, [page]);

  useEffect(() => {
    const handleMessage = (message: { id: string }) => {
      if (!message?.id) return;
      if (seenMessageIdsRef.current.has(message.id)) return;
      seenMessageIdsRef.current.add(message.id);
      if (page !== 'chat') {
        setChatUnread(prev => prev + 1);
      }
    };
    socket.on('global:message', handleMessage);
    return () => {
      socket.off('global:message', handleMessage);
    };
  }, [page]);

  useEffect(() => {
    const handleResize = () => setFacebookUrl(getFacebookUrl());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (page === 'welcome') {
    return <WelcomePage user={user} onNavigate={setPage} unreadCount={chatUnread} />;
  }

  return (
    <ErrorBoundary>
      <div className="app-shell">
        <div className="app-header">
          <img src="/carp_king_logo.png" alt="Carp King Logo" className="app-logo" />
          <span className="app-title">Team Workspace</span>
          <div className="app-nav">
            <button onClick={() => setPage('welcome')} className="btn btn-nav">Home</button>
            <button onClick={() => setPage('slots')} className="btn btn-nav">Slot Planner</button>
            <button onClick={() => setPage('meetings')} className="btn btn-nav">Meetings</button>
            <button onClick={() => setPage('chat')} className="btn btn-nav btn-badge">
              <span>Global Chat</span>
              {chatUnread > 0 && <span className="unread-badge">{chatUnread > 99 ? '99+' : chatUnread}</span>}
            </button>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-nav"
            >Facebook</a>
            {user.role === 'admin' && (
              <button onClick={() => setPage('upload')} className="btn btn-nav">Admin</button>
            )}
          </div>
          <button
            className="nav-toggle"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            aria-expanded={navOpen}
          >
            Menu
          </button>
          <span className="user-badge">Welcome, {user.name} ({user.role})</span>
        </div>
        <div className={`nav-backdrop ${navOpen ? 'open' : ''}`} onClick={() => setNavOpen(false)} />
        <div className={`nav-drawer ${navOpen ? 'open' : ''}`}>
          <button className="btn btn-ghost" onClick={() => setNavOpen(false)}>Close</button>
          <button onClick={() => { setPage('welcome'); setNavOpen(false); }} className="btn btn-nav">Home</button>
          <button onClick={() => { setPage('slots'); setNavOpen(false); }} className="btn btn-nav">Slot Planner</button>
          <button onClick={() => { setPage('meetings'); setNavOpen(false); }} className="btn btn-nav">Meetings</button>
          <button onClick={() => { setPage('chat'); setNavOpen(false); }} className="btn btn-nav btn-badge">
            <span>Global Chat</span>
            {chatUnread > 0 && <span className="unread-badge">{chatUnread > 99 ? '99+' : chatUnread}</span>}
          </button>
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-nav"
            onClick={() => setNavOpen(false)}
          >
            Facebook
          </a>
          {user.role === 'admin' && (
            <button onClick={() => { setPage('upload'); setNavOpen(false); }} className="btn btn-nav">Admin</button>
          )}
          <button className="btn btn-danger" onClick={() => setNavOpen(false)}>Dismiss</button>
        </div>
        <div className="app-content">
          {page === 'upload' && user.role === 'admin' ? (
            <AdminPanel />
          ) : page === 'upload' ? (
            <>
              <ImageUpload onUpload={setUploadedUrl} />
              {uploadedUrl && (
                <div>
                  <p>Uploaded image URL: <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">{uploadedUrl}</a></p>
                  <img src={uploadedUrl} alt="Uploaded" width={200} />
                </div>
              )}
            </>
          ) : null}
          {/* Facebook button now links directly to Facebook page, so no internal Facebook tools */}
          {page === 'chat' && <GlobalChat />}
          {page === 'slots' && <PlannerLayout />}
          {page === 'meetings' && <MeetingsPage />}
        </div>
      </div>
    </ErrorBoundary>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <MainApp />
  </AuthProvider>
);

export default App;
