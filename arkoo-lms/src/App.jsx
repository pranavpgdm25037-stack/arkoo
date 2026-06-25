import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ApplyPage from './pages/ApplyPage';
import Dashboard from './pages/Dashboard';
import { Layers } from 'lucide-react';

function App() {
  return (
    <Router>
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <Layers size={24} />
            Arkoo LMS
          </Link>
          <div className="navbar-links">
            <Link to="/" className="navbar-link">Contact</Link>
            <Link to="/dashboard" className="navbar-link">Dashboard</Link>
          </div>
        </div>
      </nav>
      
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
