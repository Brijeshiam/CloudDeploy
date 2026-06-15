import { motion } from 'framer-motion';
import Navbar from './Navbar';
import ShaderBackground from '../ui/ShaderBackground';

export default function PageLayout({ children, fullWidth = false }) {
  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Interactive WebGL cloud background */}
      <ShaderBackground opacity={0.25} />
      
      {/* Foreground contents */}
      <div className="relative z-10">
        <Navbar />
        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={fullWidth ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 py-8'}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
