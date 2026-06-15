import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useRef, useEffect } from 'react';
import {
  Rocket,
  GitBranch,
  Package,
  Server,
  Zap,
  Terminal,
  Globe,
  ArrowRight,
  CheckCircle,
  ChevronRight,
  Shield,
  Activity,
  Maximize2,
} from 'lucide-react';
import ShaderBackground from '../components/ui/ShaderBackground';

const FEATURES = [
  {
    icon: <Globe size={22} />,
    title: 'Global Edge',
    description: 'Deploy your content to over 300 locations globally for sub-millisecond latency and optimal content delivery.',
    color: '#4f8cff',
  },
  {
    icon: <Shield size={22} />,
    title: 'Ironclad Security',
    description: 'Automatic SSL certificates, DDoS protection, and fully isolated runtime environments per deployment namespace.',
    color: '#8aceff',
  },
  {
    icon: <Activity size={22} />,
    title: 'Real-time Insights',
    description: 'Deep observability with live metrics, unified logs, and resource usage tracking at any scale.',
    color: '#97cee7',
  },
];

const PIPELINE_STEPS = [
  {
    icon: <Terminal size={24} />,
    title: 'Developer',
    description: 'Code on your local machine and commit standard git changes.',
    color: '#4f8cff',
  },
  {
    icon: <GitBranch size={24} />,
    title: 'GitHub Trigger',
    description: 'Connect repository. We watch branches for push triggers automatically.',
    color: '#8aceff',
  },
  {
    icon: <Rocket size={24} />,
    title: 'Live URL',
    description: 'Kubernetes builds and runs the container with SSL ready.',
    color: '#afc6ff',
  },
];

function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="glass-card glass-hover rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group"
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 blur-3xl -z-10 group-hover:opacity-100 opacity-60 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle, ${feature.color}25 0%, transparent 70%)`
        }}
      />
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: `${feature.color}15`,
          border: `1px solid ${feature.color}30`,
        }}
      >
        <span style={{ color: feature.color }}>{feature.icon}</span>
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-2 text-primary">
          {feature.title}
        </h3>
        <p className="text-sm leading-relaxed text-on-surface-variant">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const pipelineRef = useRef(null);

  // Particle network canvas animation
  useEffect(() => {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles = [];
    const particleCount = 35;
    let animationFrameId;

    function init() {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2 + 1
        });
      }
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#afc6ff';

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 90) {
            ctx.strokeStyle = `rgba(175, 198, 255, ${(1 - dist / 90) * 0.25})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });
      animationFrameId = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', init);
    init();
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', init);
    };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col bg-background text-on-surface overflow-x-hidden">
      {/* WebGL Cloud Shader Background */}
      <ShaderBackground opacity={0.5} />

      {/* Header / Pill Navigation Bar */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-3 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-7xl z-50 rounded-full border border-white/10 bg-white/5 backdrop-blur-2xl px-6 py-2.5 shadow-[0_0_40px_rgba(82,141,255,0.1)] flex justify-between items-center"
      >
        <div className="flex items-center gap-2">
          <Rocket className="text-primary" size={20} />
          <span className="font-bold text-lg tracking-tight text-primary">CloudDeploy</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-secondary btn-sm rounded-full px-4 py-1.5 text-xs">Sign In</Link>
          <Link to="/register" className="btn-primary btn-sm rounded-full px-4 py-1.5 text-xs">Get Started</Link>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center pt-36 pb-16 px-6 text-center overflow-hidden min-h-[85vh]">
        {/* Soft Background Blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/15 rounded-full blur-[120px] -z-10 animate-pulse-soft"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-secondary/10 rounded-full blur-[140px] -z-10 animate-pulse-soft"></div>

        <div className="relative z-10 max-w-3xl flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 glass-card rounded-full mb-8 shadow-inner"
          >
            <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-medium text-xs text-secondary tracking-wide uppercase">V2.0 Now Live</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-none text-on-surface mb-6"
          >
            Deploy to the Cloud <br className="hidden sm:inline" />
            <span className="gradient-text">in Seconds</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-base sm:text-lg max-w-xl text-on-surface-variant mb-10 leading-relaxed"
          >
            Build, Deploy, Scale, and Monitor Applications with a Beautiful Cloud Platform. Experience the future of infrastructure.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto min-w-[300px]"
          >
            <Link to="/register" className="btn-primary justify-center text-sm font-semibold py-3.5 px-8 rounded-xl shadow-[0_0_20px_rgba(82,141,255,0.3)] hover:scale-[1.02] transition-transform active:scale-95 flex-1">
              Start Deploying
            </Link>
            <Link to="/login?demo=true" className="btn-secondary justify-center text-sm font-semibold py-3.5 px-8 rounded-xl hover:bg-white/10 transition-colors flex-1">
              Live Demo
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Pipeline Stepper Visualization */}
      <section className="px-6 py-20 max-w-5xl mx-auto w-full relative">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-on-surface mb-2">Automated Pipeline</h2>
          <p className="text-xs uppercase tracking-widest text-on-surface-variant opacity-80">Git Push to Production</p>
        </div>

        <div className="relative glass-card rounded-3xl p-8 sm:p-12 overflow-hidden min-h-[380px] flex items-center justify-center">
          {/* Particle canvas background overlay */}
          <canvas id="particleCanvas" className="absolute inset-0 w-full h-full pointer-events-none opacity-50" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-around w-full gap-8 md:gap-4">
            {PIPELINE_STEPS.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center gap-4 text-center group max-w-[220px]">
                <div
                  className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center transition-all duration-300 group-hover:border-primary group-hover:scale-105"
                  style={{ boxShadow: `0 0 20px rgba(82, 141, 255, 0.1)` }}
                >
                  <span className="text-primary">{step.icon}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">{step.title}</h3>
                  <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Features Grid */}
      <section className="px-6 py-20 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((feature, idx) => (
            <FeatureCard key={idx} feature={feature} index={idx} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full mt-auto border-t border-white/5 py-12 bg-white/2 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Rocket className="text-primary" size={16} />
            <span className="font-bold text-sm tracking-tight text-primary">CloudDeploy</span>
          </div>
          <p className="text-xs text-on-surface-variant">
            © {new Date().getFullYear()} CloudDeploy. The Cloud is Alive.
          </p>
          <div className="flex gap-6 text-xs text-on-surface-variant">
            <Link to="/docs" className="hover:text-primary transition-colors">Documentation</Link>
            <a href="#" className="hover:text-primary transition-colors">Status</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
