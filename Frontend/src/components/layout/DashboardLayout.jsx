import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
  return (
    /*
     * ptd-app: full viewport, flex row, NO margin/padding.
     * Sidebar fills full height on its own via CSS (height: 100vh, position: sticky or fixed).
     * ptd-main-wrapper: takes remaining width, scrolls independently.
     * ptd-main-content: page content with padding.
     *
     * The CSS below is injected as an inline style block so it always wins
     * regardless of what dashboard.css does, until you update that file.
     */
    <>
      <style>{`
        /* ── Reset browser defaults that cause gaps ── */
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { margin: 0; padding: 0; height: 100%; }

        /* ── App shell ── */
        .ptd-app {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          margin: 0 !important;
          padding: 0 !important;
          gap: 0 !important;
        }

        /* ── Sidebar: full height, no top/bottom gap ── */
        .ptd-sidebar-wrapper {
          flex-shrink: 0;
          height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 0 !important;
        }
        .ptd-sidebar {
          height: 100% !important;
          min-height: 100vh !important;
          display: flex;
          flex-direction: column;
          margin: 0 !important;
          border-radius: 0 !important;
          border: none !important;
          border-right: 1px solid var(--ptd-border, #E8EAF0) !important;
        }

        /* ── Main area ── */
        .ptd-main-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          min-width: 0;
        }

        /* ── Header: full width, no side gaps ── */
        .ptd-header {
          flex-shrink: 0;
          width: 100% !important;
          margin: 0 !important;
          border-radius: 0 !important;
          /* Remove any left/right margin that creates side gaps */
          left: 0 !important;
          right: 0 !important;
        }

        /* ── Scrollable content ── */
        .ptd-main-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }
      `}</style>

      <div className="ptd-app">
        <Sidebar />
        <div className="ptd-main-wrapper">
          <Header />
          <div className="ptd-main-content">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;