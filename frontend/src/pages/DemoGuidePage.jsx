import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Rocket,
  GitBranch,
  Terminal,
  Server,
  Play,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  Code
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';

const STEPS = [
  {
    title: '1. Create a Repository',
    icon: <GitBranch className="text-indigo-400" size={24} />,
    description: 'Ensure your app is on GitHub and has a valid Dockerfile in the root folder.',
    details: 'The Dockerfile instructs CloudDeploy how to containerize and run your application. For example, a basic Node.js app Dockerfile should expose your app port (e.g. 3000).'
  },
  {
    title: '2. Create a New Project',
    icon: <Server className="text-indigo-400" size={24} />,
    description: 'Go to your Dashboard, click "New Project", and link your GitHub Repository URL.',
    details: 'You will configure the project name, select your default branch (e.g., main), and specify the application port matching your Dockerfile.'
  },
  {
    title: '3. Inject Environment Variables',
    icon: <Terminal className="text-indigo-400" size={24} />,
    description: 'Add any database URIs or app secrets required by your build.',
    details: 'Variables marked as "Secret" are encrypted via AES-256 and stored as native Kubernetes Secret resources for security.'
  },
  {
    title: '4. Trigger and Watch Build',
    icon: <Play className="text-indigo-400" size={24} />,
    description: 'Click "Deploy" to trigger the automated build pipeline in real-time.',
    details: 'CloudDeploy will clone the repository, build the image locally via Docker, push it to your configured registry, and deploy it onto your Kubernetes cluster.'
  },
  {
    title: '5. Access Your Live Application',
    icon: <Rocket className="text-indigo-400" size={24} />,
    description: 'Once the deployment turns to "Running", click the generated domain URL!',
    details: 'The platform generates a wildcard domain (e.g., project-slug.192.168.49.2.nip.io) routed to the Kubernetes Nginx Ingress Controller.'
  }
];

export default function DemoGuidePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      navigate('/dashboard');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-secondary btn-sm flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Interactive Demo Guide
          </span>
        </div>

        {/* Step Indicator Bullets */}
        <div className="flex justify-between items-center mb-10 relative">
          <div className="absolute left-0 right-0 h-0.5 bg-white/5 -z-10" />
          <div
            className="absolute left-0 h-0.5 bg-indigo-500 transition-all duration-300 -z-10"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          />
          {STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className="w-8 h-8 rounded-full flex items-center justify-center border text-xs font-semibold transition-all duration-300"
              style={{
                background: idx <= currentStep ? '#6366f1' : '#0e0e18',
                borderColor: idx <= currentStep ? '#6366f1' : 'rgba(255,255,255,0.1)',
                color: idx <= currentStep ? '#fff' : 'var(--text-muted)',
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Main Content Box */}
        <div
          className="rounded-2xl p-8 sm:p-10 mb-8 border border-white/10"
          style={{
            background: 'var(--bg-card)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  {STEPS[currentStep].icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{STEPS[currentStep].title}</h2>
                  <p className="text-sm text-slate-400 mt-1">{STEPS[currentStep].description}</p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <HelpCircle size={13} /> Details & Insights
                </h4>
                <p className="text-sm leading-relaxed text-slate-300">
                  {STEPS[currentStep].details}
                </p>
              </div>

              {currentStep === 0 && (
                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/10 flex items-start gap-3">
                  <Code size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-indigo-300 leading-relaxed">
                    <strong>Sample Dockerfile:</strong><br />
                    <code className="block mt-2 p-2 rounded bg-black/40 text-indigo-200 overflow-x-auto font-mono">
                      FROM node:20-alpine<br />
                      WORKDIR /app<br />
                      COPY package*.json ./<br />
                      RUN npm ci<br />
                      COPY . .<br />
                      EXPOSE 3000<br />
                      CMD ["node", "server.js"]
                    </code>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Stepper Actions */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/5">
            <button onClick={handlePrev} className="btn-secondary flex items-center gap-1.5 text-sm">
              <ArrowLeft size={16} />
              {currentStep === 0 ? 'Dashboard' : 'Previous'}
            </button>
            <button onClick={handleNext} className="btn-primary flex items-center gap-1.5 text-sm">
              {currentStep === STEPS.length - 1 ? (
                <>
                  Go to Dashboard <CheckCircle size={16} />
                </>
              ) : (
                <>
                  Next Step <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
