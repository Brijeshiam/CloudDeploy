import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Terminal,
  GitBranch,
  KeyRound,
  Activity,
  ArrowLeft,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';

const SECTIONS = [
  {
    id: 'intro',
    title: 'Introduction',
    icon: <BookOpen size={16} />,
    content: (
      <div>
        <h2 className="text-2xl font-bold mb-4 text-white">Introduction to CloudDeploy</h2>
        <p className="text-slate-300 mb-4">
          CloudDeploy is a self-hosted, mini Railway/Heroku-style PaaS (Platform as a Service) built on top of Kubernetes.
          It automates the entire deployment cycle: you connect a GitHub repository, and CloudDeploy automatically clones the code,
          builds a secure Docker image, pushes it to your registry, and deploys it to a dedicated Kubernetes namespace with a public URL.
        </p>
        <p className="text-slate-300">
          This documentation guide provides instructions for configuring your applications, managing database variables,
          and troubleshooting builds using real-time log viewers.
        </p>
      </div>
    ),
  },
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <Zap size={16} />,
    content: (
      <div>
        <h2 className="text-2xl font-bold mb-4 text-white">Deploying Your First App</h2>
        <p className="text-slate-300 mb-4">
          Follow these simple steps to deploy an application on CloudDeploy:
        </p>
        <ol className="list-decimal list-inside text-slate-300 space-y-3 mb-6">
          <li>
            Navigate to the <Link to="/dashboard" className="text-indigo-400 hover:underline">Dashboard</Link> and click the <strong>New Project</strong> button.
          </li>
          <li>
            Enter your project details: a name, a public GitHub Repository URL (e.g., <code>https://github.com/user/my-app</code>), and the branch (e.g., <code>main</code>).
          </li>
          <li>
            Make sure your repository has a valid <code>Dockerfile</code> in its root directory.
          </li>
          <li>
            Configure any necessary environment variables in the next step.
          </li>
          <li>
            Review and click <strong>Deploy</strong>. Watch the pipeline build and push in real-time.
          </li>
        </ol>
        <div className="rounded-xl p-4 bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-sm">
          <strong>Tip:</strong> Ensure your application listens on the port configured in your project settings (default is <code>3000</code>).
        </div>
      </div>
    ),
  },
  {
    id: 'docker',
    title: 'Dockerfile Config',
    icon: <Terminal size={16} />,
    content: (
      <div>
        <h2 className="text-2xl font-bold mb-4 text-white">Dockerfile Requirements</h2>
        <p className="text-slate-300 mb-4">
          CloudDeploy uses Docker to containerize your application. Your project root must contain a file named <code>Dockerfile</code>.
          Here is a standard example for a Node.js web application:
        </p>
        <pre className="rounded-xl p-5 bg-black/40 border border-white/5 text-slate-300 font-mono text-sm overflow-x-auto mb-6">
{`FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]`}
        </pre>
        <p className="text-slate-300">
          Make sure the <code>EXPOSE</code> port matches the port specified in your project settings so that Kubernetes ingress routing directs traffic correctly.
        </p>
      </div>
    ),
  },
  {
    id: 'env-vars',
    title: 'Environment Variables',
    icon: <KeyRound size={16} />,
    content: (
      <div>
        <h2 className="text-2xl font-bold mb-4 text-white">Managing Environment Variables</h2>
        <p className="text-slate-300 mb-4">
          CloudDeploy allows you to set environment variables that are injected into your running application.
        </p>
        <h3 className="text-lg font-semibold text-white mb-2">Secret Variables</h3>
        <p className="text-slate-300 mb-4">
          By toggling the <strong>Secret</strong> switch, the value is securely encrypted inside MongoDB using AES-256.
          When deploying, secret variables are automatically loaded into a native Kubernetes <strong>Secret</strong> resource, while non-sensitive variables are stored in a Kubernetes <strong>ConfigMap</strong>.
        </p>
        <h3 className="text-lg font-semibold text-white mb-2">Syncing Configs</h3>
        <p className="text-slate-300">
          If you add, edit, or delete variables for an active deployment, click <strong>Sync to K8s</strong> to trigger a rolling restart of your pods and load the new configurations immediately.
        </p>
      </div>
    ),
  },
  {
    id: 'scaling',
    title: 'Autoscaling & Replicas',
    icon: <Activity size={16} />,
    content: (
      <div>
        <h2 className="text-2xl font-bold mb-4 text-white">Scaling and Reliability</h2>
        <p className="text-slate-300 mb-4">
          Applications running on CloudDeploy leverage Kubernetes' native orchestration features:
        </p>
        <ul className="list-disc list-inside text-slate-300 space-y-2 mb-6">
          <li><strong>Manual Scaling:</strong> Adjust the replica slider under project settings to scale the number of pods running your application up or down instantly.</li>
          <li><strong>Autoscaling (HPA):</strong> Enable the Horizontal Pod Autoscaler by specifying a minimum/maximum replica boundary and a target CPU threshold (e.g., 70%). Kubernetes will automatically spin up new pods when load increases.</li>
          <li><strong>Rollbacks:</strong> If a new deployment fails or introduces a bug, select a previous healthy version from the history list and click <strong>Rollback</strong> to instantly restore the preceding deployment.</li>
        </ul>
      </div>
    ),
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('intro');

  const currentSection = SECTIONS.find((s) => s.id === activeSection);

  return (
    <PageLayout>
      <div className="flex items-center gap-2 text-sm mb-6 text-slate-400">
        <Link to="/dashboard" className="hover:text-white transition-colors flex items-center gap-1.5">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="sticky top-20 glass rounded-xl p-3 border border-white/5">
            <div className="px-3 py-2 mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Documentation
              </h3>
            </div>
            <nav className="flex flex-col gap-1">
              {SECTIONS.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left"
                    style={{
                      background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                      color: isActive ? '#818cf8' : 'var(--text-secondary)',
                      border: isActive ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                    }}
                  >
                    {section.icon}
                    {section.title}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass p-8 md:p-10 rounded-2xl border border-white/5 min-h-[450px] flex flex-col justify-between"
          >
            <div>
              {currentSection.content}
            </div>

            <div className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                CloudDeploy Platform Documentation
              </span>
              <div className="flex items-center gap-2">
                <Link to="/dashboard" className="btn-secondary btn-sm flex items-center gap-1 text-xs">
                  Dashboard <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}
