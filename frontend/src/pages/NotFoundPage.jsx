import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HelpCircle, Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="glass p-10 md:p-14 max-w-lg w-full text-center relative z-10 rounded-2xl border border-white/5 shadow-2xl"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 text-indigo-400 mb-8"
        >
          <HelpCircle size={48} className="animate-pulse-glow rounded-full p-1" />
        </motion.div>

        <h1 className="text-7xl font-extrabold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent mb-4">
          404
        </h1>
        <h2 className="text-2xl font-bold text-white mb-3">Lost in Orbit?</h2>
        <p className="text-slate-400 text-sm md:text-base mb-8">
          The page you are looking for has been moved to a different namespace or deleted. Let's get you back to base.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/dashboard"
            className="btn-primary py-3 px-6 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Home size={16} />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary py-3 px-6 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 text-slate-300 hover:text-white border border-white/10 hover:bg-white/5"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}
