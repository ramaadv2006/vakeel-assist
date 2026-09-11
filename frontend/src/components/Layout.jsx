import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import FlashMessages from './FlashMessages';

// `children` lets the shell wrap a directly-rendered page (see the "/" route,
// which picks between the landing page and the dashboard); routed pages still
// come through the Outlet as before.
export default function Layout({ children }) {
  const location = useLocation();

  return (
    <>
      <div className="ambient-canvas" aria-hidden="true">
        <div className="ambient-glow ambient-glow-gold" />
        <div className="ambient-glow ambient-glow-sapphire" />
        <div className="ambient-grid-overlay" />
      </div>
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <FlashMessages />
          {children ?? <Outlet />}
        </motion.main>
      </AnimatePresence>
    </>
  );
}
