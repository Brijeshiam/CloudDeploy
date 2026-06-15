import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, KeyRound, Shield, AlertCircle, Save } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      return toast.error('Name cannot be empty.');
    }
    setIsSavingProfile(true);
    try {
      const response = await authAPI.updateProfile(profileForm);
      updateUser(profileForm);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('New passwords do not match.');
    }
    if (passwordForm.newPassword.length < 8) {
      return toast.error('New password must be at least 8 characters long.');
    }
    setIsSavingPassword(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}
            >
              <User size={17} style={{ color: '#6366f1' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Account Settings</h1>
          </div>
          <p className="text-sm mt-1 ml-12" style={{ color: 'var(--text-muted)' }}>
            Manage your personal profile, email settings, and security passwords
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sub Navigation */}
          <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => setActiveSubTab('profile')}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: activeSubTab === 'profile' ? 'rgba(99,102,241,0.12)' : 'transparent',
                color: activeSubTab === 'profile' ? '#818cf8' : 'var(--text-muted)',
                border: activeSubTab === 'profile' ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
              }}
            >
              <User size={16} />
              Profile Details
            </button>
            <button
              onClick={() => setActiveSubTab('password')}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: activeSubTab === 'password' ? 'rgba(99,102,241,0.12)' : 'transparent',
                color: activeSubTab === 'password' ? '#818cf8' : 'var(--text-muted)',
                border: activeSubTab === 'password' ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
              }}
            >
              <KeyRound size={16} />
              Security & Password
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1">
            <motion.div
              key={activeSubTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="glass-card rounded-xl p-6 border border-white/10"
              style={{ background: 'var(--bg-card)' }}
            >
              {activeSubTab === 'profile' && (
                <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Profile Details</h3>
                  
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="input opacity-60 cursor-not-allowed"
                      value={profileForm.email}
                      disabled
                      title="Email address cannot be changed."
                    />
                    <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <AlertCircle size={12} /> Email change requires contacting system administrator.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-indigo-400" />
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Role: <span className="font-semibold uppercase text-indigo-400">{user?.role || 'user'}</span>
                      </span>
                    </div>
                    <button type="submit" className="btn-primary btn-sm flex items-center gap-1.5" disabled={isSavingProfile}>
                      {isSavingProfile ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {activeSubTab === 'password' && (
                <form onSubmit={handlePasswordChange} className="flex flex-col gap-5">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Change Password</h3>

                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Current Password
                    </label>
                    <input
                      type="password"
                      className="input"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      New Password
                    </label>
                    <input
                      type="password"
                      className="input"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="input"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="flex justify-end pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <button type="submit" className="btn-primary btn-sm flex items-center gap-1.5" disabled={isSavingPassword}>
                      {isSavingPassword ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Changing...
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          Update Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
