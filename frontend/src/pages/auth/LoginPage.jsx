import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Rocket, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    const result = await login(form.email, form.password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setServerError(result.error || 'Login failed. Check your credentials.');
    }
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'var(--bg-primary)',
        backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.15), transparent)',
      }}
    >
      {/* Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)', animation: 'float 8s ease-in-out infinite' }} />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06), transparent 70%)', animation: 'float 10s ease-in-out infinite 3s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2.5 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 24px rgba(99,102,241,0.5)' }}
            >
              <Rocket size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl">
              <span className="gradient-text">Cloud</span>
              <span style={{ color: 'var(--text-primary)' }}>Deploy</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(19,19,31,0.8)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
          }}
        >
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-lg mb-5 text-sm"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171',
              }}
            >
              <AlertCircle size={15} />
              {serverError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Email address
              </label>
              <div className="input-icon-wrapper">
                <Mail size={15} className="input-icon" />
                <input
                  type="email"
                  className="input input-with-icon"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange('email')}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <a href="#" className="text-xs" style={{ color: '#818cf8' }}>Forgot password?</a>
              </div>
              <div className="input-icon-wrapper">
                <Lock size={15} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input input-with-icon"
                  style={{ paddingRight: 38 }}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange('password')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.password}</p>}
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#6366f1' }}
              />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Remember me</span>
            </label>

            {/* Submit */}
            <motion.button
              type="submit"
              className="btn-primary w-full justify-center"
              style={{ padding: '12px', fontSize: '0.9rem' }}
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <Link to="/register" className="font-medium" style={{ color: '#818cf8' }}>
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
