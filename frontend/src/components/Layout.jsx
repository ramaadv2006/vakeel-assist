import { Outlet } from 'react-router-dom';
import Header from './Header';
import FlashMessages from './FlashMessages';

export default function Layout() {
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
        <Outlet />
      </main>
    </>
  );
}
