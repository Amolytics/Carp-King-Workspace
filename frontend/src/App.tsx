import React, { useState } from 'react';
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

const PAGES = [
  { key: 'welcome', label: 'Welcome' },
  { key: 'slots', label: 'Slot Planner' },
  { key: 'meetings', label: 'Meetings' },
  { key: 'chat', label: 'Global Chat' },
  { key: 'facebook', label: 'Facebook' },
];

const WelcomePage: React.FC<{ user: any; onNavigate: (page: string) => void }> = ({ user, onNavigate }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 0,
  }}>
    <img src="/carp_king_logo.png" alt="Carp King Logo" style={{ maxWidth: 220, width: '100%', height: 'auto', margin: '6px 0 2px 0', boxShadow: '0 2px 16px #0006', borderRadius: 8 }} />
    <h1 style={{ color: '#ffe066', fontSize: 24, fontWeight: 900, marginBottom: 4, textShadow: '1px 1px 8px #222' }}>Welcome, {user.name}!</h1>
    <div style={{ color: '#ffe066cc', fontSize: 14, marginBottom: 12 }}>What would you like to do?</div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8 }}>
      <button onClick={() => onNavigate('slots')} style={{ ...navBtnStyle, padding: '8px 16px', fontSize: 14 }}>Slot Planner</button>
      <button onClick={() => onNavigate('meetings')} style={{ ...navBtnStyle, padding: '8px 16px', fontSize: 14 }}>Meetings</button>
      <button onClick={() => onNavigate('chat')} style={{ ...navBtnStyle, padding: '8px 16px', fontSize: 14 }}>Global Chat</button>
      <button onClick={() => onNavigate('facebook')} style={{ ...navBtnStyle, padding: '8px 16px', fontSize: 14 }}>Facebook</button>
    </div>
    <LogoutButton onNavigate={onNavigate} />
  </div>
);

const navBtnStyle: React.CSSProperties = {
  padding: '10px 0',
  borderRadius: 6,
  background: '#ffe066',
  color: '#23241a',
  fontWeight: 700,
  fontSize: 16,
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 1px 4px #0002',
  marginBottom: 0,
  letterSpacing: 1,
  transition: 'background 0.2s',
  minWidth: 130,
  maxWidth: 130,
  height: 44,
  textAlign: 'center',
  marginRight: 8,
  outline: 'none',
};

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
  const [page, setPage] = useState<string>('welcome');
  const { user } = useAuth();
  if (!user) return <Login />;

  if (page === 'welcome') {
    return <WelcomePage user={user} onNavigate={setPage} />;
  }

  return (
    <ErrorBoundary>
      <div className="container" style={{ maxWidth: 1200, margin: '0 auto', minHeight: '80vh' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'row',
          background: 'rgba(30,32,24,0.98)',
          padding: '8px 24px',
          borderBottom: '2px solid #ffe06644',
          boxShadow: '0 2px 12px #0006',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <img src="/carp_king_logo.png" alt="Carp King Logo" style={{ height: 48, width: 48, marginRight: 18, borderRadius: 8, boxShadow: '0 2px 8px #0003' }} />
          <span style={{ color: '#ffe066', fontSize: 28, fontWeight: 900, letterSpacing: 1, marginRight: 32 }}>Team Workspace</span>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginRight: 'auto' }}>
            <button onClick={() => setPage('welcome')} style={navBtnStyle}>Home</button>
            <button onClick={() => setPage('slots')} style={navBtnStyle}>Slot Planner</button>
            <button onClick={() => setPage('meetings')} style={navBtnStyle}>Meetings</button>
            <button onClick={() => setPage('chat')} style={navBtnStyle}>Global Chat</button>
            <button
              onClick={() => window.open('https://www.facebook.com/profile.php?id=61586021865588', '_blank')}
              style={navBtnStyle}
            >Facebook</button>
            {user.role === 'admin' && (
              <button onClick={() => setPage('upload')} style={navBtnStyle}>Admin</button>
            )}
          </div>
          <span style={{ marginLeft: 'auto', color: '#ffe066cc', fontWeight: 600, fontSize: 16 }}>Welcome, {user.name} ({user.role})</span>
        </div>
        <div style={{ padding: '24px 16px' }}>
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
