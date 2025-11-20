import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', roles: ['admin', 'doctor', 'staff', 'receptionist'] },
    { name: 'Patients', path: '/patients', roles: ['admin', 'doctor', 'receptionist'] },
    { name: 'Appointments', path: '/appointments', roles: ['admin', 'doctor', 'receptionist'] },
    { name: 'Prescriptions', path: '/prescriptions', roles: ['admin', 'doctor'] },
    { name: 'Admin', path: '/admin', roles: ['admin'] },
  ];

  const userNavigation = navigation.filter(item => 
    item.roles.includes(user?.role) || item.roles.includes('admin')
  );

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <h2>EHR System</h2>
          <p className="user-welcome">Welcome, {user?.firstName}</p>
          <p className="user-role">{user?.role}</p>
        </div>

        <nav className="sidebar-nav">
          {userNavigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActiveRoute(item.path) ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            ☰
          </button>
          <div className="header-info">
            <span>EHR System v2.0.0</span>
          </div>
          <div className="user-info">
            <span>{user?.firstName} {user?.lastName}</span>
            <span className="role-badge">{user?.role}</span>
          </div>
        </header>

        {/* Page Content */}
        <div className="content-area">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
