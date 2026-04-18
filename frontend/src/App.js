import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { store } from './store/store';
import LogInteractionScreen from './components/LogInteractionScreen';
import HistoryView from './components/HistoryView';
import Dashboard from './components/Dashboard';
import '../src/styles/global.css';

const NAV = [
  { path: '/', label: 'Dashboard', icon: '⊞' },
  { path: '/log', label: 'Log Interaction', icon: '✎' },
  { path: '/history', label: 'Interaction History', icon: '⊙' },
];

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <span>◈</span> HCP <span>CRM</span>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(n => (
          <NavLink
            key={n.path}
            to={n.path}
            end={n.path === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span style={{ fontSize: 15 }}>{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>AI Model</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>gemma2-9b-it</div>
        <div style={{ fontSize: 11, color: 'rgba(79,156,249,0.8)', marginTop: 2 }}>● Groq Connected</div>
      </div>
    </div>
  );
}

function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/log" element={<LogInteractionScreen />} />
          <Route path="/history" element={<HistoryView />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppShell />
      </Router>
    </Provider>
  );
}
