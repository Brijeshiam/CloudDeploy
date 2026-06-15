import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail, Lock, User, Eye, EyeOff, Rocket, ArrowRight, AlertCircle, CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

function PasswordStrength({ password }) {
  const getStrength = (p) => {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strength = getStrength(password);
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

  if (!password) return null;

  return (
    <div className="flex flex-col gap-1.5 mt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{
              background: i <= strength ? colors[strength] : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color: colors[strength] }}>
        {labels[strength]} password
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!acceptTerms) errs.terms = 'You must accept the terms';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    const result = await register(form.name, form.email, form.password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setServerError(result.error || 'Registration failed. Please try again.');
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
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 -left-40 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)', animation: 'float 8s ease-in-out infinite' }} />
        <div className="absolute bottom-1/4 -right-40 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06), transparent 70%)', animation: 'float 11s ease-in-out infinite 3s' }} />
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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Create your account</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Start deploying in minutes</p>
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
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
            >
              <AlertCircle size={15} />
              {serverError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
              <div className="input-icon-wrapper">
                <User size={15} className="input-icon" />
                <input
                  type="text"
                  className="input input-with-icon"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange('name')}
                  autoComplete="name"
                />
              </div>
              {errors.name && <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Email address</label>
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
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="input-icon-wrapper">
                <Lock size={15} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input input-with-icon"
                  style={{ paddingRight: 38 }}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={handleChange('password')}
                  autoComplete="new-password"
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
              <PasswordStrength password={form.password} />
              {errors.password && <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
              <div className="input-icon-wrapper">
                <Lock size={15} className="input-icon" />
                <input
                  type="password"
                  className="input input-with-icon"
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  autoComplete="new-password"
                />
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <CheckCircle
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: '#10b981' }}
                  />
                )}
              </div>
              {errors.confirmPassword && <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.confirmPassword}</p>}
            </div>

            {/* Terms */}
            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    if (errors.terms) setErrors((prev) => ({ ...prev, terms: '' }));
                  }}
                  className="mt-0.5"
                  style={{ accentColor: '#6366f1' }}
                />
                <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  I agree to the{' '}
                  <a href="#" style={{ color: '#818cf8' }}>Terms of Service</a>{' '}
                  and{' '}
                  <a href="#" style={{ color: '#818cf8' }}>Privacy Policy</a>
                </span>
              </label>
              {errors.terms && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.terms}</p>}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              className="btn-primary w-full justify-center mt-1"
              style={{ padding: '12px', fontSize: '0.9rem' }}
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-medium" style={{ color: '#818cf8' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
