import { Outlet } from 'react-router-dom';
import Header from './Header';
import FlashMessages from './FlashMessages';

// `children` lets the shell wrap a directly-rendered page (see the "/" route,
// which picks between the landing page and the dashboard); routed pages still
// come through the Outlet as before.
export default function Layout({ children }) {
  return (
    <>
      <div className="ambient-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <Header />
      <main>
        <FlashMessages />
        {children ?? <Outlet />}
      </main>
    </>
  );
}
