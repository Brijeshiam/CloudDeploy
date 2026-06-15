import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  GitBranch,
  KeyRound,
  Eye,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  Plus,
  Trash2,
  Lock,
  Info,
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { useProjectStore } from '../store/projectStore';
import toast from 'react-hot-toast';

const STEPS = [
  { label: 'Project Info', icon: <GitBranch size={16} />, description: 'Repository details' },
  { label: 'Environment', icon: <KeyRound size={16} />, description: 'Env variables' },
  { label: 'Review & Deploy', icon: <Rocket size={16} />, description: 'Confirm & launch' },
];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center mb-10">
      {STEPS.map((step, idx) => (
        <div key={step.label} className="flex items-center">
          <div className="flex flex-col items-center">
            <motion.div
              animate={{
                background: idx < current
                  ? 'rgba(16,185,129,0.15)'
                  : idx === current
                  ? 'rgba(99,102,241,0.15)'
                  : 'rgba(255,255,255,0.04)',
                borderColor: idx < current ? '#10b981' : idx === current ? '#6366f1' : 'rgba(255,255,255,0.1)',
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center border-2"
            >
              {idx < current ? (
                <CheckCircle size={16} style={{ color: '#10b981' }} />
              ) : (
                <span style={{ color: idx === current ? '#818cf8' : 'var(--text-muted)' }}>
                  {step.icon}
                </span>
              )}
            </motion.div>
            <p
              className="text-xs font-medium mt-2 text-center"
              style={{ color: idx === current ? '#818cf8' : 'var(--text-muted)' }}
            >
              {step.label}
            </p>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className="w-16 h-px mx-2 mb-5"
              style={{
                background: idx < current
                  ? '#10b981'
                  : 'rgba(255,255,255,0.08)',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Step1({ data, onChange, errors }) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
        Project Information
      </h2>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Project Name <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <input
          className="input"
          placeholder="my-awesome-app"
          value={data.name}
          onChange={(e) => onChange('name', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
        />
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Lowercase letters, numbers, and hyphens only
        </p>
        {errors.name && <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Description
        </label>
        <textarea
          className="input"
          rows={3}
          placeholder="A brief description of what this app does..."
          value={data.description}
          onChange={(e) => onChange('description', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          GitHub Repository URL <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <input
          className="input font-mono text-sm"
          placeholder="https://github.com/username/repo"
          value={data.githubUrl}
          onChange={(e) => onChange('githubUrl', e.target.value)}
        />
        {errors.githubUrl && <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.githubUrl}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Branch
          </label>
          <input
            className="input font-mono text-sm"
            placeholder="main"
            value={data.branch}
            onChange={(e) => onChange('branch', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Port
          </label>
          <input
            className="input font-mono text-sm"
            type="number"
            placeholder="3000"
            value={data.port}
            onChange={(e) => onChange('port', e.target.value)}
          />
        </div>
      </div>

      <div
        className="flex items-start gap-3 px-4 py-3 rounded-xl"
        style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <Info size={14} style={{ color: '#818cf8', marginTop: 1, flexShrink: 0 }} />
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          We'll automatically detect your <code className="code-inline">Dockerfile</code> or use a buildpack.
          Make sure the repository is accessible (public or connected via GitHub OAuth).
        </p>
      </div>
    </div>
  );
}

function Step2({ envVars, onAdd, onRemove, onUpdate }) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newIsSecret, setNewIsSecret] = useState(false);

  const handleAdd = () => {
    if (!newKey.trim()) { toast.error('Key is required'); return; }
    onAdd({ key: newKey.trim().toUpperCase().replace(/\s/g, '_'), value: newValue, isSecret: newIsSecret });
    setNewKey('');
    setNewValue('');
    setNewIsSecret(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Environment Variables
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Optional — you can add more later in Settings.
        </p>
      </div>

      {/* Add New */}
      <div
        className="rounded-xl p-4 flex flex-col gap-3"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            className="input font-mono text-xs"
            placeholder="KEY_NAME"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/\s/g, '_'))}
          />
          <input
            className="input font-mono text-xs"
            type={newIsSecret ? 'password' : 'text'}
            placeholder="value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newIsSecret}
              onChange={(e) => setNewIsSecret(e.target.checked)}
              style={{ accentColor: '#f59e0b' }}
            />
            <Lock size={11} style={{ color: '#f59e0b' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Secret</span>
          </label>
          <button onClick={handleAdd} className="btn-primary btn-sm">
            <Plus size={13} /> Add
          </button>
        </div>
      </div>

      {/* List */}
      <AnimatePresence>
        {envVars.map((ev, idx) => (
          <motion.div
            key={ev.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {ev.isSecret && <Lock size={12} style={{ color: '#f59e0b', flexShrink: 0 }} />}
            <span className="font-mono text-xs font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>
              {ev.key}
            </span>
            <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
              {ev.isSecret ? '••••••••' : ev.value || 'empty'}
            </span>
            <button onClick={() => onRemove(idx)} className="btn-icon btn-sm ml-2">
              <Trash2 size={12} style={{ color: 'var(--danger)' }} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {envVars.length === 0 && (
        <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
          No variables added yet
        </p>
      )}
    </div>
  );
}

function Step3({ projectData, envVars }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Review & Deploy
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Everything looks good? Hit deploy!
        </p>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        <div className="px-5 py-3" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>PROJECT DETAILS</p>
        </div>
        <div className="flex flex-col gap-0">
          {[
            { label: 'Name', value: projectData.name || '—' },
            { label: 'Description', value: projectData.description || '—' },
            { label: 'GitHub URL', value: projectData.githubUrl || '—', mono: true },
            { label: 'Branch', value: projectData.branch || 'main', mono: true },
            { label: 'Port', value: projectData.port || '3000', mono: true },
            { label: 'Env Variables', value: `${envVars.length} defined` },
          ].map(({ label, value, mono }) => (
            <div
              key={label}
              className="flex items-start justify-between px-5 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            >
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span
                className={`text-xs text-right max-w-xs ${mono ? 'font-mono' : 'font-medium'}`}
                style={{ color: 'var(--text-primary)' }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="flex items-start gap-3 px-4 py-3 rounded-xl"
        style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}
      >
        <CheckCircle size={14} style={{ color: '#10b981', marginTop: 1, flexShrink: 0 }} />
        <p className="text-xs leading-relaxed" style={{ color: '#6ee7b7' }}>
          After clicking Deploy, we'll clone your repo, build the Docker image, and deploy to Kubernetes.
          You'll see real-time build logs on the project page.
        </p>
      </div>
    </div>
  );
}

export default function NewProjectPage() {
  const { createProject, isLoading } = useProjectStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    githubUrl: '',
    branch: 'main',
    port: '3000',
  });
  const [envVars, setEnvVars] = useState([]);
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setProjectData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateStep1 = () => {
    const errs = {};
    if (!projectData.name.trim()) errs.name = 'Project name is required';
    else if (projectData.name.length < 2) errs.name = 'Name must be at least 2 characters';
    if (!projectData.githubUrl.trim()) errs.githubUrl = 'GitHub URL is required';
    else if (!projectData.githubUrl.startsWith('https://github.com/')) {
      errs.githubUrl = 'Must be a valid GitHub URL (https://github.com/...)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (step === 0 && !validateStep1()) return;
    setStep((s) => s + 1);
  };

  const handleDeploy = async () => {
    const result = await createProject({
      ...projectData,
      port: parseInt(projectData.port) || 3000,
      envVars,
      autoDeploy: true,
    });
    if (result.success) {
      navigate(`/projects/${result.project._id}`);
    }
  };

  return (
    <PageLayout>
      <div className="max-w-xl mx-auto">
        {/* Back */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => navigate('/dashboard')}
          className="btn-secondary btn-sm mb-6"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <StepIndicator current={step} />

          {/* Card */}
          <div
            className="rounded-2xl p-8"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {step === 0 && (
                  <Step1 data={projectData} onChange={updateField} errors={errors} />
                )}
                {step === 1 && (
                  <Step2
                    envVars={envVars}
                    onAdd={(ev) => setEnvVars((prev) => [...prev, ev])}
                    onRemove={(idx) => setEnvVars((prev) => prev.filter((_, i) => i !== idx))}
                    onUpdate={(idx, ev) =>
                      setEnvVars((prev) => prev.map((e, i) => (i === idx ? ev : e)))
                    }
                  />
                )}
                {step === 2 && <Step3 projectData={projectData} envVars={envVars} />}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="btn-secondary"
                disabled={step === 0}
              >
                <ArrowLeft size={15} /> Previous
              </button>

              {step < STEPS.length - 1 ? (
                <button onClick={nextStep} className="btn-primary">
                  Next <ChevronRight size={15} />
                </button>
              ) : (
                <button onClick={handleDeploy} className="btn-primary" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <><Rocket size={15} /> Deploy Now</>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
