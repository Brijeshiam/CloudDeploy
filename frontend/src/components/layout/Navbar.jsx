import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import {
  Rocket,
  LayoutDashboard,
  BookOpen,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Shield,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar() {
  const { user, logout, isAdmin, initials, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-3 z-50 w-[calc(100%-24px)] sm:w-[calc(100%-48px)] max-w-7xl mx-auto rounded-full border border-white/10"
      style={{
        background: 'rgba(248, 251, 255, 0.05)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        boxShadow: '0 0 30px rgba(82, 141, 255, 0.1)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 0 16px rgba(99,102,241,0.4)',
              }}
            >
              <Rocket size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              <span className="gradient-text">Cloud</span>
              <span style={{ color: 'var(--text-primary)' }}>Deploy</span>
            </span>
          </Link>

          {/* Center Nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/dashboard" icon={<LayoutDashboard size={15} />} label="Dashboard" />
            <NavLink
              to="/docs"
              icon={<BookOpen size={15} />}
              label="Docs"
            />
            {isAdmin && (
              <NavLink to="/admin" icon={<Shield size={15} />} label="Admin" />
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <button className="btn-icon relative">
                  <Bell size={16} />
                  <span
                    className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                    style={{ background: '#6366f1' }}
                  />
                </button>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-white/5"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
                    >
                      {initials}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)', lineHeight: 1 }}>
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: 2 }}>
                        {user?.role || 'member'}
                      </p>
                    </div>
                    <ChevronDown
                      size={14}
                      style={{ color: 'var(--text-muted)', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                    />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden z-50 glass"
                        style={{
                          background: 'rgba(10, 20, 34, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                        }}
                      >
                        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {user?.name}
                          </p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                            {user?.email}
                          </p>
                        </div>
                        <div className="py-1.5">
                          <DropdownItem
                            icon={<User size={14} />}
                            label="Profile"
                            onClick={() => { setDropdownOpen(false); }}
                          />
                          <DropdownItem
                            icon={<Settings size={14} />}
                            label="Settings"
                            onClick={() => { setDropdownOpen(false); }}
                          />
                          {isAdmin && (
                            <DropdownItem
                              icon={<Shield size={14} />}
                              label="Admin Panel"
                              onClick={() => { navigate('/admin'); setDropdownOpen(false); }}
                            />
                          )}
                        </div>
                        <div className="py-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                          <DropdownItem
                            icon={<LogOut size={14} />}
                            label="Sign Out"
                            onClick={handleLogout}
                            danger
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-secondary btn-sm">Sign In</Link>
                <Link to="/register" className="btn-primary btn-sm flex items-center gap-1.5">
                  Get Started <Zap size={13} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

function NavLink({ to, href, icon, label, external }) {
  const baseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    borderRadius: 8,
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    transition: 'all 0.2s',
    cursor: 'pointer',
    textDecoration: 'none',
  };

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={baseStyle}
        className="hover:bg-white/5 hover:text-white">
        {icon} {label}
      </a>
    );
  }

  return (
    <Link to={to} style={baseStyle} className="hover:bg-white/5 hover:text-white">
      {icon} {label}
    </Link>
  );
}

function DropdownItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150"
      style={{
        color: danger ? 'var(--danger)' : 'var(--text-secondary)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger
          ? 'rgba(239,68,68,0.08)'
          : 'rgba(255,255,255,0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {icon}
      {label}
    </button>
  );
}
