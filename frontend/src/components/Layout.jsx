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
      <div className="ambient-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          <FlashMessages />
          {children ?? <Outlet />}
        </motion.main>
      </AnimatePresence>
    </>
  );
}
